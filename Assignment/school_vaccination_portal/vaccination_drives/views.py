from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date, timedelta
from django.db.models import Count
from django.db import transaction
from .models import Vaccine, VaccinationDrive, StudentVaccination
from .serializers import VaccineSerializer, VaccinationDriveSerializer, StudentVaccinationSerializer
from students.models import Student
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework import status


class VaccineViewSet(viewsets.ModelViewSet):
    queryset = Vaccine.objects.all()
    serializer_class = VaccineSerializer

class VaccinationDriveViewSet(viewsets.ModelViewSet):
    queryset = VaccinationDrive.objects.all()
    serializer_class = VaccinationDriveSerializer
    
    def get_queryset(self):
        queryset = VaccinationDrive.objects.all()
        
        # Get upcoming drives only
        upcoming = self.request.query_params.get('upcoming')
        if upcoming == 'true':
            queryset = queryset.filter(date__gte=date.today())
            
        # Get upcoming drives within next 30 days
        next_month = self.request.query_params.get('next_month')
        if next_month == 'true':
            thirty_days_later = date.today() + timedelta(days=30)
            queryset = queryset.filter(
                date__gte=date.today(),
                date__lte=thirty_days_later
            )
        
        return queryset
    
    def perform_create(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            # Convert Django ValidationError to DRF ValidationError
            if hasattr(e, 'message_dict'):
                raise DRFValidationError(e.message_dict)
            else:
                raise DRFValidationError({'date': e.messages})
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Don't allow editing past drives
        if instance.is_past:
            return Response(
                {"error": "Cannot edit past vaccination drives"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            return super().update(request, *args, **kwargs)
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                raise DRFValidationError(e.message_dict)
            else:
                raise DRFValidationError({'date': e.messages})
    
    @action(detail=True, methods=['post'])
    def mark_students(self, request, pk=None):
        drive = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        if drive.is_past:
            return Response(
                {"error": "Cannot add students to past vaccination drives"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                vaccinations_created = 0
                errors = []
                
                for student_id in student_ids:
                    try:
                        student = Student.objects.get(id=student_id)
                        
                        # Check if student already vaccinated with this vaccine
                        if StudentVaccination.objects.filter(
                            student=student,
                            vaccination_drive__vaccine=drive.vaccine
                        ).exists():
                            errors.append(f"Student {student.full_name} already vaccinated with {drive.vaccine.name}")
                            continue
                        
                        # Check if enough doses are available
                        current_count = StudentVaccination.objects.filter(vaccination_drive=drive).count()
                        if current_count >= drive.doses_available:
                            errors.append("No more doses available for this drive")
                            break
                            
                        StudentVaccination.objects.create(
                            student=student,
                            vaccination_drive=drive,
                            date_administered=date.today()
                        )
                        vaccinations_created += 1
                            
                    except Student.DoesNotExist:
                        errors.append(f"Student with ID {student_id} not found")
                    except Exception as e:
                        errors.append(str(e))
                
                return Response({
                    'message': f'Successfully vaccinated {vaccinations_created} students',
                    'errors': errors
                })
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentVaccinationViewSet(viewsets.ModelViewSet):
    queryset = StudentVaccination.objects.all()
    serializer_class = StudentVaccinationSerializer
    
    def get_queryset(self):
        queryset = StudentVaccination.objects.all()
        
        student_id = self.request.query_params.get('student_id')
        vaccine_id = self.request.query_params.get('vaccine_id')
        drive_id = self.request.query_params.get('drive_id')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
            
        if vaccine_id:
            queryset = queryset.filter(vaccination_drive__vaccine_id=vaccine_id)
            
        if drive_id:
            queryset = queryset.filter(vaccination_drive_id=drive_id)
            
        return queryset
    
    def perform_create(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as e:
            # Convert Django ValidationError to DRF ValidationError
            if hasattr(e, 'message_dict'):
                raise DRFValidationError(e.message_dict)
            else:
                error_message = e.messages[0] if hasattr(e, 'messages') and e.messages else str(e)
                raise DRFValidationError({'non_field_errors': [error_message]})
    
    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except DjangoValidationError as e:
            if hasattr(e, 'message_dict'):
                raise DRFValidationError(e.message_dict)
            else:
                error_message = e.messages[0] if hasattr(e, 'messages') and e.messages else str(e)
                raise DRFValidationError({'non_field_errors': [error_message]})
 
    @action(detail=False, methods=['post'])
    def check_eligibility(self, request):
        """
        Check if students are eligible for vaccination.
        Expected request data: { student_ids: [1, 2, 3...], drive_id: 1 }
        """
        student_ids = request.data.get('student_ids', [])
        drive_id = request.data.get('drive_id')
        
        if not drive_id:
            return Response(
                {"error": "Drive ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            drive = VaccinationDrive.objects.get(id=drive_id)
        except VaccinationDrive.DoesNotExist:
            return Response(
                {"error": "Vaccination drive not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if drive has enough doses left
        used_doses = StudentVaccination.objects.filter(vaccination_drive=drive).count()
        remaining_doses = drive.doses_available - used_doses
        
        if remaining_doses <= 0:
            return Response(
                {"error": "No more doses available for this vaccination drive"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if len(student_ids) > remaining_doses:
            return Response(
                {"error": f"Cannot vaccinate {len(student_ids)} students. Only {remaining_doses} doses available."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check grade eligibility
        grade_range = drive.applicable_grades
        if '-' in grade_range:
            min_grade, max_grade = map(int, grade_range.split('-'))
        else:
            min_grade = max_grade = int(grade_range)
        
        # Get vaccine for this drive
        vaccine = drive.vaccine
        
        from students.models import Student
        
        eligibility_results = []
        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id)
                student_grade = int(student.grade)
                
                # Check grade eligibility
                grade_eligible = min_grade <= student_grade <= max_grade
                
                # Check if already vaccinated with this vaccine
                already_vaccinated = StudentVaccination.objects.filter(
                    student=student,
                    vaccination_drive__vaccine=vaccine
                ).exists()
                
                eligibility_results.append({
                    'student_id': student_id,
                    'student_name': student.full_name,
                    'eligible': grade_eligible and not already_vaccinated,
                    'reason': None if (grade_eligible and not already_vaccinated) else 
                             "Already vaccinated with this vaccine" if already_vaccinated else
                             f"Not in applicable grades ({grade_range})"
                })
                
            except Student.DoesNotExist:
                eligibility_results.append({
                    'student_id': student_id,
                    'student_name': None,
                    'eligible': False,
                    'reason': "Student not found"
                })
        
        return Response({
            'drive_id': drive_id,
            'vaccine_name': vaccine.name,
            'remaining_doses': remaining_doses,
            'students': eligibility_results
        })
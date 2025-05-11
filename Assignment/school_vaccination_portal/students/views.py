from django.db import models  
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import csv
import io
from .models import Student
from .serializers import StudentSerializer, StudentDetailSerializer, StudentListSerializer
from school_vaccination_portal.utils import generate_students_csv, generate_students_template_csv

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        elif self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer
    
    def get_queryset(self):
        queryset = Student.objects.all()
        
        # Filtering options
        name = self.request.query_params.get('name')
        grade = self.request.query_params.get('grade')
        student_id = self.request.query_params.get('student_id')
        vaccination_status = self.request.query_params.get('vaccination_status')
        vaccine_id = self.request.query_params.get('vaccine_id')
        
        if name:
            queryset = queryset.filter(
                models.Q(first_name__icontains=name) | 
                models.Q(last_name__icontains=name)
            )
        
        if grade:
            queryset = queryset.filter(grade=grade)
            
        if student_id:
            queryset = queryset.filter(student_id__icontains=student_id)
            
        if vaccination_status and vaccine_id:
            from vaccination_drives.models import StudentVaccination, Vaccine
            try:
                vaccine = Vaccine.objects.get(id=vaccine_id)
                vaccinated_student_ids = StudentVaccination.objects.filter(
                    vaccination_drive__vaccine=vaccine
                ).values_list('student_id', flat=True)
                
                if vaccination_status.lower() == 'yes':
                    queryset = queryset.filter(id__in=vaccinated_student_ids)
                elif vaccination_status.lower() == 'no':
                    queryset = queryset.exclude(id__in=vaccinated_student_ids)
            except Vaccine.DoesNotExist:
                pass
                
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        csv_file = request.FILES.get('file')
        
        if not csv_file or not csv_file.name.endswith('.csv'):
            return Response({'error': 'Please upload a CSV file'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Decode the file with a more robust approach
            try:
                decoded_file = csv_file.read().decode('utf-8')
            except UnicodeDecodeError:
                # Try different encoding if utf-8 fails
                decoded_file = csv_file.read().decode('latin-1')
            
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            # Check if required columns are present
            required_fields = ['first_name', 'last_name', 'student_id', 'date_of_birth', 'grade', 'section']
            header = reader.fieldnames
            
            if not header or not all(field in header for field in required_fields):
                missing = [field for field in required_fields if field not in (header or [])]
                return Response({
                    'error': f'CSV file is missing required columns: {", ".join(missing)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process the CSV data
            students_created = 0
            errors = []
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 to account for header row
                try:
                    # Check if student ID already exists
                    if Student.objects.filter(student_id=row.get('student_id')).exists():
                        errors.append(f"Row {row_num}: Student with ID {row.get('student_id')} already exists")
                        continue
                    
                    # Validate date format
                    try:
                        date_of_birth = datetime.strptime(row.get('date_of_birth', ''), '%Y-%m-%d').date()
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid date format for {row.get('student_id')}. Use YYYY-MM-DD")
                        continue
                    
                    # Create the student
                    Student.objects.create(
                        first_name=row.get('first_name'),
                        last_name=row.get('last_name'),
                        student_id=row.get('student_id'),
                        date_of_birth=date_of_birth,
                        grade=row.get('grade'),
                        section=row.get('section')
                    )
                    students_created += 1
                except Exception as e:
                    errors.append(f"Row {row_num}: Error with student {row.get('student_id', 'unknown')}: {str(e)}")
            
            # Return appropriate response
            if students_created > 0:
                return Response({
                    'message': f'Successfully imported {students_created} students',
                    'errors': errors
                })
            else:
                return Response({
                    'error': 'No students were imported',
                    'details': errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export all students data as CSV
        """
        include_vaccination = request.query_params.get('include_vaccination', 'true').lower() == 'true'
        return generate_students_csv(include_vaccination_status=include_vaccination)
    
    @action(detail=False, methods=['get'])
    def template(self, request):
        """
        Download a CSV template for bulk student import
        """
        return generate_students_template_csv()
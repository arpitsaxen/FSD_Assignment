from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count
from students.models import Student
from vaccination_drives.models import Vaccine, VaccinationDrive, StudentVaccination
import csv
from django.http import HttpResponse

class ReportViewSet(ViewSet):
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        # Get total students count
        total_students = Student.objects.count()
        
        # Get total vaccinated students (at least one vaccination)
        vaccinated_students = StudentVaccination.objects.values('student').distinct().count()
        
        # Get upcoming vaccination drives
        from datetime import date, timedelta
        thirty_days_later = date.today() + timedelta(days=30)
        upcoming_drives = VaccinationDrive.objects.filter(
            date__gte=date.today(),
            date__lte=thirty_days_later
        ).count()
        
        # Calculate vaccination percentage
        vaccination_percentage = 0
        if total_students > 0:
            vaccination_percentage = (vaccinated_students / total_students) * 100
        
        return Response({
            'total_students': total_students,
            'vaccinated_students': vaccinated_students,
            'vaccination_percentage': round(vaccination_percentage, 2),
            'upcoming_drives': upcoming_drives
        })
    
    @action(detail=False, methods=['get'])
    def vaccination_report(self, request):
        # Filter parameters
        vaccine_id = request.query_params.get('vaccine_id')
        grade = request.query_params.get('grade')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Start with all vaccinations
        query = StudentVaccination.objects.all()
        
        # Apply filters
        if vaccine_id:
            query = query.filter(vaccination_drive__vaccine_id=vaccine_id)
        
        if grade:
            query = query.filter(student__grade=grade)
            
        if start_date:
            query = query.filter(date_administered__gte=start_date)
            
        if end_date:
            query = query.filter(date_administered__lte=end_date)
            
        # Format for API response
        vaccinations = query.select_related('student', 'vaccination_drive__vaccine')
        
        # Check if CSV export is requested
        format_type = request.query_params.get('format')
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="vaccination_report.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Student ID', 'Student Name', 'Grade', 'Section', 
                'Vaccine', 'Date Administered', 'Notes'
            ])
            
            for v in vaccinations:
                writer.writerow([
                    v.student.student_id,
                    v.student.full_name,
                    v.student.grade,
                    v.student.section,
                    v.vaccination_drive.vaccine.name,
                    v.date_administered,
                    v.notes
                ])
                
            return response
        
        # Return paginated JSON response
        data = [{
            'id': v.id,
            'student_id': v.student.student_id,
            'student_name': v.student.full_name,
            'grade': v.student.grade,
            'section': v.student.section,
            'vaccine_name': v.vaccination_drive.vaccine.name,
            'date_administered': v.date_administered,
            'notes': v.notes
        } for v in vaccinations]
        
        return Response(data)
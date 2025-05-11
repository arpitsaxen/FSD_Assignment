# school_vaccination_portal/utils.py

import csv
import io
from django.http import HttpResponse
from students.models import Student
from vaccination_drives.models import StudentVaccination

def generate_students_csv(include_vaccination_status=True):
    """
    Generate a CSV file containing all student data.
    
    Args:
        include_vaccination_status (bool): Whether to include vaccination status columns
        
    Returns:
        HttpResponse: A response with the CSV file attached
    """
    # Create a file-like buffer to receive CSV data
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    
    # Define column headers
    headers = [
        'Student ID', 
        'First Name', 
        'Last Name', 
        'Date of Birth', 
        'Grade', 
        'Section'
    ]
    
    if include_vaccination_status:
        headers.extend(['Vaccination Status', 'Vaccines Received', 'Last Vaccination Date'])
    
    # Write header row
    writer.writerow(headers)
    
    # Fetch all students (with prefetch for vaccination data if needed)
    if include_vaccination_status:
        students = Student.objects.prefetch_related('studentvaccination_set__vaccination_drive__vaccine').all()
    else:
        students = Student.objects.all()
    
    # Write data rows
    for student in students:
        # Basic student data
        row = [
            student.student_id,
            student.first_name,
            student.last_name,
            student.date_of_birth.strftime('%Y-%m-%d') if student.date_of_birth else '',
            student.grade,
            student.section
        ]
        
        # Add vaccination data if requested
        if include_vaccination_status:
            # Get all vaccinations for this student
            vaccinations = StudentVaccination.objects.filter(student=student).select_related('vaccination_drive__vaccine')
            
            if vaccinations.exists():
                # Get list of vaccine names
                vaccine_names = [v.vaccination_drive.vaccine.name for v in vaccinations]
                
                # Get the latest vaccination date
                latest_date = max([v.date_administered for v in vaccinations])
                
                row.extend([
                    'Vaccinated',
                    ', '.join(vaccine_names),
                    latest_date.strftime('%Y-%m-%d')
                ])
            else:
                row.extend(['Not Vaccinated', '', ''])
        
        writer.writerow(row)
    
    # Create the HTTP response with CSV content
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="students.csv"'
    
    return response


def generate_students_template_csv():
    """
    Generate a CSV template for bulk importing students.
    
    Returns:
        HttpResponse: A response with the CSV template file attached
    """
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    
    # Define column headers matching the required fields for bulk import
    headers = [
        'first_name', 
        'last_name', 
        'student_id',
        'date_of_birth',
        'grade', 
        'section'
    ]
    
    # Write header row
    writer.writerow(headers)
    
    # Add a sample row to demonstrate format
    sample_row = [
        'John',
        'Doe',
        'ST001',
        '2015-01-15',
        '5',
        'A'
    ]
    writer.writerow(sample_row)
    
    # Create the HTTP response with CSV content
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="students_template.csv"'
    
    return response
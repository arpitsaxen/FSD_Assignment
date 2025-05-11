# students/management/commands/generate_sample_students.py

from django.core.management.base import BaseCommand
from students.models import Student
from datetime import date, timedelta
import random
import string

class Command(BaseCommand):
    help = 'Generate sample student data for grades 5-12'

    def add_arguments(self, parser):
        parser.add_argument('--per_grade', type=int, default=100, 
                            help='Number of students to generate per grade (default: 100)')
        parser.add_argument('--clear', action='store_true', 
                            help='Clear existing students before generating new ones')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing student data...')
            Student.objects.all().delete()
        
        per_grade = options['per_grade']
        
        # First names pool
        first_names = [
            'Aarav', 'Advait', 'Arjun', 'Arnav', 'Atharv', 'Ayaan', 'Dhruv', 'Ishaan', 'Kabir', 'Krish',
            'Madhav', 'Om', 'Pranav', 'Reyansh', 'Rohan', 'Samar', 'Shaurya', 'Vihaan', 'Vivaan', 'Yash',
            'Aanya', 'Anika', 'Anvi', 'Diya', 'Ishita', 'Kiara', 'Kavya', 'Manya', 'Myra', 'Nisha',
            'Pari', 'Riya', 'Saanvi', 'Sara', 'Siya', 'Tanvi', 'Trisha', 'Vanya', 'Zara', 'Aadhya',
            'Ananya', 'Avni', 'Aditi', 'Anaya', 'Aria', 'Eva', 'Ira', 'Kyra', 'Meera', 'Nyra'
        ]
        
        # Last names pool
        last_names = [
            'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Rao', 'Joshi', 'Agarwal', 'Gupta', 'Shah',
            'Mehta', 'Reddy', 'Nair', 'Pillai', 'Das', 'Bose', 'Banerjee', 'Mukherjee', 'Chatterjee', 'Sen',
            'Choudhury', 'Yadav', 'Patil', 'Deshmukh', 'Iyer', 'Iyengar', 'Kaur', 'Malhotra', 'Kapoor', 'Khanna',
            'Bhatia', 'Chauhan', 'Gill', 'Mehra', 'Ahuja', 'Arora', 'Chawla', 'Chopra', 'Bajwa', 'Bedi'
        ]
        
        # Sections
        sections = ['A', 'B', 'C', 'D']
        
        students_created = 0
        
        # Generate students for each grade
        for grade in range(5, 13):  # 5 to 12
            self.stdout.write(f'Generating students for grade {grade}')
            
            for i in range(per_grade):
                # Generate a random date of birth appropriate for the grade
                # Calculate approximate age based on grade (e.g., Grade 5 ~ 10-11 years old)
                approx_age = 5 + grade
                birth_year = date.today().year - approx_age
                
                # Random DOB within the school year
                start_date = date(birth_year, 1, 1)
                end_date = date(birth_year, 12, 31)
                days_between = (end_date - start_date).days
                random_days = random.randint(0, days_between)
                date_of_birth = start_date + timedelta(days=random_days)
                
                # Generate unique student ID (format: GR<grade><section><3-digit number>)
                section = random.choice(sections)
                student_id = f"GR{grade}{section}{i+1:03d}"
                
                # Create student
                Student.objects.create(
                    first_name=random.choice(first_names),
                    last_name=random.choice(last_names),
                    student_id=student_id,
                    date_of_birth=date_of_birth,
                    grade=str(grade),
                    section=section
                )
                
                students_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {students_created} students'))
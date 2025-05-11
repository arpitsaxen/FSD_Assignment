from rest_framework import serializers
from .models import Vaccine, VaccinationDrive, StudentVaccination
from students.models import Student
from datetime import date

class VaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccine
        fields = '__all__'

class VaccinationDriveSerializer(serializers.ModelSerializer):
    vaccine_name = serializers.ReadOnlyField(source='vaccine.name')
    is_past = serializers.ReadOnlyField()
    doses_used = serializers.SerializerMethodField()
    
    class Meta:
        model = VaccinationDrive
        fields = ['id', 'vaccine', 'vaccine_name', 'date', 'doses_available', 
                  'applicable_grades', 'created_at', 'updated_at', 'is_past', 'doses_used']
    
    def get_doses_used(self, obj):
        return StudentVaccination.objects.filter(vaccination_drive=obj).count()

class StudentVaccinationSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.full_name')
    student_id = serializers.ReadOnlyField(source='student.student_id')
    vaccine_name = serializers.ReadOnlyField(source='vaccination_drive.vaccine.name')
    
    class Meta:
        model = StudentVaccination
        fields = ['id', 'student', 'student_name', 'student_id', 'vaccination_drive', 
                  'vaccine_name', 'date_administered', 'notes']
    
    def validate(self, data):
        """
        Check that the student has not already been vaccinated with this vaccine.
        """
        student = data.get('student')
        vaccination_drive = data.get('vaccination_drive')
        
        if student and vaccination_drive:
            # Check if student already vaccinated with this vaccine in any drive
            vaccine = vaccination_drive.vaccine
            existing_vaccination = StudentVaccination.objects.filter(
                student=student,
                vaccination_drive__vaccine=vaccine
            ).exists()
            
            if existing_vaccination:
                raise serializers.ValidationError(
                    f"Student {student.full_name} has already been vaccinated for {vaccine.name}."
                )
            
            # Check if student is in applicable grades for this drive
            student_grade = int(student.grade)
            applicable_grades = vaccination_drive.applicable_grades
            
            if '-' in applicable_grades:
                min_grade, max_grade = map(int, applicable_grades.split('-'))
                if student_grade < min_grade or student_grade > max_grade:
                    raise serializers.ValidationError(
                        f"Student {student.full_name} is not in the applicable grades ({applicable_grades}) for this drive."
                    )
            else:
                if student_grade != int(applicable_grades):
                    raise serializers.ValidationError(
                        f"Student {student.full_name} is not in the applicable grade ({applicable_grades}) for this drive."
                    )
            
            # Check if drive has enough doses left
            used_doses = StudentVaccination.objects.filter(vaccination_drive=vaccination_drive).count()
            if used_doses >= vaccination_drive.doses_available:
                raise serializers.ValidationError(
                    f"No more doses available for this vaccination drive."
                )
        
        return data
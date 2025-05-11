from rest_framework import serializers
from .models import Student
from vaccination_drives.models import StudentVaccination

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

class VaccinationStatusField(serializers.Field):
    def to_representation(self, value):
        from vaccination_drives.models import StudentVaccination
        
        try:
            # Use select_related to reduce database queries
            vaccinations = StudentVaccination.objects.filter(student=value).select_related(
                'vaccination_drive__vaccine'
            )
            
            if not vaccinations.exists():
                return {
                    'status': 'Not Vaccinated',
                    'count': 0,
                    'vaccines': []
                }
            
            # Get vaccine information
            vaccines = []
            for vacc in vaccinations:
                try:
                    vaccines.append({
                        'id': vacc.id,
                        'vaccine_name': vacc.vaccination_drive.vaccine.name,
                        'date': vacc.date_administered.strftime('%Y-%m-%d')
                    })
                except Exception as e:
                    # Log the error but continue with other vaccinations
                    print(f"Error processing vaccination {vacc.id}: {str(e)}")
            
            return {
                'status': 'Vaccinated',
                'count': len(vaccines),  # Count only successfully processed vaccinations
                'vaccines': vaccines
            }
        except Exception as e:
            # Log the error but return a safe default
            print(f"Error getting vaccination status for student {value.id}: {str(e)}")
            return {
                'status': 'Unknown',
                'count': 0,
                'vaccines': []
            }

class StudentListSerializer(serializers.ModelSerializer):
    vaccination_status = VaccinationStatusField(source='*')
    
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'student_id', 'grade', 'section', 'date_of_birth', 'vaccination_status']

class StudentDetailSerializer(serializers.ModelSerializer):
    vaccination_status = VaccinationStatusField(source='*')
    
    class Meta:
        model = Student
        fields = '__all__'



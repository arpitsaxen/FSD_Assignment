from django.contrib import admin

# Register your models here.
from .models import Vaccine, VaccinationDrive, StudentVaccination

@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(VaccinationDrive)
class VaccinationDriveAdmin(admin.ModelAdmin):
    list_display = ('vaccine', 'date', 'doses_available', 'applicable_grades')
    list_filter = ('vaccine', 'date')
    date_hierarchy = 'date'
    
    # Show related vaccinations inline
    inlines = [
        # Define an inline admin descriptor for StudentVaccination model
        type('StudentVaccinationInline', (admin.TabularInline,), {
            'model': StudentVaccination,
            'extra': 1
        })
    ]

@admin.register(StudentVaccination)
class StudentVaccinationAdmin(admin.ModelAdmin):
    list_display = ('student', 'vaccination_drive', 'date_administered')
    list_filter = ('vaccination_drive__vaccine', 'date_administered')
    search_fields = ('student__first_name', 'student__last_name', 'student__student_id')
    date_hierarchy = 'date_administered'
    
    # Custom method to display vaccine name
    def vaccine_name(self, obj):
        return obj.vaccination_drive.vaccine.name
    vaccine_name.short_description = 'Vaccine'
    
    # Add the custom method to list_display
    list_display = ('student', 'vaccine_name', 'vaccination_drive', 'date_administered')
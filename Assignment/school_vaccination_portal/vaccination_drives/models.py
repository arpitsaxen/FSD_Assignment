from django.db import models
from datetime import date, timedelta
from django.core.exceptions import ValidationError
from django.utils import timezone


class Vaccine(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class VaccinationDrive(models.Model):
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE)
    date = models.DateField()
    doses_available = models.PositiveIntegerField()
    applicable_grades = models.CharField(max_length=100, help_text="E.g., '5-7' for grades 5 to 7")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        # Ensure drive is scheduled at least 15 days in advance
        min_date = date.today() + timedelta(days=15)
        if self.date < min_date:
            raise ValidationError({
                'date': f"Vaccination drives must be scheduled at least 15 days in advance (after {min_date.strftime('%Y-%m-%d')})."
            })
        
        # Check for overlapping drives
        overlapping_drives = VaccinationDrive.objects.filter(
            date=self.date,
            vaccine=self.vaccine
        ).exclude(id=self.id)
        
        if overlapping_drives.exists():
            raise ValidationError({
                'date': f"A drive for {self.vaccine.name} already exists on this date."
            })
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_past(self):
        return self.date < date.today()
    
    def __str__(self):
        return f"{self.vaccine.name} Drive on {self.date}"

class StudentVaccination(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    vaccination_drive = models.ForeignKey(VaccinationDrive, on_delete=models.CASCADE)
    date_administered = models.DateField(default=date.today)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('student', 'vaccination_drive')
        
    def clean(self):
        if not self.student or not self.vaccination_drive:
            return  # Skip validation if student or vaccination_drive is not set
            
        # Ensure a student is not vaccinated twice for the same vaccine
        existing_vaccinations = StudentVaccination.objects.filter(
            student=self.student,
            vaccination_drive__vaccine=self.vaccination_drive.vaccine
        ).exclude(id=self.id).exists()
        
        if existing_vaccinations:
            raise ValidationError(
                f"Student {self.student.full_name} has already been vaccinated for {self.vaccination_drive.vaccine.name}."
            )
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.full_name} - {self.vaccination_drive.vaccine.name}"
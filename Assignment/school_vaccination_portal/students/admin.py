from django.contrib import admin
from .models import Student
# Register your models here.

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    # Display these fields in the list view
    list_display = ('student_id', 'first_name', 'last_name', 'grade', 'section', 'date_of_birth')
    
    # Allow searching by these fields
    search_fields = ('student_id', 'first_name', 'last_name')
    
    # Add filters on the right side
    list_filter = ('grade', 'section')
    
    # Group fields into fieldsets in the detail view
    fieldsets = (
        ('Basic Information', {
            'fields': ('first_name', 'last_name', 'student_id', 'date_of_birth')
        }),
        ('Class Details', {
            'fields': ('grade', 'section')
        }),
    )
    
    # Order by these fields by default
    ordering = ('grade', 'section', 'last_name', 'first_name')
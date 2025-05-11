from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User  # Your custom user model

@admin.register(User)
class CoordinatorUserAdmin(UserAdmin):
    # Add is_coordinator to list_display
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_coordinator', 'is_staff', 'is_active')
    
    # Add is_coordinator to list_filter
    list_filter = ('is_coordinator', 'is_staff', 'is_active', 'groups')
    
    # Customize fieldsets to include coordinator-specific fields
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Coordinator info'), {'fields': ('is_coordinator',)}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # Customize add form fieldsets
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'is_coordinator'),
        }),
    )
    
    # Search fields
    search_fields = ('username', 'first_name', 'last_name', 'email')
    
    # Ordering
    ordering = ('username',)
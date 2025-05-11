from django.core.management.base import BaseCommand
from authentication.models import User
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Create an admin user if none exists'

    def handle(self, *args, **options):
        if User.objects.filter(is_superuser=True).count() == 0:
            username = os.environ.get('ADMIN_USERNAME', 'admin')
            email = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
            password = os.environ.get('ADMIN_PASSWORD', 'admin')
            
            self.stdout.write(self.style.SUCCESS('Creating admin user...'))
            
            admin = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                is_coordinator=True
            )
            
            self.stdout.write(self.style.SUCCESS(f'Admin user created with username: {username}'))
        else:
            self.stdout.write(self.style.SUCCESS('Admin user already exists'))
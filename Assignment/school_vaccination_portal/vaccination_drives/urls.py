# vaccination_drives/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VaccineViewSet, VaccinationDriveViewSet, StudentVaccinationViewSet

router = DefaultRouter()
router.register(r'vaccines', VaccineViewSet)
router.register(r'drives', VaccinationDriveViewSet)
router.register(r'vaccinations', StudentVaccinationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

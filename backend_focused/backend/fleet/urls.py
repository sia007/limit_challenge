from rest_framework.routers import DefaultRouter

from fleet import views

router = DefaultRouter()
router.register("offices", views.OfficeViewSet, basename="office")
router.register("vehicles", views.VehicleViewSet, basename="vehicle")
router.register("mechanics", views.MechanicViewSet, basename="mechanic")
router.register(
    "maintenance-records", views.MaintenanceRecordViewSet, basename="maintenancerecord"
)

urlpatterns = router.urls

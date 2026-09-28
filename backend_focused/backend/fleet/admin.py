from django.contrib import admin

from fleet import models


@admin.register(models.Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ["name", "city"]
    search_fields = ["name", "city"]


@admin.register(models.Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ["vin", "license_plate", "make", "model", "year", "office", "active"]
    list_filter = ["active", "make", "office"]
    search_fields = ["vin", "license_plate", "make", "model"]


@admin.register(models.Mechanic)
class MechanicAdmin(admin.ModelAdmin):
    list_display = ["name", "certification_number", "active"]
    search_fields = ["name", "certification_number"]


@admin.register(models.MaintenanceRecord)
class MaintenanceRecordAdmin(admin.ModelAdmin):
    list_display = ["vehicle", "mechanic", "maintenance_date", "maintenance_type", "cost"]
    list_filter = ["maintenance_type"]
    search_fields = ["vehicle__vin", "mechanic__name"]

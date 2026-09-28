from django.core.validators import MinValueValidator
from django.db import models

from fleet.validators import validate_vehicle_year


class Office(models.Model):
    """A physical office / depot that vehicles are assigned to."""

    name = models.CharField(max_length=255)
    city = models.CharField(max_length=255)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return f"{self.name} ({self.city})"


class Vehicle(models.Model):
    """A vehicle owned by the company and assigned to a single office."""

    vin = models.CharField(
        "VIN",
        max_length=17,
        unique=True,
        help_text="Vehicle Identification Number. Must be unique across all vehicles.",
    )
    license_plate = models.CharField(max_length=20)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField(
        validators=[validate_vehicle_year],
        help_text="Model year. Must be 1900 or later, and no more than one year ahead of today.",
    )
    office = models.ForeignKey(
        Office,
        on_delete=models.PROTECT,
        related_name="vehicles",
        help_text="Office the vehicle is currently assigned to.",
    )
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["make", "model", "vin"]
        constraints = [
            # A license plate may be reused once a vehicle carrying it has
            # been retired (active=False), but two *active* vehicles may
            # never share one.
            models.UniqueConstraint(
                fields=["license_plate"],
                condition=models.Q(active=True),
                name="unique_active_license_plate",
            )
        ]

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return f"{self.vin} ({self.make} {self.model})"


class Mechanic(models.Model):
    """A mechanic who can perform maintenance on vehicles."""

    name = models.CharField(max_length=255)
    certification_number = models.CharField(max_length=50, unique=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return self.name


class MaintenanceRecord(models.Model):
    """A single maintenance event performed on a vehicle by a mechanic."""

    class MaintenanceType(models.TextChoices):
        OIL_CHANGE = "oil_change", "Oil Change"
        TIRE_ROTATION = "tire_rotation", "Tire Rotation"
        TIRE_REPLACEMENT = "tire_replacement", "Tire Replacement"
        BRAKE_SERVICE = "brake_service", "Brake Service"
        BATTERY_REPLACEMENT = "battery_replacement", "Battery Replacement"
        INSPECTION = "inspection", "Inspection"
        ENGINE_REPAIR = "engine_repair", "Engine Repair"
        TRANSMISSION_SERVICE = "transmission_service", "Transmission Service"
        BODY_REPAIR = "body_repair", "Body Repair"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name="maintenance_records"
    )
    mechanic = models.ForeignKey(
        Mechanic, on_delete=models.PROTECT, related_name="maintenance_records"
    )
    maintenance_date = models.DateField()
    maintenance_type = models.CharField(
        max_length=32, choices=MaintenanceType.choices
    )
    cost = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-maintenance_date", "-id"]

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return f"{self.vehicle.vin} - {self.maintenance_date} ({self.maintenance_type})"

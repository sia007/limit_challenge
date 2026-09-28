import django.core.validators
import django.db.models.deletion
import fleet.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Office",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("city", models.CharField(max_length=255)),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Mechanic",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("certification_number", models.CharField(max_length=50, unique=True)),
                ("active", models.BooleanField(default=True)),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="Vehicle",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "vin",
                    models.CharField(
                        help_text="Vehicle Identification Number. Must be unique across all vehicles.",
                        max_length=17,
                        unique=True,
                        verbose_name="VIN",
                    ),
                ),
                ("license_plate", models.CharField(max_length=20)),
                ("make", models.CharField(max_length=100)),
                ("model", models.CharField(max_length=100)),
                (
                    "year",
                    models.PositiveIntegerField(
                        help_text="Model year. Must be 1900 or later, and no more than one year ahead of today.",
                        validators=[fleet.validators.validate_vehicle_year],
                    ),
                ),
                ("active", models.BooleanField(default=True)),
                (
                    "office",
                    models.ForeignKey(
                        help_text="Office the vehicle is currently assigned to.",
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="vehicles",
                        to="fleet.office",
                    ),
                ),
            ],
            options={
                "ordering": ["make", "model", "vin"],
            },
        ),
        migrations.CreateModel(
            name="MaintenanceRecord",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("maintenance_date", models.DateField()),
                (
                    "maintenance_type",
                    models.CharField(
                        choices=[
                            ("oil_change", "Oil Change"),
                            ("tire_rotation", "Tire Rotation"),
                            ("tire_replacement", "Tire Replacement"),
                            ("brake_service", "Brake Service"),
                            ("battery_replacement", "Battery Replacement"),
                            ("inspection", "Inspection"),
                            ("engine_repair", "Engine Repair"),
                            ("transmission_service", "Transmission Service"),
                            ("body_repair", "Body Repair"),
                            ("other", "Other"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "cost",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                ("notes", models.TextField(blank=True)),
                (
                    "mechanic",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="maintenance_records",
                        to="fleet.mechanic",
                    ),
                ),
                (
                    "vehicle",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="maintenance_records",
                        to="fleet.vehicle",
                    ),
                ),
            ],
            options={
                "ordering": ["-maintenance_date", "-id"],
            },
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(
                condition=models.Q(("active", True)),
                fields=("license_plate",),
                name="unique_active_license_plate",
            ),
        ),
    ]

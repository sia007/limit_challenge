from datetime import timedelta
from decimal import Decimal
from random import choice, randint, uniform

from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from fleet import models

VEHICLE_MAKES_MODELS = [
    ("Ford", "Transit"),
    ("Ford", "F-150"),
    ("Chevrolet", "Silverado"),
    ("Toyota", "Camry"),
    ("Toyota", "Corolla"),
    ("Honda", "CR-V"),
    ("Nissan", "Altima"),
    ("Ram", "1500"),
    ("Freightliner", "Cascadia"),
    ("Mercedes-Benz", "Sprinter"),
]


class Command(BaseCommand):
    help = "Seed a small dataset for the Fleet Maintenance API challenge"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Clear existing fleet data before seeding",
        )
        parser.add_argument(
            "--offices", type=int, default=6, help="Number of offices to create"
        )
        parser.add_argument(
            "--vehicles", type=int, default=60, help="Number of vehicles to create"
        )
        parser.add_argument(
            "--mechanics", type=int, default=10, help="Number of mechanics to create"
        )

    def handle(self, *args, **options):
        if models.Vehicle.objects.exists() or models.Office.objects.exists():
            if not options["force"]:
                self.stdout.write(
                    self.style.WARNING(
                        "Fleet data already exists; rerun with --force to rebuild seed data."
                    )
                )
                return
            self.stdout.write("Clearing existing fleet data...")
            models.MaintenanceRecord.objects.all().delete()
            models.Vehicle.objects.all().delete()
            models.Mechanic.objects.all().delete()
            models.Office.objects.all().delete()

        fake = Faker()
        Faker.seed(0)
        now = timezone.now().date()

        # --- Offices ---------------------------------------------------
        offices = [
            models.Office.objects.create(name=f"{city} Office", city=city)
            for city in (fake.unique.city() for _ in range(options["offices"]))
        ]

        # --- Mechanics ---------------------------------------------------
        mechanics = [
            models.Mechanic.objects.create(
                name=fake.unique.name(),
                certification_number=f"CERT-{fake.unique.random_number(digits=6, fix_len=True)}",
                active=choice([True, True, True, False]),
            )
            for _ in range(options["mechanics"])
        ]

        # --- Vehicles ------------------------------------------------------
        vehicles = []
        for _ in range(options["vehicles"]):
            make, model = choice(VEHICLE_MAKES_MODELS)
            vehicles.append(
                models.Vehicle.objects.create(
                    vin=fake.unique.bothify(text="?" * 3 + "#" * 14).upper(),
                    license_plate=fake.unique.bothify(text="???-####").upper(),
                    make=make,
                    model=model,
                    year=randint(now.year - 12, now.year),
                    office=choice(offices),
                    active=choice([True, True, True, True, False]),
                )
            )

        # --- Maintenance records --------------------------------------
        maintenance_types = [value for value, _ in models.MaintenanceRecord.MaintenanceType.choices]
        records = []
        for vehicle in vehicles:
            # Roughly 15% of vehicles have never been serviced, so the
            # "vehicles needing maintenance" endpoint has data to show.
            if uniform(0, 1) < 0.15:
                continue
            for _ in range(randint(1, 8)):
                days_ago = randint(0, 900)
                records.append(
                    models.MaintenanceRecord(
                        vehicle=vehicle,
                        mechanic=choice(mechanics),
                        maintenance_date=now - timedelta(days=days_ago),
                        maintenance_type=choice(maintenance_types),
                        cost=Decimal(str(round(uniform(35, 1800), 2))),
                        notes=fake.sentence(nb_words=10),
                    )
                )
        models.MaintenanceRecord.objects.bulk_create(records)

        # One vehicle gets a large maintenance history so it's easy to
        # manually verify the vehicle-detail endpoint stays fast/query
        # efficient with hundreds of records.
        heavy_vehicle = vehicles[0]
        heavy_records = [
            models.MaintenanceRecord(
                vehicle=heavy_vehicle,
                mechanic=choice(mechanics),
                maintenance_date=now - timedelta(days=randint(0, 3650)),
                maintenance_type=choice(maintenance_types),
                cost=Decimal(str(round(uniform(35, 1800), 2))),
                notes=fake.sentence(nb_words=10),
            )
            for _ in range(300)
        ]
        models.MaintenanceRecord.objects.bulk_create(heavy_records)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed data created: {len(offices)} offices, {len(mechanics)} mechanics, "
                f"{len(vehicles)} vehicles, {len(records) + len(heavy_records)} maintenance records "
                f"(vehicle {heavy_vehicle.vin} has {len(heavy_records)} records for perf testing)."
            )
        )

from datetime import date, timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from fleet import models


def make_office(name="Main Office", city="Springfield"):
    return models.Office.objects.create(name=name, city=city)


def make_mechanic(name="Homer", cert="CERT-001"):
    return models.Mechanic.objects.create(name=name, certification_number=cert)


def make_vehicle(office, vin="1HGCM82633A004352", plate="ABC-123", active=True, **kwargs):
    defaults = dict(
        vin=vin,
        license_plate=plate,
        make="Toyota",
        model="Camry",
        year=2020,
        office=office,
        active=active,
    )
    defaults.update(kwargs)
    return models.Vehicle.objects.create(**defaults)


class VehicleModelTests(APITestCase):
    def setUp(self):
        self.office = make_office()

    def test_vin_must_be_unique(self):
        make_vehicle(self.office, vin="SAMEVIN000000001", plate="AAA-111")
        with self.assertRaises(Exception):
            make_vehicle(self.office, vin="SAMEVIN000000001", plate="BBB-222")

    def test_license_plate_can_repeat_across_inactive_vehicles(self):
        make_vehicle(self.office, vin="VIN0000000000001", plate="SHARED-1", active=False)
        # Should not raise: the first vehicle carrying the plate is inactive.
        make_vehicle(self.office, vin="VIN0000000000002", plate="SHARED-1", active=True)

    def test_license_plate_cannot_repeat_across_active_vehicles(self):
        make_vehicle(self.office, vin="VIN0000000000003", plate="SHARED-2", active=True)
        with self.assertRaises(Exception):
            make_vehicle(self.office, vin="VIN0000000000004", plate="SHARED-2", active=True)


class VehicleApiTests(APITestCase):
    def setUp(self):
        self.office_a = make_office("Office A", "Austin")
        self.office_b = make_office("Office B", "Boston")
        self.mechanic = make_mechanic()
        self.vehicle = make_vehicle(self.office_a)

    def test_create_vehicle_via_api(self):
        url = reverse("vehicle-list")
        response = self.client.post(
            url,
            {
                "vin": "NEWVIN0000000001",
                "licensePlate": "NEW-001",
                "make": "Honda",
                "model": "Civic",
                "year": 2022,
                "office": self.office_a.id,
                "active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_create_vehicle_rejects_duplicate_active_plate(self):
        url = reverse("vehicle-list")
        response = self.client.post(
            url,
            {
                "vin": "NEWVIN0000000002",
                "licensePlate": self.vehicle.license_plate,
                "make": "Honda",
                "model": "Civic",
                "year": 2022,
                "office": self.office_a.id,
                "active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vehicle_search_filters_by_office_and_active(self):
        make_vehicle(self.office_b, vin="VINOFFICEB000001", plate="OFFB-1")
        url = reverse("vehicle-list")

        response = self.client.get(url, {"office": self.office_a.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        vins = [item["vin"] for item in response.data["results"]]
        self.assertIn(self.vehicle.vin, vins)
        self.assertNotIn("VINOFFICEB000001", vins)

    def test_vehicle_search_by_mechanic_certification_number(self):
        other_vehicle = make_vehicle(self.office_a, vin="VINOTHER00000001", plate="OTH-1")
        models.MaintenanceRecord.objects.create(
            vehicle=other_vehicle,
            mechanic=self.mechanic,
            maintenance_date=date.today(),
            maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
            cost=Decimal("50.00"),
        )
        url = reverse("vehicle-list")
        # NOTE: query string keys are NOT camelCased by
        # djangorestframework-camel-case (it only rewrites JSON request
        # bodies and responses), so filters stay snake_case.
        response = self.client.get(
            url, {"mechanic_certification_number": self.mechanic.certification_number}
        )
        vins = [item["vin"] for item in response.data["results"]]
        self.assertEqual(vins, [other_vehicle.vin])

    def test_vehicle_detail_includes_office_and_maintenance_history(self):
        models.MaintenanceRecord.objects.create(
            vehicle=self.vehicle,
            mechanic=self.mechanic,
            maintenance_date=date.today(),
            maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
            cost=Decimal("75.00"),
        )
        url = reverse("vehicle-detail", args=[self.vehicle.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["office"]["id"], self.office_a.id)
        self.assertEqual(len(response.data["maintenance_records"]), 1)
        self.assertEqual(
            response.data["maintenance_records"][0]["mechanic"]["name"], self.mechanic.name
        )

    def test_vehicle_detail_query_count_is_constant_regardless_of_history_size(self):
        for i in range(50):
            models.MaintenanceRecord.objects.create(
                vehicle=self.vehicle,
                mechanic=self.mechanic,
                maintenance_date=date.today() - timedelta(days=i),
                maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
                cost=Decimal("10.00"),
            )
        url = reverse("vehicle-detail", args=[self.vehicle.id])
        # Vehicle + office (1 query) and maintenance records + mechanics
        # (1 query) - should never scale with the number of records.
        with self.assertNumQueries(2):
            response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["maintenance_records"]), 50)

    def test_assign_vehicle_moves_it_to_new_office(self):
        url = reverse("vehicle-assign", args=[self.vehicle.id])
        response = self.client.post(url, {"office": self.office_b.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.office_id, self.office_b.id)

    def test_check_duplicate_reports_conflicting_fields(self):
        url = reverse("vehicle-check-duplicate")
        response = self.client.post(
            url,
            {"vin": self.vehicle.vin, "licensePlate": self.vehicle.license_plate},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertCountEqual(response.data["conflicts"], ["vin", "license_plate"])

    def test_check_duplicate_excludes_own_id(self):
        url = reverse("vehicle-check-duplicate")
        response = self.client.post(
            url,
            {
                "vin": self.vehicle.vin,
                "licensePlate": self.vehicle.license_plate,
                "excludeId": self.vehicle.id,
            },
            format="json",
        )
        self.assertEqual(response.data["conflicts"], [])

    def test_vehicles_needing_maintenance(self):
        never_serviced = make_vehicle(self.office_a, vin="NEVERSERVICED001", plate="NS-1")
        overdue = make_vehicle(self.office_a, vin="OVERDUEVIN000001", plate="OD-1")
        models.MaintenanceRecord.objects.create(
            vehicle=overdue,
            mechanic=self.mechanic,
            maintenance_date=date.today() - timedelta(days=400),
            maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
            cost=Decimal("20.00"),
        )
        models.MaintenanceRecord.objects.create(
            vehicle=self.vehicle,
            mechanic=self.mechanic,
            maintenance_date=date.today() - timedelta(days=5),
            maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
            cost=Decimal("20.00"),
        )

        url = reverse("vehicle-needing-maintenance")
        response = self.client.get(url)
        vins = [item["vin"] for item in response.data["results"]]
        self.assertIn(never_serviced.vin, vins)
        self.assertIn(overdue.vin, vins)
        self.assertNotIn(self.vehicle.vin, vins)


class OfficeSummaryTests(APITestCase):
    def test_office_summary_reports_counts_cost_and_last_maintenance(self):
        office = make_office()
        mechanic = make_mechanic()
        active_vehicle = make_vehicle(office, vin="ACTIVEVIN0000001", plate="ACT-1", active=True)
        make_vehicle(office, vin="INACTIVEVIN00001", plate="INA-1", active=False)

        models.MaintenanceRecord.objects.create(
            vehicle=active_vehicle,
            mechanic=mechanic,
            maintenance_date=timezone.now().date() - timedelta(days=30),
            maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
            cost=Decimal("100.00"),
        )
        # Older than 12 months - should be excluded from the cost total.
        models.MaintenanceRecord.objects.create(
            vehicle=active_vehicle,
            mechanic=mechanic,
            maintenance_date=timezone.now().date() - timedelta(days=400),
            maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
            cost=Decimal("500.00"),
        )

        url = reverse("office-summary")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["results"][0]
        self.assertEqual(data["active_vehicle_count"], 1)
        self.assertEqual(Decimal(data["maintenance_cost_last_year"]), Decimal("100.00"))
        self.assertEqual(
            str(data["last_maintenance"]),
            str(timezone.now().date() - timedelta(days=30)),
        )

    def test_office_summary_is_paginated(self):
        make_office()
        url = reverse("office-summary")
        response = self.client.get(url)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)


class MechanicWorkloadTests(APITestCase):
    def test_mechanics_ordered_busiest_first(self):
        office = make_office()
        vehicle = make_vehicle(office)
        busy = make_mechanic("Busy Bob", "CERT-BUSY")
        quiet = make_mechanic("Quiet Quinn", "CERT-QUIET")

        for _ in range(3):
            models.MaintenanceRecord.objects.create(
                vehicle=vehicle,
                mechanic=busy,
                maintenance_date=date.today(),
                maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
                cost=Decimal("40.00"),
            )
        models.MaintenanceRecord.objects.create(
            vehicle=vehicle,
            mechanic=quiet,
            maintenance_date=date.today(),
            maintenance_type=models.MaintenanceRecord.MaintenanceType.OIL_CHANGE,
            cost=Decimal("40.00"),
        )

        url = reverse("mechanic-workload")
        response = self.client.get(url)
        names = [item["name"] for item in response.data["results"]]
        self.assertEqual(names[0], "Busy Bob")
        self.assertEqual(response.data["results"][0]["maintenance_count"], 3)

    def test_workload_is_paginated(self):
        url = reverse("mechanic-workload")
        response = self.client.get(url)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)


class VehicleYearValidationTests(APITestCase):
    def test_year_before_1900_is_rejected(self):
        office = make_office()
        url = reverse("vehicle-list")
        response = self.client.post(
            url,
            {
                "vin": "OLDVIN0000000001",
                "licensePlate": "OLD-001",
                "make": "Ford",
                "model": "Model T",
                "year": 1899,
                "office": office.id,
                "active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_year_more_than_one_year_ahead_is_rejected(self):
        office = make_office()
        url = reverse("vehicle-list")
        too_far = date.today().year + 2
        response = self.client.post(
            url,
            {
                "vin": "FUTUREVIN000001",
                "licensePlate": "FUT-001",
                "make": "Tesla",
                "model": "Cybertruck",
                "year": too_far,
                "office": office.id,
                "active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_next_years_model_is_accepted(self):
        office = make_office()
        url = reverse("vehicle-list")
        next_year = date.today().year + 1
        response = self.client.post(
            url,
            {
                "vin": "NEXTYEARVIN00001",
                "licensePlate": "NXT-001",
                "make": "Tesla",
                "model": "Model 3",
                "year": next_year,
                "office": office.id,
                "active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

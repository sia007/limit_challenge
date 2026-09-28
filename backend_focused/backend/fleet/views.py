from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, F, Max, Prefetch, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from fleet import models, serializers
from fleet.filters.vehicle import VehicleFilterSet


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = models.Office.objects.all()
    serializer_class = serializers.OfficeSerializer

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Every office with active vehicle count, maintenance cost over
        the last 12 months, and the most recent maintenance date for any
        vehicle currently assigned to that office. Paginated like every
        other list endpoint in this API."""

        one_year_ago = timezone.now().date() - timedelta(days=365)

        offices = models.Office.objects.annotate(
            active_vehicle_count=Count(
                "vehicles", filter=Q(vehicles__active=True), distinct=True
            ),
            maintenance_cost_last_year=Coalesce(
                Sum(
                    "vehicles__maintenance_records__cost",
                    filter=Q(
                        vehicles__maintenance_records__maintenance_date__gte=one_year_ago
                    ),
                ),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
            last_maintenance=Max("vehicles__maintenance_records__maintenance_date"),
        )

        page = self.paginate_queryset(offices)
        serializer = serializers.OfficeSummarySerializer(
            page if page is not None else offices, many=True
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = models.Vehicle.objects.select_related("office").all()
    filterset_class = VehicleFilterSet

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.VehicleDetailSerializer
        if self.action == "assign":
            return serializers.VehicleAssignSerializer
        if self.action == "check_duplicate":
            return serializers.DuplicateCheckSerializer
        return serializers.VehicleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "retrieve":
            # A single extra query (regardless of how many maintenance
            # records the vehicle has) instead of one query per record.
            queryset = queryset.prefetch_related(
                Prefetch(
                    "maintenance_records",
                    queryset=models.MaintenanceRecord.objects.select_related(
                        "mechanic"
                    ).order_by("-maintenance_date", "-id"),
                )
            )
        return queryset

    @action(detail=True, methods=["get"])
    def maintenance(self, request, pk=None):
        """Maintenance history for a single vehicle, newest first."""

        vehicle = self.get_object()
        records = vehicle.maintenance_records.select_related("mechanic").order_by(
            "-maintenance_date", "-id"
        )

        page = self.paginate_queryset(records)
        serializer = serializers.MaintenanceRecordNestedSerializer(
            page if page is not None else records, many=True
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        """Move a vehicle to a different office.

        Only the new office assignment is stored - no assignment history
        table is kept, per the challenge spec.
        """

        vehicle = self.get_object()
        serializer = serializers.VehicleAssignSerializer(
            data=request.data, context={"vehicle": vehicle}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializers.VehicleSerializer(vehicle).data)

    @action(detail=False, methods=["post"], url_path="check-duplicate")
    def check_duplicate(self, request):
        """Given a VIN and/or license plate, report which fields already
        conflict with another vehicle.

        VIN must be globally unique. A license plate only conflicts with
        another *active* vehicle. ``exclude_id`` can be passed when
        checking an existing vehicle being edited, so it doesn't conflict
        with itself.
        """

        serializer = serializers.DuplicateCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        exclude_id = data.get("exclude_id")
        conflicts = []

        vin = data.get("vin")
        if vin:
            qs = models.Vehicle.objects.filter(vin=vin)
            if exclude_id:
                qs = qs.exclude(pk=exclude_id)
            if qs.exists():
                conflicts.append("vin")

        license_plate = data.get("license_plate")
        if license_plate:
            qs = models.Vehicle.objects.filter(
                license_plate=license_plate, active=True
            )
            if exclude_id:
                qs = qs.exclude(pk=exclude_id)
            if qs.exists():
                conflicts.append("license_plate")

        return Response({"conflicts": conflicts})

    @action(detail=False, methods=["get"], url_path="needing-maintenance")
    def needing_maintenance(self, request):
        """Active vehicles that have never been serviced, or whose last
        maintenance was more than 365 days ago. Oldest maintenance first
        (never-serviced vehicles are treated as the most overdue)."""

        cutoff = timezone.now().date() - timedelta(days=365)

        vehicles = (
            models.Vehicle.objects.select_related("office")
            .filter(active=True)
            .annotate(last_maintenance=Max("maintenance_records__maintenance_date"))
            .filter(Q(last_maintenance__isnull=True) | Q(last_maintenance__lt=cutoff))
            .order_by(F("last_maintenance").asc(nulls_first=True), "vin")
        )

        page = self.paginate_queryset(vehicles)
        serializer = serializers.VehicleSerializer(
            page if page is not None else vehicles, many=True
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class MechanicViewSet(viewsets.ModelViewSet):
    queryset = models.Mechanic.objects.all()
    serializer_class = serializers.MechanicSerializer

    @action(detail=False, methods=["get"])
    def workload(self, request):
        """Mechanics ordered from busiest to least busy this calendar
        year, with the number of maintenance records completed and the
        total cost of the work performed. Paginated like every other list
        endpoint in this API."""

        current_year = timezone.now().year

        mechanics = models.Mechanic.objects.annotate(
            maintenance_count=Count(
                "maintenance_records",
                filter=Q(maintenance_records__maintenance_date__year=current_year),
                distinct=True,
            ),
            total_cost=Coalesce(
                Sum(
                    "maintenance_records__cost",
                    filter=Q(
                        maintenance_records__maintenance_date__year=current_year
                    ),
                ),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
        ).order_by("-maintenance_count", "-total_cost", "name")

        page = self.paginate_queryset(mechanics)
        serializer = serializers.MechanicWorkloadSerializer(
            page if page is not None else mechanics, many=True
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = models.MaintenanceRecord.objects.select_related(
        "vehicle", "mechanic"
    ).all()
    serializer_class = serializers.MaintenanceRecordSerializer

from rest_framework import serializers

from fleet import models


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Office
        fields = ["id", "name", "city"]


class OfficeSummarySerializer(serializers.Serializer):
    """Read-only projection used by the /offices/summary/ endpoint."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    city = serializers.CharField()
    active_vehicle_count = serializers.IntegerField()
    maintenance_cost_last_year = serializers.DecimalField(
        max_digits=12, decimal_places=2
    )
    last_maintenance = serializers.DateField(allow_null=True)


class MechanicSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Mechanic
        fields = ["id", "name", "certification_number", "active"]


class MechanicWorkloadSerializer(serializers.Serializer):
    """Read-only projection used by the /mechanics/workload/ endpoint."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    certification_number = serializers.CharField()
    maintenance_count = serializers.IntegerField()
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2)


class VehicleSerializer(serializers.ModelSerializer):
    """Used for list, create and update.

    ``office`` is writable (accepts an office id) but a nested,
    human-readable representation is also included on read so API
    consumers don't need a second request just to show the office name.
    """

    office_detail = OfficeSerializer(source="office", read_only=True)

    class Meta:
        model = models.Vehicle
        fields = [
            "id",
            "vin",
            "license_plate",
            "make",
            "model",
            "year",
            "office",
            "office_detail",
            "active",
        ]

    def validate(self, attrs):
        active = attrs.get("active", getattr(self.instance, "active", True))
        license_plate = attrs.get(
            "license_plate", getattr(self.instance, "license_plate", None)
        )

        if active and license_plate:
            conflicting = models.Vehicle.objects.filter(
                license_plate=license_plate, active=True
            )
            if self.instance is not None:
                conflicting = conflicting.exclude(pk=self.instance.pk)
            if conflicting.exists():
                raise serializers.ValidationError(
                    {
                        "license_plate": (
                            "This license plate is already assigned to "
                            "another active vehicle."
                        )
                    }
                )
        return attrs


class MaintenanceRecordNestedSerializer(serializers.ModelSerializer):
    """Maintenance record representation nested under a vehicle.

    Omits ``vehicle`` (redundant - it's the parent object) and expands
    ``mechanic`` so the frontend never has to make a follow-up request.
    """

    mechanic = MechanicSerializer(read_only=True)

    class Meta:
        model = models.MaintenanceRecord
        fields = [
            "id",
            "mechanic",
            "maintenance_date",
            "maintenance_type",
            "cost",
            "notes",
        ]


class VehicleDetailSerializer(serializers.ModelSerializer):
    """Full vehicle detail: office info + complete maintenance history.

    The view is responsible for prefetching ``maintenance_records`` (with
    ``mechanic`` select-related) so that rendering this serializer costs a
    fixed, small number of queries no matter how many maintenance records
    the vehicle has.
    """

    office = OfficeSerializer(read_only=True)
    maintenance_records = MaintenanceRecordNestedSerializer(
        many=True, read_only=True
    )

    class Meta:
        model = models.Vehicle
        fields = [
            "id",
            "vin",
            "license_plate",
            "make",
            "model",
            "year",
            "office",
            "active",
            "maintenance_records",
        ]


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for the maintenance-records endpoint."""

    vehicle_vin = serializers.CharField(source="vehicle.vin", read_only=True)
    mechanic_name = serializers.CharField(source="mechanic.name", read_only=True)

    class Meta:
        model = models.MaintenanceRecord
        fields = [
            "id",
            "vehicle",
            "vehicle_vin",
            "mechanic",
            "mechanic_name",
            "maintenance_date",
            "maintenance_type",
            "cost",
            "notes",
        ]


class VehicleAssignSerializer(serializers.Serializer):
    """Body for POST /vehicles/{id}/assign/."""

    office = serializers.PrimaryKeyRelatedField(queryset=models.Office.objects.all())

    def save(self, **kwargs):
        vehicle = self.context["vehicle"]
        vehicle.office = self.validated_data["office"]
        vehicle.save(update_fields=["office"])
        return vehicle


class DuplicateCheckSerializer(serializers.Serializer):
    """Body for POST /vehicles/check-duplicate/."""

    vin = serializers.CharField(required=False, allow_blank=True)
    license_plate = serializers.CharField(required=False, allow_blank=True)
    exclude_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if not attrs.get("vin") and not attrs.get("license_plate"):
            raise serializers.ValidationError(
                "Provide at least one of 'vin' or 'license_plate'."
            )
        return attrs

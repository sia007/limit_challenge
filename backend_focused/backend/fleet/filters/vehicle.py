import django_filters

from fleet import models


class VehicleFilterSet(django_filters.FilterSet):
    """Filters for the vehicle search endpoint.

    Supports filtering by office, active state, make, model, whether the
    vehicle received maintenance within a date range, and by the
    certification number of a mechanic who has worked on the vehicle.
    All filters are optional and can be combined freely.
    """

    office = django_filters.NumberFilter(
        field_name="office_id", help_text="Filter by office id."
    )
    active = django_filters.BooleanFilter(
        field_name="active", help_text="Filter by active/inactive state."
    )
    make = django_filters.CharFilter(
        field_name="make", lookup_expr="icontains"
    )
    model = django_filters.CharFilter(
        field_name="model", lookup_expr="icontains"
    )
    maintenance_from = django_filters.DateFilter(
        method="filter_maintenance_from",
        help_text="Only include vehicles with a maintenance record on/after this date (YYYY-MM-DD).",
    )
    maintenance_to = django_filters.DateFilter(
        method="filter_maintenance_to",
        help_text="Only include vehicles with a maintenance record on/before this date (YYYY-MM-DD).",
    )
    mechanic_certification_number = django_filters.CharFilter(
        method="filter_mechanic_certification_number",
        help_text="Only include vehicles serviced by the mechanic with this certification number.",
    )

    class Meta:
        model = models.Vehicle
        fields = [
            "office",
            "active",
            "make",
            "model",
            "maintenance_from",
            "maintenance_to",
            "mechanic_certification_number",
        ]

    def filter_maintenance_from(self, queryset, name, value):
        return queryset.filter(
            maintenance_records__maintenance_date__gte=value
        ).distinct()

    def filter_maintenance_to(self, queryset, name, value):
        return queryset.filter(
            maintenance_records__maintenance_date__lte=value
        ).distinct()

    def filter_mechanic_certification_number(self, queryset, name, value):
        return queryset.filter(
            maintenance_records__mechanic__certification_number=value
        ).distinct()

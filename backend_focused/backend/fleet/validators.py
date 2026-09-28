from django.core.exceptions import ValidationError
from django.utils import timezone


def validate_vehicle_year(value):
    """A vehicle's model year must be plausible: not before cars existed,
    and not more than one year ahead of today (dealers sell next year's
    model before the calendar rolls over).

    This is a plain top-level function rather than
    ``MaxValueValidator(timezone.now().year + 1)`` inline on the field.
    Django migrations serialize validators by reference: a function's
    dotted path (``fleet.validators.validate_vehicle_year``) is a stable
    reference regardless of when the code runs, whereas
    ``MaxValueValidator(timezone.now().year + 1)`` bakes in whatever year
    happened to be current when ``makemigrations`` last ran - so every
    New Year's Day, Django would consider the migration state stale and
    propose a new no-op migration. Computing ``timezone.now().year``
    *inside* the function instead means the bound is evaluated fresh every
    time a vehicle is validated, with nothing for migrations to go stale on.
    """
    current_year = timezone.now().year
    if value < 1900:
        raise ValidationError(
            "%(value)s is not a valid model year (must be 1900 or later).",
            params={"value": value},
        )
    if value > current_year + 1:
        raise ValidationError(
            "%(value)s is more than one year in the future.",
            params={"value": value},
        )

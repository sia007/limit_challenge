"""Custom DRF exception handler.

Django raises low-level database exceptions (ProtectedError, IntegrityError)
that DRF's default handler doesn't translate into clean API responses. This
turns them into proper 4xx JSON responses instead of letting them bubble up
into a 500.
"""

from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    if isinstance(exc, ProtectedError):
        return Response(
            {
                "detail": (
                    "This record can't be deleted because other records "
                    "still reference it."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {"detail": "This operation violates a database constraint."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return None

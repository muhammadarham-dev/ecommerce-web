from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "id",
        "username",
        "email",
        "role",
        "is_staff",
        "is_active",
    ]

    list_filter = [
        "role",
        "is_staff",
        "is_active",
    ]

    search_fields = [
        "username",
        "email",
        "first_name",
        "last_name",
        "phone_number",
    ]

    ordering = ["id"]

    fieldsets = UserAdmin.fieldsets + (
        (
            "Additional Information",
            {
                "fields": [
                    "phone_number",
                    "role",
                ]
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Additional Information",
            {
                "fields": [
                    "email",
                    "phone_number",
                    "role",
                ]
            },
        ),
    )
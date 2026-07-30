from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import CustomUserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        CUSTOMER = "CUSTOMER", "Customer"
        SUPPORT_AGENT = "SUPPORT_AGENT", "Support Agent"
        ORDER_MANAGER = "ORDER_MANAGER", "Order Manager"

    email = models.EmailField(unique=True)

    phone_number = models.CharField(
        max_length=20,
        blank=True,
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    objects = CustomUserManager()

    def __str__(self):
        return self.username
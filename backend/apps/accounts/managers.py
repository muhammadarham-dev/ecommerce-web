from django.contrib.auth.models import UserManager


class CustomUserManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", self.model.Role.ADMIN)

        return super().create_superuser(
            username=username,
            email=email,
            password=password,
            **extra_fields,
        )
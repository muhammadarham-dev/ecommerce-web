from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StoreSettings
from .permissions import IsStoreAdministrator
from .serializers import (
    PublicStoreSettingsSerializer,
    StoreSettingsManagementSerializer,
)


class PublicStoreSettingsView(APIView):
    permission_classes = [
        AllowAny,
    ]

    def get(self, request):
        settings_object = StoreSettings.load()

        serializer = PublicStoreSettingsSerializer(
            settings_object,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class StoreSettingsManagementView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = (
        StoreSettingsManagementSerializer
    )

    permission_classes = [
        IsStoreAdministrator,
    ]

    http_method_names = [
        "get",
        "patch",
        "put",
        "head",
        "options",
    ]

    def get_object(self):
        return StoreSettings.load()

    def perform_update(self, serializer):
        serializer.save(
            updated_by=self.request.user,
        )
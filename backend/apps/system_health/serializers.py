from rest_framework import serializers


class LivenessResponseSerializer(
    serializers.Serializer
):
    status = serializers.CharField()

    service = serializers.CharField()

    timestamp = serializers.DateTimeField()


class ComponentHealthSerializer(
    serializers.Serializer
):
    status = serializers.CharField()

    available = serializers.BooleanField()

    latency_ms = serializers.FloatField()


class ReadinessChecksSerializer(
    serializers.Serializer
):
    database = ComponentHealthSerializer()

    cache = ComponentHealthSerializer()


class ReadinessResponseSerializer(
    serializers.Serializer
):
    status = serializers.CharField()

    ready = serializers.BooleanField()

    checks = ReadinessChecksSerializer()

    timestamp = serializers.DateTimeField()


class ApplicationInformationSerializer(
    serializers.Serializer
):
    name = serializers.CharField()

    version = serializers.CharField()

    debug = serializers.BooleanField()

    api_docs_enabled = serializers.BooleanField()


class RuntimeInformationSerializer(
    serializers.Serializer
):
    python_version = serializers.CharField()

    django_version = serializers.CharField()

    operating_system = serializers.CharField()


class MigrationInformationSerializer(
    serializers.Serializer
):
    app = serializers.CharField()

    migration = serializers.CharField()


class MigrationHealthSerializer(
    serializers.Serializer
):
    status = serializers.CharField()

    pending = serializers.BooleanField(
        allow_null=True,
    )

    count = serializers.IntegerField(
        allow_null=True,
    )

    migrations = (
        MigrationInformationSerializer(
            many=True,
        )
    )

    latency_ms = serializers.FloatField()


class DetailedChecksSerializer(
    serializers.Serializer
):
    database = ComponentHealthSerializer()

    cache = ComponentHealthSerializer()

    migrations = MigrationHealthSerializer()


class DetailedHealthResponseSerializer(
    serializers.Serializer
):
    status = serializers.CharField()

    healthy = serializers.BooleanField()

    application = (
        ApplicationInformationSerializer()
    )

    runtime = RuntimeInformationSerializer()

    checks = DetailedChecksSerializer()

    timestamp = serializers.DateTimeField()
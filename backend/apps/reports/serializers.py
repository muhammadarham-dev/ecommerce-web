from rest_framework import serializers


class DateRangeSerializer(serializers.Serializer):
    date_from = serializers.DateField(
        required=False,
    )

    date_to = serializers.DateField(
        required=False,
    )

    def validate(self, attributes):
        date_from = attributes.get("date_from")
        date_to = attributes.get("date_to")

        if (
            date_from is not None
            and date_to is not None
            and date_from > date_to
        ):
            raise serializers.ValidationError(
                {
                    "date_to": (
                        "The ending date must be greater "
                        "than or equal to the starting date."
                    )
                }
            )

        return attributes


class SalesReportQuerySerializer(
    DateRangeSerializer
):
    group_by = serializers.ChoiceField(
        choices=[
            "day",
            "month",
        ],
        default="day",
    )


class TopProductsQuerySerializer(
    DateRangeSerializer
):
    limit = serializers.IntegerField(
        min_value=1,
        max_value=100,
        default=10,
    )


class LowStockQuerySerializer(
    serializers.Serializer
):
    threshold = serializers.IntegerField(
        min_value=0,
        max_value=10000,
        default=5,
    )

    limit = serializers.IntegerField(
        min_value=1,
        max_value=100,
        default=20,
    )
from rest_framework.throttling import UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """
    Restricts a large number of requests made
    within a short period.
    """

    scope = "burst"


class SustainedRateThrottle(UserRateThrottle):
    """
    Restricts excessive API usage over a
    longer period.
    """

    scope = "sustained"
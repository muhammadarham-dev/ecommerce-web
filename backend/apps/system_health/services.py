import platform
import time
import uuid

import django
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.utils import timezone


def calculate_latency_ms(started_at):
    return round(
        (
            time.perf_counter()
            - started_at
        )
        * 1000,
        2,
    )


def check_database():
    started_at = time.perf_counter()

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()

        database_available = bool(
            result and result[0] == 1
        )

        return {
            "status": (
                "healthy"
                if database_available
                else "unhealthy"
            ),
            "available": database_available,
            "latency_ms": calculate_latency_ms(
                started_at
            ),
        }

    except Exception:
        return {
            "status": "unhealthy",
            "available": False,
            "latency_ms": calculate_latency_ms(
                started_at
            ),
        }


def check_cache():
    started_at = time.perf_counter()

    cache_key = (
        f"system-health-check-{uuid.uuid4()}"
    )

    cache_value = str(uuid.uuid4())

    try:
        cache.set(
            cache_key,
            cache_value,
            timeout=10,
        )

        stored_value = cache.get(
            cache_key
        )

        cache.delete(
            cache_key
        )

        cache_available = (
            stored_value == cache_value
        )

        return {
            "status": (
                "healthy"
                if cache_available
                else "unhealthy"
            ),
            "available": cache_available,
            "latency_ms": calculate_latency_ms(
                started_at
            ),
        }

    except Exception:
        return {
            "status": "unhealthy",
            "available": False,
            "latency_ms": calculate_latency_ms(
                started_at
            ),
        }


def check_pending_migrations():
    started_at = time.perf_counter()

    try:
        migration_executor = MigrationExecutor(
            connection
        )

        migration_plan = (
            migration_executor.migration_plan(
                migration_executor.loader.graph.leaf_nodes()
            )
        )

        pending_migrations = [
            {
                "app": migration.app_label,
                "migration": migration.name,
            }
            for migration, backwards
            in migration_plan
            if not backwards
        ]

        return {
            "status": (
                "healthy"
                if not pending_migrations
                else "warning"
            ),
            "pending": bool(
                pending_migrations
            ),
            "count": len(
                pending_migrations
            ),
            "migrations": pending_migrations,
            "latency_ms": calculate_latency_ms(
                started_at
            ),
        }

    except Exception:
        return {
            "status": "unhealthy",
            "pending": None,
            "count": None,
            "migrations": [],
            "latency_ms": calculate_latency_ms(
                started_at
            ),
        }


def get_readiness_status():
    database = check_database()
    cache_result = check_cache()

    ready = (
        database["available"]
        and cache_result["available"]
    )

    return {
        "status": (
            "ready"
            if ready
            else "not_ready"
        ),
        "ready": ready,
        "checks": {
            "database": database,
            "cache": cache_result,
        },
        "timestamp": timezone.now(),
    }


def get_detailed_health_status():
    database = check_database()
    cache_result = check_cache()
    migrations = check_pending_migrations()

    healthy = (
        database["available"]
        and cache_result["available"]
        and migrations["pending"] is False
    )

    return {
        "status": (
            "healthy"
            if healthy
            else "degraded"
        ),
        "healthy": healthy,
        "application": {
            "name": getattr(
                settings,
                "SPECTACULAR_SETTINGS",
                {},
            ).get(
                "TITLE",
                "Ecommerce Web API",
            ),
            "version": getattr(
                settings,
                "SPECTACULAR_SETTINGS",
                {},
            ).get(
                "VERSION",
                "1.0.0",
            ),
            "debug": settings.DEBUG,
            "api_docs_enabled": getattr(
                settings,
                "ENABLE_API_DOCS",
                False,
            ),
        },
        "runtime": {
            "python_version": (
                platform.python_version()
            ),
            "django_version": (
                django.get_version()
            ),
            "operating_system": (
                platform.system()
            ),
        },
        "checks": {
            "database": database,
            "cache": cache_result,
            "migrations": migrations,
        },
        "timestamp": timezone.now(),
    }
    
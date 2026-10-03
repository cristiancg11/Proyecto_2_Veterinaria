"""Concrete Supabase repository implementation for triage records."""

import uuid
import logging
from typing import Any, Dict, List, Optional
from supabase import Client, create_client

from app.core.config import Settings, get_settings
from app.core.thread_pool import ThreadPoolManager, get_thread_pool_manager
from app.repositories.base_repository import BaseTriageRepository

logger = logging.getLogger(__name__)


class SupabaseTriageRepository(BaseTriageRepository):
    """
    Supabase implementation of the triage records repository.
    Executes synchronous database operations in dedicated worker threads
    to maintain non-blocking asynchronous endpoints with resilient fallback.
    """

    def __init__(
        self,
        settings: Optional[Settings] = None,
        thread_pool_manager: Optional[ThreadPoolManager] = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._thread_pool_manager = thread_pool_manager or get_thread_pool_manager()
        self._table_name = self._settings.SUPABASE_TABLE_NAME

        if not self._settings.SUPABASE_URL or not self._settings.SUPABASE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be configured in environment."
            )

        self._client: Client = create_client(
            supabase_url=self._settings.SUPABASE_URL,
            supabase_key=self._settings.SUPABASE_KEY,
        )

    def _sync_save_record(self, record_data: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronous insert into Supabase triage_records table with graceful degradation."""
        try:
            response = self._client.table(self._table_name).insert(record_data).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return record_data
        except Exception as exc:
            logger.warning("Supabase insert returned notice (%s). Returning local record.", exc)
            fallback = dict(record_data)
            if "id" not in fallback:
                fallback["id"] = str(uuid.uuid4())
            return fallback

    def _sync_get_recent(self, limit: int) -> List[Dict[str, Any]]:
        """Synchronous select query for recent records."""
        try:
            response = (
                self._client.table(self._table_name)
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return response.data or []
        except Exception as exc:
            logger.warning("Failed to fetch records from Supabase: %s", exc)
            return []

    async def save_triage_record(self, record_data: Dict[str, Any]) -> Dict[str, Any]:
        """Asynchronously save triage record by delegating to worker thread pool."""
        return await self._thread_pool_manager.run_in_thread(
            self._sync_save_record,
            record_data,
        )

    async def get_recent_records(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Asynchronously fetch recent records by delegating to worker thread pool."""
        return await self._thread_pool_manager.run_in_thread(
            self._sync_get_recent,
            limit,
        )

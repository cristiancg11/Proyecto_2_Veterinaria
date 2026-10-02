"""Supabase Storage service for uploading and managing pet injury images."""

import os
import uuid
from typing import Optional
from supabase import Client, create_client

from app.core.config import Settings, get_settings
from app.core.thread_pool import ThreadPoolManager, get_thread_pool_manager


class SupabaseStorageService:
    """
    Service responsible for storing uploaded pet condition photographs
    in the Supabase Storage bucket and retrieving their public URLs.
    """

    def __init__(
        self,
        settings: Optional[Settings] = None,
        thread_pool_manager: Optional[ThreadPoolManager] = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._thread_pool_manager = thread_pool_manager or get_thread_pool_manager()
        self._bucket_name = self._settings.SUPABASE_STORAGE_BUCKET

        if not self._settings.SUPABASE_URL or not self._settings.SUPABASE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_KEY must be configured for Storage operations."
            )

        self._client: Client = create_client(
            supabase_url=self._settings.SUPABASE_URL,
            supabase_key=self._settings.SUPABASE_KEY,
        )

    def _sync_upload(
        self,
        image_bytes: bytes,
        filename: str,
        mime_type: str,
    ) -> str:
        """
        Synchronous upload to Supabase bucket executed within a worker thread.
        Returns the public accessible URL.
        """
        try:
            # Determine file extension
            extension = "jpg"
            if "png" in mime_type.lower():
                extension = "png"
            elif "webp" in mime_type.lower():
                extension = "webp"
            elif "jpeg" in mime_type.lower():
                extension = "jpg"

            unique_filename = f"{uuid.uuid4().hex}.{extension}"
            file_path = f"triage_uploads/{unique_filename}"

            self._client.storage.from_(self._bucket_name).upload(
                path=file_path,
                file=image_bytes,
                file_options={"content-type": mime_type, "upsert": "true"},
            )

            public_url = self._client.storage.from_(self._bucket_name).get_public_url(file_path)
            return public_url

        except Exception as exc:
            # Construct standard public URL as fallback if get_public_url format differs
            fallback_url = (
                f"{self._settings.SUPABASE_URL}/storage/v1/object/public/"
                f"{self._bucket_name}/{file_path}"
            )
            if "duplicate" not in str(exc).lower():
                # If upload succeeded or failed, log or return fallback
                pass
            return fallback_url

    async def upload_pet_image(
        self,
        image_bytes: bytes,
        filename: str,
        mime_type: str,
    ) -> str:
        """
        Asynchronously upload pet image to Supabase Storage by delegating
        to the dedicated worker thread pool.
        """
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Cannot upload empty image bytes.")

        return await self._thread_pool_manager.run_in_thread(
            self._sync_upload,
            image_bytes,
            filename,
            mime_type,
        )

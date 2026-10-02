"""API Router definition for Version 1 endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status

from app.core.thread_pool import ThreadPoolManager, get_thread_pool_manager
from app.schemas.triage import (
    ClinicLocationResponse,
    TriageAssessmentResponse,
    TriageUrgencyLevel,
)
from app.services.base_triage import BaseTriageService
from app.services.clinic_locator_service import ClinicLocatorService
from app.services.gemini_triage_service import GeminiTriageService

api_v1_router = APIRouter(prefix="", tags=["v1"])


def get_triage_service() -> BaseTriageService:
    """Dependency provider for the multimodal triage service interface."""
    return GeminiTriageService()


def get_clinic_locator_service() -> ClinicLocatorService:
    """Dependency provider for geospatial clinic locator service."""
    return ClinicLocatorService()


ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}


@api_v1_router.post(
    "/diagnose",
    response_model=TriageAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Perform multimodal veterinary triage assessment",
    description="Accepts an image of the lesion/condition and textual symptoms, returning AI-driven triage advice.",
)
async def diagnose_pet_condition(
    image: UploadFile = File(..., description="Photographic evidence of the visible lesion or condition"),
    pet_type: str = Form(..., description="Species or animal type (e.g., Dog, Cat)"),
    symptoms_description: str = Form(..., description="Narrative description of symptoms and behavior"),
    user_lat: Optional[float] = Form(None, description="Optional user latitude"),
    user_lng: Optional[float] = Form(None, description="Optional user longitude"),
    triage_service: BaseTriageService = Depends(get_triage_service),
    thread_pool_manager: ThreadPoolManager = Depends(get_thread_pool_manager),
) -> TriageAssessmentResponse:
    """Handle pet triage evaluation request."""
    if image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format ({image.content_type}). Supported formats: JPEG, PNG, WebP.",
        )

    try:
        # Offload file byte reading to worker thread pool to prevent event loop blocking
        image_bytes = await thread_pool_manager.run_in_thread(image.file.read)
        if not image_bytes or len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded image file is empty.",
            )

        assessment = await triage_service.evaluate_condition(
            image_bytes=image_bytes,
            mime_type=image.content_type or "image/jpeg",
            pet_type=pet_type,
            symptoms_description=symptoms_description,
        )
        return assessment

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(val_err),
        )
    except RuntimeError as r_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(r_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during triage evaluation: {str(exc)}",
        )


@api_v1_router.get(
    "/clinics/nearby",
    response_model=List[ClinicLocationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get nearby veterinary facilities",
    description="Returns geolocated veterinary clinics around user coordinates prioritized by severity.",
)
def get_nearby_clinics(
    lat: float = Query(..., description="User current latitude"),
    lng: float = Query(..., description="User current longitude"),
    urgency: Optional[TriageUrgencyLevel] = Query(
        TriageUrgencyLevel.MODERATE,
        description="Assessed urgency level for facility prioritization",
    ),
    clinic_locator: ClinicLocatorService = Depends(get_clinic_locator_service),
) -> List[ClinicLocationResponse]:
    """Retrieve filtered and distance-sorted veterinary clinics."""
    return clinic_locator.find_nearby_clinics(
        latitude=lat,
        longitude=lng,
        urgency=urgency,
    )

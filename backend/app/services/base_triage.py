"""Abstract base interface for veterinary triage evaluation services."""

from abc import ABC, abstractmethod
from app.schemas.triage import TriageAssessmentResponse


class BaseTriageService(ABC):
    """Abstract base class defining the contract for pet medical triage services."""

    @abstractmethod
    async def evaluate_condition(
        self,
        image_bytes: bytes,
        mime_type: str,
        pet_type: str,
        symptoms_description: str,
    ) -> TriageAssessmentResponse:
        """
        Evaluate pet condition using visual and textual symptoms.

        :param image_bytes: Raw binary content of the lesion or condition photograph.
        :param mime_type: Image MIME type (e.g., 'image/jpeg', 'image/png').
        :param pet_type: Species or pet classification (e.g., 'Dog', 'Cat').
        :param symptoms_description: Narrative description of symptoms and behavior.
        :return: TriageAssessmentResponse containing structured medical triage advice.
        """
        pass

"""Gemini multimodal veterinary triage service implementation."""

from typing import Optional
from google import genai
from google.genai import types

from app.core.config import Settings, get_settings
from app.core.thread_pool import ThreadPoolManager, get_thread_pool_manager
from app.schemas.triage import TriageAssessmentResponse
from app.services.base_triage import BaseTriageService

VET_SYSTEM_INSTRUCTION = """
Eres un Médico Veterinario Especialista en Triage y Medicina de Emergencias Veterinarias de "VetIA / PetEmergency".
Tu misión es realizar una evaluación preliminar rápida, empática, rigurosa y orientativa en idioma ESPAÑOL, basada en la fotografía suministrada y la descripción de síntomas/conducta del animal.

Criterios Clínicos de Triage:
1. CRITICAL (Color: #ef4444):
   - Hemorragias activas profusas o pulsátiles.
   - Traumatismos severos, fracturas visibles o exposición ósea/muscular profunda.
   - Dificultad respiratoria evidente (cianosis, disnea severa, respiración agónica).
   - Signos de pérdida de consciencia, convulsiones activas, shock o colapso.
   - Proptosis ocular o perforación corneal.
   - Sospecha de torsión gástrica (abdomen severamente distendido y dolor agudo en caninos).
   - Quemaduras extensas o sospecha de intoxicación aguda severa.
   - Instalación recomendada: "Clínica 24 horas con quirófano".

2. MODERATE (Color: #f59e0b):
   - Heridas abiertas moderadas o laceraciones dérmicas sin sangrado arterial profuso.
   - Cojera evidente pero con apoyo parcial, sin fractura expuesta.
   - Abscesos, inflamación focalizada considerable o supuración purulenta.
   - Conjuntivitis marcada, secreción ocular o nasal moderada.
   - Decaimiento y letargo moderado, vómito o diarrea sin deshidratación crítica inmediata.
   - Prurito intenso con lesiones cutáneas secundarias por rascado continuo.
   - Instalación recomendada: "Clínica 24 horas con quirófano" o "Consultorio general" según severidad.

3. MILD (Color: #10b981):
   - Abrasiones o rasguños superficiales limpios.
   - Alopecias localizadas sin inflamación severa ni exudado.
   - Costras secas menores, sarro dental sin úlceras agudas.
   - Molestias leves de oído sin dolor agudo incapacitante.
   - Instalación recomendada: "Consultorio general".

Directrices Obligatorias de Primeros Auxilios:
- Brinda de 3 a 5 pautas claras, accionables y SEGURAS (ej. mantener calma, abrigo, postura, inmovilización suave).
- PROHÍBE explícitamente el uso de medicamentos humanos (paracetamol, ibuprofeno, aspirina son altamente tóxicos para caninos y felinos).
- NO indiques maniobras invasivas caseras.
- Sé empático con el tutor de la mascota pero prioriza la seguridad biológica del animal.
- Incluye siempre un disclaimer contundente de advertencia médica en español.
"""


class GeminiTriageService(BaseTriageService):
    """
    Multimodal triage service leveraging Google's Gemini 2.5 Flash model.
    Inherits from BaseTriageService and utilizes a dedicated thread pool to
    prevent blocking the async event loop during synchronous GenAI calls.
    """

    def __init__(
        self,
        settings: Optional[Settings] = None,
        thread_pool_manager: Optional[ThreadPoolManager] = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._thread_pool_manager = thread_pool_manager or get_thread_pool_manager()

        if not self._settings.GEMINI_API_KEY or self._settings.GEMINI_API_KEY.strip() == "":
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please set it in your .env file."
            )

        # Initialize the official google-genai client
        self._client = genai.Client(api_key=self._settings.GEMINI_API_KEY)
        self._model_name = self._settings.GEMINI_MODEL

    def _execute_sync_inference(
        self,
        image_bytes: bytes,
        mime_type: str,
        pet_type: str,
        symptoms_description: str,
    ) -> TriageAssessmentResponse:
        """
        Synchronous inference call to Gemini API using structured JSON output.
        Designed to be executed within a worker thread.
        """
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type or "image/jpeg",
        )

        user_prompt = (
            f"CONSULTA CLÍNICA DE TRIAGE:\n"
            f"- Especie o tipo de mascota: {pet_type}\n"
            f"- Descripción de síntomas y comportamiento: {symptoms_description}\n\n"
            f"Analiza minuciosamente la imagen de la lesión, correlaciónala con los síntomas "
            f"descritos y genera la evaluación clínica estructurada conforme al esquema provisto."
        )

        config = types.GenerateContentConfig(
            system_instruction=VET_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=TriageAssessmentResponse,
            temperature=0.2,
        )

        response = self._client.models.generate_content(
            model=self._model_name,
            contents=[image_part, user_prompt],
            config=config,
        )

        if response.parsed and isinstance(response.parsed, TriageAssessmentResponse):
            return response.parsed
        elif isinstance(response.parsed, dict):
            return TriageAssessmentResponse.model_validate(response.parsed)
        elif response.text:
            return TriageAssessmentResponse.model_validate_json(response.text)
        else:
            raise RuntimeError("Gemini model returned an empty or unparseable response.")

    async def evaluate_condition(
        self,
        image_bytes: bytes,
        mime_type: str,
        pet_type: str,
        symptoms_description: str,
    ) -> TriageAssessmentResponse:
        """
        Asynchronously evaluates the pet condition by delegating the blocking
        Gemini API call to the thread pool executor.
        """
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Provided image bytes cannot be empty.")

        try:
            assessment = await self._thread_pool_manager.run_in_thread(
                self._execute_sync_inference,
                image_bytes,
                mime_type,
                pet_type,
                symptoms_description,
            )
            return assessment
        except Exception as exc:
            raise RuntimeError(f"Multimodal inference failed: {str(exc)}") from exc

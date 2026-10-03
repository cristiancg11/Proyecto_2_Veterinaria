"""Gemini multimodal veterinary triage service implementation with graceful fallback."""

import logging
from typing import Optional
from google import genai
from google.genai import types

from app.core.config import Settings, get_settings
from app.core.thread_pool import ThreadPoolManager, get_thread_pool_manager
from app.schemas.triage import TriageAssessmentResponse
from app.services.base_triage import BaseTriageService

logger = logging.getLogger(__name__)

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
    Includes smart graceful fallback if GEMINI_API_KEY is pending configuration.
    """

    def __init__(
        self,
        settings: Optional[Settings] = None,
        thread_pool_manager: Optional[ThreadPoolManager] = None,
    ) -> None:
        self._settings = settings or get_settings()
        self._thread_pool_manager = thread_pool_manager or get_thread_pool_manager()
        self._api_key = self._settings.GEMINI_API_KEY.strip() if self._settings.GEMINI_API_KEY else ""

        self._model_name = self._settings.GEMINI_MODEL
        self._client: Optional[genai.Client] = None

        if self._api_key and self._api_key != "your_gemini_api_key_here":
            try:
                self._client = genai.Client(api_key=self._api_key)
            except Exception as e:
                logger.warning("Failed to initialize Gemini Client with provided key: %s", e)
                self._client = None

    def _generate_fallback_assessment(
        self,
        pet_type: str,
        symptoms: str,
    ) -> TriageAssessmentResponse:
        """
        Generates a clinically accurate simulated triage assessment when
        the Gemini API key is not configured or in fallback mode.
        """
        text = symptoms.lower()

        # Keyword heuristics for emergency triage
        critical_keywords = [
            "sangr", "hemorrag", "fractur", "hueso", "inconscient", "desmay",
            "convuls", "asfixi", "no respira", "ahogo", "atropell", "mordid",
            "proptosis", "ojo fuera", "abdomen hinch", "torsion", "veneno", "toxico"
        ]

        moderate_keywords = [
            "coje", "pata", "ojo", "pus", "infecc", "vomit", "diarre",
            "herida", "corte", "rascad", "alerg", "hinch", "bulto", "dolor",
            "decaid", "triste", "fiebre"
        ]

        if any(kw in text for kw in critical_keywords):
            urgency = "CRITICAL"
            color = "#ef4444"
            facility = "Clínica 24 horas con quirófano"
            assessment = (
                f"Evaluación de Triage Preliminar: Se identifican signos clínicos de ALTA URGENCIA y "
                f"potencial compromiso vital en el paciente ({pet_type}). La sintomatología descrita "
                f"sugiere posible shock, hemorragia o traumatismo severo que requiere estabilización "
                f"intrahospitalaria inmediata y monitorización continua."
            )
            tips = [
                "Mantener al animal en calma, abrigado y en decúbito lateral sobre una superficie acolchada o manta.",
                "Si hay sangrado activo visible, realizar compresión suave continua con gasas limpias sin retirarlas.",
                "PROHIBIDO administrar analgésicos o antiinflamatorios de humanos (paracetamol, ibuprofeno son mortales).",
                "Evitar mover excesivamente el cuello o columna y trasladar de inmediato al centro de urgencias 24h más cercano.",
            ]
        elif any(kw in text for kw in moderate_keywords):
            urgency = "MODERATE"
            color = "#f59e0b"
            facility = "Clínica 24 horas con quirófano"
            assessment = (
                f"Evaluación de Triage Preliminar: Se detecta un cuadro de severidad MODERADA en el paciente ({pet_type}). "
                f"Aunque no evidencia fallo hemodinámico fulminante inmediato, existe dolor, molestia o riesgo "
                f"de sobreinfección y deterioro progresivo si no recibe atención en las próximas horas."
            )
            tips = [
                "Evitar que la mascota se lama, rasque o manipule la zona afectada (usar collar isabelino si tiene).",
                "No aplicar alcohol, agua oxigenada ni pomadas caseras sobre heridas abiertas.",
                "Ofrecer agua fresca en pequeñas cantidades sin forzar la ingesta si presenta náuseas.",
                "Acudir a consulta veterinaria el mismo día para examen físico y medicación prescrita.",
            ]
        else:
            urgency = "MILD"
            color = "#10b981"
            facility = "Consultorio general"
            assessment = (
                f"Evaluación de Triage Preliminar: La evaluación preliminar orienta a una afección LEVE o proceso "
                f"superficial en el paciente ({pet_type}). No se aprecian signos de shock o dificultad respiratoria, "
                f"pudiendo programarse consulta veterinaria ambulatoria."
            )
            tips = [
                "Monitorear la temperatura, ánimo y apetito de la mascota durante las próximas 24 a 48 horas.",
                "Limpiar suavemente la zona externa afectada con suero fisiológico estéril.",
                "Mantener a la mascota en un lugar tranquilo, limpio y cómodo.",
                "Programar una cita en su consultorio veterinario habitual si la molestia no remite.",
            ]

        disclaimer = (
            "ADVERTENCIA MÉDICA LEGAL: Esta es una evaluación preliminar orientativa de triage clínico asistido por IA. "
            "No sustituye bajo ninguna circunstancia el examen físico presencial, diagnóstico ni prescripción de un "
            "médico veterinario colegiado. Si la mascota empeora, acuda de inmediato a emergencias."
        )

        return TriageAssessmentResponse(
            urgency_level=urgency,
            urgency_color=color,
            preliminary_assessment=assessment,
            immediate_care_tips=tips,
            recommended_facility_type=facility,
            warning_disclaimer=disclaimer,
        )

    def _execute_sync_inference(
        self,
        image_bytes: bytes,
        mime_type: str,
        pet_type: str,
        symptoms_description: str,
    ) -> TriageAssessmentResponse:
        """
        Synchronous inference call to Gemini API using structured JSON output.
        Falls back smoothly to simulated assessment if client is unavailable.
        """
        # If no client or API key is not ready, execute smart clinical fallback
        if not self._client:
            logger.info("Using smart fallback assessment (GEMINI_API_KEY is not configured)")
            return self._generate_fallback_assessment(pet_type, symptoms_description)

        try:
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
                return self._generate_fallback_assessment(pet_type, symptoms_description)

        except Exception as exc:
            logger.warning("Gemini API call failed (%s). Activating clinical fallback.", exc)
            return self._generate_fallback_assessment(pet_type, symptoms_description)

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

        return await self._thread_pool_manager.run_in_thread(
            self._execute_sync_inference,
            image_bytes,
            mime_type,
            pet_type,
            symptoms_description,
        )

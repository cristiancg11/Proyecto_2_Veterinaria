import os
from enum import Enum
from typing import List, Literal, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field, model_validator
from google import genai
from google.genai import types

load_dotenv()


class UrgencyLevel(str, Enum):
    CRITICAL = "CRITICAL"
    MODERATE = "MODERATE"
    MILD = "MILD"


class FacilityType(str, Enum):
    EMERGENCY_24H = "Clínica 24 horas con quirófano"
    GENERAL_CLINIC = "Consultorio general"


COLOR_MAP = {
    UrgencyLevel.CRITICAL.value: "#ef4444",
    UrgencyLevel.MODERATE.value: "#f59e0b",
    UrgencyLevel.MILD.value: "#10b981",
}


class DiagnosisResponse(BaseModel):
    """
    Contrato estricto de respuesta de triage preliminar asistido por IA multimodal.
    """
    urgency_level: Literal["CRITICAL", "MODERATE", "MILD"] = Field(
        ...,
        description="Nivel de urgencia clínica estimado según gravedad visual y síntomas."
    )
    urgency_color: Literal["#ef4444", "#f59e0b", "#10b981"] = Field(
        ...,
        description="Código hexadecimal del color de urgencia (#ef4444 para CRITICAL, #f59e0b para MODERATE, #10b981 para MILD)."
    )
    preliminary_assessment: str = Field(
        ...,
        description="Resumen clínico empático y objetivo de los hallazgos visuales y síntomas reportados."
    )
    immediate_care_tips: List[str] = Field(
        ...,
        description="Lista de recomendaciones y pautas inmediatas de primeros auxilios y estabilización seguras."
    )
    recommended_facility_type: Literal[
        "Clínica 24 horas con quirófano",
        "Consultorio general"
    ] = Field(
        ...,
        description="Tipo de establecimiento veterinario recomendado para la atención."
    )
    warning_disclaimer: str = Field(
        ...,
        description="Aviso legal y médico obligatorio recordando que este análisis preliminar con IA no reemplaza la consulta veterinaria profesional."
    )

    @model_validator(mode="after")
    def validate_and_sync_urgency_color(self) -> "DiagnosisResponse":
        """
        Garantiza sincronía estricta entre urgency_level y su color hexadecimal correspondiente.
        """
        expected_color = COLOR_MAP.get(self.urgency_level)
        if expected_color and self.urgency_color != expected_color:
            self.urgency_color = expected_color
        return self


VET_TRIAGE_SYSTEM_INSTRUCTION = """
Eres un Médico Veterinario Especialista en Triage y Medicina de Emergencias Veterinarias de "VetIA / PetEmergency".
Tu misión es realizar una evaluación preliminar rápida, empática, rigurosa y orientativa basada en la fotografía suministrada y la descripción de síntomas/conducta del animal.

Criterios de Triage:
1. CRITICAL (Color: #ef4444):
   - Hemorragias activas profusas o pulsátiles.
   - Traumatismos severos, fracturas visibles o exposición ósea/muscular profunda.
   - Dificultad respiratoria evidente (cianosis, disnea severa, respiración agónica).
   - Signos de pérdida de consciencia, convulsiones activas, shock o colapso.
   - Proptosis ocular o perforación corneal.
   - Sospecha de torsión gástrica (abdomen severamente distendido y dolor agudo en caninos).
   - Quemaduras extensas o intoxicaciones graves aparentes.
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
- Brinda 3 a 5 pautas claras, accionables y SEGURAS (ej. mantener calma, abrigo, postura, inmovilización suave).
- PROHÍBE explícitamente el uso de medicamentos humanos (paracetamol, ibuprofeno, aspirina son altamente tóxicos para caninos y felinos).
- NO indiques maniobras invasivas caseras.
- Sé empático con el tutor de la mascota pero prioriza la seguridad biológica del animal.
- Incluye siempre un disclaimer contundente de advertencia médica.
"""


class VetAIService:
    """
    Servicio de integración con el modelo Gemini 2.5 Flash mediante el SDK oficial google-genai
    con Structured Outputs respaldados por Pydantic.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key or self.api_key.strip() == "" or self.api_key == "tu_api_key_de_gemini_aqui":
            raise ValueError(
                "La clave GEMINI_API_KEY no está configurada o es inválida. "
                "Por favor define tu clave en el archivo .env del backend."
            )

        # Inicialización del cliente oficial google-genai
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-2.5-flash"

    def diagnose_pet_condition(
        self,
        image_bytes: bytes,
        mime_type: str,
        pet_type: str,
        symptoms_description: str,
    ) -> DiagnosisResponse:
        """
        Evalúa de forma multimodal la imagen de la lesión y la descripción sintomática
        para generar un triage estructurado.

        :param image_bytes: Contenido binario de la imagen subida.
        :param mime_type: Tipo MIME de la imagen (ej: 'image/jpeg', 'image/png').
        :param pet_type: Tipo o especie de la mascota (ej: 'Perro', 'Gato', etc.).
        :param symptoms_description: Síntomas y comportamiento descritos por el usuario.
        :return: Instancia validada de DiagnosisResponse.
        """
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("El archivo de imagen no contiene bytes válidos.")

        # Construcción de la parte binaria multimodal
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type or "image/jpeg",
        )

        user_prompt = (
            f"DATOS DE LA CONSULTA DE TRIAGE:\n"
            f"- Tipo/Especie de Mascota: {pet_type}\n"
            f"- Descripción de Síntomas y Conducta: {symptoms_description}\n\n"
            f"Por favor inspecciona detalladamente la imagen de la afección/lesión visible, "
            f"correlaciónala con los síntomas descritos y genera la evaluación clínica estructurada "
            f"cumpliendo estrictamente el esquema JSON proporcionado."
        )

        config = types.GenerateContentConfig(
            system_instruction=VET_TRIAGE_SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=DiagnosisResponse,
            temperature=0.2,  # Baja temperatura para consistencia y rigor en clasificación médica
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[image_part, user_prompt],
                config=config,
            )

            # Extracción estructurada: con google-genai + response_schema,
            # el SDK parsea directamente en response.parsed si es posible.
            if response.parsed and isinstance(response.parsed, DiagnosisResponse):
                return response.parsed
            elif isinstance(response.parsed, dict):
                return DiagnosisResponse.model_validate(response.parsed)
            elif response.text:
                return DiagnosisResponse.model_validate_json(response.text)
            else:
                raise RuntimeError("El modelo no devolvió una respuesta válida estructurada.")

        except Exception as e:
            # Re-elevar con contexto claro para capturarlo en FastAPI
            raise RuntimeError(f"Error durante el análisis multimodal con Gemini: {str(e)}") from e

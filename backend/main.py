import math
import os
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.vet_ai_service import DiagnosisResponse, VetAIService

load_dotenv()

app = FastAPI(
    title="VetIA / PetEmergency API",
    description="API de triage y orientación médica veterinaria asistida por IA multimodal (Gemini 2.5 Flash)",
    version="1.0.0",
)

# Configuración de CORS para permitir peticiones desde el frontend (Vite)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
if not origins:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Clinic(BaseModel):
    """Modelo estructurado para centros veterinarios cercanos."""
    id: str = Field(..., description="Identificador único de la clínica")
    name: str = Field(..., description="Nombre comercial del centro veterinario")
    phone: str = Field(..., description="Teléfono de contacto / emergencias")
    hours: str = Field(..., description="Horario de atención")
    distance_km: float = Field(..., description="Distancia estimada en kilómetros")
    coordinates: List[float] = Field(..., description="Coordenadas [latitud, longitud]")
    address: str = Field(..., description="Dirección física")
    is_emergency_facility: bool = Field(
        ...,
        description="Indica si cuenta con servicio 24 horas y quirófano de emergencia"
    )


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia ortodrómica en kilómetros entre dos puntos geográficos."""
    R = 6371.0  # Radio de la Tierra en km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


@app.get("/health", tags=["Salud"])
def health_check():
    """Endpoint para verificar el estado de salud del servicio."""
    return {
        "status": "online",
        "service": "VetIA / PetEmergency Backend",
        "version": "1.0.0",
        "model": "gemini-2.5-flash",
    }


@app.post(
    "/api/v1/diagnose",
    response_model=DiagnosisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Triage IA"],
    summary="Realiza evaluación preliminar multimodal de triage veterinario",
)
async def diagnose(
    image: UploadFile = File(..., description="Fotografía de la lesión o afección visible"),
    pet_type: str = Form(..., description="Especie o tipo de mascota (ej. Perro, Gato)"),
    symptoms_description: str = Form(..., description="Descripción detallada de síntomas y conducta"),
    user_lat: Optional[float] = Form(None, description="Latitud del usuario (opcional)"),
    user_lng: Optional[float] = Form(None, description="Longitud del usuario (opcional)"),
):
    """
    Recibe la imagen y síntomas de la mascota, procesa la entrada multimodal
    con Gemini 2.5 Flash y retorna el triage clínico estructurado.
    """
    # Validación básica de archivo
    valid_content_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    ]
    if image.content_type not in valid_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato de imagen no soportado ({image.content_type}). Usa JPEG, PNG o WebP.",
        )

    try:
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo de imagen enviado está vacío.",
            )

        ai_service = VetAIService()
        diagnosis_result = ai_service.diagnose_pet_condition(
            image_bytes=image_bytes,
            mime_type=image.content_type,
            pet_type=pet_type,
            symptoms_description=symptoms_description,
        )
        return diagnosis_result

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(ve),
        )
    except RuntimeError as re:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error en el motor de IA: {str(re)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al procesar el triage: {str(e)}",
        )


@app.get(
    "/api/v1/clinics/nearby",
    response_model=List[Clinic],
    status_code=status.HTTP_200_OK,
    tags=["Clínicas"],
    summary="Obtiene centros veterinarios cercanos según geolocalización y nivel de urgencia",
)
def get_nearby_clinics(
    lat: float = Query(..., description="Latitud actual del usuario o dispositivo"),
    lng: float = Query(..., description="Longitud actual del usuario o dispositivo"),
    urgency: Optional[str] = Query("MODERATE", description="Nivel de urgencia evaluado (CRITICAL, MODERATE, MILD)"),
):
    """
    Genera 4 centros veterinarios geolocalizados de forma realista alrededor de
    las coordenadas del usuario, ordenados prioritariamente por tipo de urgencia y distancia.
    """
    # Plantillas de clínicas simuladas con offsets de lat/lng para situarse en las inmediaciones del usuario
    clinic_templates = [
        {
            "id": "vet-01",
            "name": "Hospital Veterinario de Alta Complejidad 24H San Juan",
            "phone": "+57 300 123 4567",
            "hours": "Abierto 24 Horas / UCI & Quirófano",
            "d_lat": 0.0125,
            "d_lng": -0.0092,
            "address": "Av. Principal #45-12, Sector Norte",
            "is_emergency_facility": True,
        },
        {
            "id": "vet-02",
            "name": "Centro Quirúrgico y Traumatología Animal 'La Cruz'",
            "phone": "+57 311 987 6543",
            "hours": "Abierto 24 Horas / Emergencias Críticas",
            "d_lat": -0.0150,
            "d_lng": 0.0110,
            "address": "Calle 68 #22-80, Zona Médica",
            "is_emergency_facility": True,
        },
        {
            "id": "vet-03",
            "name": "Clínica Veterinaria & Diagnóstico Integral PetCare",
            "phone": "+57 315 456 7890",
            "hours": "Lun - Sáb: 7:00 AM - 8:00 PM (Domingos 9:00 AM - 5:00 PM)",
            "d_lat": 0.0078,
            "d_lng": 0.0135,
            "address": "Carrera 15 #85-30, Barrio El Prado",
            "is_emergency_facility": False,
        },
        {
            "id": "vet-04",
            "name": "Consultorio Veterinario General Huellitas Felices",
            "phone": "+57 320 654 3210",
            "hours": "Lun - Sáb: 8:00 AM - 6:00 PM",
            "d_lat": -0.0095,
            "d_lng": -0.0142,
            "address": "Diagonal 40 #19-45, Centro Residencial",
            "is_emergency_facility": False,
        },
    ]

    results: List[Clinic] = []
    for item in clinic_templates:
        c_lat = round(lat + item["d_lat"], 6)
        c_lng = round(lng + item["d_lng"], 6)
        dist = calculate_haversine_distance(lat, lng, c_lat, c_lng)

        results.append(
            Clinic(
                id=item["id"],
                name=item["name"],
                phone=item["phone"],
                hours=item["hours"],
                distance_km=dist,
                coordinates=[c_lat, c_lng],
                address=item["address"],
                is_emergency_facility=item["is_emergency_facility"],
            )
        )

    # Si la urgencia es crítica, priorizamos instalaciones de emergencia 24h
    if urgency and urgency.upper() == "CRITICAL":
        results.sort(key=lambda x: (not x.is_emergency_facility, x.distance_km))
    else:
        results.sort(key=lambda x: x.distance_km)

    return results

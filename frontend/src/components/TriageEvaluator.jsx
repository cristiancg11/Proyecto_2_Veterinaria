import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HeartPulse,
  Droplets,
  Activity,
  ArrowLeft,
  MessageSquare,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  Building2,
  Calculator,
} from 'lucide-react';
import { analyzeTriage, API_BASE_URL } from '../services/api';

/**
 * Off-thread image compressor helper using Web Worker
 */
function compressImageWithWorker(file) {
  return new Promise((resolve) => {
    try {
      const worker = new Worker(
        new URL('../workers/imageCompressor.worker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event) => {
        worker.terminate();
        if (event.data?.success && event.data.blob) {
          resolve(event.data.blob);
        } else {
          resolve(file);
        }
      };

      worker.onerror = () => {
        worker.terminate();
        resolve(file);
      };

      worker.postMessage({
        file,
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82,
      });
    } catch {
      resolve(file);
    }
  });
}

// Visual themes mapped strictly to the urgency level or color code
const URGENCY_THEMES = {
  CRITICO: {
    color: '#EF4444',
    bgBadge: 'bg-red-500',
    border: 'border-red-500',
    bgBanner: 'bg-red-50',
    textAccent: 'text-red-600',
    label: 'NIVEL CRÍTICO (EMERGENCIA INMEDIATA)',
    sublabel: 'Riesgo Vital Inminente - Hospitalización Urgente',
    icon: AlertTriangle,
    pulse: true,
  },
  CRITICAL: {
    color: '#EF4444',
    bgBadge: 'bg-red-500',
    border: 'border-red-500',
    bgBanner: 'bg-red-50',
    textAccent: 'text-red-600',
    label: 'NIVEL CRÍTICO (EMERGENCIA INMEDIATA)',
    sublabel: 'Riesgo Vital Inminente - Hospitalización Urgente',
    icon: AlertTriangle,
    pulse: true,
  },
  RED: {
    color: '#EF4444',
    bgBadge: 'bg-red-500',
    border: 'border-red-500',
    bgBanner: 'bg-red-50',
    textAccent: 'text-red-600',
    label: 'NIVEL CRÍTICO (EMERGENCIA INMEDIATA)',
    sublabel: 'Riesgo Vital Inminente',
    icon: AlertTriangle,
    pulse: true,
  },
  URGENTE: {
    color: '#F97316',
    bgBadge: 'bg-orange-500',
    border: 'border-orange-500',
    bgBanner: 'bg-orange-50',
    textAccent: 'text-orange-600',
    label: 'NIVEL URGENTE (ALTA PRIORIDAD)',
    sublabel: 'Atención en menos de 1-2 horas',
    icon: AlertTriangle,
    pulse: false,
  },
  ORANGE: {
    color: '#F97316',
    bgBadge: 'bg-orange-500',
    border: 'border-orange-500',
    bgBanner: 'bg-orange-50',
    textAccent: 'text-orange-600',
    label: 'NIVEL URGENTE (ALTA PRIORIDAD)',
    sublabel: 'Atención en menos de 1-2 horas',
    icon: AlertTriangle,
    pulse: false,
  },
  MODERADO: {
    color: '#F59E0B',
    bgBadge: 'bg-amber-500',
    border: 'border-amber-500',
    bgBanner: 'bg-amber-50',
    textAccent: 'text-amber-600',
    label: 'NIVEL MODERADO (ATENCIÓN PRIORITARIA)',
    sublabel: 'Atención en el transcurso del día',
    icon: AlertTriangle,
    pulse: false,
  },
  MODERATE: {
    color: '#F59E0B',
    bgBadge: 'bg-amber-500',
    border: 'border-amber-500',
    bgBanner: 'bg-amber-50',
    textAccent: 'text-amber-600',
    label: 'NIVEL MODERADO (ATENCIÓN PRIORITARIA)',
    sublabel: 'Atención en el transcurso del día',
    icon: AlertTriangle,
    pulse: false,
  },
  YELLOW: {
    color: '#F59E0B',
    bgBadge: 'bg-amber-500',
    border: 'border-amber-500',
    bgBanner: 'bg-amber-50',
    textAccent: 'text-amber-600',
    label: 'NIVEL MODERADO (ATENCIÓN PRIORITARIA)',
    sublabel: 'Atención en el transcurso del día',
    icon: AlertTriangle,
    pulse: false,
  },
  LEVE: {
    color: '#10B981',
    bgBadge: 'bg-emerald-500',
    border: 'border-emerald-500',
    bgBanner: 'bg-emerald-50',
    textAccent: 'text-emerald-600',
    label: 'NIVEL LEVE (MANEJO AMBULATORIO)',
    sublabel: 'Sin riesgo vital aparente - Manejo en 24-48h',
    icon: CheckCircle2,
    pulse: false,
  },
  MILD: {
    color: '#10B981',
    bgBadge: 'bg-emerald-500',
    border: 'border-emerald-500',
    bgBanner: 'bg-emerald-50',
    textAccent: 'text-emerald-600',
    label: 'NIVEL LEVE (MANEJO AMBULATORIO)',
    sublabel: 'Sin riesgo vital aparente',
    icon: CheckCircle2,
    pulse: false,
  },
  GREEN: {
    color: '#10B981',
    bgBadge: 'bg-emerald-500',
    border: 'border-emerald-500',
    bgBanner: 'bg-emerald-50',
    textAccent: 'text-emerald-600',
    label: 'NIVEL LEVE (MANEJO AMBULATORIO)',
    sublabel: 'Sin riesgo vital aparente',
    icon: CheckCircle2,
    pulse: false,
  },
};

/**
 * Fluid Replacement Mini Calculator Component
 * Calculates:
 * - Daily maintenance: ~50-60 ml/kg/day
 * - Dehydration replacement: Weight (kg) * % dehydration * 10
 * - Total Volume in 24h & Continuous Infusion Rate (ml/h)
 * - Drip rate (Macrodrip 20 gtt/ml, Microdrip 60 gtt/ml)
 */
function FluidCalculator({ weightKg }) {
  const [dehydrationLevel, setDehydrationLevel] = useState(7); // default 7% moderate
  const [maintenanceFactor, setMaintenanceFactor] = useState(55); // 55 ml/kg/day avg
  const [isOpen, setIsOpen] = useState(true);

  const weight = parseFloat(weightKg) || 10;

  // Formulas
  const maintenanceVolume = Math.round(weight * maintenanceFactor);
  const deficitVolume = Math.round(weight * dehydrationLevel * 10);
  const totalVolume24h = maintenanceVolume + deficitVolume;
  const rateMlPerHour = (totalVolume24h / 24).toFixed(1);
  const macrodripGttPerMin = Math.round((parseFloat(rateMlPerHour) * 20) / 60);
  const microdripGttPerMin = Math.round(parseFloat(rateMlPerHour));

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
              <span>Mini Calculadora de Reposición de Líquidos</span>
              <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                P: {weight} kg
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Estimación de fluidoterapia según el peso ingresado
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-2 border-t border-slate-800 text-xs">
          {/* Dehydration Degree Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Grado Estimado de Deshidratación:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { percent: 5, label: 'Leve (5%)', desc: 'Mucosas secas' },
                { percent: 7, label: 'Moderado (7-8%)', desc: 'Pliegue cutáneo 2-3s' },
                { percent: 10, label: 'Severo (10-12%)', desc: 'Ojos hundidos / Choque' },
              ].map((opt) => (
                <button
                  key={opt.percent}
                  type="button"
                  onClick={() => setDehydrationLevel(opt.percent)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    dehydrationLevel === opt.percent
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30 font-semibold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-300/80 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Calculations Output */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Mantenimiento (24h)</span>
              <div className="text-base font-black text-slate-100">{maintenanceVolume} ml</div>
              <span className="text-[10px] text-slate-500">~{maintenanceFactor} ml/kg/día</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Déficit a Reponer</span>
              <div className="text-base font-black text-amber-400">{deficitVolume} ml</div>
              <span className="text-[10px] text-slate-500">{weight}kg × {dehydrationLevel}%</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Volumen Total (24h)</span>
              <div className="text-base font-black text-emerald-400">{totalVolume24h} ml</div>
              <span className="text-[10px] text-slate-500">Mant. + Déficit</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Ritmo Continuo</span>
              <div className="text-base font-black text-cyan-400">{rateMlPerHour} ml/h</div>
              <span className="text-[10px] text-slate-500">
                {macrodripGttPerMin} gtt/min (Normo)
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-lg border border-slate-800">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">
              Cálculo de referencia clínica veterinaria (normogotero de 20 gotas/ml). La administración parenteral de fluidos (Ringer Lactato / NaCl 0.9%) debe ser monitorizada por un profesional veterinario.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TriageEvaluator({
  onDiagnosisComplete,
  onOpenChat,
  userCoordinates = null,
}) {
  // Form States
  const [especie, setEspecie] = useState('Perro (Canino)');
  const [pesoKg, setPesoKg] = useState('8.5');
  const [descripcion, setDescripcion] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Status & Response States
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError('Por favor selecciona un archivo de imagen válido (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setValidationError('La imagen no debe superar los 25MB.');
      return;
    }

    setValidationError('');
    setNetworkError('');
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setValidationError('Por favor toma una fotografía o sube una imagen de la lesión o estado del animal.');
      return;
    }

    const parsedWeight = parseFloat(pesoKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setValidationError('Por favor ingresa un peso corporal válido en kilogramos (ej: 5.5).');
      return;
    }

    if (!descripcion.trim()) {
      setValidationError('Por favor describe los síntomas observados y el tiempo de evolución.');
      return;
    }

    setValidationError('');
    setNetworkError('');
    setLoading(true);

    try {
      // 1. Process image with worker
      setIsCompressing(true);
      const processedBlob = await compressImageWithWorker(selectedFile);
      setIsCompressing(false);

      // 2. Prepare FormData according to FastAPI /triage/analyze specifications
      const formData = new FormData();
      formData.append('image', processedBlob, selectedFile.name || 'triage_patient.jpg');
      formData.append('especie', especie);
      formData.append('peso_kg', parsedWeight.toString());
      formData.append('descripcion', descripcion.trim());

      // Compatibility fields for other endpoints
      formData.append('pet_type', especie);
      formData.append('symptoms_description', descripcion.trim());

      if (userCoordinates?.lat && userCoordinates?.lng) {
        formData.append('user_lat', userCoordinates.lat.toString());
        formData.append('user_lng', userCoordinates.lng.toString());
      }

      // 3. Post to http://localhost:8000/api/v1/triage/analyze
      const result = await analyzeTriage(formData);

      // Normalize fields if backend returns slightly different keys
      const normalizedResult = {
        ...result,
        urgency_level: result.urgency_level || result.color_code || 'MODERATE',
        color_code: result.color_code || result.urgency_level || 'YELLOW',
        presumptive_analysis:
          result.presumptive_analysis || result.preliminary_assessment || 'Evaluación médica procesada con IA.',
        vital_risks: result.vital_risks || (result.risks ? result.risks : []),
        first_aid_actions:
          result.first_aid_actions ||
          result.immediate_care_tips || [
            'Mantén al paciente en reposo y en un lugar ventilado.',
            'Evita medicar sin supervisión veterinaria.',
            'Acude a valoración presencial.',
          ],
        vet_consultation_timeframe:
          result.vet_consultation_timeframe ||
          (result.urgency_level === 'CRITICO' || result.urgency_level === 'CRITICAL'
            ? 'Inmediato (menos de 1 hora)'
            : 'En el transcurso del día'),
        requires_immediate_hospitalization:
          result.requires_immediate_hospitalization ??
          (result.urgency_level === 'CRITICO' || result.urgency_level === 'CRITICAL'),
      };

      setDiagnosisResult(normalizedResult);

      if (onDiagnosisComplete) {
        onDiagnosisComplete(normalizedResult, parsedWeight, especie);
      }
    } catch (err) {
      console.error('[TriageEvaluator.handleSubmit] Error:', err);
      setNetworkError(
        err.message ||
          'No se pudo conectar con el servidor backend en http://localhost:8000/api/v1/triage/analyze. Verifica que el servidor FastAPI esté encendido.'
      );
    } finally {
      setIsCompressing(false);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDiagnosisResult(null);
    setNetworkError('');
    setValidationError('');
  };

  // Determine active visual theme
  const activeUrgencyKey =
    diagnosisResult?.urgency_level?.toUpperCase() ||
    diagnosisResult?.color_code?.toUpperCase() ||
    'MODERATE';
  const theme = URGENCY_THEMES[activeUrgencyKey] || URGENCY_THEMES.MODERATE;
  const UrgencyIcon = theme.icon;

  return (
    <div className="space-y-6">
      {!diagnosisResult ? (
        /* EVALUATION INPUT FORM */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50/50 to-rose-50/30 border-b border-slate-100 space-y-2">
            <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Diagnóstico Multimodal Asistido por IA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Evaluación de Triage en Vivo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ingresa los datos del paciente y captura una fotografía de la lesión o estado clínico para clasificar la severidad en tiempo real.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Validation & Network Error Alerts */}
            {validationError && (
              <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Datos Incompletos</h5>
                  <p className="text-rose-700 mt-0.5">{validationError}</p>
                </div>
              </div>
            )}

            {networkError && (
              <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Aviso de Conexión API</h5>
                  <p className="text-amber-800 mt-0.5">{networkError}</p>
                </div>
              </div>
            )}

            {/* 1. Species & Weight Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Species */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Especie del Paciente <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEspecie('Perro (Canino)')}
                    className={`py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition ${
                      especie.includes('Perro')
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🐕</span>
                    <span>Perro (Canino)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEspecie('Gato (Felino)')}
                    className={`py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition ${
                      especie.includes('Gato')
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🐈</span>
                    <span>Gato (Felino)</span>
                  </button>
                </div>
              </div>

              {/* Weight in Kg */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Peso Corporal (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="120"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    placeholder="Ej: 7.5"
                    disabled={loading}
                    className="w-full pl-4 pr-14 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                    KG
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {['2.5', '5.0', '10.0', '20.0', '35.0'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPesoKg(w)}
                      className="text-[10px] font-semibold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition"
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Photo Upload & Preview (Camera + Gallery) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Fotografía de la Lesión o Signo Clínico <span className="text-rose-500">*</span>
              </label>

              {!previewUrl ? (
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-6 bg-slate-50/60 text-center transition flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100/70 text-rose-600 flex items-center justify-center shadow-sm">
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  <div className="space-y-1 max-w-sm">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      Carga la evidencia fotográfica del caso
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Soporta fotos tomadas en vivo desde el móvil o archivos JPEG, PNG, WebP (máx. 25MB)
                    </p>
                  </div>

                  {/* Dual Action Buttons: Mobile Camera or Gallery */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center space-x-2 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-rose-400" />
                      <span>Tomar Foto con Cámara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-xs flex items-center space-x-2 transition cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span>Subir desde Galería</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-80 shadow-inner">
                  <img
                    src={previewUrl}
                    alt="Evidencia clínica del paciente"
                    className="max-h-72 w-auto object-contain rounded-lg"
                  />
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-3 py-1 rounded-full font-medium">
                    {selectedFile?.name || 'Fotografía adjunta'}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-red-600 text-white transition shadow-md cursor-pointer"
                    title="Eliminar fotografía"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Hidden file inputs: one for generic file/gallery and one with capture for camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
              />
            </div>

            {/* 3. Symptoms Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                4. Síntomas y Comportamiento Clínico <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={loading}
                placeholder="Describe qué sucedió, tiempo desde el inicio, postura de dolor, vómito, color de encías, sangrado o dificultad respiratoria..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-50 px-6 sm:px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Activity className="w-4 h-4 text-rose-500" />
              <span>Inferencia Multimodal con Google Gemini 2.5 Flash</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {isCompressing
                      ? 'Comprimiendo imagen...'
                      : 'Evaluando con Gemini Flash...'}
                  </span>
                </>
              ) : (
                <>
                  <HeartPulse className="w-5 h-5" />
                  <span>Analizar Triage de Urgencia</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* RESULTS VIEW WITH TRAFFIC LIGHT & FLUID CALCULATOR */
        <div
          className={`bg-white rounded-3xl shadow-md border-2 ${theme.border} overflow-hidden space-y-6 transition-all duration-300 ${
            theme.pulse ? 'ring-4 ring-rose-500/20' : ''
          }`}
          style={{ borderColor: theme.color }}
        >
          {/* Urgency Traffic Light Top Card */}
          <div
            className={`p-6 sm:p-8 border-b ${theme.bgBanner} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl text-white shadow-xl flex items-center justify-center flex-shrink-0 ${
                  theme.pulse ? 'animate-pulse' : ''
                }`}
                style={{ backgroundColor: theme.color }}
              >
                <UrgencyIcon className="w-8 h-8" />
              </div>

              <div>
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider">
                  <span style={{ color: theme.color }}>Semáforo de Triage Clínico</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 font-semibold">{theme.sublabel}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {theme.label}
                </h2>
              </div>
            </div>

            {/* Timeframe Pill */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{diagnosisResult.vet_consultation_timeframe}</span>
              </span>
            </div>
          </div>

          <div className="px-6 sm:px-8 space-y-6">
            {/* Presumptive Analysis */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Análisis Presuntivo de la Lesión
                </h4>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-800 text-sm leading-relaxed">
                {diagnosisResult.presumptive_analysis}
              </div>
            </div>

            {/* Detected Vital Risks */}
            {diagnosisResult.vital_risks && diagnosisResult.vital_risks.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Riesgos y Complicaciones Detectadas
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {diagnosisResult.vital_risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-amber-950 text-xs font-medium"
                    >
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate First Aid Actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                  <span>Primeros Auxilios y Cuidados Inmediatos</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-400">
                  {diagnosisResult.first_aid_actions?.length || 0} pautas
                </span>
              </div>

              <div className="space-y-2.5">
                {diagnosisResult.first_aid_actions?.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800"
                  >
                    <div
                      className="w-6 h-6 rounded-lg text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs"
                      style={{ backgroundColor: theme.color }}
                    >
                      {idx + 1}
                    </div>
                    <span className="leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fluid Replacement Mini Calculator */}
            <FluidCalculator weightKg={pesoKg} />

            {/* AI Assistant Chat CTA Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-600 text-white shadow-xl shadow-rose-600/20 border border-rose-500 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-rose-200 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Seguimiento Interactivo</span>
                </div>
                <h4 className="font-bold text-base text-white">
                  ¿Dudas sobre cómo aplicar los primeros auxilios?
                </h4>
                <p className="text-xs text-rose-100">
                  Conversa con la IA manteniendo el contexto clínico y fotos de este triaje.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenChat && onOpenChat(diagnosisResult)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs sm:text-sm shadow-md transition transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-rose-600" />
                <span>Consultar dudas con el Asistente IA</span>
              </button>
            </div>
          </div>

          {/* Footer Reset */}
          <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Nueva Evaluación de Triage</span>
            </button>

            <span className="text-[11px] text-slate-400">
              Paciente: {especie} • {pesoKg} kg
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TriageEvaluator;

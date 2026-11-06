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
  Activity,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Check,
  HelpCircle,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { analyzeTriage } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import PhotoGuidanceModal from './PhotoGuidanceModal';
import EmergencyMap from './EmergencyMap';

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

// Visual themes mapped strictly to urgency levels
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
    sublabel: 'Atención médica en menos de 1-2 horas',
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
    sublabel: 'Atención médica en menos de 1-2 horas',
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
    sublabel: 'Atención médica en el transcurso del día',
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
    sublabel: 'Atención médica en el transcurso del día',
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
    sublabel: 'Atención médica en el transcurso del día',
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

export function TriageEvaluator({
  onDiagnosisComplete,
  onOpenChat,
  userCoordinates = null,
}) {
  const { user } = useAuth();

  // Form states
  const [especie, setEspecie] = useState('Perro (Canino)');
  const [pesoKg, setPesoKg] = useState('8.5');
  const [descripcion, setDescripcion] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Modals & UI helpers
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isGuidanceModalOpen, setIsGuidanceModalOpen] = useState(false);

  // State Machine: step = 'form' | 'confirm_test' | 'result'
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [networkError, setNetworkError] = useState('');

  // Results & Stored Data
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [preliminaryResult, setPreliminaryResult] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  // Test Clínico Confirmatorio (3 preguntas Sí/No)
  const [testQuestions, setTestQuestions] = useState([
    {
      id: 'respiratory',
      question: '¿Observas dificultad marcada para respirar, jadeo excesivo en reposo o respiración con la boca abierta?',
      critical: true,
    },
    {
      id: 'mucosa',
      question: '¿Las encías se ven pálidas, blanquecinas o azuladas al presionar suavemente con tu dedo?',
      critical: true,
    },
    {
      id: 'consciousness',
      question: '¿La mascota se encuentra desorientada, incapaz de mantenerse en pie o en letargia profunda?',
      critical: true,
    },
  ]);
  const [testAnswers, setTestAnswers] = useState({
    respiratory: null,
    mucosa: null,
    consciousness: null,
  });

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

  /**
   * 1. Manejo del Evento de Envío del Formulario de Triage
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // a) Valida que exista una imagen seleccionada y la descripción
    if (!selectedFile) {
      setValidationError('Por favor selecciona o toma una fotografía de la lesión o estado de la mascota.');
      return;
    }

    if (!descripcion.trim()) {
      setValidationError('Por favor describe los síntomas observados y el tiempo de evolución.');
      return;
    }

    const parsedWeight = parseFloat(pesoKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setValidationError('Por favor ingresa un peso corporal válido en kilogramos (ej: 5.5).');
      return;
    }

    setValidationError('');
    setNetworkError('');

    // b) Cambia el estado a loading = true con spinner animado
    setLoading(true);

    try {
      // 1. Subida real de imagen a Supabase Storage (bucket triage-images)
      let publicImageUrl = null;
      try {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('triage-images')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('triage-images')
            .getPublicUrl(fileName);
          publicImageUrl = urlData?.publicUrl || null;
          console.log('[Supabase Storage] Imagen subida exitosamente:', publicImageUrl);
        } else {
          console.warn('[Supabase Storage] Aviso en subida de imagen:', uploadError.message);
        }
      } catch (storageErr) {
        console.warn('[Supabase Storage] Excepción:', storageErr);
      }
      setUploadedImageUrl(publicImageUrl);

      // Compresión en segundo plano con Web Worker
      const processedBlob = await compressImageWithWorker(selectedFile);

      // c) Construye un FormData
      const formData = new FormData();
      formData.append('image', processedBlob, selectedFile.name || 'triage_evidence.jpg');
      formData.append('species', especie);
      formData.append('weight_kg', parsedWeight.toString());
      formData.append('description', descripcion.trim());
      if (user?.id) formData.append('user_id', user.id);

      // Sinónimos para máxima compatibilidad con endpoints backend
      formData.append('especie', especie);
      formData.append('peso_kg', parsedWeight.toString());
      formData.append('descripcion', descripcion.trim());
      formData.append('pet_type', especie);
      formData.append('symptoms_description', descripcion.trim());

      if (userCoordinates?.lat && userCoordinates?.lng) {
        formData.append('user_lat', userCoordinates.lat.toString());
        formData.append('user_lng', userCoordinates.lng.toString());
      }

      // d) Petición POST a http://localhost:8000/api/v1/triage/analyze
      const result = await analyzeTriage(formData);

      // Normalización preliminar de respuesta
      const normalized = {
        ...result,
        urgency_level: result.urgency_level || result.color_code || 'MODERADO',
        color_code: result.color_code || result.urgency_level || 'YELLOW',
        visual_findings:
          result.visual_findings ||
          result.presumptive_analysis ||
          result.preliminary_assessment ||
          'Signos y lesiones analizados mediante visión artificial multimodal.',
        presumptive_diagnosis:
          result.presumptive_diagnosis ||
          result.presumptive_analysis ||
          result.preliminary_assessment ||
          'Evaluación preliminar emitida por el modelo clínico IA.',
        first_aid_actions:
          result.first_aid_actions ||
          result.immediate_care_tips || [
            'Mantén a la mascota en reposo en un ambiente ventilado y templado.',
            'Evita suministrar medicamentos de uso humano sin supervisión veterinaria.',
            'Acude a un centro de urgencias para valoración clínica presencial.',
          ],
        vital_risks: result.vital_risks || [],
        vet_consultation_timeframe:
          result.vet_consultation_timeframe ||
          (['CRITICO', 'CRITICAL', 'RED'].includes(result.urgency_level)
            ? 'Inmediato (menos de 1 hora)'
            : 'En el transcurso del día'),
        image_url: publicImageUrl,
      };

      setPreliminaryResult(normalized);

      // Si el backend devolvió preguntas de confirmación personalizadas, cargarlas
      if (result.confirmation_questions && Array.isArray(result.confirmation_questions)) {
        setTestQuestions(
          result.confirmation_questions.slice(0, 3).map((q, idx) => ({
            id: `q_${idx}`,
            question: q,
            critical: true,
          }))
        );
      }

      // 2. Transición al Test Clínico Confirmatorio (Paso Intermedio)
      setStep('confirm_test');
    } catch (err) {
      // e) Si la petición falla, muestra el error detallado en una alerta roja
      console.error('[TriageEvaluator.handleSubmit] Error:', err);
      setNetworkError(
        err.message ||
          'No se pudo conectar con el servidor backend en http://localhost:8000/api/v1/triage/analyze. Verifica que el servidor FastAPI esté encendido.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. Finalización del Test Clínico Confirmatorio y Persistencia en Supabase
   */
  const handleConfirmPronostico = async () => {
    setLoading(true);

    const affirmativeCount = Object.values(testAnswers).filter((v) => v === true).length;
    let finalUrgency = preliminaryResult.urgency_level;
    let finalColor = preliminaryResult.color_code;

    // Si respondió afirmativamente a signos vitales críticos, calibra a Urgente/Crítico
    if (affirmativeCount >= 2) {
      finalUrgency = 'CRITICO';
      finalColor = 'RED';
    } else if (affirmativeCount === 1 && finalUrgency === 'LEVE') {
      finalUrgency = 'MODERADO';
      finalColor = 'YELLOW';
    }

    const confirmedResult = {
      ...preliminaryResult,
      urgency_level: finalUrgency,
      color_code: finalColor,
      requires_immediate_hospitalization:
        finalUrgency === 'CRITICO' || affirmativeCount >= 2,
    };

    // 2. Persistencia en Supabase (triage_records)
    let persistentRecordId = `triage_${Date.now()}`;
    try {
      const { data: dbData, error: insertError } = await supabase
        .from('triage_records')
        .insert([
          {
            user_id: user?.id || null,
            species: especie,
            weight_kg: parseFloat(pesoKg),
            description: descripcion.trim(),
            urgency_level: confirmedResult.urgency_level,
            color_code: confirmedResult.color_code,
            visual_findings: confirmedResult.visual_findings,
            presumptive_diagnosis: confirmedResult.presumptive_diagnosis,
            first_aid_actions: confirmedResult.first_aid_actions,
            image_url: uploadedImageUrl,
          },
        ])
        .select();

      if (insertError) {
        console.warn('[Supabase Insert Error]:', insertError.message);
      } else if (dbData && dbData[0]?.id) {
        persistentRecordId = dbData[0].id;
        console.log('[Supabase Insert]: Registro de triaje guardado con ID:', persistentRecordId);
      }
    } catch (dbErr) {
      console.warn('[Supabase Insert Exception]:', dbErr);
    }

    confirmedResult.record_id = persistentRecordId;
    confirmedResult.id = persistentRecordId;

    // Transición visual a Resultados y Desbloqueo del Mapa
    setDiagnosisResult(confirmedResult);
    setStep('result');
    setLoading(false);

    if (onDiagnosisComplete) {
      onDiagnosisComplete(confirmedResult, parseFloat(pesoKg), especie);
    }
  };

  const handleReset = () => {
    setDiagnosisResult(null);
    setPreliminaryResult(null);
    setUploadedImageUrl(null);
    setTestAnswers({ respiratory: null, mucosa: null, consciousness: null });
    setStep('form');
    setNetworkError('');
    setValidationError('');
  };

  // Tema visual activo
  const activeUrgencyKey =
    diagnosisResult?.urgency_level?.toUpperCase() ||
    diagnosisResult?.color_code?.toUpperCase() ||
    'MODERADO';
  const theme = URGENCY_THEMES[activeUrgencyKey] || URGENCY_THEMES.MODERADO;
  const UrgencyIcon = theme.icon;

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* PASO 1: FORMULARIO DE INGRESO DE DATOS Y CARGA DE FOTOGRAFÍA */}
      {/* ============================================================ */}
      {step === 'form' && (
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
              <div className="flex items-start space-x-3 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs sm:text-sm shadow-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-rose-950">Aviso en la Evaluación</h5>
                  <p className="text-rose-800 mt-0.5 leading-relaxed">{networkError}</p>
                </div>
              </div>
            )}

            {/* 1. Species & Weight Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Especie del Paciente <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEspecie('Perro (Canino)')}
                    className={`py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition cursor-pointer ${
                      especie.includes('Perro')
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🐕</span>
                    <span>Perro (Canino)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEspecie('Gato (Felino)')}
                    className={`py-3 px-4 rounded-xl border font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition cursor-pointer ${
                      especie.includes('Gato')
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🐈</span>
                    <span>Gato (Felino)</span>
                  </button>
                </div>
              </div>

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

            {/* 2. Photo Upload & Preview with Photo Tips Accordion */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Fotografía de la Evidencia Visible <span className="text-rose-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsGuidanceModalOpen(true)}
                  className="text-xs text-rose-600 font-bold hover:text-rose-700 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Guía Completa de Fotos</span>
                </button>
              </div>

              {/* Accordion: Consejos para una foto diagnóstica precisa */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl overflow-hidden transition">
                <div
                  onClick={() => setIsGuidanceOpen(!isGuidanceOpen)}
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-amber-50/90"
                >
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-950">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Consejos para una foto diagnóstica precisa (Vómito, Mucosas y Heridas)</span>
                  </div>
                  <button type="button" className="text-amber-800 p-1">
                    {isGuidanceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {isGuidanceOpen && (
                  <div className="p-4 pt-1 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 space-y-1">
                      <div className="font-bold text-amber-900 flex items-center space-x-1">
                        <span>🧪</span>
                        <span>Muestras (Vómito/Heces)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Foto cenital (desde arriba a 90°) con buena luz natural. Evita el flash reflejado sobre líquidos.
                      </p>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 space-y-1">
                      <div className="font-bold text-amber-900 flex items-center space-x-1">
                        <span>👄</span>
                        <span>Mucosas / Ojos</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Foto nítida a 15 cm levantando con calma el belfo dental para ver coloración de encías (rosada, pálida o azul).
                      </p>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 space-y-1">
                      <div className="font-bold text-amber-900 flex items-center space-x-1">
                        <span>🩹</span>
                        <span>Piel / Heridas</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Estrategia doble: Una toma cercana (macro) enfocada en los bordes + toma amplia de contexto anatómico.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Dropzone or Image Preview */}
              {!previewUrl ? (
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-2xl p-6 bg-slate-50/60 text-center transition flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100/70 text-rose-600 flex items-center justify-center shadow-xs">
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

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs flex items-center space-x-2 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-rose-400" />
                      <span>Tomar Foto con Cámara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-2xs flex items-center space-x-2 transition cursor-pointer"
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
                    title="Eliminar o cambiar fotografía"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

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
                  <span>Analizando imagen y síntomas con IA clínica...</span>
                </>
              ) : (
                <>
                  <HeartPulse className="w-5 h-5" />
                  <span>Evaluar Triage de Urgencias</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* PASO 2: TEST CLÍNICO RÁPIDO DE CONFIRMACIÓN (3 PREGUNTAS SÍ/NO) */}
      {/* ============================================================ */}
      {step === 'confirm_test' && preliminaryResult && (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-rose-200 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="space-y-2 border-b border-slate-100 pb-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
              <span>Paso de Validación Médica</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Test Clínico Rápido de Confirmación (3 preguntas)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              La IA ha evaluado la muestra como <strong>{preliminaryResult.urgency_level}</strong>. Responde estas 3 preguntas rápidas de inspección física para confirmar con máxima precisión el semáforo final y desbloquear el protocolo de urgencias.
            </p>
          </div>

          {/* Interactive Sí / No Cards */}
          <div className="space-y-4">
            {testQuestions.map((item, idx) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 transition hover:border-slate-300"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                    {item.question}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 pl-10">
                  <button
                    type="button"
                    onClick={() => setTestAnswers((prev) => ({ ...prev, [item.id]: true }))}
                    className={`py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                      testAnswers[item.id] === true
                        ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Sí</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTestAnswers((prev) => ({ ...prev, [item.id]: false }))}
                    className={`py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                      testAnswers[item.id] === false
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>No</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {Object.values(testAnswers).filter((v) => v !== null).length} de 3 respondidas
            </span>

            <button
              type="button"
              onClick={handleConfirmPronostico}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fijando diagnóstico en Supabase...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmar Pronóstico y Desbloquear Mapa</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PASO 3: VEREDICTO DE IA DESPLEGADO + DESBLOQUEO DEL MAPA      */}
      {/* ============================================================ */}
      {step === 'result' && diagnosisResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Card Destacada con Semáforo Clínico */}
          <div
            className={`bg-white rounded-3xl shadow-md border-2 ${theme.border} overflow-hidden space-y-6 transition-all duration-300 ${
              theme.pulse ? 'ring-4 ring-rose-500/20' : ''
            }`}
            style={{ borderColor: theme.color }}
          >
            {/* Banner superior de severidad con animación de pulso */}
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
                    <span style={{ color: theme.color }}>Semáforo de Triage Clínico Confirmado</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-semibold">{theme.sublabel}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {theme.label}
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{diagnosisResult.vet_consultation_timeframe}</span>
                </span>
              </div>
            </div>

            <div className="px-6 sm:px-8 space-y-6">
              {/* Diagnóstico Presuntivo & Hallazgos Visuales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diagnóstico Presuntivo */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Diagnóstico Presuntivo
                    </h4>
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {diagnosisResult.presumptive_diagnosis || 'Evaluación de urgencia en proceso'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Hipótesis diagnóstica generada por visión computacional multimodal.
                  </p>
                </div>

                {/* Hallazgos Visuales */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs space-y-2">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Hallazgos Visuales Detectados
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {diagnosisResult.visual_findings || 'Análisis de imagen completado con éxito.'}
                  </p>
                </div>
              </div>

              {/* Recomendación de Centro de Atención y Tiempo Estimado */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-[10px] uppercase font-black tracking-wider text-rose-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Recomendación de Derivación Médica</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-extrabold text-white">
                    {diagnosisResult.facility_recommendation ||
                      (theme.label?.includes('CRÍTICO')
                        ? 'Hospital Veterinario de Urgencias 24H (UCI & Cirugía)'
                        : 'Clínica Veterinaria General')}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Acude al centro médico especializado más cercano sin demoras.
                  </p>
                </div>

                <div className="flex items-center space-x-2 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 self-start sm:self-auto">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Ventana de Atención</span>
                    <span className="font-extrabold text-amber-300">
                      {diagnosisResult.vet_consultation_timeframe || 'Inmediata'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Riesgos Vitales Detectados */}
              {diagnosisResult.vital_risks && diagnosisResult.vital_risks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Riesgos Vitales y Complicaciones a Monitorear
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {diagnosisResult.vital_risks.map((risk, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs sm:text-sm font-semibold shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                        <span className="leading-snug">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primeros Auxilios Inmediatos Sugeridos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center space-x-2">
                    <span>Pautas de Primeros Auxilios Inmediatos</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {diagnosisResult.first_aid_actions?.length || 0} pautas prioritarias
                  </span>
                </div>

                <div className="space-y-3">
                  {diagnosisResult.first_aid_actions?.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3.5 p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 shadow-2xs hover:border-slate-300 transition"
                    >
                      <div
                        className="w-7 h-7 rounded-xl text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: theme.color }}
                      >
                        {idx + 1}
                      </div>
                      <span className="leading-relaxed font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asistente de Primeros Auxilios con IA */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <HeartPulse className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                          <span>Asistente IA en Vivo</span>
                        </span>
                        <span className="text-xs text-slate-400">• Orientación 24/7</span>
                      </div>
                      <h4 className="font-extrabold text-base sm:text-lg text-white mt-1">
                        ¿Dudas sobre cómo aplicar los primeros auxilios?
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                        Conversa en tiempo real con el Asistente Clínico de VetIA manteniendo todo el contexto, antecedentes y fotografías de este triaje.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenChat && onOpenChat(diagnosisResult)}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2.5 transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-emerald-400/30"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-100" />
                  <span>Abrir Chat de Primeros Auxilios con la IA</span>
                </button>
              </div>
            </div>

            {/* Footer Reset Action */}
            <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Nueva Evaluación de Triage</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Paciente: {especie} • {pesoKg} kg • Resguardado en Supabase
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECCIÓN INMEDIATA DEL MAPA (DESBLOQUEADA JUSTO DEBAJO DEL DICTAMEN) */}
          {/* ============================================================ */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2 px-1">
              <MapPin className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-black text-lg sm:text-xl text-slate-900">
                Centros Veterinarios de Urgencias & Ruta en Tiempo Real
              </h3>
            </div>

            <EmergencyMap
              externalUserLocation={userCoordinates}
              urgencyLevel={diagnosisResult.urgency_level}
            />
          </div>
        </div>
      )}

      {/* Photo Guidance Detail Modal */}
      <PhotoGuidanceModal
        isOpen={isGuidanceModalOpen}
        onClose={() => setIsGuidanceModalOpen(false)}
      />
    </div>
  );
}

export default TriageEvaluator;
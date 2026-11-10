import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, Cpu, Loader2, Sparkles } from 'lucide-react';

const PET_SPECIES_OPTIONS = [
  { value: 'Perro (Canino)', label: '🐕 Perro (Canino)' },
  { value: 'Gato (Felino)', label: '🐈 Gato (Felino)' },
  { value: 'Conejo / Pequeño Mamífero', label: '🐇 Conejo / Pequeño Mamífero' },
  { value: 'Ave', label: '🦜 Ave' },
  { value: 'Reptil', label: '🦎 Reptil' },
  { value: 'Otro', label: '🐾 Otro' },
];

export function ImageUploadForm({ onSubmit, loading, isCompressing }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [petType, setPetType] = useState('Perro (Canino)');
  const [symptomsDescription, setSymptomsDescription] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelection = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError('Por favor selecciona un archivo de imagen válido (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setValidationError('La imagen no debe superar los 20MB.');
      return;
    }

    setValidationError('');
    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setValidationError('Por favor sube una fotografía clara de la lesión o zona afectada.');
      return;
    }

    if (!symptomsDescription.trim()) {
      setValidationError('Por favor describe los síntomas y comportamiento que observas en tu mascota.');
      return;
    }

    setValidationError('');
    onSubmit({
      file: selectedFile,
      petType,
      symptomsDescription: symptomsDescription.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#162420] rounded-2xl shadow-xs border border-[#DCE6E0] dark:border-[#233630] overflow-hidden"
    >
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-[#176B55] dark:text-[#45A987] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#176B55]" />
            <span>Triaje Inteligente Multimodal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#123B32] dark:text-white tracking-tight">
            Consulta de Triaje de Emergencia
          </h2>
          <p className="text-sm text-[#66756F] dark:text-[#A3B8B0] mt-1">
            Sube una fotografía de la lesión o síntoma visible y describe el estado actual de tu mascota para una evaluación con IA en tiempo real.
          </p>
        </div>

        {validationError && (
          <div className="flex items-center space-x-2 p-3.5 bg-[#FDECEE] border border-[#C83D4D]/30 rounded-xl text-[#C83D4D] text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#C83D4D]" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 1. Pet Species Selection */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2D29] dark:text-slate-200 mb-2">
            1. Tipo de Mascota / Especie <span className="text-[#C83D4D]">*</span>
          </label>
          <select
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#0F1A17] text-[#1F2D29] dark:text-white text-sm focus:ring-2 focus:ring-[#176B55] focus:border-[#176B55] outline-none transition"
          >
            {PET_SPECIES_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Image Drop Zone & Preview */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2D29] dark:text-slate-200 mb-2">
            2. Fotografía de la Evidencia Visible <span className="text-[#C83D4D]">*</span>
          </label>

          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-[#176B55] bg-[#EAF3F0]'
                  : 'border-[#DCE6E0] hover:border-[#176B55] bg-[#F4F7F5] dark:bg-[#0F1A17]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#EAF3F0] border border-[#DCE6E0] flex items-center justify-center text-[#176B55] mb-3 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-[#1F2D29] dark:text-white">
                Arrastra y suelta tu foto aquí, o{' '}
                <span className="text-[#176B55] underline font-semibold">explora tus archivos</span>
              </p>
              <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] mt-1">
                Formatos compatibles: JPG, PNG, WebP (hasta 20MB). Compresión automática con Web Worker.
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#0F1A17] max-h-80 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Vista previa de la lesión o estado"
                className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
              />
              <button
                type="button"
                onClick={clearSelectedFile}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition shadow-md"
                title="Cambiar fotografía"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelection(e.target.files[0]);
              }
            }}
          />
        </div>

        {/* 3. Symptoms Description */}
        <div>
          <label className="block text-sm font-semibold text-[#1F2D29] dark:text-slate-200 mb-2">
            3. Síntomas y Comportamiento Observado <span className="text-[#C83D4D]">*</span>
          </label>
          <textarea
            rows={4}
            value={symptomsDescription}
            onChange={(e) => setSymptomsDescription(e.target.value)}
            disabled={loading}
            placeholder="Describe qué ocurrió, hace cuánto tiempo comenzaron los síntomas, cambios de respiración, vómitos, postura de dolor o sangrado..."
            className="w-full px-4 py-3 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#0F1A17] text-[#1F2D29] dark:text-white text-sm placeholder:text-[#66756F] focus:ring-2 focus:ring-[#176B55] focus:border-[#176B55] outline-none transition"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-[#F4F7F5] dark:bg-[#162420] px-6 sm:px-8 py-4 border-t border-[#DCE6E0] dark:border-[#233630] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-[#66756F] dark:text-[#A3B8B0]">
          <Cpu className="w-4 h-4 text-[#66756F]" />
          <span>Procesamiento Multimodal + Gemini 2.5 Flash</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-7 bg-[#176B55] hover:bg-[#135846] shadow-xs text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>
                {isCompressing
                  ? 'Optimizando imagen (Web Worker)...'
                  : 'Analizando con Gemini 2.5 Flash...'}
              </span>
            </>
          ) : (
            <>
              <span>Evaluar Severidad de Triaje</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default ImageUploadForm;

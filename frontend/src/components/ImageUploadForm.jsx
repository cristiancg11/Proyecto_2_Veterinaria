import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, Cpu, Loader2 } from 'lucide-react';

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
      setValidationError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setValidationError('Image size must be smaller than 20MB.');
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
      setValidationError('Please upload a clear photograph of the lesion or affected area.');
      return;
    }

    if (!symptomsDescription.trim()) {
      setValidationError('Please describe the observed symptoms and pet behavior.');
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Emergency Triage Consultation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload a clear image of the lesion/symptom and describe your pet's current condition.
          </p>
        </div>

        {validationError && (
          <div className="flex items-center space-x-2 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Image Drop Zone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            1. Evidence Photograph <span className="text-rose-500">*</span>
          </label>

          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-rose-500 bg-rose-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-800">
                Drag and drop your photo here, or <span className="text-rose-600 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WebP up to 20MB (client-side compressed via Web Worker)
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-80 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Selected pet condition"
                className="max-h-72 w-auto object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={clearSelectedFile}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition"
                title="Remove photo"
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

        {/* Pet Species Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            2. Pet Species / Classification <span className="text-rose-500">*</span>
          </label>
          <select
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
          >
            {PET_SPECIES_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Symptoms Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            3. Observed Symptoms & Behavior <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={symptomsDescription}
            onChange={(e) => setSymptomsDescription(e.target.value)}
            disabled={loading}
            placeholder="Describe what happened, how long the symptoms have been present, changes in posture, pain level, vomiting, appetite or breathing issues..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Cpu className="w-4 h-4 text-slate-400" />
          <span>Multithreaded Web Worker Preprocessing + Gemini 2.5 Flash</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-sm shadow-md shadow-rose-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>
                {isCompressing
                  ? 'Compressing (Web Worker)...'
                  : 'Analyzing with Gemini 2.5 Flash...'}
              </span>
            </>
          ) : (
            <>
              <span>Evaluate Triage Urgency</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default ImageUploadForm;

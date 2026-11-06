import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  AlertCircle,
  Database,
  RefreshCw,
  HeartPulse,
  Scale,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import ClinicalSheetModal from './ClinicalSheetModal';

export function HistoryModal({ isOpen, onClose, history = [], onRefresh = null }) {
  const [supabaseRecords, setSupabaseRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  // Selected record for full clinical referral sheet
  const [selectedRecordForSheet, setSelectedRecordForSheet] = useState(null);

  const fetchSupabaseHistory = useCallback(async () => {
    setLoading(true);
    setQueryError(null);
    try {
      const { data, error } = await supabase
        .from('triage_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[HistoryModal] Error querying Supabase triage_records:', error.message);
        setQueryError(error.message);
      } else if (data) {
        setSupabaseRecords(data);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.warn('[HistoryModal] Exception querying Supabase:', err);
      setQueryError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (isOpen) {
      fetchSupabaseHistory();
    }
  }, [isOpen, fetchSupabaseHistory]);

  if (!isOpen) return null;

  const combinedRecords = supabaseRecords.length > 0 ? supabaseRecords : history;

  // Prepare normalized diagnosis object for ClinicalSheetModal
  const sheetDiagnosis = selectedRecordForSheet
    ? {
        record_id: selectedRecordForSheet.id || 'caso-guardado',
        urgency_level: selectedRecordForSheet.urgency_level || 'MODERADO',
        color_code: selectedRecordForSheet.color_code || 'YELLOW',
        preliminary_assessment:
          selectedRecordForSheet.presumptive_diagnosis ||
          selectedRecordForSheet.visual_findings ||
          selectedRecordForSheet.preliminary_assessment ||
          'Evaluación clínica completada.',
        immediate_care_tips:
          selectedRecordForSheet.first_aid_actions ||
          selectedRecordForSheet.immediate_care_tips || [
            'Reposo inmediato en área ventilada.',
            'No administrar fármacos de uso humano.',
            'Atención veterinaria presencial recomendada.',
          ],
        recommended_facility_type:
          selectedRecordForSheet.recommended_facility_type || 'Hospital de Urgencias 24 Horas',
        image_url: selectedRecordForSheet.image_url,
        created_at: selectedRecordForSheet.created_at,
        warning_disclaimer:
          selectedRecordForSheet.warning_disclaimer ||
          'VetIA proporciona una guía orientativa de triaje basada en IA y no reemplaza la evaluación clínica directa de un médico veterinario colegiado.',
      }
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
        <div className="bg-white w-full max-w-xl min-h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Historial de Consultas de Triage</h3>
                <p className="text-xs text-slate-500">
                  Base de datos en tiempo real Supabase (`triage_records`)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={fetchSupabaseHistory}
                disabled={loading}
                title="Actualizar historial"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {queryError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Aviso de sincronización Supabase: {queryError}</span>
              </div>
            )}

            {loading && combinedRecords.length === 0 ? (
              <div className="text-center py-16 px-4">
                <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Cargando consultas anteriores desde Supabase...</p>
              </div>
            ) : combinedRecords.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-700 text-sm">No hay consultas registradas</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Las evaluaciones de triaje analizadas por la IA se guardarán automáticamente en tu expediente con su evidencia gráfica.
                </p>
              </div>
            ) : (
              combinedRecords.map((record, index) => {
                const urgency = (record.urgency_level || 'MODERADO').toUpperCase();
                const badgeStyle = {
                  CRITICO: 'bg-red-100 text-red-700 border-red-200',
                  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
                  RED: 'bg-red-100 text-red-700 border-red-200',
                  URGENTE: 'bg-orange-100 text-orange-700 border-orange-200',
                  ORANGE: 'bg-orange-100 text-orange-700 border-orange-200',
                  MODERADO: 'bg-amber-100 text-amber-800 border-amber-200',
                  MODERATE: 'bg-amber-100 text-amber-800 border-amber-200',
                  YELLOW: 'bg-amber-100 text-amber-800 border-amber-200',
                  LEVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  MILD: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  GREEN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                }[urgency] || 'bg-slate-100 text-slate-700 border-slate-200';

                const formattedDate = record.created_at
                  ? new Date(record.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Reciente';

                const speciesName = record.species || record.pet_type || 'Mascota';
                const descriptionText = record.description || record.symptoms_description || 'Sin descripción';
                const assessmentText =
                  record.presumptive_diagnosis ||
                  record.visual_findings ||
                  record.presumptive_analysis ||
                  record.preliminary_assessment ||
                  'Evaluación completada.';

                return (
                  <div
                    key={record.id || index}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                      >
                        {urgency}
                      </span>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3 items-start">
                      {record.image_url ? (
                        <img
                          src={record.image_url}
                          alt="Evidencia clínica"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0 bg-slate-100 shadow-2xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-400 flex flex-col items-center justify-center text-[10px] font-semibold flex-shrink-0 border border-slate-200">
                          <ImageIcon className="w-5 h-5 text-slate-400 mb-0.5" />
                          <span>Sin foto</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900 text-sm truncate">
                            {speciesName}
                          </h5>
                          {record.weight_kg && (
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Scale className="w-3 h-3 text-slate-400" />
                              <span>{record.weight_kg} kg</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                          {descriptionText}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed line-clamp-2">
                      <span className="font-bold text-slate-900">Diagnóstico: </span>
                      {assessmentText}
                    </div>

                    {/* Botón Ver Ficha Completa */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedRecordForSheet(record)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>Ver Ficha Completa</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {combinedRecords.length} registros en Supabase
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Referral Sheet Modal for full inspection & PDF printing */}
      {selectedRecordForSheet && (
        <ClinicalSheetModal
          isOpen={!!selectedRecordForSheet}
          onClose={() => setSelectedRecordForSheet(null)}
          diagnosis={sheetDiagnosis}
          petType={selectedRecordForSheet.species || selectedRecordForSheet.pet_type || 'Mascota'}
        />
      )}
    </>
  );
}

export default HistoryModal;
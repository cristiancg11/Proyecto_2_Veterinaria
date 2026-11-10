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
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import ClinicalSheetModal from './ClinicalSheetModal';
import generateTriagePDF from '../utils/generateTriagePDF';

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex justify-end transition-opacity">
        <div className="bg-white dark:bg-[#162420] w-full max-w-xl min-h-screen shadow-2xl border-l border-[#DCE6E0] dark:border-[#233630] flex flex-col animate-in slide-in-from-right duration-300 gpu-composite">
          {/* Modal Header */}
          <div className="p-6 border-b border-[#DCE6E0] dark:border-[#233630] flex items-center justify-between bg-[#F4F7F5] dark:bg-[#162420]">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-[#EAF3F0] text-[#176B55] rounded-xl shadow-xs border border-[#DCE6E0]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#123B32] dark:text-white text-lg">Historial de Consultas de Triage</h3>
                <p className="text-xs text-[#66756F] dark:text-[#A3B8B0]">
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
                className="p-2 rounded-xl text-[#66756F] hover:text-[#1F2D29] dark:hover:text-white hover:bg-white dark:hover:bg-[#1F2D29] transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 transition-all duration-200 ${loading ? 'animate-spin text-[#176B55]' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#66756F] hover:text-[#1F2D29] dark:hover:text-white hover:bg-white dark:hover:bg-[#1F2D29] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {queryError && (
              <div className="p-3 bg-[#FFF9F2] dark:bg-[#2A2114] border border-[#D77926]/30 rounded-xl text-[#D77926] text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-[#D77926] flex-shrink-0" />
                <span>Aviso de sincronización Supabase: {queryError}</span>
              </div>
            )}

            {loading && combinedRecords.length === 0 ? (
              <div className="space-y-3 py-6" aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="animate-pulse rounded-2xl border border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#0F1A17] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-28 rounded-full bg-[#176B55]/20" />
                      <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
                <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] text-center">Cargando consultas anteriores desde Supabase...</p>
              </div>
            ) : combinedRecords.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-12 h-12 rounded-full bg-[#F4F7F5] dark:bg-[#0F1A17] text-[#66756F] flex items-center justify-center mx-auto mb-3 border border-[#DCE6E0] dark:border-[#233630]">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-[#123B32] dark:text-white text-sm">No hay consultas registradas</h4>
                <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] mt-1 max-w-xs mx-auto">
                  Las evaluaciones de triaje analizadas por la IA se guardarán automáticamente en tu expediente con su evidencia gráfica.
                </p>
              </div>
            ) : (
              combinedRecords.map((record, index) => {
                const urgency = (record.urgency_level || 'MODERADO').toUpperCase();
                const badgeStyle = {
                  CRITICO: 'bg-[#FDECEE] text-[#C83D4D] border-[#C83D4D]/30',
                  CRITICAL: 'bg-[#FDECEE] text-[#C83D4D] border-[#C83D4D]/30',
                  RED: 'bg-[#FDECEE] text-[#C83D4D] border-[#C83D4D]/30',
                  URGENTE: 'bg-[#FFF4EB] text-[#D77926] border-[#D77926]/30',
                  ORANGE: 'bg-[#FFF4EB] text-[#D77926] border-[#D77926]/30',
                  MODERADO: 'bg-[#FFF9F2] text-[#A97812] border-[#A97812]/30',
                  MODERATE: 'bg-[#FFF9F2] text-[#A97812] border-[#A97812]/30',
                  YELLOW: 'bg-[#FFF9F2] text-[#A97812] border-[#A97812]/30',
                  LEVE: 'bg-[#EAF3F0] text-[#27825D] border-[#27825D]/30',
                  MILD: 'bg-[#EAF3F0] text-[#27825D] border-[#27825D]/30',
                  GREEN: 'bg-[#EAF3F0] text-[#27825D] border-[#27825D]/30',
                }[urgency] || 'bg-[#F4F7F5] text-[#66756F] border-[#DCE6E0]';

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
                    className="p-4 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#1F2D29]/40 hover:border-[#176B55]/50 transition shadow-xs space-y-3 render-pipeline-contain gpu-composite"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}
                      >
                        {urgency}
                      </span>
                      <div className="flex items-center space-x-1.5 text-xs text-[#66756F] dark:text-[#A3B8B0]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3 items-start">
                      {record.image_url ? (
                        <img
                          src={record.image_url}
                          alt="Evidencia clínica"
                          className="w-16 h-16 rounded-xl object-cover border border-[#DCE6E0] dark:border-[#233630] flex-shrink-0 bg-[#F4F7F5] dark:bg-[#0F1A17] shadow-xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#F4F7F5] dark:bg-[#0F1A17] text-[#66756F] flex flex-col items-center justify-center text-[10px] font-semibold flex-shrink-0 border border-[#DCE6E0] dark:border-[#233630]">
                          <ImageIcon className="w-5 h-5 text-[#66756F] mb-0.5" />
                          <span>Sin foto</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-[#123B32] dark:text-white text-sm truncate">
                            {speciesName}
                          </h5>
                          {record.weight_kg && (
                            <span className="text-[11px] font-semibold text-[#176B55] bg-[#EAF3F0] border border-[#DCE6E0] dark:border-[#233630] px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Scale className="w-3 h-3 text-[#176B55]" />
                              <span>{record.weight_kg} kg</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#66756F] dark:text-[#A3B8B0] line-clamp-2 mt-1">
                          {descriptionText}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-[#1F2D29] dark:text-slate-200 bg-[#F4F7F5] dark:bg-[#0F1A17] p-3 rounded-xl border border-[#DCE6E0] dark:border-[#233630] leading-relaxed line-clamp-2">
                      <span className="font-bold text-[#176B55]">Diagnóstico: </span>
                      {assessmentText}
                    </div>

                    {/* Botones: Descargar PDF e Inspeccionar Ficha Completa */}
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          generateTriagePDF({
                            ...record,
                            species: speciesName,
                            pet_type: speciesName,
                            weight_kg: record.weight_kg,
                            peso_kg: record.weight_kg,
                            description: descriptionText,
                            symptoms_description: descriptionText,
                            urgency_level: record.urgency_level,
                            color_code: record.color_code,
                            presumptive_diagnosis: assessmentText,
                            visual_findings: record.visual_findings || assessmentText,
                            first_aid_actions: record.first_aid_actions || [
                              'Reposo en área templada y ventilada.',
                              'No suministrar medicamentos sin aval veterinario.',
                              'Traslado a centro de atención presencial.',
                            ],
                            record_id: record.id,
                            created_at: record.created_at,
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#176B55] bg-[#EAF3F0] hover:bg-[#D5E8E1] text-[#176B55] text-xs font-bold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                        title="Re-descargar Ficha Clínica en PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-[#176B55]" />
                        <span>Descargar PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRecordForSheet(record)}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#162420] border border-[#DCE6E0] dark:border-[#233630] hover:bg-[#F4F7F5] text-[#1F2D29] dark:text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#176B55]" />
                        <span>Ver Ficha Completa</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 border-t border-[#DCE6E0] dark:border-[#233630] bg-[#F4F7F5] dark:bg-[#162420] flex items-center justify-between">
            <span className="text-xs text-[#66756F] dark:text-[#A3B8B0]">
              {combinedRecords.length} registros en Supabase
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
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
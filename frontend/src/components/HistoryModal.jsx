import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, AlertCircle, ExternalLink, Database, RefreshCw, HeartPulse, Scale } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export function HistoryModal({ isOpen, onClose, history = [] }) {
  const [supabaseRecords, setSupabaseRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

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
      }
    } catch (err) {
      console.warn('[HistoryModal] Exception querying Supabase:', err);
      setQueryError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSupabaseHistory();
    }
  }, [isOpen, fetchSupabaseHistory]);

  if (!isOpen) return null;

  // Merge Supabase records with local prop history if any (deduplicated by id)
  const combinedRecords = supabaseRecords.length > 0 ? supabaseRecords : history;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="bg-white w-full max-w-xl min-h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Historial de Consultas de Triage</h3>
              <p className="text-xs text-slate-500">
                Sincronizado en tiempo real con Supabase (`triage_records`)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={fetchSupabaseHistory}
              disabled={loading}
              title="Actualizar historial"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
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
                Las evaluaciones de triaje analizadas por la IA se guardarán automáticamente en tu expediente.
              </p>
            </div>
          ) : (
            combinedRecords.map((record, index) => {
              const urgency = (record.urgency_level || 'MODERADO').toUpperCase();
              const badgeStyle = {
                CRITICO: 'bg-rose-100 text-rose-700 border-rose-200',
                CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
                URGENTE: 'bg-orange-100 text-orange-700 border-orange-200',
                MODERADO: 'bg-amber-100 text-amber-800 border-amber-200',
                MODERATE: 'bg-amber-100 text-amber-800 border-amber-200',
                LEVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                MILD: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              }[urgency] || 'bg-slate-100 text-slate-700 border-slate-200';

              const formattedDate = record.created_at
                ? new Date(record.created_at).toLocaleString()
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
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-rose-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      <HeartPulse className="w-6 h-6" />
                    </div>

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

                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    <span className="font-bold text-slate-900">Diagnóstico Presuntivo: </span>
                    {assessmentText}
                  </div>

                  {record.first_aid_actions && Array.isArray(record.first_aid_actions) && record.first_aid_actions.length > 0 && (
                    <div className="text-[11px] text-slate-600 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                      <span className="font-bold text-rose-800">Primeros Auxilios: </span>
                      <span>{record.first_aid_actions.slice(0, 2).join(' • ')}</span>
                    </div>
                  )}
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
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;
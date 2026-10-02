import React from 'react';
import { X, Calendar, AlertCircle, ExternalLink, Database } from 'lucide-react';

export function HistoryModal({ isOpen, onClose, history = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="bg-white w-full max-w-xl min-h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Triage Audit History</h3>
              <p className="text-xs text-slate-500">
                Backed in Supabase PostgreSQL & Cloud Storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">No historical records found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Completed triage consultations and evidence photos will appear here automatically.
              </p>
            </div>
          ) : (
            history.map((record, index) => {
              const urgency = record.urgency_level || 'MODERATE';
              const badgeStyle = {
                CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
                MODERATE: 'bg-amber-100 text-amber-800 border-amber-200',
                MILD: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              }[urgency] || 'bg-slate-100 text-slate-700 border-slate-200';

              const formattedDate = record.created_at
                ? new Date(record.created_at).toLocaleString()
                : 'Just now';

              return (
                <div
                  key={record.id || index}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3"
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
                        alt="Pet evidence"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0 bg-slate-100"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        No Img
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-900 text-sm truncate">
                        {record.pet_type || 'Mascota'}
                      </h5>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                        {record.symptoms_description || 'Sin descripción'}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                    <span className="font-semibold text-slate-800">Evaluación: </span>
                    {record.preliminary_assessment}
                  </div>

                  {record.image_url && (
                    <div className="flex justify-end pt-1">
                      <a
                        href={record.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-rose-600 font-semibold hover:underline flex items-center space-x-1"
                      >
                        <span>Inspect Stored Image</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistoryModal;

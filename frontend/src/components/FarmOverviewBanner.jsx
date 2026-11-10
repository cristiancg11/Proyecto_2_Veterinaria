import React from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { translations } from '../data/translations';
import {
  CloudRain,
  ShieldAlert,
  BookOpen,
  ClipboardList,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  HeartPulse,
  Info,
} from 'lucide-react';

export function FarmOverviewBanner({
  historyCount = 0,
  userName = '',
  onOpenFieldFirstAid,
  onOpenHistory,
}) {
  const { language } = usePreferences();
  const t = translations[language] || translations.es;
  return (
    <div className="space-y-4">
      {/* Main Grid: Alerta Sanitaria Estacional + Panel de Métricas Zootécnicas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Banner de Alerta Sanitaria Estacional (Col 8) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#162420] rounded-2xl p-6 sm:p-7 text-[#1F2D29] dark:text-[#E8EFEA] shadow-xs border border-[#DCE6E0] dark:border-[#233630] flex flex-col justify-between space-y-5">
          {/* Top Row: Badge & Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EAF3F0] dark:bg-[#1F332C] text-[#176B55] dark:text-[#45A987] border border-[#DCE6E0] dark:border-[#233630] text-[11px] font-bold uppercase tracking-wider">
                <CloudRain className="w-3.5 h-3.5 text-[#176B55] dark:text-[#45A987]" />
                <span>{t.seasonal_alert}</span>
              </span>
              <span className="text-[11px] text-[#66756F] dark:text-[#95A59F] font-medium">
                {t.livestock_region}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#123B32] dark:text-[#E8EFEA] tracking-tight">
              {t.active_field_prevention}
            </h3>

            <p className="text-xs sm:text-sm text-[#1F2D29] dark:text-[#C5D2CD] leading-relaxed max-w-2xl">
              {t.banner_desc}
            </p>
          </div>

          {/* Key Quick Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#F4F7F5] dark:bg-[#1B2C27] border border-[#DCE6E0] dark:border-[#233630] space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#176B55] dark:text-[#45A987]">
                <span className="w-2 h-2 rounded-full bg-[#176B55] dark:bg-[#45A987]" />
                <span>{t.hoof_care_title}</span>
              </div>
              <p className="text-[11px] text-[#66756F] dark:text-[#C5D2CD] leading-snug">
                {t.hoof_care_desc}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F7F5] dark:bg-[#1B2C27] border border-[#DCE6E0] dark:border-[#233630] space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#A97812] dark:text-[#FDE047]">
                <span className="w-2 h-2 rounded-full bg-[#A97812]" />
                <span>{t.young_stock_title}</span>
              </div>
              <p className="text-[11px] text-[#66756F] dark:text-[#C5D2CD] leading-snug">
                {t.young_stock_desc}
              </p>
            </div>
          </div>

          {/* Action Button: Guía de Primeros Auxilios de Campo */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#DCE6E0] dark:border-[#233630]">
            <div className="text-xs text-[#66756F] dark:text-[#95A59F] flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-[#176B55] dark:text-[#45A987]" />
              <span>{t.support_guidelines}</span>
            </div>

            <button
              type="button"
              onClick={onOpenFieldFirstAid}
              className="px-5 py-2.5 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.first_aid_guide_btn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Panel Lateral: Contador de Expedientes Evaluados & Estado (Col 4) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#162420] rounded-2xl p-6 sm:p-7 border border-[#DCE6E0] dark:border-[#233630] shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#66756F] dark:text-[#95A59F]">
                Panel del Productor / Finca
              </span>
              <span className="w-2 h-2 rounded-full bg-[#176B55] dark:bg-[#45A987]" />
            </div>

            {/* Contador de Expedientes Evaluados */}
            <div className="p-4 rounded-xl bg-[#F4F7F5] dark:bg-[#1B2C27] border border-[#DCE6E0] dark:border-[#233630] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-[#66756F] dark:text-[#95A59F] uppercase tracking-wide block">
                  {t.cases_evaluated}
                </span>
                <div className="text-3xl font-black text-[#123B32] dark:text-[#E8EFEA] tracking-tight flex items-baseline space-x-1.5">
                  <span>{historyCount}</span>
                  <span className="text-xs font-semibold text-[#66756F] dark:text-[#95A59F]">casos clínicos</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-xl bg-[#EAF3F0] dark:bg-[#1F332C] text-[#176B55] dark:text-[#45A987] border border-[#DCE6E0] dark:border-[#233630] flex items-center justify-center shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>

            {/* Metadatos Rápidos */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#DCE6E0] dark:border-[#233630]">
                <span className="text-[#66756F] dark:text-[#95A59F] font-medium">Especies Habilitadas:</span>
                <span className="font-bold text-[#1F2D29] dark:text-[#E8EFEA]">8 Especies Rurales</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#DCE6E0] dark:border-[#233630]">
                <span className="text-[#66756F] dark:text-[#95A59F] font-medium">Inferencia Diagnóstica:</span>
                <span className="font-bold text-[#176B55] dark:text-[#45A987] flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Gemini 2.5 Multimodal</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#66756F] dark:text-[#95A59F] font-medium">Red de Atención:</span>
                <span className="font-bold text-[#1F2D29] dark:text-[#E8EFEA]">Clínicas & Almacenes Agro</span>
              </div>
            </div>
          </div>

          {/* Quick link to view history */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="w-full py-2.5 px-4 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#162420] hover:bg-[#F4F7F5] dark:hover:bg-[#1B2C27] text-[#176B55] dark:text-[#45A987] font-bold text-xs flex items-center justify-center space-x-1.5 transition-all duration-200 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>{t.case_history_btn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmOverviewBanner;


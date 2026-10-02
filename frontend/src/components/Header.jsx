import React from 'react';
import { Activity, History, ShieldAlert, HeartPulse } from 'lucide-react';

export function Header({ onOpenHistory, historyCount = 0 }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Vet<span className="text-rose-600">IA</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                PetEmergency
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Multimodal AI Veterinary Triage & Clinical Orientation
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition shadow-sm"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Audit History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {historyCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>AI Triage Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

import React from 'react';
import { History, HeartPulse, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ onOpenHistory, onOpenAuth, historyCount = 0 }) {
  const { user, signOut, isAuthenticated } = useAuth();

  const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Owner';

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
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-medium transition shadow-sm"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">My History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Authentication Status Button */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-200">
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                  {userInitial.toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate hidden md:inline">{userName}</span>
              </div>
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>AI Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

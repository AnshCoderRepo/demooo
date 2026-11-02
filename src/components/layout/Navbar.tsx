import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Bus, RotateCcw, Play, CheckCircle, Globe, Shield, 
  Menu, X, Sparkles, User, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC<{ onToggleMobileMenu: () => void; isMobileMenuOpen: boolean }> = ({ 
  onToggleMobileMenu, 
  isMobileMenuOpen 
}) => {
  const { 
    settings, 
    language, 
    setLanguage, 
    resetDemoData, 
    startTour, 
    isTourActive, 
    currentTourStep, 
    currentUser, 
    logout 
  } = useApp();
  
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div 
              onClick={() => navigate('/')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Bus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                    {settings.businessName}
                  </span>
                  <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">
                  {settings.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Center/Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Today Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>2 Nov 2026 (Live Ops)</span>
            </div>

            {/* Guided Tour Trigger Button */}
            <button
              onClick={startTour}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all ${
                isTourActive
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">
                {isTourActive ? `Guided Demo (${currentTourStep}/11)` : 'Start Guided Demo'}
              </span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Language Toggle (EN / हिंदी) */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
              title="Toggle Language EN / हिंदी"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'हिंदी' : 'EN'}</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700 hover:border-rose-800 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 transition-colors"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180" />
              <span className="hidden xl:inline">Reset Demo</span>
            </button>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-amber-400 font-bold text-xs">
                  DR
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-100">{currentUser.name}</div>
                  <div className="text-[10px] text-amber-400 font-medium">{currentUser.role}</div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <Shield className="w-3 h-3" /> Full Owner Privileges
                    </div>
                  </div>
                  <div className="px-2 py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Business Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/change-history');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Audit Trail
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 mt-1"
                    >
                      Sign Out (Return to Demo Login)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Reset Demo Data?</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              This will restore all 8 buses, 10 workers, 15 charter bookings, 40 route tickets, 40 expenses, and payments back to the original 2 November 2026 seed baseline.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  resetDemoData();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow transition-colors"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


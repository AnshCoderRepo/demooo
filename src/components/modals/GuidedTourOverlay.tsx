import React, { useEffect } from 'react';
import { useApp, GUIDED_TOUR_STEPS } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, ChevronRight, ChevronLeft, X, RotateCcw, 
  MapPin, CheckCircle2 
} from 'lucide-react';

export const GuidedTourOverlay: React.FC = () => {
  const { 
    isTourActive, 
    currentTourStep, 
    nextTourStep, 
    prevTourStep, 
    skipTour, 
    goToTourStep, 
    startTour 
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const currentStepData = GUIDED_TOUR_STEPS[currentTourStep - 1];

  // Auto-navigate to target screen if route doesn't match
  useEffect(() => {
    if (isTourActive && currentStepData) {
      if (location.pathname !== currentStepData.path) {
        navigate(currentStepData.path);
      }
    }
  }, [isTourActive, currentTourStep, currentStepData, location.pathname, navigate]);

  if (!isTourActive || !currentStepData) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[94%] bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl shadow-2xl p-4 sm:p-5 text-white animate-in slide-in-from-bottom-5">
      {/* Header with step pill & close */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs shadow">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Client Presentation Tour ({currentTourStep} of {GUIDED_TOUR_STEPS.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={startTour}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] flex items-center gap-1 px-1.5"
            title="Restart tour from Step 1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Restart</span>
          </button>
          <button
            onClick={skipTour}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            title="Dismiss Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tour Step Content */}
      <div>
        <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
          {currentStepData.title}
        </h4>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          {currentStepData.description}
        </p>

        {currentStepData.highlightAction && (
          <div className="mt-2.5 flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-300 font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span><strong>What to show:</strong> {currentStepData.highlightAction}</span>
          </div>
        )}
      </div>

      {/* Step Indicators & Actions */}
      <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {/* Step dots */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-[200px] sm:max-w-none">
          {GUIDED_TOUR_STEPS.map((s) => (
            <button
              key={s.step}
              onClick={() => goToTourStep(s.step)}
              className={`h-2 rounded-full transition-all ${
                s.step === currentTourStep
                  ? 'w-6 bg-amber-400'
                  : s.step < currentTourStep
                  ? 'w-2 bg-emerald-400'
                  : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
              title={`Go to step ${s.step}: ${s.title}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={prevTourStep}
            disabled={currentTourStep === 1}
            className="px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={nextTourStep}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow transition-colors"
          >
            <span>{currentTourStep === GUIDED_TOUR_STEPS.length ? 'Finish Tour' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};


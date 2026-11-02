import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bus, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('owner@demo.com');
  const [password, setPassword] = useState('demo123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-white animate-in zoom-in-95">
        {/* Logo and Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 mb-3">
            <Bus className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Deepak Raj Travels
          </h1>
          <p className="text-xs text-amber-400 font-semibold mt-0.5">
            Inter-State Bus Operating Business Admin
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Delhi HQ • Bihar & Siliguri Routes • Luxury Tourist Charters
          </p>
        </div>

        {/* Demo Credentials Pill */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6 text-xs text-amber-200">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Client Live Presentation Credentials:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
            <div>Email: <strong className="text-white">owner@demo.com</strong></div>
            <div>Password: <strong className="text-white">demo123</strong></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
            />
          </div>

          {/* One-Click Enter Demo Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Enter Demo as Owner (Admin)</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Feature Highlights */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>8 Luxury Buses Seeded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Interactive Sleeper Coach</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Automated GST & Refunds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Double-Booking Block</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mt-6 text-center">
        Demo Baseline Date: <strong>2 November 2026</strong> • All edits persist in localStorage
      </p>
    </div>
  );
};

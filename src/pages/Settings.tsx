import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, INDIAN_STATES } from '../utils/formatters';
import { 
  Settings as SettingsIcon, Save, RotateCcw, Bus, QrCode, 
  Printer, CheckCircle2, Sliders, FileText, Smartphone 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetDemoData, showToast } = useApp();

  const [formData, setFormData] = useState({ ...settings });

  const handleToggle = (field: 'showPassengerId' | 'showFareBreakup' | 'showGstLines') => {
    const updated = {
      ...formData,
      ticketSettings: {
        ...formData.ticketSettings,
        [field]: !formData.ticketSettings[field],
      },
    };
    setFormData(updated);
    updateSettings(updated);
  };

  const handlePaperSizeChange = (paperSize: 'A4' | 'thermal') => {
    const updated = {
      ...formData,
      ticketSettings: {
        ...formData.ticketSettings,
        paperSize,
      },
    };
    setFormData(updated);
    updateSettings(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    showToast({
      type: 'success',
      title: 'Business Configuration Saved',
      message: 'Ticket printing parameters and billing details updated.',
    });
  };

  const isThermal = formData.ticketSettings.paperSize === 'thermal';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Settings & Live Ticket Designer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Interactive Customization
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure business identity, print toggles, terms & conditions, and inspect the real-time live ticket preview on the right.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDemoData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 text-xs font-bold transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: Controls on Left, Live Ticket Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Ticket Print Toggles Card */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  Ticket Display Field Toggles (Watch Live Preview →)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Toggle 1: Passenger ID */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">Show Passenger ID Proof</span>
                    <span className="text-[10px] text-slate-500">Aadhaar / Voter ID column</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.ticketSettings.showPassengerId}
                    onChange={() => handleToggle('showPassengerId')}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                {/* Toggle 2: Fare Breakup */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">Show Base Fare Breakup</span>
                    <span className="text-[10px] text-slate-500">Seat rate subtotal line</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.ticketSettings.showFareBreakup}
                    onChange={() => handleToggle('showFareBreakup')}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                {/* Toggle 3: GST Lines */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors">
                  <div>
                    <span className="font-bold text-slate-900 block">Show GST 5% SAC Lines</span>
                    <span className="text-[10px] text-slate-500">Tax lines on ticket</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.ticketSettings.showGstLines}
                    onChange={() => handleToggle('showGstLines')}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </label>

                {/* Paper Size */}
                <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Paper Size Layout</span>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePaperSizeChange('A4')}
                      className={`flex-1 py-1 rounded text-[11px] font-bold ${
                        !isThermal ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      A4 Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaperSizeChange('thermal')}
                      className={`flex-1 py-1 rounded text-[11px] font-bold ${
                        isThermal ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Thermal 80mm
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Identity */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px] block">
                Business & Tax Registration
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Business Operating Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1">Operating Head Office Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Primary Mobile Helpline *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone1}
                    onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">GSTIN Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Home State (for CGST/SGST vs IGST) *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Terms and Cancellation Policy */}
            <div className="space-y-3">
              <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px] block">
                Passenger Policy & Ticket Notes
              </span>
              <div>
                <label className="block text-slate-600 mb-1">Cancellation & Refund Rules</label>
                <input
                  type="text"
                  value={formData.ticketCancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, ticketCancellationPolicy: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Luggage Rules</label>
                <input
                  type="text"
                  value={formData.ticketLuggageRules}
                  onChange={(e) => setFormData({ ...formData, ticketLuggageRules: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Standard Passenger Conditions</label>
                <textarea
                  rows={2}
                  value={formData.ticketTerms}
                  onChange={(e) => setFormData({ ...formData, ticketTerms: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: LIVE UPDATING TICKET PREVIEW (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-amber-400/80 p-5 shadow-lg space-y-4 sticky top-20">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                Live Ticket Re-Render Preview
              </span>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
              {formData.ticketSettings.paperSize.toUpperCase()}
            </span>
          </div>

          {/* Ticket Render Mock */}
          <div className={`p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 shadow-inner text-xs ${
            isThermal ? 'max-w-xs mx-auto text-[11px]' : 'w-full'
          }`}>
            {/* Header */}
            <div className="border-b border-slate-900 pb-2 text-center">
              <h4 className="font-black text-sm uppercase text-slate-950 tracking-tight">
                {formData.businessName}
              </h4>
              <p className="text-[10px] text-slate-600">{formData.address}</p>
              <p className="text-[10px] font-mono mt-0.5">Helpline: {formData.phone1}</p>
              <p className="text-[9px] font-mono text-slate-500">GSTIN: {formData.gstin} ({formData.state.split(' ')[0]})</p>
            </div>

            {/* Journey Meta */}
            <div className="my-2 p-2 bg-amber-100/60 rounded border border-amber-200 grid grid-cols-2 gap-1 text-[10px]">
              <div>Route: <strong>Delhi ↔ Siliguri</strong></div>
              <div>Date: <strong>03 Nov 2026</strong></div>
              <div>Bus: <strong className="font-mono">DL 01 AB 4090</strong></div>
              <div>Seat(s): <strong className="font-mono text-amber-900">L1, L2</strong></div>
            </div>

            {/* Passenger Table */}
            <div className="my-2">
              <table className="w-full text-left text-[10px] border border-slate-200">
                <thead className="bg-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-1">Seat</th>
                    <th className="p-1">Name</th>
                    {formData.ticketSettings.showPassengerId && <th className="p-1">ID Proof</th>}
                    <th className="p-1 text-right">Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  <tr>
                    <td className="p-1 font-bold font-mono">L1</td>
                    <td className="p-1">Amitabh Sen (42/M)</td>
                    {formData.ticketSettings.showPassengerId && (
                      <td className="p-1 text-[9px] font-mono text-slate-500">Aadhaar: 4920...</td>
                    )}
                    <td className="p-1 text-right font-mono">₹1,850</td>
                  </tr>
                  <tr>
                    <td className="p-1 font-bold font-mono">L2</td>
                    <td className="p-1">Madhusmita Sen (39/F)</td>
                    {formData.ticketSettings.showPassengerId && (
                      <td className="p-1 text-[9px] font-mono text-slate-500">Aadhaar: 1849...</td>
                    )}
                    <td className="p-1 text-right font-mono">₹1,850</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fare Breakdown */}
            <div className="my-2 pt-1 border-t border-slate-200 text-[10px] space-y-0.5">
              {formData.ticketSettings.showFareBreakup && (
                <div className="flex justify-between text-slate-600">
                  <span>Base Seat Fare:</span>
                  <span className="font-mono">₹3,700</span>
                </div>
              )}
              {formData.ticketSettings.showGstLines && (
                <div className="flex justify-between text-slate-600">
                  <span>GST 5% (SAC 9964):</span>
                  <span className="font-mono">₹185</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-900 text-slate-950">
                <span>Grand Total:</span>
                <span className="font-mono text-sm">₹3,885</span>
              </div>
            </div>

            {/* Policies */}
            <div className="mt-2 pt-2 border-t border-slate-200 text-[8px] text-slate-500 space-y-0.5 leading-tight">
              <p><strong>Cancel:</strong> {formData.ticketCancellationPolicy}</p>
              <p><strong>Luggage:</strong> {formData.ticketLuggageRules}</p>
            </div>

            {/* Signatory */}
            <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400">
              <span>SCAN QR TO BOARD</span>
              <span className="italic font-bold text-slate-700">For Shree Balaji Travels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

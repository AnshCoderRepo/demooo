import React from 'react';
import { useApp } from '../../context/AppContext';
import { RouteTicket } from '../../types';
import { formatINR, formatDate } from '../../utils/formatters';
import { Printer, Share2, X, Bus, CheckCircle2, QrCode } from 'lucide-react';

export const TicketModal: React.FC = () => {
  const { ticketModalData, closeTicketModal, settings, sendMockSms, showToast } = useApp();

  if (!ticketModalData) return null;

  const ticket = ticketModalData;
  const isThermal = settings.ticketSettings.paperSize === 'thermal';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    sendMockSms(
      ticket.customerName,
      ticket.customerPhone,
      'Route Ticket Issued',
      `Deepak Raj Travels: Ticket #${ticket.ticketNumber} confirmed for ${ticket.routeName}. Travel Date: ${formatDate(ticket.travelDate)}. Seats: ${ticket.passengers.map(p => p.seatNumber).join(', ')}. Total: ${formatINR(ticket.grandTotal)}.`,
      'WhatsApp Share'
    );
    showToast({
      type: 'success',
      title: 'Ticket Sent via WhatsApp',
      message: `PDF ticket link and details messaged to ${ticket.customerPhone}.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto no-print">
      <div className={`bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 ${
        isThermal ? 'max-w-md w-full' : 'max-w-2xl w-full'
      }`}>
        {/* Top bar controls */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isThermal ? 'Thermal Slip Preview (80mm)' : 'Standard Passenger Ticket (A4)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp / SMS</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={closeTicketModal}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 overflow-y-auto max-h-[80vh] print-shadow-none text-slate-900">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Bus className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-950 uppercase">
                  {settings.businessName}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">{settings.address}</p>
              <p className="text-xs text-slate-600">
                Helpline: <strong>{settings.phone1}</strong>, {settings.phone2} | {settings.email}
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                GSTIN: <strong>{settings.gstin}</strong> (Delhi)
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-900 text-xs font-mono font-bold border border-slate-300">
                {ticket.ticketNumber}
              </span>
              <div className="text-[11px] text-slate-500 mt-1">
                Booked: {formatDate(ticket.bookingDate)}
              </div>
              <div className="mt-2 flex justify-end">
                {/* Visual QR Code placeholder */}
                <div className="w-16 h-16 border-2 border-slate-900 rounded p-1 flex flex-col items-center justify-center bg-slate-50 text-slate-900">
                  <QrCode className="w-10 h-10 stroke-[1.5]" />
                  <span className="text-[8px] font-mono">SCAN VALID</span>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Route</span>
              <span className="font-bold text-slate-900">{ticket.routeName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Travel Date</span>
              <span className="font-bold text-slate-900">{formatDate(ticket.travelDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Departure Time</span>
              <span className="font-bold text-slate-900">{ticket.departureTime}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Bus Number</span>
              <span className="font-bold font-mono text-slate-900">{ticket.busNumber}</span>
            </div>
          </div>

          {/* Passenger Table */}
          <div className="my-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Passenger Details ({ticket.passengers.length} Seat{ticket.passengers.length > 1 ? 's' : ''})
            </h4>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">Seat</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Age / Sex</th>
                  {settings.ticketSettings.showPassengerId && <th className="p-2">ID Proof</th>}
                  <th className="p-2">Boarding & Dropping</th>
                  <th className="p-2 text-right">Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ticket.passengers.map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-2 font-bold font-mono text-amber-700">{p.seatNumber}</td>
                    <td className="p-2 font-semibold text-slate-900">{p.name}</td>
                    <td className="p-2 text-slate-600">{p.age} Y / {p.gender}</td>
                    {settings.ticketSettings.showPassengerId && (
                      <td className="p-2 text-slate-500 font-mono text-[11px]">{p.idProof || 'Not required'}</td>
                    )}
                    <td className="p-2 text-[11px]">
                      <div>{p.boardingStop}</div>
                      <div className="text-slate-500">→ {p.droppingStop}</div>
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {formatINR(p.fare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fare Summary (Honors showFareBreakup & showGstLines toggles) */}
          <div className="my-4 flex flex-col sm:flex-row items-start justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-600">
              <p>Primary Passenger Phone: <strong>{ticket.customerPhone}</strong></p>
              <p className="mt-1">Status: <strong className="text-emerald-700">CONFIRMED (PAID)</strong></p>
            </div>

            <div className="w-full sm:w-60 text-xs space-y-1">
              {settings.ticketSettings.showFareBreakup && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Seat Fare:</span>
                    <span className="font-mono">{formatINR(ticket.totalFare)}</span>
                  </div>
                </>
              )}
              {settings.ticketSettings.showGstLines && (
                <div className="flex justify-between text-slate-600">
                  <span>GST @ 5% (SAC 9964):</span>
                  <span className="font-mono">{formatINR(ticket.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-950 pt-1 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-slate-950">{formatINR(ticket.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy & Terms */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-600 space-y-1 leading-relaxed">
            <p><strong>Cancellation Policy:</strong> {settings.ticketCancellationPolicy}</p>
            <p><strong>Luggage Rules:</strong> {settings.ticketLuggageRules}</p>
            <p><strong>Terms:</strong> {settings.ticketTerms}</p>
          </div>

          {/* Authorised signature stamp */}
          <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Digitally Verified E-Ticket</span>
            </div>
            <div className="text-right">
              <p className="font-serif italic text-slate-700 font-bold">For Deepak Raj Travels</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-400">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RouteTicket, PassengerDetail } from '../types';
import { formatINR, formatDate, exportToCSV, TODAY_STR, TOMORROW_STR } from '../utils/formatters';
import { 
  Ticket, Plus, Search, Filter, Download, User, Printer, 
  Share2, Ban, CheckCircle2, QrCode, FileText, X, AlertTriangle, 
  MapPin, Eye, ArrowRight, ShieldCheck, Bus
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';

export const RouteTickets: React.FC = () => {
  const { 
    tickets, 
    routes, 
    buses, 
    addRouteTicket, 
    cancelRouteTicket, 
    openTicketModal, 
    openInvoiceModal,
    gstInvoices,
    sendMockSms, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'tickets' | 'booking' | 'manifest'>('tickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Cancel Ticket Confirmation modal state
  const [cancelModalTicket, setCancelModalTicket] = useState<RouteTicket | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Customer family emergency');

  // Interactive Booking Form state
  const [selectedRouteId, setSelectedRouteId] = useState('route-1');
  const [selectedDate, setSelectedDate] = useState(TOMORROW_STR);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [primaryCustomer, setPrimaryCustomer] = useState({
    name: 'Sanjeev Kumar',
    phone: '+91 98110 99881',
  });
  const [passengersMap, setPassengersMap] = useState<Record<string, {
    name: string;
    phone: string;
    age: number;
    gender: 'M' | 'F' | 'O';
    boardingStop: string;
    droppingStop: string;
    idProof?: string;
  }>>({});

  const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const assignedBus = buses.find((b) => b.type === currentRoute.busType) || buses[0];

  // Booked seats for current route & date
  const bookedSeatNumbers = tickets
    .filter((t) => t.routeId === selectedRouteId && t.travelDate === selectedDate && t.status === 'Confirmed')
    .flatMap((t) => t.passengers.map((p) => p.seatNumber));

  // Ladies seats pre-allocated (for safety display)
  const ladiesSeats = ['L3', 'L4', 'U3', 'U4'];

  // Toggle seat selection
  const handleSeatClick = (seatNum: string) => {
    if (bookedSeatNumbers.includes(seatNum)) return;

    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNum));
      const newMap = { ...passengersMap };
      delete newMap[seatNum];
      setPassengersMap(newMap);
    } else {
      setSelectedSeats([...selectedSeats, seatNum]);
      setPassengersMap({
        ...passengersMap,
        [seatNum]: {
          name: selectedSeats.length === 0 ? primaryCustomer.name : '',
          phone: primaryCustomer.phone,
          age: 30,
          gender: ladiesSeats.includes(seatNum) ? 'F' : 'M',
          boardingStop: currentRoute.stops[0].name,
          droppingStop: currentRoute.stops[currentRoute.stops.length - 1].name,
          idProof: 'Aadhaar / Voter ID',
        },
      });
    }
  };

  // Seat fare calculation based on dropping stop multiplier
  const getSeatFare = (droppingStopName: string) => {
    const stop = currentRoute.stops.find((s) => s.name === droppingStopName);
    const multiplier = stop ? stop.fareMultiplier : 1.0;
    return Math.round(currentRoute.baseFare * (multiplier || 1.0));
  };

  const totalSeatsFare = selectedSeats.reduce((sum, seat) => {
    const p = passengersMap[seat];
    return sum + (p ? getSeatFare(p.droppingStop) : currentRoute.baseFare);
  }, 0);

  const gstAmount = Math.round(totalSeatsFare * 0.05);
  const grandTotal = totalSeatsFare + gstAmount;

  // Finalize Route Ticket Booking
  const handleConfirmTicketBooking = () => {
    if (selectedSeats.length === 0) {
      showToast({ type: 'warning', title: 'No Seats Selected', message: 'Please select at least 1 seat.' });
      return;
    }
    if (!primaryCustomer.name || !primaryCustomer.phone) {
      showToast({ type: 'warning', title: 'Customer Details Missing', message: 'Enter customer name and phone.' });
      return;
    }

    const passengerList: PassengerDetail[] = selectedSeats.map((seatNum) => {
      const p = passengersMap[seatNum];
      const fare = p ? getSeatFare(p.droppingStop) : currentRoute.baseFare;
      return {
        seatNumber: seatNum,
        name: p?.name || primaryCustomer.name,
        phone: p?.phone || primaryCustomer.phone,
        age: Number(p?.age || 28),
        gender: p?.gender || 'M',
        boardingStop: p?.boardingStop || currentRoute.stops[0].name,
        droppingStop: p?.droppingStop || currentRoute.stops[currentRoute.stops.length - 1].name,
        fare,
        idProof: p?.idProof,
      };
    });

    const newTicket = addRouteTicket({
      ticketNumber: `SB-TK-${Math.floor(5100 + Math.random() * 800)}`,
      routeId: currentRoute.id,
      routeName: currentRoute.name,
      busId: assignedBus.id,
      busNumber: assignedBus.plateNumber,
      travelDate: selectedDate,
      departureTime: currentRoute.departureTime,
      passengers: passengerList,
      totalFare: totalSeatsFare,
      gstAmount,
      grandTotal,
      customerName: primaryCustomer.name,
      customerPhone: primaryCustomer.phone,
      status: 'Confirmed',
    });

    // Reset & open ticket modal
    setSelectedSeats([]);
    setPassengersMap({});
    setActiveTab('tickets');
    openTicketModal(newTicket);
  };

  // Perform Cancellation with Auto Credit Note
  const handleConfirmCancel = () => {
    if (!cancelModalTicket) return;
    cancelRouteTicket(cancelModalTicket.id, cancellationReason);
    setCancelModalTicket(null);
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerPhone.includes(searchQuery) ||
      t.passengers.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRoute = routeFilter === 'all' || t.routeId === routeFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesRoute && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Ticket No', 'Route', 'Date', 'Customer', 'Phone', 'Seats', 'Pax Count', 'Fare', 'GST', 'Total', 'Status'];
    const rows = filteredTickets.map((t) => [
      t.ticketNumber,
      t.routeName,
      t.travelDate,
      t.customerName,
      t.customerPhone,
      t.passengers.map(p => p.seatNumber).join('; '),
      t.passengers.length,
      t.totalFare,
      t.gstAmount,
      t.grandTotal,
      t.status,
    ]);
    exportToCSV('Route_Tickets_Register', headers, rows);
    showToast({ type: 'success', title: 'Route Tickets Register Downloaded' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Route Ticketing (Inter-State)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Delhi ↔ Bihar & Siliguri
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Seat layouts (Sleeper 2+1 & Seater), dynamic intermediate stop fare computation, cancellation refund rules & trip manifests.
          </p>
        </div>

        {/* Tab Switcher & New Ticket Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'tickets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Issued Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'booking' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              + Sell Tickets
            </button>
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'manifest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Trip Manifest
            </button>
          </div>

          {activeTab === 'tickets' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ISSUED TICKETS TABLE */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, passenger, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="all">All Routes</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled (Refunded)</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Ticket No</th>
                    <th className="p-3.5">Route & Travel Date</th>
                    <th className="p-3.5">Customer / Contact</th>
                    <th className="p-3.5">Passengers & Seats</th>
                    <th className="p-3.5 text-right">Fare & GST</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTickets.map((tk) => (
                    <tr key={tk.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ticket No */}
                      <td className="p-3.5 align-top">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {tk.ticketNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Bus: {tk.busNumber}
                        </div>
                      </td>

                      {/* Route & Date */}
                      <td className="p-3.5 align-top">
                        <div className="font-bold text-slate-900">{tk.routeName}</div>
                        <div className="text-amber-700 font-semibold mt-0.5">
                          {formatDate(tk.travelDate)} • Dep: {tk.departureTime}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5 align-top">
                        <div className="font-bold text-slate-900">{tk.customerName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{tk.customerPhone}</div>
                      </td>

                      {/* Passengers & Seats */}
                      <td className="p-3.5 align-top">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {tk.passengers.map((p, idx) => (
                            <span key={idx} className="font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px]">
                              {p.seatNumber} ({p.name.split(' ')[0]})
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {tk.passengers[0]?.boardingStop.slice(0, 16)} → {tk.passengers[0]?.droppingStop.slice(0, 16)}
                        </div>
                      </td>

                      {/* Fare */}
                      <td className="p-3.5 align-top text-right">
                        <div className="font-black text-slate-900 font-mono text-sm">
                          {formatINR(tk.grandTotal)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Base: {formatINR(tk.totalFare)} + GST 5%
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 align-top text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          tk.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tk.status}
                        </span>

                        {tk.cancellationDetails && (
                          <div className="text-[10px] text-rose-700 font-semibold mt-1">
                            Refund: {formatINR(tk.cancellationDetails.refundAmount)} (CN: {tk.cancellationDetails.creditNoteNumber})
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print / View Ticket */}
                          <button
                            onClick={() => openTicketModal(tk)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                            title="Printable E-Ticket View"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Share via WhatsApp */}
                          <button
                            onClick={() => {
                              sendMockSms(
                                tk.customerName,
                                tk.customerPhone,
                                'Route Ticket Issued',
                                `Shree Balaji Travels: Ticket #${tk.ticketNumber} confirmed. Seats: ${tk.passengers.map(p => p.seatNumber).join(', ')}. Amount: ${formatINR(tk.grandTotal)}. Dep: ${tk.departureTime}.`,
                                'Ticket Resend'
                              );
                              showToast({ type: 'success', title: 'Ticket Resent via SMS & WhatsApp' });
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                            title="Share WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel Ticket (With Refund Rules) */}
                          {tk.status === 'Confirmed' && (
                            <button
                              onClick={() => setCancelModalTicket(tk)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                              title="Cancel Ticket & Auto Credit Note"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE VISUAL SEAT SELECTION & TICKET SALE */}
      {activeTab === 'booking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Layout (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select Seats • {currentRoute.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {assignedBus.model} ({assignedBus.plateNumber}) • Base Fare: {formatINR(currentRoute.baseFare)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    setSelectedSeats([]);
                  }}
                  className="text-xs p-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSeats([]);
                  }}
                  className="text-xs p-1.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Seat Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-4 h-4 rounded bg-white border-2 border-slate-400" /> Available
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-900">
                <span className="w-4 h-4 rounded bg-amber-500 border-2 border-amber-600" /> Selected
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                <span className="w-4 h-4 rounded bg-slate-300 border-2 border-slate-400" /> Booked
              </span>
              <span className="flex items-center gap-1.5 font-medium text-pink-700">
                <span className="w-4 h-4 rounded bg-pink-100 border-2 border-pink-400" /> Ladies Seat
              </span>
            </div>

            {/* Visual Bus Coach Layout */}
            <div className="p-4 bg-slate-900 rounded-2xl text-white">
              {/* Driver Cabin */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center font-bold text-amber-400">
                    <Bus className="w-4 h-4" />
                  </div>
                  <span>FRONT / DRIVER CABIN</span>
                </div>
                <span className="font-mono text-emerald-400">ENTRY GATE →</span>
              </div>

              {/* Berth Deck Split (Lower & Upper Berths) */}
              <div className="space-y-6">
                {/* LOWER DECK (L1 - L18) */}
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                    Lower Deck (Sleeper Berths 2+1)
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const seatNum = `L${i + 1}`;
                      const isBooked = bookedSeatNumbers.includes(seatNum);
                      const isSelected = selectedSeats.includes(seatNum);
                      const isLadies = ladiesSeats.includes(seatNum);

                      return (
                        <button
                          key={seatNum}
                          type="button"
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seatNum)}
                          className={`p-2 rounded-xl text-center font-mono font-bold transition-all shadow-sm ${
                            isBooked
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : isSelected
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-105'
                              : isLadies
                              ? 'bg-pink-950/70 border-2 border-pink-500 text-pink-200 hover:bg-pink-900'
                              : 'bg-slate-800 border-2 border-slate-600 text-slate-200 hover:border-amber-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs">{seatNum}</div>
                          <div className="text-[9px] font-normal opacity-80">
                            {isBooked ? 'SOLD' : isSelected ? 'PICK' : isLadies ? 'LADIES' : '₹' + currentRoute.baseFare}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* UPPER DECK (U1 - U12) */}
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                    Upper Deck (Sleeper Berths 2+1)
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const seatNum = `U${i + 1}`;
                      const isBooked = bookedSeatNumbers.includes(seatNum);
                      const isSelected = selectedSeats.includes(seatNum);
                      const isLadies = ladiesSeats.includes(seatNum);

                      return (
                        <button
                          key={seatNum}
                          type="button"
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seatNum)}
                          className={`p-2 rounded-xl text-center font-mono font-bold transition-all shadow-sm ${
                            isBooked
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : isSelected
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-105'
                              : isLadies
                              ? 'bg-pink-950/70 border-2 border-pink-500 text-pink-200 hover:bg-pink-900'
                              : 'bg-slate-800 border-2 border-slate-600 text-slate-200 hover:border-amber-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs">{seatNum}</div>
                          <div className="text-[9px] font-normal opacity-80">
                            {isBooked ? 'SOLD' : isSelected ? 'PICK' : isLadies ? 'LADIES' : '₹' + currentRoute.baseFare}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Details & Live Checkout (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Passenger Details & Fare
            </h3>

            {/* Primary Booker */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Primary Contact
              </span>
              <div>
                <label className="block text-slate-600 mb-0.5">Name *</label>
                <input
                  type="text"
                  value={primaryCustomer.name}
                  onChange={(e) => setPrimaryCustomer({ ...primaryCustomer, name: e.target.value })}
                  className="w-full p-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Mobile Phone *</label>
                <input
                  type="text"
                  value={primaryCustomer.phone}
                  onChange={(e) => setPrimaryCustomer({ ...primaryCustomer, phone: e.target.value })}
                  className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            {/* Per-Seat Passenger Form */}
            {selectedSeats.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Ticket className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-amber-500" />
                <p>Click seats on the left to configure passengers.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedSeats.map((seatNum) => {
                  const p = passengersMap[seatNum] || {
                    name: '',
                    phone: '',
                    age: 28,
                    gender: 'M',
                    boardingStop: currentRoute.stops[0].name,
                    droppingStop: currentRoute.stops[currentRoute.stops.length - 1].name,
                  };

                  return (
                    <div key={seatNum} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="font-mono bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[11px]">
                          Seat: {seatNum}
                        </span>
                        <span className="font-mono text-emerald-800">
                          {formatINR(getSeatFare(p.droppingStop))}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Passenger Name"
                            value={p.name}
                            onChange={(e) => setPassengersMap({
                              ...passengersMap,
                              [seatNum]: { ...p, name: e.target.value }
                            })}
                            className="w-full p-1.5 rounded border border-slate-300 text-xs"
                          />
                        </div>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="Age"
                            value={p.age}
                            onChange={(e) => setPassengersMap({
                              ...passengersMap,
                              [seatNum]: { ...p, age: Number(e.target.value) }
                            })}
                            className="w-16 p-1.5 rounded border border-slate-300 text-xs text-center font-mono"
                          />
                          <select
                            value={p.gender}
                            onChange={(e) => setPassengersMap({
                              ...passengersMap,
                              [seatNum]: { ...p, gender: e.target.value as 'M' | 'F' | 'O' }
                            })}
                            className="flex-1 p-1.5 rounded border border-slate-300 text-xs bg-white"
                          >
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="O">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">
                          Dropping Point (Fare Changes by Stop)
                        </label>
                        <select
                          value={p.droppingStop}
                          onChange={(e) => setPassengersMap({
                            ...passengersMap,
                            [seatNum]: { ...p, droppingStop: e.target.value }
                          })}
                          className="w-full p-1.5 rounded border border-slate-300 text-xs bg-white font-medium"
                        >
                          {currentRoute.stops.slice(1).map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name} ({formatINR(Math.round(currentRoute.baseFare * s.fareMultiplier))})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Fare & Confirmation */}
            {selectedSeats.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Seats ({selectedSeats.length}):</span>
                  <span className="font-mono">{formatINR(totalSeatsFare)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>GST (5% SAC 9964):</span>
                  <span className="font-mono">{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-amber-600">{formatINR(grandTotal)}</span>
                </div>

                <button
                  onClick={handleConfirmTicketBooking}
                  className="w-full mt-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Issue {selectedSeats.length} Ticket(s) & Print</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DAILY SCHEDULE & TRIP MANIFEST */}
      {activeTab === 'manifest' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Trip Manifest (Driver & Conductor Passenger List)
              </h3>
              <p className="text-xs text-slate-500">
                Printable passenger boarding chart for en-route checking and highway transport compliance
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4 text-xs font-medium">
            <span>Route: <strong>{currentRoute.name}</strong></span>
            <span>Date: <strong>02 Nov 2026 (Tonight's Trip)</strong></span>
            <span>Bus: <strong className="font-mono">{assignedBus.plateNumber}</strong></span>
            <span>Driver: <strong>Surender Singh Yadav</strong> (+91 98711 22334)</span>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Seat</th>
                <th className="p-2.5">Passenger Name</th>
                <th className="p-2.5">Phone</th>
                <th className="p-2.5">Age/Sex</th>
                <th className="p-2.5">Boarding Point</th>
                <th className="p-2.5">Dropping Point</th>
                <th className="p-2.5 text-center">Boarded Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tickets.filter(t => t.status === 'Confirmed').slice(0, 8).flatMap(t => t.passengers).map((p, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  <td className="p-2.5 font-bold font-mono text-amber-700">{p.seatNumber}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{p.name}</td>
                  <td className="p-2.5 font-mono text-slate-600">{p.phone}</td>
                  <td className="p-2.5">{p.age} / {p.gender}</td>
                  <td className="p-2.5">{p.boardingStop}</td>
                  <td className="p-2.5">{p.droppingStop}</td>
                  <td className="p-2.5 text-center">
                    <input type="checkbox" className="rounded text-amber-500 w-4 h-4 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancellation & Refund Rule Modal */}
      {cancelModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cancel Ticket #{cancelModalTicket.ticketNumber}?
                </h3>
                <p className="text-xs text-slate-500">Automated Refund & GST Credit Note Engine</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs space-y-2 mb-4">
              <div className="flex justify-between text-slate-700">
                <span>Original Fare Paid:</span>
                <span className="font-mono font-bold">{formatINR(cancelModalTicket.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Cancellation Rule Applied (24h+):</span>
                <span className="font-bold">90% Refund</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold border-t border-rose-200 pt-1">
                <span>Net Refund Amount:</span>
                <span className="font-mono text-base">{formatINR(Math.round(cancelModalTicket.grandTotal * 0.9))}</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                System will automatically generate Credit Note series with negative GST liability for the CA.
              </div>
            </div>

            <div className="mb-4 text-xs">
              <label className="block text-slate-600 font-medium mb-1">Cancellation Reason</label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setCancelModalTicket(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-100"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow"
              >
                Confirm Cancellation & Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate, formatDateTime, formatINR, checkDateOverlap, TODAY_STR } from '../utils/formatters';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  BusFront, AlertCircle, Info, Sparkles, Ticket, 
  Users, CheckCircle2, Clock, ArrowRight, Plus, 
  ShieldAlert, Wrench, Eye, Printer, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CalendarView: React.FC = () => {
  const { buses, charterBookings, tickets, routes, openTicketModal } = useApp();
  const navigate = useNavigate();

  // State: current view month and selected date
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(10); // 10 = November
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-11-02'); // Default to Today
  const [activeResultsTab, setActiveResultsTab] = useState<'all' | 'charters' | 'routeTickets' | 'fleetStatus'>('all');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Compute days in the active month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  // Helper to format day into YYYY-MM-DD
  const getDayDateString = (day: number) => {
    const monthStr = String(currentMonthIndex + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentYear}-${monthStr}-${dayStr}`;
  };

  // Status Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-600 text-white border-emerald-700';
      case 'In Progress': return 'bg-blue-600 text-white border-blue-700 animate-pulse';
      case 'Quoted': return 'bg-amber-500 text-slate-950 border-amber-600 font-bold';
      case 'Completed': return 'bg-slate-600 text-white border-slate-700';
      case 'Cancelled': return 'bg-rose-500 text-white border-rose-600 line-through';
      default: return 'bg-slate-400 text-white';
    }
  };

  // Get charter bookings active on a specific day for a specific bus
  const getBookingsForBusAndDate = (busId: string, dateStr: string) => {
    return charterBookings.filter((b) => {
      if (b.status === 'Cancelled') return false;
      const isAssigned = b.assignedBuses.some((ab) => ab.busId === busId);
      if (!isAssigned) return false;
      const startDay = b.pickupDateTime.slice(0, 10);
      const endDay = b.returnDateTime.slice(0, 10);
      return dateStr >= startDay && dateStr <= endDay;
    });
  };

  // --- RESULTS FOR SELECTED DATE ---
  // 1. All charter trips active on selected date
  const selectedDateCharters = charterBookings.filter((b) => {
    if (b.status === 'Cancelled') return false;
    const startDay = b.pickupDateTime.slice(0, 10);
    const endDay = b.returnDateTime.slice(0, 10);
    return selectedDateStr >= startDay && selectedDateStr <= endDay;
  });

  // 2. All route tickets scheduled for selected date
  const selectedDateTickets = tickets.filter(
    (t) => t.travelDate === selectedDateStr && t.status === 'Confirmed'
  );

  // 3. Revenue on selected date
  const dayCharterRevenue = selectedDateCharters.reduce((s, b) => s + b.quote.grandTotal, 0);
  const dayTicketRevenue = selectedDateTickets.reduce((s, t) => s + t.grandTotal, 0);
  const totalDayRevenue = dayCharterRevenue + dayTicketRevenue;

  // 4. Fleet status breakdown on selected date
  const fleetStatusOnDate = buses.map((bus) => {
    // Check if bus is in maintenance
    if (bus.status === 'In maintenance') {
      return {
        bus,
        state: 'maintenance' as const,
        reason: 'In Workshop / Scheduled Maintenance',
        assignedTo: null,
      };
    }

    // Check if bus is on a charter trip on this date
    const activeCharter = charterBookings.find((b) => {
      if (b.status === 'Cancelled') return false;
      const isBus = b.assignedBuses.some((ab) => ab.busId === bus.id);
      if (!isBus) return false;
      const startDay = b.pickupDateTime.slice(0, 10);
      const endDay = b.returnDateTime.slice(0, 10);
      return selectedDateStr >= startDay && selectedDateStr <= endDay;
    });

    if (activeCharter) {
      return {
        bus,
        state: 'busy' as const,
        reason: `Charter #${activeCharter.bookingNumber} (${activeCharter.bookingType})`,
        assignedTo: activeCharter,
      };
    }

    // Check if bus is running a scheduled route on this date
    const hasRouteTicket = tickets.some(
      (t) => t.busId === bus.id && t.travelDate === selectedDateStr && t.status === 'Confirmed'
    );
    if (hasRouteTicket) {
      return {
        bus,
        state: 'busy' as const,
        reason: `Scheduled Inter-State Route Trip`,
        assignedTo: null,
      };
    }

    // Otherwise free in yard
    return {
      bus,
      state: 'available' as const,
      reason: 'Free in Depot Yard (Ready for Dispatch)',
      assignedTo: null,
    };
  });

  const availableBusesCount = fleetStatusOnDate.filter((f) => f.state === 'available').length;
  const busyBusesCount = fleetStatusOnDate.filter((f) => f.state === 'busy').length;
  const maintenanceCount = fleetStatusOnDate.filter((f) => f.state === 'maintenance').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Month Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Fleet Scheduling & Date Inspector
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              {monthNames[currentMonthIndex]} {currentYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Click any date on the calendar matrix or choose from the date picker to inspect all trips, tickets, available buses, and revenue.
          </p>
        </div>

        {/* Month Navigator & Quick Date Picker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Input */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-medium">
            <CalendarIcon className="w-4 h-4 text-amber-600 ml-1" />
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDateStr(e.target.value);
                  const picked = new Date(e.target.value);
                  if (!isNaN(picked.getTime())) {
                    setCurrentYear(picked.getFullYear());
                    setCurrentMonthIndex(picked.getMonth());
                  }
                }
              }}
              className="bg-transparent border-none text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Month Steppers */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-slate-900 min-w-[120px] text-center font-bold">
              {monthNames[currentMonthIndex]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Jump Buttons */}
          <button
            onClick={() => {
              setSelectedDateStr('2026-11-02');
              setCurrentMonthIndex(10);
              setCurrentYear(2026);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              selectedDateStr === '2026-11-02'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Today (02 Nov)
          </button>
          <button
            onClick={() => {
              setSelectedDateStr('2026-11-05');
              setCurrentMonthIndex(10);
              setCurrentYear(2026);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              selectedDateStr === '2026-11-05'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            05 Nov (Peak Shadi)
          </button>
        </div>
      </div>

      {/* Calendar Matrix: Bus Rows vs Days of Month */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              {monthNames[currentMonthIndex]} {currentYear} Matrix: Click any day column to view its results
            </span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600" /> Confirmed
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> On Trip
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Quoted
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-amber-400 px-2 py-0.5 rounded shadow-sm">
              ★ Selected Day
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 text-left w-52 sticky left-0 z-20 bg-slate-900 border-r border-slate-800">
                  Fleet Vehicle (8 Buses)
                </th>
                {daysArray.map((day) => {
                  const dayDate = getDayDateString(day);
                  const isToday = dayDate === TODAY_STR;
                  const isSelected = dayDate === selectedDateStr;

                  // Day of week
                  const dateObj = new Date(currentYear, currentMonthIndex, day);
                  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];

                  return (
                    <th
                      key={day}
                      onClick={() => setSelectedDateStr(dayDate)}
                      className={`p-2 text-center min-w-[56px] border-r border-slate-800 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow-inner ring-2 ring-amber-300'
                          : isToday
                          ? 'bg-slate-800 text-amber-400 font-bold'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[10px] uppercase opacity-80">{weekday}</div>
                      <div className="text-sm font-bold">{day}</div>
                      {isToday && (
                        <div className="text-[8px] uppercase tracking-wider font-extrabold text-amber-300">
                          TODAY
                        </div>
                      )}
                      {isSelected && !isToday && (
                        <div className="text-[8px] uppercase tracking-wider font-extrabold text-slate-950">
                          VIEW
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {buses.map((bus) => (
                <tr key={bus.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Bus Header Column (sticky left) */}
                  <td className="p-3 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-sm">
                    <div className="font-mono font-bold text-slate-900 text-xs flex items-center justify-between">
                      <span>{bus.plateNumber}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        bus.status === 'On trip' ? 'bg-blue-500 animate-ping' : bus.status === 'In maintenance' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {bus.type} • {bus.capacity}S
                    </div>
                  </td>

                  {/* Day Columns */}
                  {daysArray.map((day) => {
                    const dayDate = getDayDateString(day);
                    const bookingsOnDay = getBookingsForBusAndDate(bus.id, dayDate);
                    const isSelected = dayDate === selectedDateStr;
                    const isToday = dayDate === TODAY_STR;
                    const hasConflict = bookingsOnDay.length > 1;

                    return (
                      <td
                        key={day}
                        onClick={() => setSelectedDateStr(dayDate)}
                        className={`p-1 text-center border-r border-slate-100 cursor-pointer transition-all align-top min-w-[56px] ${
                          isSelected
                            ? 'bg-amber-100/70 border-amber-300'
                            : isToday
                            ? 'bg-amber-50/20'
                            : 'hover:bg-slate-100'
                        }`}
                        title={bookingsOnDay.map(b => `${b.bookingNumber}: ${b.customerName} (${b.bookingType})`).join('\n')}
                      >
                        {bookingsOnDay.length === 0 ? (
                          <div className={`h-10 flex items-center justify-center text-[10px] font-mono transition-colors ${
                            isSelected ? 'text-amber-800 font-bold' : 'text-slate-300 hover:text-amber-600'
                          }`}>
                            +
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {bookingsOnDay.map((b) => (
                              <div
                                key={b.id}
                                className={`p-1 rounded text-[9px] font-bold truncate leading-tight shadow-sm border ${
                                  hasConflict ? 'bg-rose-600 text-white animate-bounce' : getStatusColor(b.status)
                                }`}
                              >
                                <div>{b.bookingType}</div>
                                <div className="font-mono text-[8px] opacity-90">{b.bookingNumber}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 SELECTED DATE RESULTS INSPECTOR PANEL 🌟 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-amber-500/80 p-5 sm:p-6 shadow-xl space-y-5 animate-in slide-in-from-bottom-3 duration-300">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 text-lg">
              {new Date(selectedDateStr).getDate()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Operations & Results for {formatDate(selectedDateStr)}
                </h2>
                {selectedDateStr === TODAY_STR && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-sm">
                    TODAY (LIVE)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive schedule, passenger tickets, fleet availability, and financial commitments for this date.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons for this date */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/charter-bookings')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Charter for {formatDate(selectedDateStr).slice(0, 6)}</span>
            </button>

            <button
              onClick={() => navigate('/route-tickets')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition-all"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Sell Route Ticket</span>
            </button>
          </div>
        </div>

        {/* 4 Daily KPI Strip Cards for Selected Date */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
              <span>Charter Trips Active</span>
              <BusFront className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {selectedDateCharters.length} Bookings
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedDateCharters.filter(b => b.status === 'Confirmed' || b.status === 'In Progress').length} Confirmed / On Road
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
              <span>Scheduled Route Tickets</span>
              <Ticket className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {selectedDateTickets.length} Tickets
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {selectedDateTickets.reduce((acc, t) => acc + t.passengers.length, 0)} Passengers Traveling
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-1">
              <span>Fleet Status on Date</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {availableBusesCount} Free Buses
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {busyBusesCount} On Trip • {maintenanceCount} Maintenance
            </p>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase mb-1">
              <span>Total Day Revenue</span>
              <span className="font-mono text-emerald-400">INR</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {formatINR(totalDayRevenue)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Charters: {formatINR(dayCharterRevenue)} + Tickets: {formatINR(dayTicketRevenue)}
            </p>
          </div>
        </div>

        {/* Results Tabs: All, Charters, Route Tickets, Fleet Availability */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveResultsTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeResultsTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Results ({selectedDateCharters.length + selectedDateTickets.length})
          </button>
          <button
            onClick={() => setActiveResultsTab('charters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeResultsTab === 'charters'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Charter Bookings ({selectedDateCharters.length})
          </button>
          <button
            onClick={() => setActiveResultsTab('routeTickets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeResultsTab === 'routeTickets'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Route Passenger Tickets ({selectedDateTickets.length})
          </button>
          <button
            onClick={() => setActiveResultsTab('fleetStatus')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeResultsTab === 'fleetStatus'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Bus Fleet Availability ({buses.length})
          </button>
        </div>

        {/* SECTION 1: CHARTER BOOKINGS LIST */}
        {(activeResultsTab === 'all' || activeResultsTab === 'charters') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BusFront className="w-4 h-4 text-amber-600" />
                <span>Charter Trips Active on {formatDate(selectedDateStr)}</span>
              </h3>
              <span className="text-xs text-slate-500">
                {selectedDateCharters.length} booking{selectedDateCharters.length === 1 ? '' : 's'} running
              </span>
            </div>

            {selectedDateCharters.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                <BusFront className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-600" />
                <p className="font-semibold text-slate-600">No charter bookings active on this date.</p>
                <p className="mt-1">All buses are free to accept wedding, school, or tourist charter reservations!</p>
                <button
                  onClick={() => navigate('/charter-bookings')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Booking for {formatDate(selectedDateStr)}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDateCharters.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-400 transition-all shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {b.bookingNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.bookingType === 'Shadi' || b.bookingType === 'Vivah'
                              ? 'bg-rose-100 text-rose-800'
                              : b.bookingType === 'School Trip'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.bookingType}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{b.customerName}</h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.phone}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          b.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                        <div className="font-mono font-black text-slate-900 text-sm mt-1">
                          {formatINR(b.quote.grandTotal)}
                        </div>
                      </div>
                    </div>

                    {/* Itinerary & Assigned Bus */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Itinerary</span>
                        <div className="font-semibold text-slate-800">{b.pickup} → {b.drop}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {formatDateTime(b.pickupDateTime)} to {formatDateTime(b.returnDateTime)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Fleet</span>
                        <div className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                          {b.assignedBuses[0]?.busNumber || 'To be allocated'}
                        </div>
                        {b.assignedBuses[0]?.driverName && (
                          <div className="text-[11px] text-slate-600 mt-1">
                            Driver: <strong>{b.assignedBuses[0].driverName}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="text-[11px] text-slate-500">
                        Advance: <strong className="text-emerald-700 font-mono">{formatINR(b.advancePaid)}</strong> • Balance: <strong className="text-rose-600 font-mono">{formatINR(b.balanceDue)}</strong>
                      </div>
                      <button
                        onClick={() => navigate('/charter-bookings')}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                      >
                        <span>Manage Booking</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: SCHEDULED ROUTE TICKETS */}
        {(activeResultsTab === 'all' || activeResultsTab === 'routeTickets') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>Inter-State Route Departures on {formatDate(selectedDateStr)}</span>
              </h3>
              <span className="text-xs text-slate-500">
                {selectedDateTickets.length} confirmed ticket{selectedDateTickets.length === 1 ? '' : 's'}
              </span>
            </div>

            {selectedDateTickets.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-600" />
                <p className="font-semibold text-slate-600">No route tickets booked for {formatDate(selectedDateStr)} yet.</p>
                <button
                  onClick={() => navigate('/route-tickets')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1 shadow"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Open Route Seat Selector</span>
                </button>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="p-3">Ticket #</th>
                      <th className="p-3">Route</th>
                      <th className="p-3">Passenger & Contact</th>
                      <th className="p-3">Seats</th>
                      <th className="p-3">Boarding → Dropping</th>
                      <th className="p-3 text-right">Fare Paid</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedDateTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{t.routeName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Dep: {t.departureTime} • Bus: {t.busNumber}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{t.customerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{t.customerPhone}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {t.passengers.map((p, idx) => (
                              <span key={idx} className="font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px]">
                                {p.seatNumber}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-[11px]">
                          {t.passengers[0]?.boardingStop.slice(0, 15)} → {t.passengers[0]?.droppingStop.slice(0, 15)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(t.grandTotal)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openTicketModal(t)}
                            className="p-1 rounded border hover:bg-slate-100 text-slate-600"
                            title="Print E-Ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: FLEET AVAILABILITY STATUS TABLE */}
        {(activeResultsTab === 'all' || activeResultsTab === 'fleetStatus') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bus Fleet Availability on {formatDate(selectedDateStr)}</span>
              </h3>
              <span className="text-xs text-slate-500">
                {availableBusesCount} of {buses.length} buses ready for new bookings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {fleetStatusOnDate.map(({ bus, state, reason }) => (
                <div
                  key={bus.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 ${
                    state === 'available'
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : state === 'busy'
                      ? 'bg-blue-50/70 border-blue-300 text-blue-950'
                      : 'bg-rose-50/70 border-rose-300 text-rose-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white border shadow-sm">
                        {bus.plateNumber}
                      </span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                        state === 'available'
                          ? 'bg-emerald-600 text-white'
                          : state === 'busy'
                          ? 'bg-blue-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}>
                        {state === 'available' ? 'Available' : state === 'busy' ? 'On Trip' : 'In Workshop'}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 mt-2">{bus.model}</div>
                    <div className="text-[11px] text-slate-600">{bus.type} • {bus.capacity} Seats</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-[11px] font-medium">
                    {reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

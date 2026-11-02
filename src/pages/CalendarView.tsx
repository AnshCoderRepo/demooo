import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate, formatINR } from '../utils/formatters';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  BusFront, AlertCircle, Info, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CalendarView: React.FC = () => {
  const { buses, charterBookings } = useApp();
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState<number>(10); // 0-indexed: 10 = November
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Days in November 2026: 30 days. Starts on Sunday Nov 1
  const daysInMonth = 30;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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

  // Helper to test if a booking applies to a given day for a given bus
  const getBookingsForBusAndDay = (busId: string, day: number) => {
    const dayStr = `2026-11-${String(day).padStart(2, '0')}`;
    return charterBookings.filter((b) => {
      if (b.status === 'Cancelled') return false;
      const isAssigned = b.assignedBuses.some((ab) => ab.busId === busId);
      if (!isAssigned) return false;
      const startDay = b.pickupDateTime.slice(0, 10);
      const endDay = b.returnDateTime.slice(0, 10);
      return dayStr >= startDay && dayStr <= endDay;
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Fleet Scheduling Calendar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              November 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual bus availability timeline with row-per-bus schedule and conflict detection. Click any slot to allocate a charter booking.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-600" /> On Trip (Live)
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Quoted
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-100 text-rose-800 font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Conflict Block
          </span>
        </div>
      </div>

      {/* Calendar Matrix: Bus Rows vs Days */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 text-left w-56 sticky left-0 z-20 bg-slate-900 border-r border-slate-800">
                  Fleet Vehicle (8 Buses)
                </th>
                {daysArray.map((day) => {
                  const isToday = day === 2;
                  return (
                    <th
                      key={day}
                      className={`p-2 text-center min-w-[54px] border-r border-slate-800 ${
                        isToday ? 'bg-amber-500 text-slate-950 font-black' : ''
                      }`}
                    >
                      <div className="text-[10px] uppercase opacity-80">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(day - 1) % 7]}
                      </div>
                      <div className="text-sm font-bold">{day}</div>
                      {isToday && (
                        <div className="text-[8px] uppercase tracking-wider font-extrabold">TODAY</div>
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
                    const bookingsOnDay = getBookingsForBusAndDay(bus.id, day);
                    const isToday = day === 2;
                    const hasConflict = bookingsOnDay.length > 1;

                    return (
                      <td
                        key={day}
                        onClick={() => navigate('/charter-bookings')}
                        className={`p-1 text-center border-r border-slate-100 cursor-pointer hover:bg-amber-50/50 transition-colors align-top min-w-[54px] ${
                          isToday ? 'bg-amber-50/30' : ''
                        }`}
                        title={bookingsOnDay.map(b => `${b.bookingNumber}: ${b.customerName} (${b.bookingType})`).join('\n')}
                      >
                        {bookingsOnDay.length === 0 ? (
                          <div className="h-10 flex items-center justify-center text-[10px] text-slate-300 hover:text-amber-600 font-mono">
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
    </div>
  );
};

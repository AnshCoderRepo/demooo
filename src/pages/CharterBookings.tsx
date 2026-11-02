import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CharterBooking, CharterBookingType, CharterBookingStatus, BusType } from '../types';
import { formatINR, formatDate, formatDateTime, exportToCSV, checkDateOverlap, TODAY_STR, isDateInFilter, DateFilterOption } from '../utils/formatters';
import { 
  BusFront, Plus, Search, Filter, Download, AlertCircle, 
  CheckCircle, Clock, ShieldAlert, ArrowRight, Printer, 
  MessageSquare, User, Calendar, MapPin, X, Edit, Eye, History, RotateCcw, Trash2
} from 'lucide-react';
import { WarningModal } from '../components/modals/WarningModal';

export const CharterBookings: React.FC = () => {
  const { 
    charterBookings, 
    buses, 
    workers, 
    customers, 
    addCharterBooking, 
    updateCharterBooking, 
    cancelCharterBooking,
    deleteCharterBooking,
    openHistory, 
    sendMockSms, 
    showToast 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [busFilter, setBusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<CharterBooking | null>(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingEditBooking, setPendingEditBooking] = useState<CharterBooking | null>(null);
  const [previewBooking, setPreviewBooking] = useState<CharterBooking | null>(null);
  const [deleteModalBooking, setDeleteModalBooking] = useState<CharterBooking | null>(null);

  // Form State
  const initialForm = {
    customerId: '',
    customerName: '',
    phone: '',
    altPhone: '',
    address: '',
    bookingType: 'Shadi' as CharterBookingType,
    pickup: '',
    drop: '',
    stops: '',
    pickupDateTime: '2026-11-05T10:00',
    returnDateTime: '2026-11-07T18:00',
    passengers: 36,
    busTypeRequired: 'AC Sleeper' as BusType,
    busCount: 1,
    schoolName: '',
    teacherContact: '',
    department: '',
    workOrderNo: '',
    rateType: 'day' as 'km' | 'day',
    ratePerUnit: 20000,
    units: 3,
    driverAllowance: 3000,
    toll: 2500,
    parking: 1000,
    nightHalt: 2000,
    gstIncluded: false,
    gstRate: 5,
    advancePaid: 20000,
    paymentMode: 'UPI',
    assignedBusId: 'bus-1', // Pre-select bus-1 to demonstrate conflict!
    assignedDriverId: 'worker-1',
    assignedConductorId: 'worker-6',
    assignedHelperId: 'worker-8',
  };

  const [formData, setFormData] = useState(initialForm);

  // Live Quote calculation
  const subtotal = 
    (formData.ratePerUnit * formData.units) + 
    formData.driverAllowance + 
    formData.toll + 
    formData.parking + 
    formData.nightHalt;

  const gstAmount = formData.gstIncluded ? 0 : Math.round(subtotal * (formData.gstRate / 100));
  const grandTotal = subtotal + gstAmount;
  const balanceDue = Math.max(0, grandTotal - formData.advancePaid);

  // Check double-booking conflict for the selected bus
  const checkBusConflict = (busId: string, start: string, end: string, currentBookingId?: string) => {
    return charterBookings.find((b) => {
      if (b.status === 'Cancelled' || b.id === currentBookingId) return false;
      const hasBus = b.assignedBuses.some((ab) => ab.busId === busId);
      if (!hasBus) return false;
      return checkDateOverlap(start, end, b.pickupDateTime, b.returnDateTime);
    });
  };

  const conflictingBooking = checkBusConflict(
    formData.assignedBusId, 
    formData.pickupDateTime, 
    formData.returnDateTime, 
    editingBooking?.id
  );

  // Filtered List
  const filteredBookings = charterBookings.filter((b) => {
    const matchesSearch = 
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.drop.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesType = typeFilter === 'all' || b.bookingType === typeFilter;
    const matchesDate = isDateInFilter(b.pickupDateTime, dateFilter, customStart, customEnd);
    const matchesBus = busFilter === 'all' || b.assignedBuses.some((ab) => ab.busId === busFilter);
    const matchesDriver = driverFilter === 'all' || b.assignedBuses.some((ab) => ab.driverId === driverFilter);
    const matchesPayment = 
      paymentFilter === 'all' ? true :
      paymentFilter === 'fullyPaid' ? b.balanceDue === 0 :
      paymentFilter === 'partial' ? (b.advancePaid > 0 && b.balanceDue > 0) :
      b.advancePaid === 0;
    return matchesSearch && matchesStatus && matchesType && matchesDate && matchesBus && matchesDriver && matchesPayment;
  });

  const isAnyFilterActive = 
    searchQuery !== '' || 
    statusFilter !== 'all' || 
    typeFilter !== 'all' || 
    dateFilter !== 'all' || 
    busFilter !== 'all' || 
    driverFilter !== 'all' || 
    paymentFilter !== 'all';

    const handleConfirmDelete = () => {
    if (!deleteModalBooking) return;
    deleteCharterBooking(deleteModalBooking.id);
    setDeleteModalBooking(null);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
    setCustomStart('');
    setCustomEnd('');
    setBusFilter('all');
    setDriverFilter('all');
    setPaymentFilter('all');
  };

  // Handle Edit initiation with safety check
  const handleEditClick = (booking: CharterBooking) => {
    if (booking.status === 'Confirmed' || booking.advancePaid > 0) {
      setPendingEditBooking(booking);
      setWarningModalOpen(true);
    } else {
      populateEditForm(booking);
    }
  };

  const populateEditForm = (booking: CharterBooking) => {
    setEditingBooking(booking);
    setFormData({
      customerId: booking.customerId,
      customerName: booking.customerName,
      phone: booking.phone,
      altPhone: booking.altPhone || '',
      address: booking.address,
      bookingType: booking.bookingType,
      pickup: booking.pickup,
      drop: booking.drop,
      stops: booking.stops,
      pickupDateTime: booking.pickupDateTime,
      returnDateTime: booking.returnDateTime,
      passengers: booking.passengers,
      busTypeRequired: booking.busTypeRequired,
      busCount: booking.busCount,
      schoolName: booking.conditionalNotes?.schoolName || '',
      teacherContact: booking.conditionalNotes?.teacherContact || '',
      department: booking.conditionalNotes?.department || '',
      workOrderNo: booking.conditionalNotes?.workOrderNo || '',
      rateType: booking.quote.rateType,
      ratePerUnit: booking.quote.ratePerUnit,
      units: booking.quote.units,
      driverAllowance: booking.quote.driverAllowance,
      toll: booking.quote.toll,
      parking: booking.quote.parking,
      nightHalt: booking.quote.nightHalt,
      gstIncluded: booking.quote.gstIncluded,
      gstRate: booking.quote.gstRate,
      advancePaid: booking.advancePaid,
      paymentMode: booking.paymentMode,
      assignedBusId: booking.assignedBuses[0]?.busId || '',
      assignedDriverId: booking.assignedBuses[0]?.driverId || '',
      assignedConductorId: booking.assignedBuses[0]?.conductorId || '',
      assignedHelperId: booking.assignedBuses[0]?.helperId || '',
    });
    setIsNewModalOpen(true);
  };

  // Status progression stepper
  const handleStatusProgress = (booking: CharterBooking) => {
    const progression: Record<CharterBookingStatus, CharterBookingStatus | null> = {
      Enquiry: 'Quoted',
      Quoted: 'Confirmed',
      Confirmed: 'In Progress',
      'In Progress': 'Completed',
      Completed: null,
      Cancelled: null,
    };
    const next = progression[booking.status];
    if (next) {
      updateCharterBooking(booking.id, { status: next }, `Advanced status from ${booking.status} to ${next}`);
    }
  };

  // Form Submit
  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (conflictingBooking && formData.assignedBusId) {
      showToast({
        type: 'error',
        title: 'Double-Booking Blocked!',
        message: `Bus is already committed to #${conflictingBooking.bookingNumber}. Pick another available bus.`,
      });
      return;
    }

    const assignedBus = buses.find((b) => b.id === formData.assignedBusId);
    const assignedDriver = workers.find((w) => w.id === formData.assignedDriverId);
    const assignedConductor = workers.find((w) => w.id === formData.assignedConductorId);
    const assignedHelper = workers.find((w) => w.id === formData.assignedHelperId);

    const assignedBuses = assignedBus ? [{
      busId: assignedBus.id,
      busNumber: assignedBus.plateNumber,
      driverId: assignedDriver?.id,
      driverName: assignedDriver?.name,
      conductorId: assignedConductor?.id,
      conductorName: assignedConductor?.name,
      helperId: assignedHelper?.id,
      helperName: assignedHelper?.name,
    }] : [];

    const quoteObj = {
      rateType: formData.rateType,
      ratePerUnit: Number(formData.ratePerUnit),
      units: Number(formData.units),
      driverAllowance: Number(formData.driverAllowance),
      toll: Number(formData.toll),
      parking: Number(formData.parking),
      nightHalt: Number(formData.nightHalt),
      gstIncluded: formData.gstIncluded,
      gstRate: Number(formData.gstRate),
      subtotal,
      gstAmount,
      grandTotal,
    };

    const conditionalNotes = {
      schoolName: formData.schoolName,
      teacherContact: formData.teacherContact,
      department: formData.department,
      workOrderNo: formData.workOrderNo,
    };

    if (editingBooking) {
      updateCharterBooking(editingBooking.id, {
        customerName: formData.customerName,
        phone: formData.phone,
        altPhone: formData.altPhone,
        address: formData.address,
        bookingType: formData.bookingType,
        pickup: formData.pickup,
        drop: formData.drop,
        stops: formData.stops,
        pickupDateTime: formData.pickupDateTime,
        returnDateTime: formData.returnDateTime,
        passengers: Number(formData.passengers),
        busTypeRequired: formData.busTypeRequired,
        busCount: Number(formData.busCount),
        conditionalNotes,
        quote: quoteObj,
        advancePaid: Number(formData.advancePaid),
        balanceDue,
        paymentMode: formData.paymentMode,
        assignedBuses,
      }, 'Updated charter terms and schedule');
    } else {
      addCharterBooking({
        bookingNumber: `DR-CH-${Math.floor(1030 + Math.random() * 90)}`,
        customerId: formData.customerId || `cust-new-${Date.now()}`,
        customerName: formData.customerName,
        phone: formData.phone,
        altPhone: formData.altPhone,
        address: formData.address,
        bookingType: formData.bookingType,
        pickup: formData.pickup,
        drop: formData.drop,
        stops: formData.stops,
        pickupDateTime: formData.pickupDateTime,
        returnDateTime: formData.returnDateTime,
        passengers: Number(formData.passengers),
        busTypeRequired: formData.busTypeRequired,
        busCount: Number(formData.busCount),
        conditionalNotes,
        quote: quoteObj,
        advancePaid: Number(formData.advancePaid),
        balanceDue,
        paymentMode: formData.paymentMode,
        status: formData.advancePaid > 0 ? 'Confirmed' : 'Quoted',
        assignedBuses,
      });
    }

    setIsNewModalOpen(false);
    setEditingBooking(null);
  };

  const handleExportCSV = () => {
    const headers = ['Booking No', 'Customer', 'Phone', 'Type', 'Pickup', 'Drop', 'Dates', 'Status', 'Total', 'Advance', 'Balance', 'Bus'];
    const rows = filteredBookings.map((b) => [
      b.bookingNumber,
      b.customerName,
      b.phone,
      b.bookingType,
      b.pickup,
      b.drop,
      `${formatDate(b.pickupDateTime)} to ${formatDate(b.returnDateTime)}`,
      b.status,
      b.quote.grandTotal,
      b.advancePaid,
      b.balanceDue,
      b.assignedBuses[0]?.busNumber || 'Unassigned',
    ]);
    exportToCSV('Charter_Bookings_Report', headers, rows);
    showToast({ type: 'success', title: 'Excel / CSV Export Downloaded' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Charter Bookings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              {filteredBookings.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete management of wedding (Shadi/Tilak/Vivah), school picnics, pilgrimage circuits & government contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingBooking(null);
              setFormData(initialForm);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Charter Booking</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Suite */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking #, customer, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Date Filter & Clear */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-600 ml-1 mr-1" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterOption)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Dates</option>
                <option value="today">Today (02 Nov)</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">Nov 2026</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none"
                />
              </div>
            )}

            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors border border-rose-200"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Status, Type, Bus, Driver, Payment */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-500" />
            Filters:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="Enquiry">Enquiry</option>
            <option value="Quoted">Quoted</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Booking Types</option>
            <option value="Shadi">Shadi (Wedding)</option>
            <option value="Tilak">Tilak Ceremony</option>
            <option value="Vivah">Vivah</option>
            <option value="School Trip">School Trip</option>
            <option value="Tirth Yatra">Tirth Yatra</option>
            <option value="Government Work">Government Work</option>
          </select>

          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Buses ({buses.length})</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.plateNumber} ({bus.type})
              </option>
            ))}
          </select>

          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Drivers</option>
            {workers.filter(w => w.type === 'driver').map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Payment States</option>
            <option value="fullyPaid">Fully Paid (Balance ₹0)</option>
            <option value="partial">Advance Paid (Balance Due)</option>
            <option value="unpaid">Zero Advance Paid</option>
          </select>

          <div className="ml-auto text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-bold">{filteredBookings.length}</strong> of {charterBookings.length} bookings
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Booking No</th>
                <th className="p-3.5">Customer & Contacts</th>
                <th className="p-3.5">Type & Itinerary</th>
                <th className="p-3.5">Travel Dates</th>
                <th className="p-3.5">Assigned Bus & Crew</th>
                <th className="p-3.5 text-right">Financials</th>
                <th className="p-3.5 text-center">Status & Flow</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Booking No */}
                  <td className="p-3.5 align-top">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {b.bookingNumber}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {formatDate(b.createdAt)}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="p-3.5 align-top">
                    <div className="font-bold text-slate-900">{b.customerName}</div>
                    <div className="text-slate-500">{b.phone}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{b.address}</div>
                  </td>

                  {/* Type & Itinerary */}
                  <td className="p-3.5 align-top">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      b.bookingType === 'Shadi' || b.bookingType === 'Vivah'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : b.bookingType === 'School Trip'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : b.bookingType === 'Government Work'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {b.bookingType}
                    </span>
                    <div className="text-[11px] text-slate-800 font-semibold mt-1">
                      {b.pickup} → {b.drop}
                    </div>
                    {b.stops && <div className="text-[10px] text-slate-500 truncate max-w-[150px]">Via {b.stops}</div>}
                    {b.conditionalNotes?.schoolName && (
                      <div className="text-[10px] text-blue-700 mt-0.5 font-medium">
                        School: {b.conditionalNotes.schoolName}
                      </div>
                    )}
                    {b.conditionalNotes?.department && (
                      <div className="text-[10px] text-purple-700 mt-0.5 font-medium">
                        Govt: {b.conditionalNotes.department}
                      </div>
                    )}
                  </td>

                  {/* Travel Dates */}
                  <td className="p-3.5 align-top text-[11px]">
                    <div className="text-slate-900 font-semibold">
                      {formatDateTime(b.pickupDateTime)}
                    </div>
                    <div className="text-slate-500">
                      to {formatDateTime(b.returnDateTime)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {b.passengers} Pax • {b.busTypeRequired}
                    </div>
                  </td>

                  {/* Assigned Bus & Crew */}
                  <td className="p-3.5 align-top">
                    {b.assignedBuses.length > 0 ? (
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-900 bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                          {b.assignedBuses[0].busNumber}
                        </div>
                        {b.assignedBuses[0].driverName && (
                          <div className="text-[11px] text-slate-600">
                            Driver: <strong>{b.assignedBuses[0].driverName.split(' ')[0]}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-rose-500 font-semibold italic">
                        Not Assigned
                      </span>
                    )}
                  </td>

                  {/* Financials */}
                  <td className="p-3.5 align-top text-right">
                    <div className="font-black text-slate-900 font-mono text-sm">
                      {formatINR(b.quote.grandTotal)}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      Adv: {formatINR(b.advancePaid)}
                    </div>
                    {b.balanceDue > 0 ? (
                      <div className="text-[11px] font-bold text-rose-600 font-mono">
                        Bal: {formatINR(b.balanceDue)}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                        PAID FULL
                      </span>
                    )}
                  </td>

                  {/* Status & Flow */}
                  <td className="p-3.5 align-top text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      b.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : b.status === 'Quoted'
                        ? 'bg-amber-100 text-amber-800'
                        : b.status === 'Completed'
                        ? 'bg-slate-100 text-slate-700'
                        : b.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {b.status}
                    </span>

                    {/* One-click progression trigger */}
                    {b.status !== 'Completed' && b.status !== 'Cancelled' && (
                      <button
                        onClick={() => handleStatusProgress(b)}
                        className="mt-1.5 flex items-center gap-1 mx-auto text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors"
                        title="Advance status to next stage"
                      >
                        <span>Next Status</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Printable Quote / Confirmation */}
                      <button
                        onClick={() => setPreviewBooking(b)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                        title="Print Quote / Confirmation"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Send SMS Alert */}
                      <button
                        onClick={() => {
                          sendMockSms(
                            b.customerName,
                            b.phone,
                            'Charter Booking Confirmation',
                            `Dear ${b.customerName}, your booking #${b.bookingNumber} (${b.bookingType}) is ${b.status} with Deepak Raj Travels. Bus: ${b.assignedBuses[0]?.busNumber || 'Assigned soon'}. Advance: ${formatINR(b.advancePaid)}. Balance: ${formatINR(b.balanceDue)}.`,
                            'Charter Action'
                          );
                          showToast({
                            type: 'success',
                            title: 'Confirmation SMS Sent',
                            message: `Logged to SMS registry for ${b.phone}.`,
                          });
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                        title="Send SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* History */}
                      <button
                        onClick={() => openHistory('Charter Booking', b.id, `${b.bookingNumber} (${b.customerName})`)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                        title="Audit History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit with warning */}
                      <button
                        onClick={() => handleEditClick(b)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                        title="Edit Booking"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New / Edit Charter Booking & Quote Builder */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 text-slate-900 shadow-2xl my-auto border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBooking ? `Edit Charter Booking #${editingBooking.bookingNumber}` : 'New Charter Booking & Quote Builder'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure trip itinerary, live fare calculation, conditional notes & conflict check
                </p>
              </div>
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingBooking(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-5 text-xs">
              {/* Row 1: Customer Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                  1. Customer Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Customer / Party Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Ramesh Verma"
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Mobile (+91) *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98111 22334"
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Alternate Phone</label>
                    <input
                      type="text"
                      value={formData.altPhone}
                      onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                      placeholder="+91 98111 22330"
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-slate-600 mb-1">Billing Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Karol Bagh, Delhi 110005"
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Booking Type & Conditional Fields */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                  2. Booking Purpose & Notes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Booking Type *</label>
                    <select
                      value={formData.bookingType}
                      onChange={(e) => setFormData({ ...formData, bookingType: e.target.value as CharterBookingType })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                    >
                      <option value="Shadi">Shadi (Wedding Party)</option>
                      <option value="Tilak">Tilak Ceremony</option>
                      <option value="Vivah">Vivah</option>
                      <option value="School Trip">School Trip (Educational)</option>
                      <option value="Tirth Yatra">Tirth Yatra (Pilgrimage)</option>
                      <option value="Government Work">Government Work</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Required Bus Type</label>
                    <select
                      value={formData.busTypeRequired}
                      onChange={(e) => setFormData({ ...formData, busTypeRequired: e.target.value as BusType })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="AC Sleeper">AC Sleeper 2+1 (36-40S)</option>
                      <option value="AC Seater">AC Seater (45-50S)</option>
                      <option value="Non-AC Seater">Non-AC Seater Deluxe (50S)</option>
                      <option value="Mini Bus">Mini Bus (20-28S)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Expected Passengers</label>
                    <input
                      type="number"
                      value={formData.passengers}
                      onChange={(e) => setFormData({ ...formData, passengers: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Conditional: School Trip */}
                  {formData.bookingType === 'School Trip' && (
                    <>
                      <div>
                        <label className="block text-blue-700 font-bold mb-1">School Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.schoolName}
                          onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                          placeholder="e.g. DAV Public School, Noida"
                          className="w-full p-2 rounded-lg border border-blue-300 bg-blue-50/50 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-blue-700 font-bold mb-1">Teacher / Coordinator Contact *</label>
                        <input
                          type="text"
                          required
                          value={formData.teacherContact}
                          onChange={(e) => setFormData({ ...formData, teacherContact: e.target.value })}
                          placeholder="e.g. Mrs. Sunita Sharma (+91 98188 33415)"
                          className="w-full p-2 rounded-lg border border-blue-300 bg-blue-50/50 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Conditional: Government Work */}
                  {formData.bookingType === 'Government Work' && (
                    <>
                      <div>
                        <label className="block text-purple-700 font-bold mb-1">Department Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="e.g. Bihar Tourism / Ministry of Railways"
                          className="w-full p-2 rounded-lg border border-purple-300 bg-purple-50/50 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-purple-700 font-bold mb-1">Work Order / Sanction Ref *</label>
                        <input
                          type="text"
                          required
                          value={formData.workOrderNo}
                          onChange={(e) => setFormData({ ...formData, workOrderNo: e.target.value })}
                          placeholder="e.g. BSTDC/TRN/2026/892 dated 22-Oct-2026"
                          className="w-full p-2 rounded-lg border border-purple-300 bg-purple-50/50 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Row 3: Itinerary & Schedule */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                  3. Journey Itinerary & Dates
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Pickup Location *</label>
                    <input
                      type="text"
                      required
                      value={formData.pickup}
                      onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
                      placeholder="e.g. Karol Bagh, Delhi"
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Destination Drop *</label>
                    <input
                      type="text"
                      required
                      value={formData.drop}
                      onChange={(e) => setFormData({ ...formData, drop: e.target.value })}
                      placeholder="e.g. Vrindavan / Patna / Haridwar"
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1">En-route Stops & Sightseeing</label>
                    <input
                      type="text"
                      value={formData.stops}
                      onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                      placeholder="e.g. Mathura, Agra Expressway, Gokul"
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Pickup Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.pickupDateTime}
                      onChange={(e) => setFormData({ ...formData, pickupDateTime: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Return Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.returnDateTime}
                      onChange={(e) => setFormData({ ...formData, returnDateTime: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Fleet Assignment & Intelligent Conflict Detector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    4. Fleet & Crew Allocation (Double-Booking Block)
                  </span>
                  {conflictingBooking && (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Conflict Detected!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Assign Bus</label>
                    <select
                      value={formData.assignedBusId}
                      onChange={(e) => setFormData({ ...formData, assignedBusId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Bus --</option>
                      {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.plateNumber} ({bus.model.slice(0, 18)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Assign Driver</label>
                    <select
                      value={formData.assignedDriverId}
                      onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Driver --</option>
                      {workers.filter((w) => w.type === 'driver').map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Assign Conductor</label>
                    <select
                      value={formData.assignedConductorId}
                      onChange={(e) => setFormData({ ...formData, assignedConductorId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Conductor --</option>
                      {workers.filter((w) => w.type === 'conductor').map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Assign Helper</label>
                    <select
                      value={formData.assignedHelperId}
                      onChange={(e) => setFormData({ ...formData, assignedHelperId: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Helper --</option>
                      {workers.filter((w) => w.type === 'helper').map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Double-Booking Conflict Alert Box */}
                {conflictingBooking && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs">
                          Double Booking Block: Bus is already committed!
                        </p>
                        <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                          This bus is locked on booking <strong>#{conflictingBooking.bookingNumber}</strong> ({conflictingBooking.customerName}) from {formatDateTime(conflictingBooking.pickupDateTime)} to {formatDateTime(conflictingBooking.returnDateTime)}.
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-rose-950">Suggested Free Buses:</span>
                          {buses
                            .filter((b) => !checkBusConflict(b.id, formData.pickupDateTime, formData.returnDateTime, editingBooking?.id))
                            .slice(0, 3)
                            .map((freeBus) => (
                              <button
                                type="button"
                                key={freeBus.id}
                                onClick={() => setFormData({ ...formData, assignedBusId: freeBus.id })}
                                className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-500 font-mono shadow-sm"
                              >
                                {freeBus.plateNumber}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Live Quote Builder */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px] block mb-3">
                  5. Live Quotation Calculator
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Rate Basis</label>
                    <select
                      value={formData.rateType}
                      onChange={(e) => setFormData({ ...formData, rateType: e.target.value as 'km' | 'day' })}
                      className="w-full p-2 rounded-lg border border-amber-300 bg-white"
                    >
                      <option value="day">Per Day Rate</option>
                      <option value="km">Per Km Rate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Rate / {formData.rateType === 'day' ? 'Day' : 'Km'} (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.ratePerUnit}
                      onChange={(e) => setFormData({ ...formData, ratePerUnit: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Total {formData.rateType === 'day' ? 'Days' : 'Kms'}
                    </label>
                    <input
                      type="number"
                      value={formData.units}
                      onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Driver Bhatta (₹)</label>
                    <input
                      type="number"
                      value={formData.driverAllowance}
                      onChange={(e) => setFormData({ ...formData, driverAllowance: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Toll & State Tax (₹)</label>
                    <input
                      type="number"
                      value={formData.toll}
                      onChange={(e) => setFormData({ ...formData, toll: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Night Halt / Parking</label>
                    <input
                      type="number"
                      value={formData.nightHalt + formData.parking}
                      onChange={(e) => setFormData({ ...formData, nightHalt: Number(e.target.value), parking: 0 })}
                      className="w-full p-2 rounded-lg border border-amber-300 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* GST Toggle & Live Total Math */}
                <div className="mt-4 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.gstIncluded}
                        onChange={(e) => setFormData({ ...formData, gstIncluded: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800">GST 5% Included in Fare</span>
                    </label>

                    <div className="text-xs text-slate-600">
                      Subtotal: <strong className="font-mono">{formatINR(subtotal)}</strong>
                      {!formData.gstIncluded && (
                        <span> + GST 5%: <strong className="font-mono">{formatINR(gstAmount)}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">Total Quote:</span>
                    <span className="text-xl font-black font-mono text-amber-950 bg-amber-200/60 px-3 py-1 rounded-xl border border-amber-300">
                      {formatINR(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 6: Advance & Payment Collection */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Advance Received (₹)</label>
                  <input
                    type="number"
                    value={formData.advancePaid}
                    onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Balance Due</label>
                  <div className="p-2 rounded-lg border border-slate-200 bg-slate-100 font-mono font-black text-rose-700">
                    {formatINR(balanceDue)}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setEditingBooking(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(conflictingBooking)}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold shadow transition-colors"
                >
                  {editingBooking ? 'Save Changes' : 'Confirm & Save Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warning Modal when editing Confirmed/Paid record */}
      <WarningModal
        isOpen={warningModalOpen}
        type="confirmed_record"
        title="Edit Confirmed Charter Booking?"
        message="This charter booking is already Confirmed with advance payment received. Modifying schedule or rates will change the agreed passenger quotation and may impact fleet dispatch. Any changes will be indelibly recorded in the Change History audit trail."
        confirmLabel="I Understand, Proceed to Edit"
        onConfirm={() => {
          setWarningModalOpen(false);
          if (pendingEditBooking) {
            populateEditForm(pendingEditBooking);
            setPendingEditBooking(null);
          }
        }}
        onCancel={() => {
          setWarningModalOpen(false);
          setPendingEditBooking(null);
        }}
      />

      {/* Printable Quotation / Confirmation Preview Modal */}
      {previewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 text-slate-900 shadow-2xl my-auto border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Printable Charter Agreement Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                >
                  Print
                </button>
                <button
                  onClick={() => setPreviewBooking(null)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="text-center border-b pb-3">
                <h2 className="text-lg font-black uppercase text-slate-950">Deepak Raj Travels</h2>
                <p className="text-[11px] text-slate-600">Shop 14, Fatehpuri Chowk, Near Kashmere Gate ISBT, Delhi</p>
                <p className="text-[11px] font-mono font-bold mt-1">CHARTER QUOTATION #{previewBooking.bookingNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer:</span>
                  <p className="font-bold">{previewBooking.customerName}</p>
                  <p>{previewBooking.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Type & Bus:</span>
                  <p className="font-bold">{previewBooking.bookingType}</p>
                  <p className="font-mono">{previewBooking.assignedBuses[0]?.busNumber || 'To be allocated'}</p>
                </div>
              </div>

              <div>
                <p><strong>Pickup:</strong> {previewBooking.pickup} ({formatDateTime(previewBooking.pickupDateTime)})</p>
                <p><strong>Destination:</strong> {previewBooking.drop} (Return: {formatDateTime(previewBooking.returnDateTime)})</p>
                {previewBooking.stops && <p><strong>Stops:</strong> {previewBooking.stops}</p>}
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total (Including GST):</span>
                  <span className="font-mono">{formatINR(previewBooking.quote.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 mt-1">
                  <span>Advance Paid:</span>
                  <span className="font-mono">{formatINR(previewBooking.advancePaid)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold border-t border-amber-200 pt-1 mt-1">
                  <span>Balance Payable:</span>
                  <span className="font-mono">{formatINR(previewBooking.balanceDue)}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                * Note: Toll, driver allowance, and parking charges as specified above. Extra km/hours beyond booking terms will be charged @ standard rates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

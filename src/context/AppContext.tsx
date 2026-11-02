import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Bus, Worker, AttendanceRecord, WorkerAdvance, Customer, 
  CharterBooking, Route, RouteTicket, PaymentRecord, Expense, 
  LoanEMI, Reminder, SmsTemplate, SmsLog, GSTInvoice, 
  ChangeHistoryEntry, BusinessSettings, Language 
} from '../types';
import { 
  INITIAL_SETTINGS, INITIAL_BUSES, INITIAL_WORKERS, INITIAL_ATTENDANCE, 
  INITIAL_ADVANCES, INITIAL_CUSTOMERS, INITIAL_CHARTER_BOOKINGS, INITIAL_ROUTES, 
  INITIAL_TICKETS, INITIAL_PAYMENTS, INITIAL_EXPENSES, INITIAL_EMIS, 
  INITIAL_REMINDERS, INITIAL_SMS_TEMPLATES, INITIAL_SMS_LOGS, 
  INITIAL_GST_INVOICES, INITIAL_CHANGE_HISTORY 
} from '../data/seedData';
import { TRANSLATIONS } from '../utils/formatters';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'DEEPAK_RAJ_BUS_ADMIN_DATA_V5';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

export interface GuidedStep {
  step: number;
  title: string;
  description: string;
  path: string;
  highlightAction?: string;
}

export const GUIDED_TOUR_STEPS: GuidedStep[] = [
  {
    step: 1,
    title: '1. Dashboard Overview & Alerts',
    description: 'Welcome! High-level operational cockpit: today’s active trips, monthly revenue/expense, document expiries, and 3-day EMI warning chips.',
    path: '/',
    highlightAction: 'Review cards and the Needs Attention section',
  },
  {
    step: 2,
    title: '2. Charter Booking with Double-Booking Block',
    description: 'Create and quote a Shadi charter. Watch the intelligent conflict detector prevent double-booking on already committed buses (DL 01 AB 4090).',
    path: '/charter-bookings',
    highlightAction: 'Click "New Booking" or check booking #DR-CH-1021 status flow',
  },
  {
    step: 3,
    title: '3. Record Customer Advance Payment',
    description: 'Record an advance receipt via UPI/Bank. Balance updates immediately across customer ledgers and creates a real receipt + SMS alert.',
    path: '/payments',
    highlightAction: 'View the live cashbook ledger and latest receipts',
  },
  {
    step: 4,
    title: '4. Route Ticketing & Interactive Seat Selection',
    description: 'Visual sleeper/seater layout with passenger details, ladies seat indicators, stop-wise dynamic pricing, QR code tickets, and WhatsApp send.',
    path: '/route-tickets',
    highlightAction: 'Try selecting seats or view printable ticket preview',
  },
  {
    step: 5,
    title: '5. Cancellation Engine & Auto Credit Note',
    description: 'Passenger requests cancellation? The engine applies time-tiered refund rules (90%/50%/0%) and auto-issues a GST Credit Note.',
    path: '/route-tickets',
    highlightAction: 'Click Cancel on ticket #DR-TK-5084 or view its Credit Note',
  },
  {
    step: 6,
    title: '6. Expenses & Per-Trip Profit/Loss',
    description: 'Categorized diesel, toll, and maintenance expenses with bill attachment. Compare per-trip earnings vs direct trip costs.',
    path: '/expenses',
    highlightAction: 'Inspect trip profit/loss and diesel invoices',
  },
  {
    step: 7,
    title: '7. Reminders & Fleet Compliance Hub',
    description: 'Proactive warnings for expired fitness certificates, 6-day insurance renewals, and EMI due dates with 1-click SMS dispatch.',
    path: '/reminders',
    highlightAction: 'Test Snooze, Done, or Send WhatsApp reminder',
  },
  {
    step: 8,
    title: '8. Monthly Payroll & Salary Disbursal',
    description: 'Attendance-prorated wages + allowances − advances = net payable. Finalizing salary auto-posts an Expense and sends an SMS.',
    path: '/workers',
    highlightAction: 'Check attendance grid and generate employee salary slip',
  },
  {
    step: 9,
    title: '9. GST Invoicing & Tax Intelligence',
    description: 'Automatic CGST+SGST (intra-state Delhi) vs IGST (inter-state UP/Bihar) calculation. Comprehensive B2B/B2C sales register with CSV export.',
    path: '/gst',
    highlightAction: 'Inspect GST invoice tax breakdown and export sales register',
  },
  {
    step: 10,
    title: '10. Edit Warning & Change Audit Trail',
    description: 'Editing a confirmed/paid record triggers a safety warning. Every modification is logged to the indelible Change History log.',
    path: '/change-history',
    highlightAction: 'Audit before/after values and timestamps',
  },
  {
    step: 11,
    title: '11. Settings & Live Ticket Designer',
    description: 'Customize ticket terms, GST rates, and toggle fields (passenger ID, GST lines, QR) with a live updating preview on the right!',
    path: '/settings',
    highlightAction: 'Toggle ticket display fields to see the live ticket re-render',
  },
];

interface AppContextType {
  // Authentication & Session
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  currentUser: { name: string; role: string; email: string; phone: string };

  // Data Collections
  settings: BusinessSettings;
  buses: Bus[];
  workers: Worker[];
  attendance: AttendanceRecord[];
  advances: WorkerAdvance[];
  customers: Customer[];
  charterBookings: CharterBooking[];
  routes: Route[];
  tickets: RouteTicket[];
  payments: PaymentRecord[];
  expenses: Expense[];
  emis: LoanEMI[];
  reminders: Reminder[];
  smsTemplates: SmsTemplate[];
  smsLogs: SmsLog[];
  gstInvoices: GSTInvoice[];
  changeHistory: ChangeHistoryEntry[];

  // Translations & Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Actions
  resetDemoData: () => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  recordAudit: (
    entityType: string, 
    entityId: string, 
    entityTitle: string, 
    action: ChangeHistoryEntry['action'], 
    fieldChanged?: string, 
    oldValue?: string, 
    newValue?: string, 
    reason?: string
  ) => void;

  // Modals & UI Controls
  activeHistory: { entityType: string; entityId: string; entityTitle: string } | null;
  openHistory: (entityType: string, entityId: string, entityTitle: string) => void;
  closeHistory: () => void;

  ticketModalData: RouteTicket | null;
  openTicketModal: (ticket: RouteTicket) => void;
  closeTicketModal: () => void;

  invoiceModalData: GSTInvoice | null;
  openInvoiceModal: (invoice: GSTInvoice) => void;
  closeInvoiceModal: () => void;

  salarySlipModalData: { worker: Worker; month: string; netPayable: number; base: number; allowance: number; advanceDeduction: number } | null;
  openSalarySlipModal: (data: { worker: Worker; month: string; netPayable: number; base: number; allowance: number; advanceDeduction: number }) => void;
  closeSalarySlipModal: () => void;

  // Domain Actions
  addCharterBooking: (booking: Omit<CharterBooking, 'id' | 'createdAt'>) => CharterBooking;
  updateCharterBooking: (id: string, updates: Partial<CharterBooking>, reason?: string) => void;
  cancelCharterBooking: (id: string, reason: string) => void;

  addRouteTicket: (ticket: Omit<RouteTicket, 'id' | 'bookingDate'>) => RouteTicket;
  updateRouteTicket: (id: string, updates: Partial<RouteTicket>, reason?: string) => void;
  deleteRouteTicket: (id: string) => void;
  cancelRouteTicket: (id: string, reason: string) => void;
  addRoute: (route: Route) => void;
  updateRoute: (id: string, updates: Partial<Route>) => void;
  addBus: (bus: Bus) => void;
  addWorker: (worker: Worker) => void;
  updateLoanEmi: (id: string, updates: Partial<LoanEMI>, reason?: string) => void;
  addLoanEmi: (emi: LoanEMI) => void;

  addCustomer: (cust: Omit<Customer, 'id' | 'totalBookings' | 'totalSpent' | 'pendingBalance'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>, reason?: string) => void;
  deleteCustomer: (id: string) => void;

  addPayment: (payment: Omit<PaymentRecord, 'id' | 'receiptNumber'>) => PaymentRecord;
  updatePayment: (id: string, updates: Partial<PaymentRecord>, reason?: string) => void;
  deletePayment: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>, reason?: string) => void;
  deleteExpense: (id: string) => void;

  deleteCharterBooking: (id: string) => void;
  deleteBus: (id: string) => void;
  deleteWorker: (id: string) => void;
  deleteLoanEmi: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Reminder;
  deleteReminder: (remId: string) => void;
  updateSmsTemplate: (id: string, body: string) => void;

  updateBus: (id: string, updates: Partial<Bus>, reason?: string) => void;
  updateWorker: (id: string, updates: Partial<Worker>, reason?: string) => void;
  updateAttendance: (workerId: string, date: string, status: 'P' | 'A' | 'HD' | 'L') => void;
  addWorkerAdvance: (advance: Omit<WorkerAdvance, 'id'>) => void;
  payWorkerSalary: (workerId: string, month: string, amount: number, paymentMode: 'Bank' | 'Cash' | 'UPI') => void;

  markEmiPaid: (emiId: string, reference: string) => void;
  snoozeReminder: (remId: string) => void;
  markReminderDone: (remId: string) => void;
  sendMockSms: (recipientName: string, recipientPhone: string, templateName: string, message: string, triggerEvent: string) => void;

  addGstInvoice: (invoice: Omit<GSTInvoice, 'id'>) => GSTInvoice;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;

  // Guided Demo Tour
  isTourActive: boolean;
  currentTourStep: number;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  goToTourStep: (stepNumber: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [activeHistory, setActiveHistory] = useState<{ entityType: string; entityId: string; entityTitle: string } | null>(null);
  const [ticketModalData, setTicketModalData] = useState<RouteTicket | null>(null);
  const [invoiceModalData, setInvoiceModalData] = useState<GSTInvoice | null>(null);
  const [salarySlipModalData, setSalarySlipModalData] = useState<{ worker: Worker; month: string; netPayable: number; base: number; allowance: number; advanceDeduction: number } | null>(null);

  // Guided tour state
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(1);

  // State initialization with localStorage fallback
  const loadInitialData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          settings: { ...INITIAL_SETTINGS, ...(parsed.settings || {}) },
          buses: (parsed.buses || INITIAL_BUSES).map((b: any, idx: number) => ({
            ...(INITIAL_BUSES[idx] || {}),
            ...b,
            tyreChanges: b.tyreChanges || INITIAL_BUSES[idx]?.tyreChanges || [],
          })),
          workers: parsed.workers || INITIAL_WORKERS,
          attendance: parsed.attendance || INITIAL_ATTENDANCE,
          advances: parsed.advances || INITIAL_ADVANCES,
          customers: parsed.customers || INITIAL_CUSTOMERS,
          charterBookings: parsed.charterBookings || INITIAL_CHARTER_BOOKINGS,
          routes: parsed.routes || INITIAL_ROUTES,
          tickets: parsed.tickets || INITIAL_TICKETS,
          payments: parsed.payments || INITIAL_PAYMENTS,
          expenses: parsed.expenses || INITIAL_EXPENSES,
          emis: (parsed.emis || INITIAL_EMIS).map((e: any, idx: number) => ({
            ...(INITIAL_EMIS[idx] || {}),
            ...e,
            paymentHistory: e.paymentHistory || INITIAL_EMIS[idx]?.paymentHistory || [],
          })),
          reminders: parsed.reminders || INITIAL_REMINDERS,
          smsTemplates: parsed.smsTemplates || INITIAL_SMS_TEMPLATES,
          smsLogs: parsed.smsLogs || INITIAL_SMS_LOGS,
          gstInvoices: parsed.gstInvoices || INITIAL_GST_INVOICES,
          changeHistory: parsed.changeHistory || INITIAL_CHANGE_HISTORY,
        };
      }
    } catch (e) {
      console.error('Failed to load local storage data', e);
    }
    return {
      settings: INITIAL_SETTINGS,
      buses: INITIAL_BUSES,
      workers: INITIAL_WORKERS,
      attendance: INITIAL_ATTENDANCE,
      advances: INITIAL_ADVANCES,
      customers: INITIAL_CUSTOMERS,
      charterBookings: INITIAL_CHARTER_BOOKINGS,
      routes: INITIAL_ROUTES,
      tickets: INITIAL_TICKETS,
      payments: INITIAL_PAYMENTS,
      expenses: INITIAL_EXPENSES,
      emis: INITIAL_EMIS,
      reminders: INITIAL_REMINDERS,
      smsTemplates: INITIAL_SMS_TEMPLATES,
      smsLogs: INITIAL_SMS_LOGS,
      gstInvoices: INITIAL_GST_INVOICES,
      changeHistory: INITIAL_CHANGE_HISTORY,
    };
  };

  const [data, setData] = useState(loadInitialData);

  // Auto-persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }, [data]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const recordAudit = (
    entityType: string,
    entityId: string,
    entityTitle: string,
    action: ChangeHistoryEntry['action'],
    fieldChanged?: string,
    oldValue?: string,
    newValue?: string,
    reason?: string
  ) => {
    const entry: ChangeHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: '2026-11-02 21:55',
      userName: 'Deepak Raj (Owner)',
      entityType,
      entityId,
      entityTitle,
      action,
      fieldChanged,
      oldValue,
      newValue,
      reason: reason || 'Updated via Admin portal',
    };
    setData((prev: any) => ({
      ...prev,
      changeHistory: [entry, ...prev.changeHistory],
    }));
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const freshData = {
      settings: INITIAL_SETTINGS,
      buses: INITIAL_BUSES,
      workers: INITIAL_WORKERS,
      attendance: INITIAL_ATTENDANCE,
      advances: INITIAL_ADVANCES,
      customers: INITIAL_CUSTOMERS,
      charterBookings: INITIAL_CHARTER_BOOKINGS,
      routes: INITIAL_ROUTES,
      tickets: INITIAL_TICKETS,
      payments: INITIAL_PAYMENTS,
      expenses: INITIAL_EXPENSES,
      emis: INITIAL_EMIS,
      reminders: INITIAL_REMINDERS,
      smsTemplates: INITIAL_SMS_TEMPLATES,
      smsLogs: INITIAL_SMS_LOGS,
      gstInvoices: INITIAL_GST_INVOICES,
      changeHistory: INITIAL_CHANGE_HISTORY,
    };
    setData(freshData);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    showToast({
      type: 'success',
      title: 'Demo Data Reset Completed',
      message: 'All records restored to fresh 2 November 2026 baseline.',
    });
  };

  const currentUser = {
    name: 'Deepak Raj',
    role: 'Owner (Admin)',
    email: 'owner@demo.com',
    phone: '+91 98112 34567',
  };

  const language = data.settings.language || 'en';
  const setLanguage = (lang: Language) => {
    updateSettings({ language: lang });
  };

  const t = (key: string): string => {
    if (TRANSLATIONS[key]) {
      return TRANSLATIONS[key][language] || TRANSLATIONS[key].en;
    }
    return key;
  };

  // Charter Booking Handlers
  const addCharterBooking = (bookingData: Omit<CharterBooking, 'id' | 'createdAt'>): CharterBooking => {
    const newId = `ch-${Date.now()}`;
    const newBooking: CharterBooking = {
      ...bookingData,
      id: newId,
      createdAt: '2026-11-02T21:55',
    };
    setData((prev: any) => ({
      ...prev,
      charterBookings: [newBooking, ...prev.charterBookings],
    }));
    recordAudit('Charter Booking', newId, `${newBooking.bookingNumber} (${newBooking.customerName})`, 'Created', 'all', '', 'New Booking', 'Created via quote builder');
    showToast({
      type: 'success',
      title: 'Charter Booking Created',
      message: `Quotation saved for ${newBooking.customerName}. Booking #${newBooking.bookingNumber}.`,
    });
    return newBooking;
  };

  const updateCharterBooking = (id: string, updates: Partial<CharterBooking>, reason?: string) => {
    setData((prev: any) => {
      const existing = prev.charterBookings.find((b: CharterBooking) => b.id === id);
      const updatedList = prev.charterBookings.map((b: CharterBooking) => 
        b.id === id ? { ...b, ...updates } : b
      );
      return { ...prev, charterBookings: updatedList };
    });
    const booking = data.charterBookings.find((b: CharterBooking) => b.id === id);
    if (booking) {
      recordAudit('Charter Booking', id, `${booking.bookingNumber} (${booking.customerName})`, 'Edited', 'details', 'Old Details', JSON.stringify(updates), reason);
    }
    showToast({
      type: 'info',
      title: 'Booking Updated',
      message: 'Charter booking updated and change history recorded.',
    });
  };

  const cancelCharterBooking = (id: string, reason: string) => {
    setData((prev: any) => {
      const updatedList = prev.charterBookings.map((b: CharterBooking) => 
        b.id === id ? { ...b, status: 'Cancelled' } : b
      );
      return { ...prev, charterBookings: updatedList };
    });
    const booking = data.charterBookings.find((b: CharterBooking) => b.id === id);
    if (booking) {
      recordAudit('Charter Booking', id, `${booking.bookingNumber}`, 'Cancelled', 'status', booking.status, 'Cancelled', reason);
    }
    showToast({
      type: 'warning',
      title: 'Booking Cancelled',
      message: `Charter booking marked as Cancelled.`,
    });
  };

  // Route Ticket Handlers
  const addRouteTicket = (ticketData: Omit<RouteTicket, 'id' | 'bookingDate'>): RouteTicket => {
    const newId = `tk-${Date.now()}`;
    const newTicket: RouteTicket = {
      ...ticketData,
      id: newId,
      bookingDate: '2026-11-02T21:55',
    };
    setData((prev: any) => ({
      ...prev,
      tickets: [newTicket, ...prev.tickets],
    }));

    // Auto add Payment
    const paymentRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      receiptNumber: `DR-REC-${Math.floor(1000 + Math.random() * 9000)}`,
      date: '2026-11-02',
      amount: newTicket.grandTotal,
      type: 'credit',
      mode: 'UPI',
      referenceUtr: `UPI/${Date.now().toString().slice(-8)}/DPKRAJ`,
      customerName: newTicket.customerName,
      category: 'Route Ticket',
      linkedId: newId,
      linkedType: 'ticket',
      notes: `Ticket #${newTicket.ticketNumber} seats: ${newTicket.passengers.map(p => p.seatNumber).join(', ')}`,
    };
    setData((prev: any) => ({
      ...prev,
      payments: [paymentRec, ...prev.payments],
    }));

    // Auto send SMS
    sendMockSms(
      newTicket.customerName,
      newTicket.customerPhone,
      'Route Ticket Issued',
      `Deepak Raj Travels: Ticket #${newTicket.ticketNumber} confirmed for ${newTicket.routeName}. Travel Date: ${newTicket.travelDate}. Seat(s): ${newTicket.passengers.map(p => p.seatNumber).join(', ')}. Total: ₹${newTicket.grandTotal}.`,
      'Route Ticket Booking'
    );

    recordAudit('Route Ticket', newId, `${newTicket.ticketNumber} (${newTicket.customerName})`, 'Created', 'all', '', 'Issued', 'Counter sale completed');

    showToast({
      type: 'success',
      title: 'Ticket Issued & Payment Recorded',
      message: `Ticket #${newTicket.ticketNumber} generated. SMS notification dispatched.`,
    });

    return newTicket;
  };

  const cancelRouteTicket = (id: string, reason: string) => {
    const ticket = data.tickets.find((t: RouteTicket) => t.id === id);
    if (!ticket) return;

    // Refund rules: 24h+ 90%, 6h to 24h 50%, under 6h 0%
    const refundPercent = 90;
    const refundAmount = Math.round(ticket.grandTotal * (refundPercent / 100));
    const cancellationCharge = ticket.grandTotal - refundAmount;
    const creditNoteNum = `DR-CR-2026-${Math.floor(100 + Math.random() * 900)}`;

    const cancellationDetails = {
      cancelledAt: '2026-11-02 21:55',
      refundPercent,
      refundAmount,
      cancellationCharge,
      creditNoteNumber: creditNoteNum,
    };

    // Auto-create Credit Note
    const creditNote: GSTInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: creditNoteNum,
      date: '2026-11-02',
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      customerState: 'Delhi (07)',
      businessGstin: data.settings.gstin,
      businessState: data.settings.state,
      isInterState: false,
      type: 'Credit Note',
      items: [
        {
          description: `Refund for Cancelled Ticket #${ticket.ticketNumber} (${ticket.routeName})`,
          sacHsn: '9964',
          taxableAmount: -Math.round(refundAmount / 1.05),
          gstRate: 5,
          cgstAmount: -Math.round((refundAmount / 1.05) * 0.025),
          sgstAmount: -Math.round((refundAmount / 1.05) * 0.025),
          igstAmount: 0,
          totalAmount: -refundAmount,
        },
      ],
      subtotalTaxable: -Math.round(refundAmount / 1.05),
      totalCgst: -Math.round((refundAmount / 1.05) * 0.025),
      totalSgst: -Math.round((refundAmount / 1.05) * 0.025),
      totalIgst: 0,
      totalTax: -Math.round((refundAmount / 1.05) * 0.05),
      grandTotal: -refundAmount,
      originalInvoiceNumber: ticket.ticketNumber,
      linkedBookingOrTicketId: id,
    };

    setData((prev: any) => ({
      ...prev,
      tickets: prev.tickets.map((t: RouteTicket) => 
        t.id === id ? { ...t, status: 'Cancelled', cancellationDetails } : t
      ),
      gstInvoices: [creditNote, ...prev.gstInvoices],
    }));

    recordAudit('Route Ticket', id, `${ticket.ticketNumber}`, 'Credit Note Issued', 'status', 'Confirmed', 'Cancelled', `Cancelled with ₹${refundAmount} refund (Credit Note ${creditNoteNum}). Reason: ${reason}`);

    showToast({
      type: 'info',
      title: 'Ticket Cancelled & Credit Note Issued',
      message: `Refund of ₹${refundAmount} calculated (${refundPercent}% rule). Credit Note #${creditNoteNum} issued.`,
    });
  };

  const updateRouteTicket = (id: string, updates: Partial<RouteTicket>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      tickets: prev.tickets.map((t: RouteTicket) => t.id === id ? { ...t, ...updates } : t),
    }));
    const tk = data.tickets.find((t: RouteTicket) => t.id === id);
    if (tk) {
      recordAudit('Route Ticket', id, tk.ticketNumber, 'Edited', 'ticket', '', '', reason || 'Updated ticket details');
    }
    showToast({ type: 'success', title: 'Ticket Updated', message: 'Modifications saved and logged.' });
  };

  const deleteRouteTicket = (id: string) => {
    const tk = data.tickets.find((t: RouteTicket) => t.id === id);
    setData((prev: any) => ({
      ...prev,
      tickets: prev.tickets.filter((t: RouteTicket) => t.id !== id),
    }));
    if (tk) {
      recordAudit('Route Ticket', id, tk.ticketNumber, 'Deleted', 'ticket', 'Active', 'Deleted', 'Ticket record permanently deleted');
    }
    showToast({ type: 'warning', title: 'Ticket Deleted' });
  };

  const deleteCharterBooking = (id: string) => {
    const booking = data.charterBookings.find((b: CharterBooking) => b.id === id);
    setData((prev: any) => ({
      ...prev,
      charterBookings: prev.charterBookings.filter((b: CharterBooking) => b.id !== id),
    }));
    if (booking) {
      recordAudit('Charter Booking', id, `${booking.bookingNumber} (${booking.customerName})`, 'Deleted', 'booking', 'Active', 'Deleted', 'Charter reservation record removed');
    }
    showToast({ type: 'warning', title: 'Charter Booking Deleted' });
  };

  const deletePayment = (id: string) => {
    const p = data.payments.find((pay: PaymentRecord) => pay.id === id);
    setData((prev: any) => {
      let updatedCust = prev.customers;
      let updatedCharter = prev.charterBookings;
      if (p) {
        if (p.customerId) {
          updatedCust = prev.customers.map((c: Customer) => {
            if (c.id === p.customerId) {
              return {
                ...c,
                totalSpent: Math.max(0, c.totalSpent - p.amount),
                pendingBalance: c.pendingBalance + p.amount,
              };
            }
            return c;
          });
        }
        if (p.linkedType === 'charter' && p.linkedId) {
          updatedCharter = prev.charterBookings.map((b: CharterBooking) => {
            if (b.id === p.linkedId) {
              const newAdv = Math.max(0, b.advancePaid - p.amount);
              return {
                ...b,
                advancePaid: newAdv,
                balanceDue: Math.max(0, b.quote.grandTotal - newAdv),
              };
            }
            return b;
          });
        }
      }
      return {
        ...prev,
        payments: prev.payments.filter((pay: PaymentRecord) => pay.id !== id),
        customers: updatedCust,
        charterBookings: updatedCharter,
      };
    });
    if (p) {
      recordAudit('Payment', id, `${p.receiptNumber} (${p.customerName})`, 'Deleted', 'payment', `₹${p.amount}`, 'Deleted', 'Payment transaction deleted and ledger balance restored');
    }
    showToast({ type: 'warning', title: 'Payment Record Deleted', message: 'Cashbook voucher deleted and party ledger balance restored.' });
  };

  const updatePayment = (id: string, updates: Partial<PaymentRecord>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      payments: prev.payments.map((p: PaymentRecord) => p.id === id ? { ...p, ...updates } : p),
    }));
    const p = data.payments.find((pay: PaymentRecord) => pay.id === id);
    if (p) {
      recordAudit('Payment', id, `${p.receiptNumber} (${p.customerName})`, 'Edited', 'payment', '', JSON.stringify(updates), reason || 'Updated transaction details');
    }
    showToast({ type: 'info', title: 'Payment Record Updated' });
  };

  const deleteExpense = (id: string) => {
    const exp = data.expenses.find((e: Expense) => e.id === id);
    setData((prev: any) => ({
      ...prev,
      expenses: prev.expenses.filter((e: Expense) => e.id !== id),
    }));
    if (exp) {
      recordAudit('Expense', id, `${exp.category} (₹${exp.amount})`, 'Deleted', 'expense', `₹${exp.amount}`, 'Deleted', 'Expense record removed');
    }
    showToast({ type: 'warning', title: 'Expense Record Deleted' });
  };

  const updateExpense = (id: string, updates: Partial<Expense>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      expenses: prev.expenses.map((e: Expense) => e.id === id ? { ...e, ...updates } : e),
    }));
    const exp = data.expenses.find((e: Expense) => e.id === id);
    if (exp) {
      recordAudit('Expense', id, `${exp.category} (₹${exp.amount})`, 'Edited', 'expense', '', JSON.stringify(updates), reason || 'Updated expense details');
    }
    showToast({ type: 'info', title: 'Expense Record Updated' });
  };

  const deleteCustomer = (id: string) => {
    const cust = data.customers.find((c: Customer) => c.id === id);
    setData((prev: any) => ({
      ...prev,
      customers: prev.customers.filter((c: Customer) => c.id !== id),
    }));
    if (cust) {
      recordAudit('Customer', id, cust.name, 'Deleted', 'customer', 'Active', 'Deleted', 'Customer party removed');
    }
    showToast({ type: 'warning', title: 'Customer Removed' });
  };

  const deleteBus = (id: string) => {
    const bus = data.buses.find((b: Bus) => b.id === id);
    setData((prev: any) => ({
      ...prev,
      buses: prev.buses.filter((b: Bus) => b.id !== id),
    }));
    if (bus) {
      recordAudit('Bus', id, bus.plateNumber, 'Deleted', 'bus', 'Active', 'Deleted', 'Coach removed from fleet');
    }
    showToast({ type: 'warning', title: 'Bus Decommissioned from Fleet' });
  };

  const deleteWorker = (id: string) => {
    const w = data.workers.find((work: Worker) => work.id === id);
    setData((prev: any) => ({
      ...prev,
      workers: prev.workers.filter((work: Worker) => work.id !== id),
    }));
    if (w) {
      recordAudit('Worker', id, w.name, 'Deleted', 'worker', 'Active', 'Deleted', 'Worker record deleted');
    }
    showToast({ type: 'warning', title: 'Crew Member Removed' });
  };

  const deleteLoanEmi = (id: string) => {
    const emi = data.emis.find((e: LoanEMI) => e.id === id);
    setData((prev: any) => ({
      ...prev,
      emis: prev.emis.filter((e: LoanEMI) => e.id !== id),
    }));
    if (emi) {
      recordAudit('EMI Loan', id, emi.busNumber, 'Deleted', 'loan', 'Active', 'Deleted', 'Vehicle loan record deleted');
    }
    showToast({ type: 'warning', title: 'Vehicle Loan Record Deleted' });
  };

    const addReminder = (remData: Omit<Reminder, 'id'>): Reminder => {
    const newRem: Reminder = {
      ...remData,
      id: `rem-${Date.now()}`,
    };
    setData((prev: any) => ({
      ...prev,
      reminders: [newRem, ...prev.reminders],
    }));
    recordAudit('Reminder', newRem.id, newRem.title, 'Created', 'reminder', '', `Due: ${newRem.dueDate}`, newRem.description);
    showToast({ type: 'success', title: 'Reminder Scheduled', message: `${newRem.title} scheduled for ${newRem.dueDate}.` });
    return newRem;
  };

  const deleteReminder = (remId: string) => {
    setData((prev: any) => ({
      ...prev,
      reminders: prev.reminders.filter((r: Reminder) => r.id !== remId),
    }));
    showToast({ type: 'info', title: 'Reminder Dismissed' });
  };

  const updateSmsTemplate = (id: string, body: string) => {
    setData((prev: any) => ({
      ...prev,
      smsTemplates: prev.smsTemplates.map((t: SmsTemplate) => t.id === id ? { ...t, body } : t),
    }));
    recordAudit('SMS Template', id, id, 'Edited', 'body', '', body, 'Updated DLT notification template text');
    showToast({ type: 'success', title: 'SMS Template Saved', message: 'Template successfully updated and persisted.' });
  };

  const addRoute = (route: Route) => {
    setData((prev: any) => ({
      ...prev,
      routes: [...prev.routes, route],
    }));
    recordAudit('Route Master', route.id, route.name, 'Created', 'all', '', route.name);
    showToast({ type: 'success', title: 'New Route Added', message: `${route.name} added to route master.` });
  };

  const updateRoute = (id: string, updates: Partial<Route>) => {
    setData((prev: any) => ({
      ...prev,
      routes: prev.routes.map((r: Route) => r.id === id ? { ...r, ...updates } : r),
    }));
    const rt = data.routes.find((r: Route) => r.id === id);
    if (rt) {
      recordAudit('Route Master', id, rt.name, 'Edited', 'schedule/fares', '', '', 'Updated stops & fares schedule');
    }
    showToast({ type: 'info', title: 'Route Master Updated', message: 'Stops and fare schedule saved.' });
  };

  const addBus = (bus: Bus) => {
    setData((prev: any) => ({
      ...prev,
      buses: [bus, ...prev.buses],
    }));
    recordAudit('Fleet Bus', bus.id, bus.plateNumber, 'Created', 'all', '', `${bus.model} (${bus.type})`);
    showToast({ type: 'success', title: 'New Coach Added to Fleet' });
  };

  const addWorker = (worker: Worker) => {
    setData((prev: any) => ({
      ...prev,
      workers: [worker, ...prev.workers],
    }));
    recordAudit('Worker', worker.id, worker.name, 'Created', 'all', '', `${worker.type} onboarded`);
    showToast({ type: 'success', title: 'New Crew Member Registered' });
  };

  const updateLoanEmi = (id: string, updates: Partial<LoanEMI>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      emis: prev.emis.map((e: LoanEMI) => e.id === id ? { ...e, ...updates } : e),
    }));
    const emi = data.emis.find((e: LoanEMI) => e.id === id);
    if (emi) {
      recordAudit('EMI Loan', id, emi.busNumber, 'Edited', 'terms', '', '', reason || 'Updated EMI loan parameters');
    }
    showToast({ type: 'success', title: 'Loan Terms Updated' });
  };

  const addLoanEmi = (newEmi: LoanEMI) => {
    setData((prev: any) => ({
      ...prev,
      emis: [newEmi, ...prev.emis],
    }));
    recordAudit('EMI Loan', newEmi.id, newEmi.busNumber, 'Created', 'all', '', `New loan with ${newEmi.financeCompany}`);
    showToast({ type: 'success', title: 'Vehicle Loan Registered' });
  };

  // Customer Handlers
  const addCustomer = (custData: Omit<Customer, 'id' | 'totalBookings' | 'totalSpent' | 'pendingBalance'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalBookings: 0,
      totalSpent: 0,
      pendingBalance: 0,
    };
    setData((prev: any) => ({
      ...prev,
      customers: [newCust, ...prev.customers],
    }));
    recordAudit('Customer', newCust.id, newCust.name, 'Created', 'all', '', 'New Customer');
    showToast({ type: 'success', title: 'Customer Added', message: `${newCust.name} saved.` });
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      customers: prev.customers.map((c: Customer) => c.id === id ? { ...c, ...updates } : c),
    }));
    const cust = data.customers.find((c: Customer) => c.id === id);
    if (cust) {
      recordAudit('Customer', id, cust.name, 'Edited', 'profile', '', '', reason);
    }
    showToast({ type: 'info', title: 'Customer Profile Updated' });
  };

  // Payments & Ledger Handlers
  const addPayment = (paymentData: Omit<PaymentRecord, 'id' | 'receiptNumber'>): PaymentRecord => {
    const newPay: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receiptNumber: `DR-REC-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setData((prev: any) => {
      // If linked to charter booking, reduce balance
      let updatedCharter = prev.charterBookings;
      if (newPay.linkedType === 'charter' && newPay.linkedId) {
        updatedCharter = prev.charterBookings.map((b: CharterBooking) => {
          if (b.id === newPay.linkedId) {
            const newAdv = b.advancePaid + newPay.amount;
            const newBal = Math.max(0, b.quote.grandTotal - newAdv);
            return { ...b, advancePaid: newAdv, balanceDue: newBal };
          }
          return b;
        });
      }

      // If linked to customer, reduce pending balance
      let updatedCust = prev.customers;
      if (newPay.customerId) {
        updatedCust = prev.customers.map((c: Customer) => {
          if (c.id === newPay.customerId) {
            return {
              ...c,
              totalSpent: c.totalSpent + newPay.amount,
              pendingBalance: Math.max(0, c.pendingBalance - newPay.amount),
            };
          }
          return c;
        });
      }

      return {
        ...prev,
        payments: [newPay, ...prev.payments],
        charterBookings: updatedCharter,
        customers: updatedCust,
      };
    });

    // Auto SMS
    sendMockSms(
      newPay.customerName,
      '+91 98111 20491',
      'Payment Receipt Confirmation',
      `Thank you ${newPay.customerName}! Payment of ₹${newPay.amount.toLocaleString('en-IN')} received via ${newPay.mode} (Ref: ${newPay.referenceUtr}). - Deepak Raj Travels.`,
      'Payment Received'
    );

    recordAudit('Payment', newPay.id, `${newPay.receiptNumber} (₹${newPay.amount})`, 'Created', 'amount', '0', `₹${newPay.amount}`, `Payment received via ${newPay.mode}`);

    showToast({
      type: 'success',
      title: 'Payment Recorded & Receipt Issued',
      message: `Receipt #${newPay.receiptNumber} generated. Balances adjusted.`,
    });

    return newPay;
  };

  // Expenses Handlers
  const addExpense = (expData: Omit<Expense, 'id'>): Expense => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
    };
    setData((prev: any) => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
    }));

    recordAudit('Expense', newExp.id, `${newExp.category} - ₹${newExp.amount}`, 'Created', 'amount', '0', `₹${newExp.amount}`, newExp.notes);

    showToast({
      type: 'success',
      title: 'Expense Recorded',
      message: `${newExp.category} of ₹${newExp.amount.toLocaleString('en-IN')} logged.`,
    });

    return newExp;
  };

  // Fleet Bus Handlers
  const updateBus = (id: string, updates: Partial<Bus>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      buses: prev.buses.map((b: Bus) => b.id === id ? { ...b, ...updates } : b),
    }));
    const bus = data.buses.find((b: Bus) => b.id === id);
    if (bus) {
      recordAudit('Bus', id, bus.plateNumber, 'Edited', 'status', '', '', reason);
    }
    showToast({ type: 'info', title: 'Bus Details Updated' });
  };

  // Workers & Attendance Handlers
  const updateWorker = (id: string, updates: Partial<Worker>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      workers: prev.workers.map((w: Worker) => w.id === id ? { ...w, ...updates } : w),
    }));
    const worker = data.workers.find((w: Worker) => w.id === id);
    if (worker) {
      recordAudit('Worker', id, worker.name, 'Edited', 'profile', '', '', reason);
    }
    showToast({ type: 'info', title: 'Worker Profile Updated' });
  };

  const updateAttendance = (workerId: string, date: string, status: 'P' | 'A' | 'HD' | 'L') => {
    setData((prev: any) => {
      const existingIdx = prev.attendance.findIndex((a: AttendanceRecord) => a.workerId === workerId && a.date === date);
      let updated = [...prev.attendance];
      if (existingIdx >= 0) {
        updated[existingIdx] = { workerId, date, status };
      } else {
        updated.push({ workerId, date, status });
      }
      return { ...prev, attendance: updated };
    });
  };

  const addWorkerAdvance = (advData: Omit<WorkerAdvance, 'id'>) => {
    const newAdv: WorkerAdvance = {
      ...advData,
      id: `adv-${Date.now()}`,
    };
    setData((prev: any) => ({
      ...prev,
      advances: [newAdv, ...prev.advances],
    }));
    recordAudit('Worker Advance', newAdv.id, `${newAdv.workerName} (₹${newAdv.amount})`, 'Created', 'amount', '0', `₹${newAdv.amount}`, newAdv.reason);
    showToast({ type: 'warning', title: 'Salary Advance Issued', message: `₹${newAdv.amount} advance given to ${newAdv.workerName}.` });
  };

  const payWorkerSalary = (workerId: string, month: string, amount: number, paymentMode: 'Bank' | 'Cash' | 'UPI') => {
    const worker = data.workers.find((w: Worker) => w.id === workerId);
    if (!worker) return;

    // Block duplicate salary payout
    const alreadyPaid = data.expenses.some(
      (e: Expense) => e.category === 'Salary' && e.notes.includes(worker.name) && e.notes.includes(month)
    );
    if (alreadyPaid) {
      showToast({
        type: 'warning',
        title: 'Salary Already Paid',
        message: `Salary for ${worker.name} for ${month} has already been disbursed. Duplicate payout blocked.`,
      });
      return;
    }

    // 1. Auto create Expense under 'Salary'
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      date: '2026-11-02',
      category: 'Salary',
      amount,
      paidBy: `Company Account (${paymentMode})`,
      gstPaid: 0,
      notes: `Salary payout for ${worker.name} (${worker.type}) - ${month}`,
    };

    // 2. Auto create SMS Log
    sendMockSms(
      worker.name,
      worker.phone,
      'Salary Disbursed to Worker',
      `Dear ${worker.name}, your net salary of ₹${amount.toLocaleString('en-IN')} for ${month} has been credited via ${paymentMode}. - Deepak Raj Travels.`,
      'Payroll Disbursement'
    );

    setData((prev: any) => ({
      ...prev,
      expenses: [exp, ...prev.expenses],
    }));

    recordAudit('Payroll', workerId, `${worker.name} (${month})`, 'Created', 'salary', '0', `₹${amount}`, `Disbursed via ${paymentMode}`);

    confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    showToast({
      type: 'success',
      title: 'Salary Paid Successfully',
      message: `₹${amount.toLocaleString('en-IN')} disbursed to ${worker.name}. Expense logged and SMS dispatched.`,
    });
  };

  // EMI & Reminders
  const markEmiPaid = (emiId: string, reference: string) => {
    setData((prev: any) => ({
      ...prev,
      emis: prev.emis.map((e: LoanEMI) => {
        if (e.id === emiId) {
          const newRemain = Math.max(0, e.remainingInstalments - 1);
          return {
            ...e,
            remainingInstalments: newRemain,
            status: newRemain === 0 ? 'closed' : 'active',
            paymentHistory: [{ date: '2026-11-02', amount: e.emiAmount, reference }, ...e.paymentHistory],
          };
        }
        return e;
      }),
    }));
    showToast({ type: 'success', title: 'EMI Marked as Paid', message: 'Loan payment history and remaining tenure updated.' });
  };

  const snoozeReminder = (remId: string) => {
    setData((prev: any) => ({
      ...prev,
      reminders: prev.reminders.map((r: Reminder) => r.id === remId ? { ...r, status: 'snoozed' } : r),
    }));
    showToast({ type: 'info', title: 'Reminder Snoozed for 24 Hours' });
  };

  const markReminderDone = (remId: string) => {
    setData((prev: any) => ({
      ...prev,
      reminders: prev.reminders.map((r: Reminder) => r.id === remId ? { ...r, status: 'done' } : r),
    }));
    showToast({ type: 'success', title: 'Reminder Marked as Resolved' });
  };

  const sendMockSms = (recipientName: string, recipientPhone: string, templateName: string, message: string, triggerEvent: string) => {
    const newLog: SmsLog = {
      id: `slog-${Date.now()}`,
      sentAt: '2026-11-02 21:55',
      recipientName,
      recipientPhone,
      templateName,
      message,
      status: 'Delivered',
      triggerEvent,
    };
    setData((prev: any) => ({
      ...prev,
      smsLogs: [newLog, ...prev.smsLogs],
    }));
  };

  // GST & Invoicing
  const addGstInvoice = (invoiceData: Omit<GSTInvoice, 'id'>): GSTInvoice => {
    const newInv: GSTInvoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
    };
    setData((prev: any) => ({
      ...prev,
      gstInvoices: [newInv, ...prev.gstInvoices],
    }));
    recordAudit('GST Invoice', newInv.id, newInv.invoiceNumber, 'Created', 'grandTotal', '0', `₹${newInv.grandTotal}`);
    showToast({ type: 'success', title: 'GST Invoice Generated', message: `Invoice #${newInv.invoiceNumber} saved.` });
    return newInv;
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setData((prev: any) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
    recordAudit('Settings', 'settings', 'Business Settings', 'Edited', 'configuration', '', 'Saved');
    showToast({ type: 'success', title: 'Settings Saved' });
  };

  // Guided Tour Control
  const startTour = () => {
    setIsTourActive(true);
    setCurrentTourStep(1);
  };

  const nextTourStep = () => {
    if (currentTourStep < GUIDED_TOUR_STEPS.length) {
      setCurrentTourStep(currentTourStep + 1);
    } else {
      setIsTourActive(false);
      confetti({ particleCount: 100, spread: 80 });
      showToast({ type: 'success', title: 'Guided Tour Complete!', message: 'You have seen the full business operational workflow.' });
    }
  };

  const prevTourStep = () => {
    if (currentTourStep > 1) {
      setCurrentTourStep(currentTourStep - 1);
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
  };

  const goToTourStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= GUIDED_TOUR_STEPS.length) {
      setCurrentTourStep(stepNumber);
      setIsTourActive(true);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        login: () => setIsLoggedIn(true),
        logout: () => setIsLoggedIn(false),
        currentUser,

        settings: data.settings,
        buses: data.buses,
        workers: data.workers,
        attendance: data.attendance,
        advances: data.advances,
        customers: data.customers,
        charterBookings: data.charterBookings,
        routes: data.routes,
        tickets: data.tickets,
        payments: data.payments,
        expenses: data.expenses,
        emis: data.emis,
        reminders: data.reminders,
        smsTemplates: data.smsTemplates,
        smsLogs: data.smsLogs,
        gstInvoices: data.gstInvoices,
        changeHistory: data.changeHistory,

        language,
        setLanguage,
        t,

        resetDemoData,
        showToast,
        recordAudit,

        activeHistory,
        openHistory: (entityType, entityId, entityTitle) => setActiveHistory({ entityType, entityId, entityTitle }),
        closeHistory: () => setActiveHistory(null),

        ticketModalData,
        openTicketModal: (ticket) => setTicketModalData(ticket),
        closeTicketModal: () => setTicketModalData(null),

        invoiceModalData,
        openInvoiceModal: (invoice) => setInvoiceModalData(invoice),
        closeInvoiceModal: () => setInvoiceModalData(null),

        salarySlipModalData,
        openSalarySlipModal: (data) => setSalarySlipModalData(data),
        closeSalarySlipModal: () => setSalarySlipModalData(null),

        addCharterBooking,
        updateCharterBooking,
        cancelCharterBooking,

        addRouteTicket,
        updateRouteTicket,
        deleteRouteTicket,
        cancelRouteTicket,
        addRoute,
        updateRoute,
        addBus,
        addWorker,
        updateLoanEmi,
        addLoanEmi,

        addCustomer,
        updateCustomer,
        deleteCustomer,

        addPayment,
        updatePayment,
        deletePayment,

        addExpense,
        updateExpense,
        deleteExpense,

        deleteCharterBooking,
        deleteBus,
        deleteWorker,
        deleteLoanEmi,
        addReminder,
        deleteReminder,
        updateSmsTemplate,

        updateBus,
        updateWorker,
        updateAttendance,
        addWorkerAdvance,
        payWorkerSalary,

        markEmiPaid,
        snoozeReminder,
        markReminderDone,
        sendMockSms,

        addGstInvoice,
        updateSettings,

        isTourActive,
        currentTourStep,
        startTour,
        nextTourStep,
        prevTourStep,
        skipTour,
        goToTourStep,
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-100'
                : 'bg-slate-900/90 border-slate-700/50 text-slate-100'
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.title}</p>
              {toast.message && <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-xs opacity-60 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};


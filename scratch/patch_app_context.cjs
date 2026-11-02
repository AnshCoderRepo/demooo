const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/context/AppContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update STORAGE_KEY
content = content.replace(
  "const STORAGE_KEY = 'DEEPAK_RAJ_BUS_ADMIN_DATA_V3';",
  "const STORAGE_KEY = 'DEEPAK_RAJ_BUS_ADMIN_DATA_V5';"
);

// 2. Add domain actions to AppContextType interface
const interfaceTarget = `  addCustomer: (cust: Omit<Customer, 'id' | 'totalBookings' | 'totalSpent' | 'pendingBalance'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>, reason?: string) => void;

  addPayment: (payment: Omit<PaymentRecord, 'id' | 'receiptNumber'>) => PaymentRecord;
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;`;

const interfaceReplacement = `  addCustomer: (cust: Omit<Customer, 'id' | 'totalBookings' | 'totalSpent' | 'pendingBalance'>) => Customer;
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
  deleteReminder: (id: string) => void;
  updateSmsTemplate: (id: string, body: string) => void;`;

content = content.replace(interfaceTarget, interfaceReplacement);

// 3. Update loadInitialData
const loadInitialTarget = `  const loadInitialData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
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
  };`;

const loadInitialReplacement = `  const loadInitialData = () => {
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
  };`;

content = content.replace(loadInitialTarget, loadInitialReplacement);

// 4. Implement missing domain methods
const methodsInsertionTarget = `  const deleteRouteTicket = (id: string) => {
    const tk = data.tickets.find((t: RouteTicket) => t.id === id);
    setData((prev: any) => ({
      ...prev,
      tickets: prev.tickets.filter((t: RouteTicket) => t.id !== id),
    }));
    if (tk) {
      recordAudit('Route Ticket', id, tk.ticketNumber, 'Deleted', 'ticket', 'Active', 'Deleted', 'Ticket record permanently deleted');
    }
    showToast({ type: 'warning', title: 'Ticket Deleted' });
  };`;

const methodsInsertion = `  const deleteRouteTicket = (id: string) => {
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
      recordAudit('Charter Booking', id, \`\${booking.bookingNumber} (\${booking.customerName})\`, 'Deleted', 'booking', 'Active', 'Deleted', 'Charter reservation record removed');
    }
    showToast({ type: 'warning', title: 'Charter Booking Deleted' });
  };

  const deletePayment = (id: string) => {
    const p = data.payments.find((pay: PaymentRecord) => pay.id === id);
    setData((prev: any) => ({
      ...prev,
      payments: prev.payments.filter((pay: PaymentRecord) => pay.id !== id),
    }));
    if (p) {
      recordAudit('Payment', id, \`\${p.receiptNumber} (\${p.customerName})\`, 'Deleted', 'payment', \`₹\${p.amount}\`, 'Deleted', 'Payment transaction deleted');
    }
    showToast({ type: 'warning', title: 'Payment Record Deleted' });
  };

  const updatePayment = (id: string, updates: Partial<PaymentRecord>, reason?: string) => {
    setData((prev: any) => ({
      ...prev,
      payments: prev.payments.map((p: PaymentRecord) => p.id === id ? { ...p, ...updates } : p),
    }));
    const p = data.payments.find((pay: PaymentRecord) => pay.id === id);
    if (p) {
      recordAudit('Payment', id, \`\${p.receiptNumber} (\${p.customerName})\`, 'Edited', 'payment', '', JSON.stringify(updates), reason || 'Updated transaction details');
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
      recordAudit('Expense', id, \`\${exp.category} (₹\${exp.amount})\`, 'Deleted', 'expense', \`₹\${exp.amount}\`, 'Deleted', 'Expense record removed');
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
      recordAudit('Expense', id, \`\${exp.category} (₹\${exp.amount})\`, 'Edited', 'expense', '', JSON.stringify(updates), reason || 'Updated expense details');
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
  };`;

content = content.replace(methodsInsertionTarget, methodsInsertion);

// 5. Expose new methods in Context Provider value
const providerValueTarget = `        addCustomer,
        updateCustomer,
        addPayment,
        addExpense,`;

const providerValueReplacement = `        addCustomer,
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
        deleteReminder,
        updateSmsTemplate,`;

content = content.replace(providerValueTarget, providerValueReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AppContext.tsx!');


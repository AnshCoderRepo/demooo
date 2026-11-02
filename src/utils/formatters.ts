// Indian Formatting and Utility Helpers

export const TODAY_STR = '2026-11-02';
export const TOMORROW_STR = '2026-11-03';

/**
 * Formats a number to Indian Rupee format with ₹ symbol (e.g. ₹1,25,000)
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  
  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));
  const s = absAmount.toString();
  
  let lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNegative ? '-' : ''}₹${res}`;
}

/**
 * Formats standard ISO or YYYY-MM-DD date to "DD MMM YYYY" (e.g. "02 Nov 2026")
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats date and time to "DD MMM YYYY, hh:mm A"
 */
export function formatDateTime(dateTimeStr: string | null | undefined): string {
  if (!dateTimeStr) return '—';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    const dateFormatted = formatDate(dateTimeStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${dateFormatted}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return dateTimeStr;
  }
}

/**
 * Export data array to CSV file download
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${TODAY_STR}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Check if two date ranges overlap
 */
export function checkDateOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();
  return Math.max(sA, sB) <= Math.min(eA, eB);
}

/**
 * Indian States for GST resolution
 */
export const INDIAN_STATES = [
  'Delhi (07)',
  'Bihar (10)',
  'Uttar Pradesh (09)',
  'West Bengal (19)',
  'Haryana (06)',
  'Punjab (03)',
  'Rajasthan (08)',
  'Maharashtra (27)',
  'Madhya Pradesh (23)',
  'Jharkhand (20)',
  'Uttarakhand (05)',
  'Gujarat (24)',
  'Assam (18)',
];

/**
 * Translation Dictionary for bilingual labels (EN / HI)
 */
export const TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  charterBookings: { en: 'Charter Bookings', hi: 'चार्टर बुकिंग' },
  calendar: { en: 'Calendar', hi: 'कैलेंडर' },
  routeTickets: { en: 'Route Tickets', hi: 'रूट टिकट' },
  customers: { en: 'Customers', hi: 'ग्राहक' },
  payments: { en: 'Payments & Ledger', hi: 'भुगतान और बहीखाता' },
  expenses: { en: 'Expenses', hi: 'खर्चे' },
  fleet: { en: 'Fleet', hi: 'बस बेड़ा' },
  workers: { en: 'Workers & Salary', hi: 'कर्मचारी और वेतन' },
  emiLoans: { en: 'EMI & Loans', hi: 'किस्त और ऋण' },
  reminders: { en: 'Reminders', hi: 'रिमाइंडर' },
  sms: { en: 'SMS & Alerts', hi: 'एसएमएस' },
  gst: { en: 'GST Invoices', hi: 'जीएसटी बिल' },
  gstReports: { en: 'GST Reports', hi: 'जीएसटी रिपोर्ट' },
  reports: { en: 'Reports', hi: 'रिपोर्ट्स' },
  changeHistory: { en: 'Change History', hi: 'बदलाव इतिहास' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
  
  todayTrips: { en: "Today's Trips", hi: 'आज की ट्रिप' },
  incomeMonth: { en: 'Income (Nov)', hi: 'आय (नवंबर)' },
  expensesMonth: { en: 'Expenses (Nov)', hi: 'खर्च (नवंबर)' },
  pendingDues: { en: 'Pending Dues', hi: 'बाकी रकम' },
  docExpiries: { en: 'Document Expiries', hi: 'कागज़ात मियाद' },
  emiDue: { en: 'EMI Due', hi: 'किस्त देय' },
  needsAttention: { en: 'Needs Attention', hi: 'तत्काल ध्यान दें' },
  quickActions: { en: 'Quick Actions', hi: 'त्वरित कार्य' },
  newBooking: { en: 'New Charter Booking', hi: 'नई बुकिंग' },
  sellTicket: { en: 'Sell Route Ticket', hi: 'टिकट बेचें' },
  addExpense: { en: 'Add Expense', hi: 'खर्च जोड़ें' },
  markSalaryPaid: { en: 'Payroll & Salary', hi: 'वेतन भुगतान' },
};


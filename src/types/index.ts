// Core Data Models for Deepak Raj Travels Admin Demo

export type Language = 'en' | 'hi';

export type BusType = 'AC Sleeper' | 'Non-AC Seater' | 'AC Seater' | 'Mini Bus';
export type BusStatus = 'Available' | 'On trip' | 'In maintenance';

export interface BusDocument {
  id: string;
  type: 'RC' | 'Insurance' | 'Permit' | 'Fitness' | 'PUC' | 'Road Tax' | 'National Permit';
  number: string;
  expiryDate: string; // YYYY-MM-DD
  status: 'valid' | 'expiring' | 'expired';
}

export interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  type: BusType;
  owner: string;
  chassisNo: string;
  engineNo: string;
  status: BusStatus;
  photoUrl: string;
  odometerKm: number;
  nextServiceDate: string;
  documents: BusDocument[];
  serviceHistory: {
    date: string;
    description: string;
    cost: number;
    km: number;
  }[];
  tyreChanges: {
    date: string;
    tyreCount: number;
    cost: number;
  }[];
}

export type WorkerType = 'driver' | 'conductor' | 'helper' | 'office' | 'cleaner' | 'mechanic';
export type WorkerStatus = 'active' | 'on-leave' | 'inactive';
export type SalaryType = 'monthly_fixed' | 'per_trip' | 'per_day' | 'fixed_plus_trip';

export interface Worker {
  id: string;
  name: string;
  phone: string;
  address: string;
  photoUrl: string;
  idProof: string;
  type: WorkerType;
  joiningDate: string;
  status: WorkerStatus;
  emergencyContact: string;
  bankUpi: string;
  licenceNo?: string;
  licenceExpiry?: string;
  salaryType: SalaryType;
  baseSalary: number;
  tripAllowanceRate: number;
}

export interface AttendanceRecord {
  workerId: string;
  date: string; // YYYY-MM-DD
  status: 'P' | 'A' | 'HD' | 'L'; // Present, Absent, Half Day, Leave
}

export interface WorkerAdvance {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  amount: number;
  reason: string;
  recoveryPerMonth: number;
  remainingBalance: number;
  status: 'active' | 'repaid';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  address: string;
  gstin?: string;
  state: string;
  notes?: string;
  totalBookings: number;
  totalSpent: number;
  pendingBalance: number;
}

export type CharterBookingType = 'Shadi' | 'Tilak' | 'Vivah' | 'School Trip' | 'Tirth Yatra' | 'Government Work';
export type CharterBookingStatus = 'Enquiry' | 'Quoted' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface CharterBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  phone: string;
  altPhone?: string;
  address: string;
  bookingType: CharterBookingType;
  pickup: string;
  drop: string;
  stops: string;
  pickupDateTime: string; // YYYY-MM-DDTHH:mm
  returnDateTime: string;
  passengers: number;
  busTypeRequired: BusType;
  busCount: number;
  conditionalNotes?: {
    schoolName?: string;
    teacherContact?: string;
    department?: string;
    workOrderNo?: string;
  };
  quote: {
    rateType: 'km' | 'day';
    ratePerUnit: number;
    units: number;
    driverAllowance: number;
    toll: number;
    parking: number;
    nightHalt: number;
    gstIncluded: boolean;
    gstRate: number;
    subtotal: number;
    gstAmount: number;
    grandTotal: number;
  };
  advancePaid: number;
  balanceDue: number;
  paymentMode: string;
  status: CharterBookingStatus;
  assignedBuses: {
    busId: string;
    busNumber: string;
    driverId?: string;
    driverName?: string;
    conductorId?: string;
    conductorName?: string;
    helperId?: string;
    helperName?: string;
  }[];
  createdAt: string;
}

export interface RouteStop {
  name: string;
  distanceKm: number;
  fareMultiplier: number; // e.g. 1.0 for end-to-end, 0.6 for intermediate
  arrivalTimeOffset: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  departureTime: string;
  arrivalTime: string;
  baseFare: number;
  stops: RouteStop[];
  busType: BusType;
}

export interface PassengerDetail {
  seatNumber: string;
  name: string;
  phone: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  idProof?: string;
  boardingStop: string;
  droppingStop: string;
  fare: number;
}

export interface RouteTicket {
  id: string;
  ticketNumber: string;
  routeId: string;
  routeName: string;
  busId: string;
  busNumber: string;
  travelDate: string;
  departureTime: string;
  passengers: PassengerDetail[];
  totalFare: number;
  gstAmount: number;
  grandTotal: number;
  bookingDate: string;
  customerName: string;
  customerPhone: string;
  status: 'Confirmed' | 'Cancelled';
  cancellationDetails?: {
    cancelledAt: string;
    refundPercent: number;
    refundAmount: number;
    cancellationCharge: number;
    creditNoteNumber: string;
  };
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  mode: 'Cash' | 'UPI' | 'Bank' | 'Card';
  referenceUtr: string;
  customerId?: string;
  customerName: string;
  category: 'Charter Advance' | 'Charter Balance' | 'Route Ticket' | 'Salary Payment' | 'Expense Payment' | 'Other';
  linkedId?: string;
  linkedType: 'charter' | 'ticket' | 'expense' | 'payroll' | 'general';
  notes?: string;
}

export type ExpenseCategory = 
  | 'Diesel' 
  | 'Toll' 
  | 'Driver Salary' 
  | 'Driver Food' 
  | 'Maintenance' 
  | 'Tyres' 
  | 'Insurance' 
  | 'Permit Fees' 
  | 'Parking' 
  | 'Challan/Fine' 
  | 'Office' 
  | 'Salary';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  busId?: string;
  busNumber?: string;
  tripId?: string;
  tripTitle?: string;
  paidBy: string;
  billPhotoUrl?: string;
  gstPaid: number;
  notes: string;
}

export interface LoanEMI {
  id: string;
  busId: string;
  busNumber: string;
  financeCompany: string;
  loanAmount: number;
  emiAmount: number;
  dueDayOfMonth: number;
  tenureMonths: number;
  remainingInstalments: number;
  status: 'active' | 'closed';
  paymentHistory: {
    date: string;
    amount: number;
    reference: string;
  }[];
  purchaseDate: string;
  purchasePrice: number;
}

export interface Reminder {
  id: string;
  type: 'document_expiry' | 'service_due' | 'tomorrow_trip' | 'pending_payment' | 'emi_due' | 'salary_day';
  title: string;
  description: string;
  dueDate: string;
  urgency: 'high' | 'medium' | 'low';
  status: 'pending' | 'snoozed' | 'done';
  deliveryChannel: 'in-app' | 'SMS' | 'WhatsApp';
  linkedEntityId?: string;
  linkedEntityType?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
}

export interface SmsLog {
  id: string;
  sentAt: string;
  recipientName: string;
  recipientPhone: string;
  templateName: string;
  message: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  triggerEvent: string;
}

export interface GSTInvoiceItem {
  description: string;
  sacHsn: string;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface GSTInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerGstin?: string;
  customerState: string;
  businessGstin: string;
  businessState: string;
  isInterState: boolean;
  type: 'Tax Invoice' | 'Credit Note' | 'Debit Note';
  items: GSTInvoiceItem[];
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  originalInvoiceNumber?: string;
  linkedBookingOrTicketId?: string;
}

export interface ChangeHistoryEntry {
  id: string;
  timestamp: string;
  userName: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  action: 'Created' | 'Edited' | 'Status Changed' | 'Cancelled' | 'Credit Note Issued' | 'Deleted';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  gstin: string;
  pan: string;
  state: string;
  defaultGstRate: number;
  bankDetails: {
    bankName: string;
    accNo: string;
    ifsc: string;
    branch: string;
    upiId: string;
  };
  ticketTerms: string;
  ticketLuggageRules: string;
  ticketCancellationPolicy: string;
  ticketSettings: {
    showPassengerId: boolean;
    showFareBreakup: boolean;
    showGstLines: boolean;
    paperSize: 'A4' | 'thermal';
  };
  prefixSettings: {
    ticket: string;
    receipt: string;
    invoice: string;
    charter: string;
  };
  reminderDaysBefore: number;
  language: Language;
}


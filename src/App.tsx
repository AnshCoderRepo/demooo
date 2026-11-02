import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { HistoryDrawer } from './components/modals/HistoryDrawer';
import { TicketModal } from './components/modals/TicketModal';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { SalarySlipModal } from './components/modals/SalarySlipModal';
import { GuidedTourOverlay } from './components/modals/GuidedTourOverlay';

// Screens
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CharterBookings } from './pages/CharterBookings';
import { CalendarView } from './pages/CalendarView';
import { RouteTickets } from './pages/RouteTickets';
import { Customers } from './pages/Customers';
import { PaymentsLedger } from './pages/PaymentsLedger';
import { Expenses } from './pages/Expenses';
import { Fleet } from './pages/Fleet';
import { WorkersSalary } from './pages/WorkersSalary';
import { EmiLoans } from './pages/EmiLoans';
import { Reminders } from './pages/Reminders';
import { SmsAlerts } from './pages/SmsAlerts';
import { GstInvoices } from './pages/GstInvoices';
import { GstReports } from './pages/GstReports';
import { Reports } from './pages/Reports';
import { ChangeHistory } from './pages/ChangeHistory';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const { isLoggedIn } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Fixed Navigation */}
      <Navbar 
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        isMobileMenuOpen={isMobileMenuOpen} 
      />

      {/* Main Container */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Full Screen Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md flex flex-col animate-in fade-in">
            <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <span className="font-extrabold text-base">All 16 Business Modules</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar isMobile onCloseMobile={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/charter-bookings" element={<CharterBookings />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/route-tickets" element={<RouteTickets />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/payments" element={<PaymentsLedger />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/workers" element={<WorkersSalary />} />
            <Route path="/emi-loans" element={<EmiLoans />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/sms" element={<SmsAlerts />} />
            <Route path="/gst" element={<GstInvoices />} />
            <Route path="/gst-reports" element={<GstReports />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/change-history" element={<ChangeHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav onOpenMenu={() => setIsMobileMenuOpen(true)} />

      {/* Global Modals & Drawers */}
      <HistoryDrawer />
      <TicketModal />
      <InvoiceModal />
      <SalarySlipModal />
      <GuidedTourOverlay />
    </div>
  );
};


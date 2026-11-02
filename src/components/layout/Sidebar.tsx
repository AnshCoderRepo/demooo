import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, BusFront, Calendar as CalendarIcon, Ticket, 
  Users, CreditCard, Receipt, Truck, UserCheck, Landmark, 
  BellRing, MessageSquare, FileText, PieChart, BarChart3, 
  History, Settings, ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC<{ isMobile?: boolean; onCloseMobile?: () => void }> = ({ 
  isMobile = false, 
  onCloseMobile 
}) => {
  const { t, reminders, charterBookings } = useApp();

  const pendingRemindersCount = reminders.filter(r => r.status === 'pending').length;
  const todayTripsCount = charterBookings.filter(b => b.status === 'In Progress' || b.pickupDateTime.startsWith('2026-11-02')).length;

  const navigationItems = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard, badge: null },
    { to: '/charter-bookings', label: t('charterBookings'), icon: BusFront, badge: todayTripsCount ? `${todayTripsCount} Active` : null, badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    { to: '/calendar', label: t('calendar'), icon: CalendarIcon, badge: null },
    { to: '/route-tickets', label: t('routeTickets'), icon: Ticket, badge: 'Delhi-Siliguri', badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    { to: '/customers', label: t('customers'), icon: Users, badge: null },
    { to: '/payments', label: t('payments'), icon: CreditCard, badge: null },
    { to: '/expenses', label: t('expenses'), icon: Receipt, badge: 'P&L' },
    { to: '/fleet', label: t('fleet'), icon: Truck, badge: '8 Buses' },
    { to: '/workers', label: t('workers'), icon: UserCheck, badge: 'Payroll' },
    { to: '/emi-loans', label: t('emiLoans'), icon: Landmark, badge: 'Due Soon', badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
    { to: '/reminders', label: t('reminders'), icon: BellRing, badge: pendingRemindersCount > 0 ? String(pendingRemindersCount) : null, badgeColor: 'bg-amber-500 text-slate-950 font-bold' },
    { to: '/sms', label: t('sms'), icon: MessageSquare, badge: null },
    { to: '/gst', label: t('gst'), icon: FileText, badge: 'SAC 9964' },
    { to: '/gst-reports', label: t('gstReports'), icon: PieChart, badge: 'B2B/B2C' },
    { to: '/reports', label: t('reports'), icon: BarChart3, badge: null },
    { to: '/change-history', label: t('changeHistory'), icon: History, badge: 'Audit' },
    { to: '/settings', label: t('settings'), icon: Settings, badge: null },
  ];

  return (
    <aside className={`flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 ${
      isMobile ? 'w-full h-full' : 'w-64 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex'
    }`}>
      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Core Operations
        </div>
        {navigationItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'} transition-colors`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    isActive ? 'bg-slate-900 text-amber-400' : (item.badgeColor || 'bg-slate-800 text-slate-300')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-3 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Finance & Fleet
        </div>
        {navigationItems.slice(4, 11).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'} transition-colors`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    isActive ? 'bg-slate-900 text-amber-400' : (item.badgeColor || 'bg-slate-800 text-slate-300')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-3 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Compliance & Reports
        </div>
        {navigationItems.slice(11).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'} transition-colors`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    isActive ? 'bg-slate-900 text-amber-400' : (item.badgeColor || 'bg-slate-800 text-slate-300')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Quick Status Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>GSTIN (Delhi):</span>
            <span className="font-mono text-amber-400 font-semibold">07ABCDE1234F1Z5</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Fleet Utilization:</span>
            <span className="text-emerald-400 font-bold">87.5%</span>
          </div>
        </div>
      </div>
    </aside>
  );
};


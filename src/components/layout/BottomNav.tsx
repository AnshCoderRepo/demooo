import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, BusFront, Ticket, CreditCard, Menu 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const BottomNav: React.FC<{ onOpenMenu: () => void }> = ({ onOpenMenu }) => {
  const { t } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 py-1 px-2 flex items-center justify-around shadow-2xl safe-area-pb">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>{t('dashboard')}</span>
      </NavLink>

      <NavLink
        to="/charter-bookings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`
        }
      >
        <BusFront className="w-5 h-5 mb-0.5" />
        <span>Charter</span>
      </NavLink>

      <NavLink
        to="/route-tickets"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`
        }
      >
        <Ticket className="w-5 h-5 mb-0.5" />
        <span>Tickets</span>
      </NavLink>

      <NavLink
        to="/payments"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
          }`
        }
      >
        <CreditCard className="w-5 h-5 mb-0.5" />
        <span>Payments</span>
      </NavLink>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium text-slate-400 hover:text-amber-400 transition-colors"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>All (16)</span>
      </button>
    </nav>
  );
};


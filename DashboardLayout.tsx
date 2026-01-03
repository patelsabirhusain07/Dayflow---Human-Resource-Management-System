import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { 
  HomeIcon, 
  UserIcon, 
  ClockIcon, 
  CalendarIcon, 
  UsersIcon, 
  CreditCardIcon, 
  LogOutIcon,
  MenuIcon,
  XIcon
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const DashboardLayout: React.FC<Props> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: HomeIcon },
    { to: '/profile', label: 'My Profile', icon: UserIcon },
    { to: '/attendance', label: 'Attendance', icon: ClockIcon },
    { to: '/leaves', label: 'Leave & Time-Off', icon: CalendarIcon },
    { to: '/payroll', label: 'Payroll', icon: CreditCardIcon },
  ];

  if (user.role === UserRole.HR) {
    navItems.push({ to: '/employees', label: 'Employee Directory', icon: UsersIcon });
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-900 text-white shadow-xl sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="bg-white text-indigo-900 rounded p-1 text-sm">DF</span>
            Dayflow
          </h1>
          <p className="text-indigo-300 text-xs mt-1">HR Management System</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive ? 'bg-indigo-800 text-white shadow-sm' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center gap-3 px-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-indigo-300 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-indigo-300 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors"
          >
            <LogOutIcon size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <div className="md:hidden w-full fixed top-0 bg-indigo-900 text-white p-4 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold">Dayflow</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 bg-indigo-900 text-white z-50 transform transition-transform md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Dayflow
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive ? 'bg-indigo-800' : 'text-indigo-200 hover:bg-indigo-800'}
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-indigo-200 hover:bg-indigo-800 rounded-lg mt-8"
          >
            <LogOutIcon size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pt-16 md:pt-0 overflow-y-auto min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Fix: Removed duplicate local icon declarations that conflicted with imported icons from lucide-react

export default DashboardLayout;

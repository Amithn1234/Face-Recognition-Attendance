import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ScanFace, 
  CalendarCheck, 
  UserPlus, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Attendance', path: '/recognition', icon: ScanFace, highlight: true },
    { name: 'Students Roster', path: '/students', icon: Users },
    { name: 'Register Student', path: '/students/register', icon: UserPlus },
    { name: 'Attendance Records', path: '/attendance', icon: CalendarCheck },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <ScanFace className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-none">SmartAttend</h1>
          <span className="text-[11px] font-medium text-teal-400/90 tracking-wider uppercase">Face AI & Biometrics</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive 
                  ? item.highlight 
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-semibold' 
                    : 'bg-slate-800 text-teal-400 font-semibold' 
                  : item.highlight
                    ? 'text-teal-400 hover:bg-slate-800/60'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Security Status Box */}
      <div className="p-4 m-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Anti-Spoofing Active</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          MiniFASNet presentation attack shield running in real-time.
        </p>
      </div>
    </aside>
  );
};

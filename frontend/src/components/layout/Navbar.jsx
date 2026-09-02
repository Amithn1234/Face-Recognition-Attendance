import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Bell } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 font-medium">Department of Computer Science & Engineering</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Admin Profile Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-semibold text-xs">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'A'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-white leading-tight">{user?.full_name || 'Admin'}</p>
            <p className="text-[11px] text-teal-400/80 leading-tight capitalize">{user?.role || 'Administrator'}</p>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-2 ml-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

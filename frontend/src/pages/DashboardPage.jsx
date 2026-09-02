import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Percent, 
  ScanFace, 
  Calendar, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { attendanceService } from '../services/attendanceService';

const COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, attendanceData] = await Promise.all([
        attendanceService.getDashboardStats(),
        attendanceService.getHistory({ limit: 6 })
      ]);
      setStats(statsData);
      setRecentScans(attendanceData.records || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Failed to load dashboard metrics from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = stats?.metrics || {
    total_students: 0,
    registered_faces: 0,
    present_today: 0,
    absent_today: 0,
    attendance_percentage: 0
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time biometric attendance metrics and department analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          <Link
            to="/recognition"
            className="py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all"
          >
            <ScanFace className="w-4 h-4" />
            <span>Launch Smart Scanner</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Students */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
            <p className="text-2xl font-bold text-white mt-1.5">{metrics.total_students}</p>
            <p className="text-[11px] text-teal-400 mt-1">
              {metrics.registered_faces} Faces Registered ({metrics.total_students > 0 ? Math.round(metrics.registered_faces / metrics.total_students * 100) : 0}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Present Today */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present Today</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1.5">{metrics.present_today}</p>
            <p className="text-[11px] text-slate-400 mt-1">Verified via Face & Liveness</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Absent Today */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Absent Today</p>
            <p className="text-2xl font-bold text-amber-400 mt-1.5">{metrics.absent_today}</p>
            <p className="text-[11px] text-slate-400 mt-1">Pending verification</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Turnout Rate</p>
            <p className="text-2xl font-bold text-white mt-1.5">{metrics.attendance_percentage}%</p>
            <p className="text-[11px] text-teal-400 mt-1">Daily Institute Average</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Attendance Trend */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">7-Day Attendance Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily verified student headcount</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Synced</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="present_count" name="Present Count" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Department Statistics</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enrolled student distribution</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.department_stats || []}
                  dataKey="total_students"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(stats?.department_stats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {(stats?.department_stats || []).map((dept, idx) => (
              <div key={dept.department} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-300 truncate">{dept.department}</span>
                </div>
                <span className="font-semibold text-white">{dept.present_today}/{dept.total_students} ({dept.attendance_percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Biometric Verifications</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest attendance markings recorded by the scanner</p>
          </div>
          <Link to="/attendance" className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1">
            <span>View Full Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No attendance records logged for today yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">USN</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Match Score</th>
                  <th className="py-3 px-4">Liveness</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentScans.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-teal-400">{r.student?.usn}</td>
                    <td className="py-3 px-4 font-semibold text-white">{r.student?.full_name}</td>
                    <td className="py-3 px-4 text-slate-400">{r.student?.department}</td>
                    <td className="py-3 px-4 text-slate-300">{r.attendance_time}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-emerald-400">{(r.confidence_score * 100).toFixed(1)}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                        <ShieldCheck className="w-3 h-3" /> Live
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  Clock 
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { DEPARTMENTS, ACADEMIC_YEARS } from '../utils/constants';

export const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params = { limit: 100, offset: 0 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedDept) params.department = selectedDept;
      if (selectedYear) params.year = selectedYear;
      if (statusFilter) params.status = statusFilter;

      const data = await attendanceService.getHistory(params);
      setRecords(data.records || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error("Error loading attendance history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [startDate, endDate, selectedDept, selectedYear, statusFilter]);

  const handleExportCsv = async () => {
    try {
      setDownloading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedDept) params.department = selectedDept;
      if (selectedYear) params.year = selectedYear;
      if (statusFilter) params.status = statusFilter;

      await attendanceService.downloadCsv(params);
    } catch (err) {
      alert("Failed to export attendance CSV: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Log & Records</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Verified biometric logs with facial match score, liveness audit trail, and CSV export.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={downloading || records.length === 0}
          className="py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 self-start transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? "Exporting CSV..." : "Export to CSV Spreadsheet"}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Start Date */}
        <div>
          <label className="block text-slate-400 text-[10px] font-semibold uppercase mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-slate-400 text-[10px] font-semibold uppercase mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-slate-400 text-[10px] font-semibold uppercase mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-slate-400 text-[10px] font-semibold uppercase mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Reset / Refresh */}
        <div className="flex items-end gap-2">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSelectedDept('');
              setSelectedYear('');
              setStatusFilter('');
            }}
            className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Total Logged Records: <span className="text-teal-400 font-bold">{totalCount}</span>
          </span>
          <button onClick={loadAttendance} className="text-slate-400 hover:text-white flex items-center gap-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
            <p>Fetching attendance records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-slate-300">No attendance records found</p>
            <p className="text-[11px] text-slate-400 mt-1">Try modifying your filter dates or mark attendance in the live kiosk.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-900/50">
                  <th className="py-3.5 px-4">USN</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Department & Year</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Match Score</th>
                  <th className="py-3.5 px-4">Liveness Score</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-400">{r.student?.usn}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{r.student?.full_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {r.student?.department} ({r.student?.year})
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{r.attendance_date}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{r.attendance_time}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-emerald-400">
                        {(r.confidence_score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-teal-400 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {(r.liveness_score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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

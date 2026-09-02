import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  UserPlus, 
  Filter, 
  Edit, 
  Trash2, 
  ScanFace, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { studentService } from '../services/studentService';
import { DEPARTMENTS, ACADEMIC_YEARS } from '../utils/constants';

export const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [error, setError] = useState('');
  
  // Modal state for quick edit
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ full_name: '', email: '', department: '', year: '', section: '', phone: '' });

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedDept) params.department = selectedDept;
      if (selectedYear) params.year = selectedYear;

      const data = await studentService.getAll(params);
      setStudents(data);
    } catch (err) {
      console.error("Error loading students:", err);
      setError("Failed to load students roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedDept, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudents();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"? This will also remove registered facial biometrics and attendance records.`)) {
      return;
    }

    try {
      await studentService.delete(id);
      setStudents(students.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete student: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name,
      email: student.email,
      department: student.department,
      year: student.year,
      section: student.section || 'A',
      phone: student.phone || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const updated = await studentService.update(editingStudent.id, editFormData);
      setStudents(students.map(s => s.id === updated.id ? updated : s));
      setEditingStudent(null);
    } catch (err) {
      alert("Failed to update student: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Roster</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage enrolled students and biometric registration status</p>
        </div>

        <Link
          to="/students/register"
          className="py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 self-start transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, USN, or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
          />
        </form>

        {/* Department Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500 flex-1 md:flex-initial"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            onClick={loadStudents}
            title="Refresh list"
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
            <p>Loading students list...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-slate-300">No students found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting search filters or register a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-900/50">
                  <th className="py-3.5 px-4">USN / Roll No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Year & Sec</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Biometric Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-400">{student.usn}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{student.full_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{student.department}</td>
                    <td className="py-3.5 px-4 text-slate-300">{student.year} - Sec {student.section}</td>
                    <td className="py-3.5 px-4 text-slate-400">{student.email}</td>
                    <td className="py-3.5 px-4">
                      {student.has_face_registered ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                        </span>
                      ) : (
                        <Link
                          to="/students/register"
                          state={{ selectedStudent: student }}
                          className="inline-flex items-center gap-1.5 font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/20 text-[11px] transition-colors"
                        >
                          <ScanFace className="w-3.5 h-3.5" /> Register Face
                        </Link>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(student)}
                        title="Edit Student"
                        className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id, student.full_name)}
                        title="Delete Student"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Edit Student: {editingStudent.usn}</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Year</label>
                  <select
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({...editFormData, year: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                  >
                    {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

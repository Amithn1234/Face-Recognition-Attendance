import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  UserPlus, 
  ScanFace, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Camera, 
  RefreshCw,
  ShieldCheck,
  User
} from 'lucide-react';
import { WebcamCapture } from '../components/webcam/WebcamCapture';
import { studentService } from '../services/studentService';
import { faceService } from '../services/faceService';
import { DEPARTMENTS, ACADEMIC_YEARS, SECTIONS } from '../utils/constants';

export const RegisterStudentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedStudent = location.state?.selectedStudent || null;

  // Step 1: Student Details | Step 2: Face Biometric Capture
  const [step, setStep] = useState(preSelectedStudent ? 2 : 1);
  const [studentId, setStudentId] = useState(preSelectedStudent?.id || null);
  const [studentInfo, setStudentInfo] = useState(preSelectedStudent || null);

  // Form inputs
  const [formData, setFormData] = useState({
    usn: '',
    full_name: '',
    email: '',
    department: DEPARTMENTS[0],
    year: ACADEMIC_YEARS[3], // 4th Year default for final years
    section: 'A',
    phone: ''
  });

  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [allStudentsList, setAllStudentsList] = useState([]);

  // Load existing students without face registered for quick selector
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const list = await studentService.getAll({ active_only: true });
        setAllStudentsList(list.filter(s => !s.has_face_registered));
      } catch (err) {
        console.warn("Could not fetch students list:", err);
      }
    };
    fetchStudents();
  }, []);

  // Handle Step 1: Create Student
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    setIsProcessing(true);

    try {
      const created = await studentService.create(formData);
      setStudentId(created.id);
      setStudentInfo(created);
      setStep(2);
      setFeedback({ type: 'success', message: `Student profile created for ${created.full_name} (${created.usn}). Proceeding to face capture.` });
    } catch (err) {
      console.error("Student creation error:", err);
      setFeedback({ type: 'error', message: err.response?.data?.detail || "Failed to create student profile." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Select an existing un-registered student
  const handleSelectExistingStudent = (s) => {
    setStudentId(s.id);
    setStudentInfo(s);
    setStep(2);
    setFeedback({ type: 'success', message: `Selected ${s.full_name} (${s.usn}) for face registration.` });
  };

  // Handle Step 2: Face Capture & Biometric Extraction
  const handleFaceCapture = async (imageBase64) => {
    if (!studentId) {
      setFeedback({ type: 'error', message: "No student selected for face registration." });
      return;
    }

    setCapturedImage(imageBase64);
    setIsProcessing(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await faceService.registerFace(studentId, imageBase64);
      setFeedback({
        type: 'success',
        message: `Face Biometrics Registered Successfully! Quality Score: ${(res.quality_score * 100).toFixed(1)}%`
      });
      // Delay navigation so user can see success confirmation
      setTimeout(() => {
        navigate('/students');
      }, 2000);
    } catch (err) {
      console.error("Face registration error:", err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || "Face registration failed. Please ensure good lighting and single face in frame."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student & Biometric Registration</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Enroll a new student and generate their 512-d ArcFace biometric embedding.
          </p>
        </div>

        <button
          onClick={() => navigate('/students')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Roster
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-teal-400' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
            1
          </span>
          <span>Student Information</span>
        </div>
        <div className="h-0.5 w-12 bg-slate-800"></div>
        <div className={`flex items-center gap-2 text-xs font-bold ${step === 2 ? 'text-teal-400' : 'text-slate-400'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
            2
          </span>
          <span>Webcam Face Capture & Verification</span>
        </div>
      </div>

      {/* Alerts */}
      {feedback.message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 text-xs ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* STEP 1: Student Details Form */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl md:col-span-2">
            <h2 className="text-base font-bold text-white mb-4">Enter Student Details</h2>
            <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    USN / Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1RV21CS001"
                    value={formData.usn}
                    onChange={(e) => setFormData({...formData, usn: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    College Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    Academic Year *
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500"
                  >
                    {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">
                    Section
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500"
                  >
                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 mt-4 transition-all"
              >
                <span>Save & Proceed to Face Capture</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Select for Existing Students */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col">
            <h2 className="text-sm font-bold text-white mb-2">Pending Biometrics</h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Students added without face registration. Click to capture biometrics:
            </p>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-80 pr-1">
              {allStudentsList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                  <p>All students have registered faces!</p>
                </div>
              ) : (
                allStudentsList.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectExistingStudent(s)}
                    className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{s.full_name}</p>
                      <p className="text-[11px] font-mono text-teal-400">{s.usn}</p>
                    </div>
                    <ScanFace className="w-4 h-4 text-teal-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Live Webcam Face Capture */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2">
            <WebcamCapture
              onCapture={handleFaceCapture}
              isProcessing={isProcessing}
              autoCapture={false}
            />
          </div>

          {/* Student Summary & Capture Tips */}
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl text-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <User className="w-4 h-4" />
                <span>Registering Student</span>
              </div>
              <div className="space-y-1 text-slate-300 border-t border-slate-800 pt-3">
                <p><span className="text-slate-400 font-semibold">Name:</span> {studentInfo?.full_name}</p>
                <p><span className="text-slate-400 font-semibold">USN:</span> <code className="text-teal-400 font-mono">{studentInfo?.usn}</code></p>
                <p><span className="text-slate-400 font-semibold">Department:</span> {studentInfo?.department}</p>
                <p><span className="text-slate-400 font-semibold">Year:</span> {studentInfo?.year}</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Quality Guidelines</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside leading-relaxed text-[11px]">
                <li>Position face directly inside the dashed oval frame.</li>
                <li>Ensure adequate ambient lighting without glare.</li>
                <li>Keep a neutral facial expression with eyes open.</li>
                <li>Ensure exactly one face is visible to the camera.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => { setStep(1); setCapturedImage(null); }}
              className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Change Student Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

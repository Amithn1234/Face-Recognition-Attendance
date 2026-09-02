import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanFace, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Play, 
  Pause,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { WebcamCapture } from '../components/webcam/WebcamCapture';
import { faceService } from '../services/faceService';

export const RecognitionPage = () => {
  const [autoScan, setAutoScan] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [recentVerifiedLogs, setRecentVerifiedLogs] = useState([]);
  const [lastScanTime, setLastScanTime] = useState(null);

  // Audio chime using Web Audio API
  const playSound = (isSuccess) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        // High pleasant ding
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        // Low rejection buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio not supported or blocked by browser policy
    }
  };

  const handleFrameCapture = async (imageBase64) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await faceService.recognizeFace(imageBase64, true);
      setRecognitionResult(res);
      setLastScanTime(new Date().toLocaleTimeString());

      if (res.student_identified && res.is_live) {
        playSound(true);
        // Add to verified scans list
        setRecentVerifiedLogs(prev => [
          {
            id: Date.now(),
            student: res.student,
            time: new Date().toLocaleTimeString(),
            confidence: res.confidence_score,
            liveness: res.liveness_score,
            status: res.attendance_marked ? 'Marked Present' : 'Already Logged'
          },
          ...prev.slice(0, 9)
        ]);
      } else if (res.face_detected && !res.is_live) {
        playSound(false);
      }
    } catch (err) {
      console.error("Recognition error:", err);
      setRecognitionResult({
        face_detected: false,
        is_live: false,
        student_identified: false,
        message: "Server recognition timeout or error."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Smart Attendance Kiosk</h1>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time biometric facial recognition with deep learning anti-spoofing presentation attack detection.
          </p>
        </div>

        {/* Scan Mode Toggle */}
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={() => setAutoScan(!autoScan)}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
              autoScan
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
            }`}
          >
            {autoScan ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Auto-Scan</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Auto-Scan Loop</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Scanner Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Webcam Scanner */}
        <div className="lg:col-span-7 space-y-4">
          <WebcamCapture
            onCapture={handleFrameCapture}
            isProcessing={isProcessing}
            autoCapture={autoScan}
            captureIntervalMs={1800}
          />

          {/* System Status Indicators */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="glass-panel p-3 rounded-xl flex items-center gap-2.5">
              <ScanFace className="w-4 h-4 text-teal-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Face Engine</p>
                <p className="font-bold text-white">SFace / ArcFace</p>
              </div>
            </div>

            <div className="glass-panel p-3 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Liveness Shield</p>
                <p className="font-bold text-white">MiniFASNet DL</p>
              </div>
            </div>

            <div className="glass-panel p-3 rounded-xl flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Last Scan</p>
                <p className="font-bold text-white">{lastScanTime || 'Ready'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Recognition Result & Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Result Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 shadow-2xl relative overflow-hidden">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recognition Status</h2>

            {!recognitionResult ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <ScanFace className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-400 animate-pulse" />
                <p className="font-semibold text-slate-300">Ready to Scan</p>
                <p className="text-[11px] text-slate-400 mt-1">Look into the webcam or trigger a capture.</p>
              </div>
            ) : !recognitionResult.face_detected ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-400 opacity-80" />
                <p className="font-bold text-slate-200">No Face Detected</p>
                <p className="text-[11px] text-slate-400 mt-1">{recognitionResult.message}</p>
              </div>
            ) : !recognitionResult.is_live ? (
              /* SPOOF / PRESENTATION ATTACK DETECTED */
              <div className="p-5 rounded-xl bg-red-500/15 border-2 border-red-500/50 text-center space-y-2">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
                <p className="text-base font-bold text-red-300">SPOOF ATTACK REJECTED</p>
                <p className="text-xs text-red-400 leading-relaxed font-medium">
                  {recognitionResult.message}
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-red-950/80 border border-red-500/30 rounded-full text-[11px] text-red-300 font-mono">
                  Liveness Score: {(recognitionResult.liveness_score * 100).toFixed(1)}% (Min 85%)
                </div>
              </div>
            ) : recognitionResult.student_identified ? (
              /* STUDENT IDENTIFIED & VERIFIED */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <ShieldCheck className="w-3.5 h-3.5" /> Liveness Passed
                    </span>
                    <span className="font-mono text-xs font-bold text-teal-400">
                      Match: {(recognitionResult.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{recognitionResult.student?.full_name}</h3>
                    <p className="text-xs font-mono font-semibold text-teal-300">{recognitionResult.student?.usn}</p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {recognitionResult.student?.department} • {recognitionResult.student?.year}
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                  recognitionResult.attendance_marked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{recognitionResult.message}</span>
                </div>
              </div>
            ) : (
              /* UNREGISTERED / LOW CONFIDENCE */
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                <UserX className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-sm font-bold text-amber-300">Unrecognized Face</p>
                <p className="text-xs text-slate-300">{recognitionResult.message}</p>
                <div className="text-[11px] text-slate-400 font-mono">
                  Confidence: {(recognitionResult.confidence_score * 100).toFixed(1)}% (Threshold: 60%)
                </div>
              </div>
            )}
          </div>

          {/* Session Verified Scans Stream */}
          <div className="glass-panel p-5 rounded-2xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Session Activity</h2>
            
            {recentVerifiedLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No verifications in this session yet.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                {recentVerifiedLogs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{log.student?.full_name}</p>
                      <p className="text-[10px] font-mono text-teal-400">{log.student?.usn} • {log.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

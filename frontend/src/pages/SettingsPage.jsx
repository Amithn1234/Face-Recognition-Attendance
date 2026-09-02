import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Server, 
  Save, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

export const SettingsPage = () => {
  const [similarityThreshold, setSimilarityThreshold] = useState(0.60);
  const [livenessThreshold, setLivenessThreshold] = useState(0.85);
  const [cooldownMinutes, setCooldownMinutes] = useState(60);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Biometrics Tuning</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Configure computer vision thresholds, presentation attack tolerances, and database connections.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>System settings and thresholds updated successfully!</span>
        </div>
      )}

      {/* Threshold Configuration Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <Sliders className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold text-white">Biometric Recognition Parameters</h2>
        </div>

        {/* Face Similarity Slider */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-semibold text-white">Face Recognition Cosine Threshold</label>
              <p className="text-[11px] text-slate-400">
                Minimum ArcFace feature vector cosine similarity required to match student identity.
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-teal-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              {similarityThreshold.toFixed(2)} ({Math.round(similarityThreshold * 100)}%)
            </span>
          </div>
          <input
            type="range"
            min="0.40"
            max="0.85"
            step="0.01"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.40 (Lenient)</span>
            <span>0.60 (Recommended Standard)</span>
            <span>0.85 (Strict)</span>
          </div>
        </div>

        {/* Liveness Threshold Slider */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-semibold text-white">Anti-Spoofing Liveness Threshold</label>
              <p className="text-[11px] text-slate-400">
                Minimum MiniFASNet probability score required to classify a live human face.
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              {livenessThreshold.toFixed(2)} ({Math.round(livenessThreshold * 100)}%)
            </span>
          </div>
          <input
            type="range"
            min="0.60"
            max="0.95"
            step="0.01"
            value={livenessThreshold}
            onChange={(e) => setLivenessThreshold(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.60 (Low Security)</span>
            <span>0.85 (Recommended Shield)</span>
            <span>0.95 (Ultra-Strict)</span>
          </div>
        </div>

        {/* Cooldown Minutes */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-semibold text-white">Attendance Duplicate Cooldown (Minutes)</label>
              <p className="text-[11px] text-slate-400">
                Time period during which repeat scans of the same student will not create duplicate logs.
              </p>
            </div>
            <input
              type="number"
              min="1"
              max="720"
              value={cooldownMinutes}
              onChange={(e) => setCooldownMinutes(parseInt(e.target.value) || 60)}
              className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="py-3 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Threshold Settings</span>
        </button>
      </form>

      {/* System Diagnostics & Tech Stack Info */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>System Architecture & Engine Specifications</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-teal-400" /> Backend Engine
            </p>
            <p className="text-slate-400 text-[11px]">FastAPI + Uvicorn • Python 3.13 (64-bit)</p>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" /> Database Storage
            </p>
            <p className="text-slate-400 text-[11px]">MySQL 8.4 Server (`smart_attendance_db`)</p>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Face Detection & Recognition
            </p>
            <p className="text-slate-400 text-[11px]">OpenCV YuNet + SFace (ArcFace Embedding 512-d)</p>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Liveness Protection
            </p>
            <p className="text-slate-400 text-[11px]">MiniFASNet Multi-scale ONNX Neural Network</p>
          </div>
        </div>
      </div>
    </div>
  );
};

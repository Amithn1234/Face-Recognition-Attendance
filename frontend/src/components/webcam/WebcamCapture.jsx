import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, VideoOff } from 'lucide-react';

export const WebcamCapture = ({ onCapture, isProcessing = false, autoCapture = false, captureIntervalMs = 1500 }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Enumerate cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter(d => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevs[0].deviceId);
        }
      } catch (err) {
        console.warn("Could not enumerate camera devices:", err);
      }
    };
    getDevices();
  }, [selectedDeviceId]);

  // Start webcam stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraReady(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable. Please grant webcam permissions.");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  // Capture frame to base64
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get high-quality JPEG base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.92);
    
    if (onCapture) {
      onCapture(base64Image);
    }
    return base64Image;
  }, [cameraReady, onCapture]);

  // Auto-capture loop if enabled
  useEffect(() => {
    if (!autoCapture || !cameraReady || isProcessing) return;

    const interval = setInterval(() => {
      if (!isProcessing) {
        captureFrame();
      }
    }, captureIntervalMs);

    return () => clearInterval(interval);
  }, [autoCapture, cameraReady, isProcessing, captureIntervalMs, captureFrame]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center">
      {/* Video Container */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="text-center p-6 text-red-400 max-w-sm">
            <VideoOff className="w-12 h-12 mx-auto mb-3 opacity-80" />
            <p className="font-semibold text-sm mb-1">Camera Unavailable</p>
            <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setCameraReady(true)}
              className="w-full h-full object-cover mirror-mode"
            />
            
            {/* Alignment Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-80 border-2 border-dashed border-teal-400/50 rounded-[45%] flex items-center justify-center">
                <div className="w-full h-0.5 bg-teal-400/20"></div>
              </div>
            </div>

            {/* Scanning Line Animation if processing */}
            {isProcessing && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 shadow-lg shadow-teal-500/50 animate-scan"></div>
            )}
          </>
        )}

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera Controls Bar */}
      <div className="w-full p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-4">
        {/* Device Selector */}
        {devices.length > 1 && (
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
          >
            {devices.map((d, idx) => (
              <option key={d.deviceId || idx} value={d.deviceId}>
                {d.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        )}

        {/* Manual Snap Button (when autoCapture is off) */}
        {!autoCapture && (
          <button
            type="button"
            onClick={captureFrame}
            disabled={!cameraReady || isProcessing}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5" />
            <span>{isProcessing ? "Processing Biometrics..." : "Capture Face"}</span>
          </button>
        )}

        {autoCapture && (
          <div className="flex items-center gap-2 text-xs font-medium text-teal-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live Biometric Scanner Active</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { hrAPI } from '../../../../services/api';
import { X, CheckCircle, AlertCircle, Loader, Camera } from 'lucide-react';

const FaceRegisterModal = ({ show, onClose, employeeId, onRegistered }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState('camera');   // camera | preview | done | error
  const [circularImage, setCircularImage] = useState(null);
  const [circleSize, setCircleSize] = useState(0);

  // ---- Camera lifecycle ----
  useEffect(() => {
    if (show) startCamera();
    return () => stopCamera();
  }, [show]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setMessage({ type: '', text: '' });
      setStep('camera');
      setCircularImage(null);

      // Calculate circle size after layout
      setTimeout(() => {
        if (containerRef.current) {
          const height = containerRef.current.clientHeight;
          setCircleSize(height * 0.6);
        }
      }, 100);
    } catch {
      setMessage({ type: 'error', text: 'Camera access denied. Please check permissions.' });
      setStep('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // ---- Capture only the circular area ----
  const handleCapture = useCallback(async () => {
    if (!stream) {
      setMessage({ type: 'error', text: 'Camera not available.' });
      return;
    }
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setMessage({ type: 'error', text: 'Camera not ready.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const diameter = Math.min(canvas.width, canvas.height) * 0.6;
      const radius = diameter / 2;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = diameter;
      outputCanvas.height = diameter;
      const outCtx = outputCanvas.getContext('2d');

      // White background
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, diameter, diameter);

      // Clip to circle and draw video
      outCtx.save();
      outCtx.beginPath();
      outCtx.arc(diameter / 2, diameter / 2, radius, 0, Math.PI * 2);
      outCtx.clip();
      outCtx.drawImage(canvas, centerX - radius, centerY - radius, diameter, diameter, 0, 0, diameter, diameter);
      outCtx.restore();

      setCircularImage(outCtx.canvas.toDataURL('image/jpeg', 0.85));
      setStep('preview');
    } catch (err) {
      setMessage({ type: 'error', text: 'Error capturing image.' });
    } finally {
      setLoading(false);
    }
  }, [stream]);

  // ---- Register captured face ----
  const handleConfirm = useCallback(async () => {
    if (!circularImage) return;
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const base64Data = circularImage.split(',')[1];
      const response = await hrAPI.registerFace(employeeId, base64Data);
      const result = response.data;

      if (result.success) {
        setMessage({ type: 'success', text: 'Face registered successfully!' });
        setStep('done');
        stopCamera();
        if (onRegistered) onRegistered();
      } else {
        setMessage({ type: 'error', text: result.message || 'Registration failed.' });
        setStep('preview');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed.';
      setMessage({ type: 'error', text: errorMsg });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  }, [circularImage, employeeId, onRegistered]);

  const handleRetry = () => {
    setCircularImage(null);
    setStep('camera');
    setMessage({ type: '', text: '' });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 animate-fade-in">
      {/* Inline keyframes for custom animations */}
      <style>{`
        @keyframes scanPulse {
          0%, 100% { box-shadow: 0 0 25px rgba(14, 165, 233, 0.3), 0 0 0 1px rgba(14, 165, 233, 0.2); }
          50% { box-shadow: 0 0 35px rgba(14, 165, 233, 0.6), 0 0 0 2px rgba(14, 165, 233, 0.5); }
        }
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: calc(100% - 2px); }
        }
        .animate-scanPulse {
          animation: scanPulse 2.5s infinite ease-in-out;
        }
        .animate-scanLine {
          animation: scanLine 2s infinite linear;
        }
      `}</style>

      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-600/90 to-primary-700/90 backdrop-blur-md">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent-400" />
            Face Registration
          </h3>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Camera Step */}
          {step === 'camera' && (
            <div className="space-y-5">
              {/* Video Container with scanning effects */}
              <div
                ref={containerRef}
                className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(14,165,233,0.3)] animate-scanPulse"
              >
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning line */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-400 to-transparent animate-scanLine opacity-60"></div>
                </div>

                {/* Futuristic Circle Guide */}
                {circleSize > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Outer glowing ring */}
                    <div
                      className="absolute rounded-full border-2 border-primary-400/50"
                      style={{ width: circleSize + 8, height: circleSize + 8 }}
                    />
                    {/* Main circle outline */}
                    <div
                      className="absolute rounded-full border-2 border-white/70"
                      style={{ width: circleSize, height: circleSize }}
                    />
                    {/* Inner scanning hint (small moving dot) */}
                    <div className="absolute w-1.5 h-1.5 bg-accent-400 rounded-full animate-scanLine"></div>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader className="w-10 h-10 text-primary-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Message */}
              {message.text && (
                <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
                  message.type === 'success' ? 'bg-green-500/10 text-green-200 border border-green-400/30' :
                  message.type === 'error' ? 'bg-red-500/10 text-red-200 border border-red-400/30' :
                  'bg-primary-500/10 text-primary-100 border border-primary-400/30'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                   message.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> :
                   <Camera className="w-5 h-5 text-primary-400" />}
                  {message.text}
                </div>
              )}

              <p className="text-sm text-gray-300 text-center">
                Align your face inside the circle
              </p>

              <button
                onClick={handleCapture}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" /> Capturing...
                  </span>
                ) : (
                  'Capture Face'
                )}
              </button>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && circularImage && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden ring-4 ring-primary-400/60 shadow-[0_0_30px_rgba(14,165,233,0.4)]">
                  <img src={circularImage} alt="Face preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10" />
                </div>
              </div>

              {message.text && (
                <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
                  message.type === 'success' ? 'bg-green-500/10 text-green-200 border border-green-400/30' :
                  message.type === 'error' ? 'bg-red-500/10 text-red-200 border border-red-400/30' :
                  'bg-primary-500/10 text-primary-100 border border-primary-400/30'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                   message.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> :
                   <Camera className="w-5 h-5 text-primary-400" />}
                  {message.text}
                </div>
              )}

              <p className="text-sm text-gray-300 text-center">
                This is your captured face. Confirm to register.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" /> Registering...
                    </span>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Done Step */}
          {step === 'done' && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center ring-4 ring-green-400/40">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </div>
              <p className="text-green-200 font-medium">{message.text}</p>
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all transform hover:scale-[1.02]"
              >
                Done
              </button>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center ring-4 ring-red-400/40">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
              </div>
              <p className="text-red-200 font-medium">{message.text}</p>
              <button
                onClick={() => { stopCamera(); onClose(); }}
                className="w-full py-3.5 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceRegisterModal;
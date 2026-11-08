import React, { useState, useRef, useEffect, useCallback } from 'react';
import { hrAPI } from '../../../../services/api';
import { X, Camera, CheckCircle, AlertCircle, Loader, ShieldCheck } from 'lucide-react';

const FaceTestModal = ({ show, onClose, employeeId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState('camera');

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
    } catch {
      setMessage({ type: 'error', text: 'Camera access denied.' });
      setStep('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleTest = useCallback(async () => {
    if (!stream) return;
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const verifyResponse = await hrAPI.verifyFace(employeeId, imageData);
      const verifyResult = verifyResponse.data;

      if (verifyResult.success) {
        setMessage({ type: 'success', text: 'Face matched! Verification successful.' });
      } else {
        setMessage({ type: 'error', text: verifyResult.message || 'Verification failed.' });
      }
      setStep('done');
      stopCamera();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Test error.' });
      setStep('error');
    } finally {
      setLoading(false);
    }
  }, [stream, employeeId]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 animate-fade-in">
      {/* Inline keyframes for scanning/glow effects */}
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
            <ShieldCheck className="w-5 h-5 text-accent-400" />
            Face Verification
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
              {/* Video Container with Scanning Effect */}
              <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(14,165,233,0.3)] animate-scanPulse">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning line overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent-400 to-transparent animate-scanLine opacity-60"></div>
                </div>

                {loading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader className="w-10 h-10 text-primary-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Status Message */}
              {message.text && (
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-green-500/10 text-green-200 border border-green-400/30'
                      : message.type === 'error'
                      ? 'bg-red-500/10 text-red-200 border border-red-400/30'
                      : 'bg-primary-500/10 text-primary-100 border border-primary-400/30'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : message.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Camera className="w-5 h-5 text-primary-400" />
                  )}
                  {message.text}
                </div>
              )}

              <p className="text-sm text-gray-300 text-center">
                Look directly at the camera for verification
              </p>

              {/* Test Button */}
              <button
                onClick={handleTest}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" /> Verifying...
                  </span>
                ) : (
                  'Test Face'
                )}
              </button>
            </div>
          )}

          {/* Done / Result Step */}
          {step === 'done' && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center ring-4 ${
                    message.type === 'success'
                      ? 'bg-green-500/20 ring-green-400/40'
                      : 'bg-red-500/20 ring-red-400/40'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  ) : (
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  )}
                </div>
              </div>
              <p
                className={`font-medium ${
                  message.type === 'success' ? 'text-green-200' : 'text-red-200'
                }`}
              >
                {message.text}
              </p>
              <button
                onClick={onClose}
                className={`w-full py-3.5 bg-gradient-to-r ${
                  message.type === 'success'
                    ? 'from-green-500 to-emerald-600 hover:shadow-green-500/30'
                    : 'from-red-500 to-rose-600 hover:shadow-red-500/30'
                } text-white font-semibold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02]`}
              >
                Close
              </button>
            </div>
          )}

          {/* Error Step (camera denied, etc.) */}
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

export default FaceTestModal;
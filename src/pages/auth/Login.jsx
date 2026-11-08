// src/pages/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  Shield,
  AlertCircle,
  X,
  Send,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import techhubLogo from '../../assets/techhub.svg';    // desktop left panel
import mobileLogo from '../../assets/logo-tech1.svg';   // mobile header
import { applyThemeToDOM } from '../../context/themeUtils';

/* ---------- validation schemas ---------- */
const loginSchema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const forgotPasswordSchema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email is required to reset password'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
    reset: resetLoginForm,
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    register: registerForgotPassword,
    handleSubmit: handleSubmitForgotPassword,
    formState: { errors: forgotPasswordErrors },
    setError: setForgotPasswordError,
    setValue: setForgotPasswordValue,
    reset: resetForgotPasswordForm,
    getValues,
    watch: watchForgotPassword,
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (rememberMe) localStorage.setItem('rememberedEmail', data.email);
      else localStorage.removeItem('rememberedEmail');

      const response = await authAPI.login(data);
      if (response.data) {
        const { user, token, hasPermissions } = response.data;
        login(true, user, token, hasPermissions);
        if (user?.theme) {
        const saved = user.theme;
        if (saved?.type === 'custom' && saved.colors) {
          applyThemeToDOM(saved.colors);
        } else if (typeof saved === 'string' && themes[saved]) {
          applyThemeToDOM(themes[saved]);
        }
      }
        navigate('/dashboard', {
          replace: true,
          state: { message: `Welcome back, ${user?.full_name || user?.email}!` },
        });
      } else {
        setError('root', {
          type: 'manual',
          message: response.message || 'Login failed. Please check your credentials.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          'Login failed. Please check your credentials.';
        setError('root', { type: 'manual', message: errorMessage });
      } else if (error.request) {
        setError('root', {
          type: 'manual',
          message: 'Network error. Please check your connection and try again.',
        });
      } else {
        setError('root', {
          type: 'manual',
          message: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitForgotPassword = async (data) => {
    setForgotPasswordLoading(true);
    setForgotPasswordSuccess(false);
    try {
      await authAPI.forgetPassword(data.email);
      setForgotPasswordSuccess(true);
      resetForgotPasswordForm();
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setForgotPasswordSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Forgot password error:', error);
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.response.data?.detail ||
          `Server error: ${error.response.status}`;
        if (error.response.status === 404) errorMessage = 'No account found with this email address.';
        else if (error.response.status === 429) errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      setForgotPasswordError('email', { type: 'manual', message: errorMessage });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const openForgotPasswordModal = () => {
    setShowForgotPasswordModal(true);
    setForgotPasswordSuccess(false);
    resetForgotPasswordForm();
    const loginEmail = watch('email');
    if (loginEmail) setTimeout(() => setForgotPasswordValue('email', loginEmail), 0);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordSuccess(false);
    setForgotPasswordLoading(false);
    resetForgotPasswordForm();
  };

  const handleResendResetLink = () => {
    const email = getValues('email');
    if (email) onSubmitForgotPassword({ email });
  };

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  return (
    <>     
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        @keyframes floatUp {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }

        .tech-bg {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          overflow: hidden;
          background: radial-gradient(ellipse at center, #1e1b4b 0%, #0b0f19 70%);
        }
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(79,70,229,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,70,229,0.15) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
        }
        .node {
          position: absolute;
          border-radius: 50%;
          background: #7c3aed;
          box-shadow: 0 0 10px #7c3aed, 0 0 20px #06b6d4;
          animation: drift 6s ease-in-out infinite;
        }
        .node:nth-child(odd) {
          background: #06b6d4;
          animation-duration: 8s;
        }
        .tech-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(124,58,237,0.3);
          box-shadow: 0 0 15px rgba(6,182,212,0.2);
          animation: rotateSlow 20s linear infinite;
        }
        .pulse-orb {
          position: absolute;
          border-radius: 50%;
          background: rgba(79,70,229,0.2);
          animation: pulse-soft 4s ease-in-out infinite;
        }
        .graph-line {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
        }
        .graph-line path {
          stroke: rgba(6,182,212,0.4);
          stroke-width: 1.5;
          fill: none;
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: dash 10s linear forwards infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.05);
        }
      `}</style>

      <div className="relative min-h-screen flex items-center justify-center p-3 overflow-hidden">
        <div className="tech-bg">
          <div className="grid-overlay" />

          <div className="tech-ring w-96 h-96 top-1/4 left-1/4 opacity-40" />
          <div className="tech-ring w-64 h-64 bottom-1/3 right-1/4 opacity-30" style={{ animationDuration: '25s' }} />

          <div className="node w-4 h-4 top-1/4 left-1/3" />
          <div className="node w-3 h-3 top-1/2 right-1/4" style={{ animationDelay: '2s' }} />
          <div className="node w-5 h-5 bottom-1/4 left-1/2" style={{ animationDelay: '4s' }} />
          <div className="node w-2 h-2 top-3/4 right-1/3" style={{ animationDelay: '1s' }} />
          <div className="node w-4 h-4 top-1/3 right-1/5" style={{ animationDelay: '3s' }} />

          <div className="pulse-orb w-40 h-40 top-10 left-10" />
          <div className="pulse-orb w-32 h-32 bottom-20 right-20" style={{ animationDelay: '2s' }} />

          <svg className="graph-line" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <path d="M100,400 Q300,100 500,350 T900,200" stroke="rgba(6,182,212,0.5)" strokeWidth="2" fill="none" />
            <path d="M50,300 Q250,500 450,150 T950,400" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" fill="none" />
          </svg>

          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                bottom: `-10px`,
                opacity: Math.random() * 0.5 + 0.2,
                animation: `floatUp ${Math.random() * 10 + 8}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col md:flex-row w-full max-w-md md:max-w-2xl rounded-lg overflow-hidden glass-card">
          {/* Left side – desktop logo */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-500/80 to-accent-500/80 p-4 items-center justify-center">
            <img
              src={techhubLogo}
              alt="Shirsat Tech Hub"
              className="w-72 h-72 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Right side – form */}
          <div className="w-full md:w-1/2 p-4 md:p-6 flex flex-col justify-center bg-white/5 backdrop-blur-sm">
            {/* Mobile header – logo only, no text */}
            <div className="md:hidden text-center mb-3">
              <img src={mobileLogo} alt="Logo" className="w-12 h-12 mx-auto drop-shadow-lg" />
            </div>

            <div className="hidden md:block text-center mb-4">
              <h2 className="text-lg font-bold text-white">Welcome Back</h2>
              <p className="text-gray-300 text-xs mt-1">Sign in to continue learning</p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              {errors.root && (
                <div className="bg-red-500/20 border border-red-400/30 rounded p-2 text-xs animate-fade-in backdrop-blur-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-3 h-3 text-red-300 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-200 font-medium">Login Failed</p>
                      <p className="text-red-300 mt-0.5">{errors.root.message}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-200 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    className={`w-full pl-7 pr-2 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-white ${errors.email ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                      }`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-0.5 text-xs text-red-400 animate-fade-in">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-200 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    className={`w-full pl-7 pr-8 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-white ${errors.password ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                      }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-0.5 text-xs text-red-400 animate-fade-in">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    autoComplete="off"
                    className="rounded border-gray-500 bg-black/30 text-primary-600 focus:ring-primary-500 w-3 h-3"
                    disabled={isLoading}
                  />
                  <span className="text-xs text-gray-300">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-xs text-primary-300 hover:text-primary-200 transition-colors duration-200 font-medium"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !watchedEmail || !watchedPassword}
                className={`w-full py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded font-semibold text-xs shadow-sm hover:shadow-md transform transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-transparent ${isLoading || !watchedEmail || !watchedPassword
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:from-primary-700 hover:to-primary-800 hover:-translate-y-0.5'
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-1">
                    <LogIn className="w-3 h-3" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>

            <div className="text-center mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary-300 hover:text-primary-200 font-semibold transition-colors duration-200"
                >
                  Create account
                </Link>
              </p>
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center">
                <Shield className="w-2 h-2 mr-1" />
                Securely encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative animate-scale-in shadow-2xl">
            <button
              onClick={closeForgotPasswordModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={forgotPasswordLoading}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Your Password</h3>
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {forgotPasswordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-700 font-medium mb-1">
                      Reset link sent successfully!
                    </p>
                    <p className="text-xs text-green-600 mb-2">
                      Check your email for the password reset link. The link will expire in 1 hour.
                    </p>
                    <button
                      onClick={handleResendResetLink}
                      className="text-xs text-green-700 hover:text-green-800 font-medium underline"
                    >
                      Resend link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!forgotPasswordSuccess && (
              <form
                onSubmit={handleSubmitForgotPassword(onSubmitForgotPassword)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      {...registerForgotPassword('email')}
                      type="email"
                      id="forgot-email"
                      autoComplete="email"
                      className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${forgotPasswordErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      placeholder="Enter your registered email"
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                  {forgotPasswordErrors.email && (
                    <div className="mt-1 flex items-start space-x-1 animate-fade-in">
                      <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-600">{forgotPasswordErrors.email.message}</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    disabled={forgotPasswordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className={`flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${forgotPasswordLoading
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:bg-primary-700 hover:-translate-y-0.5'
                      }`}
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Remember your password?{' '}
                <button
                  onClick={closeForgotPasswordModal}
                  className="text-primary-600 hover:text-primary-800 font-medium"
                  disabled={forgotPasswordLoading}
                >
                  Back to login
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(Login);
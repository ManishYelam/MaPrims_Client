// src/pages/auth/Signup.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Eye, EyeOff, User, Mail, Lock, Shield, AlertCircle, Check, X, Building2
} from 'lucide-react';
import { authAPI, organizationAPI } from '../../services/api';
import techhubLogo from '../../assets/techhub.svg';    // desktop left panel
import mobileLogo from '../../assets/logo-tech1.svg';   // mobile header

/* ---------- validation schema ---------- */
const signupSchema = yup.object({
  full_name: yup.string().min(2, 'Full name must be at least 2 characters').required('Full name is required'),
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  role: yup.string().oneOf(['student', 'instructor'], 'Please select a valid role').required('Role is required'),
  org_id: yup.number().typeError('Organization must be selected').required('Please select an organization'),
  agreeToTerms: yup.boolean().oneOf([true], 'You must agree to the terms and conditions'),
});

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      org_id: '',
      agreeToTerms: false,
    },
  });

  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const response = await organizationAPI.getAll();
        const orgs = response.data?.data || response.data || [];
        setOrganizations(orgs);
        if (orgs.length > 0) setValue('org_id', orgs[0].org_id);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        setError('root', {
          type: 'manual',
          message: 'Unable to load organizations. Please refresh the page.',
        });
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, [setError, setValue]);

  const checkPasswordStrength = password => {
    const feedback = [];
    let score = 0;
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('One uppercase letter');
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('One lowercase letter');
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('One number');
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('One special character');
    return { score, feedback };
  };

  useEffect(() => {
    setPasswordStrength(watchedPassword ? checkPasswordStrength(watchedPassword) : { score: 0, feedback: [] });
  }, [watchedPassword]);

  const onSubmit = async data => {
    setIsLoading(true);
    try {
      const { confirmPassword, agreeToTerms, ...submitData } = data;
      if (submitData.org_id) submitData.org_id = Number(submitData.org_id);
      await authAPI.register(submitData);
      navigate('/login', {
        replace: true,
        state: {
          message: 'Account created successfully! Please login to continue.',
          type: 'success',
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      setError('root', {
        type: 'manual',
        message: error.response?.data?.message || 'Signup failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(prev => !prev);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev);

  const getPasswordStrengthColor = score => {
    if (score === 0) return 'bg-gray-200';
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = score => {
    if (score === 0) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Good';
    if (score <= 4) return 'Strong';
    return 'Very Strong';
  };

  return (
    <>
      {/* ============ FUTURISTIC BACKGROUND ============ */}
      <style>{`
        :root {
          --bg: #0b0f19;
          --accent1: #4f46e5;
          --accent2: #7c3aed;
          --accent3: #06b6d4;
        }

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
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
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
          background: var(--accent2);
          box-shadow: 0 0 10px var(--accent2), 0 0 20px var(--accent3);
          animation: drift 6s ease-in-out infinite;
        }
        .node:nth-child(odd) {
          background: var(--accent3);
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
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
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
            {/* Mobile header – logo only */}
            <div className="md:hidden text-center mb-3">
              <img src={mobileLogo} alt="Logo" className="w-12 h-12 mx-auto drop-shadow-lg" />
            </div>

            <div className="hidden md:block text-center mb-4">
              <h2 className="text-lg font-bold text-white">Create Account</h2>
              <p className="text-gray-300 text-xs mt-1">Join our platform</p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              {errors.root && (
                <div className="bg-red-500/20 border border-red-400/30 rounded p-2 text-xs animate-fade-in backdrop-blur-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-3 h-3 text-red-300 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-200 font-medium">Signup Failed</p>
                      <p className="text-red-300 mt-0.5">{errors.root.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-xs font-medium text-gray-200 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    {...register('full_name')}
                    type="text"
                    id="full_name"
                    autoComplete="name"
                    className={`w-full pl-7 pr-2 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-white ${
                      errors.full_name ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                    }`}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-0.5 text-xs text-red-400 animate-fade-in">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
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
                    className={`w-full pl-7 pr-2 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-white ${
                      errors.email ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                    }`}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-0.5 text-xs text-red-400 animate-fade-in">{errors.email.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-xs font-medium text-gray-200 mb-1">
                  I want to
                </label>
                <div className="relative">
                  <Shield className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <select
                    {...register('role')}
                    id="role"
                    className={`w-full pl-7 pr-2 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none text-white ${
                      errors.role ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="student">Learn Courses</option>
                    <option value="instructor">Teach Courses</option>
                  </select>
                </div>
                {errors.role && (
                  <p className="mt-0.5 text-xs text-red-400 animate-fade-in">{errors.role.message}</p>
                )}
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="org_id" className="block text-xs font-medium text-gray-200 mb-1">
                  Organization <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <select
                    {...register('org_id')}
                    id="org_id"
                    className={`w-full pl-7 pr-2 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none text-white ${
                      errors.org_id ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                    }`}
                    disabled={isLoading || loadingOrgs}
                  >
                    <option value="">{loadingOrgs ? 'Loading organizations...' : 'Select an organization'}</option>
                    {organizations.map(org => (
                      <option key={org.org_id} value={org.org_id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.org_id && (
                  <p className="mt-0.5 text-xs text-red-400 animate-fade-in">{errors.org_id.message}</p>
                )}
              </div>

              {/* Password */}
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
                    autoComplete="new-password"
                    className={`w-full pl-7 pr-8 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-white ${
                      errors.password ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                    }`}
                    placeholder="Create a strong password"
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
                {watchedPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">Strength:</span>
                      <span
                        className={`font-medium ${
                          passwordStrength.score <= 2
                            ? 'text-red-400'
                            : passwordStrength.score <= 3
                              ? 'text-yellow-400'
                              : passwordStrength.score <= 4
                                ? 'text-blue-400'
                                : 'text-green-400'
                        }`}
                      >
                        {getPasswordStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-200 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    className={`w-full pl-7 pr-8 py-1.5 text-xs bg-black/30 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-white ${
                      errors.confirmPassword ? 'border-red-400 bg-red-500/20' : 'border-gray-600'
                    }`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-0.5 text-xs text-red-400 animate-fade-in">{errors.confirmPassword.message}</p>
                )}
                {watchedConfirmPassword && (
                  <div
                    className={`flex items-center space-x-1 mt-1 text-xs ${
                      watchedPassword === watchedConfirmPassword ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {watchedPassword === watchedConfirmPassword ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>
                      {watchedPassword === watchedConfirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <input
                  {...register('agreeToTerms')}
                  type="checkbox"
                  id="agreeToTerms"
                  autoComplete="off"
                  className="mt-0.5 rounded border-gray-500 bg-black/30 text-primary-600 focus:ring-primary-500 w-3 h-3"
                  disabled={isLoading}
                />
                <label htmlFor="agreeToTerms" className="text-xs text-gray-300 cursor-pointer">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-300 hover:text-primary-200 font-medium">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-300 hover:text-primary-200 font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-xs text-red-400 animate-fade-in">{errors.agreeToTerms.message}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded font-semibold text-xs shadow-sm hover:shadow-md transform transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-transparent ${
                  isLoading
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:from-primary-700 hover:to-primary-800 hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="text-center mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-300 hover:text-primary-200 font-semibold transition-colors duration-200"
                >
                  Sign in here
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
    </>
  );
};

export default React.memo(Signup);
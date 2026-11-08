// src/components/AuthModal.jsx
import React, { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
  X as XIcon,
  Shield,
  Send,
  CheckCircle,
  Building2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI, organizationAPI } from '../../services/api'

const AuthModal = ({ course, onClose, onSuccess }) => {
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  })
  // Organization state
  const [organizations, setOrganizations] = useState([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    org_id: '',          // added organization id
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true)
      try {
        const response = await organizationAPI.getAll()
        const orgs = response.data?.data || response.data || []
        setOrganizations(orgs)
        if (orgs.length > 0) {
          setFormData(prev => ({ ...prev, org_id: orgs[0].org_id }))
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
        setErrors(prev => ({
          ...prev,
          submit: 'Unable to load organizations. Please refresh the page.',
        }))
      } finally {
        setLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  // Password strength checker (unchanged)
  const checkPasswordStrength = password => {
    const feedback = []
    let score = 0

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('At least 8 characters')
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('One uppercase letter')
    }

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('One lowercase letter')
    }

    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('One number')
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('One special character')
    }

    return { score, feedback }
  }

  // Watch password changes for strength indicator
  useEffect(() => {
    if (formData.password && !isLogin) {
      setPasswordStrength(checkPasswordStrength(formData.password))
    } else {
      setPasswordStrength({ score: 0, feedback: [] })
    }
  }, [formData.password, isLogin])

  const getPasswordStrengthColor = score => {
    if (score === 0) return 'bg-gray-200'
    if (score <= 2) return 'bg-red-500'
    if (score <= 3) return 'bg-yellow-500'
    if (score <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = score => {
    if (score === 0) return 'Very Weak'
    if (score <= 2) return 'Weak'
    if (score <= 3) return 'Good'
    if (score <= 4) return 'Strong'
    return 'Very Strong'
  }

  const validateForm = () => {
    const newErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!isLogin) {
      // Registration specific validations
      if (!formData.full_name) {
        newErrors.full_name = 'Full name is required'
      } else if (formData.full_name.length < 2) {
        newErrors.full_name = 'Full name must be at least 2 characters'
      }

      if (!formData.org_id) {
        newErrors.org_id = 'Organization is required'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords must match'
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions'
      }

      // Strong password validation for registration
      if (formData.password) {
        if (!/[A-Z]/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one uppercase letter'
        } else if (!/[a-z]/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one lowercase letter'
        } else if (!/[0-9]/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one number'
        } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
          newErrors.password = 'Password must contain at least one special character'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAuthSubmit = async e => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      if (isLogin) {
        // Login API call
        const loginData = {
          email: formData.email,
          password: formData.password,
        }

        const response = await authAPI.login(loginData)

        if (response.data) {
          const { user, token } = response.data
          login(true, user, token)
          onSuccess()
        } else {
          throw new Error(response.message || 'Login failed. Please check your credentials.')
        }
      } else {
        // Register API call - include org_id
        const { confirmPassword, agreeToTerms, ...registerData } = formData
        // Ensure org_id is a number
        if (registerData.org_id) {
          registerData.org_id = Number(registerData.org_id)
        }

        const response = await authAPI.register(registerData)

        if (response.data) {
          // Auto-login after successful registration
          const loginData = {
            email: formData.email,
            password: formData.password,
          }

          const loginResponse = await authAPI.login(loginData)

          if (loginResponse.data) {
            const { user, token } = loginResponse.data
            login(true, user, token)
            onSuccess()
          } else {
            throw new Error(
              'Registration successful but auto-login failed. Please sign in manually.'
            )
          }
        } else {
          throw new Error(response.message || 'Registration failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)

      let errorMessage = 'Authentication failed. Please try again.'

      if (error.response) {
        const responseData = error.response.data

        if (typeof responseData === 'string') {
          errorMessage = responseData
        } else if (responseData.message) {
          errorMessage = responseData.message
        } else if (responseData.error) {
          errorMessage = responseData.error
        } else if (responseData.detail) {
          errorMessage = responseData.detail
        } else if (responseData.errors) {
          const firstError = Object.values(responseData.errors)[0]
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
        } else {
          errorMessage = 'Authentication failed. Please check your information.'
        }

        // Handle specific error cases
        if (error.response.status === 401) {
          errorMessage = 'Invalid email or password.'
        } else if (error.response.status === 409) {
          errorMessage = 'An account with this email already exists.'
        } else if (error.response.status === 400) {
          errorMessage = errorMessage || 'Invalid input data. Please check your information.'
        } else if (error.response.status === 422) {
          errorMessage = 'Validation error. Please check your input.'
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else {
        errorMessage = error.message || 'An unexpected error occurred.'
      }

      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail || !/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setErrors({ submit: 'Please enter a valid email address' })
      return
    }

    setForgotPasswordLoading(true)
    setForgotPasswordSuccess(false)

    try {
      await authAPI.forgetPassword(forgotPasswordEmail)
      setForgotPasswordSuccess(true)

      setTimeout(() => {
        setShowForgotPasswordModal(false)
        setForgotPasswordSuccess(false)
        setForgotPasswordEmail('')
      }, 5000)
    } catch (error) {
      console.error('Forgot password error:', error)

      let errorMessage = 'Failed to send reset link. Please try again.'

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.response.data?.detail ||
          `Server error: ${error.response.status}`

        if (error.response.status === 404) {
          errorMessage = 'No account found with this email address.'
        } else if (error.response.status === 429) {
          errorMessage = 'Too many attempts. Please try again later.'
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }

      setErrors({ submit: errorMessage })
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const openForgotPasswordModal = () => {
    setShowForgotPasswordModal(true)
    setForgotPasswordSuccess(false)
    setForgotPasswordEmail(formData.email)
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
    setForgotPasswordSuccess(false)
    setForgotPasswordLoading(false)
    setForgotPasswordEmail('')
    setErrors({})
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setErrors({})
    if (!isLogin) {
      setFormData({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        org_id: organizations.length > 0 ? organizations[0].org_id : '',
        agreeToTerms: false,
      })
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header - Updated branding */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back' : 'Join Our Service Platform'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isLogin
                  ? 'Sign in to access your dashboard'
                  : 'Create an account to explore our offerings'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Course / Service Preview for New Users - Updated text */}
          {!isLogin && course && (
            <div className="p-4 bg-primary-50 border-b border-primary-100">
              <div className="flex items-center gap-3">
                <img
                  src={course.thumbnail_image}
                  alt={course.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-primary-900 text-sm">
                    Accessing: {course.title}
                  </h4>
                  <p className="text-primary-600 text-xs">Create account to access this offering</p>
                </div>
              </div>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
            {!isLogin && (
              <>
                {/* Full Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={e => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.full_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                  )}
                </div>

                {/* Role Selection - Updated options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I want to</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={formData.role}
                      onChange={e => handleInputChange('role', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                    >
                      <option value="student">Learn </option>
                      <option value="instructor">Teach</option>
                    </select>
                  </div>
                </div>

                {/* Organization Dropdown - NEW */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={formData.org_id}
                      onChange={e => handleInputChange('org_id', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white ${
                        errors.org_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={loading || loadingOrgs}
                    >
                      <option value="">
                        {loadingOrgs ? 'Loading organizations...' : 'Select an organization'}
                      </option>
                      {organizations.map(org => (
                        <option key={org.org_id} value={org.org_id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.org_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.org_id}</p>
                  )}
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isLogin ? 'Password' : 'Create Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

              {/* Password Strength Indicator (for registration only) */}
              {!isLogin && formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Strength:</span>
                    <span
                      className={`font-medium ${
                        passwordStrength.score <= 2
                          ? 'text-red-600'
                          : passwordStrength.score <= 3
                            ? 'text-yellow-600'
                            : passwordStrength.score <= 4
                              ? 'text-blue-600'
                              : 'text-green-600'
                      }`}
                    >
                      {getPasswordStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field (for registration only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div
                    className={`flex items-center space-x-1 mt-1 text-xs ${
                      formData.password === formData.confirmPassword
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formData.password === formData.confirmPassword ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <XIcon className="w-3 h-3" />
                    )}
                    <span>
                      {formData.password === formData.confirmPassword
                        ? 'Passwords match'
                        : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Terms and Conditions (for registration only) */}
            {!isLogin && (
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={e => handleInputChange('agreeToTerms', e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                  disabled={loading}
                />
                <label className="text-sm text-gray-600 cursor-pointer">
                  I agree to the{' '}
                  <span className="text-primary-600 hover:text-primary-800 font-medium">
                    Terms and Conditions
                  </span>{' '}
                  and{' '}
                  <span className="text-primary-600 hover:text-primary-800 font-medium">
                    Privacy Policy
                  </span>
                </label>
              </div>
            )}
            {errors.agreeToTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Switch between Login/Register */}
          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-primary-600 hover:text-primary-700 font-medium"
                disabled={loading}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (unchanged) */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-scale-in">
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
                      onClick={handleForgotPassword}
                      className="text-xs text-green-700 hover:text-green-800 font-medium underline"
                    >
                      Resend link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!forgotPasswordSuccess && (
              <div className="space-y-4">
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
                      type="email"
                      id="forgot-email"
                      value={forgotPasswordEmail}
                      onChange={e => setForgotPasswordEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your registered email"
                      disabled={forgotPasswordLoading}
                    />
                  </div>
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
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading || !forgotPasswordEmail}
                    className={`flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                      forgotPasswordLoading || !forgotPasswordEmail
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
              </div>
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
  )
}

export default AuthModal
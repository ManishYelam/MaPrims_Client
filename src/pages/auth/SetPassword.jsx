import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
  User,
  Mail,
} from 'lucide-react'
import { authAPI } from '../../services/api'

// Validation schema for set password
const setPasswordSchema = yup.object({
  otp: yup.string().required('OTP is required').min(6, 'OTP must be at least 6 characters'),
  new_password: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirm_password: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('new_password')], 'Passwords must match'),
})

const SetPassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState('')
  const [resendError, setResendError] = useState('')
  const { email } = useParams()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(setPasswordSchema),
    defaultValues: {
      otp: '',
      new_password: '',
      confirm_password: '',
    },
  })

  // Redirect if no email parameter
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', {
        replace: true,
        state: { error: 'Invalid reset link. Please request a new password reset.' },
      })
    }
  }, [email, navigate])

  const onSubmit = async data => {
    setIsLoading(true)
    setError('')

    try {
      // console.log('Setting new password for email:', email)
      // console.log('OTP:', data.otp)

      // Call the OTP change password service
      const response = await authAPI.otpChangePasswordService(email, {
        otp: data.otp,
        new_password: data.new_password,
      })

      // console.log('Set password response:', response)

      if (response.status === 200 || response.status === 201 || response.data) {
        setSuccess(true)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', {
            replace: true,
            state: {
              message: 'Password reset successfully! Please login with your new password.',
            },
          })
        }, 3000)
      } else {
        throw new Error('Failed to reset password')
      }
    } catch (error) {
      console.error('Set password error:', error)

      let errorMessage = 'Failed to reset password. Please try again.'

      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.response.data?.detail ||
          `Server error: ${error.response.status}`

        if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message || 'Invalid OTP or password requirements not met.'
        } else if (error.response.status === 404) {
          errorMessage = 'Invalid reset link. Please request a new password reset.'
        } else if (error.response.status === 410) {
          errorMessage = 'Reset link has expired. Please request a new password reset.'
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to resend reset link using forgetPassword service
  const handleResendResetLink = async () => {
    setIsResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      // console.log('Resending reset link for email:', email)

      // Use the forgetPassword service to resend the reset link
      const response = await authAPI.forgetPassword(email)

      // console.log('Resend reset link response:', response)

      if (response.status === 200 || response.status === 201 || response.data) {
        setResendSuccess(true)

        // Auto hide success message after 5 seconds
        setTimeout(() => {
          setResendSuccess(false)
        }, 5000)
      } else {
        throw new Error('Failed to send reset link')
      }
    } catch (error) {
      console.error('Resend reset link error:', error)

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
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid email address.'
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.'
      }

      setResendError(errorMessage)
    } finally {
      setIsResending(false)
    }
  }

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleBackToLogin = () => {
    navigate('/login', { replace: true })
  }

  const newPassword = watch('new_password')
  const confirmPassword = watch('confirm_password')

  // Password strength indicator
  const getPasswordStrength = password => {
    if (!password) return { strength: 0, text: '', color: '' }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[@$!%*?&]/.test(password)) strength++

    const strengthMap = {
      1: { text: 'Very Weak', color: 'bg-red-500' },
      2: { text: 'Weak', color: 'bg-orange-500' },
      3: { text: 'Fair', color: 'bg-yellow-500' },
      4: { text: 'Good', color: 'bg-blue-500' },
      5: { text: 'Strong', color: 'bg-green-500' },
    }

    return { strength, ...strengthMap[strength] }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  if (!email) {
    return null // Will redirect due to useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBackToLogin}
          className="flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-800 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Set New Password</h1>
            <p className="text-primary-100 text-sm">
              Enter the OTP sent to your email and create a new password
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 font-medium mb-1">Password Reset Successful!</p>
                    <p className="text-green-600 text-sm">Redirecting you to login page...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resend Success Message */}
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fade-in">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 font-medium mb-1">Reset Link Sent!</p>
                    <p className="text-green-600 text-sm">Check your email for the new OTP.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !success && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-fade-in">
                <div className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 font-medium mb-1">Reset Failed</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resend Error Message */}
            {resendError && !resendSuccess && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-fade-in">
                <div className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 font-medium mb-1">Resend Failed</p>
                    <p className="text-red-600 text-sm">{resendError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Display with Resend Button */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{email}</span>
                </div>
                <button
                  onClick={handleResendResetLink}
                  disabled={isResending}
                  className="flex items-center space-x-1 text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!success && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* OTP Field */}
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    OTP Code
                  </label>
                  <input
                    {...register('otp')}
                    type="text"
                    id="otp"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                      errors.otp ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter OTP sent to your email"
                    disabled={isLoading}
                  />
                  {errors.otp && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">
                      {errors.otp.message}
                    </p>
                  )}
                </div>

                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="new_password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      {...register('new_password')}
                      type={showNewPassword ? 'text' : 'password'}
                      id="new_password"
                      className={`w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                        errors.new_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={toggleNewPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Password strength:</span>
                        <span className="text-xs font-medium text-gray-700">
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.color
                          }`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {errors.new_password && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">
                      {errors.new_password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      {...register('confirm_password')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm_password"
                      className={`w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
                        errors.confirm_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Confirm new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1 text-xs text-red-600 animate-fade-in">
                      {errors.confirm_password.message}
                    </p>
                  )}

                  {/* Password Match Indicator */}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 animate-fade-in">✓ Passwords match</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    isLoading
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:from-primary-700 hover:to-primary-800 hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Reset Password</span>
                    </div>
                  )}
                </button>
              </form>
            )}

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <Link to="/contact" className="text-primary-600 hover:text-primary-800 font-medium">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <Shield className="w-3 h-3 mr-1" />
            Your password is securely encrypted
          </p>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SetPassword)

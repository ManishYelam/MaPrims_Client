import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
// import { resetPassword } from "../../services/authService";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaShieldAlt,
  FaArrowLeft,
  FaLink,
  FaKey,
} from 'react-icons/fa'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  })
  const [resetMethod, setResetMethod] = useState('') // 'token' or 'otp'

  useEffect(() => {
    const email = localStorage.getItem('resetEmail')
    const otpVerified = localStorage.getItem('otpVerified')

    if (token) {
      setResetMethod('token')
    } else if (otpVerified && email) {
      setResetMethod('otp')
    } else {
      navigate('/reset-password')
      return
    }
  }, [token, navigate])

  // Password strength checker
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

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // Check password strength in real-time
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value))
    }

    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.password) {
      return 'Password is required'
    }

    if (passwordStrength.score < 3) {
      return 'Please choose a stronger password'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match'
    }

    return null
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    const email = localStorage.getItem('resetEmail')

    try {
      let resetData = {
        email,
        password: formData.password,
      }

      // Add method-specific data
      if (resetMethod === 'token') {
        resetData.token = token
      } else if (resetMethod === 'otp') {
        // OTP is already verified, no need to send it again
      }

      // await resetPassword(resetData);

      setSuccess(true)

      // Clear stored data
      localStorage.removeItem('resetEmail')
      localStorage.removeItem('otpVerified')

      // Redirect to login after success
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Password reset successfully! Please login with your new password.',
            type: 'success',
          },
        })
      }, 2000)
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to reset password. Please try the process again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <FaCheck className="text-green-600 text-4xl" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Successfully!</h2>

            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. Redirecting to login...
            </p>

            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <FaShieldAlt className="text-white text-2xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create New Password</h1>
          <p className="text-gray-600">Choose a strong, secure password for your account</p>

          {/* Method Indicator */}
          <div className="mt-4 flex justify-center">
            <div
              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                resetMethod === 'token'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {resetMethod === 'token' ? (
                <>
                  <FaLink size={12} />
                  <span>Reset via Link</span>
                </>
              ) : (
                <>
                  <FaKey size={12} />
                  <span>Reset via OTP</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Password strength:</span>
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
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <div
              className={`flex items-center space-x-2 text-sm ${
                formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formData.password === formData.confirmPassword ? (
                <FaCheck className="flex-shrink-0" />
              ) : (
                <FaTimes className="flex-shrink-0" />
              )}
              <span>
                {formData.password === formData.confirmPassword
                  ? 'Passwords match'
                  : 'Passwords do not match'}
              </span>
            </div>
          )}

          {/* Security Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 text-sm mb-2">💡 Password Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use at least 8 characters with mixed case</li>
              <li>• Include numbers and special characters</li>
              <li>• Avoid common words and personal information</li>
              <li>• Don't reuse passwords from other sites</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating password...</span>
              </div>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Back Links */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200 space-y-3">
          {resetMethod === 'otp' ? (
            <button
              onClick={() => navigate('/verify-otp')}
              className="inline-flex items-center space-x-2 text-green-600 hover:text-green-800 font-semibold transition-colors"
            >
              <FaArrowLeft size={14} />
              <span>Back to OTP Verification</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/forgot-password')}
              className="inline-flex items-center space-x-2 text-green-600 hover:text-green-800 font-semibold transition-colors"
            >
              <FaArrowLeft size={14} />
              <span>Back to Forgot Password</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

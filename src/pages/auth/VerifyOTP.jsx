import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
// import { verifyPasswordResetOTP } from "../../services/authService";
import { FaShieldAlt, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa'

const VerifyOTP = () => {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timer, setTimer] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef([])

  const email = localStorage.getItem('resetEmail')

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password')
      return
    }

    // Timer countdown
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [email, navigate])

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return // Only allow numbers

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleSubmit(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = e => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const pastedDigits = pastedData.replace(/\D/g, '').split('').slice(0, 6)

    if (pastedDigits.length === 6) {
      const newOtp = [...otp]
      pastedDigits.forEach((digit, index) => {
        newOtp[index] = digit
      })
      setOtp(newOtp)

      // Focus the last input
      inputRefs.current[5].focus()
    }
  }

  const handleSubmit = async (otpValue = null) => {
    const otpString = otpValue || otp.join('')

    if (otpString.length !== 6) {
      setError('Please enter all 6 digits of the OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      // await verifyPasswordResetOTP({
      //   email,
      //   otp: otpString
      // });

      setSuccess(true)
      // Store verification success and navigate to reset password
      localStorage.setItem('otpVerified', 'true')
      setTimeout(() => navigate('/reset-password'), 1000)
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || 'Invalid OTP. Please try again.'
      setError(errorMessage)

      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0].focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')

    try {
      await requestPasswordResetOTP({ email })
      setTimer(600) // Reset timer to 10 minutes
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0].focus()
      setError('') // Clear any previous errors
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
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

            <h2 className="text-2xl font-bold text-gray-800 mb-4">OTP Verified Successfully!</h2>

            <p className="text-gray-600 mb-6">Redirecting you to set a new password...</p>

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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Enter OTP</h1>
          <p className="text-gray-600 mb-2">We sent a 6-digit code to:</p>
          <p className="text-green-600 font-semibold">{email}</p>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className={`text-sm font-medium ${timer > 60 ? 'text-green-600' : 'text-red-600'}`}>
            <FaClock className="inline mr-1" />
            OTP expires in: {formatTime(timer)}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {/* OTP Input Fields */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter the 6-digit verification code
          </label>
          <div className="flex justify-center space-x-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {/* OTP Status */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {otp.every(digit => digit !== '') ? (
            <>
              <FaCheck className="text-green-500" />
              <span className="text-green-600 text-sm">Ready to verify</span>
            </>
          ) : (
            <>
              <FaTimes className="text-gray-400" />
              <span className="text-gray-500 text-sm">Enter all 6 digits</span>
            </>
          )}
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={loading || otp.some(digit => digit === '')}
          className={`w-full py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mb-4 ${
            loading || otp.some(digit => digit === '')
              ? 'opacity-70 cursor-not-allowed'
              : 'hover:bg-green-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying OTP...</span>
            </div>
          ) : (
            'Verify OTP'
          )}
        </button>

        {/* Resend OTP */}
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={loading || !canResend}
            className={`text-green-600 font-semibold text-sm ${
              canResend ? 'hover:text-green-800' : 'opacity-50 cursor-not-allowed'
            } transition-colors`}
          >
            {loading ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>

        {/* Back Links */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200 space-y-3">
          <button
            onClick={() => navigate('/forgot-password')}
            className="inline-flex items-center space-x-2 text-green-600 hover:text-green-800 font-semibold transition-colors"
          >
            <FaArrowLeft size={14} />
            <span>Use Different Email</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTP

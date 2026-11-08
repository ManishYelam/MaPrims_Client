// src/components/enrollment/AuthSelectionStep.jsx
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff, Building2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI, organizationAPI } from '../../services/api'

// Validation schemas
const loginSchema = yup.object({
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
})

const signupSchema = yup.object({
  full_name: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .required('Full name is required'),
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  org_id: yup.number()
    .typeError('Organization must be selected')
    .required('Please select an organization'),
})

const AuthSelectionStep = ({ onAuthComplete, onClose }) => {
  const { login } = useAuth()
  const [authMethod, setAuthMethod] = useState('login') // 'login' or 'signup'
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  // Fetch organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true)
      try {
        const response = await organizationAPI.getAll()
        const orgs = response.data?.data || response.data || []
        setOrganizations(orgs)
        // Set default org_id in signup form if available
        if (orgs.length > 0) {
          signupMethods.register.setValue('org_id', orgs[0].org_id)
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
        signupMethods.register.setError('root', {
          type: 'manual',
          message: 'Unable to load organizations. Please refresh the page.',
        })
      } finally {
        setLoadingOrgs(false)
      }
    }
    fetchOrganizations()
  }, [])

  const loginMethods = {
    register: useForm({
      resolver: yupResolver(loginSchema),
      defaultValues: { email: '', password: '' },
    }),
    signup: useForm({
      resolver: yupResolver(signupSchema),
      defaultValues: { full_name: '', email: '', password: '', confirmPassword: '', org_id: '' },
    }),
  }

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    setError: setLoginError,
  } = loginMethods.register
  const {
    register: signupRegister,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    setError: setSignupError,
    watch: watchSignup,
    setValue: setSignupValue,
  } = loginMethods.signup

  const handleQuickLogin = async method => {
    setIsLoading(true)
    try {
      // Implement quick login logic (Google, etc.)
      setTimeout(() => {
        const userData = {
          profileComplete: false,
          firstName: 'New',
          lastName: 'User',
        }
        onAuthComplete(userData)
      }, 1000)
    } catch (error) {
      console.error('Login failed:', error)
      alert('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onLogin = async data => {
    setIsLoading(true)
    try {
      const response = await authAPI.login(data)

      if (response.data.success) {
        login(response.data.data)
        onAuthComplete(response.data.data.user)
      } else {
        throw new Error(response.data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('root', {
        type: 'manual',
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSignup = async data => {
    setIsLoading(true)
    try {
      const { confirmPassword, ...submitData } = data
      // Ensure org_id is a number
      if (submitData.org_id) {
        submitData.org_id = Number(submitData.org_id)
      }
      const response = await authAPI.register(submitData)

      if (response.data.success) {
        // Auto-login after signup
        const loginResponse = await authAPI.login({
          email: data.email,
          password: data.password,
        })

        if (loginResponse.data.success) {
          login(loginResponse.data.data)
          onAuthComplete(loginResponse.data.data.user)
        }
      } else {
        throw new Error(response.data.message || 'Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setSignupError('root', {
        type: 'manual',
        message: error.response?.data?.message || 'Signup failed. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-6 h-6 text-primary-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Join Our Service Platform</h3>
        <p className="text-gray-600 mt-2">
          Sign in to enroll and access our services – project development, AMC, and more
        </p>
      </div>

      {/* Auth Method Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setAuthMethod('login')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            authMethod === 'login'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={isLoading}
        >
          Sign In
        </button>
        <button
          onClick={() => setAuthMethod('signup')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            authMethod === 'signup'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          disabled={isLoading}
        >
          Create Account
        </button>
      </div>

      {/* Quick Auth Options */}
      <div className="space-y-3">
        <button
          onClick={() => handleQuickLogin('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <button
          onClick={() => handleQuickLogin('github')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="/icons/github.svg" alt="GitHub" className="w-5 h-5" />
          Continue with GitHub
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Login Form */}
      {authMethod === 'login' && (
        <form className="space-y-4" onSubmit={handleLoginSubmit(onLogin)}>
          {loginErrors.root && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">Login Failed</p>
                  <p className="text-red-600 mt-0.5">{loginErrors.root.message}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...loginRegister('email')}
                type="email"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  loginErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>
            {loginErrors.email && (
              <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...loginRegister('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full pl-8 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  loginErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {loginErrors.password && (
              <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      )}

      {/* Signup Form */}
      {authMethod === 'signup' && (
        <form className="space-y-4" onSubmit={handleSignupSubmit(onSignup)}>
          {signupErrors.root && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 font-medium">Signup Failed</p>
                  <p className="text-red-600 mt-0.5">{signupErrors.root.message}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...signupRegister('full_name')}
                type="text"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  signupErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>
            {signupErrors.full_name && (
              <p className="mt-1 text-sm text-red-600">{signupErrors.full_name.message}</p>
            )}
          </div>

          {/* Organization Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                {...signupRegister('org_id')}
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white ${
                  signupErrors.org_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isLoading || loadingOrgs}
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
            {signupErrors.org_id && (
              <p className="mt-1 text-sm text-red-600">{signupErrors.org_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...signupRegister('email')}
                type="email"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  signupErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>
            {signupErrors.email && (
              <p className="mt-1 text-sm text-red-600">{signupErrors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...signupRegister('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full pl-8 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  signupErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Create a password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {signupErrors.password && (
              <p className="mt-1 text-sm text-red-600">{signupErrors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...signupRegister('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`w-full pl-8 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  signupErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {signupErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{signupErrors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {authMethod === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setAuthMethod(authMethod === 'login' ? 'signup' : 'login')}
            className="text-primary-600 hover:text-primary-700 font-medium"
            disabled={isLoading}
          >
            {authMethod === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthSelectionStep
// src/pages/Contact.jsx
import React, { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  User,
  Headphones,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
} from 'lucide-react'
import { contactAPI } from '../services/api'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'

// Compact Contact Info Item
const ContactInfoItem = React.memo(({ icon: Icon, title, value, description, href, color }) => (
  <a
    href={href}
    target={href?.startsWith('http') ? '_blank' : '_self'}
    rel="noopener noreferrer"
    className="group block bg-white rounded-lg p-3 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg ${color || 'bg-primary-100'} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}
      >
        <Icon className="w-4 h-4 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-xs mb-1">{title}</h3>
        <p className="text-gray-800 font-medium text-xs mb-1">{value}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  </a>
))

ContactInfoItem.displayName = 'ContactInfoItem'

// Compact Form Field
const FormField = React.memo(
  ({
    label,
    id,
    name,
    value,
    onChange,
    type = 'text',
    required = false,
    placeholder,
    error,
    children,
    maxLength,
    pattern,
    onKeyPress,
    icon: Icon,
    rows = 3,
  }) => (
    <div className="relative">
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children || (
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Icon className="w-3 h-3" />
            </div>
          )}
          {type === 'textarea' ? (
            <textarea
              id={id}
              name={name}
              value={value}
              onChange={onChange}
              onKeyPress={onKeyPress}
              required={required}
              placeholder={placeholder}
              maxLength={maxLength}
              rows={rows}
              className={`w-full px-3 ${Icon ? 'pl-9' : ''} py-2 text-xs border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-150 resize-none ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            />
          ) : (
            <input
              type={type}
              id={id}
              name={name}
              value={value}
              onChange={onChange}
              onKeyPress={onKeyPress}
              required={required}
              placeholder={placeholder}
              maxLength={maxLength}
              pattern={pattern}
              className={`w-full px-3 ${Icon ? 'pl-9' : ''} py-2 text-xs border rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-150 ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            />
          )}
        </div>
      )}
      {error && (
        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  )
)

FormField.displayName = 'FormField'

// Compact Success State Component
const SuccessState = React.memo(({ onReset }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h2>
        <p className="text-xs text-gray-600 mb-4">
          Thank you for contacting us. We'll get back to you within 24 hours.
        </p>

        <div className="space-y-2">
          <button
            onClick={onReset}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Send Another Message
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full border border-primary-200 hover:border-primary-300 text-primary-700 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-primary-50"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
})

SuccessState.displayName = 'SuccessState'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const contactInfo = useMemo(
    () => [
      {
        icon: MailIcon,
        title: 'Email Support',
        value: 'support@maprims.in',
        description: 'Get detailed course information via email',
        href: 'mailto:support@maprims.in?subject=Course Inquiry - MaPrims',
        color: 'bg-blue-100',
      },
      {
        icon: PhoneIcon,
        title: 'Call / WhatsApp',
        value: '+91 95275 12770',
        description: 'Mon to Sun: 9 AM - 9 PM',
        href: 'https://wa.me/919527512770?text=Hi%20Shirsat%20Tech%20Hub,%20I%20would%20like%20to%20know%20more%20about%20your%20courses',
        color: 'bg-green-100',
      },
      {
        icon: MessageCircle,
        title: 'Live Chat',
        value: 'Click to Chat',
        description: 'Instant response during business hours',
        href: 'https://wa.me/919527512770',
        color: 'bg-purple-100',
      },
      {
        icon: MapPinIcon,
        title: 'Location',
        value: 'Pune, India',
        description: 'Online training available worldwide',
        color: 'bg-orange-100',
      },
    ],
    []
  )

  const subjectOptions = useMemo(
    () => [
      { value: '', label: 'Select a subject' },
      { value: 'course-info', label: 'Course Information' },
      { value: 'admission', label: 'Admission Process' },
      { value: 'payment', label: 'Payment & Fees' },
      { value: 'placement', label: 'Placement Assistance' },
      { value: 'free-demo', label: 'Free Demo' },
      { value: 'other', label: 'Other' },
    ],
    []
  )

  const validateForm = useCallback(() => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone) {
      const phoneDigits = formData.phone.replace(/\D/g, '')
      if (phoneDigits.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits'
      } else if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
        newErrors.phone = 'Please enter a valid Indian mobile number (starts with 6-9)'
      }
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handlePhoneChange = useCallback(
    e => {
      const { name, value } = e.target
      const digitsOnly = value.replace(/\D/g, '')
      const limitedDigits = digitsOnly.slice(0, 10)

      setFormData(prev => ({
        ...prev,
        [name]: limitedDigits,
      }))

      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }))
      }
      if (submitError) setSubmitError('')
    },
    [errors, submitError]
  )

  const handleChange = useCallback(
    e => {
      const { name, value } = e.target

      if (name === 'phone') {
        handlePhoneChange(e)
        return
      }

      setFormData(prev => ({ ...prev, [name]: value }))

      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }))
      }
      if (submitError) setSubmitError('')
    },
    [errors, submitError, handlePhoneChange]
  )

  const handleKeyPress = useCallback(e => {
    if (e.target.name === 'phone') {
      const charCode = e.charCode
      if (charCode < 48 || charCode > 57) {
        e.preventDefault()
      }
    }
  }, [])

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()

      if (!validateForm()) {
        const firstErrorField = Object.keys(errors)[0]
        if (firstErrorField) {
          const element = document.getElementById(firstErrorField)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
          }
        }
        return
      }

      setIsSubmitting(true)
      setSubmitError('')

      try {
        const submitData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          subject: formData.subject,
          message: formData.message.trim(),
          timestamp: new Date().toISOString(),
          source: 'website_contact_form',
        }

        await contactAPI.submitContact(submitData)
        setIsSubmitted(true)

        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        })
        setErrors({})
      } catch (error) {
        console.error('Contact form submission error:', error)

        if (error.response) {
          const { status, data } = error.response
          if (status === 400 && data.errors) {
            setErrors(data.errors)
          } else if (status === 429) {
            setSubmitError('Too many requests. Please try again in a few minutes.')
          } else {
            setSubmitError(data.message || 'Failed to send message. Please try again.')
          }
        } else if (error.request) {
          setSubmitError('Network error. Please check your connection.')
        } else {
          setSubmitError('An unexpected error occurred. Please try again.')
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, errors]
  )

  if (isSubmitted) {
    return <SuccessState onReset={() => setIsSubmitted(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Compact Hero Section – full width */}
      <section className="relative bg-gradient-to-r from-primary-900 via-primary-800 to-accent-700 text-white py-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-16 w-72 h-72 bg-accent-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 -right-16 w-72 h-72 bg-primary-400/20 rounded-full blur-2xl"></div>
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-3">
              <Headphones className="w-3 h-3 text-accent-300" />
              <span className="text-xs font-medium">24/7 Support Available</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold font-display mb-2">
              Let's Transform Your Career Together
            </h1>
            <p className="text-xs text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Get personalized guidance from industry experts. Ask about courses, admissions,
              placements, or schedule a free demo class.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content – full width */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Contact Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Get in touch</h2>
              <div className="text-xs font-medium px-2 py-1 bg-accent-100 text-accent-800 rounded-full">
                Response within 30 mins
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium text-xs">Submission Failed</p>
                    <p className="text-red-700 text-xs mt-0.5">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Full Name"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  error={errors.name}
                  icon={User}
                />
                <FormField
                  label="Email Address"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  error={errors.email}
                  icon={Mail}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Phone Number (WhatsApp)"
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="10-digit mobile number"
                  error={errors.phone}
                  maxLength={10}
                  icon={Phone}
                />
                <FormField
                  label="Subject"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  error={errors.subject}
                >
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all duration-150 hover:border-gray-400"
                  >
                    {subjectOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField
                label="Your Message / Questions"
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                error={errors.message}
                type="textarea"
                rows={3}
                placeholder="Tell us about your background, goals, and any specific questions..."
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2 px-4 rounded-lg font-semibold text-sm flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-2 group-hover:scale-105 transition-transform" />
                    Send Message
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By submitting, you agree to our{' '}
                  <Link
                    to="/privacy"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Privacy Policy
                  </Link>{' '}
                  and consent to receive communication via call, SMS, email, and WhatsApp.
                </p>
              </div>
            </form>
          </div>

          {/* Right Column - Contact Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                Connect With Us
                <div className="w-8 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600 mt-1 rounded-full"></div>
              </h2>
              <div className="space-y-3">
                {contactInfo.map((item, index) => (
                  <ContactInfoItem key={index} {...item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Floating Icon */}
      <WhatsAppFloatingIcon />
    </div>
  )
}

export default React.memo(Contact)
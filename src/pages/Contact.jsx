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
  Globe,
  Briefcase,
  Building2,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  MessageSquare,
  Code,
} from 'lucide-react'
import { contactAPI } from '../services/api'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'

// ==================== HERO HIGHLIGHTS (mirrors Home hero) ====================
const HERO_HIGHLIGHTS = [
  { icon: Globe, title: 'Domain Registration', desc: 'Build your online identity' },
  { icon: Code, title: 'IT Solutions', desc: 'Technology for your business' },
  { icon: MessageSquare, title: 'Free Consultation', desc: 'Talk to an expert today' },
  { icon: Headphones, title: 'Expert Support', desc: 'Assistance when you need it' },
]

// Compact Contact Info Item
const ContactInfoItem = React.memo(({ icon: Icon, title, value, description, href, color }) => (
  <a
    href={href}
    target={href?.startsWith('http') ? '_blank' : '_self'}
    rel="noopener noreferrer"
    className="group block bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg ${color || 'bg-primary-100'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-4 h-4 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-gray-900 text-xs sm:text-sm mb-0.5">{title}</h3>
        <p className="text-gray-800 font-medium text-xs mb-0.5">{value}</p>
        <p className="text-[11px] text-gray-500">{description}</p>
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
              className={`w-full px-3 ${Icon ? 'pl-9' : ''} py-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-150 resize-none ${
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
              className={`w-full px-3 ${Icon ? 'pl-9' : ''} py-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-150 ${
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h2>
        <p className="text-xs text-gray-600 mb-4">
          Thank you for contacting MaPrims. Our team will get back to you within 24 hours.
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
    company: '',
    service: '',
    budget: '',
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
        description: 'Project inquiries & technical support',
        href: 'mailto:support@maprims.in?subject=Project Inquiry - MaPrims',
        color: 'bg-blue-100',
      },
      {
        icon: PhoneIcon,
        title: 'Call / WhatsApp',
        value: '+91 93732 00525',
        description: 'Mon – Sun: 9 AM – 9 PM',
        href: 'https://wa.me/919373200525?text=Hi%20MaPrims,%20I%20would%20like%20to%20discuss%20a%20project',
        color: 'bg-green-100',
      },
      {
        icon: Globe,
        title: 'Domains',
        value: 'Register a Domain',
        description: 'Search & secure your digital identity',
        href: '/domains',
        color: 'bg-purple-100',
      },
      {
        icon: MapPinIcon,
        title: 'Location',
        value: 'Pune, India',
        description: 'Serving clients worldwide, remotely',
        color: 'bg-orange-100',
      },
    ],
    []
  )

  const subjectOptions = useMemo(
    () => [
      { value: '', label: 'Select a subject' },
      { value: 'web-development', label: 'Web Development' },
      { value: 'mobile-development', label: 'Mobile App Development' },
      { value: 'cloud-devops', label: 'Cloud & DevOps' },
      { value: 'ai-automation', label: 'AI & Automation' },
      { value: 'ui-ux', label: 'UI/UX Design' },
      { value: 'enterprise-software', label: 'Enterprise Software' },
      { value: 'domain-registration', label: 'Domain Registration' },
      { value: 'support', label: 'Technical Support' },
      { value: 'partnership', label: 'Partnership / Collaboration' },
      { value: 'other', label: 'Other' },
    ],
    []
  )

  const budgetOptions = useMemo(
    () => [
      { value: '', label: 'Select budget' },
      { value: '<5L', label: '< ₹5 Lakh' },
      { value: '5-10L', label: '₹5L – ₹10L' },
      { value: '10-25L', label: '₹10L – ₹25L' },
      { value: '25-50L', label: '₹25L – ₹50L' },
      { value: '>50L', label: '> ₹50L' },
      { value: 'not-sure', label: 'Not sure yet' },
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
          company: formData.company.trim() || null,
          service: formData.subject,
          budget: formData.budget || null,
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
          company: '',
          service: '',
          budget: '',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">
      {/* ============================================================
          HERO — light gradient, mirrors Home/Domains/Services/Blogs/About
          ============================================================ */}
      <section className="relative isolate w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-14">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[11px] sm:text-xs font-bold">
              <Headphones size={13} />
              24/7 Support Available
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-primary-900">
              Let's Build Your
              <span className="block text-primary-600">Digital Future Together</span>
            </h1>

            {/* Description */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-gray-600 max-w-2xl mx-auto">
              Talk to our experts about web development, mobile apps, cloud, AI, domain registration,
              or any digital solution. Get a free consultation and a custom proposal within 24 hours.
            </p>

            {/* Highlights (mirrors Home hero grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6 w-full text-left">
              {HERO_HIGHLIGHTS.map((item, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-2.5">
                  <div className="shrink-0 p-2 rounded-lg bg-primary-100 text-primary-600">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-primary-900">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Contact Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                Request a Proposal
              </h2>
              <div className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 bg-accent-100 text-accent-800 rounded-full">
                Response within 24 hours
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
                  label="Phone (WhatsApp)"
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
                  label="Company"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your company name"
                  icon={Building2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Service Interested In"
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
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-150 hover:border-gray-400"
                  >
                    {subjectOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Estimated Budget"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                >
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all duration-150 hover:border-gray-400"
                  >
                    {budgetOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField
                label="Project Details / Questions"
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                error={errors.message}
                type="textarea"
                rows={4}
                placeholder="Tell us about your project, requirements, goals, or any specific questions..."
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2 group-hover:scale-105 transition-transform" />
                    Send Message
                  </>
                )}
              </button>

              <div className="text-center">
                <p className="text-[11px] text-gray-500">
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
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900">
                    Connect With Us
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Choose the channel that works for you
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {contactInfo.map((item, index) => (
                  <ContactInfoItem key={index} {...item} />
                ))}
              </div>
            </div>

            {/* Quick CTA card */}
            <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 rounded-xl p-4 sm:p-5 text-white shadow-lg">
              <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-2">
                <Sparkles className="w-3 h-3 text-accent-300" />
                <span className="text-[10px] font-semibold">Your Digital Growth Partner</span>
              </div>
              <h3 className="text-sm sm:text-base font-black mb-1">
                Ready to start your project?
              </h3>
              <p className="text-[11px] text-primary-100 mb-3 leading-relaxed">
                Explore our services or register your domain today. Quality assured, 100+ projects delivered, 98% client satisfaction.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-primary-700 rounded-lg text-[11px] font-bold hover:bg-gray-50 transition shadow-sm"
                >
                  <Briefcase className="w-3 h-3" /> Explore Services
                  <ChevronRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/domains"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-black/20 border border-white/20 text-white rounded-lg text-[11px] font-bold hover:bg-black/30 transition"
                >
                  <Globe className="w-3 h-3" /> Register Domain
                </Link>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { icon: ShieldCheck, label: 'Quality Assured' },
                { icon: Clock, label: '24/7 Support' },
                { icon: CheckCircle2, label: '98% Satisfaction' },
              ].map(({ icon: Icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 rounded-xl py-2.5 px-2 text-[11px] font-bold text-gray-700 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <Icon className="w-3.5 h-3.5 text-green-500" />
                  {label}
                </div>
              ))}
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
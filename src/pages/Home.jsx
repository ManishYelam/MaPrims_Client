// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Clock, Users, TrendingUp, Shield, BookOpen, Sparkles,
  Target, Rocket, Heart, Brain, Cloud, Code, Cpu, Network, Briefcase, Phone,
  ChevronRight, ChevronLeft, Calendar, Video, FileText, MessageSquare, Star, CheckCircle,
  Award, Database, Server, Terminal, AlertCircle, ShieldCheck, Trophy,
  ChartLine, BookMarked, Users as UsersIcon, TrendingUp as TrendingUpIcon,
  Briefcase as BriefcaseIcon, Cloud as CloudRain, Code as CodeXml, ChartBar,
  Linkedin, MapPin, Mail, Building, GitBranch, Zap, Layers, Globe,
  Paperclip, X, Headphones, Send, Smartphone,
  UserCheck, Wrench, School, LifeBuoy, Ticket, ShieldHalf, Settings, KeySquare,
  CreditCard, FolderOpen, BarChart3, Search, Link2, Lock, RefreshCw
} from 'lucide-react'
import { coursesAPI, testimonialAPI, servicesAPI, proposalAPI } from '../services/api'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'
import ServiceCard from '../components/ui/ServiceCard'
import CourseCard from '../components/ui/CourseCard'

import {
  STATS,
  COURSES_BY_CATEGORY,
  FEATURES,
  CAREER_POINTS,
  LEARNING_METHODS,
  serviceCategories as SERVICECATEGORIES,
  whyUs as WHYUS,
  processSteps as PROCESSSTEPS,
  companyAddress as COMPANYADDRESS,
} from '../data/Home.data'

// ==================== HERO IMAGES ====================
import heroImg1 from '../assets/MaPrims/MaPrims-1.jpeg'
import heroImg2 from '../assets/MaPrims/MaPrims-2.jpeg'
import heroImg3 from '../assets/MaPrims/MaPrims-3.jpeg'
import heroImg4 from '../assets/MaPrims/MaPrims-4.jpeg'
import heroImg5 from '../assets/MaPrims/MaPrims-5.jpeg'
import heroImg6 from '../assets/MaPrims/MaPrims-6.jpeg'
import heroImg7 from '../assets/MaPrims/MaPrims-7.jpeg'
import heroImg8 from '../assets/MaPrims/MaPrims-8.jpeg'
import heroImg9 from '../assets/MaPrims/MaPrims-9.jpeg'
import heroImg10 from '../assets/MaPrims/MaPrims-10.jpeg'

const HERO_IMAGES = [
  heroImg1, heroImg2, heroImg3, heroImg4, heroImg5,
  heroImg6, heroImg7, heroImg8, heroImg9, heroImg10,
]

// ==================== CONSTANT DATA ====================
const SERVICE_STATS = [
  { label: 'Projects Delivered', value: '100+', icon: BriefcaseIcon, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { label: 'Client Satisfaction', value: '98%', icon: Heart, color: 'text-rose-400', bgColor: 'bg-rose-500/10' },
  { label: 'Support', value: '24/7', icon: Headphones, color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
]

const DOMAIN_STATS = [
  { label: 'Domains Registered', value: '500+', icon: Globe, color: 'text-primary-300', bgColor: 'bg-primary-500/10' },
  { label: 'TLDs Available', value: '50+', icon: Layers, color: 'text-primary-200', bgColor: 'bg-primary-500/10' },
  { label: 'Uptime Guarantee', value: '99.9%', icon: ShieldCheck, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { label: 'Free Transfers', value: 'Yes', icon: RefreshCw, color: 'text-primary-300', bgColor: 'bg-primary-500/10' },
]

const DOMAIN_EXTENSIONS = [
  { name: '.com', price: '₹899/yr', popular: true },
  { name: '.in', price: '₹499/yr', popular: true },
  { name: '.net', price: '₹999/yr', popular: false },
  { name: '.org', price: '₹1,099/yr', popular: false },
  { name: '.io', price: '₹2,999/yr', popular: true },
  { name: '.co', price: '₹1,499/yr', popular: false },
  { name: '.dev', price: '₹1,299/yr', popular: true },
  { name: '.tech', price: '₹1,999/yr', popular: false },
]

const DOMAIN_FEATURES = [
  { title: 'Free WHOIS Privacy', desc: 'Protect your personal information from public view.', icon: Lock },
  { title: 'Easy DNS Management', desc: 'Full control over your DNS records with our intuitive panel.', icon: Settings },
  { title: 'Instant Activation', desc: 'Your domain is ready to use within minutes.', icon: Zap },
  { title: '24/7 Support', desc: 'Expert help available round the clock.', icon: Headphones },
]

const HERO_HIGHLIGHTS = [
  { icon: Globe, title: 'Domain Registration', desc: 'Build your online identity' },
  { icon: Code, title: 'IT Solutions', desc: 'Technology for your business' },
  { icon: Cloud, title: 'Digital Services', desc: 'Modern digital experiences' },
  { icon: Headphones, title: 'Expert Support', desc: 'Assistance when you need it' },
]

// ==================== SKELETONS ====================
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-36 w-full" />
        <div className="p-4">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-1/2 mb-3" />
          <div className="h-2 bg-gray-200 rounded w-full mb-1" />
          <div className="h-2 bg-gray-200 rounded w-4/5 mb-3" />
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-8 bg-gray-200 rounded-lg w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

const TestimonialsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-5 shadow-lg animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-4 h-4 bg-gray-200 rounded-full" />)}
          </div>
          <div className="w-16 h-5 bg-gray-200 rounded" />
        </div>
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// ==================== HOME COMPONENT ====================
const Home = () => {
  // API data
  const [featuredCourses, setFeaturedCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [errorCourses, setErrorCourses] = useState(null)

  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [errorTestimonials, setErrorTestimonials] = useState(null)

  const [serviceTestimonials, setServiceTestimonials] = useState([])
  const [loadingServiceTestimonials, setLoadingServiceTestimonials] = useState(true)
  const [errorServiceTestimonials, setErrorServiceTestimonials] = useState(null)

  const [featuredServices, setFeaturedServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [errorServices, setErrorServices] = useState(null)

  // Domain search
  const [domainSearch, setDomainSearch] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Form state
  const formSectionRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', position: '', company: '', website: '',
    number_of_employees: '', service: '', project_type: 'new_project',
    budget: '', timeline: '', message: '',
    address_line: '', city: '', state: '', postal_code: '', country: '',
    preferred_contact_method: 'email', preferred_contact_time: 'any',
    heard_about: '', source: 'website', priority: 'medium',
  })
  const [attachment, setAttachment] = useState(null)
  const [attachmentName, setAttachmentName] = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Deferred below-the-fold rendering
  const [showContent, setShowContent] = useState(false)
  const sentinelRef = useRef(null)

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ---- Effects ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowContent(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isHovered])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)

  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase()
  }

  const handleDomainSearch = (e) => {
    e.preventDefault()
    if (!domainSearch) return
    setSearchResult(`Great news! ${domainSearch}.com is available for ₹899/yr.`)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { setFormError('File size must be less than 10MB'); return }
      const allowedExtensions = /\.(pdf|doc|docx)$/i
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      if (!allowedExtensions.test(file.name) || !allowedMimeTypes.includes(file.type)) {
        setFormError('Only PDF, DOC, and DOCX files are allowed'); return
      }
      setAttachment(file); setAttachmentName(file.name); setFormError('')
    }
  }

  const removeAttachment = () => { setAttachment(null); setAttachmentName('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.service) {
      setFormError('Please fill in all required fields (Name, Email, Service)'); return
    }
    if (!formData.address_line || !formData.city || !formData.state || !formData.country) {
      setFormError('Please fill in your complete address (Street, City, State, Country)'); return
    }
    setFormError(''); setIsSubmitting(true)

    const formDataToSend = new FormData()
    Object.keys(formData).forEach(key => {
      const value = formData[key]
      if (value !== undefined && value !== null && value !== '') formDataToSend.append(key, value)
    })
    if (attachment) formDataToSend.append('file', attachment)

    try {
      await proposalAPI.submitProposalRequest(formDataToSend)
      setFormSubmitted(true)
      setTimeout(() => {
        setFormSubmitted(false)
        setFormData({
          name: '', email: '', phone: '', position: '', company: '', website: '',
          number_of_employees: '', service: '', project_type: 'new_project',
          budget: '', timeline: '', message: '',
          address_line: '', city: '', state: '', postal_code: '', country: '',
          preferred_contact_method: 'email', preferred_contact_time: 'any',
          heard_about: '', source: 'website', priority: 'medium',
        })
        setAttachment(null); setAttachmentName('')
      }, 3000)
    } catch (error) {
      console.error(error)
      setFormError(error.response?.data?.message || 'Submission failed. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const [coursesRes, testimonialsRes, serviceTestimonialsRes, servicesRes] = await Promise.all([
          coursesAPI.getAll({ page: 1, limit: 8, filters: { status: 'published' }, sortBy: 'view_count', sortOrder: 'DESC' }),
          testimonialAPI.getFeatured(6, 'course'),
          testimonialAPI.getFeatured(6, 'service'),
          servicesAPI.getFeatured(),
        ])
        if (cancelled) return

        let courses = []
        const data = coursesRes.data?.data || coursesRes.data
        if (Array.isArray(data)) courses = data
        else if (data?.courses) courses = data.courses
        const published = courses.filter(c => c && c.status === 'published' && c.course_id)
        setFeaturedCourses(published.slice(0, 8)); setLoadingCourses(false)

        const testimonialsData = testimonialsRes.data?.data || testimonialsRes.data || []
        if (Array.isArray(testimonialsData)) setTestimonials(testimonialsData)
        setLoadingTestimonials(false)

        const serviceData = serviceTestimonialsRes.data?.data || serviceTestimonialsRes.data || []
        if (Array.isArray(serviceData)) setServiceTestimonials(serviceData)
        setLoadingServiceTestimonials(false)

        const servicesData = servicesRes.data?.data || servicesRes.data || []
        if (Array.isArray(servicesData)) setFeaturedServices(servicesData.slice(0, 8))
        setLoadingServices(false)
      } catch (err) {
        if (!cancelled) {
          setErrorCourses('Failed to load data'); console.error(err)
          setLoadingCourses(false); setLoadingTestimonials(false)
          setLoadingServiceTestimonials(false); setLoadingServices(false)
        }
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">

      {/* ============================================================
    MAPRIMS RESPONSIVE SPLIT HERO (TIGHT SPACING)
    Desktop: Left content | Right image slider
    Mobile:  Content top | Image slider bottom
============================================================ */}

<section
  className="relative isolate w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/60"
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  <div className="
    max-w-[1600px] mx-auto
    grid grid-cols-1 lg:grid-cols-2
    items-center
    gap-4 sm:gap-6 lg:gap-8 xl:gap-10
    px-4 sm:px-8 lg:px-12 xl:px-16
    py-3 sm:py-4 lg:py-5 xl:py-7
  ">

    {/* ========== LEFT CONTENT ========== */}
    <div className="
      relative z-10
      w-full min-w-0
      flex flex-col justify-center
      text-center lg:text-left
      items-center lg:items-start
    ">
      {/* Badge */}
      <div className="
        inline-flex items-center gap-2
        px-3 py-1 mb-2 sm:mb-3
        rounded-full
        bg-primary-50 border border-primary-100
        text-primary-600
        text-[11px] sm:text-xs font-bold
      ">
        <Sparkles size={13} />
        Your Digital Growth Partner
      </div>

      {/* Heading */}
      <h1 className="
        text-2xl sm:text-3xl md:text-4xl xl:text-5xl
        font-black leading-[1.1] tracking-tight
        text-primary-900 max-w-2xl
      ">
        Build Your Digital Future with
        <span className="block text-primary-600">MaPrims</span>
      </h1>

      {/* Description */}
      <p className="
        mt-2 sm:mt-3
        text-xs sm:text-sm lg:text-base
        leading-relaxed text-gray-600 max-w-xl
      ">
        Empower your business with innovative digital solutions,
        professional IT services, domain registration and
        technology-driven growth.
      </p>

      {/* Highlights */}
      <div className="
        grid grid-cols-2 sm:grid-cols-2
        gap-2 sm:gap-3
        mt-3 sm:mt-4
        w-full max-w-xl text-left
      ">
        {HERO_HIGHLIGHTS.map((item, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-2.5">
            <div className="shrink-0 p-2 rounded-lg bg-primary-100 text-primary-600">
              <item.icon size={18} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-primary-900">{item.title}</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Primary CTAs */}
      <div className="
        flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3
        mt-3 sm:mt-4
        w-full sm:w-auto
      ">
        <Link
          to="/services"
          className="
            inline-flex items-center justify-center gap-2
            px-5 py-2.5 sm:py-3 rounded-lg
            bg-gradient-to-r from-primary-600 to-primary-500
            text-white font-bold text-xs sm:text-sm
            shadow-lg shadow-primary-900/15
            hover:-translate-y-0.5 hover:shadow-xl
            transition-all duration-300
          "
        >
          <Sparkles size={15} />
          Explore Services
          <ChevronRight size={15} />
        </Link>

        <Link
          to="/domains"
          className="
            inline-flex items-center justify-center gap-2
            px-5 py-2.5 sm:py-3 rounded-lg
            bg-white border border-primary-200
            text-primary-900 font-bold text-xs sm:text-sm
            shadow-sm hover:bg-primary-50
            transition-all duration-300
          "
        >
          <Globe size={15} />
          Register Domain
        </Link>
      </div>

      {/* Secondary CTAs */}
      <div className="
        flex flex-wrap items-center justify-center lg:justify-start
        gap-3 sm:gap-4 mt-2.5 sm:mt-3
      ">
        <button
          type="button"
          onClick={scrollToForm}
          className="
            inline-flex items-center gap-1.5
            text-xs sm:text-sm font-semibold text-primary-600
            hover:text-primary-900 transition-colors
          "
        >
          <Send size={13} />
          Request a Proposal
        </button>

        <Link
          to="/contact"
          className="
            inline-flex items-center gap-1.5
            text-xs sm:text-sm font-semibold text-gray-600
            hover:text-primary-600 transition-colors
          "
        >
          <Phone size={13} />
          Talk to an Expert
        </Link>
      </div>
    </div>

    {/* ========== RIGHT IMAGE SLIDER ========== */}
    <div className="
      relative w-full min-w-0
      h-[240px] sm:h-[340px]
      md:h-[400px] lg:h-[460px]
      xl:h-[520px]
      rounded-2xl sm:rounded-3xl
      overflow-hidden
      bg-primary-900
      shadow-2xl shadow-primary-950/20
      border border-white
    ">
      {HERO_IMAGES.map((img, index) => (
        <div
          key={img}
          className={`
            absolute inset-0
            transition-opacity duration-1000 ease-in-out
            ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          aria-hidden="true"
        >
          <img
            src={img} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
          />
          <img
            src={img} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false}
            className="absolute inset-0 w-full h-full object-contain object-center select-none pointer-events-none"
          />
        </div>
      ))}

      <div className="
        absolute inset-0 z-[1]
        bg-gradient-to-t from-primary-900/40 via-transparent to-black/10
        pointer-events-none
      " />

      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous image"
        className="
          absolute z-20 left-2 sm:left-4 top-1/2 -translate-y-1/2
          p-2 sm:p-2.5 rounded-full
          bg-white/85 backdrop-blur-md text-primary-900
          shadow-lg hover:bg-white transition-all
        "
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next image"
        className="
          absolute z-20 right-2 sm:right-4 top-1/2 -translate-y-1/2
          p-2 sm:p-2.5 rounded-full
          bg-white/85 backdrop-blur-md text-primary-900
          shadow-lg hover:bg-white transition-all
        "
      >
        <ChevronRight size={20} />
      </button>

      <div className="
        absolute z-20 top-3 right-3
        px-2.5 py-1 rounded-full
        bg-black/35 backdrop-blur-md
        text-white text-[10px] sm:text-xs font-semibold
      ">
        {String(currentSlide + 1).padStart(2, '0')} / {HERO_IMAGES.length}
      </div>

      <div className="
        absolute z-20 bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2
        flex items-center gap-1.5 sm:gap-2
        px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full
        bg-black/25 backdrop-blur-md
      ">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to image ${index + 1}`}
            aria-current={currentSlide === index ? 'true' : undefined}
            className={`
              h-1.5 sm:h-2 rounded-full transition-all duration-300
              ${currentSlide === index ? 'w-5 sm:w-6 bg-white' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white'}
            `}
          />
        ))}
      </div>
    </div>
  </div>
</section>

      {/* Sentinel for deferred rendering */}
      <div ref={sentinelRef} className="h-1" />

      {showContent && (
        <>
          {/* ============ DOMAIN REGISTRATION ============ */}
          <section className="py-10 sm:py-16 bg-white relative">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-3 sm:mb-4 border border-primary-200">
                    <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Domain Registration
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3 sm:mb-4">
                    Secure Your Digital Identity
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-lg leading-relaxed">
                    Find the perfect domain name for your business or project. We offer competitive pricing,
                    free WHOIS privacy, and easy DNS management for all major TLDs.
                  </p>

                  <form onSubmit={handleDomainSearch} className="mb-4 sm:mb-6 max-w-lg">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-grow">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search for your dream domain..."
                          value={domainSearch}
                          onChange={(e) => setDomainSearch(e.target.value)}
                          className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-xs sm:text-sm border-2 border-gray-200 rounded-md sm:rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-600/20 outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-md sm:rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        Search Domain
                      </button>
                    </div>
                    {searchResult && (
                      <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-green-600 bg-green-50 p-2 sm:p-3 rounded-md sm:rounded-lg border border-green-200 flex items-center gap-1.5 sm:gap-2">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {searchResult}
                      </p>
                    )}
                  </form>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                    {DOMAIN_EXTENSIONS.slice(0, 4).map((tld) => (
                      <div key={tld.name} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-md sm:rounded-lg border border-gray-200">
                        <span className="font-bold text-xs sm:text-sm text-gray-800">{tld.name}</span>
                        <span className="text-[10px] sm:text-xs text-gray-500">{tld.price}</span>
                        {tld.popular && <span className="text-[8px] sm:text-[10px] font-bold text-accent-700 bg-accent-100 px-1 sm:px-1.5 py-0.5 rounded">Popular</span>}
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/domains"
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-primary-600 rounded-md sm:rounded-xl hover:bg-primary-700 transition-colors shadow-lg"
                  >
                    Register Your Domain Now
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {DOMAIN_FEATURES.map((feature, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-primary-100 flex items-center justify-center mb-2 sm:mb-3">
                        <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5 sm:mb-1">{feature.title}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-gradient-to-r from-primary-900 to-primary-600 rounded-lg sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
                {DOMAIN_STATS.map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-sm sm:text-xl font-black">{stat.value}</div>
                      <div className="text-[8px] sm:text-[10px] text-primary-200 uppercase tracking-wide">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ CORE EXPERTISE ============ */}
          <section className="py-8 sm:py-10 bg-gradient-to-br from-slate-50 via-primary-50/50 to-indigo-50/30">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-semibold mb-1.5 sm:mb-2 border border-primary-200">
                  <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Our Core Expertise
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-gray-900 mb-1">
                  Comprehensive Technology Solutions
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
                  From web apps to enterprise software, we build scalable digital products.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4">
                {COURSES_BY_CATEGORY.map(cat => (
                  <div key={cat.id} className="group bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className={`inline-flex p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r ${cat.color}`}>
                        <cat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Timeline</div>
                        <div className="text-[10px] sm:text-xs font-bold text-gray-800">{cat.duration}</div>
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 mb-1.5 sm:mb-2">{cat.category}</h3>
                    <ul className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3">
                      {cat.courses.slice(0, 3).map((course, idx) => (
                        <li key={idx} className="flex items-start gap-1 sm:gap-1.5">
                          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[10px] sm:text-xs text-gray-600">{course}</span>
                        </li>
                      ))}
                      {cat.courses.length > 3 && (
                        <li className="text-[9px] sm:text-[10px] text-gray-500 pl-4 sm:pl-5">+{cat.courses.length - 3} more</li>
                      )}
                    </ul>
                    <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-center">
                          <div className="text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Projects</div>
                          <div className="text-[10px] sm:text-xs font-bold text-gray-800">{cat.projects}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[8px] sm:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Quality</div>
                          <div className="text-[10px] sm:text-xs font-bold text-green-600">{cat.certification}</div>
                        </div>
                      </div>
                      <Link to="/services" className="text-[10px] sm:text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors">
                        Learn More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ WHY CHOOSE US ============ */}
          <section className="py-8 sm:py-10 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-semibold mb-1.5 sm:mb-2 border border-primary-200">
                  <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Why Choose MaPrims
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-gray-900 mb-1">
                  Your Technology Partner
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
                  We deliver measurable results with transparency and expertise
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {FEATURES.map(feature => (
                  <div key={feature.id} className="group bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-gradient-to-r ${feature.color} rounded-md sm:rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-black text-gray-900 mb-0.5">{feature.name}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100">
                      <ul className="flex flex-wrap gap-1 sm:gap-1.5">
                        {feature.points.map((point, idx) => (
                          <li key={idx} className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] text-gray-500 bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                            <div className="w-1 h-1 bg-accent-400 rounded-full" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ SERVICES OVERVIEW ============ */}
          <section className="py-12 sm:py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
                  <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  What We Offer
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
                  Comprehensive Technology Solutions
                </h2>
                <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
                  From custom development to enterprise software, we provide end‑to‑end services for your business growth
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {SERVICECATEGORIES.map((service) => (
                  <div key={service.id} className="group bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg hover:border-accent-300 transition-all duration-300 hover:-translate-y-1">
                    <div className={`inline-flex p-2 sm:p-3 rounded-md sm:rounded-lg bg-gradient-to-r ${service.color} mb-3 sm:mb-4`}>
                      <service.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1.5 sm:mb-2">{service.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">{service.description}</p>
                    <ul className="space-y-0.5 sm:space-y-1 mb-3 sm:mb-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                      <span className="text-xs sm:text-sm font-bold text-accent-600">{service.price}</span>
                      <Link to="/services" className="text-[10px] sm:text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1">
                        Learn more <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6 sm:mt-8">
                <Link to="/services" className="group inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-accent-600 bg-white border-2 border-accent-200 rounded-lg sm:rounded-xl hover:border-accent-300 hover:bg-accent-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                  View All Services
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* ============ FEATURED SERVICES (API) ============ */}
          <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
                  <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Featured Services
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
                  Professional Services
                </h2>
                <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
                  Explore our expert services designed to accelerate your business growth
                </p>
              </div>
              {loadingServices ? (
                <LoadingSkeleton />
              ) : errorServices ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-red-600">{errorServices}</p>
                  <button onClick={() => window.location.reload()} className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                    Try Again
                  </button>
                </div>
              ) : featuredServices.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">No services available at the moment. Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                  {featuredServices.map(service => (
                    <ServiceCard key={service.service_id || service.id} service={service} viewMode="grid" />
                  ))}
                </div>
              )}
              <div className="text-center mt-6 sm:mt-8">
                <Link to="/services" className="group inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-accent-600 bg-white border-2 border-accent-200 rounded-lg sm:rounded-xl hover:border-accent-300 hover:bg-accent-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                  View All Services
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* ============ WHY TRUST US ============ */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
                  <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Why MaPrims
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
                  The Partner You Can Trust
                </h2>
                <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
                  We deliver measurable results with transparency and expertise
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {WHYUS.map((item) => (
                  <div key={item.id} className="group bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-gray-900 mb-0.5 sm:mb-1">{item.title}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ CAREER / DIGITAL TRANSFORMATION ============ */}
          <section className="py-8 sm:py-10 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-display mb-1">
                  Complete Digital Transformation
                </h2>
                <p className="text-xs sm:text-sm text-primary-200 max-w-3xl mx-auto">
                  From concept to deployment – we cover every aspect of your digital journey
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {CAREER_POINTS.map(point => (
                  <div key={point.id} className="group bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 hover:border-primary-400/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 bg-white/10 rounded-md sm:rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <point.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${point.color}`} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black">{point.title}</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-primary-100 leading-relaxed mb-2 sm:mb-3">{point.description}</p>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {point.stats.map((stat, idx) => (
                        <span key={idx} className="px-1.5 sm:px-2 py-0.5 bg-white/10 rounded-full text-[8px] sm:text-[10px] font-medium">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ PROCESS ============ */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
                  <GitBranch className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  How We Work
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
                  Simple & Transparent Process
                </h2>
                <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
                  From discovery to delivery, we keep you involved every step of the way
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {PROCESSSTEPS.map((step) => (
                  <div key={step.step} className="relative bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute -top-2.5 sm:-top-3 -left-2.5 sm:-left-3 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md">
                      {step.step}
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                      <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-gray-900 mb-0.5 sm:mb-1">{step.title}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6 sm:mt-8">
                <Link to="/contact" className="inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg sm:rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                  Start Your Project
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                </Link>
              </div>
            </div>
          </section>

          {/* ============ APPROACH ============ */}
          <section className="py-8 sm:py-10 bg-gradient-to-br from-slate-50 via-primary-50/50 to-indigo-50/30">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-semibold mb-1.5 sm:mb-2 border border-primary-200">
                  <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Our Approach
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-gray-900 mb-1">
                  How We Deliver
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
                  Our proven methodology ensures maximum quality and practical application
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {LEARNING_METHODS.map(method => (
                  <div key={method.id} className="group bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br ${method.color} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                        <method.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${method.color}`} />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-gray-900">{method.title}</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed mt-1.5 sm:mt-2">{method.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ============ COURSE TESTIMONIALS ============ */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Client Success
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
                  Stories That Inspire
                </h2>
                <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
                  Join the businesses and professionals who trust MaPrims for their digital needs
                </p>
              </div>
              {loadingTestimonials ? (
                <TestimonialsSkeleton />
              ) : errorTestimonials ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-xs sm:text-sm text-red-600">{errorTestimonials}</p>
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-xs sm:text-sm text-gray-600">No testimonials available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {testimonials.map((testimonial, index) => {
                    const {
                      testimonial_id, name = 'Anonymous', role = '', company = '', content = '', rating = 5,
                      avatar = null, technology = '', before_salary = '', after_salary = '', duration = '', linkedin_url = '',
                    } = testimonial
                    const initials = avatar || getInitials(name)
                    const before = before_salary || testimonial.before || ''
                    const after = after_salary || testimonial.after || ''
                    const linkedin = linkedin_url || testimonial.linkedin || ''
                    return (
                      <div key={testimonial_id || index} className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: rating }).map((_, idx) => (
                              <Star key={idx} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          {technology && <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded">{technology}</span>}
                        </div>
                        <p className="text-gray-600 mb-3 sm:mb-4 italic text-xs sm:text-sm">"{content}"</p>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-black text-gray-900 text-xs sm:text-sm">{name}</h4>
                                <p className="text-[10px] sm:text-sm text-gray-600">{role}</p>
                                {company && <p className="text-[9px] sm:text-xs text-gray-500">{company}</p>}
                              </div>
                              {linkedin && (
                                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors duration-300 transform hover:scale-110" title="View LinkedIn Profile">
                                  <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                                </a>
                              )}
                            </div>
                            {(before || after || duration) && (
                              <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100">
                                {before && (
                                  <div className="text-center">
                                    <div className="text-[9px] sm:text-xs text-gray-500">Before</div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-gray-700">{before}</div>
                                  </div>
                                )}
                                {after && (
                                  <div className="text-center">
                                    <div className="text-[9px] sm:text-xs text-gray-500">After</div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-green-600">{after}</div>
                                  </div>
                                )}
                                {duration && (
                                  <div className="text-center">
                                    <div className="text-[9px] sm:text-xs text-gray-500">Duration</div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-gray-700">{duration}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">
                <p className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  All testimonials are verified with LinkedIn profiles. Click the LinkedIn icon to view their profiles.
                </p>
              </div>
            </div>
          </section>

          {/* ============ SERVICE TESTIMONIALS ============ */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Client Success
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
                  What Our Clients Say
                </h2>
                <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
                  Trusted by businesses and professionals across industries.
                </p>
              </div>
              {loadingServiceTestimonials ? (
                <TestimonialsSkeleton />
              ) : errorServiceTestimonials ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-red-600">{errorServiceTestimonials}</p>
                  <button onClick={() => window.location.reload()} className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                    Try Again
                  </button>
                </div>
              ) : serviceTestimonials.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-xs sm:text-sm text-gray-600">No service testimonials available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {serviceTestimonials.map((testimonial, index) => {
                    const {
                      testimonial_id, name = 'Anonymous', role = '', company = '', content = '', rating = 5,
                      avatar = null, technology = '', before_salary = '', after_salary = '', duration = '', linkedin_url = '',
                    } = testimonial
                    const initials = avatar || getInitials(name)
                    const before = before_salary || testimonial.before || ''
                    const after = after_salary || testimonial.after || ''
                    const linkedin = linkedin_url || testimonial.linkedin || ''
                    return (
                      <div key={testimonial_id || index} className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: rating }).map((_, idx) => (
                              <Star key={idx} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          {technology && <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded">{technology}</span>}
                        </div>
                        <p className="text-gray-600 mb-3 sm:mb-4 italic text-xs sm:text-sm">"{content}"</p>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-black text-gray-900 text-xs sm:text-sm">{name}</h4>
                                <p className="text-[10px] sm:text-sm text-gray-600">{role}</p>
                                {company && <p className="text-[9px] sm:text-xs text-gray-500">{company}</p>}
                              </div>
                              {linkedin && (
                                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-600 transition-colors duration-300 transform hover:scale-110" title="View LinkedIn Profile">
                                  <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                                </a>
                              )}
                            </div>
                            {(before || after || duration) && (
                              <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-100">
                                {before && (
                                  <div className="text-center">
                                    <div className="text-[9px] sm:text-xs text-gray-500">Before</div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-gray-700">{before}</div>
                                  </div>
                                )}
                                {after && (
                                  <div className="text-center">
                                    <div className="text-[9px] sm:text-xs text-gray-500">After</div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-green-600">{after}</div>
                                  </div>
                                )}
                                {duration && (
                                  <div className="text-center">
                                    <div className="text-[9px] sm:text-xs text-gray-500">Duration</div>
                                    <div className="text-[10px] sm:text-sm font-semibold text-gray-700">{duration}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500">
                <p className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  All testimonials are verified with LinkedIn profiles. Click the LinkedIn icon to view their profiles.
                </p>
              </div>
            </div>
          </section>

          {/* ============ PROPOSAL FORM ============ */}
          <section ref={formSectionRef} className="py-12 sm:py-16 bg-gradient-to-br from-primary-800 via-primary-600 to-primary-500">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-6 sm:gap-8 items-start">
                <div className="text-white">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-white/20 mb-3 sm:mb-4">
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <span className="text-[10px] sm:text-xs font-semibold">Get a Free Quote</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 sm:mb-4">Ready to Work Together?</h2>
                  <p className="text-sm sm:text-base text-primary-100 mb-4 sm:mb-6 leading-relaxed">
                    Tell us about your project or requirements. We'll get back
                    to you within 24 hours with a customized proposal and pricing.
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { icon: Clock, text: 'Response within 24 hours' },
                      { icon: ShieldCheck, text: '100% confidentiality' },
                      { icon: CheckCircle, text: 'No obligation, free consultation' },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 rounded-md sm:rounded-lg flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 mb-2 sm:mb-3">Request a Proposal</h3>
                  {formSubmitted ? (
                    <div className="text-center py-4 sm:py-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1">Proposal Request Sent!</h4>
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Thank you for reaching out. Our team will contact you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                      {/* Personal */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Full Name <span className="text-red-500">*</span></label>
                          <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Email Address <span className="text-red-500">*</span></label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Phone Number</label>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" />
                        </div>
                      </div>

                      {/* Company */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Company</label>
                          <input type="text" name="company" value={formData.company} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Position</label>
                          <input type="text" name="position" value={formData.position} onChange={handleInputChange} placeholder="e.g., CEO" className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Website</label>
                          <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://" className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" />
                        </div>
                      </div>

                      {/* Service / Project / Employees */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Service <span className="text-red-500">*</span></label>
                          <select name="service" value={formData.service} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" required>
                            <option value="">Select</option>
                            <option value="Web Development">Web Development</option>
                            <option value="Mobile Development">Mobile Development</option>
                            <option value="Cloud & DevOps">Cloud & DevOps</option>
                            <option value="AI & Automation">AI & Automation</option>
                            <option value="UI/UX Design">UI/UX Design</option>
                            <option value="Enterprise Software">Enterprise Software</option>
                            <option value="Domain Registration">Domain Registration</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Project Type</label>
                          <select name="project_type" value={formData.project_type} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none">
                            <option value="new_project">New Project</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="consulting">Consulting</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Employees</label>
                          <select name="number_of_employees" value={formData.number_of_employees} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none">
                            <option value="">Select</option>
                            <option value="1-10">1-10</option>
                            <option value="11-50">11-50</option>
                            <option value="51-200">51-200</option>
                            <option value="201-500">201-500</option>
                            <option value="500+">500+</option>
                          </select>
                        </div>
                      </div>

                      {/* Budget / Timeline / Message */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Budget (₹)</label>
                          <select name="budget" value={formData.budget} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none">
                            <option value="">Select</option>
                            <option value="< 5 Lakh">&lt; ₹5 Lakh</option>
                            <option value="5-10 Lakh">₹5L – ₹10L</option>
                            <option value="10-25 Lakh">₹10L – ₹25L</option>
                            <option value="25-50 Lakh">₹25L – ₹50L</option>
                            <option value="> 50 Lakh">&gt; ₹50L</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Timeline</label>
                          <select name="timeline" value={formData.timeline} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none">
                            <option value="">Select</option>
                            <option value="ASAP">ASAP</option>
                            <option value="1-3 months">1-3 months</option>
                            <option value="3-6 months">3-6 months</option>
                            <option value="6+ months">6+ months</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Message</label>
                          <textarea name="message" rows="1" value={formData.message} onChange={handleInputChange} placeholder="Brief description..." className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Street <span className="text-red-500">*</span></label>
                          <input type="text" name="address_line" value={formData.address_line} onChange={handleInputChange} placeholder="Street" className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">City <span className="text-red-500">*</span></label>
                          <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">State <span className="text-red-500">*</span></label>
                          <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Postal</label>
                          <input type="text" name="postal_code" value={formData.postal_code} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Country <span className="text-red-500">*</span></label>
                          <input type="text" name="country" value={formData.country} onChange={handleInputChange} placeholder="India" className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none" required />
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2">
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Contact Method</label>
                          <select name="preferred_contact_method" value={formData.preferred_contact_method} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none">
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="any">Any</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Contact Time</label>
                          <select name="preferred_contact_time" value={formData.preferred_contact_time} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none">
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                            <option value="any">Any</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">How heard?</label>
                          <select name="heard_about" value={formData.heard_about} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-600 outline-none">
                            <option value="">Select</option>
                            <option value="Google">Google</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Friend/Colleague">Friend/Colleague</option>
                            <option value="Email">Email</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Attachment */}
                      <div>
                        <label className="block text-[9px] sm:text-[10px] font-semibold text-gray-700 mb-0.5">Attach Requirements (optional)</label>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <label className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors">
                            <Paperclip className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600" />
                            <span className="text-[9px] sm:text-[10px] text-gray-700">Choose file</span>
                            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="hidden" />
                          </label>
                          {attachmentName && (
                            <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px]">
                              <FileText className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-gray-600" />
                              <span className="truncate max-w-[100px] sm:max-w-[120px]">{attachmentName}</span>
                              <button type="button" onClick={removeAttachment} className="text-gray-500 hover:text-red-500">
                                <X className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">Allowed: PDF, DOC, DOCX (Max 10MB)</p>
                      </div>

                      {formError && <p className="text-red-600 text-[9px] sm:text-[10px]">{formError}</p>}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-1.5 text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r from-primary-800 to-primary-600 rounded-md sm:rounded-lg hover:from-primary-900 hover:to-primary-700 transition-all duration-300 shadow-md disabled:opacity-50"
                      >
                        <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                      <p className="text-[8px] sm:text-[9px] text-gray-500 text-center">We respect your privacy.</p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ============ FINAL CTA ============ */}
          <section className="py-8 sm:py-10 bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl sm:blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/20 rounded-full blur-2xl sm:blur-3xl animate-pulse animation-delay-2000" />
            </div>
            <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-white/20 mb-2 sm:mb-3">
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                <span className="text-[10px] sm:text-xs font-semibold text-white">Ready to Start?</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1.5 sm:mb-2">
                Let's Build Something Amazing Together
              </h2>
              <p className="text-xs sm:text-sm text-primary-100 mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed">
                Join 100+ businesses who trust MaPrims for their digital transformation. Start your project today and see the difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 justify-center mb-4 sm:mb-5">
                <Link to="/domains" className="group relative inline-flex items-center justify-center px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-primary-700 bg-white rounded-md sm:rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 border-2 border-transparent hover:border-white/50 overflow-hidden">
                  <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 group-hover:scale-110 transition-transform" />
                  Register a Domain
                </Link>
                <Link to="/contact" className="group inline-flex items-center justify-center px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-black/20 rounded-md sm:rounded-lg hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 backdrop-blur-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 group-hover:scale-110 transition-transform" />
                  Book a Free Consultation
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-primary-100 text-[10px] sm:text-xs">
                {[
                  { icon: ShieldCheck, text: 'Quality Assured' },
                  { icon: Users, text: '100+ Projects Delivered' },
                  { icon: TrendingUp, text: '98% Client Satisfaction' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center justify-center gap-1 sm:gap-1.5">
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                    <span className="font-semibold">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <WhatsAppFloatingIcon />
    </div>
  )
}

export default Home
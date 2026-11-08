// src/pages/Home.jsx
import React, { useState, useEffect, lazy, Suspense, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Clock, Users, TrendingUp, Shield, BookOpen, Sparkles,
  Target, Rocket, Heart, Brain, Cloud, Code, Cpu, Network, Briefcase, Phone,
  ChevronRight, Calendar, Video, FileText, MessageSquare, Star, CheckCircle,
  Award, Database, Server, Terminal, AlertCircle, ShieldCheck, Trophy,
  ChartLine, BookMarked, Users as UsersIcon, TrendingUp as TrendingUpIcon,
  Briefcase as BriefcaseIcon, Cloud as CloudRain, Code as CodeXml, ChartBar,
  Linkedin, MapPin, Mail, Building, GitBranch, Zap, Layers, Globe,
  Paperclip, X, Headphones, Send,
  UserCheck, Wrench, School, LifeBuoy, Ticket, ShieldHalf, Settings, KeySquare,
  CreditCard, FolderOpen, BarChart3,
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

const SERVICE_STATS = [
  { label: 'Projects Delivered', value: '100+', icon: BriefcaseIcon, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { label: 'Client Satisfaction', value: '98%', icon: Heart, color: 'text-rose-400', bgColor: 'bg-rose-500/10' },
  { label: 'Support', value: '24/7', icon: Headphones, color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
]

const TECH_IMAGES = [
  'https://images.unsplash.com/photo-1581092921461-39b9d66b1c62?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1531482615717-5c6e3b1b8f0f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=600&h=400&fit=crop',
]

const MODULE_ITEMS = [
  { icon: GraduationCap, label: 'HRMS', color: 'from-pink-500 to-rose-600' },
  { icon: Wrench, label: 'Equipment', color: 'from-amber-500 to-orange-600' },
  { icon: School, label: 'Institute', color: 'from-blue-500 to-indigo-600' },
  { icon: MessageSquare, label: 'Communication', color: 'from-teal-500 to-cyan-600' },
  { icon: FileText, label: 'Blogs', color: 'from-violet-500 to-purple-600' },
  { icon: LifeBuoy, label: 'Help & Support', color: 'from-green-500 to-emerald-600' },
  { icon: Ticket, label: 'Ticketing', color: 'from-red-500 to-rose-600' },
  { icon: ShieldHalf, label: 'Security & RBAC', color: 'from-slate-500 to-gray-600' },
  { icon: BookOpen, label: 'Courses', color: 'from-blue-500 to-cyan-600' },
  { icon: TrendingUp, label: 'Progress', color: 'from-emerald-500 to-teal-600' },
  { icon: Award, label: 'Certificates', color: 'from-yellow-500 to-amber-600' },
  { icon: CreditCard, label: 'Payments', color: 'from-indigo-500 to-purple-600' },
  { icon: Users, label: 'Users', color: 'from-gray-500 to-slate-600' },
  { icon: Briefcase, label: 'Services', color: 'from-orange-500 to-red-600' },
  { icon: FileText, label: 'Proposals', color: 'from-cyan-500 to-blue-600' },
  { icon: BarChart3, label: 'Analytics', color: 'from-fuchsia-500 to-pink-600' },
  { icon: FolderOpen, label: 'File Explorer', color: 'from-lime-500 to-green-600' },
  { icon: Settings, label: 'System Settings', color: 'from-purple-500 to-indigo-600' },
  { icon: Mail, label: 'Mail', color: 'from-rose-500 to-red-600' },
  { icon: Star, label: 'Testimonials', color: 'from-teal-500 to-emerald-600' },
];

const initialPositions = MODULE_ITEMS.map((_, i) => {
  const angle = (i / MODULE_ITEMS.length) * 2 * Math.PI;
  const radius = 40;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
});

const DraggableModule = ({ icon: Icon, label, color, initialX, initialY }) => {
  const moduleRef = useRef(null);
  const posRef = useRef({ x: initialX, y: initialY });
  const velocityRef = useRef({
    x: (Math.random() - 0.5) * 20,
    y: (Math.random() - 0.5) * 20,
  });
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  const applyPosition = () => {
    const el = moduleRef.current;
    if (!el) return;
    el.style.left = `${posRef.current.x}%`;
    el.style.top = `${posRef.current.y}%`;
    el.style.transform = 'translate(-50%, -50%)';
  };

  const animate = (time) => {
    if (isDraggingRef.current) return;

    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
    }
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const container = moduleRef.current?.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const widthPx = rect.width;
    const heightPx = rect.height;

    posRef.current.x += velocityRef.current.x * dt;
    posRef.current.y += velocityRef.current.y * dt;

    if (posRef.current.x <= 0 || posRef.current.x >= 100) {
      velocityRef.current.x *= -1;
      posRef.current.x = Math.max(0, Math.min(100, posRef.current.x));
    }
    if (posRef.current.y <= 0 || posRef.current.y >= 100) {
      velocityRef.current.y *= -1;
      posRef.current.y = Math.max(0, Math.min(100, posRef.current.y));
    }

    applyPosition();
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    applyPosition();
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const onPointerDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const container = moduleRef.current.parentElement.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = posRef.current.x;
    const origY = posRef.current.y;

    const onPointerMove = (moveEvent) => {
      const dx = ((moveEvent.clientX - startX) / container.width) * 100;
      const dy = ((moveEvent.clientY - startY) / container.height) * 100;
      posRef.current.x = Math.max(0, Math.min(100, origX + dx));
      posRef.current.y = Math.max(0, Math.min(100, origY + dy));
      applyPosition();
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      velocityRef.current = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
      };
      lastTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      ref={moduleRef}
      onPointerDown={onPointerDown}
      className="absolute cursor-grab active:cursor-grabbing group flex flex-col items-center justify-center text-center p-1.5 rounded-md transition-transform duration-100 hover:scale-105"
      style={{
        left: `${posRef.current.x}%`,
        top: `${posRef.current.y}%`,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
        willChange: 'left, top',
        zIndex: 10,
      }}
    >
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-gradient-to-br ${color} flex items-center justify-center mb-1 group-hover:scale-110 transition-transform`}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
      </div>
      <span className="text-[7px] sm:text-[8px] font-semibold text-white leading-tight pointer-events-none">
        {label}
      </span>
    </div>
  );
};

// Skeleton components (outside component)
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
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
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-5 shadow-lg animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => <div key={s} className="w-4 h-4 bg-gray-200 rounded-full" />)}
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

const Home = () => {
  // API states
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

  // Slider
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const brokenImagesRef = useRef(new Set())

  // Form related states (for Request a Proposal)
  const formSectionRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    company: '',
    website: '',
    number_of_employees: '',
    service: '',
    project_type: 'new_project',
    budget: '',
    timeline: '',
    message: '',
    address_line: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    preferred_contact_method: 'email',
    preferred_contact_time: 'any',
    heard_about: '',
    source: 'website',
    priority: 'medium',
  })
  const [attachment, setAttachment] = useState(null)
  const [attachmentName, setAttachmentName] = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Deferred rendering
  const [showContent, setShowContent] = useState(false)
  const sentinelRef = useRef(null)

  // Scroll to form function
  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Intersection Observer for deferred content
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

  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.split(' ')
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase()
  }

  // Slider logic
  const goToNextImage = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentImageIndex(prev => {
        let next = (prev + 1) % TECH_IMAGES.length
        let attempts = 0
        while (brokenImagesRef.current.has(next) && attempts < TECH_IMAGES.length) {
          next = (next + 1) % TECH_IMAGES.length
          attempts++
        }
        return next
      })
      setIsTransitioning(false)
    }, 300)
  }

  useEffect(() => {
    const interval = setInterval(goToNextImage, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleImageError = (index) => {
    if (!brokenImagesRef.current.has(index)) {
      brokenImagesRef.current.add(index)
      if (index === currentImageIndex) goToNextImage()
    }
  }

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('File size must be less than 10MB')
        return
      }
      const allowedExtensions = /\.(pdf|doc|docx)$/i
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      if (!allowedExtensions.test(file.name) || !allowedMimeTypes.includes(file.type)) {
        setFormError('Only PDF, DOC, and DOCX files are allowed')
        return
      }
      setAttachment(file)
      setAttachmentName(file.name)
      setFormError('')
    }
  }

  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentName('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.service) {
      setFormError('Please fill in all required fields (Name, Email, Service)')
      return
    }
    if (!formData.address_line || !formData.city || !formData.state || !formData.country) {
      setFormError('Please fill in your complete address (Street, City, State, Country)')
      return
    }
    setFormError('')
    setIsSubmitting(true)

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
        setAttachment(null)
        setAttachmentName('')
      }, 3000)
    } catch (error) {
      console.error(error)
      setFormError(error.response?.data?.message || 'Submission failed. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Parallel API calls (unchanged)
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
        setFeaturedCourses(published.slice(0, 8))
        setLoadingCourses(false)

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
          setErrorCourses('Failed to load data')
          console.error(err)
          setLoadingCourses(false)
          setLoadingTestimonials(false)
          setLoadingServiceTestimonials(false)
          setLoadingServices(false)
        }
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const HERO_STATS = [...STATS.slice(0, 3), ...SERVICE_STATS]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* ===== Hero Section (unchanged, except Request a Proposal button now scrolls) ===== */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-10 w-56 h-56 bg-accent-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/3 -right-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-float animation-delay-2000" />
          <div className="absolute -bottom-24 left-1/4 w-64 h-64 bg-accent-500/30 rounded-full blur-3xl animate-float animation-delay-4000" />
        </div>
        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-md">
                <Rocket className="w-3.5 h-3.5 text-accent-300 animate-bounce" />
                <span className="text-xs font-semibold text-white">IT Training &amp; Services Hub</span>
                <div className="flex items-center gap-0.5 ml-1">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-2 h-2 text-yellow-400 fill-current" />)}
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display leading-tight bg-gradient-to-r from-white via-accent-100 to-accent-300 bg-clip-text text-transparent">
                Build Skills, Build Solutions
                <span className="block bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent mt-1">One Tech Hub, Infinite Possibilities</span>
              </h1>
              <p className="text-sm text-primary-100/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Master in‑demand technologies with expert‑led training in SAP, AI, Full Stack &amp; Cloud.
                Plus accelerate your business with our comprehensive IT services – consulting, custom
                development, staffing, and 24/7 support. Transform your career. Scale your business.
              </p>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <Link to="/courses" className="group inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 border border-accent-400/30">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                    Explore Courses
                  </Link>
                  <Link to="/services" className="group inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary-700/80 rounded-lg hover:bg-primary-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-white/20 hover:border-white/30 backdrop-blur-sm">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                    Explore Services
                  </Link>
                  <Link to="/contact" className="group inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-primary-900 bg-white rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-transparent hover:border-accent-200">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                    Book Free Demo
                  </Link>
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <button
                    onClick={scrollToForm}
                    className="group inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-accent-400/30"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5 group-hover:translate-x-1 transition-transform" />
                    Request a Proposal
                  </button>
                  <Link to="/contact" className="group inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary-700/80 rounded-lg hover:bg-primary-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border border-white/20 hover:border-white/30 backdrop-blur-sm">
                    <Phone className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                    Talk to an Expert
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                {HERO_STATS.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="text-center group">
                      <div className={`inline-flex items-center justify-center w-8 h-8 ${stat.bgColor} rounded-lg mb-0.5 group-hover:scale-110 transition-transform duration-300 border border-white/5`}>
                        <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                      </div>
                      <div className="text-sm font-black text-white group-hover:text-accent-300 transition-colors">{stat.value}</div>
                      <div className="text-[10px] leading-tight text-primary-200 group-hover:text-primary-100 transition-colors font-medium">{stat.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="relative h-64 lg:h-80 w-full rounded-xl overflow-hidden shadow-lg border border-white/10">
              <img
                src={TECH_IMAGES[currentImageIndex]}
                alt="IT Hub"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
                onError={() => handleImageError(currentImageIndex)}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />

              <div className="absolute inset-0">
                {MODULE_ITEMS.map((mod, idx) => (
                  <DraggableModule
                    key={idx}
                    icon={mod.icon}
                    label={mod.label}
                    color={mod.color}
                    initialX={initialPositions[idx].x}
                    initialY={initialPositions[idx].y}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sentinel for deferred content */}
      <div ref={sentinelRef} className="h-1" />

      {/* ===== All below‑the‑fold sections (including new form) ===== */}
      {showContent && (
        <>
          {/* Course Categories */}
          <section className="py-10 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2 border border-primary-200">
                  <BookOpen className="w-3 h-3" />
                  Comprehensive Curriculum
                </div>
                <h2 className="text-2xl lg:text-3xl font-black font-display text-gray-900 mb-1">
                  20+ Courses Across 6 Technology Domains
                </h2>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                  Master in-demand technologies with industry-aligned curriculum, hands-on projects, and certification
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {COURSES_BY_CATEGORY.map(cat => (
                  <div key={cat.id} className="group bg-white rounded-xl p-4 border border-gray-200 hover:border-accent-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${cat.color}`}>
                        <cat.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Duration</div>
                        <div className="text-xs font-bold text-gray-800">{cat.duration}</div>
                      </div>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 mb-2">{cat.category}</h3>
                    <ul className="space-y-1 mb-3">
                      {cat.courses.slice(0, 3).map((course, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-600">{course}</span>
                        </li>
                      ))}
                      {cat.courses.length > 3 && (
                        <li className="text-[10px] text-gray-500 pl-5">+{cat.courses.length - 3} more courses</li>
                      )}
                    </ul>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Projects</div>
                          <div className="text-xs font-bold text-gray-800">{cat.projects}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Certification</div>
                          <div className="text-xs font-bold text-green-600">{cat.certification}</div>
                        </div>
                      </div>
                      <Link to={`/courses?category=${cat.category.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs font-semibold text-accent-600 hover:text-accent-700 transition-colors">
                        View Courses
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Choose Us (Training) */}
          <section className="py-10 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2 border border-primary-200">
                  <Target className="w-3 h-3" />
                  Why Choose Shirsat Tech Hub
                </div>
                <h2 className="text-2xl lg:text-3xl font-black font-display text-gray-900 mb-1">
                  Your Complete Career Transformation Partner
                </h2>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                  End-to-end solutions for your career growth – from skill development to placement
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {FEATURES.map(feature => (
                  <div key={feature.id} className="group bg-white rounded-xl p-4 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start gap-3">
                      <div className={`inline-flex items-center justify-center w-10 h-10 flex-shrink-0 bg-gradient-to-r ${feature.color} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-gray-900 mb-0.5">{feature.name}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <ul className="flex flex-wrap gap-1.5">
                        {feature.points.map((point, idx) => (
                          <li key={idx} className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
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

          {/* Featured Courses (API) */}
          <section className="py-16 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-primary-200">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Featured Courses
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  Most Popular Courses
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  Browse our most enrolled courses across all technologies
                </p>
              </div>
              {loadingCourses ? (
                <LoadingSkeleton />
              ) : errorCourses ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-600">{errorCourses}</p>
                  <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                    Try Again
                  </button>
                </div>
              ) : featuredCourses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-600">No courses available at the moment. Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  <Suspense fallback={<LoadingSkeleton />}>
                    {featuredCourses.map(course => (
                      <CourseCard key={course.course_id} course={course} />
                    ))}
                  </Suspense>
                </div>
              )}
              <div className="text-center mt-8">
                <Link to="/courses" className="group inline-flex items-center justify-center px-8 py-3 text-base font-bold text-primary-600 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                  View All Courses
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* Our Services Overview (static) */}
          <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-accent-200">
                  <Briefcase className="w-3.5 h-3.5" />
                  What We Offer
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  Comprehensive Technology Solutions
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  From corporate training to custom development, we provide end‑to‑end services for your business growth
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {SERVICECATEGORIES.map((service) => (
                  <div key={service.id} className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-accent-300 transition-all duration-300 hover:-translate-y-1">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${service.color} mb-4`}>
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                    <ul className="space-y-1 mb-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm font-bold text-accent-600">{service.price}</span>
                      <Link to="/services" className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1">
                        Learn more <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/services" className="group inline-flex items-center justify-center px-8 py-3 text-base font-bold text-accent-600 bg-white border-2 border-accent-200 rounded-xl hover:border-accent-300 hover:bg-accent-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                  View All Services
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* Featured Services (API) */}
          <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-accent-200">
                  <Briefcase className="w-3.5 h-3.5" />
                  Featured Services
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  Professional Services
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  Explore our expert services designed to accelerate your business growth
                </p>
              </div>
              {loadingServices ? (
                <LoadingSkeleton />
              ) : errorServices ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-600">{errorServices}</p>
                  <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                    Try Again
                  </button>
                </div>
              ) : featuredServices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-600">No services available at the moment. Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {featuredServices.map(service => (
                    <ServiceCard key={service.service_id || service.id} service={service} viewMode="grid" />
                  ))}
                </div>
              )}
              <div className="text-center mt-8">
                <Link to="/services" className="group inline-flex items-center justify-center px-8 py-3 text-base font-bold text-accent-600 bg-white border-2 border-accent-200 rounded-xl hover:border-accent-300 hover:bg-accent-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                  View All Services
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* Why Businesses Choose Us */}
          <section className="py-16 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-primary-200">
                  <Award className="w-3.5 h-3.5" />
                  Why Shirsat Tech Hub
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  The Partner You Can Trust
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  We deliver measurable results with transparency and expertise
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {WHYUS.map((item) => (
                  <div key={item.id} className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-900 mb-1">{item.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Career Transformation */}
          <section className="py-10 bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 text-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-black font-display mb-1">
                  Complete Career Transformation
                </h2>
                <p className="text-sm text-primary-200 max-w-3xl mx-auto">
                  From beginner to professional – our program covers every aspect of your career growth
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {CAREER_POINTS.map(point => (
                  <div key={point.id} className="group bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-accent-400/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <point.icon className={`w-4 h-4 ${point.color}`} />
                      </div>
                      <h3 className="text-sm font-black">{point.title}</h3>
                    </div>
                    <p className="text-xs text-primary-200 leading-relaxed mb-3">{point.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {point.stats.map((stat, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-medium">
                          {stat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Our Process */}
          <section className="py-16 bg-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-accent-200">
                  <GitBranch className="w-3.5 h-3.5" />
                  How We Work
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  Simple & Transparent Process
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  From discovery to delivery, we keep you involved every step of the way
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {PROCESSSTEPS.map((step) => (
                  <div key={step.step} className="relative bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-accent-300 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md">
                      {step.step}
                    </div>
                    <div className="flex items-start gap-3 mt-2">
                      <step.icon className="w-5 h-5 text-accent-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-base font-black text-gray-900 mb-1">{step.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link to="/contact" className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                  Start Your Project
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </section>

          {/* Learning Methodologies */}
          <section className="py-10 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-2 border border-primary-200">
                  <GraduationCap className="w-3 h-3" />
                  Learning Methodology
                </div>
                <h2 className="text-2xl lg:text-3xl font-black font-display text-gray-900 mb-1">
                  How You'll Learn
                </h2>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                  Our proven methodology ensures maximum retention and practical application
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {LEARNING_METHODS.map(method => (
                  <div key={method.id} className="group bg-white rounded-xl p-4 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${method.color} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                        <method.icon className={`w-4 h-4 ${method.color}`} />
                      </div>
                      <h3 className="text-sm font-black text-gray-900">{method.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mt-2">{method.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Course Testimonials */}
          <section className="py-16 bg-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-primary-200">
                  <Heart className="w-3.5 h-3.5" />
                  Success Stories
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  Transformations That Inspire
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  Join thousands of professionals who transformed their careers with our training
                </p>
              </div>
              {loadingTestimonials ? (
                <TestimonialsSkeleton />
              ) : errorTestimonials ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{errorTestimonials}</p>
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No testimonials available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {testimonials.map((testimonial, index) => {
                    const {
                      testimonial_id,
                      name = 'Anonymous',
                      role = '',
                      company = '',
                      content = '',
                      rating = 5,
                      avatar = null,
                      technology = '',
                      before_salary = '',
                      after_salary = '',
                      duration = '',
                      linkedin_url = '',
                    } = testimonial
                    const initials = avatar || getInitials(name)
                    const before = before_salary || testimonial.before || ''
                    const after = after_salary || testimonial.after || ''
                    const linkedin = linkedin_url || testimonial.linkedin || ''
                    return (
                      <div key={testimonial_id || index} className="group bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: rating }).map((_, idx) => (
                              <Star key={idx} className="w-4 h-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          {technology && <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded">{technology}</span>}
                        </div>
                        <p className="text-gray-600 mb-4 italic text-sm">"{content}"</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-black text-gray-900">{name}</h4>
                                <p className="text-sm text-gray-600">{role}</p>
                                {company && <p className="text-xs text-gray-500">{company}</p>}
                              </div>
                              {linkedin && (
                                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0077B5] transition-colors duration-300 transform hover:scale-110" title="View LinkedIn Profile">
                                  <Linkedin className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                            {(before || after || duration) && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                {before && (
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Before</div>
                                    <div className="text-sm font-semibold text-gray-700">{before}</div>
                                  </div>
                                )}
                                {after && (
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">After</div>
                                    <div className="text-sm font-semibold text-green-600">{after}</div>
                                  </div>
                                )}
                                {duration && (
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Duration</div>
                                    <div className="text-sm font-semibold text-gray-700">{duration}</div>
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
              <div className="text-center mt-8 text-sm text-gray-500">
                <p className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  All testimonials are verified with LinkedIn profiles. Click the LinkedIn icon to view their profiles.
                </p>
              </div>
            </div>
          </section>

          {/* Service Testimonials */}
          <section className="py-16 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-accent-200">
                  <Heart className="w-3.5 h-3.5" /> Client Success
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  What Our Service Clients Say
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  Trusted by businesses and professionals across industries.
                </p>
              </div>
              {loadingServiceTestimonials ? (
                <TestimonialsSkeleton />
              ) : errorServiceTestimonials ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-600">{errorServiceTestimonials}</p>
                  <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                    Try Again
                  </button>
                </div>
              ) : serviceTestimonials.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No service testimonials available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {serviceTestimonials.map((testimonial, index) => {
                    const {
                      testimonial_id,
                      name = 'Anonymous',
                      role = '',
                      company = '',
                      content = '',
                      rating = 5,
                      avatar = null,
                      technology = '',
                      before_salary = '',
                      after_salary = '',
                      duration = '',
                      linkedin_url = '',
                    } = testimonial
                    const initials = avatar || getInitials(name)
                    const before = before_salary || testimonial.before || ''
                    const after = after_salary || testimonial.after || ''
                    const linkedin = linkedin_url || testimonial.linkedin || ''
                    return (
                      <div key={testimonial_id || index} className="group bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: rating }).map((_, idx) => (
                              <Star key={idx} className="w-4 h-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          {technology && <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded">{technology}</span>}
                        </div>
                        <p className="text-gray-600 mb-4 italic text-sm">"{content}"</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-black text-gray-900">{name}</h4>
                                <p className="text-sm text-gray-600">{role}</p>
                                {company && <p className="text-xs text-gray-500">{company}</p>}
                              </div>
                              {linkedin && (
                                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0077B5] transition-colors duration-300 transform hover:scale-110" title="View LinkedIn Profile">
                                  <Linkedin className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                            {(before || after || duration) && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                {before && (
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Before</div>
                                    <div className="text-sm font-semibold text-gray-700">{before}</div>
                                  </div>
                                )}
                                {after && (
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">After</div>
                                    <div className="text-sm font-semibold text-green-600">{after}</div>
                                  </div>
                                )}
                                {duration && (
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Duration</div>
                                    <div className="text-sm font-semibold text-gray-700">{duration}</div>
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
              <div className="text-center mt-8 text-sm text-gray-500">
                <p className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  All testimonials are verified with LinkedIn profiles. Click the LinkedIn icon to view their profiles.
                </p>
              </div>
            </div>
          </section>

          {/* ===== Request a Proposal Form (from Services.jsx) ===== */}
          <section ref={formSectionRef} className="py-16 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-8 items-start">
                {/* Left info */}
                <div className="text-white">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 mb-4">
                    <Send className="w-4 h-4 text-accent-300" />
                    <span className="text-xs font-semibold">Get a Free Quote</span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black mb-4">Ready to Work Together?</h2>
                  <p className="text-base text-primary-100 mb-6 leading-relaxed">
                    Tell us about your project, training needs, or hiring requirements. We'll get back
                    to you within 24 hours with a customized proposal and pricing.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-accent-300" />
                      </div>
                      <span className="text-sm">Response within 24 hours</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-accent-300" />
                      </div>
                      <span className="text-sm">100% confidentiality</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-accent-300" />
                      </div>
                      <span className="text-sm">No obligation, free consultation</span>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl p-4 shadow-xl">
                  <h3 className="text-base font-black text-gray-900 mb-3">Request a Proposal</h3>
                  {formSubmitted ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900 mb-1">Proposal Request Sent!</h4>
                      <p className="text-xs text-gray-600">
                        Thank you for reaching out. Our team will contact you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                      {/* Personal Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Full Name <span className="text-red-500">*</span></label>
                          <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Email Address <span className="text-red-500">*</span></label>
                          <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Phone Number</label>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" />
                        </div>
                      </div>

                      {/* Company & Position */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Company</label>
                          <input type="text" name="company" value={formData.company} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Position</label>
                          <input type="text" name="position" value={formData.position} onChange={handleInputChange} placeholder="e.g., CEO" className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Website</label>
                          <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://" className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" />
                        </div>
                      </div>

                      {/* Service, Project Type, Employees */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Service <span className="text-red-500">*</span></label>
                          <select name="service" value={formData.service} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" required>
                            <option value="">Select</option>
                            <option value="Corporate Training">Corporate Training</option>
                            <option value="IT Consulting">IT Consulting</option>
                            <option value="Custom Development">Custom Development</option>
                            <option value="Staffing Solutions">Staffing Solutions</option>
                            <option value="Resume & Interview Prep">Resume & Interview Prep</option>
                            <option value="Technical Support">24/7 Technical Support</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Project Type</label>
                          <select name="project_type" value={formData.project_type} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none">
                            <option value="new_project">New Project</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="consulting">Consulting</option>
                            <option value="training">Training</option>
                            <option value="staffing">Staffing</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Employees</label>
                          <select name="number_of_employees" value={formData.number_of_employees} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none">
                            <option value="">Select</option>
                            <option value="1-10">1-10</option>
                            <option value="11-50">11-50</option>
                            <option value="51-200">51-200</option>
                            <option value="201-500">201-500</option>
                            <option value="500+">500+</option>
                          </select>
                        </div>
                      </div>

                      {/* Budget, Timeline, Message */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Budget (₹)</label>
                          <select name="budget" value={formData.budget} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none">
                            <option value="">Select</option>
                            <option value="< 5 Lakh">&lt; ₹5 Lakh</option>
                            <option value="5-10 Lakh">₹5L – ₹10L</option>
                            <option value="10-25 Lakh">₹10L – ₹25L</option>
                            <option value="25-50 Lakh">₹25L – ₹50L</option>
                            <option value="> 50 Lakh">&gt; ₹50L</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Timeline</label>
                          <select name="timeline" value={formData.timeline} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none">
                            <option value="">Select</option>
                            <option value="ASAP">ASAP</option>
                            <option value="1-3 months">1-3 months</option>
                            <option value="3-6 months">3-6 months</option>
                            <option value="6+ months">6+ months</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Message</label>
                          <textarea name="message" rows="1" value={formData.message} onChange={handleInputChange} placeholder="Brief description..." className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Street <span className="text-red-500">*</span></label>
                          <input type="text" name="address_line" value={formData.address_line} onChange={handleInputChange} placeholder="Street" className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">City <span className="text-red-500">*</span></label>
                          <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">State <span className="text-red-500">*</span></label>
                          <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Postal</label>
                          <input type="text" name="postal_code" value={formData.postal_code} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Country <span className="text-red-500">*</span></label>
                          <input type="text" name="country" value={formData.country} onChange={handleInputChange} placeholder="India" className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none" required />
                        </div>
                      </div>

                      {/* Preferred Contact, Time, How heard */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Contact Method</label>
                          <select name="preferred_contact_method" value={formData.preferred_contact_method} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none">
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="any">Any</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Contact Time</label>
                          <select name="preferred_contact_time" value={formData.preferred_contact_time} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none">
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                            <option value="any">Any</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">How heard?</label>
                          <select name="heard_about" value={formData.heard_about} onChange={handleInputChange} className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 outline-none">
                            <option value="">Select</option>
                            <option value="Google">Google</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Friend/Colleague">Friend/Colleague</option>
                            <option value="Email">Email</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* File Attachment */}
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Attach Requirements (optional)</label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors">
                            <Paperclip className="w-3 h-3 text-gray-600" />
                            <span className="text-[10px] text-gray-700">Choose file</span>
                            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="hidden" />
                          </label>
                          {attachmentName && (
                            <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                              <FileText className="w-2.5 h-2.5 text-gray-600" />
                              <span className="truncate max-w-[120px]">{attachmentName}</span>
                              <button type="button" onClick={removeAttachment} className="text-gray-500 hover:text-red-500">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-500 mt-0.5">Allowed: PDF, DOC, DOCX (Max 10MB)</p>
                      </div>

                      {formError && <p className="text-red-600 text-[10px]">{formError}</p>}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all duration-300 shadow-md disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" /> {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                      <p className="text-[9px] text-gray-500 text-center">We respect your privacy.</p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Map & Contact */}
          {/* <section className="py-16 bg-white">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border border-primary-200">
                  <MapPin className="w-3.5 h-3.5" />
                  Our Hub
                </div>
                <h2 className="text-3xl lg:text-4xl font-black font-display text-gray-900 mb-3">
                  Visit Our Learning & Services Hub
                </h2>
                <p className="text-base text-gray-600 max-w-3xl mx-auto">
                  Come experience our environment and discuss your goals
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 h-80 lg:h-96">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15129.331446796463!2d73.8567437!3d18.5204303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2bf2e67461101%3A0x828d43bf9d9ee343!2sPune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1234567890"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Shirsat Tech Hub Location"
                    ></iframe>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-black text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Address</p>
                          <p className="text-sm text-gray-600">{COMPANYADDRESS.street}</p>
                          <p className="text-sm text-gray-600">{COMPANYADDRESS.area}</p>
                          <p className="text-sm text-gray-600">{COMPANYADDRESS.city}</p>
                          <a href={COMPANYADDRESS.mapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-600 hover:underline inline-flex items-center gap-1 mt-1">
                            Get Directions <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Phone</p>
                          <p className="text-sm text-gray-600">{COMPANYADDRESS.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Email</p>
                          <p className="text-sm text-gray-600">{COMPANYADDRESS.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Working Hours</p>
                          <p className="text-sm text-gray-600">Mon - Sat: 9:00 AM - 8:00 PM</p>
                          <p className="text-sm text-gray-600">Sunday: Closed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link to="/contact" className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Get in Touch for Training & Services
                  </Link>
                </div>
              </div>
            </div>
          </section> */}

          {/* Final CTA */}
          <section className="py-10 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
            </div>
            <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 mb-3">
                <Target className="w-3.5 h-3.5 text-accent-300" />
                <span className="text-xs font-semibold text-white">Limited Seats Available</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">
                Ready to Transform Your Career?
              </h2>
              <p className="text-sm text-primary-100 mb-4 max-w-2xl mx-auto leading-relaxed">
                Join 1500+ successful professionals who launched their tech careers with Shirsat Tech
                Hub. Start your journey today and be job-ready in 3-4 months.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mb-5">
                <Link to="/courses" className="group relative inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-primary-600 bg-white rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 border-2 border-transparent hover:border-accent-200 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-50 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform relative z-10" />
                  <span className="relative z-10">View All Courses</span>
                </Link>
                <Link to="/contact" className="group inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-white bg-primary-700/80 rounded-lg hover:bg-primary-800 transition-all duration-300 border-2 border-white/20 hover:border-white/30 backdrop-blur-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                  Book Free Demo Class
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-primary-200 text-xs">
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
                  <span className="font-semibold">Industry-Recognized Certification</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-accent-400" />
                  <span className="font-semibold">1500+ Students Trained</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-accent-400" />
                  <span className="font-semibold">95% Placement Success Rate</span>
                </div>
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

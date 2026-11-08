// src/components/layout/Footer.jsx
import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo-tech1.svg'
import {
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Building,
  Brain,
  Cloud,
  Code,
  Shield,
  Calendar,
  Users,
  Award,
  Clock,
  Sparkles,
  Linkedin,
  Github,
  Download,
  User,
  Code2,
  FileText,
  Globe,
  Home,
  GraduationCap,
  MessageSquare,
  ExternalLink,
  Instagram,
  Cpu,
  Briefcase,
  X,
} from 'lucide-react'

const Footer = () => {
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const popupRef = useRef(null)
  const triggerRef = useRef(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsPopupOpen(false)
        setShowDeveloperInfo(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle click on trigger
  const handleTriggerClick = () => {
    setIsPopupOpen(!isPopupOpen)
    setShowDeveloperInfo(!isPopupOpen)
  }

  // Close popup function
  const closePopup = () => {
    setIsPopupOpen(false)
    setShowDeveloperInfo(false)
  }

  const technologies = [
    { name: 'SAP ABAP', icon: Building },
    { name: 'SAP AI & Fiori', icon: Brain },
    { name: 'GenAI & ChatGPT', icon: Sparkles },
    { name: '.NET & Web Dev', icon: Code },
    { name: 'Cloud & Azure', icon: Cloud },
    { name: 'Data Science', icon: Globe },
  ]

  const quickLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'All Courses', path: '/courses', icon: GraduationCap },
    { name: 'About Us', path: '/about', icon: Users },
    { name: 'Contact', path: '/contact', icon: MessageSquare },
    { name: 'Book Demo', path: '/contact?demo=true', icon: Calendar },
    { name: 'Success Stories', path: '/testimonials', icon: Award },
  ]

  const companyLinks = [
    { name: 'Privacy Policy', path: '/privacy', icon: Shield },
    { name: 'Terms of Service', path: '/terms', icon: FileText },
    { name: 'Refund Policy', path: '/refund', icon: Shield },
    { name: 'FAQs', path: '/faq', icon: BookOpen },
    { name: 'Blog', path: '/blog', icon: BookOpen },
    { name: 'Careers', path: '/careers', icon: Users },
  ]

  const stats = [
    { label: 'Students Trained', value: '1500+', icon: Users },
    { label: 'Success Rate', value: '95%', icon: Award },
    { label: 'Placement Support', value: '100%', icon: Shield },
    { label: 'Job Readiness', value: '3-4 Months', icon: Clock },
  ]

  // Shirsat Tech Hub social links
  const companySocialLinks = [
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/akshay-v-shirsat-18061514a',
      icon: Linkedin,
      color: 'text-blue-400',
    },
    {
      name: 'Quora',
      url: 'https://www.quora.com/profile/Akshay-V-Shirsat',
      icon: MessageSquare,
      color: 'text-red-400',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/shirsattechhub?igsh=YjF1ZzFtMmU2Yncy',
      icon: Instagram,
      color: 'text-pink-400',
    },
  ]

  // Developer contact info
  const developerInfo = {
    name: 'Manish Rajendra Yelam',
    role: 'MERN Stack Developer',
    phone: '+91 9373200525',
    email: 'manishyelam12e@gmail.com',
    linkedin: 'https://www.linkedin.com/in/manish-yelam-a6b649233',
    github: 'https://github.com/ManishYelam',
    location: 'Pune, Maharashtra',
    resume: 'https://drive.google.com/file/d/10tVvzIE19fZr2o1DAbUQgOArRw7PT91r/view?usp=sharing',
  }

  // Determine popup visibility based on hover OR click
  const shouldShowPopup = showDeveloperInfo || isPopupOpen

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-primary-900 to-accent-800 text-white">
      {/* FULL WIDTH CONTAINER — replaced max-w-7xl with w-full and extended padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-8">
        {/* Main Footer Grid - 2 Rows */}

        {/* First Row: Brand, Quick Links, Company, Technologies */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src={logo}
                  alt="Shirsat Tech Hub Logo"
                  className="w-8 h-8 object-contain p-1"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Shirsat Tech Hub</h1>
                <p className="text-xs text-primary-200">Innovation • Technology • Future</p>
              </div>
            </div>

            <p className="text-xs text-primary-200 leading-relaxed">
              Transform your career with comprehensive training in SAP, AI, Web, Cloud, and GenAI.
              Learn from certified professionals and get job-ready in just 3-4 months.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold mb-4 pb-2 border-b border-white/20">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors group"
                  >
                    <link.icon className="w-3 h-3" />
                    <span className="text-xs font-medium">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-base font-bold mb-4 pb-2 border-b border-white/20">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors group"
                  >
                    <link.icon className="w-3 h-3" />
                    <span className="text-xs font-medium">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="text-base font-bold mb-4 pb-2 border-b border-white/20">Technologies</h3>
            <div className="grid grid-cols-2 gap-1">
              {technologies.map((tech, index) => {
                const IconComponent = tech.icon
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 bg-white/5 rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                  >
                    <IconComponent className="w-3 h-3 text-accent-400" />
                    <span className="text-xs font-medium">{tech.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Second Row: Contact Info, Social Links, Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-base font-bold mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">+91 9527512770</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">support@shirsattechhub.cloud</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pune, Maharashtra, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h3 className="text-base font-bold mb-3">Follow Us</h3>
            <div className="flex gap-3">
              {companySocialLinks.map((social, index) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/10"
                  >
                    <IconComponent className={`w-5 h-5 ${social.color}`} />
                  </a>
                )
              })}
            </div>

            {/* Features */}
            <div className="pt-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">Learn Online or In-Person</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" />
                  <span className="text-xs">Real Industry Projects</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  <span className="text-xs">Job-Ready in 3-4 Months</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={index}
                  className="text-center bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg mb-1.5">
                    <IconComponent className="w-4 h-4 text-accent-400" />
                  </div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-primary-200">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-6"></div>

        {/* Bottom Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3">
          {/* Left: Copyright */}
          <div className="text-center md:text-left">
            <p className="text-primary-200 text-xs">
              © 2025 Shirsat Tech Hub — Powered by Innovation & Excellence
            </p>
            <p className="text-primary-300 text-[10px] mt-1">
              Expert-led training in SAP, AI, Web, Cloud, and GenAI
            </p>
          </div>

          {/* Center: Developer Info */}
          <div className="relative flex justify-center">
            <div
              ref={triggerRef}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-300 group"
              onMouseEnter={() => setShowDeveloperInfo(true)}
              onMouseLeave={() => {
                if (!isPopupOpen) {
                  setShowDeveloperInfo(false)
                }
              }}
              onClick={handleTriggerClick}
            >
              <Code2 className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-primary-200 group-hover:text-white">
                Developed by Manish Yelam
              </span>
              {isPopupOpen && <span className="text-[10px] text-cyan-300 ml-1">(Click to close)</span>}
            </div>

            {/* Enhanced Popup Card - Shows on Hover OR Click */}
            <div
              ref={popupRef}
              className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 transition-all duration-300 ${
                shouldShowPopup
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
            >
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-lg shadow-xl border border-white/10 backdrop-blur-sm w-64">
                {/* Close button for clicked popup */}
                {isPopupOpen && (
                  <button
                    onClick={closePopup}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center z-50 shadow-lg"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                )}

                <div className="p-3">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{developerInfo.name}</h4>
                      <p className="text-[10px] text-cyan-300">MERN Stack Developer</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-2.5 h-2.5 text-green-400" />
                      <span className="text-[11px] font-medium">{developerInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-2.5 h-2.5 text-yellow-400" />
                      <span className="text-[11px] font-medium truncate">{developerInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-2.5 h-2.5 text-red-400" />
                      <span className="text-[11px] font-medium">{developerInfo.location}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-1.5 mb-2.5">
                    <a
                      href={developerInfo.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 py-1 px-1.5 rounded text-[10px] transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <Linkedin className="w-2.5 h-2.5" />
                      <span>LinkedIn</span>
                    </a>

                    <a
                      href={developerInfo.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-1 px-1.5 rounded text-[10px] transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <Github className="w-2.5 h-2.5" />
                      <span>GitHub</span>
                    </a>
                  </div>

                  {/* Resume Button - Main Download Button */}
                  <a
                    href={developerInfo.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-1.5 px-2 rounded text-xs font-medium transition-all hover:scale-105"
                    onClick={e => {
                      e.stopPropagation()
                      setTimeout(() => {
                        if (isPopupOpen) {
                          closePopup()
                        }
                      }, 300)
                    }}
                  >
                    <Download className="w-2.5 h-2.5" />
                    Download Resume
                  </a>

                  {/* Additional note for click users */}
                  {isPopupOpen && (
                    <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                      Popup stays open for easy resume download
                    </p>
                  )}
                </div>

                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-gray-900 border-b border-r border-white/10 rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Right: Features */}
          <div className="flex flex-wrap justify-center md:justify-end gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="w-3 h-3" />
              <span className="hidden sm:inline">Online/Offline Classes</span>
              <span className="sm:hidden">Classes</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Building className="w-3 h-3" />
              <span className="hidden sm:inline">Corporate Training</span>
              <span className="sm:hidden">Corporate</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Award className="w-3 h-3" />
              <span className="hidden sm:inline">Certification</span>
              <span className="sm:hidden">Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
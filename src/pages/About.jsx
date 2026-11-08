// src/pages/About.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Award,
  Users,
  Target,
  CheckCircle,
  Star,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  BookOpen,
  Heart,
  Cpu,
  Code,
  Cloud,
  Database,
  Brain,
  Terminal,
  Briefcase,
  Building,
  FileText,
  Headphones,
} from 'lucide-react'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'

const About = () => {
  // Training features
  const trainingFeatures = [
    {
      icon: GraduationCap,
      title: 'Expert Training',
      description:
        'Learn from industry experts with 10+ years of experience in SAP, AI, Cloud & more',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Award,
      title: 'Certification Ready',
      description: 'Curriculum designed to prepare you for industry-recognized certifications',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Join a community of 1500+ learners and professionals across technologies',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Target,
      title: 'Career Focused',
      description:
        'Training programs designed for job placement and career growth in multiple domains',
      color: 'from-orange-500 to-red-500',
    },
  ]

  // Service offerings (condensed from Services page)
  const serviceOfferings = [
    {
      icon: Briefcase,
      title: 'IT Consulting',
      description: 'Strategic technology advisory, digital transformation, and system optimization.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Building,
      title: 'Corporate Training',
      description: 'Customized upskilling programs for teams in SAP, AI, Cloud, and Web.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Code,
      title: 'Custom Development',
      description: 'Scalable web apps, SAP extensions, AI models, and cloud-native solutions.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Staffing Solutions',
      description: 'Pre-vetted tech talent for contract, contract-to-hire, or permanent roles.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: FileText,
      title: 'Resume & Interview Prep',
      description: 'Professional resume writing, LinkedIn makeover, and mock interviews.',
      color: 'from-teal-500 to-green-500',
    },
    {
      icon: Headphones,
      title: '24/7 Technical Support',
      description: 'Round-the-clock helpdesk, system monitoring, and incident management.',
      color: 'from-cyan-500 to-blue-500',
    },
  ]

  const stats = [
    { number: '1500+', label: 'Students Trained', icon: Users, color: 'text-blue-400' },
    { number: '95%', label: 'Success Rate', icon: TrendingUp, color: 'text-green-400' },
    { number: '100+', label: 'Projects Delivered', icon: Briefcase, color: 'text-purple-400' },
    { number: '50+', label: 'Corporate Clients', icon: Shield, color: 'text-orange-400' },
  ]

  const instructorHighlights = [
    '10+ years in SAP ABAP, Fiori & BTP development',
    'Expertise in Generative AI & ChatGPT implementation',
    'Full Stack .NET & MERN Stack development experience',
    'Cloud & DevOps (Azure/AWS) specialist',
    'Data Science & Analytics professional',
    'Cybersecurity & Ethical Hacking consultant',
    'Trained 1500+ professionals worldwide',
    'Worked with Fortune 500 companies',
    'Multiple industry certifications',
    'Real-world project experience across domains',
  ]

  const technologies = [
    { icon: Database, name: 'SAP Ecosystem', color: 'bg-blue-100 text-blue-800' },
    { icon: Brain, name: 'AI & GenAI', color: 'bg-purple-100 text-purple-800' },
    { icon: Code, name: 'Web Development', color: 'bg-green-100 text-green-800' },
    { icon: Cloud, name: 'Cloud & DevOps', color: 'bg-orange-100 text-orange-800' },
    { icon: Cpu, name: 'Data Science', color: 'bg-indigo-100 text-indigo-800' },
    { icon: Terminal, name: 'Cybersecurity', color: 'bg-red-100 text-red-800' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Compact Hero Section – full width */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 text-white py-6 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-4 -left-4 w-16 h-16 bg-accent-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-8 -right-4 w-24 h-24 bg-primary-400/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 left-1/4 w-20 h-20 bg-accent-500/30 rounded-full blur-xl"></div>
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-3">
              <Heart className="w-3 h-3 text-accent-300" />
              <span className="text-xs font-medium">About Our Mission</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold font-display mb-2">
              Master Tech Skills & Drive Business Growth
            </h1>
            <p className="text-xs text-primary-100 max-w-xl mx-auto leading-relaxed">
              We provide expert-led training and professional services across SAP, AI, Web, Cloud,
              Data Science & Cybersecurity — empowering individuals and enterprises.
            </p>
          </div>
        </div>
      </section>

      {/* Compact Mission Section – full width */}
      <section className="py-6 bg-transparent">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
                <Target className="w-3 h-3" />
                Our Vision
              </div>
              <h2 className="text-lg font-bold text-gray-900">Empowering Future Tech Experts & Businesses</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                We bridge the gap between learning and employment by offering comprehensive training
                in high-demand technologies, while also delivering enterprise-grade services — from
                IT consulting and custom development to staffing and 24/7 support.
              </p>
              <div className="space-y-2">
                {[
                  'Multi-technology curriculum & hands-on projects',
                  '1:1 mentorship & job placement assistance',
                  'Corporate training & IT consulting',
                  'Custom development & staffing solutions',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technologies We Teach */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/20 shadow">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-accent-500" />
                Technologies We Cover
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Comprehensive training across 6 major technology domains
              </p>
              <div className="grid grid-cols-2 gap-2">
                {technologies.map((tech, index) => {
                  const IconComponent = tech.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded border border-gray-100 hover:border-primary-200 transition-colors"
                    >
                      <div
                        className={`w-6 h-6 ${tech.color} rounded flex items-center justify-center`}
                      >
                        <IconComponent className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{tech.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Features Section – full width */}
      <section className="py-6 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
              <GraduationCap className="w-3 h-3" />
              Training Excellence
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Our Training Approach</h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              Innovative methodology that delivers real results across all technologies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {trainingFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 hover:border-primary-300/50 transition-all duration-300 hover:shadow transform hover:-translate-y-0.5"
              >
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r ${feature.color} rounded-lg mb-2 shadow`}
                >
                  <feature.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: Services Section – full width */}
      <section className="py-6 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
              <Briefcase className="w-3 h-3" />
              Professional Services
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Beyond Training – Our Services</h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              Enterprise-grade solutions to accelerate your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {serviceOfferings.map((service, index) => (
              <div
                key={index}
                className="group bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 hover:border-primary-300/50 transition-all duration-300 hover:shadow transform hover:-translate-y-0.5"
              >
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r ${service.color} rounded-lg mb-2 shadow`}
                >
                  <service.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{service.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-3">
            <Link
              to="/services"
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-all"
            >
              View All Services
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Instructor Section – full width */}
      <section className="py-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
              <GraduationCap className="w-3 h-3" />
              Meet Your Guide
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Expert Instructor & Consultant</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="space-y-3 text-center lg:text-left">
              <h3 className="text-base font-bold text-gray-900">Akshay</h3>
              <p className="text-xs text-gray-600 font-medium">
                Multi-Technology Expert & Corporate Trainer with 10+ years of industry experience
                across SAP, AI, Web, Cloud & more — also leads our consulting and custom development
                practice.
              </p>
              <div className="space-y-2 mb-3">
                {instructorHighlights.slice(0, 6).map((highlight, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/courses"
                  className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Explore Courses
                </Link>
                <Link
                  to="/services"
                  className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  Our Services
                </Link>
              </div>
            </div>

            {/* Compact Avatar */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow">
                  A
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow">
                  <Star className="w-2 h-2 text-white fill-current" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section – full width */}
      <section className="py-6 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Our Impact Across Training & Services</h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              Transforming careers and businesses with proven results
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={index}
                  className="text-center bg-gray-50 rounded-lg p-3 border border-gray-200 shadow-sm"
                >
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary-50 rounded mb-1 border border-primary-100">
                    <IconComponent className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="text-sm font-bold text-gray-900">{stat.number}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Compact CTA Section – full width but centered text */}
      <section className="py-6 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-accent-500/20 rounded-full blur-lg"></div>
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 text-center">
          <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-2">
            <Target className="w-3 h-3 text-accent-300" />
            <span className="text-xs font-medium text-white">Start Your Journey</span>
          </div>

          <h2 className="text-lg font-bold text-white mb-2">
            Ready to Master Tech Skills or Scale Your Business?
          </h2>
          <p className="text-xs text-primary-100 mb-3 max-w-lg mx-auto leading-relaxed">
            Join 1500+ successful professionals and 50+ corporate clients who trust us for training
            and technology solutions. Let's build your future together.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/courses"
              className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-primary-600 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 shadow hover:shadow-md border border-transparent hover:border-accent-200"
            >
              <BookOpen className="w-3 h-3 mr-1" />
              Explore Courses
            </Link>
            <Link
              to="/services"
              className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary-700/80 rounded-lg hover:bg-primary-800 transition-all duration-200 border border-white/20 hover:border-white/30 backdrop-blur-sm shadow hover:shadow-md"
            >
              <Briefcase className="w-3 h-3 mr-1" />
              Our Services
            </Link>
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-accent-500/80 rounded-lg hover:bg-accent-600 transition-all duration-200 border border-white/20 hover:border-white/30 backdrop-blur-sm shadow hover:shadow-md"
            >
              <Heart className="w-3 h-3 mr-1" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <WhatsAppFloatingIcon />
    </div>
  )
}

export default About
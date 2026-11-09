// src/pages/About.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Users,
  Target,
  CheckCircle,
  Star,
  Zap,
  TrendingUp,
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
  Headphones,
  Rocket,
  Globe,
  Layers,
  ShieldCheck,
  UserCheck,
  Settings,
  ArrowRight,
  Sparkles,
  Send,
  Search,
  RefreshCw,
  Lock,
} from 'lucide-react'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'

// ==================== HERO HIGHLIGHTS (mirrors Home hero) ====================
const HERO_HIGHLIGHTS = [
  { icon: Briefcase, title: 'IT Services', desc: 'Design, build & scale' },
  { icon: Globe, title: 'Domain Registration', desc: 'Build your online identity' },
  { icon: Users, title: 'Expert Team', desc: 'Seasoned practitioners' },
  { icon: Headphones, title: '24/7 Support', desc: 'Assistance when you need it' },
]

// ==================== HERO STATS ====================
const HERO_STATS = [
  { value: '100+', label: 'Projects Delivered', icon: Briefcase, color: 'text-primary-300' },
  { value: '98%', label: 'Client Satisfaction', icon: TrendingUp, color: 'text-green-400' },
  { value: '500+', label: 'Domains Registered', icon: Globe, color: 'text-purple-300' },
  { value: '50+', label: 'Corporate Clients', icon: Building, color: 'text-orange-300' },
]

const About = () => {
  /* --------------------------------------------------------------
     TWO PILLARS — Services + Domains (matches Home positioning)
     -------------------------------------------------------------- */
  const pillars = [
    {
      icon: Briefcase,
      title: 'IT Services & Consulting',
      tagline: 'Design. Build. Scale.',
      description:
        'End-to-end technology services — strategy, custom development, cloud, AI, staffing, and 24/7 support — built to move your business forward.',
      points: [
        'IT consulting & digital transformation',
        'Custom web, SAP & AI solutions',
        'Staffing & team augmentation',
        'Managed support & monitoring',
      ],
      color: 'from-primary-500 to-primary-700',
      cta: { label: 'Explore Services', to: '/services' },
    },
    {
      icon: Globe,
      title: 'Domain Registration',
      tagline: 'Claim Your Digital Identity.',
      description:
        'Register, transfer, and manage domains with competitive pricing, free WHOIS privacy, easy DNS management, and instant activation.',
      points: [
        'All major TLDs (.com, .in, .io & more)',
        'Free WHOIS privacy',
        'Instant activation & easy DNS',
        'Secure renewals & transfers',
      ],
      color: 'from-accent-500 to-accent-700',
      cta: { label: 'Register a Domain', to: '/domains' },
    },
  ]

  /* --------------------------------------------------------------
     SERVICE OFFERINGS — mirrors Home's services
     -------------------------------------------------------------- */
  const serviceOfferings = [
    {
      icon: Briefcase,
      title: 'IT Consulting',
      description: 'Strategic technology advisory, digital transformation, and system optimization.',
      color: 'from-primary-500 to-primary-600',
    },
    {
      icon: Building,
      title: 'Corporate Solutions',
      description: 'Customized enterprise solutions for SAP, AI, Cloud, and Web at scale.',
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
      icon: Globe,
      title: 'Domain & Hosting',
      description: 'Domain registration, DNS management, and reliable hosting for your online presence.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Headphones,
      title: '24/7 Technical Support',
      description: 'Round-the-clock helpdesk, system monitoring, and incident management.',
      color: 'from-cyan-500 to-blue-500',
    },
  ]

  /* --------------------------------------------------------------
     TECHNOLOGIES
     -------------------------------------------------------------- */
  const technologies = [
    { icon: Database, name: 'SAP Ecosystem', color: 'bg-blue-100 text-blue-800' },
    { icon: Brain, name: 'AI & GenAI', color: 'bg-purple-100 text-purple-800' },
    { icon: Code, name: 'Full Stack Dev', color: 'bg-green-100 text-green-800' },
    { icon: Cloud, name: 'Cloud & DevOps', color: 'bg-orange-100 text-orange-800' },
    { icon: Cpu, name: 'Data & Analytics', color: 'bg-indigo-100 text-indigo-800' },
    { icon: Terminal, name: 'Cybersecurity', color: 'bg-red-100 text-red-800' },
  ]

  /* --------------------------------------------------------------
     WHY CHOOSE US — mirrors Home's WHYUS
     -------------------------------------------------------------- */
  const whyUs = [
    {
      icon: Award,
      title: '10+ Years of Expertise',
      description: 'Senior practitioners with real delivery experience across SAP, AI, Cloud, and Web.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Target,
      title: 'Outcome-Focused',
      description: 'Every project is measured against clear, business-relevant results.',
      color: 'from-red-500 to-rose-500',
    },
    {
      icon: Users,
      title: '100+ Projects, 50+ Clients',
      description: 'A growing roster of enterprises and startups that trust our delivery.',
      color: 'from-primary-500 to-indigo-500',
    },
    {
      icon: ShieldCheck,
      title: 'End-to-End Support',
      description: 'From strategy and build to 24/7 operations — we stay with you.',
      color: 'from-emerald-500 to-teal-500',
    },
  ]

  /* --------------------------------------------------------------
     DOMAIN HIGHLIGHTS — reinforces Home's domain section
     -------------------------------------------------------------- */
  const domainHighlights = [
    { icon: Search, title: 'Find Your Name', desc: 'Search across 50+ TLDs to find the perfect fit.' },
    { icon: Lock, title: 'Free WHOIS Privacy', desc: 'Your personal information stays protected.' },
    { icon: Settings, title: 'Easy DNS Control', desc: 'Full control from an intuitive panel.' },
    { icon: Zap, title: 'Instant Activation', desc: 'Live within minutes of purchase.' },
    { icon: RefreshCw, title: 'Free Transfers', desc: 'Move your domain to us at no extra cost.' },
    { icon: ShieldCheck, title: '99.9% Uptime', desc: 'Reliable infrastructure behind every domain.' },
  ]

  /* --------------------------------------------------------------
     TEAM EXPERTISE — no "instructor", just capability
     -------------------------------------------------------------- */
  const teamExpertise = [
    'SAP ABAP, Fiori & BTP development',
    'Generative AI & ChatGPT implementation',
    'Full Stack .NET & MERN Stack development',
    'Cloud & DevOps (Azure / AWS)',
    'Data Science & Analytics',
    'Cybersecurity & Ethical Hacking',
    'Enterprise integrations & migrations',
    'Fortune 500 delivery experience',
  ]

  /* --------------------------------------------------------------
     HOW WE WORK — 4 steps (matches Home's PROCESSSTEPS intent)
     -------------------------------------------------------------- */
  const journey = [
    {
      step: '01',
      icon: Target,
      title: 'Discover',
      description: 'We understand your goals, constraints, and the outcome you need.',
    },
    {
      step: '02',
      icon: Layers,
      title: 'Design',
      description: 'We architect a tailored solution — technology, timeline, and cost.',
    },
    {
      step: '03',
      icon: Rocket,
      title: 'Deliver',
      description: 'Agile build and launch, with regular checkpoints and real, working outcomes.',
    },
    {
      step: '04',
      icon: ShieldCheck,
      title: 'Support',
      description: 'Managed support, monitoring, and continuous improvement after launch.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">
      {/* ============================================================
          HERO — light gradient, mirrors Home/Domains/Services/Blogs
          ============================================================ */}
      <section className="relative isolate w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-14">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[11px] sm:text-xs font-bold">
              <Sparkles size={13} />
              About MaPrims
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-primary-900">
              Your Digital Growth
              <span className="block text-primary-600">Partner</span>
            </h1>

            {/* Description */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-gray-600 max-w-2xl mx-auto">
              MaPrims helps businesses build, modernize, and scale their digital presence —
              through expert IT services, custom development, domain registration, and
              round-the-clock support.
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

        {/* Stat strip — matches Home / Domains */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-gradient-to-r from-primary-900 to-primary-600 rounded-lg sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
            {HERO_STATS.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-sm sm:text-xl font-black">{stat.value}</div>
                  <div className="text-[8px] sm:text-[10px] text-primary-200 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TWO PILLARS
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-transparent">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              What We Do
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              Two Pillars, One Partner
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              End-to-end technology services and a complete online presence — delivered by one team.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 p-4 sm:p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r ${pillar.color} rounded-lg shadow`}
                  >
                    <pillar.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900">
                      {pillar.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-semibold text-primary-600 uppercase tracking-wide">
                      {pillar.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                  {pillar.description}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
                  {pillar.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] sm:text-xs text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={pillar.cta.to}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {pillar.cta.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          MISSION + TECHNOLOGIES
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
              <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Our Mission
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              Technology That Moves Business Forward
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              Expert engineering, transparent delivery, and support that doesn't stop at launch.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                We exist to help businesses modernize their systems, launch new digital products,
                and secure their online identity — with expert engineering, transparent delivery,
                and support that doesn't stop at launch.
              </p>
              <div className="space-y-2">
                {[
                  'Senior engineers with real-world delivery experience',
                  'Custom development across web, SAP, AI, and cloud',
                  'Domain registration, hosting, and DNS management',
                  'Managed support & 24/7 operations',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-accent-600" />
                </div>
                <h3 className="text-sm font-black text-gray-900">
                  Technologies We Work With
                </h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Deep expertise across six major technology domains
              </p>
              <div className="grid grid-cols-2 gap-2">
                {technologies.map((tech, index) => {
                  const IconComponent = tech.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white hover:border-primary-300 transition-colors"
                    >
                      <div className={`w-6 h-6 ${tech.color} rounded flex items-center justify-center`}>
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

      {/* ============================================================
          WHY CHOOSE US
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
              <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Why MaPrims
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              What Sets Us Apart
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              A rare combination of deep technical expertise and genuine commitment to outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {whyUs.map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg mb-3 shadow group-hover:scale-110 transition-transform`}
                >
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SERVICES OVERVIEW
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
              <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Professional Services
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              What We Do
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade solutions to accelerate your business
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {serviceOfferings.map((service, index) => (
              <div
                key={index}
                className="group bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r ${service.color} rounded-lg mb-3 shadow group-hover:scale-110 transition-transform`}
                >
                  <service.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link
              to="/services"
              className="group inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-accent-600 bg-white border-2 border-accent-200 rounded-lg hover:border-accent-300 hover:bg-accent-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              View All Services
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          DOMAIN HIGHLIGHTS — reinforces Home's domain section
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-white/20">
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-300" />
              Domains & Online Presence
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display mb-2 sm:mb-3">
              Secure Your Digital Identity with MaPrims
            </h2>
            <p className="text-xs sm:text-base text-primary-100 max-w-3xl mx-auto">
              Register, transfer, and manage domains with all the essentials built in
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {domainHighlights.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10 hover:border-white/30 transition-all"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-accent-300" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-primary-200 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/domains"
              className="group inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-700 bg-white rounded-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Globe className="w-3.5 h-3.5" />
              Register a Domain
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          TEAM EXPERTISE
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
              <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Our Expertise
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              A Team of Seasoned Practitioners
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              Engineers and consultants with real delivery experience — not just theory
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
              <h3 className="text-sm sm:text-base font-black text-gray-900 mb-3">
                Core Competencies Across Our Team
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teamExpertise.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                Our engineers and consultants bring hands-on experience from Fortune 500
                environments, product companies, and high-growth startups. We've built, shipped,
                and supported the same systems we now deliver for our clients.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                >
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                  Our Services
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-bold text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW WE WORK
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              How We Work
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              A Simple, Transparent Process
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              From discovery to delivery and beyond, we keep you involved at every step
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {journey.map((step) => (
              <div
                key={step.step}
                className="relative bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="absolute -top-3 -left-3 w-7 h-7 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-black text-[11px] shadow">
                  {step.step}
                </div>
                <step.icon className="w-5 h-5 text-primary-500 mb-2 mt-1" />
                <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              Our Impact in Numbers
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              Proven results across services and domains
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {HERO_STATS.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={index}
                  className="text-center bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-50 rounded-lg mb-2 border border-primary-100">
                    <IconComponent className={`w-5 h-5 text-primary-600`} />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-gray-600 font-semibold uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl sm:blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/20 rounded-full blur-2xl sm:blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/20 mb-2">
            <Rocket className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">Start Your Journey</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">
            Ready to Build, Modernize, or Go Online with MaPrims?
          </h2>
          <p className="text-xs sm:text-base text-primary-100 mb-4 max-w-2xl mx-auto leading-relaxed">
            Whether you need a technology partner, a custom build, or simply a domain to get
            started — we're ready to help. Let's build your future together.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/services"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-700 bg-white rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Briefcase className="w-3.5 h-3.5 mr-1.5" />
              Explore Services
            </Link>
            <Link
              to="/domains"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-black/20 rounded-lg hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 backdrop-blur-sm shadow-md"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Register a Domain
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-accent-500/80 rounded-lg hover:bg-accent-600 transition-all duration-300 border-2 border-white/20 hover:border-white/40 backdrop-blur-sm shadow-md"
            >
              <Heart className="w-3.5 h-3.5 mr-1.5" />
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
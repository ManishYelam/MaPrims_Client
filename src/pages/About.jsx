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
  Shield,
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
  Rocket,
  Globe,
  Layers,
  ShieldCheck,
  UserCheck,
  Settings,
  ArrowRight,
  Sparkles,
  Send,
  Calendar,
  Search,
  RefreshCw,
  Lock,
  GitBranch,
  Clock,
  Trophy,
  BarChart3,
} from 'lucide-react'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'

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
     STATS — aligned with Home (no "students trained")
     -------------------------------------------------------------- */
  const stats = [
    { number: '100+', label: 'Projects Delivered', icon: Briefcase, color: 'text-primary-500' },
    { number: '98%', label: 'Client Satisfaction', icon: TrendingUp, color: 'text-green-500' },
    { number: '500+', label: 'Domains Registered', icon: Globe, color: 'text-purple-500' },
    { number: '50+', label: 'Corporate Clients', icon: Building, color: 'text-orange-500' },
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
          HERO
          ============================================================ */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 text-white py-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-4 -left-4 w-16 h-16 bg-accent-400/20 rounded-full blur-xl" />
          <div className="absolute top-8 -right-4 w-24 h-24 bg-primary-400/20 rounded-full blur-xl" />
          <div className="absolute -bottom-8 left-1/4 w-20 h-20 bg-accent-500/30 rounded-full blur-xl" />
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-3">
              <Sparkles className="w-3 h-3 text-accent-300" />
              <span className="text-xs font-medium">About MaPrims</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display mb-2">
              Your Digital Growth Partner
            </h1>
            <p className="text-xs sm:text-sm text-primary-100 max-w-2xl mx-auto leading-relaxed">
              MaPrims helps businesses build, modernize, and scale their digital presence —
              through expert IT services, custom development, domain registration, and
              round-the-clock support.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          TWO PILLARS
          ============================================================ */}
      <section className="py-6 bg-transparent">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`inline-flex items-center justify-center w-9 h-9 bg-gradient-to-r ${pillar.color} rounded-lg shadow`}
                  >
                    <pillar.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{pillar.title}</h3>
                    <p className="text-[10px] font-medium text-primary-600 uppercase tracking-wide">
                      {pillar.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">
                  {pillar.description}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-3">
                  {pillar.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-[11px] text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={pillar.cta.to}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  {pillar.cta.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          MISSION + TECHNOLOGIES
          ============================================================ */}
      <section className="py-6 bg-transparent">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
                <Target className="w-3 h-3" />
                Our Mission
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Technology That Moves Business Forward
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
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
                    <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/20 shadow">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-accent-500" />
                Technologies We Work With
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Deep expertise across six major technology domains
              </p>
              <div className="grid grid-cols-2 gap-2">
                {technologies.map((tech, index) => {
                  const IconComponent = tech.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded border border-gray-100 hover:border-primary-200 transition-colors"
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
      <section className="py-6 bg-gradient-to-br from-white via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
              <Award className="w-3 h-3" />
              Why MaPrims
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">What Sets Us Apart</h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              A rare combination of deep technical expertise and genuine commitment to outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {whyUs.map((item, index) => (
              <div
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 hover:border-primary-300/50 transition-all duration-300 hover:shadow transform hover:-translate-y-0.5"
              >
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r ${item.color} rounded-lg mb-2 shadow`}
                >
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SERVICES OVERVIEW
          ============================================================ */}
      <section className="py-6 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
              <Briefcase className="w-3 h-3" />
              Professional Services
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">What We Do</h2>
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
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          DOMAIN HIGHLIGHTS — reinforces Home's domain section
          ============================================================ */}
      <section className="py-6 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-2">
              <Globe className="w-3 h-3 text-accent-300" />
              <span className="text-xs font-medium">Domains & Online Presence</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-1">
              Secure Your Digital Identity with MaPrims
            </h2>
            <p className="text-xs sm:text-sm text-primary-100 max-w-xl mx-auto leading-relaxed">
              Register, transfer, and manage domains with all the essentials built in
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {domainHighlights.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/30 transition-all"
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-accent-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white mb-0.5">{item.title}</h3>
                    <p className="text-[10px] text-primary-200 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/domains"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary-700 bg-white rounded-lg hover:bg-gray-50 transition-all shadow hover:shadow-md"
            >
              <Globe className="w-3 h-3" />
              Register a Domain
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          TEAM EXPERTISE
          ============================================================ */}
      <section className="py-6 bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
              <UserCheck className="w-3 h-3" />
              Our Expertise
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">A Team of Seasoned Practitioners</h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              Engineers and consultants with real delivery experience — not just theory
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/40 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Core Competencies Across Our Team
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {teamExpertise.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-current flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Our engineers and consultants bring hands-on experience from Fortune 500
                environments, product companies, and high-growth startups. We've built, shipped,
                and supported the same systems we now deliver for our clients.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/services"
                  className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  Our Services
                </Link>
                <Link
                  to="/contact"
                  className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <Send className="w-3 h-3 mr-1" />
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
      <section className="py-6 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium mb-1 border border-primary-200">
              <Settings className="w-3 h-3" />
              How We Work
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">A Simple, Transparent Process</h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              From discovery to delivery and beyond, we keep you involved at every step
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {journey.map((step) => (
              <div
                key={step.step}
                className="relative bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 hover:border-primary-300/50 transition-all duration-300 hover:shadow transform hover:-translate-y-0.5"
              >
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow">
                  {step.step}
                </div>
                <step.icon className="w-5 h-5 text-primary-500 mb-2 mt-1" />
                <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS
          ============================================================ */}
      <section className="py-6 bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Our Impact in Numbers</h2>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">
              Proven results across services and domains
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={index}
                  className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/40 shadow-sm"
                >
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-primary-50 rounded mb-1 border border-primary-100">
                    <IconComponent className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="text-base font-bold text-gray-900">{stat.number}</div>
                  <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA
          ============================================================ */}
      <section className="py-8 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-12 h-12 bg-white/10 rounded-full blur-lg" />
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-accent-500/20 rounded-full blur-lg" />
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 text-center">
          <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20 mb-2">
            <Rocket className="w-3 h-3 text-accent-300" />
            <span className="text-xs font-medium text-white">Start Your Journey</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            Ready to Build, Modernize, or Go Online with MaPrims?
          </h2>
          <p className="text-xs sm:text-sm text-primary-100 mb-3 max-w-xl mx-auto leading-relaxed">
            Whether you need a technology partner, a custom build, or simply a domain to get
            started — we're ready to help. Let's build your future together.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/services"
              className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-primary-600 bg-white rounded-lg hover:bg-gray-50 transition-all duration-200 shadow hover:shadow-md border border-transparent hover:border-accent-200"
            >
              <Briefcase className="w-3 h-3 mr-1" />
              Explore Services
            </Link>
            <Link
              to="/domains"
              className="group inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary-700/80 rounded-lg hover:bg-primary-800 transition-all duration-200 border border-white/20 hover:border-white/30 backdrop-blur-sm shadow hover:shadow-md"
            >
              <Globe className="w-3 h-3 mr-1" />
              Register a Domain
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
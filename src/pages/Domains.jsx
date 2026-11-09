// src/pages/Domains.jsx
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  Search,
  CheckCircle,
  Zap,
  Lock,
  RefreshCw,
  ShieldCheck,
  Headphones,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Settings,
  Star,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Server,
  Clock,
  Send,
  Phone,
  X,
  HelpCircle,
  CreditCard,
  KeySquare,
  Code,
  Cloud,
} from 'lucide-react'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'

// ==================== DATA ====================
const DOMAIN_EXTENSIONS = [
  { name: '.com', price: 899, popular: true,  badge: 'Most Popular', desc: 'The classic choice for businesses worldwide.', color: 'from-blue-500 to-blue-700' },
  { name: '.in',  price: 499, popular: true,  badge: 'India Favorite', desc: 'Perfect for Indian businesses and startups.', color: 'from-orange-500 to-red-600' },
  { name: '.io',  price: 2999, popular: true,  badge: 'Tech Favorite', desc: 'Loved by startups and tech companies.', color: 'from-purple-500 to-indigo-600' },
  { name: '.dev', price: 1299, popular: true,  badge: 'Developers', desc: 'Built for developers and engineering teams.', color: 'from-green-500 to-emerald-600' },
  { name: '.net', price: 999, popular: false, badge: '', desc: 'A trusted classic for networks and tech.', color: 'from-cyan-500 to-blue-600' },
  { name: '.org', price: 1099, popular: false, badge: '', desc: 'Great for non-profits and communities.', color: 'from-teal-500 to-green-600' },
  { name: '.co',  price: 1499, popular: false, badge: '', desc: 'A short, brandable global alternative.', color: 'from-pink-500 to-rose-600' },
  { name: '.tech', price: 1999, popular: false, badge: '', desc: 'Show you mean business in technology.', color: 'from-indigo-500 to-purple-600' },
  { name: '.ai',   price: 4999, popular: true,  badge: 'AI-Ready', desc: 'For AI products and intelligent platforms.', color: 'from-fuchsia-500 to-purple-600' },
]

const FEATURES = [
  { icon: Lock,         title: 'Free WHOIS Privacy',  desc: 'Your personal details stay hidden from public WHOIS lookups — always.' },
  { icon: Settings,     title: 'Easy DNS Management', desc: 'Full control over A, CNAME, MX, TXT, and other records from one panel.' },
  { icon: Zap,          title: 'Instant Activation',  desc: 'Your domain goes live within minutes of purchase — no waiting.' },
  { icon: ShieldCheck,  title: '99.9% Uptime',        desc: 'Reliable DNS infrastructure backed by redundant nameservers.' },
  { icon: RefreshCw,    title: 'Free Transfers',      desc: 'Bring your existing domain to us — transfers are free with renewal.' },
  { icon: Headphones,   title: '24/7 Support',        desc: 'Real humans on chat, email, and phone whenever you need them.' },
  { icon: CreditCard,   title: 'Transparent Pricing', desc: 'No surprise renewal fees. What you see is what you pay.' },
  { icon: KeySquare,    title: 'Full Ownership',      desc: 'You own the domain. Transfer out anytime — no lock-in.' },
]

const STATS = [
  { value: '500+', label: 'Domains Registered', icon: Globe,      color: 'text-primary-300' },
  { value: '50+',  label: 'TLDs Available',     icon: Layers,     color: 'text-primary-200' },
  { value: '99.9%', label: 'Uptime Guarantee',  icon: ShieldCheck,color: 'text-green-400' },
  { value: '24/7', label: 'Customer Support',   icon: Headphones, color: 'text-teal-400' },
]

// Hero highlights — mirrors Home hero pattern
const HERO_HIGHLIGHTS = [
  { icon: Globe, title: 'Domain Registration', desc: 'Build your online identity' },
  { icon: Lock, title: 'Free WHOIS Privacy', desc: 'Your details stay hidden' },
  { icon: Zap, title: 'Instant Activation', desc: 'Live within minutes' },
  { icon: Headphones, title: '24/7 Support', desc: 'Assistance when you need it' },
]

const FAQS = [
  {
    q: 'How long does it take to register a domain?',
    a: 'Registration is instant. Once payment is confirmed, your domain is active within minutes and you can start configuring DNS immediately.',
  },
  {
    q: 'Can I transfer my existing domain to MaPrims?',
    a: 'Yes. Transfers are free when you renew with us. You will need the authorization code from your current registrar, and the transfer typically completes within 5–7 days.',
  },
  {
    q: 'What is WHOIS privacy and is it really free?',
    a: 'WHOIS privacy hides your personal contact details from public domain lookups. We include it free on all supported TLDs — no extra charges, ever.',
  },
  {
    q: 'Do I own the domain after registering?',
    a: 'Yes. You are the registrant and full owner of the domain. You can transfer it out anytime — we never lock you in.',
  },
  {
    q: 'What happens when my domain expires?',
    a: 'We send renewal reminders well before expiry. After expiry, there is a grace period during which you can renew. After that, the domain becomes available to others.',
  },
  {
    q: 'Can I register multiple domains at once?',
    a: 'Absolutely. You can register as many domains as you need in one order — all managed from a single dashboard.',
  },
]

// ==================== HELPERS ====================
const buildSearchResults = (query, tlds) => {
  if (!query) return []
  const base = query.replace(/\.[a-z]{2,}$/i, '').toLowerCase().trim()
  if (!base) return []
  return tlds.map(tld => ({
    domain: `${base}${tld.name}`,
    tld: tld.name,
    price: tld.price,
    available: true,
    popular: tld.popular,
  }))
}

// ==================== COMPONENT ====================
const Domains = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searched, setSearched] = useState('')
  const [openFaq, setOpenFaq] = useState(0)

  const results = useMemo(
    () => buildSearchResults(searched, DOMAIN_EXTENSIONS),
    [searched]
  )

  const handleSearch = e => {
    e.preventDefault()
    setSearched(searchTerm.trim())
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearched('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">
      {/* ============================================================
          HERO + SEARCH (light gradient, mirrors Home hero)
          ============================================================ */}
      <section className="relative isolate w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-14">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[11px] sm:text-xs font-bold">
              <Sparkles size={13} />
              Domain Registration
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-primary-900">
              Secure Your Digital Identity
              <span className="block text-primary-600">with MaPrims Domains</span>
            </h1>

            {/* Description */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-gray-600 max-w-2xl mx-auto">
              Search, register, and manage domains across 50+ TLDs — with free WHOIS
              privacy, easy DNS control, and instant activation.
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
                    <p className="text-[10px] sm:text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Search bar — white surface card */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-6">
              <div className="bg-white rounded-2xl p-2 shadow-xl shadow-primary-900/10 border border-primary-100 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search for your dream domain (e.g., mybrand)"
                    className="w-full pl-10 pr-9 py-3 text-sm bg-gray-50 text-gray-900 rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-bold rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  Search Domain
                </button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-2 mt-3 text-[11px] text-gray-500">
                <span className="opacity-75">Popular:</span>
                {DOMAIN_EXTENSIONS.filter(t => t.popular).slice(0, 4).map(tld => (
                  <button
                    key={tld.name}
                    type="button"
                    onClick={() => {
                      setSearchTerm('mybrand')
                      setSearched('mybrand')
                    }}
                    className="px-2.5 py-1 bg-white rounded-full border border-primary-200 text-primary-700 font-semibold hover:bg-primary-50 transition-colors"
                  >
                    {tld.name}
                  </button>
                ))}
              </div>
            </form>

            {/* Search results */}
            {searched && (
              <div className="mt-6 text-left max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-primary-100">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <p className="text-xs font-semibold text-gray-700">
                    Results for “{searched}”
                  </p>
                  <button
                    onClick={clearSearch}
                    className="text-[11px] text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {results.map(r => (
                    <div
                      key={r.domain}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-primary-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {r.domain}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {r.tld} · Available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary-700">
                          ₹{r.price.toLocaleString('en-IN')}
                          <span className="text-[10px] font-normal text-gray-500">/yr</span>
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <p className="px-4 py-6 text-xs text-center text-gray-500">
                      No results — try a different name.
                    </p>
                  )}
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500 text-center">
                  Prices per year. Renewals may vary by TLD.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stat strip — matches Home's dark primary strip */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-gradient-to-r from-primary-900 to-primary-600 rounded-lg sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl">
            {STATS.map((stat, idx) => (
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
          TLD PRICING
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-transparent">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              TLD Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              Find the Right Extension for Your Brand
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              Transparent yearly pricing across 50+ TLDs. All prices include free WHOIS privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {DOMAIN_EXTENSIONS.map(tld => (
              <div
                key={tld.name}
                className="group relative bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${tld.color} flex items-center justify-center text-white font-bold text-sm shadow`}>
                      {tld.name.replace('.', '').toUpperCase()}
                    </div>
                    {tld.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-accent-500 to-accent-600 rounded-full shadow">
                        {tld.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900">
                      ₹{tld.price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-gray-500">per year</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{tld.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-green-600 font-semibold inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Available
                  </span>
                  <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700">
                    Register <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            Don't see your preferred TLD?{' '}
            <Link to="/contact" className="text-primary-600 font-semibold hover:underline">
              Contact us
            </Link>{' '}
            — we can register many more extensions on request.
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Everything Included
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              Every Domain Comes With
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              All the essentials you need to launch and grow — no hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={i}
                  className="group bg-gray-50/80 rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-3 shadow">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Get Online in Minutes
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              Register Your Domain in 4 Simple Steps
            </h2>
            <p className="text-xs sm:text-base text-gray-600 max-w-3xl mx-auto">
              From search to launch — we keep it simple and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { step: '01', icon: Search,     title: 'Search',    desc: 'Check availability across 50+ TLDs.' },
              { step: '02', icon: CreditCard, title: 'Checkout',  desc: 'Secure payment, instant confirmation.' },
              { step: '03', icon: Settings,   title: 'Configure', desc: 'Point DNS to your host in one click.' },
              { step: '04', icon: Globe,      title: 'Go Live',   desc: 'Your domain is live in minutes.' },
            ].map(s => {
              const Icon = s.icon
              return (
                <div
                  key={s.step}
                  className="relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                >
                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[11px] font-black flex items-center justify-center shadow">
                    {s.step}
                  </div>
                  <Icon className="w-5 h-5 text-primary-500 mb-2 mt-1" />
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          TRUST / WHY US
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-accent-100 text-accent-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-accent-200">
                <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Why MaPrims Domains
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
                Domains Backed by a Technology Partner
              </h2>
              <p className="text-xs sm:text-base text-gray-600 mb-4 leading-relaxed">
                Registering a domain is the first step. We're also the team that builds
                your website, hosts your services, and supports you long after launch.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Free WHOIS privacy on all domains',
                  'Easy DNS panel — no technical knowledge needed',
                  'Secure renewals with reminders',
                  'Bundle with web development & hosting',
                  '24/7 support from a real tech team',
                  'Full ownership — transfer out anytime',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                >
                  <Server className="w-3.5 h-3.5" />
                  Explore Web Development
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Talk to Us
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100 p-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: TrendingUp, label: 'Domains', value: '500+' },
                  { icon: Users,      label: 'Happy Clients', value: '50+' },
                  { icon: Award,      label: 'Uptime', value: '99.9%' },
                  { icon: Star,       label: 'Support', value: '24/7' },
                ].map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div
                      key={i}
                      className="bg-white rounded-lg p-3 border border-white shadow-sm text-center"
                    >
                      <Icon className="w-4 h-4 text-primary-600 mx-auto mb-1" />
                      <p className="text-lg font-black text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                        {s.label}
                      </p>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-gray-500 mt-3 text-center leading-relaxed">
                MaPrims is a technology partner — not just a domain registrar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <section className="py-10 sm:py-14 bg-gradient-to-br from-slate-50 via-primary-50/30 to-indigo-50/20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 border border-primary-200">
              <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-gray-900 mb-2 sm:mb-3">
              Common Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-2">
            {FAQS.map((faq, i) => {
              const open = openFaq === i
              return (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-semibold text-gray-900 pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-4 pb-3 text-xs text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
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
            <Globe className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">Ready to Go Online?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">
            Claim Your Domain Today
          </h2>
          <p className="text-xs sm:text-base text-primary-100 mb-4 max-w-2xl mx-auto leading-relaxed">
            Search, register, and go live in minutes. Or reach out and we'll help you
            choose the right domain, hosting, and website for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-700 bg-white rounded-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Search a Domain
            </button>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-black/20 rounded-lg hover:bg-black/30 transition-all border-2 border-white/20 hover:border-white/40 backdrop-blur-sm shadow-md"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Talk to an Expert
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-primary-100 text-[11px]">
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span className="font-semibold">Free WHOIS Privacy</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-white" />
              <span className="font-semibold">Instant Activation</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Headphones className="w-3 h-3 text-white" />
              <span className="font-semibold">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppFloatingIcon />
    </div>
  )
}

export default Domains
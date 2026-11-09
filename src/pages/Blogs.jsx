// src/pages/Blogs.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Calendar,
  Tag,
  ChevronRight,
  Mail,
  Send,
  CheckCircle,
  Clock,
  TrendingUp,
  Heart,
  BookOpen,
  Sparkles,
  Newspaper,
  Filter,
  X,
  Linkedin,
  Twitter,
  Facebook,
  Globe,
  Briefcase,
  Lock,
  Zap,
  Headphones,
} from 'lucide-react'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'
import { blogAPI } from '../services/api'

// ==================== HERO HIGHLIGHTS (mirrors Home hero) ====================
const HERO_HIGHLIGHTS = [
  { icon: BookOpen, title: 'Practical Guides', desc: 'Real-world, no-fluff articles' },
  { icon: TrendingUp, title: 'Industry Trends', desc: 'What’s shaping digital business' },
  { icon: Sparkles, title: 'Expert Insights', desc: 'Written by the MaPrims team' },
  { icon: Headphones, title: 'Weekly Updates', desc: 'Fresh content, every week' },
]

// Helper: get initials from full name
const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper: format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Helper: truncate text
const truncate = (str, max = 100) => {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ==================== SKELETON ====================
const BlogsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col animate-pulse"
      >
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-36 w-full" />
        <div className="p-3 flex flex-col gap-2">
          <div className="h-2.5 bg-gray-200 rounded w-1/3" />
          <div className="h-3.5 bg-gray-200 rounded w-4/5" />
          <div className="h-3.5 bg-gray-200 rounded w-3/5" />
          <div className="h-2.5 bg-gray-200 rounded w-full" />
          <div className="h-2.5 bg-gray-200 rounded w-5/6" />
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200" />
              <div className="space-y-1">
                <div className="h-2 w-16 bg-gray-200 rounded" />
                <div className="h-2 w-10 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-4 w-14 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

const Blogs = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(9)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)
  const [newsletterError, setNewsletterError] = useState('')

  // API state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [blogs, setBlogs] = useState([])

  // Fetch published blogs from API
  useEffect(() => {
    let cancelled = false

    const fetchPublishedBlogs = async () => {
      try {
        setLoading(true)
        const payload = {
          page: 1,
          limit: 100,
          filters: { status: 'published' },
          search: '',
          searchFields: ['title', 'excerpt', 'content', 'tags'],
          sortBy: 'published_at',
          sortOrder: 'DESC',
        }
        const response = await blogAPI.getAll(payload)
        if (cancelled) return

        const raw = response?.data?.data ?? response?.data ?? []
        const apiBlogs = Array.isArray(raw) ? raw : []

        const transformedBlogs = apiBlogs.map(blog => ({
          id: blog.blog_id || blog.id,
          title: blog.title || 'Untitled',
          excerpt: truncate(
            blog.excerpt || (blog.content ? blog.content.slice(0, 150) : ''),
            120
          ),
          content: blog.content,
          author: blog.author?.full_name || blog.author_name || 'MaPrims Team',
          authorAvatar: getInitials(
            blog.author?.full_name || blog.author_name || 'MaPrims'
          ),
          date: blog.published_at || blog.created_at,
          readTime: `${blog.read_time || 3} min read`,
          image:
            blog.featured_image ||
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          category: (Array.isArray(blog.tags) && blog.tags[0]) || 'Insights',
        }))

        setBlogs(transformedBlogs)
        setError(null)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to fetch blogs:', err)
        setError('Unable to load articles. Please try again later.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPublishedBlogs()
    return () => {
      cancelled = true
    }
  }, [])

  // Filter blogs based on search (title, excerpt, tags)
  const filteredBlogs = useMemo(() => {
    if (!searchTerm.trim()) return blogs
    const term = searchTerm.toLowerCase()
    return blogs.filter(
      blog =>
        blog.title.toLowerCase().includes(term) ||
        blog.excerpt.toLowerCase().includes(term) ||
        blog.tags.some(tag => tag.toLowerCase().includes(term))
    )
  }, [blogs, searchTerm])

  const visibleBlogs = filteredBlogs.slice(0, visibleCount)
  const hasMore = visibleCount < filteredBlogs.length

  const loadMore = useCallback(() => setVisibleCount(prev => prev + 6), [])
  const clearSearch = useCallback(() => setSearchTerm(''), [])

  const handleNewsletterSubmit = useCallback(
    e => {
      e.preventDefault()
      if (!newsletterEmail || !newsletterEmail.includes('@')) {
        setNewsletterError('Please enter a valid email address')
        return
      }
      setNewsletterError('')
      setNewsletterSubmitted(true)
      setTimeout(() => {
        setNewsletterSubmitted(false)
        setNewsletterEmail('')
      }, 3000)
    },
    [newsletterEmail]
  )

  // Trending: latest 3 posts
  const trendingPosts = useMemo(
    () =>
      [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [blogs]
  )

  // Popular tags: top 12 from all blogs
  const allTags = useMemo(
    () => Array.from(new Set(blogs.flatMap(b => b.tags))).slice(0, 12),
    [blogs]
  )

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-indigo-50/10">
      {/* ============================================================
          HERO — light gradient, mirrors Home/Domains/Services
          ============================================================ */}
      <section className="relative isolate w-full overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-14">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[11px] sm:text-xs font-bold">
              <Newspaper size={13} />
              Insights & Updates
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-primary-900">
              Tech Insights &
              <span className="block text-primary-600">Business Perspectives</span>
            </h1>

            {/* Description */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-gray-600 max-w-2xl mx-auto">
              Practical articles on IT services, digital transformation, domain strategy,
              custom development, cloud, and AI — written by the MaPrims team.
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

            {/* Search — white surface card */}
            <div className="max-w-xl mx-auto mt-6">
              <div className="relative bg-white rounded-xl p-2 shadow-xl shadow-primary-900/10 border border-primary-100">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search articles by title, topic, or tag..."
                  className="w-full px-9 py-2.5 text-sm bg-gray-50 text-gray-900 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Filter Bar */}
            {searchTerm && (
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    Filtered by: <strong>“{searchTerm}”</strong>
                  </span>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Blog Grid */}
            {loading ? (
              <BlogsSkeleton />
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  No articles found
                </h3>
                <p className="text-xs text-gray-600">
                  Try adjusting your search or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {visibleBlogs.map(blog => (
                  <article
                    key={blog.id}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-primary-200 hover:-translate-y-1 flex flex-col"
                  >
                    {blog.image && (
                      <div className="h-36 overflow-hidden bg-gray-100">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {blog.tags.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary-100 text-primary-800">
                            {blog.tags[0]}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Clock className="w-2.5 h-2.5" />
                          {blog.readTime}
                        </div>
                      </div>
                      <h2 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h2>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-3 flex-1">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                            {blog.authorAvatar}
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-gray-900">
                              {blog.author}
                            </p>
                            <p className="text-[9px] text-gray-500">
                              {formatDate(blog.date)}
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/blog/${blog.id}`}
                          className="text-primary-600 hover:text-primary-700 text-[11px] font-medium inline-flex items-center gap-0.5"
                        >
                          Read More <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {hasMore && !loading && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-all text-xs font-semibold shadow-sm"
                >
                  Load More Articles <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-4">
            {/* Trending */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <h3 className="text-sm font-black text-gray-900">Trending Now</h3>
              </div>
              <div className="space-y-2">
                {trendingPosts.length === 0 ? (
                  <p className="text-[11px] text-gray-500">
                    No trending articles yet.
                  </p>
                ) : (
                  trendingPosts.map(post => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.id}`}
                      className="flex gap-2 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                    >
                      {post.image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={post.image}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {post.readTime}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-accent-600" />
                </div>
                <h3 className="text-sm font-black text-gray-900">Popular Tags</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.length === 0 ? (
                  <p className="text-[11px] text-gray-500">No tags yet.</p>
                ) : (
                  allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="px-2 py-0.5 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-full text-[10px] font-medium transition-colors"
                    >
                      #{tag}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <h3 className="text-sm font-black text-gray-900">Recent Posts</h3>
              </div>
              <div className="space-y-2">
                {blogs.length === 0 ? (
                  <p className="text-[11px] text-gray-500">
                    No recent posts yet.
                  </p>
                ) : (
                  blogs.slice(0, 4).map(blog => (
                    <Link
                      key={blog.id}
                      to={`/blog/${blog.id}`}
                      className="flex gap-2 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                    >
                      {blog.image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={blog.image}
                            alt={blog.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">
                          {blog.title}
                        </h4>
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          {formatDate(blog.date)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 rounded-xl p-3 shadow-lg text-white">
              <div className="flex items-center gap-1.5 mb-2">
                <Mail className="w-4 h-4 text-accent-300" />
                <h3 className="text-sm font-black">Subscribe</h3>
              </div>
              <p className="text-[11px] text-primary-100 mb-3">
                Get the latest insights delivered to your inbox.
              </p>
              {newsletterSubmitted ? (
                <div className="text-center py-2">
                  <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-1" />
                  <p className="text-xs font-semibold">Thanks!</p>
                  <p className="text-[10px] text-primary-200">
                    You'll hear from us soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-2 py-1.5 text-xs rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-400"
                    required
                  />
                  {newsletterError && (
                    <p className="text-red-200 text-[9px]">{newsletterError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition-all text-[11px]"
                  >
                    <Send className="w-3 h-3" /> Subscribe
                  </button>
                </form>
              )}
              <p className="text-[9px] text-primary-200 mt-2 text-center">
                No spam, unsubscribe anytime.
              </p>
            </div>

            {/* CTA — Services */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="w-9 h-9 rounded-lg bg-primary-100 mx-auto mb-1 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                Need IT Services?
              </h3>
              <p className="text-[11px] text-gray-600 mb-2">
                From custom development to cloud — let's talk.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-semibold"
              >
                Explore Services <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* CTA — Domains */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="w-9 h-9 rounded-lg bg-accent-100 mx-auto mb-1 flex items-center justify-center">
                <Globe className="w-4 h-4 text-accent-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                Secure Your Domain
              </h3>
              <p className="text-[11px] text-gray-600 mb-2">
                Register or transfer a domain in minutes.
              </p>
              <Link
                to="/domains"
                className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700 text-xs font-semibold"
              >
                Register a Domain <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Connect */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <div className="w-9 h-9 rounded-lg bg-red-50 mx-auto mb-1 flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">
                Enjoyed the content?
              </h3>
              <p className="text-[11px] text-gray-600 mb-2">
                Follow us for more updates
              </p>
              <div className="flex justify-center gap-2">
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#0077B5] transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#1DA1F2] transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#1877F2] transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <WhatsAppFloatingIcon />
    </div>
  )
}

export default Blogs
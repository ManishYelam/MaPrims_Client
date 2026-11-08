// src/pages/Blogs.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Calendar,
  User,
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
  ArrowRight,
  Newspaper,
  Filter,
  X,
  Linkedin,
  Twitter,
  Facebook,
  Loader2,
} from 'lucide-react'
import WhatsAppFloatingIcon from '../components/ui/WhatsAppFloatingIcon'
import { blogAPI } from '../services/api'

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
    const fetchPublishedBlogs = async () => {
      try {
        setLoading(true)
        const payload = {
          page: 1,
          limit: 100, // fetch a reasonable amount; adjust as needed
          filters: {
            status: 'published',
          },
          search: '',
          searchFields: ['title', 'excerpt', 'content', 'tags'],
          sortBy: 'published_at',
          sortOrder: 'DESC',
        }
        const response = await blogAPI.getAll(payload)
        const apiBlogs = response.data?.data || []

        // Transform API data to match component structure
        const transformedBlogs = apiBlogs.map(blog => ({
          id: blog.blog_id,
          title: blog.title,
          excerpt: truncate(blog.excerpt || blog.content?.slice(0, 150) || '', 120),
          content: blog.content,
          author: blog.author?.full_name || 'Anonymous',
          authorAvatar: getInitials(blog.author?.full_name),
          date: blog.published_at,
          readTime: `${blog.read_time || 3} min read`,
          image: blog.featured_image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
          tags: blog.tags || [],
          category: blog.tags?.[0] || 'Tech', // fallback category from first tag
        }))

        setBlogs(transformedBlogs)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch blogs:', err)
        setError('Unable to load blog posts. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedBlogs()
  }, [])

  // Filter blogs based on search (title, excerpt, tags)
  const filteredBlogs = useMemo(() => {
    if (!searchTerm.trim()) return blogs
    const term = searchTerm.toLowerCase()
    return blogs.filter(blog =>
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
      // Simulate API call
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
    () => [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [blogs]
  )

  // Popular tags: top 12 from all blogs
  const allTags = useMemo(
    () => Array.from(new Set(blogs.flatMap(b => b.tags))).slice(0, 12),
    [blogs]
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Hero Section – full width with responsive padding */}
      <section className="relative py-12 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-10 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        </div>
        <div className="relative w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 mb-4">
            <Newspaper className="w-3.5 h-3.5 text-accent-300" />
            <span className="text-[11px] font-semibold text-white">Insights & Updates</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white mb-2">
            Tech Insights &
            <span className="block bg-gradient-to-r from-accent-400 to-accent-600 bg-clip-text text-transparent">
              Industry Trends
            </span>
          </h1>
          <p className="text-sm text-primary-100 max-w-2xl mx-auto mb-6">
            Stay ahead with expert articles, tutorials, and the latest news from SAP, AI, Cloud,
            Fullstack, and Web development.
          </p>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="w-full px-3 py-2 pl-9 text-sm bg-white rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content – full width container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Filter Bar – compact (search indicator only) */}
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

            {/* Blog Grid – responsive columns */}
            {filteredBlogs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">No articles found</h3>
                <p className="text-xs text-gray-600">
                  Try adjusting your search or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {visibleBlogs.map(blog => (
                  <article
                    key={blog.id}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col"
                  >
                    {blog.image && (
                      <div className="h-36 overflow-hidden">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        {/* Display first tag as badge */}
                        {blog.tags.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
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
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                            {blog.authorAvatar}
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-gray-900">{blog.author}</p>
                            <p className="text-[9px] text-gray-500">{formatDate(blog.date)}</p>
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

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-all text-xs font-semibold"
                >
                  Load More Articles <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar – keep fixed width, stays compact */}
          <aside className="lg:w-64 space-y-4 flex-shrink-0">
            {/* Trending */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary-500" /> Trending Now
              </h3>
              <div className="space-y-2">
                {trendingPosts.map(post => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="flex gap-2 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                  >
                    {post.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{post.readTime}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-primary-500" /> Popular Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="px-1.5 py-0.5 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-full text-[10px] font-medium transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-500" /> Recent Posts
              </h3>
              <div className="space-y-2">
                {blogs.slice(0, 4).map(blog => (
                  <Link
                    key={blog.id}
                    to={`/blog/${blog.id}`}
                    className="flex gap-2 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                  >
                    {blog.image && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2">
                        {blog.title}
                      </h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{formatDate(blog.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl p-3 shadow-lg text-white">
              <div className="flex items-center gap-1.5 mb-2">
                <Mail className="w-4 h-4 text-accent-300" />
                <h3 className="text-sm font-bold">Subscribe</h3>
              </div>
              <p className="text-[11px] text-primary-100 mb-3">
                Get the latest insights delivered to your inbox.
              </p>
              {newsletterSubmitted ? (
                <div className="text-center py-2">
                  <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-1" />
                  <p className="text-xs font-semibold">Thanks!</p>
                  <p className="text-[10px] text-primary-200">You'll hear from us soon.</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-2 py-1 text-xs rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent-400"
                    required
                  />
                  {newsletterError && <p className="text-red-200 text-[9px]">{newsletterError}</p>}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-100 transition-all text-[11px]"
                  >
                    <Send className="w-3 h-3" /> Subscribe
                  </button>
                </form>
              )}
              <p className="text-[9px] text-primary-200 mt-2 text-center">
                No spam, unsubscribe anytime.
              </p>
            </div>

            {/* Write for Us */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <Sparkles className="w-6 h-6 text-primary-500 mx-auto mb-1" />
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">Write for Us</h3>
              <p className="text-[11px] text-gray-600 mb-2">
                Share your expertise with our community.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-semibold"
              >
                Become a Contributor
              </Link>
            </div>

            {/* Connect */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
              <Heart className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">Enjoyed the content?</h3>
              <p className="text-[11px] text-gray-600 mb-2">Follow us for more updates</p>
              <div className="flex justify-center gap-2">
                <a href="#" className="text-gray-400 hover:text-[#0077B5] transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#1877F2] transition-colors">
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
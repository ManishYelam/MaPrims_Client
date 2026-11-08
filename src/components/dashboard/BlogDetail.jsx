// src/components/blog/BlogDetail.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { blogAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Calendar, User, Eye, Heart, Clock, ArrowLeft, ChevronDown, ChevronUp,
  MessageCircle, Facebook, Twitter, Linkedin, Link as LinkIcon, BookOpen, FolderOpen,
  Star, Users, Share2,   // ✅ Share2 and other icons added
  // Note: PlayCircle, Shield are imported but not used – can be removed if not needed
} from 'lucide-react'

// Loading skeleton (compact version)
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    <div className="bg-gradient-to-r from-primary-900 to-primary-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
        <div className="grid lg:grid-cols-2 gap-8 mt-6">
          <div className="aspect-video bg-white/10 rounded-2xl animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-8 bg-white/20 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded w-5/6 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const ErrorState = ({ title, message, actions }) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center max-w-md">
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex gap-3 justify-center">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              action.variant === 'primary'
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  </div>
)

// Mobile Accordion (compact)
const MobileAccordion = ({ tabs }) => {
  const [openTab, setOpenTab] = useState(null)
  return (
    <div className="space-y-2">
      {tabs.map((tab, idx) => (
        <div key={tab.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setOpenTab(openTab === idx ? null : idx)}
            className="w-full flex items-center justify-between p-3 text-left font-medium text-gray-900 hover:bg-gray-50"
          >
            <span className="flex items-center gap-1.5"><span className="text-base">{tab.icon}</span> <span className="text-sm">{tab.label}</span></span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openTab === idx ? 'rotate-180' : ''}`} />
          </button>
          {openTab === idx && <div className="p-3 pt-0 border-t">{tab.content}</div>}
        </div>
      ))}
    </div>
  )
}

const BlogDetail = () => {
  const { blog_id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('article')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [recentPosts, setRecentPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [imageLoaded, setImageLoaded] = useState(false)

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }, [])

  const getPreviewContent = useCallback((content, limit = 400) => {
    if (!content) return ''
    const stripped = content.replace(/<[^>]*>/g, '')
    if (stripped.length <= limit) return content
    return stripped.substring(0, limit) + '...'
  }, [])

  const fetchBlog = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await blogAPI.getById(blog_id, { incrementView: true })
      const blogData = response.data?.data || response.data
      if (!blogData) throw new Error('Blog not found')
      setBlog(blogData)
      setLikeCount(blogData.like_count || 0)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Blog not found or unavailable')
    } finally {
      setLoading(false)
    }
  }, [blog_id])

  const fetchSidebarData = useCallback(async () => {
    try {
      const [recentRes, categoriesRes] = await Promise.all([
        blogAPI.getAll({ page: 1, limit: 5, filters: { status: 'published' }, sortBy: 'published_at', sortOrder: 'DESC' }),
        blogAPI.getCategories?.() || Promise.resolve({ data: [] })
      ])
      setRecentPosts(recentRes.data?.data || [])
      setCategories(categoriesRes.data || [])
    } catch (err) {
      console.error('Sidebar data error:', err)
    }
  }, [])

  useEffect(() => {
    fetchBlog()
    fetchSidebarData()
  }, [fetchBlog, fetchSidebarData])

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/blogs/${blog_id}` } })
      return
    }
    if (liked) return
    try {
      await blogAPI.like(blog_id)
      setLikeCount(prev => prev + 1)
      setLiked(true)
    } catch (err) {
      console.error(err)
    }
  }, [blog_id, isAuthenticated, liked, navigate])

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: blog?.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }, [blog])

  const handleSocialShare = useCallback((platform) => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(blog?.title || '')
    let shareUrl = ''
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    else if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`
    else if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?u=${url}`
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400')
  }, [blog])

  const scrollToContent = () => {
    const element = document.getElementById('blog-content')
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }

  const tabConfig = useMemo(() => [
    {
      id: 'article',
      label: 'Article',
      icon: '📖',
      content: (
        <div id="blog-content">
          <div className="prose prose-base max-w-none" dangerouslySetInnerHTML={{ __html: expanded ? blog.content : getPreviewContent(blog?.content) }} />
          {(blog?.content?.length > 400) && (
            <button onClick={() => setExpanded(!expanded)} className="mt-3 text-primary-600 text-sm font-medium flex items-center">
              {expanded ? <>Show Less <ChevronUp className="w-3.5 h-3.5 ml-1" /></> : <>Read More <ChevronDown className="w-3.5 h-3.5 ml-1" /></>}
            </button>
          )}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex gap-3">
              <button onClick={handleLike} className={`flex items-center gap-1 text-sm transition ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {likeCount}
              </button>
              <button className="flex items-center gap-1 text-sm text-gray-500"><MessageCircle className="w-4 h-4" /> {blog?.comment_count || 0}</button>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => handleSocialShare('facebook')}><Facebook className="w-3.5 h-3.5 text-gray-500 hover:text-blue-600"/></button>
              <button onClick={() => handleSocialShare('twitter')}><Twitter className="w-3.5 h-3.5 text-gray-500 hover:text-blue-400"/></button>
              <button onClick={() => handleSocialShare('linkedin')}><Linkedin className="w-3.5 h-3.5 text-gray-500 hover:text-blue-700"/></button>
              <button onClick={handleShare}><LinkIcon className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700"/></button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: '💬',
      content: (
        <div className="text-center py-6 text-gray-500">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Comments section coming soon.</p>
        </div>
      )
    }
  ], [blog, expanded, getPreviewContent, handleLike, handleShare, handleSocialShare, liked, likeCount])

  if (loading) return <LoadingSkeleton />
  if (error || !blog) {
    return (
      <ErrorState
        title="Blog Not Found"
        message={error || 'The blog post you are looking for does not exist.'}
        actions={[
          { label: 'Browse Blogs', onClick: () => navigate('/blogs'), variant: 'primary' },
          { label: 'Try Again', onClick: () => window.location.reload(), variant: 'secondary' }
        ]}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section – matches ServiceHero */}
      <div className="relative bg-gradient-to-r from-primary-900 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-repeat" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <button onClick={() => navigate('/blogs')} className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blogs
          </button>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left column: Image */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-video bg-gray-800 relative">
                {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-gray-700" />}
                <img
                  src={blog.featured_image || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=400&fit=crop'}
                  alt={blog.title}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=400&fit=crop')}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              </div>
            </div>

            {/* Right column: Content */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.9</span>
                  <span className="text-sm text-white/70">(24 reviews)</span>
                </div>
                <span className="text-white/30">•</span>
                <div className="flex items-center gap-1 text-sm text-white/80">
                  <Users className="w-4 h-4" />
                  <span>{blog.view_count || 0}+ reads</span>
                </div>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold mb-3">{blog.title}</h1>
              <p className="text-white/90 text-base mb-4 leading-relaxed">
                {blog.excerpt || (blog.content?.replace(/<[^>]*>/g, '').substring(0, 120) + '...')}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{blog.read_time || 5} min read</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formatDate(blog.published_at || blog.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{blog.author?.full_name || 'Anonymous'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={scrollToContent}
                  className="px-5 py-2.5 bg-white text-primary-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2 text-sm"
                >
                  <BookOpen className="w-4 h-4" /> Read Article
                </button>
                <button
                  onClick={handleLike}
                  className={`p-2.5 rounded-lg border transition-all ${
                    liked
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-white/30 text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid – tabs and sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Desktop Tabs */}
            <div className="hidden lg:block">
              <div className="flex overflow-x-auto border-b border-gray-200 mb-4 scrollbar-hide">
                {tabConfig.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-fadeIn">
                {tabConfig.find(tab => tab.id === activeTab)?.content}
              </div>
            </div>
            {/* Mobile Accordion */}
            <div className="lg:hidden">
              <MobileAccordion tabs={tabConfig} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                <User className="w-4 h-4 text-primary-500" /> About the Author
              </h3>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-base">
                  {blog.author?.full_name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-sm font-medium">{blog.author?.full_name || 'Author'}</p>
                  <p className="text-[11px] text-gray-500">{blog.author?.email || ''}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Passionate writer sharing insights.</p>
            </div>

            {recentPosts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <BookOpen className="w-4 h-4 text-primary-500" /> Recent Posts
                </h3>
                <ul className="space-y-2">
                  {recentPosts.filter(p => p.blog_id !== blog.blog_id).slice(0, 4).map(post => (
                    <li key={post.blog_id}>
                      <Link to={`/blog/${post.blog_id}`} className="hover:text-primary-600 transition">
                        <p className="text-xs font-medium line-clamp-2">{post.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(post.published_at)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {categories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <FolderOpen className="w-4 h-4 text-primary-500" /> Categories
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <Link key={cat.category_id} to={`/blogs?category=${cat.slug}`} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] hover:bg-primary-100 transition">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

export default React.memo(BlogDetail)
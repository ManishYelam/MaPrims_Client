// src/components/admin/BlogManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react'
import {
  Search, Edit, Trash2, FileText, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal,
  Calendar, CheckCircle, AlertCircle, Clock, CheckCircle2, XCircle, RefreshCw,
  Eye, Heart, Tag, BookOpen, Globe, Link as LinkIcon, Calendar as CalendarIcon, Archive,
  Image as ImageIcon
} from 'lucide-react'
import { blogAPI } from '../../services/api'
import { AuthContext } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import BlogModal from '../ui/BlogModal'

// ---------- Helper: Normalize tags ----------
const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags
  if (typeof tags === 'string' && tags.trim()) {
    return tags.split(',').map(t => t.trim()).filter(Boolean)
  }
  return []
}

// ---------- Status Badge ----------
const StatusBadge = React.memo(({ status }) => {
  const config = {
    draft:     { label: 'Draft',     className: 'bg-gray-100 text-gray-800 border border-gray-300' },
    published: { label: 'Published', className: 'bg-green-100 text-green-800 border border-green-300' },
    scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800 border border-blue-300' },
    archived:  { label: 'Archived',  className: 'bg-red-100 text-red-800 border border-red-300' }
  }
  const { label, className } = config[status] || config.draft
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{label}</span>
})
StatusBadge.displayName = 'StatusBadge'

const PriorityBadge = ({ priority }) => {
  const colorMap = {
    high:   'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low:    'bg-gray-100 text-gray-800'
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colorMap[priority] || 'bg-gray-100'}`}>
      {priority || 'medium'}
    </span>
  )
}

// ---------- Main Component ----------
const BlogManagement = () => {
  const { user: authUser } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()

  // Permissions
  const canManage = useMemo(() => isAdmin, [isAdmin])
  const canCreate = useMemo(() => hasPermission('create', 'blogs', 'A2') || canManage, [hasPermission, canManage])
  const canUpdate = useMemo(() => hasPermission('update', 'blogs', 'A2') || canManage, [hasPermission, canManage])
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'blogs', 'A2') || canManage, [hasPermission, canManage])
  const canDelete = useMemo(() => hasPermission('delete', 'blogs', 'A2') || canManage, [hasPermission, canManage])
  const canExport = useMemo(() => hasPermission('export', 'blogs', 'A2') || canManage, [hasPermission, canManage])
  const canImport = useMemo(() => hasPermission('import', 'blogs', 'A2') || canManage, [hasPermission, canManage])
  const canBulk = useMemo(() => hasPermission('bulk', 'blogs', 'A2') || canManage, [hasPermission, canManage])

  // ---------- State ----------
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [allBlogsCount, setAllBlogsCount] = useState(0)
  const [statusCounts, setStatusCounts] = useState({ draft: 0, published: 0, scheduled: 0, archived: 0 })
  const [selectedBlogs, setSelectedBlogs] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showBlogModal, setShowBlogModal] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Filters & pagination
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    tags: '',
    category_id: '',
    minReadTime: '',
    maxReadTime: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 7
  })

  const fetchingRef = useRef(false)
  const abortControllerRef = useRef(null)

  const statusOptions = useMemo(() => [
    { value: 'draft',     label: 'Draft',     color: 'bg-gray-100 text-gray-800' },
    { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
    { value: 'archived',  label: 'Archived',  color: 'bg-red-100 text-red-800' }
  ], [])

  const tabs = useMemo(() => {
    const allCount = allBlogsCount
    const draftCount     = statusCounts.draft     || 0
    const publishedCount = statusCounts.published || 0
    const scheduledCount = statusCounts.scheduled || 0
    const archivedCount  = statusCounts.archived  || 0
    return [
      { id: 'all',       name: 'All Blogs',     count: allCount,      icon: BookOpen,      color: 'text-gray-600' },
      { id: 'draft',     name: 'Draft',         count: draftCount,     icon: FileText,      color: 'text-gray-600' },
      { id: 'published', name: 'Published',     count: publishedCount, icon: CheckCircle2,  color: 'text-green-600' },
      { id: 'scheduled', name: 'Scheduled',     count: scheduledCount, icon: Clock,         color: 'text-blue-600' },
      { id: 'archived',  name: 'Archived',      count: archivedCount,  icon: Archive,       color: 'text-red-600' }
    ]
  }, [allBlogsCount, statusCounts])

  // ---------- API Fetch ----------
  const fetchBlogs = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      const backendFilters = {}
      if (filters.status !== 'all') backendFilters.status = filters.status
      if (filters.tags) backendFilters.tags = filters.tags
      if (filters.category_id) backendFilters.category_id = parseInt(filters.category_id)
      if (filters.minReadTime) backendFilters.read_time_min = parseInt(filters.minReadTime)
      if (filters.maxReadTime) backendFilters.read_time_max = parseInt(filters.maxReadTime)
      if (filters.fromDate) backendFilters.published_at_gte = new Date(filters.fromDate).toISOString()
      if (filters.toDate) backendFilters.published_at_lte = new Date(filters.toDate).toISOString()

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields: ['title', 'excerpt', 'content', 'tags'],
        filters: backendFilters,
        sortBy: 'published_at',
        sortOrder: 'DESC'
      }
      
      const response = await blogAPI.getAll(payload)
      if (!controller.signal.aborted) {
        const responseData = response.data
        // Normalize tags for each blog
        const blogsData = responseData?.data?.map(blog => ({
          ...blog,
          tags: normalizeTags(blog.tags)
        })) || []
        setBlogs(blogsData)
        setTotalItems(responseData?.totalRecords || 0)
        setTotalPages(responseData?.totalPages || 1)
        const counts = responseData?.counts || {}
        setAllBlogsCount(counts.total || 0)
        setStatusCounts({
          draft: counts.draft || 0,
          published: counts.published || 0,
          scheduled: counts.scheduled || 0,
          archived: counts.archived || 0
        })
        setError(null)
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        console.error('Fetch error:', err)
        setError(err.message || 'Failed to load blogs')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
      fetchingRef.current = false
      if (abortControllerRef.current === controller) abortControllerRef.current = null
    }
  }, [filters])

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await fetchBlogs()
    showToast('Data refreshed', 'success')
  }, [fetchBlogs])

  useEffect(() => { fetchBlogs() }, [fetchBlogs])
  useEffect(() => { setFilters(prev => ({ ...prev, page: 1 })) }, [filters.search, filters.status, filters.limit])

  const displayedBlogs = useMemo(() => blogs, [blogs])

  // ---------- Toast & Confirmation ----------
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  const [confirmationModal, setConfirmationModal] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null, data: null
  })
  const showConfirmation = (title, message, type, onConfirm, data = null) =>
    setConfirmationModal({ show: true, title, message, type, onConfirm, data })
  const hideConfirmation = () => setConfirmationModal({ show: false, title: '', message: '', type: '', onConfirm: null, data: null })
  const handleConfirm = () => {
    if (confirmationModal.onConfirm) confirmationModal.onConfirm(confirmationModal.data)
    hideConfirmation()
  }

  // ---------- Modal handlers ----------
  const openBlogModal = (blog = null) => {
    if (blog && !canUpdate) { showToast('No permission to edit', 'error'); return }
    if (!blog && !canCreate) { showToast('No permission to create', 'error'); return }
    setEditingBlog(blog)
    setShowBlogModal(true)
  }
  const closeBlogModal = () => { setShowBlogModal(false); setEditingBlog(null) }
  const handleBlogSaved = () => { closeBlogModal(); refreshData(); showToast('Blog saved!', 'success') }

  // ---------- Filter UI ----------
  const handleStatusChange = status => setFilters(prev => ({ ...prev, status, page: 1 }))
  const handleSearchChange = value => setFilters(prev => ({ ...prev, search: value, page: 1 }))
  const handleLimitChange = newLimit => setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  const handlePageChange = newPage => { if (newPage >= 1 && newPage <= totalPages) setFilters(prev => ({ ...prev, page: newPage })) }
  const clearAllFilters = () => {
    setFilters({
      search: '', status: 'all', tags: '', category_id: '',
      minReadTime: '', maxReadTime: '', fromDate: '', toDate: '', page: 1, limit: 7
    })
    showToast('Filters cleared', 'info')
  }
  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.status !== 'all' || filters.tags !== '' ||
           filters.category_id !== '' || filters.minReadTime !== '' || filters.maxReadTime !== '' ||
           filters.fromDate !== '' || filters.toDate !== ''
  }, [filters])

  // ---------- Bulk actions ----------
  const toggleBlogSelection = blogId => {
    if (!canBulk) return
    setSelectedBlogs(prev =>
      prev.includes(blogId) ? prev.filter(id => id !== blogId) : [...prev, blogId]
    )
  }
  const toggleSelectAll = () => {
    if (!canBulk) return
    setSelectedBlogs(selectedBlogs.length === displayedBlogs.length ? [] : displayedBlogs.map(b => b.blog_id))
  }
  const handleBulkAction = async () => {
    if (!canBulk) { showToast('No permission for bulk actions', 'error'); return }
    if (!bulkAction || selectedBlogs.length === 0) return
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission to delete', 'error'); return }
        showConfirmation('Delete Blogs', `Delete ${selectedBlogs.length} blog(s)?`, 'bulkDelete', async () => {
          await Promise.all(selectedBlogs.map(id => blogAPI.delete(id)))
          setBulkAction(''); setSelectedBlogs([]); refreshData()
          showToast(`Deleted ${selectedBlogs.length} blogs`, 'success')
        })
      } else {
        if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return }
        await Promise.all(selectedBlogs.map(id => blogAPI.update(id, { status: bulkAction })))
        setBulkAction(''); setSelectedBlogs([]); refreshData()
        showToast(`Updated ${selectedBlogs.length} blogs to ${bulkAction}`, 'success')
      }
    } catch (err) { console.error(err); showToast('Bulk action failed', 'error') }
  }

  // ---------- Individual actions ----------
  const handleStatusUpdate = async (blogId, newStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return }
    try {
      await blogAPI.update(blogId, { status: newStatus })
      refreshData(); showToast('Status updated', 'success')
    } catch (err) { console.error(err); showToast('Update failed', 'error') }
  }
  const handleDeleteBlog = blogId => {
    if (!canDelete) { showToast('No permission', 'error'); return }
    const blog = blogs.find(b => b.blog_id === blogId)
    showConfirmation('Delete Blog', `Delete "${blog?.title}"?`, 'delete', async () => {
      await blogAPI.delete(blogId); refreshData(); showToast('Deleted', 'success')
    })
  }

  // ---------- Export CSV ----------
  const exportToCSV = async () => {
    if (!canExport) { showToast('No permission', 'error'); return }
    if (displayedBlogs.length === 0) { showToast('No data to export', 'error'); return }
    setExportLoading(true)
    try {
      const headers = [
        'ID', 'Title', 'Slug', 'Author', 'Excerpt', 'Content', 'Featured Image', 'Tags', 'Read Time',
        'Status', 'Published At', 'View Count', 'Like Count', 'Comment Count', 'Category ID', 'Meta Title',
        'Meta Description', 'Meta Keywords', 'Created At', 'Updated At'
      ]
      const csvRows = displayedBlogs.map(b => [
        b.blog_id || '',
        `"${(b.title || '').replace(/"/g, '""')}"`,
        b.slug || '',
        `"${(b.author?.full_name || b.author_id || '').replace(/"/g, '""')}"`,
        `"${(b.excerpt || '').replace(/"/g, '""')}"`,
        `"${(b.content || '').replace(/"/g, '""').slice(0, 500)}"`,
        b.featured_image || '',
        // Ensure tags is an array for join
        `"${(Array.isArray(b.tags) ? b.tags : []).join(', ').replace(/"/g, '""')}"`,
        b.read_time || '',
        b.status || (b.is_published ? 'published' : 'draft'),
        b.published_at ? new Date(b.published_at).toISOString() : '',
        b.view_count || 0,
        b.like_count || 0,
        b.comment_count || 0,
        b.category_id || '',
        `"${(b.meta_title || '').replace(/"/g, '""')}"`,
        `"${(b.meta_description || '').replace(/"/g, '""')}"`,
        `"${(b.meta_keywords || '').replace(/"/g, '""')}"`,
        b.createdAt ? new Date(b.createdAt).toISOString() : '',
        b.updatedAt ? new Date(b.updatedAt).toISOString() : ''
      ])
      const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `blogs_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      showToast(`Exported ${displayedBlogs.length} blogs`, 'success')
    } catch (err) { console.error(err); showToast('Export failed', 'error') }
    finally { setExportLoading(false) }
  }

  // ---------- Import CSV ----------
  const generateSampleCSV = () => {
    if (!canImport) { showToast('No permission', 'error'); return }
    const sampleData = [
      ['title', 'slug', 'content', 'excerpt', 'tags', 'read_time', 'status', 'category_id'],
      ['My First Blog', 'my-first-blog', 'This is content...', 'Short excerpt', 'react,javascript', '5', 'published', '1'],
      ['Another Post', 'another-post', 'More content...', 'Another excerpt', 'nodejs', '7', 'draft', '2']
    ]
    const csvContent = sampleData.map(row => row.map(f => `"${f}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'blog_import_template.csv'
    link.click()
    showToast('Sample CSV downloaded', 'info')
  }

  const handleFileUpload = async event => {
    if (!canImport) { showToast('No permission', 'error'); return }
    const file = event.target.files[0]; if (!file) return
    if (!file.name.endsWith('.csv')) { showToast('Only CSV files', 'error'); return }
    setImportLoading(true)
    try {
      const text = await file.text(); const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) throw new Error('Empty CSV')
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const required = ['title', 'content', 'status']
      const missing = required.filter(r => !headers.includes(r))
      if (missing.length) throw new Error(`Missing headers: ${missing.join(', ')}`)
      const blogsToImport = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        if (values.length !== headers.length) throw new Error(`Row ${i+1} column mismatch`)
        const row = {}; headers.forEach((h, idx) => { row[h] = values[idx] })
        const validated = {
          title: row.title,
          slug: row.slug || row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          content: row.content,
          excerpt: row.excerpt || '',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          read_time: parseInt(row.read_time) || 5,
          status: row.status || 'draft',
          category_id: row.category_id ? parseInt(row.category_id) : null
        }
        if (!validated.title) throw new Error(`Row ${i+1}: title required`)
        if (!validated.content) throw new Error(`Row ${i+1}: content required`)
        const validStatuses = ['draft', 'published', 'scheduled', 'archived']
        if (!validStatuses.includes(validated.status))
          throw new Error(`Row ${i+1}: invalid status (draft, published, scheduled, archived)`)
        blogsToImport.push(validated)
      }
      for (const blogData of blogsToImport) {
        await blogAPI.create(blogData)
      }
      showToast(`Imported ${blogsToImport.length} blogs`, 'success')
      setShowImportModal(false); refreshData()
    } catch (err) { showToast(`Import failed: ${err.message}`, 'error') }
    finally { setImportLoading(false); event.target.value = '' }
  }

  // ---------- Helper functions ----------
  const formatDate = dateString => dateString ? new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'Unknown'
  const truncate = (str, max = 50) => str?.length > max ? str.slice(0, max) + '…' : str || '-'

  // ---------- Loading Skeleton ----------
  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {canBulk && <th className="px-3 py-2 w-8"></th>}
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Title / Slug</th>
              <th className="px-3 py-2">Author</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2">Read</th>
              <th className="px-3 py-2">Views / Likes</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Published</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: filters.limit }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {canBulk && <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-3"></div></td>}
                <td className="px-3 py-2"><div className="w-8 h-8 bg-gray-200 rounded"></div></td>
                <td className="px-3 py-2"><div className="h-4 bg-gray-200 rounded w-32"></div><div className="h-3 bg-gray-100 rounded w-24 mt-1"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-24"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-16"></div></td>
                <td className="px-3 py-2"><div className="h-5 bg-gray-200 rounded w-14"></div></td>
                <td className="px-3 py-2"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                <td className="px-3 py-2"><div className="h-6 bg-gray-200 rounded w-12"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ---------- Render ----------
  return (
    <div className="space-y-3 p-3 pt-0">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${
          toast.type === 'success' ? 'bg-green-50 border-green-200' :
          toast.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage and monitor all blog posts</p></div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          {canImport && (
            <>
              <button onClick={generateSampleCSV} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs">
                <FileText className="w-2.5 h-2.5"/> Sample
              </button>
              <button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs">
                <Upload className="w-2.5 h-2.5"/> Import
              </button>
            </>
          )}
          {canExport && (
            <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs">
              <Download className="w-2.5 h-2.5"/> {exportLoading ? 'Exporting...' : 'Export All'}
            </button>
          )}
          <button onClick={refreshData} disabled={refreshing} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs">
            <RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`}/> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canCreate && (
            <button onClick={() => openBlogModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded text-xs shadow-sm">
              <Plus className="w-2.5 h-2.5"/> New Blog
            </button>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && canImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Import Blogs</h3>
              <button onClick={() => setShowImportModal(false)}><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">CSV Format:</h4>
                <ul className="text-xs list-disc list-inside">
                  <li>Required: title, content, status</li>
                  <li>Optional: slug, excerpt, tags (comma separated), read_time, category_id</li>
                  <li>Status: draft, published, scheduled, archived</li>
                </ul>
              </div>
              <button onClick={generateSampleCSV} className="mb-4 flex items-center gap-1 px-3 py-2 text-xs border rounded">
                Download Template
              </button>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} className="hidden"/>
                <label htmlFor="csv-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                  <p className="text-sm font-medium">Upload CSV File</p>
                  <p className="text-xs text-gray-500">Click to browse</p>
                </label>
              </div>
              {importLoading && <div className="mt-4 text-center">Importing...</div>}
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
        <div className="p-3 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                    className={`px-2 py-1 text-xs font-medium rounded-sm flex items-center gap-1 ${
                      filters.status === tab.id ? 'bg-white text-primary-600 shadow-xs' : 'text-gray-600 hover:bg-gray-200'
                    }`}>
                    <Icon className={`w-3 h-3 ${filters.status === tab.id ? tab.color : ''}`}/> {tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full ${
                      filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>{tab.count}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {canBulk && selectedBlogs.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border rounded px-1.5 py-0.5">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="draft">Set Draft</option>
                        <option value="published">Set Published</option>
                        <option value="scheduled">Set Scheduled</option>
                        <option value="archived">Set Archived</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded text-xs">
                    Apply
                  </button>
                  <span className="text-xs text-primary-700">{selectedBlogs.length} selected</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                <SlidersHorizontal className="w-3 h-3"/> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3"/>
                <input type="text" placeholder="Search blogs..." value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border rounded text-xs w-full sm:w-40"/>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Tags (comma)</label>
                  <input type="text" value={filters.tags} onChange={e => setFilters(prev => ({ ...prev, tags: e.target.value, page: 1 }))}
                    className="w-full px-2 py-1 text-xs border rounded" placeholder="react, nodejs"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Category ID</label>
                  <input type="number" value={filters.category_id} onChange={e => setFilters(prev => ({ ...prev, category_id: e.target.value, page: 1 }))}
                    className="w-full px-2 py-1 text-xs border rounded"/>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Read Time (min)</label>
                  <div className="flex gap-1">
                    <input type="number" placeholder="Min" value={filters.minReadTime} onChange={e => setFilters(prev => ({ ...prev, minReadTime: e.target.value, page: 1 }))}
                      className="w-full px-2 py-1 text-xs border rounded"/>
                    <span className="text-xs self-center">–</span>
                    <input type="number" placeholder="Max" value={filters.maxReadTime} onChange={e => setFilters(prev => ({ ...prev, maxReadTime: e.target.value, page: 1 }))}
                      className="w-full px-2 py-1 text-xs border rounded"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Published Date</label>
                  <div className="flex gap-1">
                    <input type="date" value={filters.fromDate} onChange={e => setFilters(prev => ({ ...prev, fromDate: e.target.value, page: 1 }))}
                      className="w-full px-2 py-1 text-xs border rounded"/>
                    <span className="text-xs self-center">to</span>
                    <input type="date" value={filters.toDate} onChange={e => setFilters(prev => ({ ...prev, toDate: e.target.value, page: 1 }))}
                      className="w-full px-2 py-1 text-xs border rounded"/>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs font-medium mb-1">Per Page</label>
                <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-20 px-2 py-1 text-xs border rounded">
                  <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                </select>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded mt-2">
                  <div className="flex flex-wrap gap-1 text-xs">
                    Active Filters:
                    {filters.search && <span className="bg-blue-100 px-1 rounded">Search: {filters.search} <button onClick={() => handleSearchChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.status !== 'all' && <span className="bg-blue-100 px-1 rounded">Status: {statusOptions.find(s=>s.value===filters.status)?.label} <button onClick={()=>handleStatusChange('all')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.tags && <span className="bg-blue-100 px-1 rounded">Tags: {filters.tags} <button onClick={()=>setFilters(prev=>({...prev,tags:''}))}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.category_id && <span className="bg-blue-100 px-1 rounded">Cat: {filters.category_id} <button onClick={()=>setFilters(prev=>({...prev,category_id:''}))}><X className="w-2.5 h-2.5"/></button></span>}
                    {(filters.minReadTime || filters.maxReadTime) && <span className="bg-blue-100 px-1 rounded">Read: {filters.minReadTime && `≥${filters.minReadTime}`}{filters.minReadTime && filters.maxReadTime && ' – '}{filters.maxReadTime && `≤${filters.maxReadTime}`} <button onClick={()=>setFilters(prev=>({...prev,minReadTime:'',maxReadTime:''}))}><X className="w-2.5 h-2.5"/></button></span>}
                    {(filters.fromDate || filters.toDate) && <span className="bg-blue-100 px-1 rounded">Date: {filters.fromDate} – {filters.toDate} <button onClick={()=>setFilters(prev=>({...prev,fromDate:'',toDate:''}))}><X className="w-2.5 h-2.5"/></button></span>}
                  </div>
                  <button onClick={clearAllFilters} className="text-xs text-blue-600">Clear All</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table with Image Column */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading || refreshing ? <LoadingSkeleton /> : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Filter className="w-4 h-4 text-red-500"/></div>
                <h3 className="text-sm font-bold">Unable to Load Blogs</h3><p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={refreshData} className="px-2 py-1 bg-primary-500 text-white rounded text-xs">Try Again</button>
              </div>
            </div>
          ) : displayedBlogs.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    {canBulk && <th className="px-3 py-2 w-8"><input type="checkbox" checked={selectedBlogs.length === displayedBlogs.length && displayedBlogs.length > 0} onChange={toggleSelectAll} className="rounded w-3 h-3" disabled={!canBulk}/></th>}
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Image</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Title / Slug</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Author</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Tags</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Read</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Views / Likes</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Published</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBlogs.map(blog => (
                    <tr key={blog.blog_id} className="hover:bg-gray-50">
                      {canBulk && <td className="px-3 py-2"><input type="checkbox" checked={selectedBlogs.includes(blog.blog_id)} onChange={() => toggleBlogSelection(blog.blog_id)} className="rounded w-3 h-3"/></td>}
                      {/* Image column */}
                      <td className="px-3 py-2">
                        {blog.featured_image ? (
                          <img 
                            src={blog.featured_image} 
                            alt={blog.title}
                            className="w-8 h-8 rounded object-cover bg-gray-100"
                            onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; e.target.nextSibling?.style?.removeProperty('display'); }}
                          />
                        ) : null}
                        {!blog.featured_image && (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs font-medium text-gray-900">{truncate(blog.title, 40)}</div>
                        <div className="text-[10px] text-gray-500">/{blog.slug}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">{blog.author?.full_name || blog.author_id || '-'}</td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex flex-wrap gap-0.5">
                          {/* tags is now always an array after normalization */}
                          {blog.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center px-1 py-0 rounded bg-gray-100 text-gray-700 text-[10px]">
                              <Tag className="w-2 h-2 mr-0.5"/>{tag}
                            </span>
                          ))}
                          {blog.tags.length > 2 && <span className="text-[10px] text-gray-400">+{blog.tags.length-2}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">{blog.read_time} min</td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3 text-gray-400"/>{blog.view_count || 0}</span>
                          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-red-400"/>{blog.like_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {canUpdateStatus ? (
                          <select value={blog.status} onChange={e => handleStatusUpdate(blog.blog_id, e.target.value)}
                            className={`text-xs rounded-full border-0 focus:ring-1 px-1.5 py-0.5 ${
                              blog.status === 'published' ? 'bg-green-100 text-green-800' :
                              blog.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                              blog.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="archived">Archived</option>
                          </select>
                        ) : <StatusBadge status={blog.status} />}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {blog.published_at ? (
                          <div className="flex items-center gap-0.5"><CalendarIcon className="w-2.5 h-2.5"/>{formatDate(blog.published_at)}</div>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-0.5">
                          {canUpdate && <button onClick={() => openBlogModal(blog)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded"><Edit className="w-3 h-3"/></button>}
                          {canDelete && <button onClick={() => handleDeleteBlog(blog.blog_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded"><Trash2 className="w-3 h-3"/></button>}
                          <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 p-0.5 rounded">
                            <Globe className="w-3 h-3"/>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><FileText className="w-4 h-4 text-gray-400"/></div>
                <h3 className="text-sm font-medium">No blogs found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No matches. Adjust filters.' : 'Create your first blog.'}</p>
                {canCreate && <button onClick={() => openBlogModal()} className="bg-primary-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto"><Plus className="w-2.5 h-2.5"/> New Blog</button>}
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <div className="border-t bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2 gap-2">
                <div className="text-xs text-gray-600">
                  Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, totalItems)} of {totalItems}
                </div>
                <div className="flex items-center space-x-0.5">
                  <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronsLeft className="w-3 h-3"/></button>
                  <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 border rounded"><ChevronLeft className="w-3 h-3"/></button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = totalPages <= 5 ? i + 1 : (filters.page <= 3 ? i + 1 : (filters.page >= totalPages - 2 ? totalPages - 4 + i : filters.page - 2 + i))
                    return (
                      <button key={p} onClick={() => handlePageChange(p)}
                        className={`w-6 h-6 text-xs rounded border ${filters.page === p ? 'bg-primary-600 text-white' : 'hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 border rounded"><ChevronRight className="w-3 h-3"/></button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 border rounded"><ChevronsRight className="w-3 h-3"/></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blog Modal */}
      <BlogModal show={showBlogModal} blog={editingBlog} onClose={closeBlogModal} onSaved={handleBlogSaved} />

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className={`p-1.5 rounded-full ${confirmationModal.type.includes('delete') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                <AlertCircle className="w-3.5 h-3.5"/>
              </div>
              <div><h3 className="text-sm font-semibold">{confirmationModal.title}</h3><p className="text-xs text-gray-600">This action cannot be undone</p></div>
            </div>
            <div className="p-3"><p className="text-xs text-gray-700">{confirmationModal.message}</p></div>
            <div className="flex justify-end gap-2 p-3 border-t">
              <button onClick={hideConfirmation} className="px-2 py-1 text-xs border rounded">Cancel</button>
              <button onClick={handleConfirm} className={`px-2 py-1 text-xs text-white rounded ${confirmationModal.type.includes('delete') ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogManagement
// src/components/admin/ProposalsManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react'
import {
  Search, Edit, Trash2, FileText, Filter, X, Plus, Download, Upload,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal,
  Calendar, CheckCircle, AlertCircle, Sparkles, Clock, CheckCircle2,
  XCircle, RefreshCw, Users, Mail, Phone, Globe, Link as LinkIcon,
} from 'lucide-react'
import { proposalAPI } from '../../services/api'
import { AuthContext } from '../../context/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import ProposalsModal from '../ui/ProposalsModal'

// ---------- Status badge ----------
const StatusBadge = React.memo(({ status }) => {
  const colorMap = {
    pending:   'bg-yellow-100 text-yellow-800 border border-yellow-300',
    reviewed:  'bg-blue-100 text-blue-800 border border-blue-300',
    contacted: 'bg-purple-100 text-purple-800 border border-purple-300',
    completed: 'bg-green-100 text-green-800 border border-green-300',
    rejected:  'bg-red-100 text-red-800 border border-red-300',
  }
  const labelMap = {
    pending:   'Pending',
    reviewed:  'Reviewed',
    contacted: 'Contacted',
    completed: 'Completed',
    rejected:  'Rejected',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
      {labelMap[status] || status}
    </span>
  )
})
StatusBadge.displayName = 'StatusBadge'

// ---------- Priority badge ----------
const PriorityBadge = ({ priority }) => {
  const colorMap = {
    high:   'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low:    'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${colorMap[priority] || 'bg-gray-100'}`}>
      {priority || 'medium'}
    </span>
  )
}

// ---------- Main Component ----------
const ProposalsManagement = () => {
  const { user: authUser } = useContext(AuthContext)
  const { hasPermission, isAdmin } = usePermissions()

  const canManage = useMemo(() => isAdmin, [isAdmin])
  const canCreate = useMemo(() => hasPermission('create', 'proposals', 'A2') || canManage, [hasPermission, canManage])
  const canUpdate = useMemo(() => hasPermission('update', 'proposals', 'A2') || canManage, [hasPermission, canManage])
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'proposals', 'A2') || canManage, [hasPermission, canManage])
  const canDelete = useMemo(() => hasPermission('delete', 'proposals', 'A2') || canManage, [hasPermission, canManage])
  const canExport = useMemo(() => hasPermission('export', 'proposals', 'A2') || canManage, [hasPermission, canManage])
  const canImport = useMemo(() => hasPermission('import', 'proposals', 'A2') || canManage, [hasPermission, canManage])
  const canBulk = useMemo(() => hasPermission('bulk', 'proposals', 'A2') || canManage, [hasPermission, canManage])

  // ---------- State ----------
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [proposals, setProposals] = useState([])
  const [totalItems, setTotalItems] = useState(0)            // filtered total (for pagination)
  const [totalPages, setTotalPages] = useState(1)
  const [allProposalsCount, setAllProposalsCount] = useState(0)  // total in DB (for "All" tab)
  const [statusCounts, setStatusCounts] = useState({})
  const [selectedProposals, setSelectedProposals] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showProposalsModal, setShowProposalsModal] = useState(false)
  const [editingProposal, setEditingProposal] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Filters & pagination
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    minAmount: '',
    maxAmount: '',
    page: 1,
    limit: 7,
  })

  const fetchingRef = useRef(false)
  const abortControllerRef = useRef(null)

  const statusOptions = useMemo(
    () => [
      { value: 'pending',   label: 'Pending',   color: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
      { value: 'reviewed',  label: 'Reviewed',  color: 'bg-blue-100 text-blue-800 border border-blue-300' },
      { value: 'contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-800 border border-purple-300' },
      { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 border border-green-300' },
      { value: 'rejected',  label: 'Rejected',  color: 'bg-red-100 text-red-800 border border-red-300' },
    ],
    []
  )

  // Tabs – "All" uses allProposalsCount (total in DB), others use status_counts (filtered)
  const tabs = useMemo(() => {
    const allCount = allProposalsCount
    const pendingCount   = statusCounts.pending || 0
    const reviewedCount  = statusCounts.reviewed || 0
    const contactedCount = statusCounts.contacted || 0
    const completedCount = statusCounts.completed || 0
    const rejectedCount  = statusCounts.rejected || 0
    return [
      { id: 'all', name: 'All Proposals', count: allCount, icon: FileText, color: 'text-gray-600' },
      { id: 'pending',   name: 'Pending',   count: pendingCount,   icon: Clock,        color: 'text-yellow-600' },
      { id: 'reviewed',  name: 'Reviewed',  count: reviewedCount,  icon: CheckCircle,  color: 'text-blue-600' },
      { id: 'contacted', name: 'Contacted', count: contactedCount, icon: Users,        color: 'text-purple-600' },
      { id: 'completed', name: 'Completed', count: completedCount, icon: CheckCircle2, color: 'text-green-600' },
      { id: 'rejected',  name: 'Rejected',  count: rejectedCount,  icon: XCircle,      color: 'text-red-600' },
    ]
  }, [allProposalsCount, statusCounts])

  // ---------- Single API call (no duplicate) ----------
  const fetchProposals = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    if (abortControllerRef.current) abortControllerRef.current.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      const backendFilters = {}
      if (filters.status !== 'all') {
        backendFilters.status = filters.status
      }
      const searchFieldsString = ['name', 'company', 'service', 'message', 'email', 'phone'].join(',')
      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields: searchFieldsString,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        filters: backendFilters,
      }
      const response = await proposalAPI.getProposals(payload)
      if (!controller.signal.aborted) {
        setProposals(response.data?.proposals || [])
        setTotalItems(response.data?.total || 0)
        setTotalPages(response.data?.total_pages || 1)
        setAllProposalsCount(response.data?.all_proposals_count || 0)
        const countsArray = response.data?.status_counts || []
        const countsObj = {}
        countsArray.forEach(item => { countsObj[item.status] = item.count })
        setStatusCounts(countsObj)
        setError(null)
      }
    } catch (err) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        console.error('Fetch error:', err)
        setError(err.message || 'Failed to load proposals')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
      fetchingRef.current = false
      if (abortControllerRef.current === controller) abortControllerRef.current = null
    }
  }, [filters.page, filters.limit, filters.search, filters.status])

  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await fetchProposals()
    showToast('Data refreshed', 'success')
  }, [fetchProposals])

  useEffect(() => { fetchProposals() }, [fetchProposals])
  useEffect(() => { setFilters(prev => ({ ...prev, page: 1 })) }, [filters.search, filters.status, filters.limit])

  // Client-side amount filtering (on current page)
  const displayedProposals = useMemo(() => {
    let result = [...proposals]
    const min = filters.minAmount ? parseFloat(filters.minAmount) : null
    const max = filters.maxAmount ? parseFloat(filters.maxAmount) : null
    if (min !== null || max !== null) {
      result = result.filter(p => {
        const amount = parseFloat(p.budget) || 0
        if (min !== null && amount < min) return false
        if (max !== null && amount > max) return false
        return true
      })
    }
    return result
  }, [proposals, filters.minAmount, filters.maxAmount])

  // ---------- Toast & Confirmation ----------
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }

  const [confirmationModal, setConfirmationModal] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null, data: null,
  })
  const showConfirmation = (title, message, type, onConfirm, data = null) =>
    setConfirmationModal({ show: true, title, message, type, onConfirm, data })
  const hideConfirmation = () => setConfirmationModal({ show: false, title: '', message: '', type: '', onConfirm: null, data: null })
  const handleConfirm = () => {
    if (confirmationModal.onConfirm) confirmationModal.onConfirm(confirmationModal.data)
    hideConfirmation()
  }

  // ---------- Modal handlers ----------
  const openProposalsModal = (proposal = null) => {
    if (proposal && !canUpdate) { showToast('No permission to edit', 'error'); return }
    if (!proposal && !canCreate) { showToast('No permission to create', 'error'); return }
    setEditingProposal(proposal)
    setShowProposalsModal(true)
  }
  const closeProposalsModal = () => { setShowProposalsModal(false); setEditingProposal(null) }
  const handleProposalSaved = () => { closeProposalsModal(); refreshData(); showToast('Proposal saved!', 'success') }

  // ---------- Filter UI ----------
  const handleStatusChange = status => setFilters(prev => ({ ...prev, status, page: 1 }))
  const handleSearchChange = value => setFilters(prev => ({ ...prev, search: value, page: 1 }))
  const handleAmountRangeChange = (min, max) => setFilters(prev => ({ ...prev, minAmount: min || '', maxAmount: max || '', page: 1 }))
  const handleLimitChange = newLimit => setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }))
  const handlePageChange = newPage => { if (newPage >= 1 && newPage <= totalPages) setFilters(prev => ({ ...prev, page: newPage })) }
  const clearAllFilters = () => {
    setFilters({ search: '', status: 'all', minAmount: '', maxAmount: '', page: 1, limit: 5 })
    showToast('Filters cleared', 'info')
  }
  const hasActiveFilters = useMemo(() =>
    filters.search !== '' || filters.status !== 'all' || filters.minAmount !== '' || filters.maxAmount !== '',
    [filters])

  // ---------- Bulk actions ----------
  const toggleProposalSelection = proposalId => {
    if (!canBulk) return
    setSelectedProposals(prev =>
      prev.includes(proposalId) ? prev.filter(id => id !== proposalId) : [...prev, proposalId]
    )
  }
  const toggleSelectAll = () => {
    if (!canBulk) return
    setSelectedProposals(selectedProposals.length === displayedProposals.length ? [] : displayedProposals.map(p => p.service_proposal_id))
  }
  const handleBulkAction = async () => {
    if (!canBulk) { showToast('No permission for bulk actions', 'error'); return }
    if (!bulkAction || selectedProposals.length === 0) return
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission to delete', 'error'); return }
        showConfirmation('Delete Proposals', `Delete ${selectedProposals.length} proposal(s)?`, 'bulkDelete', async () => {
          await Promise.all(selectedProposals.map(id => proposalAPI.deleteProposal(id)))
          setBulkAction(''); setSelectedProposals([]); refreshData()
          showToast(`Deleted ${selectedProposals.length} proposals`, 'success')
        })
      } else {
        if (!canUpdateStatus) { showToast('No permission to update status', 'error'); return }
        await Promise.all(selectedProposals.map(id => proposalAPI.updateProposal(id, { status: bulkAction })))
        setBulkAction(''); setSelectedProposals([]); refreshData()
        showToast(`Updated ${selectedProposals.length} proposals`, 'success')
      }
    } catch (err) { console.error(err); showToast('Bulk action failed', 'error') }
  }

  // ---------- Individual actions ----------
  const handleStatusUpdate = async (proposalId, newStatus) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return }
    try {
      await proposalAPI.updateProposal(proposalId, { status: newStatus })
      refreshData(); showToast('Status updated', 'success')
    } catch (err) { console.error(err); showToast('Update failed', 'error') }
  }
  const handleDeleteProposal = proposalId => {
    if (!canDelete) { showToast('No permission', 'error'); return }
    const proposal = proposals.find(p => p.service_proposal_id === proposalId)
    showConfirmation('Delete Proposal', `Delete "${proposal?.service}"?`, 'delete', async () => {
      await proposalAPI.deleteProposal(proposalId); refreshData(); showToast('Deleted', 'success')
    })
  }

  // ---------- Export CSV (all fields) ----------
  const exportToCSV = async () => {
    if (!canExport) { showToast('No permission', 'error'); return }
    if (displayedProposals.length === 0) { showToast('No data to export', 'error'); return }
    setExportLoading(true)
    try {
      const headers = [
        'ID', 'Name', 'Email', 'Phone', 'Position', 'Company', 'Website', 'Employees',
        'Service', 'Project Type', 'Budget', 'Timeline', 'Message', 'Address', 'City',
        'State', 'Postal Code', 'Country', 'Attachment', 'Contact Method', 'Contact Time',
        'Source', 'Priority', 'Assigned To', 'Status', 'Created By', 'Updated By',
        'Created At', 'Updated At'
      ]
      const csvRows = displayedProposals.map(p => [
        p.service_proposal_id || '',
        `"${(p.name || '').replace(/"/g, '""')}"`,
        p.email || '',
        p.phone || '',
        p.position || '',
        `"${(p.company || '').replace(/"/g, '""')}"`,
        p.website || '',
        p.number_of_employees || '',
        `"${(p.service || '').replace(/"/g, '""')}"`,
        p.project_type || '',
        p.budget || '0',
        p.timeline || '',
        `"${(p.message || '').replace(/"/g, '""')}"`,
        p.address_line || '',
        p.city || '',
        p.state || '',
        p.postal_code || '',
        p.country || '',
        p.attachment_path || '',
        p.preferred_contact_method || '',
        p.preferred_contact_time || '',
        p.source || '',
        p.priority || '',
        p.assigned_to || '',
        p.status || '',
        p.created_by || '',
        p.updated_by || '',
        p.created_at ? new Date(p.created_at).toISOString() : '',
        p.updated_at ? new Date(p.updated_at).toISOString() : '',
      ])
      const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `proposals_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      showToast(`Exported ${displayedProposals.length} proposals`, 'success')
    } catch (err) { console.error(err); showToast('Export failed', 'error') }
    finally { setExportLoading(false) }
  }

  // ---------- Import CSV ----------
  const generateSampleCSV = () => {
    if (!canImport) { showToast('No permission', 'error'); return }
    const sampleData = [
      ['title', 'client_name', 'description', 'status', 'total_amount'],
      ['Website Redesign', 'ABC Corp', 'Complete redesign', 'pending', '2500'],
      ['Marketing Campaign', 'XYZ Ltd', 'Social media campaign', 'reviewed', '5000'],
    ]
    const csvContent = sampleData.map(row => row.map(f => `"${f}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'proposal_import_template.csv'
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
      const required = ['title', 'client_name', 'status', 'total_amount']
      const missing = required.filter(r => !headers.includes(r))
      if (missing.length) throw new Error(`Missing headers: ${missing.join(', ')}`)
      const proposalsToImport = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        if (values.length !== headers.length) throw new Error(`Row ${i+1} column mismatch`)
        const row = {}; headers.forEach((h, idx) => { row[h] = values[idx] })
        const validated = {
          title: row.title,
          client_name: row.client_name,
          description: row.description || '',
          status: row.status || 'pending',
          total_amount: parseFloat(row.total_amount) || 0,
        }
        if (!validated.title) throw new Error(`Row ${i+1}: title required`)
        const validStatuses = ['pending', 'reviewed', 'contacted', 'completed', 'rejected']
        if (!validStatuses.includes(validated.status))
          throw new Error(`Row ${i+1}: invalid status (must be one of: ${validStatuses.join(', ')})`)
        proposalsToImport.push(validated)
      }
      for (const p of proposalsToImport) {
        const formData = new FormData()
        formData.append('name', p.client_name)
        formData.append('email', 'import@example.com')
        formData.append('address_line', 'Imported via CSV')
        formData.append('city', 'Unknown')
        formData.append('state', 'Unknown')
        formData.append('country', 'India')
        formData.append('service', p.title)
        formData.append('budget', p.total_amount.toString())
        formData.append('message', p.description)
        formData.append('status', p.status)
        formData.append('company', p.client_name)
        formData.append('priority', 'medium')
        formData.append('project_type', 'new_project')
        formData.append('source', 'import')
        await proposalAPI.submitProposalRequest(formData)
      }
      showToast(`Imported ${proposalsToImport.length} proposals`, 'success')
      setShowImportModal(false); refreshData()
    } catch (err) { showToast(`Import failed: ${err.message}`, 'error') }
    finally { setImportLoading(false); event.target.value = '' }
  }

  // ---------- Helpers ----------
  const getStatusColor = status => statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700'
  const formatDate = dateString => dateString ? new Date(dateString).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'Unknown'
  const formatCurrency = amount => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(Number(amount) || 0)

  const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {canBulk && <th className="px-2 py-2 w-8"></th>}
              <th className="px-2 py-2">Service / Type</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2">Contact</th>
              <th className="px-2 py-2">Website</th>
              <th className="px-2 py-2">Budget</th>
              <th className="px-2 py-2">Attachment</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Priority</th>
              <th className="px-2 py-2">Created</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: filters.limit }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                {canBulk && <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-3"></div></td>}
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-24"></div></td>
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-28"></div></td>
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-24"></div></td>
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-16"></div></td>
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                <td className="px-2 py-2"><div className="h-5 bg-gray-200 rounded w-14"></div></td>
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-12"></div></td>
                <td className="px-2 py-2"><div className="h-3 bg-gray-200 rounded w-20"></div></td>
                <td className="px-2 py-2"><div className="h-6 bg-gray-200 rounded w-12"></div></td>
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
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200' : toast.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage and monitor all client proposals</p></div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          {canImport && (<><button onClick={generateSampleCSV} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><FileText className="w-2.5 h-2.5"/> Sample</button><button onClick={() => setShowImportModal(true)} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><Upload className="w-2.5 h-2.5"/> Import</button></>)}
          {canExport && (<button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><Download className="w-2.5 h-2.5"/> {exportLoading ? 'Exporting...' : 'Export All'}</button>)}
          <button onClick={refreshData} disabled={refreshing} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs"><RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`}/> {refreshing ? 'Refreshing...' : 'Refresh'}</button>
          {canCreate && (<button onClick={() => openProposalsModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded text-xs shadow-sm"><Plus className="w-2.5 h-2.5"/> New Proposal</button>)}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && canImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex justify-between p-4 border-b"><h3 className="text-lg font-semibold">Import Proposals</h3><button onClick={() => setShowImportModal(false)}><X className="w-5 h-5"/></button></div>
            <div className="p-4">
              <div className="mb-4"><h4 className="text-sm font-medium mb-2">CSV Format:</h4><ul className="text-xs list-disc list-inside"><li>Required: title, client_name, status, total_amount</li><li>Status: pending, reviewed, contacted, completed, rejected</li><li>total_amount: number only</li></ul></div>
              <button onClick={generateSampleCSV} className="mb-4 flex items-center gap-1 px-3 py-2 text-xs border rounded">Download Template</button>
              <div className="border-2 border-dashed rounded-lg p-4 text-center"><input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} className="hidden"/><label htmlFor="csv-upload" className="cursor-pointer block"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2"/><p className="text-sm font-medium">Upload CSV File</p><p className="text-xs text-gray-500">Click to browse</p></label></div>
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
              {tabs.map(tab => { const Icon = tab.icon; return (
                <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                  className={`px-2 py-1 text-xs font-medium rounded-sm flex items-center gap-1 ${filters.status === tab.id ? 'bg-white text-primary-600 shadow-xs' : 'text-gray-600 hover:bg-gray-200'}`}>
                  <Icon className={`w-3 h-3 ${filters.status === tab.id ? tab.color : ''}`}/> {tab.name}
                  <span className={`px-0.5 py-0.5 text-xs rounded-full ${filters.status === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{tab.count}</span>
                </button>
              )})}
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {canBulk && selectedProposals.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border rounded px-1.5 py-0.5">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (
                      <>
                        <option value="pending">Set Pending</option>
                        <option value="reviewed">Set Reviewed</option>
                        <option value="contacted">Set Contacted</option>
                        <option value="completed">Set Completed</option>
                        <option value="rejected">Set Rejected</option>
                      </>
                    )}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded text-xs">Apply</button>
                  <span className="text-xs text-primary-700">{selectedProposals.length} selected</span>
                </div>
              )}
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${showAdvancedFilters || hasActiveFilters ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <SlidersHorizontal className="w-3 h-3"/> Filters {hasActiveFilters && '•'}
              </button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3"/>
                <input type="text" placeholder="Search proposals..." value={filters.search} onChange={e => handleSearchChange(e.target.value)} className="pl-7 pr-2 py-1 border rounded text-xs w-full sm:w-40"/>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-2 pt-2 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Amount Range (₹)</label>
                  <div className="flex gap-1">
                    <input type="number" placeholder="Min" value={filters.minAmount} onChange={e => handleAmountRangeChange(e.target.value, filters.maxAmount)} className="w-full px-2 py-1 text-xs border rounded"/>
                    <span className="text-xs self-center">–</span>
                    <input type="number" placeholder="Max" value={filters.maxAmount} onChange={e => handleAmountRangeChange(filters.minAmount, e.target.value)} className="w-full px-2 py-1 text-xs border rounded"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Per Page</label>
                  <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="w-full px-2 py-1 text-xs border rounded">
                    <option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="25">25</option><option value="50">50</option>
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded mt-2">
                  <div className="flex flex-wrap gap-1 text-xs">
                    Active Filters:
                    {filters.search && <span className="bg-blue-100 px-1 rounded">Search: {filters.search} <button onClick={() => handleSearchChange('')}><X className="w-2.5 h-2.5"/></button></span>}
                    {filters.status !== 'all' && <span className="bg-blue-100 px-1 rounded">Status: {statusOptions.find(s=>s.value===filters.status)?.label} <button onClick={()=>handleStatusChange('all')}><X className="w-2.5 h-2.5"/></button></span>}
                    {(filters.minAmount||filters.maxAmount) && <span className="bg-blue-100 px-1 rounded">Amount: {filters.minAmount && `≥${filters.minAmount}`}{filters.minAmount && filters.maxAmount && ' – '}{filters.maxAmount && `≤${filters.maxAmount}`} <button onClick={()=>handleAmountRangeChange('','')}><X className="w-2.5 h-2.5"/></button></span>}
                  </div>
                  <button onClick={clearAllFilters} className="text-xs text-blue-600">Clear All</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading || refreshing ? <LoadingSkeleton /> : error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Filter className="w-4 h-4 text-red-500"/></div>
                <h3 className="text-sm font-bold">Unable to Load Proposals</h3><p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={refreshData} className="px-2 py-1 bg-primary-500 text-white rounded text-xs">Try Again</button>
              </div>
            </div>
          ) : displayedProposals.length > 0 ? (
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    {canBulk && <th className="px-3 py-2 w-8"><input type="checkbox" checked={selectedProposals.length === displayedProposals.length && displayedProposals.length > 0} onChange={toggleSelectAll} className="rounded w-3 h-3" disabled={!canBulk}/></th>}
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Service / Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Client</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Contact</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Website</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Budget</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Attachment</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Priority</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Created</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProposals.map(proposal => (
                    <tr key={proposal.service_proposal_id} className="hover:bg-gray-50">
                      {canBulk && <td className="px-3 py-2"><input type="checkbox" checked={selectedProposals.includes(proposal.service_proposal_id)} onChange={() => toggleProposalSelection(proposal.service_proposal_id)} className="rounded w-3 h-3"/></td>}
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{proposal.service_proposal_id}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 bg-gray-100 rounded-md flex items-center justify-center"><FileText className="w-3 h-3 text-gray-500"/></div>
                          <div className="text-xs">
                            <div className="font-medium">{proposal.service || 'N/A'}</div>
                            {proposal.project_type && <div className="text-gray-500 text-[10px] capitalize">{proposal.project_type?.replace('_', ' ')}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="font-medium">{proposal.company || proposal.name || 'N/A'}</div>
                          {proposal.position && <div className="text-gray-500 text-[10px]">{proposal.position}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs">
                          {proposal.email && <div className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5"/>{proposal.email}</div>}
                          {proposal.phone && <div className="flex items-center gap-0.5 text-gray-600"><Phone className="w-2.5 h-2.5"/>{proposal.phone}</div>}
                        </div>
                       </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {proposal.website ? (
                          <a href={proposal.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                            <Globe className="w-3 h-3"/> Visit
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-0.5 text-xs font-medium text-gray-900">
                          {formatCurrency(proposal.budget)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {proposal.attachment_path ? (
                          <a href={proposal.attachment_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                            <LinkIcon className="w-3 h-3"/> View
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {canUpdateStatus ? (
                          <select value={proposal.status} onChange={e => handleStatusUpdate(proposal.service_proposal_id, e.target.value)} className={`text-xs rounded-full border-0 focus:ring-1 px-1.5 py-0.5 ${getStatusColor(proposal.status)}`}>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="contacted">Contacted</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : <StatusBadge status={proposal.status} />}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap"><PriorityBadge priority={proposal.priority} /></td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <div className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5"/>{formatDate(proposal.created_at || proposal.createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-0.5">
                          {canUpdate && <button onClick={() => openProposalsModal(proposal)} className="text-gray-600 hover:text-gray-900 p-0.5 rounded"><Edit className="w-3 h-3"/></button>}
                          {canDelete && <button onClick={() => handleDeleteProposal(proposal.service_proposal_id)} className="text-red-600 hover:text-red-900 p-0.5 rounded"><Trash2 className="w-3 h-3"/></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6"><div className="text-center"><div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><FileText className="w-4 h-4 text-gray-400"/></div><h3 className="text-sm font-medium">No proposals found</h3><p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No matches. Adjust filters.' : 'Create your first proposal.'}</p>{canCreate && <button onClick={() => openProposalsModal()} className="bg-primary-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto"><Plus className="w-2.5 h-2.5"/> New Proposal</button>}</div></div>
          )}
          {totalPages > 1 && (
            <div className="border-t bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-2 gap-2">
                <div className="text-xs text-gray-600">
                  Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, totalItems)} of {totalItems}
                </div>
                <div className="flex items-center space-x-0.5">
                  <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 border rounded disabled:opacity-50">
                    <ChevronsLeft className="w-3 h-3"/>
                  </button>
                  <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 border rounded">
                    <ChevronLeft className="w-3 h-3"/>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = totalPages <= 5 ? i + 1 : (filters.page <= 3 ? i + 1 : (filters.page >= totalPages - 2 ? totalPages - 4 + i : filters.page - 2 + i))
                    return (
                      <button key={p} onClick={() => handlePageChange(p)} className={`w-6 h-6 text-xs rounded border ${filters.page === p ? 'bg-primary-600 text-white' : 'hover:bg-gray-50'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 border rounded">
                    <ChevronRight className="w-3 h-3"/>
                  </button>
                  <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 border rounded">
                    <ChevronsRight className="w-3 h-3"/>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proposal Modal */}
      <ProposalsModal show={showProposalsModal} proposal={editingProposal} onClose={closeProposalsModal} onSaved={handleProposalSaved} />

      {/* Confirmation Modal */}
      {confirmationModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="flex items-center gap-2 p-3 border-b">
              <div className={`p-1.5 rounded-full ${confirmationModal.type.includes('delete') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><AlertCircle className="w-3.5 h-3.5"/></div>
              <div><h3 className="text-sm font-semibold">{confirmationModal.title}</h3><p className="text-xs text-gray-600">This action cannot be undone</p></div>
            </div>
            <div className="p-3"><p className="text-xs text-gray-700">{confirmationModal.message}</p></div>
            <div className="flex justify-end gap-2 p-3 border-t"><button onClick={hideConfirmation} className="px-2 py-1 text-xs border rounded">Cancel</button><button onClick={handleConfirm} className={`px-2 py-1 text-xs text-white rounded ${confirmationModal.type.includes('delete') ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirm</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProposalsManagement
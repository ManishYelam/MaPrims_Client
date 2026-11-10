import React, { useState, useEffect, useCallback, useMemo, useContext, lazy, Suspense } from 'react';
import {
  Search, Trash2, FileText, Filter, X, Plus,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal,
  Calendar, File, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Upload, Shield, Copy, Power, Ban, Archive,
} from 'lucide-react';
import { FaFilePdf, FaFileImage, FaFileAlt } from 'react-icons/fa';
import { hrAPI } from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';

const DepartmentSelectionModal = lazy(() => import('../Departments/DepartmentSelectionModal'));
const EmployeeSelectionModal = lazy(() => import('../Employees/EmployeeSelectionModal'));

const documentTypes = ['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id', 'education_certificate', 'experience_letter', 'salary_slip', 'offer_letter', 'employment_contract', 'medical_certificate', 'bank_document', 'tax_document', 'other'];
const documentCategories = ['identity', 'education', 'employment', 'financial', 'medical', 'compliance', 'legal', 'other'];
const documentStatuses = ['active', 'pending_verification', 'verified', 'rejected', 'expired', 'archived'];
const referenceTypes = ['organization', 'department', 'employee'];

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getReferenceName = (doc) => {
  if (doc.organization) return doc.organization.name;
  if (doc.department) return doc.department.name;
  if (doc.employee) {
    const emp = doc.employee;
    return [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.email || `Emp #${emp.emp_id}`;
  }
  return `${doc.reference_type} #${doc.reference_id}`;
};

const getFileTypeFromUrl = url => {
  if (!url) return '';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.pdf')) return 'application/pdf';
  if (lowerUrl.includes('.png')) return 'image/png';
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
  if (lowerUrl.includes('.gif')) return 'image/gif';
  if (lowerUrl.includes('.bmp')) return 'image/bmp';
  if (lowerUrl.includes('.webp')) return 'image/webp';
  if (lowerUrl.includes('.txt')) return 'text/plain';
  if (lowerUrl.includes('.doc')) return 'application/msword';
  if (lowerUrl.includes('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lowerUrl.includes('.xls')) return 'application/vnd.ms-excel';
  if (lowerUrl.includes('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return '';
};

const FileIcon = ({ fileName, fileType, className = 'w-4 h-4' }) => {
  if (!fileName && !fileType) return <File className={`${className} text-gray-300`} />;
  const lowerFileName = fileName ? fileName.toLowerCase() : '';
  const lowerFileType = fileType ? fileType.toLowerCase() : '';

  if (lowerFileName.endsWith('.pdf') || lowerFileType.includes('pdf')) return <FaFilePdf className={`${className} text-red-600`} />;
  if (lowerFileName.endsWith('.png') || lowerFileType.includes('png')) return <FaFileImage className={`${className} text-blue-600`} />;
  if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') || lowerFileType.includes('jpeg') || lowerFileType.includes('jpg')) return <FaFileImage className={`${className} text-green-600`} />;
  if (lowerFileName.endsWith('.gif') || lowerFileType.includes('gif')) return <FaFileImage className={`${className} text-purple-600`} />;
  if (lowerFileName.endsWith('.bmp') || lowerFileType.includes('bmp')) return <FaFileImage className={`${className} text-yellow-600`} />;
  if (lowerFileName.endsWith('.webp') || lowerFileType.includes('webp')) return <FaFileImage className={`${className} text-indigo-600`} />;
  if (lowerFileName.endsWith('.txt') || lowerFileType.includes('text')) return <FaFileAlt className={`${className} text-gray-600`} />;
  if (lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx') || lowerFileType.includes('word')) return <FaFileAlt className={`${className} text-blue-700`} />;
  if (lowerFileName.endsWith('.xls') || lowerFileName.endsWith('.xlsx') || lowerFileType.includes('excel')) return <FaFileAlt className={`${className} text-green-700`} />;
  return <File className={`${className} text-gray-400`} />;
};

const StatusBadge = React.memo(({ status }) => {
  const colorMap = {
    active: 'bg-green-100 text-green-800',
    pending_verification: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-200 text-gray-800',
    archived: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace(/_/g, ' ') || 'active'}
    </span>
  );
});

const TypeBadge = React.memo(({ type }) => {
  const labelMap = {
    aadhaar: 'Aadhaar', pan: 'PAN', passport: 'Passport', driving_license: 'DL',
    voter_id: 'Voter ID', education_certificate: 'Education', experience_letter: 'Experience',
    salary_slip: 'Salary Slip', offer_letter: 'Offer Letter', employment_contract: 'Contract',
    medical_certificate: 'Medical', bank_document: 'Bank', tax_document: 'Tax', other: 'Other'
  };
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize bg-gray-100 text-gray-700">
      {labelMap[type] || type || 'other'}
    </span>
  );
});

const CategoryBadge = React.memo(({ category }) => {
  const colorMap = {
    identity: 'bg-purple-100 text-purple-800',
    education: 'bg-indigo-100 text-indigo-800',
    employment: 'bg-blue-100 text-blue-800',
    financial: 'bg-emerald-100 text-emerald-800',
    medical: 'bg-red-100 text-red-800',
    compliance: 'bg-amber-100 text-amber-800',
    legal: 'bg-gray-100 text-gray-800',
    other: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize whitespace-nowrap ${colorMap[category] || 'bg-gray-100 text-gray-700'}`}>
      {category?.replace(/_/g, ' ') || 'other'}
    </span>
  );
});

/* ────────────────────────────────────────────────────────────────
   DocumentRow — Actions column FIRST, status-aware icons.
     NO View/Eye icon — the file icon cell opens the document instead.
──────────────────────────────────────────────────────────────── */
const DocumentRow = React.memo(({
  doc, isSelected, canDelete, canVerify, canUpdateStatus,
  onSelect, onDelete, onCopy, onRequestAction, selectable,
}) => {
  const fileType = doc.mime_type || getFileTypeFromUrl(doc.file_url) || '';
  const fileName = doc.file_name || doc.original_file_name || '';
  const status = doc.status || 'active';

  const canVerifyNow = canVerify && ['active', 'pending_verification'].includes(status);
  const canRejectNow = canVerify && ['active', 'pending_verification'].includes(status);
  const canArchiveNow = canUpdateStatus && ['active', 'pending_verification'].includes(status);
  const canActivateNow = canUpdateStatus && ['archived', 'rejected', 'expired'].includes(status);

  return (
    <tr onClick={onSelect} className={`hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}>
      <td className="px-2 py-1.5">
        {selectable ? (
          <input type="radio" name="documentSelect" checked={isSelected} onChange={onSelect} className="w-3 h-3" />
        ) : (
          canDelete && (
            <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); onSelect(); }} className="rounded w-3 h-3" />
          )
        )}
      </td>

      {/* ACTIONS — FIRST data column */}
      <td className="px-2 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          {canVerifyNow && (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestAction(doc, 'verify'); }}
              className="inline-flex items-center justify-center w-5 h-5 text-green-600 hover:bg-green-50 rounded"
              title="Verify (reason required)"
            >
              <CheckCircle2 className="w-3 h-3" />
            </button>
          )}

          {canRejectNow && (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestAction(doc, 'reject'); }}
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:bg-red-50 rounded"
              title="Reject (reason required)"
            >
              <Ban className="w-3 h-3" />
            </button>
          )}

          {canArchiveNow && (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestAction(doc, 'archive'); }}
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:bg-gray-100 rounded"
              title="Archive"
            >
              <Archive className="w-3 h-3" />
            </button>
          )}

          {canActivateNow && (
            <button
              onClick={(e) => { e.stopPropagation(); onRequestAction(doc, 'activate'); }}
              className="inline-flex items-center justify-center w-5 h-5 text-green-600 hover:bg-green-50 rounded"
              title="Activate (reason required)"
            >
              <Power className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onCopy(doc); }}
            className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:bg-gray-100 rounded"
            title="Copy Document Info"
          >
            <Copy className="w-3 h-3" />
          </button>

          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(doc.document_id); }}
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:bg-red-50 rounded"
              title="Delete Document"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">
        <div className="capitalize font-medium">{doc.reference_type}</div>
        <div className="text-gray-500 truncate max-w-[120px]">{getReferenceName(doc)}</div>
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.document_id}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px] capitalize">{doc.reference_type}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.reference_id}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.org_id}</td>
      <td className="px-2 py-1.5 whitespace-nowrap">
        <div
          className="flex items-center justify-center cursor-pointer hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            if (doc.file_url) window.open(window.location.origin + doc.file_url, '_blank', 'noopener,noreferrer');
          }}
          title={`Open ${fileName || 'document'} in new tab`}
        >
          <FileIcon fileName={fileName} fileType={fileType} className="w-4 h-4" />
        </div>
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px] font-mono">{doc.document_number || '—'}</td>
      <td className="px-2 py-1.5 whitespace-nowrap"><TypeBadge type={doc.type} /></td>
      <td className="px-2 py-1.5 whitespace-nowrap"><CategoryBadge category={doc.category} /></td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.file_name}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.original_file_name}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px] max-w-[100px] truncate">{doc.file_url}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{formatSize(doc.file_size)}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.mime_type}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.file_extension}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px] max-w-[130px] truncate">{doc.description || '—'}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px] max-w-[130px] truncate">{doc.remarks || '—'}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{formatDate(doc.issue_date)}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{formatDate(doc.expiry_date)}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.reminder_days_before_expiry}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-center">
        {doc.verification_required ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-400 mx-auto" />}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap"><StatusBadge status={doc.status} /></td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.uploaded_by}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{formatDateTime(doc.uploaded_at)}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.verified_by || '—'}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{formatDateTime(doc.verified_at)}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px] max-w-[100px] truncate">{doc.rejection_reason || '—'}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-center">
        {doc.is_confidential ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-400 mx-auto" />}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.version}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.parent_document_id || '—'}</td>
      {/* <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.created_by || '—'}</td> */}
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{formatDateTime(doc.updatedAt || '—')}</td>
      <td className="px-2 py-1.5 whitespace-nowrap text-[10px]">{doc.updated_by || '—'}</td>
    </tr>
  );
});
DocumentRow.displayName = 'DocumentRow';

/* ────────────────────────────────────────────────────────────────
   ActionModal — reason required only for verify / reject / activate.
   Confirm button is HIDDEN until reason is non-empty.
   For 'activate', shows what resulting status will be (derived from
   verification_required).
──────────────────────────────────────────────────────────────── */
const ActionModal = React.memo(({
  open, action, document: doc, reason, setReason, onConfirm, onClose, submitting,
}) => {
  if (!open || !doc) return null;

  const config = {
    verify: { title: 'Verify Document', color: 'green', icon: CheckCircle2, placeholder: 'Enter verification remarks (required)…', confirmLabel: 'Confirm Verify' },
    reject: { title: 'Reject Document', color: 'red', icon: Ban, placeholder: 'Enter rejection reason (required)…', confirmLabel: 'Confirm Reject' },
    activate: { title: 'Activate Document', color: 'green', icon: Power, placeholder: 'Enter activation reason (required)…', confirmLabel: 'Confirm Activate' },
  }[action];

  if (!config) return null;

  const Icon = config.icon;
  const trimmed = (reason || '').trim();
  const canConfirm = trimmed.length > 0 && !submitting;
  const derivedActivateStatus = doc.verification_required ? 'pending_verification' : 'active';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full shadow-xl">
        <div className="flex justify-between p-3 border-b">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.color === 'green' ? 'text-green-600' : 'text-red-600'}`} /> {config.title}
          </h3>
          <button onClick={onClose} disabled={submitting}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3">
          <div className="mb-3 bg-gray-50 p-2 rounded-lg space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Document:</span>
              <span className="font-medium">{doc.document_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium truncate max-w-[180px]">{doc.description || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Current Status:</span>
              <StatusBadge status={doc.status} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Verification Required:</span>
              <span className={`font-medium ${doc.verification_required ? 'text-green-700' : 'text-gray-600'}`}>
                {doc.verification_required ? 'Yes' : 'No'}
              </span>
            </div>
            {action === 'activate' && (
              <div className="flex justify-between text-xs pt-1 border-t">
                <span className="text-gray-600">On activation, status will be:</span>
                <span className="font-medium text-primary-700">
                  {derivedActivateStatus.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>

          <label className="text-xs font-medium mb-1 block">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-xs"
            rows="3"
            placeholder={config.placeholder}
            autoFocus
          />
          {!trimmed && (
            <p className="text-[10px] text-red-500 mt-1">Reason is required to enable the confirm button.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-2.5 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          {trimmed.length > 0 && (
            <button
              onClick={onConfirm}
              disabled={!canConfirm}
              className={`px-2.5 py-1 text-xs text-white rounded ${config.color === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
            >
              {submitting ? 'Processing…' : config.confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
ActionModal.displayName = 'ActionModal';

const DocumentManagement = ({
  entityType,
  entityId,
  onDocumentSelect,
  selectable = false,
}) => {
  const { user_info } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canUpload = useMemo(() => hasPermission('create', 'documents', 'A3') || isAdmin, [hasPermission, isAdmin]);
  const canDelete = useMemo(() => hasPermission('delete', 'documents', 'A3') || isAdmin, [hasPermission, isAdmin]);
  const canVerify = useMemo(() => hasPermission('verify', 'documents', 'A3') || isAdmin, [hasPermission, isAdmin]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'documents', 'A3') || isAdmin, [hasPermission, isAdmin]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});

  const [actionModal, setActionModal] = useState({ open: false, action: null, document: null });
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const generateDocNumber = useCallback(() => `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, []);

  const [uploadMeta, setUploadMeta] = useState({
    reference_type: 'organization',
    reference_id: '',
    type: 'other',
    category: 'other',
    document_number: generateDocNumber(),
    description: '',
    issue_date: '',
    expiry_date: '',
    verification_required: false,
    is_confidential: false,
    parent_document_id: '',
    version: '1.0',
  });

  const [filterRefName, setFilterRefName] = useState('');
  const [uploadRefName, setUploadRefName] = useState('Current Organization');

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [selectionContext, setSelectionContext] = useState(null);

  const [parentDocumentSearch, setParentDocumentSearch] = useState('');
  const [parentDocuments, setParentDocuments] = useState([]);
  const [showParentDocDropdown, setShowParentDocDropdown] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    reference_type: '',
    reference_id: '',
    type: 'all',
    category: 'all',
    status: 'all',
    page: 1,
    limit: 7,
  });

  const searchParentDocuments = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) { setParentDocuments([]); return; }
    try {
      const params = { search: searchTerm, searchFields: 'document_number,description,original_file_name', limit: 10, page: 1 };
      const response = await hrAPI.getAllDocuments(params);
      const payload = response.data;
      if (payload.success !== false) setParentDocuments(payload.documents || []);
    } catch (err) { console.error('Error searching parent documents:', err); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (parentDocumentSearch) searchParentDocuments(parentDocumentSearch);
      else setParentDocuments([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [parentDocumentSearch, searchParentDocuments]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const filterObj = {};
      if (filters.reference_type) {
        filterObj.reference_type = filters.reference_type;
        if (filters.reference_type === 'organization') {
          filterObj.reference_id = filters.reference_id || '';
        } else if (filters.reference_id) {
          filterObj.reference_id = filters.reference_id;
        }
      }
      if (filters.type !== 'all') filterObj.type = filters.type;
      if (filters.category !== 'all') filterObj.category = filters.category;
      if (filters.status !== 'all') filterObj.status = filters.status;

      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        searchFields: 'name,original_file_name,document_number',
        sortBy: 'created_at',
        sortOrder: 'DESC',
        filters: filterObj,
      };
      const response = await hrAPI.getAllDocuments(params);
      const payload = response.data;

      if (payload.success === false) {
        if (payload.message && payload.message.toLowerCase().includes('not found')) {
          setDocuments([]); setTotalItems(0); setTotalPages(1); setError(null);
          return;
        }
        setError(payload.message || 'Failed to load documents');
        setDocuments([]); setTotalItems(0); setTotalPages(1);
        return;
      }

      setDocuments(payload.documents || []);
      setTotalItems(payload.pagination?.totalItems || 0);
      setTotalPages(payload.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const refreshData = useCallback(() => { setRefreshing(true); fetchDocuments(); }, [fetchDocuments]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const toggleDocumentSelection = useCallback((id) => {
    setSelectedDocuments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!canDelete) return;
    setSelectedDocuments(selectedDocuments.length === documents.length ? [] : documents.map(d => d.document_id));
  }, [canDelete, selectedDocuments.length, documents]);

  const handleBulkAction = useCallback(async () => {
    if (!canDelete) { showToast('No permission for bulk actions', 'error'); return; }
    if (!bulkAction || selectedDocuments.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        await Promise.all(selectedDocuments.map(id => hrAPI.deleteDocument(id)));
        showToast(`Deleted ${selectedDocuments.length} documents`, 'success');
      }
      setBulkAction(''); setSelectedDocuments([]); refreshData();
    } catch (err) { showToast('Bulk action failed', 'error'); }
  }, [canDelete, bulkAction, selectedDocuments, refreshData, showToast]);

  const openDeptModal = useCallback((context) => { setSelectionContext(context); setShowDeptModal(true); }, []);
  const openEmpModal = useCallback((context) => { setSelectionContext(context); setShowEmpModal(true); }, []);

  const handleDepartmentSelected = useCallback((dept) => {
    if (!dept) return;
    if (selectionContext === 'filter') {
      setFilters(prev => ({ ...prev, reference_id: dept.dept_id }));
      setFilterRefName(dept.name || `Dept #${dept.dept_id}`);
    } else if (selectionContext === 'upload') {
      setUploadMeta(prev => ({ ...prev, reference_id: dept.dept_id }));
      setUploadRefName(dept.name || `Dept #${dept.dept_id}`);
      clearFieldError('reference_id');
    }
    setShowDeptModal(false); setSelectionContext(null);
  }, [selectionContext]);

  const handleEmployeeSelected = useCallback((emp) => {
    if (!emp) return;
    const name = [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.email || `Emp #${emp.emp_id}`;
    if (selectionContext === 'filter') {
      setFilters(prev => ({ ...prev, reference_id: emp.emp_id }));
      setFilterRefName(name);
    } else if (selectionContext === 'upload') {
      setUploadMeta(prev => ({ ...prev, reference_id: emp.emp_id }));
      setUploadRefName(name);
      clearFieldError('reference_id');
    }
    setShowEmpModal(false); setSelectionContext(null);
  }, [selectionContext]);

  const handleFilterReferenceTypeChange = useCallback((newType) => {
    setFilters(prev => {
      const updated = { ...prev, reference_type: newType };
      if (newType === 'organization') {
        updated.reference_id = user_info?.org_id || '';
        setFilterRefName('Current Organization');
      } else {
        updated.reference_id = '';
        setFilterRefName('');
      }
      return updated;
    });
  }, [user_info?.org_id]);

  const handleUploadReferenceTypeChange = useCallback((newType) => {
    setUploadMeta(prev => {
      const updated = { ...prev, reference_type: newType };
      if (newType === 'organization') { updated.reference_id = ''; setUploadRefName('Current Organization'); }
      else { updated.reference_id = ''; setUploadRefName(''); }
      return updated;
    });
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setUploadErrors(prev => { const n = { ...prev }; delete n[fieldName]; return n; });
  }, []);

  const handleCopyDocument = useCallback((doc) => {
    const docInfo = `
Document Information:
-------------------
Document ID: ${doc.document_id}
Document Number: ${doc.document_number || 'N/A'}
Type: ${doc.type}
Category: ${doc.category}
Description: ${doc.description || 'N/A'}
Status: ${doc.status}
Reference Type: ${doc.reference_type}
Reference ID: ${doc.reference_id}
Reference Name: ${getReferenceName(doc)}
Issue Date: ${formatDate(doc.issue_date)}
Expiry Date: ${formatDate(doc.expiry_date)}
Version: ${doc.version || 'N/A'}
Parent Document: ${doc.parent_document_id || 'N/A'}
File Name: ${doc.original_file_name || doc.file_name || 'N/A'}
File Size: ${formatSize(doc.file_size)}
Verification Required: ${doc.verification_required ? 'Yes' : 'No'}
Confidential: ${doc.is_confidential ? 'Yes' : 'No'}
Uploaded By: ${doc.uploaded_by}
Uploaded At: ${formatDateTime(doc.uploaded_at)}
    `.trim();

    navigator.clipboard.writeText(docInfo).then(() => {
      showToast('Document information copied to clipboard', 'success');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = docInfo;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Document information copied to clipboard', 'success');
    });
  }, [showToast]);

  const validateUploadForm = useCallback(() => {
    const errors = {};
    if (!uploadMeta.reference_type) errors.reference_type = 'Reference type is required';
    if (uploadMeta.reference_type && uploadMeta.reference_type !== 'organization' && !uploadMeta.reference_id) errors.reference_id = 'Reference ID is required';
    if (!uploadMeta.description || !uploadMeta.description.trim()) errors.description = 'Description is required';
    if (!uploadMeta.issue_date) errors.issue_date = 'Issue date is required';
    if (!uploadMeta.expiry_date) errors.expiry_date = 'Expiry date is required';
    if (!uploadFile) errors.file = 'File is required';
    return errors;
  }, [uploadMeta.reference_type, uploadMeta.reference_id, uploadMeta.description, uploadMeta.issue_date, uploadMeta.expiry_date, uploadFile]);

  const handleSearchChange = useCallback((value) => setFilters(prev => ({ ...prev, search: value, page: 1 })), []);
  const handleTypeChange = useCallback((type) => setFilters(prev => ({ ...prev, type, page: 1 })), []);
  const handleCategoryChange = useCallback((category) => setFilters(prev => ({ ...prev, category, page: 1 })), []);
  const handleStatusChange = useCallback((status) => setFilters(prev => ({ ...prev, status, page: 1 })), []);
  const handleLimitChange = useCallback((newLimit) => setFilters(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 })), []);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setFilters(prev => ({ ...prev, page: newPage }));
  }, [totalPages]);

  const hasActiveFilters = useMemo(() =>
    filters.search !== '' || filters.type !== 'all' || filters.category !== 'all' ||
    filters.status !== 'all' || filters.reference_type !== '' || filters.reference_id !== '',
    [filters]
  );

  /* ── Upload: initial status derived from verification_required ── */
  const handleUpload = useCallback(async () => {
    const errors = validateUploadForm();
    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setUploadLoading(true);
    setUploadErrors({});

    const initialStatus = uploadMeta.verification_required ? 'pending_verification' : 'active';

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('reference_type', uploadMeta.reference_type);
    if (uploadMeta.reference_type !== 'organization') {
      formData.append('reference_id', uploadMeta.reference_id);
    }

    // ✅ send derived status
    formData.append('status', initialStatus);

    Object.entries(uploadMeta).forEach(([key, value]) => {
      if (key === 'reference_type' || key === 'reference_id' || key === 'status') return;
      if (value !== '' && value !== false && value !== null) formData.append(key, value);
      else if (key === 'verification_required' && value === false) formData.append(key, false);
      else if (key === 'is_confidential' && value === false) formData.append(key, false);
    });

    try {
      const response = await hrAPI.createDocument(formData);
      const payload = response.data;
      if (payload.success === false) { showToast(payload.message || 'Upload failed', 'error'); return; }

      // ✅ enforce status regardless of backend default
      const newDoc = payload.document || payload.data || null;
      const newDocId = newDoc?.document_id;
      const createdStatus = newDoc?.status;
      if (newDocId && createdStatus !== initialStatus) {
        try {
          await hrAPI.updateDocument(newDocId, { status: initialStatus });
        } catch (e) {
          console.warn('Post-create status sync failed:', e);
        }
      }

      showToast(`Document uploaded (status: ${initialStatus.replace('_', ' ')})`, 'success');
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadErrors({});
      setParentDocumentSearch('');
      setParentDocuments([]);
      setShowParentDocDropdown(false);
      setUploadMeta({
        reference_type: 'organization', reference_id: '', type: 'other', category: 'other',
        document_number: generateDocNumber(), description: '', issue_date: '', expiry_date: '',
        verification_required: false, is_confidential: false, parent_document_id: '', version: '1.0',
      });
      setUploadRefName('Current Organization');
      refreshData();
    } catch (err) {
      showToast('Upload failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setUploadLoading(false);
    }
  }, [uploadFile, uploadMeta, generateDocNumber, refreshData, showToast, validateUploadForm]);

  const handleDelete = useCallback(async (id) => {
    if (!canDelete) return showToast('No permission', 'error');
    try {
      const response = await hrAPI.deleteDocument(id);
      const payload = response.data;
      if (payload.success === false) { showToast(payload.message || 'Delete failed', 'error'); return; }
      showToast('Document deleted', 'success');
      refreshData();
    } catch (err) {
      showToast('Delete failed: ' + (err.response?.data?.message || err.message), 'error');
    }
  }, [canDelete, refreshData, showToast]);

  const handleSelectDocument = useCallback((doc) => { if (selectable) setSelectedDocument(doc); }, [selectable]);
  const confirmSelect = useCallback(() => { if (onDocumentSelect && selectedDocument) onDocumentSelect(selectedDocument); }, [onDocumentSelect, selectedDocument]);

  /* Archive runs directly (no reason modal); verify/reject/activate open reason modal */
  const requestAction = useCallback(async (doc, action) => {
    if (action === 'archive') {
      try {
        const response = await hrAPI.updateDocument(doc.document_id, { status: 'archived' });
        const data = response.data;
        if (data.success === false) { showToast(data.message || 'Archive failed', 'error'); return; }
        showToast('Document archived successfully', 'success');
        refreshData();
      } catch (err) {
        showToast('Archive failed: ' + (err.response?.data?.message || err.message), 'error');
      }
      return;
    }
    setActionModal({ open: true, action, document: doc });
    setActionReason('');
  }, [refreshData, showToast]);

  const closeActionModal = useCallback(() => {
    setActionModal({ open: false, action: null, document: null });
    setActionReason('');
  }, []);

  /* ✅ Activate derives status from verification_required (same rule as upload) */
  const confirmAction = useCallback(async () => {
    const { action, document: doc } = actionModal;
    if (!doc || !action) return;

    const reason = (actionReason || '').trim();
    if (!reason) return;

    const activateStatus = doc.verification_required ? 'pending_verification' : 'active';

    const statusMap = {
      verify: 'verified',
      reject: 'rejected',
      activate: activateStatus,
    };
    const nextStatus = statusMap[action];
    if (!nextStatus) return;

    const payload = { status: nextStatus, remarks: reason };
    if (action === 'reject') payload.rejection_reason = reason;

    setActionSubmitting(true);
    try {
      const response = await hrAPI.updateDocument(doc.document_id, payload);
      const data = response.data;
      if (data.success === false) { showToast(data.message || 'Action failed', 'error'); return; }
      showToast(
        action === 'activate'
          ? `Document activated (status: ${nextStatus.replace('_', ' ')})`
          : `Document ${action}ed successfully`,
        'success'
      );
      closeActionModal();
      refreshData();
    } catch (err) {
      showToast('Action failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setActionSubmitting(false);
    }
  }, [actionModal, actionReason, closeActionModal, refreshData, showToast]);

  if (loading && !refreshing) return null;

  return (
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success' ? 'bg-green-50 border-green-200' : toast.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── TOP TOOLBAR (pinned) ── */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Documents</p></div>
        <div className="flex gap-1 mt-2 lg:mt-0">
          <button onClick={refreshData} disabled={refreshing} className="flex items-center gap-0.5 px-2 py-0.5 border rounded text-xs">
            <RefreshCw className={`w-2.5 h-2.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canUpload && (
            <button onClick={() => { setUploadModalOpen(true); setUploadErrors({}); }} className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 text-white rounded text-xs shadow-sm">
              <Plus className="w-2.5 h-2.5" /> Upload
            </button>
          )}
          {selectable && selectedDocument && (
            <button onClick={confirmSelect} className="flex items-center gap-0.5 px-2 py-0.5 bg-green-600 text-white rounded text-xs">
              <CheckCircle2 className="w-2.5 h-2.5" /> Select
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Card header — tabs + filters (pinned) */}
        <div className="flex-shrink-0 p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {['all', 'aadhaar', 'pan', 'passport', 'other'].map(t => (
                <button key={t} onClick={() => handleTypeChange(t)} className={`px-2 py-1 text-xs font-medium rounded-sm whitespace-nowrap ${filters.type === t ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:bg-gray-200'}`}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {!selectable && canDelete && selectedDocuments.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs border rounded px-1.5 py-0.5">
                    <option value="">Bulk Actions</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction} className="px-1.5 py-0.5 bg-primary-600 text-white rounded text-xs disabled:opacity-50">Apply</button>
                  <span className="text-xs text-primary-700">{selectedDocuments.length} selected</span>
                </div>
              )}
              <select value={filters.reference_type} onChange={e => handleFilterReferenceTypeChange(e.target.value)} className="px-1.5 py-1 border rounded text-xs">
                <option value="">Select…</option>
                {referenceTypes.map(rt => (<option key={rt} value={rt}>{rt}</option>))}
              </select>
              <div className="flex items-center gap-0.5">
                <div
                  className={`px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between ${filters.reference_type === 'organization' || filters.reference_type === '' ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'
                    }`}
                  onClick={() => {
                    if (filters.reference_type === 'department') openDeptModal('filter');
                    else if (filters.reference_type === 'employee') openEmpModal('filter');
                  }}
                >
                  <span className={`truncate max-w-[120px] ${filterRefName ? 'text-gray-900' : 'text-gray-400'}`}>
                    {filterRefName || (filters.reference_type === 'organization' ? 'Current Organization' : filters.reference_type === 'department' ? 'Select Department' : filters.reference_type === 'employee' ? 'Select Employee' : '(all)')}
                  </span>
                </div>
              </div>
              <select value={filters.category} onChange={e => handleCategoryChange(e.target.value)} className="px-1.5 py-1 border rounded text-xs">
                <option value="all">Category</option>
                {documentCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filters.status} onChange={e => handleStatusChange(e.target.value)} className="px-1.5 py-1 border rounded text-xs">
                <option value="all">Status</option>
                {documentStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)} className="px-1.5 py-1 border rounded text-xs">
                <option value="5">5 / page</option><option value="7">7 / page</option>
                <option value="10">10 / page</option><option value="15">15 / page</option>
                <option value="25">25 / page</option><option value="50">50 / page</option>
              </select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search..." value={filters.search} onChange={e => handleSearchChange(e.target.value)} className="pl-7 pr-2 py-1 border rounded text-xs w-36" />
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1 text-xs bg-blue-50 p-1.5 rounded mt-2">
              Active Filters:
              {filters.search && <span className="bg-blue-100 px-1 rounded">Search: {filters.search}<button onClick={() => handleSearchChange('')} className="ml-1"><X className="w-2.5 h-2.5" /></button></span>}
              {filters.type !== 'all' && <span className="bg-blue-100 px-1 rounded">Type: {filters.type}<button onClick={() => handleTypeChange('all')} className="ml-1"><X className="w-2.5 h-2.5" /></button></span>}
              {filters.category !== 'all' && <span className="bg-blue-100 px-1 rounded">Category: {filters.category}<button onClick={() => handleCategoryChange('all')} className="ml-1"><X className="w-2.5 h-2.5" /></button></span>}
              {filters.status !== 'all' && <span className="bg-blue-100 px-1 rounded">Status: {filters.status}<button onClick={() => handleStatusChange('all')} className="ml-1"><X className="w-2.5 h-2.5" /></button></span>}
              {filters.reference_type && <span className="bg-blue-100 px-1 rounded">Ref: {filters.reference_type} #{filters.reference_id}</span>}
            </div>
          )}
        </div>

        {/* Table body — only scroll area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Filter className="w-4 h-4 text-red-500" /></div>
                <h3 className="text-sm font-bold">Unable to Load Documents</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                {canUpload ? (
                  <button onClick={() => setUploadModalOpen(true)} className="px-2 py-1 bg-primary-600 text-white rounded text-xs flex items-center gap-1 mx-auto">
                    <Plus className="w-2.5 h-2.5" /> Upload
                  </button>
                ) : (
                  <button onClick={refreshData} className="px-2 py-1 bg-primary-500 text-white rounded text-xs">Try Again</button>
                )}
              </div>
            </div>
          ) : documents.length > 0 ? (
            <table className="w-full" style={{ minWidth: '2800px' }}>
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1.5 w-8">
                    {!selectable && canDelete && (
                      <input type="checkbox" checked={selectedDocuments.length === documents.length && documents.length > 0} onChange={toggleSelectAll} className="rounded w-3 h-3" />
                    )}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Actions</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Reference</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">ID</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Ref Type</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Ref ID</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Org</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">File</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Doc #</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Type</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Category</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">File Name</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Orig Name</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">File URL</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Size</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">MIME</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Ext</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Description</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Remarks</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Issue</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Expiry</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Reminder</th>
                  <th className="px-2 py-1.5 text-center text-xs font-medium">Verif Req</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Status</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Uploaded By</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Uploaded At</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Verified By</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Verified At</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Reject Reason</th>
                  <th className="px-2 py-1.5 text-center text-xs font-medium">Confid</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Version</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Parent</th>
                  {/* <th className="px-2 py-1.5 text-left text-xs font-medium">Created By</th> */}
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Updated At</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium">Updated By</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <DocumentRow
                    key={doc.document_id}
                    doc={doc}
                    isSelected={selectable ? selectedDocument?.document_id === doc.document_id : selectedDocuments.includes(doc.document_id)}
                    canDelete={canDelete}
                    canVerify={canVerify}
                    canUpdateStatus={canUpdateStatus}
                    onSelect={selectable ? () => handleSelectDocument(doc) : () => toggleDocumentSelection(doc.document_id)}
                    onDelete={handleDelete}
                    onCopy={handleCopyDocument}
                    onRequestAction={requestAction}
                    selectable={selectable}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><FileText className="w-4 h-4 text-gray-400" /></div>
                <h3 className="text-sm font-medium">No documents found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No matches. Adjust filters.' : 'Upload a document to get started.'}</p>
                {canUpload && <button onClick={() => setUploadModalOpen(true)} className="bg-primary-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto"><Plus className="w-2.5 h-2.5" /> Upload</button>}
              </div>
            </div>
          )}
        </div>

        {/* Pagination — pinned at bottom */}
        {totalPages > 1 && documents.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-center px-3 py-1.5 gap-2">
              <div className="text-xs text-gray-600">Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, totalItems)} of {totalItems}</div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 border rounded disabled:opacity-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = totalPages <= 5 ? i + 1 : (filters.page <= 3 ? i + 1 : (filters.page >= totalPages - 2 ? totalPages - 4 + i : filters.page - 2 + i));
                  return (<button key={p} onClick={() => handlePageChange(p)} className={`w-6 h-6 text-xs rounded border ${filters.page === p ? 'bg-primary-600 text-white' : 'hover:bg-gray-50'}`}>{p}</button>);
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 border rounded disabled:opacity-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 border rounded disabled:opacity-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Reason-required action modal (verify / reject / activate) ── */}
      <ActionModal
        open={actionModal.open}
        action={actionModal.action}
        document={actionModal.document}
        reason={actionReason}
        setReason={setActionReason}
        onConfirm={confirmAction}
        onClose={closeActionModal}
        submitting={actionSubmitting}
      />

      {/* ── Upload Modal ── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <button onClick={() => {
                setUploadModalOpen(false);
                setUploadErrors({});
                setParentDocumentSearch('');
                setParentDocuments([]);
                setShowParentDocDropdown(false);
              }}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Document Details</h4>
                <p className="text-xs text-gray-500 mb-3">Fields marked with <span className="text-red-500">*</span> are mandatory</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="text-xs font-medium">Reference Type <span className="text-red-500">*</span></label>
                    <select value={uploadMeta.reference_type} onChange={e => {
                      handleUploadReferenceTypeChange(e.target.value);
                      clearFieldError('reference_type'); clearFieldError('reference_id');
                    }} className={`w-full px-2 py-1 border rounded text-xs ${uploadErrors.reference_type ? 'border-red-500 bg-red-50' : ''}`}>
                      {referenceTypes.map(rt => (<option key={rt} value={rt}>{rt}</option>))}
                    </select>
                    {uploadErrors.reference_type && <p className="text-red-500 text-[10px] mt-0.5">{uploadErrors.reference_type}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium">Reference ID {uploadMeta.reference_type !== 'organization' && <span className="text-red-500">*</span>}</label>
                    <div className="flex items-center gap-1">
                      <div className={`flex-1 px-2 py-1 border rounded text-xs bg-white flex items-center justify-between ${uploadMeta.reference_type === 'organization' ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-50'
                        } ${uploadErrors.reference_id ? 'border-red-500 bg-red-50' : ''}`}
                        onClick={() => {
                          if (uploadMeta.reference_type === 'department') openDeptModal('upload');
                          else if (uploadMeta.reference_type === 'employee') openEmpModal('upload');
                        }}>
                        <span className={uploadRefName ? 'text-gray-900' : 'text-gray-400'}>
                          {uploadRefName || (uploadMeta.reference_type === 'organization' ? 'Current Organization' : uploadMeta.reference_type === 'department' ? 'Select Department' : uploadMeta.reference_type === 'employee' ? 'Select Employee' : '')}
                        </span>
                        {uploadMeta.reference_type !== 'organization' && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                      {uploadRefName && uploadMeta.reference_type !== 'organization' && (
                        <button onClick={() => { setUploadMeta(prev => ({ ...prev, reference_id: '' })); setUploadRefName(''); clearFieldError('reference_id'); }} className="p-0.5 text-gray-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    {uploadErrors.reference_id && <p className="text-red-500 text-[10px] mt-0.5">{uploadErrors.reference_id}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium">Type</label>
                    <select value={uploadMeta.type} onChange={e => setUploadMeta(prev => ({ ...prev, type: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs">
                      {documentTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Category</label>
                    <select value={uploadMeta.category} onChange={e => setUploadMeta(prev => ({ ...prev, category: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs">
                      {documentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Doc Number</label>
                    <input type="text" value={uploadMeta.document_number} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-500" disabled />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Description <span className="text-red-500">*</span></label>
                    <input type="text" value={uploadMeta.description} onChange={e => {
                      setUploadMeta(prev => ({ ...prev, description: e.target.value }));
                      clearFieldError('description');
                    }} className={`w-full px-2 py-1 border rounded text-xs ${uploadErrors.description ? 'border-red-500 bg-red-50' : ''}`} placeholder="Enter description" />
                    {uploadErrors.description && <p className="text-red-500 text-[10px] mt-0.5">{uploadErrors.description}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium">Issue Date <span className="text-red-500">*</span></label>
                    <input type="date" value={uploadMeta.issue_date} onChange={e => {
                      setUploadMeta(prev => ({ ...prev, issue_date: e.target.value }));
                      clearFieldError('issue_date');
                    }} className={`w-full px-2 py-1 border rounded text-xs ${uploadErrors.issue_date ? 'border-red-500 bg-red-50' : ''}`} />
                    {uploadErrors.issue_date && <p className="text-red-500 text-[10px] mt-0.5">{uploadErrors.issue_date}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium">Expiry Date <span className="text-red-500">*</span></label>
                    <input type="date" value={uploadMeta.expiry_date} onChange={e => {
                      setUploadMeta(prev => ({ ...prev, expiry_date: e.target.value }));
                      clearFieldError('expiry_date');
                    }} className={`w-full px-2 py-1 border rounded text-xs ${uploadErrors.expiry_date ? 'border-red-500 bg-red-50' : ''}`} />
                    {uploadErrors.expiry_date && <p className="text-red-500 text-[10px] mt-0.5">{uploadErrors.expiry_date}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs font-medium">Parent Document</label>
                    <div className="relative">
                      <input type="text" value={parentDocumentSearch}
                        onChange={e => { setParentDocumentSearch(e.target.value); setShowParentDocDropdown(true); }}
                        onFocus={() => { if (parentDocuments.length > 0) setShowParentDocDropdown(true); }}
                        placeholder="Search parent document by number or description..."
                        className="w-full px-2 py-1 border rounded text-xs" />
                      {uploadMeta.parent_document_id && (
                        <button onClick={() => { setUploadMeta(prev => ({ ...prev, parent_document_id: '' })); setParentDocumentSearch(''); }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {showParentDocDropdown && parentDocuments.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {parentDocuments.map(doc => (
                            <div key={doc.document_id} className="px-2 py-1.5 hover:bg-gray-100 cursor-pointer text-xs border-b last:border-b-0"
                              onClick={() => {
                                setUploadMeta(prev => ({ ...prev, parent_document_id: doc.document_id }));
                                setParentDocumentSearch(doc.document_number || doc.description || doc.original_file_name || '');
                                setShowParentDocDropdown(false);
                              }}>
                              <div className="font-medium">{doc.document_number || 'No Number'}</div>
                              <div className="text-gray-500 truncate">{doc.description || doc.original_file_name || 'No description'}</div>
                              <div className="text-gray-400 text-[10px]">Version: {doc.version || '1.0'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {uploadMeta.parent_document_id && <p className="text-[10px] text-primary-600 mt-0.5">Parent ID: {uploadMeta.parent_document_id}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium">Version</label>
                    <input type="text" value={uploadMeta.version} onChange={e => setUploadMeta(prev => ({ ...prev, version: e.target.value }))} className="w-full px-2 py-1 border rounded text-xs" placeholder="1.0" />
                  </div>

                  <div className="col-span-3 flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={uploadMeta.verification_required}
                        onChange={e => setUploadMeta(prev => ({ ...prev, verification_required: e.target.checked }))}
                        className="w-3 h-3"
                        id="verification-required"
                      />
                      <label htmlFor="verification-required" className="text-xs">
                        Verification Required
                        <span className="ml-1 text-gray-500">
                          (initial status will be <strong className="text-gray-700">{uploadMeta.verification_required ? 'pending_verification' : 'active'}</strong>)
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={uploadMeta.is_confidential} onChange={e => setUploadMeta(prev => ({ ...prev, is_confidential: e.target.checked }))} className="w-3 h-3" id="is-confidential" />
                      <label htmlFor="is-confidential" className="text-xs">Confidential Document</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${uploadErrors.file ? 'border-red-500 bg-red-50' : ''}`}>
                <input type="file" id="doc-upload" className="hidden"
                  onChange={(e) => { setUploadFile(e.target.files[0]); clearFieldError('file'); }}
                  disabled={uploadLoading} />
                <label htmlFor="doc-upload" className="cursor-pointer block">
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${uploadErrors.file ? 'text-red-400' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium">Select File <span className="text-red-500">*</span></p>
                  <p className="text-xs text-gray-500">Click to browse</p>
                  {uploadFile && <p className="text-xs text-primary-600 mt-1">{uploadFile.name}</p>}
                </label>
              </div>
              {uploadErrors.file && <p className="text-red-500 text-xs mt-1">{uploadErrors.file}</p>}
              {uploadLoading && <div className="mt-4 text-center text-sm text-gray-500">Uploading...</div>}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { setUploadModalOpen(false); setUploadErrors({}); setParentDocumentSearch(''); setParentDocuments([]); setShowParentDocDropdown(false); }} className="px-2 py-1 text-xs border rounded">Cancel</button>
                <button onClick={handleUpload} disabled={uploadLoading} className={`px-2 py-1 text-xs text-white rounded ${!uploadLoading ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                  {uploadLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeptModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[60]"><div className="bg-white rounded-lg p-6 text-center shadow-xl"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><p className="text-sm text-gray-600">Loading departments...</p></div></div>}>
          <DepartmentSelectionModal show={showDeptModal} onClose={() => setShowDeptModal(false)} onSelect={handleDepartmentSelected}
            selectedDepartmentId={selectionContext === 'filter' ? filters.reference_id : selectionContext === 'upload' ? uploadMeta.reference_id : null} />
        </Suspense>
      )}

      {showEmpModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]"><div className="bg-white rounded-lg p-6 text-center shadow-xl"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><p className="text-sm text-gray-600">Loading employees...</p></div></div>}>
          <EmployeeSelectionModal show={showEmpModal} onClose={() => setShowEmpModal(false)} onSelect={handleEmployeeSelected}
            selectedEmployeeId={selectionContext === 'filter' ? filters.reference_id : selectionContext === 'upload' ? uploadMeta.reference_id : null} />
        </Suspense>
      )}
    </div>
  );
};

export default React.memo(DocumentManagement);
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef, lazy, Suspense } from 'react';
import {
  Search, Edit, Trash2, Users, Plus, Download, Upload, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Calendar, CheckCircle, AlertCircle, Archive, Clock,
  User, Mail, Phone, Building2, X, CheckCircle2, FileSignature,
  Send,
  Eye, ShieldAlert, ShieldCheck, RotateCcw, Ban, UserCheck, PlayCircle,
} from 'lucide-react';
import { hrAPI } from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';

const EmployeeModal = lazy(() => import('./EmployeeModal'));
const ConfirmationModal = lazy(() => import('../../../components/common/ConfirmationModal'));
const ImportModal = lazy(() => import('../../../components/common/ImportModal'));
const Toast = lazy(() => import('../../../components/common/Toast'));
const DepartmentSelectionModal = lazy(() => import('../Departments/DepartmentSelectionModal'));

/* ──────────────────────────────────────────────────────────────────
   FORMATTERS
────────────────────────────────────────────────────────────────── */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const computeAge = (dob) => {
  if (!dob) return '—';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : '—';
};

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : v);

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

/* ──────────────────────────────────────────────────────────────────
   REGISTRATION-LINK HELPERS
────────────────────────────────────────────────────────────────── */
const LINK_VALIDITY_MS = 60 * 60 * 1000;

const getLinkState = (emp) => {
  if (!emp) return { state: 'none' };
  if (emp.user_id) return { state: 'registered' };
  if (emp.is_registered === true) return { state: 'registered' };
  if (!emp.link_sent_at) return { state: 'none' };
  const sentAt = new Date(emp.link_sent_at).getTime();
  if (isNaN(sentAt)) return { state: 'none' };
  const expiresAt = sentAt + LINK_VALIDITY_MS;
  if (Date.now() < expiresAt) return { state: 'sent', expiresAt, sentAt };
  return { state: 'expired', sentAt };
};

const formatCountdown = (ms) => {
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60000);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/* ──────────────────────────────────────────────────────────────────
   CONTEXT-AWARE QUICK STATUS ACTIONS
────────────────────────────────────────────────────────────────── */
const EMPLOYEE_QUICK_ACTIONS = {
  probation: [
    { Icon: UserCheck, color: 'text-green-600 hover:bg-green-50', title: 'Confirm (Active)', nextStatus: 'active' },
    { Icon: ShieldAlert, color: 'text-orange-600 hover:bg-orange-50', title: 'Suspend', nextStatus: 'suspended' },
    { Icon: Ban, color: 'text-red-600 hover:bg-red-50', title: 'Terminate', nextStatus: 'terminated' },
  ],
  active: [
    { Icon: ShieldAlert, color: 'text-orange-600 hover:bg-orange-50', title: 'Suspend', nextStatus: 'suspended' },
    { Icon: Ban, color: 'text-red-600 hover:bg-red-50', title: 'Terminate', nextStatus: 'terminated' },
    { Icon: RotateCcw, color: 'text-yellow-600 hover:bg-yellow-50', title: 'Send to Probation', nextStatus: 'probation' },
  ],
  suspended: [
    { Icon: RotateCcw, color: 'text-yellow-600 hover:bg-yellow-50', title: 'Reinitiate (Probation)', nextStatus: 'probation' },
  ],
  terminated: [
    { Icon: RotateCcw, color: 'text-yellow-600 hover:bg-yellow-50', title: 'Reinitiate (Probation)', nextStatus: 'probation' },
  ],
  on_leave: [
    { Icon: ShieldAlert, color: 'text-orange-600 hover:bg-orange-50', title: 'Suspend', nextStatus: 'suspended' },
    { Icon: Ban, color: 'text-red-600 hover:bg-red-50', title: 'Terminate', nextStatus: 'terminated' },
    { Icon: RotateCcw, color: 'text-yellow-600 hover:bg-yellow-50', title: 'Send to Probation', nextStatus: 'probation' },
  ],
};

/* ──────────────────────────────────────────────────────────────────
   BADGES & PREVIEWS
────────────────────────────────────────────────────────────────── */
const StatusBadge = React.memo(({ status, statusOptions }) => {
  const statusObj = statusOptions.find(s => s.value === status) || statusOptions[0];
  return (
    <span className={`inline-flex items-center px-1 py-0 rounded-full text-[10px] font-medium ${statusObj.color}`}>
      {statusObj.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const HoverImagePreview = React.memo(({ url, label, icon: Icon }) => {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  if (!url) return <span className="text-gray-400">—</span>;

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const previewSize = 176;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - previewSize - 8));
      const top = rect.bottom + 4 > window.innerHeight - previewSize
        ? Math.max(8, rect.top - previewSize - 4)
        : rect.bottom + 4;
      setPos({ top, left });
    }
    setShow(true);
  };

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url);

  return (
    <span ref={ref} onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)} className="inline-flex items-center">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-5 h-5 text-primary-600 hover:text-primary-800 rounded hover:bg-primary-50 transition-colors"
        title={`View ${label}`}
        aria-label={`View ${label}`}
      >
        <Icon className="w-3 h-3" />
      </a>

      {show && (
        <span
          className="fixed z-[9999] pointer-events-none bg-white border border-gray-200 rounded-lg shadow-lg p-1"
          style={{ top: pos.top, left: pos.left }}
        >
          {isImage ? (
            <img
              src={url}
              alt={label}
              className="w-40 h-40 object-cover rounded"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          {!isImage && (
            <div className="w-40 h-40 flex items-center justify-center text-xs text-gray-500 bg-gray-50 rounded">
              Preview not available
            </div>
          )}
          <div className="text-[10px] text-gray-500 text-center mt-0.5">{label}</div>
        </span>
      )}
    </span>
  );
});
HoverImagePreview.displayName = 'HoverImagePreview';

const LinkStatusBadge = React.memo(({ emp }) => {
  const { state, expiresAt } = getLinkState(emp);

  if (state === 'registered') {
    return <span className="text-gray-700" title="Registered user">{emp.user_id}</span>;
  }
  if (state === 'sent') {
    const remaining = expiresAt - Date.now();
    return (
      <span className="text-green-600 font-medium" title={`Link sent — valid for ${formatCountdown(remaining)} more`}>
        Sent
      </span>
    );
  }
  if (state === 'expired') {
    return <span className="text-red-600 font-medium" title="Registration link expired">Expired</span>;
  }
  return <span className="text-gray-400" title="Registration link not sent yet">Not Sent</span>;
});
LinkStatusBadge.displayName = 'LinkStatusBadge';

const SendLinkAction = React.memo(({ emp, canSendLink, onSendLink, onResendLink, linkTicker }) => {
  const { state, expiresAt } = getLinkState(emp);

  if (state === 'registered') return null;

  if (state === 'sent') {
    const remaining = expiresAt - (linkTicker || Date.now());
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 text-green-600"
        title={`Link sent — valid for ${formatCountdown(remaining)} more`}
        aria-label={`Link sent, ${formatCountdown(remaining)} remaining`}
      >
        <CheckCircle className="w-3 h-3" />
      </span>
    );
  }

  if (state === 'expired') {
    if (!canSendLink) {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400" title="Link expired" aria-label="Expired">
          <AlertCircle className="w-3 h-3" />
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onResendLink?.(emp)}
        className="inline-flex items-center justify-center w-5 h-5 text-amber-600 hover:text-amber-800 rounded hover:bg-amber-50 transition-colors"
        title="Link expired — resend"
        aria-label="Resend registration link"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    );
  }

  if (!canSendLink) return null;
  return (
    <button
      type="button"
      onClick={() => onSendLink?.(emp)}
      className="inline-flex items-center justify-center w-5 h-5 text-primary-600 hover:text-primary-800 rounded hover:bg-primary-50 transition-colors"
      title="Send registration link (valid 1 hour)"
      aria-label="Send registration link"
    >
      <Send className="w-3 h-3" />
    </button>
  );
});
SendLinkAction.displayName = 'SendLinkAction';

/* ──────────────────────────────────────────────────────────────────
   ROW
────────────────────────────────────────────────────────────────── */
const EmployeeRow = React.memo(({
  emp, canBulk, canUpdate, canDelete, canUpdateStatus,
  selectedEmployees, toggleSelection, openEmployeeModal,
  handleStatusUpdate, handleDeleteEmployee, statusOptions, getStatusColor, safeParseJSONArray,
  canSendLink, onSendLink, onResendLink, linkTicker,
}) => {
  const isSelected = selectedEmployees.includes(emp.emp_id);
  const skills = safeParseJSONArray(emp.skills);
  const languages = safeParseJSONArray(emp.languages);
  const education = safeParseJSONArray(emp.education);
  const workExp = safeParseJSONArray(emp.work_experience);
  const address = emp.address || {};
  const emergency = emp.emergency_contact || {};
  const bank = emp.bank_details || {};

  const deptHeadName = emp.department_head
    ? `${emp.department_head.first_name || ''} ${emp.department_head.last_name || ''}`.trim()
    : dash(emp.dept_head_id);

  const managerName = emp.manager
    ? `${emp.manager.first_name || ''} ${emp.manager.last_name || ''}`.trim() || dash(emp.manager.emp_id)
    : '—';

  const profileUrl = emp.profile || emp.profile_picture_url || null;
  const signatureUrl = emp.signature || null;
  const age = emp.age ?? computeAge(emp.date_of_birth);

  const quickActions = EMPLOYEE_QUICK_ACTIONS[emp.status] || [];

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-0.5 py-0.5 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(emp.emp_id)}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
          />
        </td>
      )}

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => openEmployeeModal(emp, true)}
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-900 rounded hover:bg-blue-50 transition-colors"
            title="View Details"
            aria-label="View employee"
          >
            <Eye className="w-3 h-3" />
          </button>

          {canUpdate && (
            <button
              onClick={() => openEmployeeModal(emp, false)}
              className="inline-flex items-center justify-center w-5 h-5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors"
              title="Edit"
              aria-label="Edit employee"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}

          {canUpdateStatus && quickActions.map(act => (
            <button
              key={act.title}
              onClick={() => handleStatusUpdate(emp.emp_id, act.nextStatus, act.title)}
              className={`inline-flex items-center justify-center w-5 h-5 rounded transition-colors ${act.color}`}
              title={act.title}
              aria-label={act.title}
            >
              <act.Icon className="w-3 h-3" />
            </button>
          ))}

          {canDelete && (
            <button
              onClick={() => handleDeleteEmployee(emp.emp_id)}
              className="inline-flex items-center justify-center w-5 h-5 text-red-600 hover:text-red-900 rounded hover:bg-red-50 transition-colors"
              title="Delete"
              aria-label="Delete employee"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <SendLinkAction
            emp={emp}
            canSendLink={canSendLink}
            onSendLink={onSendLink}
            onResendLink={onResendLink}
            linkTicker={linkTicker}
          />
        </div>
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{dash(emp.emp_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-700 font-medium">{dash(emp.employee_code)}</td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono">
        <LinkStatusBadge emp={emp} />
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.title)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.display_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.first_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.middle_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.last_name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{age}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 capitalize">{dash(emp.gender)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(emp.date_of_birth)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.marital_status)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.nationality)}</td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] font-mono text-gray-600">{dash(emp.org_id)}</td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.email)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.personal_email)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.phone)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.mobile)}</td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.passport_number)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.social_security_number)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[120px] truncate">
        {[address.line1, address.street, address.city, address.state, address.country, address.zip, address.pincode]
          .filter(Boolean).join(', ') || '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600 max-w-[140px] truncate">
        {emergency.name ? `${emergency.name} (${emergency.relationship || ''}) - ${emergency.phone || ''}` : '—'}
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.dept_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.department?.name)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.position_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.position?.title)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{managerName}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.dept_head_id)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{deptHeadName}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.work_location_id)}</td>

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        {canUpdateStatus ? (
          <select
            value={emp.status || 'probation'}
            onChange={e => handleStatusUpdate(emp.emp_id, e.target.value)}
            className={`text-[10px] font-medium rounded-full border-0 focus:ring-1 focus:ring-primary-500 px-1 py-0 ${getStatusColor(emp.status)}`}
          >
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <StatusBadge status={emp.status} statusOptions={statusOptions} />
        )}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-500">
        <Calendar className="w-2.5 h-2.5 inline mr-0.5" />{formatDate(emp.hire_date)}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(emp.confirmation_date)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDate(emp.termination_date)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.employment_type)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        {emp.base_salary ? `${emp.salary_currency || 'INR'} ${Number(emp.base_salary).toLocaleString()}` : '—'}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        {bank.account_number ? `A/C: ${bank.account_number}` : '—'}
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        <HoverImagePreview url={profileUrl} label="Profile" icon={User} />
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        <HoverImagePreview url={signatureUrl} label="Signature" icon={FileSignature} />
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        {skills.length === 0 ? '—' : (
          <div className="flex flex-wrap gap-0.5">
            {skills.slice(0, 2).map((skill, idx) => (
              <span key={idx} className="inline-block px-1 py-0 bg-gray-100 rounded text-[10px] text-gray-700">{skill}</span>
            ))}
            {skills.length > 2 && <span className="text-[10px] text-gray-400">+{skills.length - 2}</span>}
          </div>
        )}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        {languages.length === 0 ? '—' : (
          <div className="flex flex-wrap gap-0.5">
            {languages.slice(0, 2).map((lang, idx) => (
              <span key={idx} className="inline-block px-1 py-0 bg-gray-100 rounded text-[10px] text-gray-700">{lang}</span>
            ))}
            {languages.length > 2 && <span className="text-[10px] text-gray-400">+{languages.length - 2}</span>}
          </div>
        )}
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{education.length || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{workExp.length || '—'}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">
        {emp.custom_fields ? JSON.stringify(emp.custom_fields).substring(0, 20) : '—'}
      </td>

      <td className="px-0.5 py-0.5 whitespace-nowrap">
        <span className={`inline-flex items-center px-1 py-0 rounded-full text-[10px] font-medium ${
          emp.reg_type === 'bulk'
          ? 'bg-purple-100 text-purple-700 border border-purple-300'
          : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}>
          {emp.reg_type === 'bulk' ? 'Bulk' : 'Manual'}
        </span>
      </td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.created_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{dash(emp.updated_by)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(emp.createdAt)}</td>
      <td className="px-0.5 py-0.5 whitespace-nowrap text-[11px] text-gray-600">{formatDateTime(emp.updatedAt)}</td>
    </tr>
  );
});
EmployeeRow.displayName = 'EmployeeRow';

/* ──────────────────────────────────────────────────────────────────
   DATE HELPERS
────────────────────────────────────────────────────────────────── */
const formatYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const subDays = (date, days) => { const r = new Date(date); r.setDate(date.getDate() - days); return r; };
const subMonths = (date, months) => { const r = new Date(date); r.setMonth(date.getMonth() - months); if (r.getDate() !== date.getDate()) r.setDate(0); return r; };
const subYears = (date, years) => { const r = new Date(date); r.setFullYear(date.getFullYear() - years); return r; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

/* ──────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────── */
const EmployeeManagement = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canCreate = useMemo(() => hasPermission('create', 'employees', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdate = useMemo(() => hasPermission('update', 'employees', 'A3') || canManage, [hasPermission, canManage]);
  const canUpdateStatus = useMemo(() => hasPermission('update_status', 'employees', 'A3') || canManage, [hasPermission, canManage]);
  const canDelete = useMemo(() => hasPermission('delete', 'employees', 'A3') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'employees', 'A3') || canManage, [hasPermission, canManage]);
  const canImport = useMemo(() => hasPermission('import', 'employees', 'A3') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'employees', 'A3') || canManage, [hasPermission, canManage]);
  const canSendLink = useMemo(() => hasPermission('send_link', 'employees', 'A3') || canUpdate, [hasPermission, canUpdate]);

  const [activeTab, setActiveTab] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [positions, setPositions] = useState([]);
  const [linkTicker, setLinkTicker] = useState(Date.now());
  const [togglingStatusIds, setTogglingStatusIds] = useState(new Set());

  const [filterByDepartment, setFilterByDepartment] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50,
  });
  const [datePreset, setDatePreset] = useState('all');
  const debouncedSearch = useDebounce(filters.search, 300);

  const [confirmation, setConfirmation] = useState({
    show: false, title: '', message: '', type: '', onConfirm: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const statusOptions = useMemo(() => [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 border border-green-300' },
    { value: 'probation', label: 'Probation', color: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
    { value: 'on_leave', label: 'On Leave', color: 'bg-blue-100 text-blue-700 border border-blue-300' },
    { value: 'suspended', label: 'Suspended', color: 'bg-orange-100 text-orange-700 border border-orange-300' },
    { value: 'terminated', label: 'Terminated', color: 'bg-red-100 text-red-700 border border-red-300' },
  ], []);

  const safeParseJSONArray = useCallback((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterObj = {};
      if (activeTab !== 'all') filterObj.status = activeTab;
      if (filters.department !== 'all') filterObj.dept_id = filters.department;
      if (filters.dateFrom) filterObj.hire_date_from = filters.dateFrom;
      if (filters.dateTo) filterObj.hire_date_to = filters.dateTo;

      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch,
        searchFields: 'first_name,last_name,email,employee_code,mobile,phone',
        filters: filterObj,
      };

      const response = await hrAPI.getEmployees(payload);
      const data = response.data;

      if (data && data.success) {
        setEmployees(data.employees || []);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        setCounts(data.counts || {});
      } else {
        throw new Error(data?.message || 'Invalid response');
      }
    } catch (err) {
      setError(err.message || 'Failed to load employees');
      setEmployees([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, activeTab]);

  const fetchPositions = useCallback(async () => {
    try {
      const res = await hrAPI.getPositions();
      if (res.data?.success) setPositions(res.data.data || []);
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevPageRef = useRef(filters.page);
  const prevLimitRef = useRef(filters.limit);
  useEffect(() => {
    if (prevPageRef.current !== filters.page || prevLimitRef.current !== filters.limit) {
      prevPageRef.current = filters.page;
      prevLimitRef.current = filters.limit;
      fetchEmployees();
    }
  }, [filters.page, filters.limit, fetchEmployees]);

  useEffect(() => {
    const anySent = employees.some(e => getLinkState(e).state === 'sent');
    if (!anySent) return;
    const iv = setInterval(() => setLinkTicker(Date.now()), 30 * 1000);
    return () => clearInterval(iv);
  }, [employees]);

  const tabs = useMemo(() => {
    const countFromServer = (status) => counts[status] ?? 0;
    return [
      { id: 'all', name: 'All Employees', count: counts.total ?? totalItems, icon: Users, color: 'text-gray-600' },
      { id: 'active', name: 'Active', count: countFromServer('active'), icon: CheckCircle, color: 'text-green-600' },
      { id: 'probation', name: 'Probation', count: countFromServer('probation'), icon: Clock, color: 'text-yellow-600' },
      { id: 'on_leave', name: 'On Leave', count: countFromServer('on_leave'), icon: AlertCircle, color: 'text-blue-600' },
      { id: 'suspended', name: 'Suspended', count: countFromServer('suspended'), icon: AlertCircle, color: 'text-orange-600' },
      { id: 'terminated', name: 'Terminated', count: countFromServer('terminated'), icon: Archive, color: 'text-red-600' },
    ];
  }, [counts, totalItems]);

  const departmentHeads = useMemo(() => employees.map(e => ({ emp_id: e.emp_id, first_name: e.first_name, last_name: e.last_name })), [employees]);

  const handleStatusChange = useCallback(status => { setActiveTab(status); setFilters(p => ({ ...p, page: 1 })); }, []);
  const handleSearchChange = useCallback(value => { setFilters(p => ({ ...p, search: value, page: 1 })); }, []);
  const handleLimitChange = useCallback(newLimit => { setFilters(p => ({ ...p, limit: parseInt(newLimit), page: 1 })); }, []);
  const handlePageChange = useCallback(newPage => { if (newPage >= 1 && newPage <= totalPages) setFilters(p => ({ ...p, page: newPage })); }, [totalPages]);

  const handleToggleFilterByDepartment = useCallback(() => {
    setFilterByDepartment(prev => {
      if (prev) {
        setSelectedDepartment(null);
        setFilters(prevFilters => ({ ...prevFilters, department: 'all', page: 1 }));
      }
      return !prev;
    });
  }, []);

  const handleDepartmentSelected = useCallback((dept) => {
    setSelectedDepartment(dept);
    setFilters(prev => ({ ...prev, department: dept ? dept.dept_id : 'all', page: 1 }));
    setFilterByDepartment(true);
    setShowDeptModal(false);
  }, []);

  const handleDatePresetChange = useCallback((e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    const today = new Date();
    let start = '', end = '';
    switch (preset) {
      case 'all': start = ''; end = ''; break;
      case 'today': start = formatYMD(startOfDay(today)); end = formatYMD(endOfDay(today)); break;
      case 'yesterday': start = formatYMD(startOfDay(subDays(today, 1))); end = formatYMD(endOfDay(subDays(today, 1))); break;
      case 'last7days': start = formatYMD(startOfDay(subDays(today, 6))); end = formatYMD(endOfDay(today)); break;
      case 'monthtodate': start = formatYMD(startOfMonth(today)); end = formatYMD(endOfDay(today)); break;
      case 'previous-month': start = formatYMD(startOfMonth(subMonths(today, 1))); end = formatYMD(endOfMonth(subMonths(today, 1))); break;
      case 'yeartodate': start = formatYMD(startOfYear(today)); end = formatYMD(endOfDay(today)); break;
      case 'previous-year': start = formatYMD(startOfYear(subYears(today, 1))); end = formatYMD(endOfYear(subYears(today, 1))); break;
      default: return;
    }
    setFilters(prev => ({ ...prev, dateFrom: start, dateTo: end, page: 1 }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ search: '', department: 'all', dateFrom: '', dateTo: '', page: 1, limit: 10 });
    setActiveTab('all');
    setDatePreset('all');
    setSelectedDepartment(null);
    setFilterByDepartment(false);
    showToast('All filters cleared', 'info');
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    clearAllFilters();
    fetchEmployees();
  }, [clearAllFilters, fetchEmployees]);

  const handleGetData = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const hasActiveFilters = useMemo(() =>
    filters.search !== '' || activeTab !== 'all' || filters.department !== 'all' ||
    filters.dateFrom !== '' || filters.dateTo !== '',
    [filters, activeTab]);

  const getStatusColor = useCallback(status => (statusOptions.find(s => s.value === status) || statusOptions[0]).color, [statusOptions]);

  const toggleSelection = useCallback(id => { if (!canBulk) return; setSelectedEmployees(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }, [canBulk]);
  const toggleSelectAll = useCallback(() => { if (!canBulk) return; const ids = employees.map(e => e.emp_id); setSelectedEmployees(selectedEmployees.length === ids.length ? [] : ids); }, [canBulk, employees, selectedEmployees]);

  const handleBulkAction = useCallback(async () => {
    if (!canBulk) { showToast('No permission', 'error'); return; }
    if (!bulkAction || selectedEmployees.length === 0) return;
    try {
      if (bulkAction === 'delete') {
        if (!canDelete) { showToast('No permission', 'error'); return; }
        showConfirmation('Delete Employees', `Delete ${selectedEmployees.length} employee(s)?`, 'bulkDelete', async () => {
          await Promise.all(selectedEmployees.map(id => hrAPI.deleteEmployee(id)));
          setBulkAction(''); setSelectedEmployees([]); fetchEmployees();
          showToast(`Deleted ${selectedEmployees.length} employees`, 'success');
        });
      } else {
        if (!canUpdateStatus) { showToast('No permission', 'error'); return; }
        await Promise.all(selectedEmployees.map(id => hrAPI.updateEmployee(id, { status: bulkAction })));
        setBulkAction(''); setSelectedEmployees([]); fetchEmployees();
        showToast(`Updated ${selectedEmployees.length} employees`, 'success');
      }
    } catch (err) { showToast('Bulk action failed', 'error'); }
  }, [canBulk, bulkAction, selectedEmployees, canDelete, canUpdateStatus, fetchEmployees, showToast]);

  /* ── OPTIMISTIC status update ── */
  const handleStatusUpdate = useCallback(async (empId, newStatus, actionLabel) => {
    if (!canUpdateStatus) { showToast('No permission', 'error'); return; }

    const emp = employees.find(e => e.emp_id === empId);
    const currentStatus = emp?.status || 'probation';
    if (currentStatus === newStatus) return;

    // Optimistic row update
    setEmployees(prev =>
      prev.map(e => e.emp_id === empId ? { ...e, status: newStatus } : e)
    );

    // Adjust counters
    setCounts(prev => {
      const next = { ...prev };
      if (currentStatus && next[currentStatus] != null) {
        next[currentStatus] = Math.max(0, next[currentStatus] - 1);
      }
      if (newStatus && next[newStatus] != null) {
        next[newStatus] = (next[newStatus] || 0) + 1;
      }
      return next;
    });

    setTogglingStatusIds(prev => new Set(prev).add(empId));

    try {
      await hrAPI.updateEmployee(empId, { status: newStatus });
      showToast(actionLabel || 'Status updated', 'success');
    } catch (err) {
      // Rollback
      setEmployees(prev =>
        prev.map(e => e.emp_id === empId ? { ...e, status: currentStatus } : e)
      );
      setCounts(prev => {
        const next = { ...prev };
        if (newStatus && next[newStatus] != null) {
          next[newStatus] = Math.max(0, next[newStatus] - 1);
        }
        if (currentStatus && next[currentStatus] != null) {
          next[currentStatus] = (next[currentStatus] || 0) + 1;
        }
        return next;
      });
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingStatusIds(prev => {
        const n = new Set(prev);
        n.delete(empId);
        return n;
      });
    }
  }, [canUpdateStatus, employees, showToast]);

  /* ── OPTIMISTIC delete ── */
  const handleDeleteEmployee = useCallback(empId => {
    if (!canDelete) { showToast('No permission', 'error'); return; }
    const emp = employees.find(e => e.emp_id === empId);
    showConfirmation('Delete Employee', `Delete "${emp?.first_name} ${emp?.last_name}"?`, 'delete', async () => {
      const snapshotEmployees = employees;
      const snapshotCounts = counts;
      const snapshotTotal = totalItems;

      setEmployees(prev => prev.filter(e => e.emp_id !== empId));
      setTotalItems(prev => Math.max(0, prev - 1));
      setCounts(prev => {
        const next = { ...prev };
        if (emp?.status && next[emp.status] != null) {
          next[emp.status] = Math.max(0, next[emp.status] - 1);
        }
        if (next.total != null) next.total = Math.max(0, next.total - 1);
        return next;
      });

      try {
        await hrAPI.deleteEmployee(empId);
        showToast('Employee deleted', 'success');
      } catch (err) {
        setEmployees(snapshotEmployees);
        setCounts(snapshotCounts);
        setTotalItems(snapshotTotal);
        showToast('Failed to delete', 'error');
      }
    });
  }, [canDelete, employees, counts, totalItems, showToast]);

  const showConfirmation = useCallback((title, message, type, onConfirm) => {
    setConfirmation({ show: true, title, message, type, onConfirm });
  }, []);
  const hideConfirmation = useCallback(() => setConfirmation(p => ({ ...p, show: false })), []);
  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) confirmation.onConfirm();
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const openEmployeeModal = useCallback((employee = null, readOnlyMode = false) => {
    if (employee && !canUpdate && !readOnlyMode) { showToast('No permission', 'error'); return; }
    if (!employee && !canCreate) { showToast('No permission', 'error'); return; }
    setEditingEmployee(employee);
    setIsReadOnly(readOnlyMode);
    setShowEmployeeModal(true);
  }, [canUpdate, canCreate, showToast]);

  const closeEmployeeModal = useCallback(() => {
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setIsReadOnly(false);
  }, []);

  const handleEmployeeSaved = useCallback(() => {
    closeEmployeeModal();
    fetchEmployees();
    showToast('Employee saved!', 'success');
  }, [closeEmployeeModal, fetchEmployees, showToast]);

  /* ── Send / Resend Registration Link ── */
  const handleSendLink = useCallback(async (emp) => {
    if (!canSendLink) { showToast('No permission', 'error'); return; }
    if (!emp?.emp_id) { showToast('No employee selected', 'error'); return; }
    if (emp.user_id) { showToast('User already registered', 'error'); return; }
    try {
      const res = await hrAPI.sendRegistrationLink(emp.emp_id);
      if (res?.data?.success) {
        setEmployees(prev => prev.map(e =>
          e.emp_id === emp.emp_id
            ? { ...e, link_sent_at: new Date().toISOString(), registration_link_status: 'sent' }
            : e
        ));
        setLinkTicker(Date.now());
        showToast(`Registration link sent to ${emp.email || emp.personal_email || 'employee'} (valid 1 hour)`, 'success');
      } else {
        showToast(res?.data?.message || 'Failed to send link', 'error');
      }
    } catch (err) { showToast('Failed to send registration link', 'error'); }
  }, [canSendLink, showToast]);

  const handleResendLink = useCallback(async (emp) => {
    if (!canSendLink) { showToast('No permission', 'error'); return; }
    if (!emp?.emp_id) { showToast('No employee selected', 'error'); return; }
    if (emp.user_id) { showToast('User already registered', 'error'); return; }
    try {
      const res = await hrAPI.sendRegistrationLink(emp.emp_id);
      if (res?.data?.success) {
        setEmployees(prev => prev.map(e =>
          e.emp_id === emp.emp_id
            ? { ...e, link_sent_at: new Date().toISOString(), registration_link_status: 'sent' }
            : e
        ));
        setLinkTicker(Date.now());
        showToast(`New registration link sent to ${emp.email || emp.personal_email || 'employee'} (valid 1 hour)`, 'success');
      } else {
        showToast(res?.data?.message || 'Failed to resend link', 'error');
      }
    } catch (err) { showToast('Failed to resend registration link', 'error'); }
  }, [canSendLink, showToast]);

  /* ── CSV export ── */
  const exportToCSV = useCallback(async () => {
    if (!canExport) { showToast('No permission', 'error'); return; }
    try {
      setExportLoading(true);
      const dataToExport = employees;
      if (!dataToExport || dataToExport.length === 0) { showToast('No employees to export', 'error'); return; }
      const headers = [
        'Emp ID', 'Employee Code', 'User ID',
        'Title', 'Display Name', 'First Name', 'Middle Name', 'Last Name',
        'Age', 'Gender', 'Date of Birth', 'Marital Status', 'Nationality',
        'Org ID',
        'Email', 'Personal Email', 'Phone', 'Mobile',
        'Passport', 'SSN', 'Address', 'Emergency Contact',
        'Dept ID', 'Department', 'Position ID', 'Position', 'Manager',
        'Dept Head ID', 'Dept Head Name', 'Work Location ID',
        'Status', 'Hire Date', 'Confirmation Date', 'Termination Date',
        'Employment Type', 'Salary Currency', 'Base Salary', 'Bank Account',
        'Profile', 'Signature',
        'Skills', 'Languages', 'Education Count', 'Work Exp Count', 'Custom Fields',
        'Reg Type', 'Created By', 'Updated By', 'Created At', 'Updated At',
        'Registration Link State', 'Link Sent At'
      ];
      const rows = dataToExport.map(emp => {
        const addr = emp.address || {};
        const emerg = emp.emergency_contact || {};
        const bank = emp.bank_details || {};
        const deptHeadName = emp.department_head ? `${emp.department_head.first_name || ''} ${emp.department_head.last_name || ''}`.trim() : '';
        const managerName = emp.manager ? `${emp.manager.first_name || ''} ${emp.manager.last_name || ''}`.trim() : '';
        const age = emp.age ?? computeAge(emp.date_of_birth);
        const link = getLinkState(emp);
        return [
          emp.emp_id, emp.employee_code || '', emp.user_id || '',
          emp.title || '', emp.display_name || '', emp.first_name || '', emp.middle_name || '', emp.last_name || '',
          age, emp.gender || '', emp.date_of_birth || '', emp.marital_status || '', emp.nationality || '',
          emp.org_id || '',
          emp.email || '', emp.personal_email || '', emp.phone || '', emp.mobile || '',
          emp.passport_number || '', emp.social_security_number || '',
          [addr.line1, addr.street, addr.city, addr.state, addr.country, addr.zip, addr.pincode].filter(Boolean).join(', '),
          emerg.name ? `${emerg.name} (${emerg.relationship || ''}) - ${emerg.phone || ''}` : '',
          emp.dept_id || '', emp.department?.name || '', emp.position_id || '', emp.position?.title || '', managerName,
          emp.dept_head_id || '', deptHeadName, emp.work_location_id || '',
          emp.status || '', emp.hire_date || '', emp.confirmation_date || '', emp.termination_date || '',
          emp.employment_type || '', emp.salary_currency || 'INR', emp.base_salary || '', bank.account_number || '',
          emp.profile || emp.profile_picture_url || '', emp.signature || '',
          safeParseJSONArray(emp.skills).join('; '), safeParseJSONArray(emp.languages).join('; '),
          safeParseJSONArray(emp.education).length, safeParseJSONArray(emp.work_experience).length,
          JSON.stringify(emp.custom_fields || {}),
          emp.reg_type === 'bulk' ? 'Bulk' : 'Manual',
          emp.created_by ?? '', emp.updated_by ?? '',
          formatDateTime(emp.createdAt), formatDateTime(emp.updatedAt),
          link.state, emp.link_sent_at || ''
        ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`);
      });
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `employees_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      showToast(`Exported ${dataToExport.length} employees`, 'success');
    } catch (err) { showToast('Export failed', 'error'); }
    finally { setExportLoading(false); }
  }, [canExport, employees, safeParseJSONArray, showToast]);

  const handleEmployeeImport = useCallback(async (parsedRows) => {
    try {
      const response = await hrAPI.bulkImportEmployees({ data: parsedRows });
      const data = response.data;

      if (data.success) {
        showToast(`✅ Import successful: ${data.created} created, ${data.skipped} skipped (duplicates)`, 'success');
      } else if (data.created + data.skipped > 0) {
        showToast(`⚠️ Partial success: ${data.created} created, ${data.skipped} skipped, ${data.failed} failed.`, 'warning');
      } else {
        showToast(`❌ Import failed: ${data.failed} rows.${data.errors ? ' Check logs.' : ''}`, 'error');
      }

      fetchEmployees();
      return data;
    } catch (err) {
      showToast('Bulk import failed: ' + (err.response?.data?.message || err.message), 'error');
      return { success: false, message: err.message, failed: parsedRows.length, errors: [] };
    }
  }, [fetchEmployees, showToast]);

  return (
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage employee records</p></div>
        <div className="flex flex-wrap gap-1 mt-2 lg:mt-0 items-center">
          {canImport && (
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
              <Upload className="w-2.5 h-2.5" /> Import
            </button>
          )}
          {canExport && <button onClick={exportToCSV} disabled={exportLoading} className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Download className="w-2.5 h-2.5" /> {exportLoading ? 'Exporting...' : 'Export'}</button>}

          <button onClick={handleToggleFilterByDepartment}
            className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${filterByDepartment
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
            <Building2 className="w-3 h-3" />
            {selectedDepartment ? selectedDepartment.name : 'Departments'}
            {filterByDepartment && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
          </button>

          {filterByDepartment && (
            <button onClick={() => setShowDeptModal(true)}
              className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors">
              <Building2 className="w-3 h-3" />
              {selectedDepartment ? 'Change' : 'Select Department'}
            </button>
          )}

          <select value={datePreset} onChange={handleDatePresetChange}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="monthtodate">Month to date</option>
            <option value="previous-month">Previous month</option>
            <option value="yeartodate">Year to date</option>
            <option value="previous-year">Previous year</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
          <input type="date" value={filters.dateTo} onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value, page: 1 }))}
            className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />

          <button onClick={handleGetData} className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors">
            <RefreshCw className="w-3 h-3" /> Get Data
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-1 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>

          {canCreate && <button onClick={() => openEmployeeModal()} className="flex items-center gap-0.5 px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"><Plus className="w-2.5 h-2.5" /> Add Employee</button>}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="flex-shrink-0 p-2.5 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => handleStatusChange(tab.id)}
                    className={`px-1.5 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-xs border border-primary-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}>
                    <Icon className={`w-3 h-3 ${activeTab === tab.id ? tab.color : ''}`} />{tab.name}
                    <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'}`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <select value={filters.limit} onChange={e => handleLimitChange(e.target.value)}
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white">
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="150">150 per page</option>
                <option value="200">200 per page</option>
                <option value="250">250 per page</option>
                <option value="300">300 per page</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input type="text" placeholder="Search employees..." value={filters.search}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-xs" />
              </div>

              {canBulk && selectedEmployees.length > 0 && (
                <div className="flex items-center gap-1.5 bg-primary-50 rounded-md px-1.5 py-0.5">
                  <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
                    className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
                    <option value="">Bulk Actions</option>
                    {canUpdateStatus && (<>
                      <option value="active">Set Active</option>
                      <option value="probation">Set Probation</option>
                      <option value="on_leave">Set On Leave</option>
                      <option value="suspended">Suspend</option>
                      <option value="terminated">Terminate</option>
                    </>)}
                    {canDelete && <option value="delete">Delete</option>}
                  </select>
                  <button onClick={handleBulkAction} disabled={!bulkAction}
                    className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">Apply</button>
                  <span className="text-xs text-primary-700 font-medium">{selectedEmployees.length} selected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table body — the ONLY scroll area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">Loading...</div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Employees</h3>
                <p className="text-xs text-gray-600 mb-3">{error}</p>
                <button onClick={fetchEmployees} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">Try Again</button>
              </div>
            </div>
          ) : employees.length > 0 ? (
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {canBulk && <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider w-8"><input type="checkbox" checked={selectedEmployees.length === employees.length && employees.length > 0} onChange={toggleSelectAll} disabled={!canBulk} className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3" /></th>}

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">User</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Middle Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Marital</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Nationality</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Org</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">P.Email</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Mobile</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Passport</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">SSN</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Emergency</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Dept ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pos ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Head ID</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Dept. Head</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Work Loc.</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Hire</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Confirm</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Term.</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Bank</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Signature</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Languages</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Edu</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Exp</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Custom</th>

                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Reg Type</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated By</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-0.5 py-1 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map(emp => (
                  <EmployeeRow
                    key={emp.emp_id}
                    emp={emp}
                    canBulk={canBulk}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    canUpdateStatus={canUpdateStatus}
                    selectedEmployees={selectedEmployees}
                    toggleSelection={toggleSelection}
                    openEmployeeModal={openEmployeeModal}
                    handleStatusUpdate={handleStatusUpdate}
                    handleDeleteEmployee={handleDeleteEmployee}
                    statusOptions={statusOptions}
                    getStatusColor={getStatusColor}
                    safeParseJSONArray={safeParseJSONArray}
                    canSendLink={canSendLink}
                    onSendLink={handleSendLink}
                    onResendLink={handleResendLink}
                    linkTicker={linkTicker}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Users className="w-4 h-4 text-gray-400" /></div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No employees found</h3>
                <p className="text-xs text-gray-600 mb-3">{hasActiveFilters ? 'No employees match your search criteria.' : 'Get started by adding your first employee.'}</p>
                {canCreate && <button onClick={() => openEmployeeModal()} className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium flex items-center gap-1 text-xs mx-auto"><Plus className="w-2.5 h-2.5" /> Add Employee</button>}
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <span>Showing</span><span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>
                <span>to</span><span className="font-medium">{Math.min(filters.page * filters.limit, totalItems)}</span>
                <span>of</span><span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex items-center space-x-0.5">
                <button onClick={() => handlePageChange(1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsLeft className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronLeft className="w-3 h-3" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (filters.page <= 3) pageNum = i + 1;
                  else if (filters.page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = filters.page - 2 + i;
                  return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`w-6 h-6 text-xs rounded border transition-colors ${filters.page === pageNum ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>{pageNum}</button>
                })}
                <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronRight className="w-3 h-3" /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={filters.page === totalPages} className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"><ChevronsRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showEmployeeModal && (
          <EmployeeModal
            show={showEmployeeModal}
            employee={editingEmployee}
            onClose={closeEmployeeModal}
            onSaved={handleEmployeeSaved}
            departments={[]}
            positions={positions}
            managers={departmentHeads}
            readOnly={isReadOnly}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportModal
            show={showImportModal}
            onClose={() => setShowImportModal(false)}
            onUpload={handleEmployeeImport}
            moduleName="employees"
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showDeptModal && (
          <DepartmentSelectionModal
            show={showDeptModal}
            onClose={() => setShowDeptModal(false)}
            onSelect={handleDepartmentSelected}
            selectedDepartmentId={selectedDepartment?.dept_id}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {confirmation.show && (
          <ConfirmationModal
            show={confirmation.show}
            title={confirmation.title}
            message={confirmation.message}
            type={confirmation.type}
            onConfirm={handleConfirm}
            onCancel={hideConfirmation}
          />
        )}
      </Suspense>
    </div>
  );
};

export default EmployeeManagement;
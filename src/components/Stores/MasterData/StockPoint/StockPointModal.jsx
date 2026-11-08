import React, {
  useState, useEffect, useCallback, useMemo, useRef,
  lazy, Suspense,
} from 'react';
import { X, Save, ChevronRight, Eye, AlertCircle } from 'lucide-react';
import { stockPointsAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const StockPointSelectionModal = lazy(() => import('./StockPointSelectionModal'));
const DepartmentSelectionModal = lazy(() => import('../../../hr/Departments/DepartmentSelectionModal'));
const CostCenterSelectionModal = lazy(() => import('../CostCenters/CostCenterSelectionModal'));
const EmployeeSelectionModal = lazy(() => import('../../../hr/Employees/EmployeeSelectionModal'));

const TYPES = ['PURCHASE', 'CENTRAL', 'MEDICAL', 'GENERAL', 'DEPARTMENTAL', 'IN_TRANSIT', 'SCRAP', 'RETURN'];
const CATEGORIES = ['CONSUMABLE', 'CAPITAL', 'MEDICAL', 'SPARE', 'RAW_MATERIAL', 'IT', 'MIXED'];
const NATURES = ['PHYSICAL', 'VIRTUAL', 'LOGICAL'];
const VALUATIONS = ['FIFO', 'WEIGHTED_AVERAGE', 'STANDARD_COST', 'LIFO'];

const PATTERNS = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z][0-9A-Z]$/,
  CIN: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  PHONE: /^(?:\+?91[\s-]?|0)?[6-9][0-9]{9}$/,
  PINCODE: /^[1-9][0-9]{5}$/,
  DL: /^[A-Z0-9][A-Z0-9\-]{7,19}$/i,
  CST: /^[A-Z0-9\-]{6,20}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

const numOrNull = (v) =>
  v === '' || v === null || v === undefined ? null : Number(v);

const sanitizePhone = (v) => String(v || '').replace(/[^\d+]/g, '').slice(0, 14);
const sanitizeDigits = (v, max) => String(v || '').replace(/\D/g, '').slice(0, max);
const sanitizeAlnum = (v, max) =>
  String(v || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, max);
const sanitizeDl = (v) =>
  String(v || '').toUpperCase().replace(/[^A-Z0-9,\-]/g, '').slice(0, 60);

const deriveShortName = (name) => {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 15);
  const out = `${words[0]} ${words.slice(1).map((w) => w[0].toUpperCase()).join('')}`;
  return out.slice(0, 20);
};

const deriveAlias = (name) => {
  const words = String(name || '').toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.map((w) => w[0]).join('').slice(0, 8);
};

const deriveLevel = (parent) => {
  if (!parent) return 1;
  const parentLevel = Number(parent.stock_point_level ?? parent.level ?? 1);
  return Number.isFinite(parentLevel) && parentLevel > 0 ? parentLevel + 1 : 1;
};

const validators = {
  stock_point_name: (v) => {
    if (!v || !v.trim()) return 'Name is required';
    if (v.trim().length > 150) return 'Max 150 characters';
    return '';
  },
  stock_point_type: (v) => (TYPES.includes(v) ? '' : 'Type is required'),
  contact_email: (v) => {
    if (!v) return '';
    if (!PATTERNS.EMAIL.test(v)) return 'Invalid email';
    return '';
  },
  contact_phone: (v) => {
    if (!v) return '';
    const clean = v.replace(/[\s\-()]/g, '');
    if (!PATTERNS.PHONE.test(clean)) return 'Invalid phone (10-digit Indian mobile)';
    return '';
  },
  alternate_phone: (v) => {
    if (!v) return '';
    const clean = v.replace(/[\s\-()]/g, '');
    if (!PATTERNS.PHONE.test(clean)) return 'Invalid alternate phone';
    return '';
  },
  gst_number: (v) => {
    if (!v) return '';
    if (v.length !== 15) return 'GST must be 15 characters';
    if (!PATTERNS.GST.test(v)) return 'Invalid GST (e.g. 27ABCDE1234F1Z5)';
    return '';
  },
  pan_number: (v) => {
    if (!v) return '';
    if (v.length !== 10) return 'PAN must be 10 characters';
    if (!PATTERNS.PAN.test(v)) return 'Invalid PAN (e.g. ABCDE1234F)';
    return '';
  },
  cin_number: (v) => {
    if (!v) return '';
    if (v.length !== 21) return 'CIN must be 21 characters';
    if (!PATTERNS.CIN.test(v)) return 'Invalid CIN format';
    return '';
  },
  pincode: (v) => {
    if (!v) return '';
    if (v.length !== 6) return 'Pincode must be 6 digits';
    if (!PATTERNS.PINCODE.test(v)) return 'Invalid pincode';
    return '';
  },
  dl_number: (v) => {
    if (!v) return '';
    const parts = v.split(',').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      if (!PATTERNS.DL.test(p)) return 'Invalid DL number format';
    }
    return '';
  },
  cst_number: (v) => {
    if (!v) return '';
    if (!PATTERNS.CST.test(v)) return 'Invalid CST format';
    return '';
  },
  latitude: (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    if (Number.isNaN(n)) return 'Must be a number';
    if (n < -90 || n > 90) return 'Must be between -90 and 90';
    return '';
  },
  longitude: (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    if (Number.isNaN(n)) return 'Must be a number';
    if (n < -180 || n > 180) return 'Must be between -180 and 180';
    return '';
  },
  capacity_value_limit: (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    if (Number.isNaN(n)) return 'Must be a number';
    if (n < 0) return 'Must be ≥ 0';
    return '';
  },
  capacity_qty_limit: (v) => {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v);
    if (Number.isNaN(n)) return 'Must be a number';
    if (n < 0) return 'Must be ≥ 0';
    return '';
  },
};

const stockPointSchema = yup.object().shape({
  stock_point_code: yup.string().trim().max(20).nullable(),
  stock_point_name: yup.string().trim().max(150).required('Name is required'),
  stock_point_type: yup.string().oneOf(TYPES).required('Type is required'),
  stock_point_category: yup.string().oneOf([...CATEGORIES, null, '']).nullable(),
  stock_point_nature: yup.string().oneOf([...NATURES, null, '']).nullable(),
  department_id: yup.number().nullable(),
  incharge_user_id: yup.number().nullable(),
  contact_email: yup.string().trim().email('Invalid email').nullable(),
  contact_phone: yup.string().trim().nullable().test('phone', 'Invalid phone', (v) => !v || PATTERNS.PHONE.test(v.replace(/[\s\-()]/g, ''))),
  alternate_phone: yup.string().trim().nullable().test('phone', 'Invalid alternate phone', (v) => !v || PATTERNS.PHONE.test(v.replace(/[\s\-()]/g, ''))),
  gst_number: yup.string().trim().max(15).nullable().test('gst', 'Invalid GST format', (v) => !v || PATTERNS.GST.test(v)),
  pan_number: yup.string().trim().max(10).nullable().test('pan', 'Invalid PAN format', (v) => !v || PATTERNS.PAN.test(v)),
  cin_number: yup.string().trim().max(21).nullable().test('cin', 'Invalid CIN format', (v) => !v || PATTERNS.CIN.test(v)),
  pincode: yup.string().trim().nullable().test('pincode', 'Invalid pincode', (v) => !v || PATTERNS.PINCODE.test(v)),
  dl_number: yup.string().trim().nullable().test('dl', 'Invalid DL format', (v) => !v || v.split(',').every((p) => !p.trim() || PATTERNS.DL.test(p.trim()))),
  cst_number: yup.string().trim().nullable().test('cst', 'Invalid CST format', (v) => !v || PATTERNS.CST.test(v)),
  valuation_method: yup.string().oneOf([...VALUATIONS, null, '']).nullable(),
  capacity_value_limit: yup.number().min(0).nullable(),
  capacity_qty_limit: yup.number().min(0).nullable(),
  latitude: yup.number().min(-90).max(90).nullable(),
  longitude: yup.number().min(-180).max(180).nullable(),
});

const EMPTY_FORM = {
  stock_point_code: '',
  stock_point_name: '',
  short_name: '',
  alias_code: '',
  description: '',
  location_name: '',
  group_name: '',
  registered_name: '',
  stock_point_type: 'CENTRAL',
  stock_point_category: 'MIXED',
  stock_point_nature: 'PHYSICAL',
  stock_point_level: 1,
  parent_stock_po_id: '',
  department_id: '',
  cost_center_id: '',
  cost_center_name: '',
  incharge_user_id: '',
  alternate_incharge_user_id: '',
  store_manager_user_id: '',
  address_line1: '',
  address_line2: '',
  address_line3: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  latitude: '',
  longitude: '',
  contact_person_name: '',
  contact_phone: '',
  contact_email: '',
  alternate_phone: '',
  tax_rule: '',
  cin_number: '',
  pan_number: '',
  dl_number: '',
  gst_number: '',
  cst_number: '',
  billing_head_ip: '',
  billing_head_ot: '',
  billing_head_discharge: '',
  operating_hours_start: '',
  operating_hours_end: '',
  operating_days: [1, 2, 3, 4, 5, 6],
  timezone: 'Asia/Kolkata',
  capacity_value_limit: '',
  capacity_qty_limit: '',
  currency: 'INR',
  valuation_method: 'WEIGHTED_AVERAGE',
  opened_date: '',
  closed_date: '',
  closure_reason: '',
  is_active: true,
  is_locked: false,
  lock_reason: '',
  receives_from_vendor: false,
  is_consumption_point: false,
  is_distribution_point: true,
  is_default_receiving_point: false,
};

const toForm = (sp) => {
  if (!sp) return { ...EMPTY_FORM };
  return {
    stock_point_code: sp.stock_point_code ?? '',
    stock_point_name: sp.stock_point_name ?? '',
    short_name: sp.short_name ?? '',
    alias_code: sp.alias_code ?? '',
    description: sp.description ?? '',
    location_name: sp.location_name ?? '',
    group_name: sp.group_name ?? '',
    registered_name: sp.registered_name ?? '',
    stock_point_type: sp.stock_point_type ?? 'CENTRAL',
    stock_point_category: sp.stock_point_category ?? 'MIXED',
    stock_point_nature: sp.stock_point_nature ?? 'PHYSICAL',
    stock_point_level: sp.stock_point_level ?? 1,
    parent_stock_po_id: sp.parent_stock_po_id ?? '',
    department_id: sp.department_id ?? '',
    cost_center_id: sp.cost_center_id ?? '',
    cost_center_name: sp.cost_center_name ?? '',
    incharge_user_id: sp.incharge_user_id ?? '',
    alternate_incharge_user_id: sp.alternate_incharge_user_id ?? '',
    store_manager_user_id: sp.store_manager_user_id ?? '',
    address_line1: sp.address_line1 ?? '',
    address_line2: sp.address_line2 ?? '',
    address_line3: sp.address_line3 ?? '',
    city: sp.city ?? '',
    state: sp.state ?? '',
    country: sp.country ?? '',
    pincode: sp.pincode ?? '',
    latitude: sp.latitude ?? '',
    longitude: sp.longitude ?? '',
    contact_person_name: sp.contact_person_name ?? '',
    contact_phone: sp.contact_phone ?? '',
    contact_email: sp.contact_email ?? '',
    alternate_phone: sp.alternate_phone ?? '',
    tax_rule: sp.tax_rule ?? '',
    cin_number: sp.cin_number ?? '',
    pan_number: sp.pan_number ?? '',
    dl_number: sp.dl_number ?? '',
    gst_number: sp.gst_number ?? '',
    cst_number: sp.cst_number ?? '',
    billing_head_ip: sp.billing_head_ip ?? '',
    billing_head_ot: sp.billing_head_ot ?? '',
    billing_head_discharge: sp.billing_head_discharge ?? '',
    operating_hours_start: sp.operating_hours_start ?? '',
    operating_hours_end: sp.operating_hours_end ?? '',
    operating_days: Array.isArray(sp.operating_days) ? sp.operating_days : [1, 2, 3, 4, 5, 6],
    timezone: sp.timezone ?? 'Asia/Kolkata',
    capacity_value_limit: sp.capacity_value_limit ?? '',
    capacity_qty_limit: sp.capacity_qty_limit ?? '',
    currency: sp.currency ?? 'INR',
    valuation_method: sp.valuation_method ?? 'WEIGHTED_AVERAGE',
    opened_date: sp.opened_date ?? '',
    closed_date: sp.closed_date ?? '',
    closure_reason: sp.closure_reason ?? '',
    is_active: sp.is_active ?? true,
    is_locked: sp.is_locked ?? false,
    lock_reason: sp.lock_reason ?? '',
    receives_from_vendor: sp.receives_from_vendor ?? false,
    is_consumption_point: sp.is_consumption_point ?? false,
    is_distribution_point: sp.is_distribution_point ?? true,
    is_default_receiving_point: sp.is_default_receiving_point ?? false,
  };
};

const toPayload = (form) => {
  const {
    stock_point_code,
    cost_center_name,
    ...rest
  } = form;

  return {
    ...rest,
    billing_head_ip: null,
    billing_head_ot: null,
    billing_head_discharge: null,
    operating_days: Array.isArray(rest.operating_days) ? rest.operating_days : [],
    parent_stock_po_id: numOrNull(rest.parent_stock_po_id),
    department_id: numOrNull(rest.department_id),
    cost_center_id: numOrNull(rest.cost_center_id),
    incharge_user_id: numOrNull(rest.incharge_user_id),
    alternate_incharge_user_id: numOrNull(rest.alternate_incharge_user_id),
    store_manager_user_id: numOrNull(rest.store_manager_user_id),
    stock_point_level: numOrNull(rest.stock_point_level),
    capacity_value_limit: numOrNull(rest.capacity_value_limit),
    capacity_qty_limit: numOrNull(rest.capacity_qty_limit),
    latitude: numOrNull(rest.latitude),
    longitude: numOrNull(rest.longitude),
    operating_hours_start: rest.operating_hours_start || null,
    operating_hours_end: rest.operating_hours_end || null,
    opened_date: rest.opened_date || null,
    closed_date: rest.closed_date || null,
  };
};

const Field = ({ label, required, error, children, hint, className = '' }) => (
  <div className={className}>
    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block truncate" title={label}>
      {label}
      {required && <span className="text-red-500"> *</span>}
      {hint && <span className="text-[9px] text-gray-400 ml-1">{hint}</span>}
    </label>
    {children}
    {error && (
      <p className="text-[9px] text-red-600 mt-0.5 flex items-center gap-1">
        <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="truncate">{error}</span>
      </p>
    )}
  </div>
);

const Toggle = ({ label, checked, onChange, disabled }) => (
  <label className={`flex items-center gap-1 text-[10px] text-gray-700 whitespace-nowrap ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-1"
    />
    <span>{label}</span>
  </label>
);

const inputCls = 'w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600';
const errInputCls = 'w-full px-1.5 py-1 border border-red-400 rounded text-xs disabled:bg-gray-50 disabled:text-gray-600';

const cls = (field, errors) => (errors[field] ? errInputCls : inputCls);

const StockPointModal = ({ show, stockPoint, onClose, onSaved, readOnly = false }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showParentStockPointModal, setShowParentStockPointModal] = useState(false);
  const [selectedParentSP, setSelectedParentSP] = useState(null);

  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [showCostCenterModal, setShowCostCenterModal] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState(null);

  const [showInchargeModal, setShowInchargeModal] = useState(false);
  const [selectedIncharge, setSelectedIncharge] = useState(null);

  const [showAlternateInchargeModal, setShowAlternateInchargeModal] = useState(false);
  const [selectedAlternateIncharge, setSelectedAlternateIncharge] = useState(null);

  const [showStoreManagerModal, setShowStoreManagerModal] = useState(false);
  const [selectedStoreManager, setSelectedStoreManager] = useState(null);

  const userEditedShortRef = useRef(false);
  const userEditedAliasRef = useRef(false);
  const debounceRef = useRef({});

  const isEdit = Boolean(stockPoint?.stock_po_id);
  const isDisabled = saveLoading || readOnly;

  useEffect(() => {
    if (!show) {
      setSelectedParentSP(null);
      setSelectedDepartment(null);
      setSelectedCostCenter(null);
      setSelectedIncharge(null);
      setSelectedAlternateIncharge(null);
      setSelectedStoreManager(null);
      setApiError(null);
      setValidationErrors({});
      setTouched({});
      userEditedShortRef.current = false;
      userEditedAliasRef.current = false;
      debounceRef.current = {};
      return;
    }

    setForm(toForm(stockPoint));
    setSelectedParentSP(null);
    setSelectedDepartment(null);
    setSelectedCostCenter(null);
    setSelectedIncharge(null);
    setSelectedAlternateIncharge(null);
    setSelectedStoreManager(null);
    setApiError(null);
    setValidationErrors({});
    setTouched({});
    userEditedShortRef.current = isEdit ? Boolean(stockPoint?.short_name) : false;
    userEditedAliasRef.current = isEdit ? Boolean(stockPoint?.alias_code) : false;
    debounceRef.current = {};
  }, [show, stockPoint, isEdit]);

  const runFieldValidation = useCallback((field, value) => {
    const fn = validators[field];
    if (!fn) return;
    const err = fn(value);
    setValidationErrors((prev) => {
      const n = { ...prev };
      if (err) n[field] = err;
      else delete n[field];
      return n;
    });
  }, []);

  const scheduleFieldValidation = useCallback((field, value) => {
    if (!validators[field]) return;
    if (!touched[field]) return;
    if (debounceRef.current[field]) clearTimeout(debounceRef.current[field]);
    debounceRef.current[field] = setTimeout(() => {
      runFieldValidation(field, value);
    }, 220);
  }, [touched, runFieldValidation]);

  const handleBlur = useCallback((field) => {
    if (!validators[field]) return;
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    runFieldValidation(field, form[field]);
  }, [form, runFieldValidation]);

  const handleChange = useCallback((field, value) => {
    if (readOnly) return;

    let v = value;
    switch (field) {
      case 'pincode':
        v = sanitizeDigits(v, 6);
        break;
      case 'contact_phone':
      case 'alternate_phone':
        v = sanitizePhone(v);
        break;
      case 'pan_number':
        v = sanitizeAlnum(v, 10);
        break;
      case 'gst_number':
        v = sanitizeAlnum(v, 15);
        break;
      case 'cin_number':
        v = sanitizeAlnum(v, 21);
        break;
      case 'dl_number':
        v = sanitizeDl(v);
        break;
      case 'cst_number':
        v = sanitizeAlnum(v, 20);
        break;
      case 'contact_email':
        v = String(v || '').replace(/\s+/g, '').toLowerCase();
        break;
      case 'latitude':
      case 'longitude':
        v = String(v || '').replace(/[^0-9.\-]/g, '');
        break;
      case 'capacity_value_limit':
      case 'capacity_qty_limit':
        v = String(v || '').replace(/[^0-9.]/g, '');
        break;
      default:
        break;
    }

    if (field === 'short_name') userEditedShortRef.current = true;
    if (field === 'alias_code') userEditedAliasRef.current = true;

    setForm((prev) => {
      const next = { ...prev, [field]: v };

      if (field === 'stock_point_name') {
        if (!userEditedShortRef.current) next.short_name = deriveShortName(v);
        if (!userEditedAliasRef.current) next.alias_code = deriveAlias(v);
      }

      if (field === 'stock_point_type') {
        if (v === 'PURCHASE') {
          next.receives_from_vendor = true;
          next.is_distribution_point = true;
          next.is_consumption_point = false;
          next.stock_point_nature = 'PHYSICAL';
        } else if (v === 'CENTRAL') {
          next.receives_from_vendor = false;
          next.is_distribution_point = true;
          next.is_consumption_point = false;
          next.stock_point_nature = 'PHYSICAL';
        } else if (['MEDICAL', 'GENERAL', 'DEPARTMENTAL'].includes(v)) {
          next.receives_from_vendor = false;
          next.is_distribution_point = false;
          next.is_consumption_point = true;
          next.stock_point_nature = 'PHYSICAL';
        } else if (['IN_TRANSIT', 'SCRAP', 'RETURN'].includes(v)) {
          next.receives_from_vendor = false;
          next.is_distribution_point = false;
          next.is_consumption_point = false;
          next.stock_point_nature = 'VIRTUAL';
        }
      }
      return next;
    });

    scheduleFieldValidation(field, v);
    setApiError(null);
  }, [readOnly, scheduleFieldValidation]);

  const handleToggleOperatingDay = useCallback((day) => {
    if (readOnly) return;
    setForm((prev) => {
      const set = new Set(prev.operating_days || []);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, operating_days: Array.from(set).sort((a, b) => a - b) };
    });
  }, [readOnly]);

  const handleParentSPSelect = useCallback(async (sp) => {
    if (readOnly) return;
    setShowParentStockPointModal(false);

    if (!sp) {
      setSelectedParentSP(null);
      setForm((prev) => ({ ...prev, parent_stock_po_id: '', stock_point_level: 1 }));
      return;
    }

    let parentLevel = sp.stock_point_level ?? sp.level;
    if (parentLevel == null && sp.stock_po_id && stockPointsAPI.getStockPoint) {
      try {
        const res = await stockPointsAPI.getStockPoint(sp.stock_po_id);
        const full = res?.data ?? res;
        parentLevel = full?.stock_point_level ?? full?.level;
      } catch { /* ignore */ }
    }

    const parent = { ...sp, stock_point_level: parentLevel };
    setSelectedParentSP(parent);
    setForm((prev) => ({
      ...prev,
      parent_stock_po_id: sp.stock_po_id,
      stock_point_level: deriveLevel(parent),
    }));
  }, [readOnly]);

  const handleDepartmentSelect = useCallback((dept) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, department_id: dept ? (dept.dept_id || dept.id) : '' }));
    setSelectedDepartment(dept || null);
    setShowDepartmentModal(false);
    setValidationErrors((p) => {
      if (!p.department_id) return p;
      const n = { ...p };
      delete n.department_id;
      return n;
    });
  }, [readOnly]);

  const handleCostCenterSelect = useCallback((cc) => {
    if (readOnly) return;
    if (cc) {
      setForm((prev) => ({
        ...prev,
        cost_center_id: cc.cost_center_id,
        cost_center_name: cc.cost_center_name || '',
      }));
      setSelectedCostCenter(cc);
    } else {
      setForm((prev) => ({ ...prev, cost_center_id: '', cost_center_name: '' }));
      setSelectedCostCenter(null);
    }
    setShowCostCenterModal(false);
  }, [readOnly]);

  const handleInchargeSelect = useCallback((user) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, incharge_user_id: user ? (user.emp_id || user.user_id) : '' }));
    setSelectedIncharge(user || null);
    setShowInchargeModal(false);
  }, [readOnly]);

  const handleAlternateInchargeSelect = useCallback((user) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, alternate_incharge_user_id: user ? (user.emp_id || user.user_id) : '' }));
    setSelectedAlternateIncharge(user || null);
    setShowAlternateInchargeModal(false);
  }, [readOnly]);

  const handleStoreManagerSelect = useCallback((user) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, store_manager_user_id: user ? (user.emp_id || user.user_id) : '' }));
    setSelectedStoreManager(user || null);
    setShowStoreManagerModal(false);
  }, [readOnly]);

  const validateAll = useCallback(async () => {
    const syncErrors = {};
    Object.keys(validators).forEach((k) => {
      const err = validators[k](form[k]);
      if (err) syncErrors[k] = err;
    });

    if (form.stock_point_type === 'DEPARTMENTAL' && !form.department_id) {
      syncErrors.department_id = 'Department is required for DEPARTMENTAL';
    }

    let yupErrors = {};
    try {
      await stockPointSchema.validate(
        {
          stock_point_code: form.stock_point_code || null,
          stock_point_name: form.stock_point_name,
          stock_point_type: form.stock_point_type,
          stock_point_category: form.stock_point_category || null,
          stock_point_nature: form.stock_point_nature || null,
          department_id: numOrNull(form.department_id),
          incharge_user_id: numOrNull(form.incharge_user_id),
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          alternate_phone: form.alternate_phone || null,
          gst_number: form.gst_number || null,
          pan_number: form.pan_number || null,
          cin_number: form.cin_number || null,
          pincode: form.pincode || null,
          dl_number: form.dl_number || null,
          cst_number: form.cst_number || null,
          valuation_method: form.valuation_method || null,
          capacity_value_limit: numOrNull(form.capacity_value_limit),
          capacity_qty_limit: numOrNull(form.capacity_qty_limit),
          latitude: numOrNull(form.latitude),
          longitude: numOrNull(form.longitude),
        },
        { abortEarly: false }
      );
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        err.inner.forEach((e) => { if (e.path) yupErrors[e.path] = e.message; });
      }
    }

    const allErrors = { ...yupErrors, ...syncErrors };
    setValidationErrors(allErrors);
    setTouched((prev) => {
      const n = { ...prev };
      Object.keys(validators).forEach((k) => { n[k] = true; });
      n.department_id = true;
      return n;
    });

    if (Object.keys(allErrors).length > 0) {
      toast.error(Object.values(allErrors)[0]);
      return false;
    }
    return true;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (readOnly || saveLoading) return;
    const ok = await validateAll();
    if (!ok) return;

    setSaveLoading(true);
    setApiError(null);
    try {
      const payload = toPayload(form);

      if (isEdit) {
        await stockPointsAPI.updateStockPoint(stockPoint.stock_po_id, payload);
        toast.success('Stock point updated');
      } else {
        await stockPointsAPI.createStockPoint(payload);
        toast.success('Stock point created');
      }
      onSaved?.();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Failed to save';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSaveLoading(false);
    }
  }, [form, isEdit, stockPoint, onSaved, validateAll, readOnly, saveLoading]);

  const displayParentSP = useMemo(() => {
    if (selectedParentSP) {
      const lvl = selectedParentSP.stock_point_level ?? selectedParentSP.level;
      const lvlTxt = lvl != null ? ` (L${lvl})` : '';
      return `${selectedParentSP.stock_point_code} — ${selectedParentSP.stock_point_name}${lvlTxt}`;
    }
    if (form.parent_stock_po_id) return `ID: ${form.parent_stock_po_id}`;
    return 'None (root)';
  }, [selectedParentSP, form.parent_stock_po_id]);

  const displayDepartment = useMemo(() => {
    if (selectedDepartment) return selectedDepartment.name || selectedDepartment.dept_name || selectedDepartment.department_name;
    if (form.department_id) return `ID: ${form.department_id}`;
    return 'Select Department';
  }, [selectedDepartment, form.department_id]);

  const displayCostCenter = useMemo(() => {
    if (selectedCostCenter) return `${selectedCostCenter.cost_center_code} — ${selectedCostCenter.cost_center_name}`;
    if (form.cost_center_id) return `ID: ${form.cost_center_id}`;
    return 'Select Cost Center';
  }, [selectedCostCenter, form.cost_center_id]);

  const displayIncharge = useMemo(() => {
    if (selectedIncharge) return selectedIncharge.display_name || selectedIncharge.full_name || selectedIncharge.name || selectedIncharge.email;
    if (form.incharge_user_id) return `ID: ${form.incharge_user_id}`;
    return 'None';
  }, [selectedIncharge, form.incharge_user_id]);

  const displayAlternateIncharge = useMemo(() => {
    if (selectedAlternateIncharge) return selectedAlternateIncharge.display_name || selectedAlternateIncharge.full_name || selectedAlternateIncharge.name || selectedAlternateIncharge.email;
    if (form.alternate_incharge_user_id) return `ID: ${form.alternate_incharge_user_id}`;
    return 'None';
  }, [selectedAlternateIncharge, form.alternate_incharge_user_id]);

  const displayStoreManager = useMemo(() => {
    if (selectedStoreManager) return selectedStoreManager.display_name || selectedStoreManager.full_name || selectedStoreManager.name || selectedStoreManager.email;
    if (form.store_manager_user_id) return `ID: ${form.store_manager_user_id}`;
    return 'None';
  }, [selectedStoreManager, form.store_manager_user_id]);

  const operatingDays = Array.isArray(form.operating_days) ? form.operating_days : [];

  if (!show) return null;

  const departmentRequired = form.stock_point_type === 'DEPARTMENTAL';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1800px] w-full max-h-[94vh] flex flex-col shadow-xl">

        <div className="flex-shrink-0 flex items-center justify-between gap-3 p-2.5 border-b">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View Stock Point</>
                : (isEdit ? 'Edit Stock Point' : 'Add Stock Point')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {isEdit ? stockPoint?.stock_point_name : 'Enter stock point details'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-3 flex-wrap">
              <Toggle label="Active" checked={form.is_active} onChange={(v) => handleChange('is_active', v)} disabled={isDisabled} />
              <Toggle label="Locked" checked={form.is_locked} onChange={(v) => handleChange('is_locked', v)} disabled={isDisabled} />
              <Toggle label="Vendor" checked={form.receives_from_vendor} onChange={(v) => handleChange('receives_from_vendor', v)} disabled={isDisabled} />
              <Toggle label="Consumption" checked={form.is_consumption_point} onChange={(v) => handleChange('is_consumption_point', v)} disabled={isDisabled} />
              <Toggle label="Distribution" checked={form.is_distribution_point} onChange={(v) => handleChange('is_distribution_point', v)} disabled={isDisabled} />
              <Toggle label="Default Receiving" checked={form.is_default_receiving_point} onChange={(v) => handleChange('is_default_receiving_point', v)} disabled={isDisabled} />
            </div>

            {!readOnly && (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="px-3 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 shadow-sm transition-colors disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" /> {saveLoading ? 'Saving...' : 'Save'}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {apiError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start justify-between mb-3">
              <span className="text-sm text-red-700">{apiError}</span>
              <button onClick={() => setApiError(null)}><X className="w-4 h-4 text-red-500" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3">

            <Field label="Name" required error={validationErrors.stock_point_name} className="col-span-2">
              <input
                type="text"
                value={form.stock_point_name}
                disabled={isDisabled}
                onChange={(e) => handleChange('stock_point_name', e.target.value)}
                onBlur={() => handleBlur('stock_point_name')}
                className={cls('stock_point_name', validationErrors)}
              />
            </Field>
            <Field label="Code" hint="(auto)" error={validationErrors.stock_point_code}>
              <input
                type="text"
                value={form.stock_point_code}
                readOnly
                disabled
                className={`${inputCls} bg-gray-50 placeholder-gray-400 cursor-not-allowed`}
              />
            </Field>
            <Field label="Short Name" hint="(auto)">
              <input
                type="text"
                value={form.short_name}
                disabled={isDisabled}
                onChange={(e) => handleChange('short_name', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Alias Code" hint="(auto)">
              <input
                type="text"
                value={form.alias_code}
                disabled={isDisabled}
                onChange={(e) => handleChange('alias_code', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Type" required error={validationErrors.stock_point_type}>
              <select
                value={form.stock_point_type}
                disabled={isDisabled}
                onChange={(e) => handleChange('stock_point_type', e.target.value)}
                onBlur={() => handleBlur('stock_point_type')}
                className={cls('stock_point_type', validationErrors)}
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={form.stock_point_category}
                disabled={isDisabled}
                onChange={(e) => handleChange('stock_point_category', e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Nature">
              <select
                value={form.stock_point_nature}
                disabled={isDisabled}
                onChange={(e) => handleChange('stock_point_nature', e.target.value)}
                className={inputCls}
              >
                {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>

            <Field label="Level" hint="(auto from parent)">
              <input
                type="text"
                value={form.stock_point_level ?? 1}
                readOnly
                disabled
                title="Auto-derived: parent level + 1"
                className={`${inputCls} bg-gray-50 text-gray-600 cursor-not-allowed`}
              />
            </Field>

            <Field label="Parent Stock Point" className="col-span-2">
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                  onClick={() => !isDisabled && setShowParentStockPointModal(true)}
                >
                  <span className={`truncate ${form.parent_stock_po_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayParentSP}</span>
                  {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
                {form.parent_stock_po_id && !isDisabled && (
                  <button
                    onClick={() => handleParentSPSelect(null)}
                    className="p-0.5 text-gray-400 hover:text-red-600"
                    title="Clear parent"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Field>
            <Field label="Location Name" className="col-span-1">
              <input
                type="text"
                value={form.location_name}
                disabled={isDisabled}
                onChange={(e) => handleChange('location_name', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Group Name">
              <input
                type="text"
                value={form.group_name}
                disabled={isDisabled}
                onChange={(e) => handleChange('group_name', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Registered Name" className="col-span-1">
              <input
                type="text"
                value={form.registered_name}
                disabled={isDisabled}
                onChange={(e) => handleChange('registered_name', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Description" className="col-span-4">
              <textarea
                rows={1}
                value={form.description}
                disabled={isDisabled}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Department" required={departmentRequired} error={validationErrors.department_id} className="col-span-2">
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'} ${validationErrors.department_id ? 'border-red-400' : ''}`}
                  onClick={() => !isDisabled && setShowDepartmentModal(true)}
                >
                  <span className={`truncate ${form.department_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayDepartment}</span>
                  {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
                {form.department_id && !isDisabled && (
                  <button onClick={() => handleDepartmentSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Field>
            <Field label="Cost Center" className="col-span-2">
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                  onClick={() => !isDisabled && setShowCostCenterModal(true)}
                >
                  <span className={`truncate ${form.cost_center_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayCostCenter}</span>
                  {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
                {form.cost_center_id && !isDisabled && (
                  <button onClick={() => handleCostCenterSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Field>
            <Field label="Cost Center Name" hint="(auto)" className="col-span-2">
              <input
                type="text"
                value={form.cost_center_name || ''}
                readOnly
                disabled
                placeholder="Auto-filled..."
                className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`}
              />
            </Field>
            <Field label="Incharge User" className="col-span-2">
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                  onClick={() => !isDisabled && setShowInchargeModal(true)}
                >
                  <span className={`truncate ${form.incharge_user_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayIncharge}</span>
                  {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
                {form.incharge_user_id && !isDisabled && (
                  <button onClick={() => handleInchargeSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Field>
            <Field label="Alternate Incharge" className="col-span-2">
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                  onClick={() => !isDisabled && setShowAlternateInchargeModal(true)}
                >
                  <span className={`truncate ${form.alternate_incharge_user_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayAlternateIncharge}</span>
                  {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
                {form.alternate_incharge_user_id && !isDisabled && (
                  <button onClick={() => handleAlternateInchargeSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Field>
            <Field label="Store Manager" className="col-span-2">
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                  onClick={() => !isDisabled && setShowStoreManagerModal(true)}
                >
                  <span className={`truncate ${form.store_manager_user_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayStoreManager}</span>
                  {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                </div>
                {form.store_manager_user_id && !isDisabled && (
                  <button onClick={() => handleStoreManagerSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Field>

            <Field label="Address Line 1" className="col-span-2">
              <input
                type="text"
                value={form.address_line1}
                disabled={isDisabled}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                className={inputCls}
                placeholder="shrirampur"
              />
            </Field>
            <Field label="Address Line 2" className="col-span-2">
              <input
                type="text"
                value={form.address_line2}
                disabled={isDisabled}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                className={inputCls}
                placeholder="Maharashtra"
              />
            </Field>
            <Field label="Address Line 3" className="col-span-2">
              <input
                type="text"
                value={form.address_line3}
                disabled={isDisabled}
                onChange={(e) => handleChange('address_line3', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="City" className="col-span-1">
              <input
                type="text"
                value={form.city}
                disabled={isDisabled}
                onChange={(e) => handleChange('city', e.target.value)}
                className={inputCls}
                placeholder="shrirampur"
              />
            </Field>
            <Field label="State" className="col-span-1">
              <input
                type="text"
                value={form.state}
                disabled={isDisabled}
                onChange={(e) => handleChange('state', e.target.value)}
                className={inputCls}
                placeholder="MAHARASHTRA"
              />
            </Field>
            <Field label="Country" className="col-span-1">
              <input
                type="text"
                value={form.country}
                disabled={isDisabled}
                onChange={(e) => handleChange('country', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Pincode" error={validationErrors.pincode} className="col-span-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                disabled={isDisabled}
                onChange={(e) => handleChange('pincode', e.target.value)}
                onBlur={() => handleBlur('pincode')}
                className={cls('pincode', validationErrors)}
                placeholder="413709"
              />
            </Field>
            <Field label="Latitude" error={validationErrors.latitude} className="col-span-1">
              <input
                type="number" step="0.000001" min="-90" max="90"
                value={form.latitude}
                disabled={isDisabled}
                onChange={(e) => handleChange('latitude', e.target.value)}
                onBlur={() => handleBlur('latitude')}
                className={cls('latitude', validationErrors)}
              />
            </Field>
            <Field label="Longitude" error={validationErrors.longitude} className="col-span-1">
              <input
                type="number" step="0.000001" min="-180" max="180"
                value={form.longitude}
                disabled={isDisabled}
                onChange={(e) => handleChange('longitude', e.target.value)}
                onBlur={() => handleBlur('longitude')}
                className={cls('longitude', validationErrors)}
              />
            </Field>

            <Field label="Contact Person" className="col-span-2">
              <input
                type="text"
                value={form.contact_person_name}
                disabled={isDisabled}
                onChange={(e) => handleChange('contact_person_name', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Contact Phone" error={validationErrors.contact_phone} className="col-span-1">
              <input
                type="tel"
                inputMode="tel"
                maxLength={14}
                value={form.contact_phone}
                disabled={isDisabled}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                onBlur={() => handleBlur('contact_phone')}
                className={cls('contact_phone', validationErrors)}
                placeholder="9876543210"
              />
            </Field>
            <Field label="Alternate Phone" error={validationErrors.alternate_phone} className="col-span-1">
              <input
                type="tel"
                inputMode="tel"
                maxLength={14}
                value={form.alternate_phone}
                disabled={isDisabled}
                onChange={(e) => handleChange('alternate_phone', e.target.value)}
                onBlur={() => handleBlur('alternate_phone')}
                className={cls('alternate_phone', validationErrors)}
                placeholder="+919876543210"
              />
            </Field>
            <Field label="Contact Email" error={validationErrors.contact_email} className="col-span-2">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={120}
                value={form.contact_email}
                disabled={isDisabled}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                onBlur={() => handleBlur('contact_email')}
                className={cls('contact_email', validationErrors)}
                placeholder="name@example.com"
              />
            </Field>

            <Field label="Tax Rule" className="col-span-2">
              <input
                type="text"
                value={form.tax_rule}
                disabled={isDisabled}
                onChange={(e) => handleChange('tax_rule', e.target.value)}
                className={inputCls}
                placeholder="PURCRATE-DISCOUNT+TAX"
              />
            </Field>
            <Field label="GST #" error={validationErrors.gst_number} className="col-span-2">
              <input
                type="text"
                maxLength={15}
                value={form.gst_number}
                disabled={isDisabled}
                onChange={(e) => handleChange('gst_number', e.target.value)}
                onBlur={() => handleBlur('gst_number')}
                className={`${cls('gst_number', validationErrors)} uppercase`}
                placeholder="27ABCDE1234F1Z5"
              />
            </Field>
            <Field label="PAN #" error={validationErrors.pan_number} className="col-span-2">
              <input
                type="text"
                maxLength={10}
                value={form.pan_number}
                disabled={isDisabled}
                onChange={(e) => handleChange('pan_number', e.target.value)}
                onBlur={() => handleBlur('pan_number')}
                className={`${cls('pan_number', validationErrors)} uppercase`}
                placeholder="ABCDE1234F"
              />
            </Field>
            <Field label="CIN #" error={validationErrors.cin_number} className="col-span-2">
              <input
                type="text"
                maxLength={21}
                value={form.cin_number}
                disabled={isDisabled}
                onChange={(e) => handleChange('cin_number', e.target.value)}
                onBlur={() => handleBlur('cin_number')}
                className={`${cls('cin_number', validationErrors)} uppercase`}
                placeholder="U12345MH2010PTC123456"
              />
            </Field>
            <Field label="DL # (comma separated)" error={validationErrors.dl_number} className="col-span-2">
              <input
                type="text"
                maxLength={60}
                value={form.dl_number}
                disabled={isDisabled}
                onChange={(e) => handleChange('dl_number', e.target.value)}
                onBlur={() => handleBlur('dl_number')}
                className={`${cls('dl_number', validationErrors)} uppercase`}
                placeholder="MH-12-1234567,MH-12-7654321"
              />
            </Field>
            <Field label="CST #" error={validationErrors.cst_number} className="col-span-2">
              <input
                type="text"
                maxLength={20}
                value={form.cst_number}
                disabled={isDisabled}
                onChange={(e) => handleChange('cst_number', e.target.value)}
                onBlur={() => handleBlur('cst_number')}
                className={`${cls('cst_number', validationErrors)} uppercase`}
                placeholder="CST-123456"
              />
            </Field>

            <Field label="Opens At">
              <input
                type="time"
                value={form.operating_hours_start}
                disabled={isDisabled}
                onChange={(e) => handleChange('operating_hours_start', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Closes At">
              <input
                type="time"
                value={form.operating_hours_end}
                disabled={isDisabled}
                onChange={(e) => handleChange('operating_hours_end', e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Timezone" className="col-span-2">
              <input
                type="text"
                value={form.timezone}
                disabled={isDisabled}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Capacity (Value)" error={validationErrors.capacity_value_limit} className="col-span-1">
              <input
                type="number" step="0.01" min="0"
                value={form.capacity_value_limit}
                disabled={isDisabled}
                onChange={(e) => handleChange('capacity_value_limit', e.target.value)}
                onBlur={() => handleBlur('capacity_value_limit')}
                className={cls('capacity_value_limit', validationErrors)}
              />
            </Field>
            <Field label="Capacity (Qty)" error={validationErrors.capacity_qty_limit} className="col-span-1">
              <input
                type="number" step="0.01" min="0"
                value={form.capacity_qty_limit}
                disabled={isDisabled}
                onChange={(e) => handleChange('capacity_qty_limit', e.target.value)}
                onBlur={() => handleBlur('capacity_qty_limit')}
                className={cls('capacity_qty_limit', validationErrors)}
              />
            </Field>
            <Field label="Currency">
              <select
                value={form.currency}
                disabled={isDisabled}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={inputCls}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
            <Field label="Valuation">
              <select
                value={form.valuation_method}
                disabled={isDisabled}
                onChange={(e) => handleChange('valuation_method', e.target.value)}
                className={inputCls}
              >
                {VALUATIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>

            <Field label="Opened Date" className="col-span-1">
              <input
                type="date"
                value={form.opened_date}
                disabled={isDisabled}
                onChange={(e) => handleChange('opened_date', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Closed Date" className="col-span-1">
              <input
                type="date"
                value={form.closed_date}
                disabled={isDisabled}
                onChange={(e) => handleChange('closed_date', e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="col-span-2">
              <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Operating Days</label>
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleToggleOperatingDay(d)}
                    disabled={isDisabled}
                    className={`px-1.5 py-0.5 text-[10px] rounded border ${operatingDays.includes(d)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white border-gray-300 text-gray-700'
                      } disabled:opacity-70`}
                  >
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][d - 1]}{d}
                  </button>
                ))}
              </div>
            </div>

            {form.is_locked && (
              <div className="col-span-full">
                <Field label="Lock Reason">
                  <textarea
                    rows={2}
                    value={form.lock_reason}
                    disabled={isDisabled}
                    onChange={(e) => handleChange('lock_reason', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            {form.closed_date && (
              <div className="col-span-full">
                <Field label="Closure Reason">
                  <textarea
                    rows={2}
                    value={form.closure_reason}
                    disabled={isDisabled}
                    onChange={(e) => handleChange('closure_reason', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER — fixed, never scrolls */}
        <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {isEdit
              ? `Last updated: ${stockPoint?.updated_at || stockPoint?.updatedAt || '—'}`
              : 'New stock point'}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <StockPointSelectionModal
          show={showParentStockPointModal}
          onClose={() => setShowParentStockPointModal(false)}
          onSelect={handleParentSPSelect}
          selectedStockPointId={form.parent_stock_po_id || null}
          excludeStockPointId={isEdit ? stockPoint?.stock_po_id : undefined}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <DepartmentSelectionModal
          show={showDepartmentModal}
          onClose={() => setShowDepartmentModal(false)}
          onSelect={handleDepartmentSelect}
          selectedDepartmentId={form.department_id || null}
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <CostCenterSelectionModal
          show={showCostCenterModal}
          onClose={() => setShowCostCenterModal(false)}
          onSelect={handleCostCenterSelect}
          selectedCostCenterId={form.cost_center_id || null}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <EmployeeSelectionModal
          show={showInchargeModal}
          onClose={() => setShowInchargeModal(false)}
          onSelect={handleInchargeSelect}
          selectedEmployeeId={form.incharge_user_id || null}
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <EmployeeSelectionModal
          show={showAlternateInchargeModal}
          onClose={() => setShowAlternateInchargeModal(false)}
          onSelect={handleAlternateInchargeSelect}
          selectedEmployeeId={form.alternate_incharge_user_id || null}
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <EmployeeSelectionModal
          show={showStoreManagerModal}
          onClose={() => setShowStoreManagerModal(false)}
          onSelect={handleStoreManagerSelect}
          selectedEmployeeId={form.store_manager_user_id || null}
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(StockPointModal);
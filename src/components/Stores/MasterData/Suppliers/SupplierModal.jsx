// src/modules/Suppliers/SupplierModal.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  X, Save, Eye, AlertCircle, ChevronRight,
} from 'lucide-react';
import { suppliersAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const SupplierSelectionModal = lazy(() => import('./SupplierSelectionModal'));

/* ---------------- Constants ---------------- */
const SUPPLIER_TYPES = [
  'MANUFACTURER', 'DISTRIBUTOR', 'DEALER', 'AGENT',
  'SERVICE_PROVIDER', 'CONTRACTOR', 'IMPORTER', 'CONSULTANT',
];
const SUPPLIER_CATEGORIES = [
  'RAW_MATERIAL', 'CONSUMABLE', 'CAPITAL', 'MEDICAL',
  'IT', 'SPARE', 'SERVICE', 'MULTI_CATEGORY',
];
const BUSINESS_CLASSES = ['MSME', 'LARGE', 'MULTINATIONAL', 'LOCAL', 'FOREIGN'];
const OWNERSHIP_TYPES = [
  'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LTD',
  'PUBLIC_LTD', 'GOVERNMENT', 'TRUST', 'SOCIETY',
];
const ONBOARDING_STAGES = [
  'REGISTERED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'SITE_AUDIT',
  'SAMPLE_APPROVAL', 'TRIAL_ORDER', 'APPROVED', 'REJECTED',
];
const GST_TYPES = ['REGULAR', 'COMPOSITION', 'UNREGISTERED', 'SEZ', 'OVERSEAS'];
const MSME_TYPES = ['MICRO', 'SMALL', 'MEDIUM'];
const PAYMENT_METHODS = [
  'BANK_TRANSFER', 'CHEQUE', 'LC', 'BG', 'CASH', 'NEFT', 'RTGS', 'UPI',
];
const INCOTERMS = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
const RISK_RATINGS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const RATING_GRADES = ['A', 'B', 'C', 'D'];
const CREDIT_RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'C', 'D'];
const PREF_LANGS = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'gu', 'bn'];
const PREF_COMMS = ['EMAIL', 'PHONE', 'PORTAL', 'WHATSAPP', 'SMS'];
const FREIGHT_TERMS = ['INCLUDED', 'EXCLUDED', 'TO_PAY'];
const INSURANCE_RESP = ['SUPPLIER', 'BUYER', 'SHARED'];

/* ---------------- Patterns ---------------- */
const PATTERNS = {
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z][0-9A-Z]$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  TAN: /^[A-Z]{4}[0-9]{5}[A-Z]$/,
  CIN: /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9+\-\s()]{6,20}$/,
};

/* ---------------- Sanitizers ---------------- */
const sanitizeUpper = (v, max) =>
  String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max);

const sanitizePhone = (v) =>
  String(v || '').replace(/[^0-9+\-\s()]/g, '').slice(0, 20);

const sanitizeDecimal = (v) =>
  String(v || '').replace(/[^0-9.\-]/g, '');

const sanitizeInt = (v, max = 10) =>
  String(v || '').replace(/\D/g, '').slice(0, max);

/* ---------------- Yup schema ---------------- */
const supplierSchema = yup.object().shape({
  supplier_code: yup.string().trim().max(30, 'Max 30 chars')
    .matches(/^[A-Z0-9\-]+$/, 'Only uppercase letters, digits and dashes')
    .required('Supplier code is required'),
  legal_name: yup.string().trim().min(2, 'Min 2 chars').max(250, 'Max 250 chars')
    .required('Legal name is required'),
  trade_name: yup.string().trim().max(250).nullable(),
  short_name: yup.string().trim().max(50).nullable(),
  description: yup.string().trim().max(2000).nullable(),

  supplier_type: yup.string().oneOf(SUPPLIER_TYPES, 'Invalid type').required('Type is required'),
  supplier_category: yup.string().oneOf(SUPPLIER_CATEGORIES, 'Invalid category').required('Category is required'),
  business_classification: yup.string().oneOf([...BUSINESS_CLASSES, '', null]).nullable(),
  ownership_type: yup.string().oneOf([...OWNERSHIP_TYPES, '', null]).nullable(),
  industry_sector: yup.string().trim().max(100).nullable(),
  supplier_since: yup.string().nullable(),

  status: yup.string().oneOf([
    'DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE',
    'SUSPENDED', 'BLACKLISTED', 'PROBATION', 'ARCHIVED',
  ]).required('Status is required'),
  onboarding_stage: yup.string().oneOf([...ONBOARDING_STAGES, '', null]).nullable(),

  gstin: yup.string().trim().uppercase().nullable()
    .test('gstin-format', 'Invalid GSTIN (15-char format)', v => !v || PATTERNS.GSTIN.test(v)),
  gst_registration_type: yup.string().oneOf([...GST_TYPES, '', null]).nullable(),
  pan: yup.string().trim().uppercase().nullable()
    .test('pan-format', 'Invalid PAN (AAAAA9999A)', v => !v || PATTERNS.PAN.test(v)),
  tan: yup.string().trim().uppercase().nullable()
    .test('tan-format', 'Invalid TAN (AAAA99999A)', v => !v || PATTERNS.TAN.test(v)),
  cin: yup.string().trim().uppercase().nullable()
    .test('cin-format', 'Invalid CIN', v => !v || PATTERNS.CIN.test(v)),
  tax_registration_no: yup.string().trim().max(30).nullable(),
  vat_no: yup.string().trim().max(30).nullable(),
  msme_certificate_no: yup.string().trim().max(30).nullable(),
  msme_type: yup.string().oneOf([...MSME_TYPES, '', null]).nullable(),
  udyam_registration_no: yup.string().trim().max(30).nullable(),
  startup_india_certificate_no: yup.string().trim().max(30).nullable(),
  tds_section: yup.string().trim().max(20).nullable(),
  tds_rate: yup.number().min(0, 'Must be ≥ 0').max(100, 'Max 100').nullable(),

  primary_contact_name: yup.string().trim().max(150).nullable(),
  primary_email: yup.string().trim()
    .test('email-format', 'Invalid email', v => !v || PATTERNS.EMAIL.test(v))
    .nullable(),
  primary_phone: yup.string().trim()
    .test('phone-format', 'Invalid phone number', v => !v || PATTERNS.PHONE.test(v))
    .nullable(),
  alternate_phone: yup.string().trim()
    .test('alt-phone-format', 'Invalid alternate phone', v => !v || PATTERNS.PHONE.test(v))
    .nullable(),
  website: yup.string().trim().url('Invalid URL').nullable(),
  preferred_language: yup.string().oneOf(PREF_LANGS).nullable(),
  preferred_communication: yup.string().oneOf(PREF_COMMS).nullable(),

  default_currency: yup.string().oneOf(['INR', 'USD', 'EUR', 'GBP']).nullable(),
  payment_terms_days: yup.number().integer().min(0, 'Must be ≥ 0').max(365, 'Max 365 days').nullable(),
  payment_terms_code: yup.string().trim().max(20).nullable(),
  payment_method: yup.string().oneOf(PAYMENT_METHODS).nullable(),
  incoterms: yup.string().oneOf([...INCOTERMS, '', null]).nullable(),
  incoterms_place: yup.string().trim().max(100).nullable(),
  default_lead_time_days: yup.number().integer().min(0, 'Must be ≥ 0').max(365, 'Max 365 days').nullable(),
  moq: yup.number().min(0, 'Must be ≥ 0').nullable(),
  order_multiple: yup.number().min(0, 'Must be ≥ 0').nullable(),
  credit_limit: yup.number().min(0, 'Must be ≥ 0').max(1e12, 'Too large').nullable(),
  credit_days: yup.number().integer().min(0, 'Must be ≥ 0').max(365, 'Max 365 days').nullable(),
  credit_rating: yup.string().oneOf([...CREDIT_RATINGS, '', null]).nullable(),
  advance_payment_percent: yup.number().min(0, 'Must be ≥ 0').max(100, 'Max 100%').nullable(),
  retention_percent: yup.number().min(0, 'Must be ≥ 0').max(100, 'Max 100%').nullable(),
  warranty_terms: yup.string().trim().max(2000).nullable(),
  warranty_period_months: yup.number().integer().min(0).max(600, 'Max 600 months').nullable(),
  ld_clause: yup.string().trim().max(2000).nullable(),
  ld_percent_per_week: yup.number().min(0).max(100, 'Max 100%').nullable(),
  ld_max_percent: yup.number().min(0).max(100, 'Max 100%').nullable(),
  freight_terms_default: yup.string().oneOf([...FREIGHT_TERMS, '', null]).nullable(),
  insurance_responsibility: yup.string().oneOf([...INSURANCE_RESP, '', null]).nullable(),
  packing_standards: yup.string().trim().max(2000).nullable(),
  return_policy: yup.string().trim().max(2000).nullable(),

  overall_rating: yup.number().min(0, 'Must be ≥ 0').max(5, 'Max 5').nullable(),
  rating_grade: yup.string().oneOf([...RATING_GRADES, '', null]).nullable(),
  delivery_score: yup.number().min(0).max(100, 'Max 100').nullable(),
  quality_score: yup.number().min(0).max(100, 'Max 100').nullable(),
  price_score: yup.number().min(0).max(100, 'Max 100').nullable(),
  responsiveness_score: yup.number().min(0).max(100, 'Max 100').nullable(),
  documentation_score: yup.number().min(0).max(100, 'Max 100').nullable(),
  compliance_score: yup.number().min(0).max(100, 'Max 100').nullable(),

  risk_rating: yup.string().oneOf(RISK_RATINGS).nullable(),
  esg_score: yup.number().min(0).max(100, 'Max 100').nullable(),
  portal_user_id: yup.number().integer().nullable(),
  remarks: yup.string().trim().max(2000).nullable(),
});

/* ---------------- Form shape ---------------- */
const EMPTY_FORM = {
  parent_supplier_id: '',
  supplier_code: '',
  legal_name: '',
  trade_name: '',
  short_name: '',
  description: '',

  supplier_type: 'DISTRIBUTOR',
  supplier_category: 'MEDICAL',
  business_classification: '',
  ownership_type: '',
  industry_sector: '',
  supplier_since: '',

  status: 'PENDING_APPROVAL',
  onboarding_stage: 'REGISTERED',
  onboarding_date: '',
  approval_date: '',
  approval_expiry_date: '',
  activation_date: '',
  deactivation_date: '',
  deactivation_reason: '',
  blacklist_reason: '',
  blacklist_date: '',
  blacklist_until: '',
  reinstatement_date: '',

  gstin: '',
  gst_registration_type: '',
  pan: '',
  tan: '',
  cin: '',
  tax_registration_no: '',
  vat_no: '',
  msme_certificate_no: '',
  msme_type: '',
  udyam_registration_no: '',
  startup_india_certificate_no: '',
  tds_section: '',
  tds_rate: '',

  primary_contact_name: '',
  primary_email: '',
  primary_phone: '',
  alternate_phone: '',
  website: '',
  preferred_language: 'en',
  preferred_communication: 'EMAIL',

  default_currency: 'INR',
  payment_terms_days: 30,
  payment_terms_code: '',
  payment_method: 'BANK_TRANSFER',
  incoterms: '',
  incoterms_place: '',
  default_lead_time_days: '',
  moq: '',
  order_multiple: '',
  credit_limit: 0,
  credit_days: 30,
  credit_rating: '',
  advance_payment_percent: 0,
  retention_percent: 0,
  warranty_terms: '',
  warranty_period_months: '',
  ld_clause: '',
  ld_percent_per_week: '',
  ld_max_percent: '',
  freight_terms_default: '',
  insurance_responsibility: '',
  packing_standards: '',
  return_policy: '',

  overall_rating: 0,
  rating_grade: '',
  delivery_score: 0,
  quality_score: 0,
  price_score: 0,
  responsiveness_score: 0,
  documentation_score: 0,
  compliance_score: 0,

  risk_rating: 'MEDIUM',
  is_single_source: false,
  is_critical_supplier: false,
  is_msme: false,
  is_startup: false,
  is_diversity_supplier: false,
  is_foreign: false,
  compliance_hold: false,
  compliance_hold_reason: '',
  payment_hold: false,
  payment_hold_reason: '',
  po_hold: false,
  po_hold_reason: '',

  portal_access_enabled: false,
  portal_user_id: '',

  esg_score: '',
  code_of_conduct_accepted: false,
  anti_bribery_declaration: false,
  conflict_of_interest_declared: false,
  nda_signed: false,

  remarks: '',
  tags: [],
};

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const toForm = (s) => {
  if (!s) return { ...EMPTY_FORM };
  const out = { ...EMPTY_FORM };
  for (const k of Object.keys(EMPTY_FORM)) {
    if (s[k] !== undefined && s[k] !== null) out[k] = s[k];
  }
  if (Array.isArray(s.tags)) out.tags = s.tags;
  return out;
};

/* ---------------- Payload builder — empty dates → null ---------------- */
const toPayload = (form, isEdit) => {
  const p = { ...form };

  // Numeric coercion
  [
    'parent_supplier_id',
    'payment_terms_days', 'credit_days', 'credit_limit',
    'advance_payment_percent', 'retention_percent',
    'default_lead_time_days', 'moq', 'order_multiple',
    'warranty_period_months', 'ld_percent_per_week', 'ld_max_percent',
    'overall_rating', 'delivery_score', 'quality_score', 'price_score',
    'responsiveness_score', 'documentation_score', 'compliance_score',
    'tds_rate', 'esg_score', 'portal_user_id',
  ].forEach(k => { p[k] = numOrNull(p[k]); });

  // Drop empty strings for enum/optional fields
  ['business_classification', 'ownership_type', 'gst_registration_type',
    'msme_type', 'credit_rating', 'rating_grade',
    'incoterms', 'incoterms_place', 'freight_terms_default',
    'insurance_responsibility', 'preferred_communication',
  ].forEach(k => { if (!p[k]) delete p[k]; });

  // ---------- ALL date & datetime fields → null when empty ----------
  [
    // DATE-only
    'supplier_since',
    'onboarding_date',
    'approval_date',
    'approval_expiry_date',
    'activation_date',
    'deactivation_date',
    'reinstatement_date',
    // DATETIME
    'blacklist_date',
    'blacklist_until',
  ].forEach(k => {
    if (p[k] === '' || p[k] === undefined || p[k] === null) {
      p[k] = null;
    }
  });

  // On create: force PENDING_APPROVAL
  if (!isEdit) {
    p.status = 'PENDING_APPROVAL';
  }

  return p;
};

/* ---------- atoms (ItemModal-style) ---------- */
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
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-1"
    />
    <span>{label}</span>
  </label>
);

const SectionCard = ({ title, children, className = '', cols = 'grid-cols-4' }) => (
  <div className={`overflow-hidden ${className}`}>
    <div className="px-2.5 pt-2 pb-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wider whitespace-nowrap">
          {title}
        </span>
        <span className="h-[1.5px] flex-1 bg-primary-500 rounded-full" />
      </div>
    </div>
    <div className="px-2.5 pb-2.5">
      <div className={`grid ${cols} gap-2`}>
        {children}
      </div>
    </div>
  </div>
);

const inputCls = 'w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600';
const errInputCls = 'w-full px-1.5 py-1 border border-red-400 rounded text-xs disabled:bg-gray-50 disabled:text-gray-600';
const clsFor = (field, errors) => (errors[field] ? errInputCls : inputCls);

const SupplierModal = ({ show, supplier, onClose, onSaved, readOnly = false }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showParentModal, setShowParentModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  const isEdit = Boolean(supplier?.supplier_id);
  const isDisabled = saveLoading || readOnly;

  useEffect(() => {
    if (!show) {
      setApiError(null);
      setValidationErrors({});
      setSelectedParent(null);
      setShowParentModal(false);
      return;
    }
    setForm(toForm(supplier));
    setApiError(null);
    setValidationErrors({});
    setSelectedParent(supplier?.parent || null);
    setShowParentModal(false);
  }, [show, supplier]);

  const handleChange = useCallback((field, rawValue) => {
    if (readOnly) return;

    let value = rawValue;
    switch (field) {
      case 'supplier_code': value = sanitizeUpper(value, 30); break;
      case 'gstin': value = sanitizeUpper(value, 15); break;
      case 'pan': value = sanitizeUpper(value, 10); break;
      case 'tan': value = sanitizeUpper(value, 10); break;
      case 'cin': value = sanitizeUpper(value, 21); break;
      case 'primary_phone':
      case 'alternate_phone': value = sanitizePhone(value); break;
      case 'payment_terms_days':
      case 'credit_days':
      case 'default_lead_time_days':
      case 'warranty_period_months':
      case 'portal_user_id': value = sanitizeInt(value, 5); break;
      case 'moq':
      case 'order_multiple':
      case 'credit_limit':
      case 'advance_payment_percent':
      case 'retention_percent':
      case 'ld_percent_per_week':
      case 'ld_max_percent':
      case 'overall_rating':
      case 'delivery_score':
      case 'quality_score':
      case 'price_score':
      case 'responsiveness_score':
      case 'documentation_score':
      case 'compliance_score':
      case 'tds_rate':
      case 'esg_score': value = sanitizeDecimal(value); break;
      default: value = rawValue;
    }

    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(p => { const n = { ...p }; delete n[field]; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError, readOnly]);

  const handleParentSelect = useCallback((s) => {
    if (readOnly) return;
    if (s) {
      handleChange('parent_supplier_id', s.supplier_id);
      setSelectedParent(s);
    } else {
      handleChange('parent_supplier_id', '');
      setSelectedParent(null);
    }
    setShowParentModal(false);
  }, [handleChange, readOnly]);

  const validate = useCallback(async () => {
    try {
      await supplierSchema.validate(
        {
          supplier_code: form.supplier_code,
          legal_name: form.legal_name,
          trade_name: form.trade_name || null,
          short_name: form.short_name || null,
          description: form.description || null,
          supplier_type: form.supplier_type,
          supplier_category: form.supplier_category,
          business_classification: form.business_classification || null,
          ownership_type: form.ownership_type || null,
          industry_sector: form.industry_sector || null,
          supplier_since: form.supplier_since || null,
          status: form.status,
          onboarding_stage: form.onboarding_stage || null,
          gstin: form.gstin || null,
          gst_registration_type: form.gst_registration_type || null,
          pan: form.pan || null,
          tan: form.tan || null,
          cin: form.cin || null,
          tax_registration_no: form.tax_registration_no || null,
          vat_no: form.vat_no || null,
          msme_certificate_no: form.msme_certificate_no || null,
          msme_type: form.msme_type || null,
          udyam_registration_no: form.udyam_registration_no || null,
          startup_india_certificate_no: form.startup_india_certificate_no || null,
          tds_section: form.tds_section || null,
          tds_rate: numOrNull(form.tds_rate),
          primary_contact_name: form.primary_contact_name || null,
          primary_email: form.primary_email || null,
          primary_phone: form.primary_phone || null,
          alternate_phone: form.alternate_phone || null,
          website: form.website || null,
          preferred_language: form.preferred_language || null,
          preferred_communication: form.preferred_communication || null,
          default_currency: form.default_currency || null,
          payment_terms_days: numOrNull(form.payment_terms_days),
          payment_terms_code: form.payment_terms_code || null,
          payment_method: form.payment_method || null,
          incoterms: form.incoterms || null,
          incoterms_place: form.incoterms_place || null,
          default_lead_time_days: numOrNull(form.default_lead_time_days),
          moq: numOrNull(form.moq),
          order_multiple: numOrNull(form.order_multiple),
          credit_limit: numOrNull(form.credit_limit),
          credit_days: numOrNull(form.credit_days),
          credit_rating: form.credit_rating || null,
          advance_payment_percent: numOrNull(form.advance_payment_percent),
          retention_percent: numOrNull(form.retention_percent),
          warranty_terms: form.warranty_terms || null,
          warranty_period_months: numOrNull(form.warranty_period_months),
          ld_clause: form.ld_clause || null,
          ld_percent_per_week: numOrNull(form.ld_percent_per_week),
          ld_max_percent: numOrNull(form.ld_max_percent),
          freight_terms_default: form.freight_terms_default || null,
          insurance_responsibility: form.insurance_responsibility || null,
          packing_standards: form.packing_standards || null,
          return_policy: form.return_policy || null,
          overall_rating: numOrNull(form.overall_rating),
          rating_grade: form.rating_grade || null,
          delivery_score: numOrNull(form.delivery_score),
          quality_score: numOrNull(form.quality_score),
          price_score: numOrNull(form.price_score),
          responsiveness_score: numOrNull(form.responsiveness_score),
          documentation_score: numOrNull(form.documentation_score),
          compliance_score: numOrNull(form.compliance_score),
          risk_rating: form.risk_rating || null,
          esg_score: numOrNull(form.esg_score),
          portal_user_id: numOrNull(form.portal_user_id),
          remarks: form.remarks || null,
        },
        { abortEarly: false }
      );

      /* ---------- Cross-field business rules ---------- */
      const extra = {};

      if (form.gstin && form.pan && form.gstin.length === 15) {
        const gstPan = form.gstin.slice(2, 12);
        if (gstPan !== form.pan.toUpperCase()) {
          extra.pan = 'PAN does not match the PAN portion of GSTIN';
        }
      }

      if (form.is_msme && !String(form.msme_certificate_no || '').trim()) {
        extra.msme_certificate_no = 'MSME certificate no. is required when MSME is enabled';
      }
      if (form.is_msme && !form.msme_type) {
        extra.msme_type = 'MSME type is required when MSME is enabled';
      }
      if (form.is_startup && !String(form.startup_india_certificate_no || '').trim()) {
        extra.startup_india_certificate_no = 'Startup India certificate is required when Startup is enabled';
      }

      if (isEdit && form.status === 'BLACKLISTED' && !String(form.blacklist_reason || '').trim()) {
        extra.blacklist_reason = 'Blacklist reason is required';
      }

      if (form.compliance_hold && !String(form.compliance_hold_reason || '').trim()) {
        extra.compliance_hold_reason = 'Compliance Hold reason is required';
      }
      if (form.payment_hold && !String(form.payment_hold_reason || '').trim()) {
        extra.payment_hold_reason = 'Payment Hold reason is required';
      }
      if (form.po_hold && !String(form.po_hold_reason || '').trim()) {
        extra.po_hold_reason = 'PO Hold reason is required';
      }

      if (form.portal_access_enabled && !String(form.portal_user_id || '').trim()) {
        extra.portal_user_id = 'Portal User ID is required when Portal Access is enabled';
      }

      const moq = numOrNull(form.moq);
      const om = numOrNull(form.order_multiple);
      if (moq != null && om != null && moq > om) {
        extra.moq = 'MOQ cannot exceed Order Multiple';
      }

      const cd = numOrNull(form.credit_days);
      const pt = numOrNull(form.payment_terms_days);
      if (cd != null && pt != null && cd > pt * 3) {
        extra.credit_days = 'Credit days unreasonably higher than payment terms';
      }

      if (form.approval_date && form.approval_expiry_date) {
        if (new Date(form.approval_expiry_date) <= new Date(form.approval_date)) {
          extra.approval_expiry_date = 'Approval expiry must be after approval date';
        }
      }

      if (form.activation_date && form.deactivation_date) {
        if (new Date(form.deactivation_date) < new Date(form.activation_date)) {
          extra.deactivation_date = 'Deactivation date cannot be before activation date';
        }
      }

      if (form.supplier_since) {
        const d = new Date(form.supplier_since);
        if (d > new Date()) {
          extra.supplier_since = 'Supplier Since cannot be in the future';
        }
      }

      const or = numOrNull(form.overall_rating);
      if (or != null && form.rating_grade) {
        const gradeMap = { A: [4, 5], B: [3, 4], C: [2, 3], D: [0, 2] };
        const [lo, hi] = gradeMap[form.rating_grade] || [0, 5];
        if (or < lo || or > hi) {
          extra.rating_grade = `Grade ${form.rating_grade} suggests rating ${lo}–${hi}`;
        }
      }

      if (Object.keys(extra).length > 0) {
        setValidationErrors(extra);
        toast.error(Object.values(extra)[0]);
        return false;
      }

      setValidationErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors = {};
        err.inner.forEach(e => { errors[e.path] = e.message; });
        setValidationErrors(errors);
        toast.error(Object.values(errors)[0]);
      }
      return false;
    }
  }, [form, isEdit]);

  const handleSave = useCallback(async () => {
    if (readOnly) return;
    const ok = await validate();
    if (!ok) return;

    setSaveLoading(true);
    setApiError(null);
    try {
      const payload = toPayload(form, isEdit);
      if (isEdit) {
        await suppliersAPI.updateSupplier(supplier.supplier_id, payload);
        toast.success('Supplier updated');
      } else {
        await suppliersAPI.createSupplier(payload);
        toast.success('Supplier created (Pending Approval)');
      }
      onSaved();
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
  }, [form, isEdit, supplier, onSaved, validate, readOnly]);

  const displayParent = useMemo(() => {
    if (selectedParent) return `${selectedParent.supplier_code} — ${selectedParent.legal_name}`;
    if (form.parent_supplier_id) return `ID: ${form.parent_supplier_id}`;
    return 'None';
  }, [selectedParent, form.parent_supplier_id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1600px] w-full max-h-[94vh] flex flex-col shadow-xl">
        {/* HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 p-2.5 border-b">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View Supplier</>
                : (isEdit ? 'Edit Supplier' : 'Add Supplier')}
              {!isEdit && !readOnly && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                  NEW → PENDING_APPROVAL
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {isEdit ? supplier.legal_name : 'Enter supplier details'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-3 flex-wrap">
              <Toggle label="MSME" checked={form.is_msme} onChange={v => handleChange('is_msme', v)} disabled={isDisabled} />
              <Toggle label="Startup" checked={form.is_startup} onChange={v => handleChange('is_startup', v)} disabled={isDisabled} />
              <Toggle label="Critical" checked={form.is_critical_supplier} onChange={v => handleChange('is_critical_supplier', v)} disabled={isDisabled} />
              <Toggle label="Single Source" checked={form.is_single_source} onChange={v => handleChange('is_single_source', v)} disabled={isDisabled} />
              < Toggle label="Foreign" checked={form.is_foreign} onChange={v => handleChange('is_foreign', v)} disabled={isDisabled} />
              <Toggle label="Portal" checked={form.portal_access_enabled} onChange={v => handleChange('portal_access_enabled', v)} disabled={isDisabled} />
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
            <button onClick={onClose} disabled={saveLoading} className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {apiError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start justify-between mb-3">
              <span className="text-sm text-red-700">{apiError}</span>
              <button onClick={() => setApiError(null)}><X className="w-4 h-4 text-red-500" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-3">

            {/* 1 · IDENTITY */}
            <SectionCard title="Identity" className="col-span-full" cols="grid-cols-6">
              <Field label="Legal Name" required error={validationErrors.legal_name}>
                <input type="text" value={form.legal_name} disabled={isDisabled}
                  onChange={e => handleChange('legal_name', e.target.value)}
                  className={clsFor('legal_name', validationErrors)} />
              </Field>
              <Field label="Code" required error={validationErrors.supplier_code}>
                <input type="text" value={form.supplier_code} disabled={isDisabled}
                  onChange={e => handleChange('supplier_code', e.target.value)}
                  className={`${clsFor('supplier_code', validationErrors)} uppercase`} />
              </Field>
              <Field label="Trade Name">
                <input type="text" value={form.trade_name} disabled={isDisabled}
                  onChange={e => handleChange('trade_name', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Short Name">
                <input type="text" value={form.short_name} disabled={isDisabled}
                  onChange={e => handleChange('short_name', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Parent Supplier">
                <div className="flex items-center gap-1">
                  <div
                    className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'
                      }`}
                    onClick={() => !isDisabled && setShowParentModal(true)}
                  >
                    <span className={`truncate ${form.parent_supplier_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayParent}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                  </div>
                  {form.parent_supplier_id && !isDisabled && (
                    <button onClick={() => handleParentSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Supplier Since" error={validationErrors.supplier_since}>
                <input type="date" value={form.supplier_since} disabled={isDisabled}
                  onChange={e => handleChange('supplier_since', e.target.value)}
                  className={clsFor('supplier_since', validationErrors)} />
              </Field>
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                <Field label="Description" error={validationErrors.description}>
                  <textarea rows={2} value={form.description} disabled={isDisabled}
                    onChange={e => handleChange('description', e.target.value)}
                    className={`${clsFor('description', validationErrors)} resize-y`} />
                </Field>
              </div>
            </SectionCard>

            {/* 2 · CLASSIFICATION */}
            <SectionCard title="Classification" className="col-span-full" cols="grid-cols-6">
              <Field label="Type" required error={validationErrors.supplier_type}>
                <select value={form.supplier_type} disabled={isDisabled}
                  onChange={e => handleChange('supplier_type', e.target.value)}
                  className={clsFor('supplier_type', validationErrors)}>
                  {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Category" required error={validationErrors.supplier_category}>
                <select value={form.supplier_category} disabled={isDisabled}
                  onChange={e => handleChange('supplier_category', e.target.value)}
                  className={clsFor('supplier_category', validationErrors)}>
                  {SUPPLIER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Business Class">
                <select value={form.business_classification} disabled={isDisabled}
                  onChange={e => handleChange('business_classification', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {BUSINESS_CLASSES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Ownership">
                <select value={form.ownership_type} disabled={isDisabled}
                  onChange={e => handleChange('ownership_type', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {OWNERSHIP_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Industry Sector">
                <input type="text" value={form.industry_sector} disabled={isDisabled}
                  onChange={e => handleChange('industry_sector', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Onboarding Stage">
                <select value={form.onboarding_stage} disabled={isDisabled}
                  onChange={e => handleChange('onboarding_stage', e.target.value)}
                  className={inputCls}>
                  {ONBOARDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </SectionCard>

            {/* 3 · LIFECYCLE */}
            <SectionCard title="Lifecycle Dates" className="col-span-full" cols="grid-cols-6">
              <Field label="Onboarding Date">
                <input type="date" value={form.onboarding_date} disabled={isDisabled}
                  onChange={e => handleChange('onboarding_date', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Approval Date">
                <input type="date" value={form.approval_date} disabled={isDisabled}
                  onChange={e => handleChange('approval_date', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Approval Expiry" error={validationErrors.approval_expiry_date}>
                <input type="date" value={form.approval_expiry_date} disabled={isDisabled}
                  onChange={e => handleChange('approval_expiry_date', e.target.value)}
                  className={clsFor('approval_expiry_date', validationErrors)} />
              </Field>
              <Field label="Activation Date">
                <input type="date" value={form.activation_date} disabled={isDisabled}
                  onChange={e => handleChange('activation_date', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Deactivation Date" error={validationErrors.deactivation_date}>
                <input type="date" value={form.deactivation_date} disabled={isDisabled}
                  onChange={e => handleChange('deactivation_date', e.target.value)}
                  className={clsFor('deactivation_date', validationErrors)} />
              </Field>
              <Field label="Reinstatement Date">
                <input type="date" value={form.reinstatement_date} disabled={isDisabled}
                  onChange={e => handleChange('reinstatement_date', e.target.value)}
                  className={inputCls} />
              </Field>
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                <Field label="Deactivation Reason">
                  <textarea rows={2} value={form.deactivation_reason} disabled={isDisabled}
                    onChange={e => handleChange('deactivation_reason', e.target.value)}
                    className={inputCls} />
                </Field>
              </div>
              {isEdit && form.status === 'BLACKLISTED' && (
                <>
                  <Field label="Blacklist Date">
                    <input type="datetime-local" value={form.blacklist_date} disabled={isDisabled}
                      onChange={e => handleChange('blacklist_date', e.target.value)}
                      className={inputCls} />
                  </Field>
                  <Field label="Blacklist Until">
                    <input type="datetime-local" value={form.blacklist_until} disabled={isDisabled}
                      onChange={e => handleChange('blacklist_until', e.target.value)}
                      className={inputCls} />
                  </Field>
                  <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                    <Field label="Blacklist Reason" error={validationErrors.blacklist_reason}>
                      <textarea rows={2} value={form.blacklist_reason} disabled={isDisabled}
                        onChange={e => handleChange('blacklist_reason', e.target.value)}
                        className={clsFor('blacklist_reason', validationErrors)} />
                    </Field>
                  </div>
                </>
              )}
            </SectionCard>

            {/* 4 · STATUTORY & TAX */}
            <SectionCard title="Statutory & Tax" className="col-span-full" cols="grid-cols-7">
              <Field label="GSTIN" error={validationErrors.gstin}>
                <input type="text" value={form.gstin} disabled={isDisabled}
                  onChange={e => handleChange('gstin', e.target.value)}
                  className={`${clsFor('gstin', validationErrors)} font-mono`} />
              </Field>
              <Field label="GST Reg Type">
                <select value={form.gst_registration_type} disabled={isDisabled}
                  onChange={e => handleChange('gst_registration_type', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {GST_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="PAN" error={validationErrors.pan}>
                <input type="text" value={form.pan} disabled={isDisabled}
                  onChange={e => handleChange('pan', e.target.value)}
                  className={`${clsFor('pan', validationErrors)} font-mono`} />
              </Field>
              <Field label="TAN" error={validationErrors.tan}>
                <input type="text" value={form.tan} disabled={isDisabled}
                  onChange={e => handleChange('tan', e.target.value)}
                  className={`${clsFor('tan', validationErrors)} font-mono`} />
              </Field>
              <Field label="CIN" error={validationErrors.cin}>
                <input type="text" value={form.cin} disabled={isDisabled}
                  onChange={e => handleChange('cin', e.target.value)}
                  className={`${clsFor('cin', validationErrors)} font-mono`} />
              </Field>
              <Field label="Tax Reg No">
                <input type="text" value={form.tax_registration_no} disabled={isDisabled}
                  onChange={e => handleChange('tax_registration_no', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="VAT No">
                <input type="text" value={form.vat_no} disabled={isDisabled}
                  onChange={e => handleChange('vat_no', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="MSME Cert No" error={validationErrors.msme_certificate_no}>
                <input type="text" value={form.msme_certificate_no} disabled={isDisabled}
                  onChange={e => handleChange('msme_certificate_no', e.target.value)}
                  className={clsFor('msme_certificate_no', validationErrors)} />
              </Field>
              <Field label="MSME Type" error={validationErrors.msme_type}>
                <select value={form.msme_type} disabled={isDisabled}
                  onChange={e => handleChange('msme_type', e.target.value)}
                  className={clsFor('msme_type', validationErrors)}>
                  <option value="">—</option>
                  {MSME_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Udyam Reg No">
                <input type="text" value={form.udyam_registration_no} disabled={isDisabled}
                  onChange={e => handleChange('udyam_registration_no', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Startup India Cert" error={validationErrors.startup_india_certificate_no}>
                <input type="text" value={form.startup_india_certificate_no} disabled={isDisabled}
                  onChange={e => handleChange('startup_india_certificate_no', e.target.value)}
                  className={clsFor('startup_india_certificate_no', validationErrors)} />
              </Field>
              <Field label="TDS Section">
                <input type="text" value={form.tds_section} disabled={isDisabled}
                  onChange={e => handleChange('tds_section', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="TDS Rate %" error={validationErrors.tds_rate}>
                <input type="number" step="0.01" min="0" max="100" value={form.tds_rate}
                  disabled={isDisabled}
                  onChange={e => handleChange('tds_rate', e.target.value)}
                  className={clsFor('tds_rate', validationErrors)} />
              </Field>
            </SectionCard>

            {/* 5 · CONTACT */}
            <SectionCard title="Contact" className="col-span-full" cols="grid-cols-7">
              <Field label="Contact Name">
                <input type="text" value={form.primary_contact_name} disabled={isDisabled}
                  onChange={e => handleChange('primary_contact_name', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Email" error={validationErrors.primary_email}>
                <input type="email" value={form.primary_email} disabled={isDisabled}
                  onChange={e => handleChange('primary_email', e.target.value)}
                  className={clsFor('primary_email', validationErrors)} />
              </Field>
              <Field label="Phone" error={validationErrors.primary_phone}>
                <input type="text" value={form.primary_phone} disabled={isDisabled}
                  onChange={e => handleChange('primary_phone', e.target.value)}
                  className={clsFor('primary_phone', validationErrors)} />
              </Field>
              <Field label="Alternate Phone" error={validationErrors.alternate_phone}>
                <input type="text" value={form.alternate_phone} disabled={isDisabled}
                  onChange={e => handleChange('alternate_phone', e.target.value)}
                  className={clsFor('alternate_phone', validationErrors)} />
              </Field>
              <Field label="Website" error={validationErrors.website}>
                <input type="url" value={form.website} disabled={isDisabled}
                  onChange={e => handleChange('website', e.target.value)}
                  className={clsFor('website', validationErrors)} />
              </Field>
              <Field label="Preferred Language">
                <select value={form.preferred_language} disabled={isDisabled}
                  onChange={e => handleChange('preferred_language', e.target.value)}
                  className={inputCls}>
                  {PREF_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Preferred Communication">
                <select value={form.preferred_communication} disabled={isDisabled}
                  onChange={e => handleChange('preferred_communication', e.target.value)}
                  className={inputCls}>
                  {PREF_COMMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </SectionCard>

            {/* 6 · COMMERCIAL TERMS */}
            <SectionCard title="Commercial Terms" className="col-span-full" cols="grid-cols-10">
              <Field label="Currency">
                <select value={form.default_currency} disabled={isDisabled}
                  onChange={e => handleChange('default_currency', e.target.value)}
                  className={inputCls}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </Field>
              <Field label="Payment Terms (days)" error={validationErrors.payment_terms_days}>
                <input type="number" min="0" value={form.payment_terms_days}
                  disabled={isDisabled}
                  onChange={e => handleChange('payment_terms_days', e.target.value)}
                  className={clsFor('payment_terms_days', validationErrors)} />
              </Field>
              <Field label="Payment Terms Code">
                <input type="text" value={form.payment_terms_code} disabled={isDisabled}
                  onChange={e => handleChange('payment_terms_code', e.target.value)}
                  placeholder="NET30, ADVANCE..."
                  className={inputCls} />
              </Field>
              <Field label="Payment Method">
                <select value={form.payment_method} disabled={isDisabled}
                  onChange={e => handleChange('payment_method', e.target.value)}
                  className={inputCls}>
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Incoterms">
                <select value={form.incoterms} disabled={isDisabled}
                  onChange={e => handleChange('incoterms', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Incoterms Place">
                <input type="text" value={form.incoterms_place} disabled={isDisabled}
                  onChange={e => handleChange('incoterms_place', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Lead Time (days)" error={validationErrors.default_lead_time_days}>
                <input type="number" min="0" value={form.default_lead_time_days}
                  disabled={isDisabled}
                  onChange={e => handleChange('default_lead_time_days', e.target.value)}
                  className={clsFor('default_lead_time_days', validationErrors)} />
              </Field>
              <Field label="MOQ" error={validationErrors.moq}>
                <input type="number" step="0.0001" min="0" value={form.moq}
                  disabled={isDisabled}
                  onChange={e => handleChange('moq', e.target.value)}
                  className={clsFor('moq', validationErrors)} />
              </Field>
              <Field label="Order Multiple" error={validationErrors.order_multiple}>
                <input type="number" step="0.0001" value={form.order_multiple}
                  disabled={isDisabled}
                  onChange={e => handleChange('order_multiple', e.target.value)}
                  className={clsFor('order_multiple', validationErrors)} />
              </Field>
              <Field label="Credit Limit" error={validationErrors.credit_limit}>
                <input type="number" step="0.0001" min="0" value={form.credit_limit}
                  disabled={isDisabled}
                  onChange={e => handleChange('credit_limit', e.target.value)}
                  className={clsFor('credit_limit', validationErrors)} />
              </Field>
              <Field label="Credit Days" error={validationErrors.credit_days}>
                <input type="number" min="0" value={form.credit_days}
                  disabled={isDisabled}
                  onChange={e => handleChange('credit_days', e.target.value)}
                  className={clsFor('credit_days', validationErrors)} />
              </Field>
              <Field label="Credit Rating">
                <select value={form.credit_rating} disabled={isDisabled}
                  onChange={e => handleChange('credit_rating', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {CREDIT_RATINGS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Advance %" error={validationErrors.advance_payment_percent}>
                <input type="number" step="0.01" min="0" max="100" value={form.advance_payment_percent}
                  disabled={isDisabled}
                  onChange={e => handleChange('advance_payment_percent', e.target.value)}
                  className={clsFor('advance_payment_percent', validationErrors)} />
              </Field>
              <Field label="Retention %" error={validationErrors.retention_percent}>
                <input type="number" step="0.01" min="0" max="100" value={form.retention_percent}
                  disabled={isDisabled}
                  onChange={e => handleChange('retention_percent', e.target.value)}
                  className={clsFor('retention_percent', validationErrors)} />
              </Field>
              <Field label="Warranty (months)" error={validationErrors.warranty_period_months}>
                <input type="number" min="0" value={form.warranty_period_months}
                  disabled={isDisabled}
                  onChange={e => handleChange('warranty_period_months', e.target.value)}
                  className={clsFor('warranty_period_months', validationErrors)} />
              </Field>
              <Field label="LD % / week" error={validationErrors.ld_percent_per_week}>
                <input type="number" step="0.01" min="0" max="100" value={form.ld_percent_per_week}
                  disabled={isDisabled}
                  onChange={e => handleChange('ld_percent_per_week', e.target.value)}
                  className={clsFor('ld_percent_per_week', validationErrors)} />
              </Field>
              <Field label="LD Max %" error={validationErrors.ld_max_percent}>
                <input type="number" step="0.01" min="0" max="100" value={form.ld_max_percent}
                  disabled={isDisabled}
                  onChange={e => handleChange('ld_max_percent', e.target.value)}
                  className={clsFor('ld_max_percent', validationErrors)} />
              </Field>
              <Field label="Freight Terms">
                <select value={form.freight_terms_default} disabled={isDisabled}
                  onChange={e => handleChange('freight_terms_default', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {FREIGHT_TERMS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Insurance Resp.">
                <select value={form.insurance_responsibility} disabled={isDisabled}
                  onChange={e => handleChange('insurance_responsibility', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {INSURANCE_RESP.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <div className="col-span-full">
                <Field label="Warranty Terms">
                  <textarea rows={2} value={form.warranty_terms} disabled={isDisabled}
                    onChange={e => handleChange('warranty_terms', e.target.value)}
                    className={`${inputCls} resize-y`} />
                </Field>
              </div>
              <div className="col-span-full">
                <Field label="LD Clause">
                  <textarea rows={2} value={form.ld_clause} disabled={isDisabled}
                    onChange={e => handleChange('ld_clause', e.target.value)}
                    className={`${inputCls} resize-y`} />
                </Field>
              </div>
              <div className="col-span-5">
                <Field label="Packing Standards">
                  <textarea rows={2} value={form.packing_standards} disabled={isDisabled}
                    onChange={e => handleChange('packing_standards', e.target.value)}
                    className={`${inputCls} resize-y`} />
                </Field>
              </div>
              <div className="col-span-5">
                <Field label="Return Policy">
                  <textarea rows={2} value={form.return_policy} disabled={isDisabled}
                    onChange={e => handleChange('return_policy', e.target.value)}
                    className={`${inputCls} resize-y`} />
                </Field>
              </div>
            </SectionCard>

            {/* 7 · PERFORMANCE */}
            <SectionCard title="Performance" className="col-span-6" cols="grid-cols-4">
              <Field label="Overall Rating" hint="(0–5)" error={validationErrors.overall_rating}>
                <input type="number" step="0.01" min="0" max="5" value={form.overall_rating}
                  disabled={isDisabled}
                  onChange={e => handleChange('overall_rating', e.target.value)}
                  className={clsFor('overall_rating', validationErrors)} />
              </Field>
              <Field label="Rating Grade" error={validationErrors.rating_grade}>
                <select value={form.rating_grade} disabled={isDisabled}
                  onChange={e => handleChange('rating_grade', e.target.value)}
                  className={clsFor('rating_grade', validationErrors)}>
                  <option value="">—</option>
                  {RATING_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Delivery Score" error={validationErrors.delivery_score}>
                <input type="number" step="0.01" min="0" max="100" value={form.delivery_score}
                  disabled={isDisabled}
                  onChange={e => handleChange('delivery_score', e.target.value)}
                  className={clsFor('delivery_score', validationErrors)} />
              </Field>
              <Field label="Quality Score" error={validationErrors.quality_score}>
                <input type="number" step="0.01" min="0" max="100" value={form.quality_score}
                  disabled={isDisabled}
                  onChange={e => handleChange('quality_score', e.target.value)}
                  className={clsFor('quality_score', validationErrors)} />
              </Field>
              <Field label="Price Score" error={validationErrors.price_score}>
                <input type="number" step="0.01" min="0" max="100" value={form.price_score}
                  disabled={isDisabled}
                  onChange={e => handleChange('price_score', e.target.value)}
                  className={clsFor('price_score', validationErrors)} />
              </Field>
              <Field label="Responsiveness" error={validationErrors.responsiveness_score}>
                <input type="number" step="0.01" min="0" max="100" value={form.responsiveness_score}
                  disabled={isDisabled}
                  onChange={e => handleChange('responsiveness_score', e.target.value)}
                  className={clsFor('responsiveness_score', validationErrors)} />
              </Field>
              <Field label="Documentation" error={validationErrors.documentation_score}>
                <input type="number" step="0.01" min="0" max="100" value={form.documentation_score}
                  disabled={isDisabled}
                  onChange={e => handleChange('documentation_score', e.target.value)}
                  className={clsFor('documentation_score', validationErrors)} />
              </Field>
              <Field label="Compliance Score" error={validationErrors.compliance_score}>
                <input type="number" step="0.01" min="0" max="100" value={form.compliance_score}
                  disabled={isDisabled}
                  onChange={e => handleChange('compliance_score', e.target.value)}
                  className={clsFor('compliance_score', validationErrors)} />
              </Field>
            </SectionCard>

            {/* 8 · RISK & HOLDS */}
            <SectionCard title="Risk & Holds" className="col-span-6" cols="grid-cols-6">
              <Field label="Risk Rating" className="col-span-2">
                <select value={form.risk_rating} disabled={isDisabled}
                  onChange={e => handleChange('risk_rating', e.target.value)}
                  className={inputCls}>
                  {RISK_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="ESG Score" className="col-span-2" error={validationErrors.esg_score}>
                <input type="number" step="0.01" min="0" max="100" value={form.esg_score}
                  disabled={isDisabled}
                  onChange={e => handleChange('esg_score', e.target.value)}
                  className={clsFor('esg_score', validationErrors)} />
              </Field>
              {form.portal_access_enabled && (
                <Field label="Portal User ID" className="col-span-2" error={validationErrors.portal_user_id}>
                  <input type="number" value={form.portal_user_id} disabled={isDisabled}
                    onChange={e => handleChange('portal_user_id', e.target.value)}
                    className={clsFor('portal_user_id', validationErrors)} />
                </Field>
              )}
              <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t">
                <Toggle label="Single Source" checked={form.is_single_source} onChange={v => handleChange('is_single_source', v)} disabled={isDisabled} />
                <Toggle label="Critical Supplier" checked={form.is_critical_supplier} onChange={v => handleChange('is_critical_supplier', v)} disabled={isDisabled} />
                <Toggle label="MSME" checked={form.is_msme} onChange={v => handleChange('is_msme', v)} disabled={isDisabled} />
                <Toggle label="Startup" checked={form.is_startup} onChange={v => handleChange('is_startup', v)} disabled={isDisabled} />
                <Toggle label="Diversity" checked={form.is_diversity_supplier} onChange={v => handleChange('is_diversity_supplier', v)} disabled={isDisabled} />
                <Toggle label="Foreign" checked={form.is_foreign} onChange={v => handleChange('is_foreign', v)} disabled={isDisabled} />
              </div>
              <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t">
                <Toggle label="Compliance Hold" checked={form.compliance_hold} onChange={v => handleChange('compliance_hold', v)} disabled={isDisabled} />
                <Toggle label="Payment Hold" checked={form.payment_hold} onChange={v => handleChange('payment_hold', v)} disabled={isDisabled} />
                <Toggle label="PO Hold" checked={form.po_hold} onChange={v => handleChange('po_hold', v)} disabled={isDisabled} />
                <Toggle label="Portal Access" checked={form.portal_access_enabled} onChange={v => handleChange('portal_access_enabled', v)} disabled={isDisabled} />
              </div>
              {form.compliance_hold && (
                <div className="col-span-full">
                  <Field label="Compliance Hold Reason" error={validationErrors.compliance_hold_reason}>
                    <textarea rows={2} value={form.compliance_hold_reason} disabled={isDisabled}
                      onChange={e => handleChange('compliance_hold_reason', e.target.value)}
                      className={clsFor('compliance_hold_reason', validationErrors)} />
                  </Field>
                </div>
              )}
              {form.payment_hold && (
                <div className="col-span-full">
                  <Field label="Payment Hold Reason" error={validationErrors.payment_hold_reason}>
                    <textarea rows={2} value={form.payment_hold_reason} disabled={isDisabled}
                      onChange={e => handleChange('payment_hold_reason', e.target.value)}
                      className={clsFor('payment_hold_reason', validationErrors)} />
                  </Field>
                </div>
              )}
              {form.po_hold && (
                <div className="col-span-full">
                  <Field label="PO Hold Reason" error={validationErrors.po_hold_reason}>
                    <textarea rows={2} value={form.po_hold_reason} disabled={isDisabled}
                      onChange={e => handleChange('po_hold_reason', e.target.value)}
                      className={clsFor('po_hold_reason', validationErrors)} />
                  </Field>
                </div>
              )}
            </SectionCard>

            {/* 9 · COMPLIANCE & DECLARATIONS */}
            <SectionCard title="Compliance & Declarations" className="col-span-4" cols="grid-cols-2">
              <Toggle label="Code of Conduct Accepted" checked={form.code_of_conduct_accepted} onChange={v => handleChange('code_of_conduct_accepted', v)} disabled={isDisabled} />
              <Toggle label="Anti-Bribery Declaration" checked={form.anti_bribery_declaration} onChange={v => handleChange('anti_bribery_declaration', v)} disabled={isDisabled} />
              <Toggle label="Conflict of Interest Declared" checked={form.conflict_of_interest_declared} onChange={v => handleChange('conflict_of_interest_declared', v)} disabled={isDisabled} />
              <Toggle label="NDA Signed" checked={form.nda_signed} onChange={v => handleChange('nda_signed', v)} disabled={isDisabled} />
            </SectionCard>

            {/* 10 · REMARKS */}
            <SectionCard title="Remarks" className="col-span-8" cols="grid-cols-1">
              <Field label="Remarks / Notes" error={validationErrors.remarks}>
                <textarea rows={3} value={form.remarks} disabled={isDisabled}
                  onChange={e => handleChange('remarks', e.target.value)}
                  placeholder="Any internal notes about this supplier..."
                  className={`${clsFor('remarks', validationErrors)} resize-y`} />
              </Field>
            </SectionCard>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {isEdit
              ? `Last updated: ${supplier?.updated_at || supplier?.updatedAt || '—'}`
              : 'New supplier — will be submitted as PENDING_APPROVAL'}
          </p>
          {isEdit && supplier?.status && (
            <p className="text-[10px] text-gray-500">
              Current status: <span className="font-medium text-gray-700">{supplier.status}</span>
            </p>
          )}
        </div>
      </div>

      {/* PARENT SUPPLIER PICKER */}
      <Suspense fallback={null}>
        <SupplierSelectionModal
          show={showParentModal && !readOnly}
          onClose={() => setShowParentModal(false)}
          onSelect={handleParentSelect}
          selectedSupplierId={form.parent_supplier_id || null}
          excludeSupplierId={isEdit ? supplier?.supplier_id : undefined}
          onlyActive
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(SupplierModal);
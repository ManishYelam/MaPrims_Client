// src/modules/Items/ItemModal.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  X, Save, ChevronRight, Eye, AlertCircle,
} from 'lucide-react';
import { itemsAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const UomSelectionModal = lazy(() => import('../Uoms/UomSelectionModal'));
const ItemCategorySelectionModal = lazy(() => import('../ItemCategories/ItemCategorySelectionModal'));

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const ITEM_TYPES = ['STOCKED', 'NON_STOCKED', 'SERVICE', 'CAPITAL'];
const ITEM_NATURES = [
  'CONSUMABLE', 'SPARE', 'RAW_MATERIAL', 'FINISHED_GOOD',
  'MEDICINE', 'IT_ASSET', 'STATIONERY', 'HOUSEKEEPING', 'OTHER',
];
const ABC_CLASSES = ['A', 'B', 'C'];
const VED_CLASSES = ['V', 'E', 'D'];
const PROCUREMENT_TYPES = ['PURCHASE', 'MANUFACTURE', 'SUBCONTRACT', 'TRANSFER'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

/* ------------------------------------------------------------------ */
/* Patterns & sanitizers                                               */
/* ------------------------------------------------------------------ */
const PATTERNS = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z][0-9A-Z]$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  BARCODE: /^[0-9]{8,14}$/,
  GTIN: /^(\d{8}|\d{12}|\d{13}|\d{14})$/,
  UPC: /^\d{12}$/,
  EAN: /^(\d{8}|\d{13})$/,
  HSN: /^\d{4,8}$/,
};

const sanitizeAlnum = (v, max) =>
  String(v || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, max);

const sanitizeDigits = (v, max) =>
  String(v || '').replace(/\D/g, '').slice(0, max);

const sanitizeDecimal = (v) =>
  String(v || '').replace(/[^0-9.\-]/g, '');

const sanitizeInt = (v, max) =>
  String(v || '').replace(/\D/g, '').slice(0, max);

/* ------------------------------------------------------------------ */
/* Yup schema — comprehensive                                          */
/* ------------------------------------------------------------------ */
const itemSchema = yup.object().shape({
  // Identity
  item_code: yup.string().trim().max(50, 'Max 50 chars').required('Item code is required'),
  item_name: yup.string().trim().max(200, 'Max 200 chars').required('Item name is required'),
  short_name: yup.string().trim().max(100, 'Max 100 chars').nullable(),
  description: yup.string().trim().nullable(),
  specifications: yup.string().trim().nullable(),

  // Classification
  item_type: yup.string().oneOf(ITEM_TYPES, 'Invalid type').required('Type is required'),
  item_nature: yup.string().oneOf([...ITEM_NATURES, null, '']).nullable(),
  item_group: yup.string().trim().max(100, 'Max 100 chars').nullable(),
  abc_class: yup.string().oneOf([...ABC_CLASSES, null, '']).nullable(),
  ved_class: yup.string().oneOf([...VED_CLASSES, null, '']).nullable(),

  // UoM
  base_uom_id: yup.number().required('Base UoM is required').positive(),
  purchase_uom_id: yup.number().nullable(),
  issue_uom_id: yup.number().nullable(),
  conversion_factor: yup.number().min(0, 'Must be ≥ 0').max(1e9, 'Too large').nullable(),

  // Traceability
  shelf_life_days: yup.number().integer('Must be integer').min(0, 'Must be ≥ 0').max(36500, 'Max 36500 days').nullable(),

  // Storage
  storage_conditions: yup.string().trim().max(200, 'Max 200 chars').nullable(),
  hazard_class: yup.string().trim().max(50, 'Max 50 chars').nullable(),
  temperature_min: yup.number().min(-90, 'Min −90°C').max(90, 'Max 90°C').nullable(),
  temperature_max: yup.number().min(-90, 'Min −90°C').max(90, 'Max 90°C').nullable(),
  max_stack_height: yup.number().min(0, 'Must be ≥ 0').nullable(),

  // Pricing
  standard_cost: yup.number().min(0, 'Must be ≥ 0').nullable(),
  last_purchase_price: yup.number().min(0, 'Must be ≥ 0').nullable(),
  average_cost: yup.number().min(0, 'Must be ≥ 0').nullable(),
  selling_price: yup.number().min(0, 'Must be ≥ 0').nullable(),
  mrp: yup.number().min(0, 'Must be ≥ 0').nullable(),
  currency: yup.string().oneOf(CURRENCIES, 'Invalid currency').nullable(),
  valuation_class: yup.string().trim().max(50).nullable(),

  // Tax
  tax_category: yup.string().trim().max(20, 'Max 20 chars').nullable(),
  hsn_sac_code: yup.string().trim().max(20).nullable()
    .test('hsn', 'HSN/SAC must be 4–8 digits', (v) => !v || /^\d{4,8}$/.test(v)),
  tax_rate: yup.number().min(0, 'Must be ≥ 0').max(100, 'Max 100').nullable(),
  excise_duty_pct: yup.number().min(0, 'Must be ≥ 0').max(100, 'Max 100').nullable(),

  // Procurement
  default_lead_time_days: yup.number().integer().min(0, 'Must be ≥ 0').max(365, 'Max 365 days').nullable(),
  min_order_qty: yup.number().min(0, 'Must be ≥ 0').nullable(),
  order_multiple: yup.number().min(0, 'Must be ≥ 0').nullable(),
  procurement_type: yup.string().oneOf(PROCUREMENT_TYPES).nullable(),
  country_of_origin: yup.string().trim().max(100, 'Max 100 chars').nullable(),

  // Identifiers
  barcode: yup.string().trim().nullable()
    .test('barcode', 'Barcode must be 8–14 digits', (v) => !v || /^\d{8,14}$/.test(v)),
  gtin: yup.string().trim().nullable()
    .test('gtin', 'GTIN must be 8/12/13/14 digits', (v) => !v || PATTERNS.GTIN.test(v)),
  upc: yup.string().trim().nullable()
    .test('upc', 'UPC must be 12 digits', (v) => !v || PATTERNS.UPC.test(v)),
  ean: yup.string().trim().nullable()
    .test('ean', 'EAN must be 8 or 13 digits', (v) => !v || PATTERNS.EAN.test(v)),
  qr_code: yup.string().trim().max(100, 'Max 100 chars').nullable(),

  // Medical
  drug_schedule: yup.string().trim().max(20).nullable(),
  generic_name: yup.string().trim().max(200).nullable(),
  strength: yup.string().trim().max(50).nullable(),
  dosage_form: yup.string().trim().max(50).nullable(),
  route_of_administration: yup.string().trim().max(50).nullable(),

  // Remarks
  remarks: yup.string().trim().nullable(),
});

/* ------------------------------------------------------------------ */
/* Form shape                                                          */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = {
  category_id: '', item_code: '', item_name: '', short_name: '',
  description: '', specifications: '', brand: '', manufacturer: '',
  model_number: '', part_number: '',
  item_type: 'STOCKED', item_nature: '', item_group: '', abc_class: '', ved_class: '',
  base_uom_id: '', purchase_uom_id: '', issue_uom_id: '', conversion_factor: 1,
  lot_controlled: false, serial_controlled: false, expiry_controlled: false,
  shelf_life_days: '', manufacture_date_required: false, qc_required: false,
  inspection_parameters: [],
  hazardous: false, hazard_class: '', storage_conditions: '',
  temperature_min: '', temperature_max: '', fragile: false, stackable: true,
  max_stack_height: '',
  standard_cost: '', last_purchase_price: '', average_cost: '',
  selling_price: '', mrp: '', currency: 'INR', valuation_class: '',
  tax_category: '', hsn_sac_code: '', tax_rate: 0, excise_duty_pct: 0,
  default_lead_time_days: '', min_order_qty: '', order_multiple: '',
  procurement_type: 'PURCHASE', is_single_source: false, is_imported: false,
  country_of_origin: '',
  barcode: '', qr_code: '', gtin: '', upc: '', ean: '',
  image_url: '', thumbnail_url: '',
  drug_schedule: '', generic_name: '', strength: '', dosage_form: '',
  route_of_administration: '',
  is_obsolete: false, is_slow_moving: false, is_asset: false,
  is_returnable: true, is_saleable: false, is_active: true, remarks: '',
};

const numOrNull = (v) =>
  v === '' || v === null || v === undefined ? null : Number(v);

const toForm = (i) => {
  if (!i) return { ...EMPTY_FORM };
  const out = { ...EMPTY_FORM };
  for (const k of Object.keys(EMPTY_FORM)) {
    if (i[k] !== undefined && i[k] !== null) out[k] = i[k];
  }
  return out;
};

const toPayload = (form) => {
  const p = { ...form };
  [
    'base_uom_id', 'purchase_uom_id', 'issue_uom_id', 'category_id',
    'shelf_life_days', 'temperature_min', 'temperature_max',
    'max_stack_height', 'standard_cost', 'last_purchase_price',
    'average_cost', 'selling_price', 'mrp', 'tax_rate',
    'excise_duty_pct', 'default_lead_time_days', 'min_order_qty',
    'order_multiple', 'conversion_factor',
  ].forEach(k => { p[k] = numOrNull(p[k]); });

  if (!p.item_nature) delete p.item_nature;
  if (!p.abc_class) delete p.abc_class;
  if (!p.ved_class) delete p.ved_class;

  // Trim string fields
  ['item_code', 'item_name', 'short_name', 'brand', 'manufacturer',
   'model_number', 'part_number', 'tax_category', 'hsn_sac_code',
   'valuation_class', 'country_of_origin', 'drug_schedule',
   'generic_name', 'strength', 'dosage_form', 'route_of_administration']
    .forEach(k => { if (typeof p[k] === 'string') p[k] = p[k].trim(); });

  return p;
};

/* ---------- atoms ---------- */
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

const ItemModal = ({ show, item, onClose, onSaved, readOnly = false }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showBaseUom, setShowBaseUom] = useState(false);
  const [showPurchaseUom, setShowPurchaseUom] = useState(false);
  const [showIssueUom, setShowIssueUom] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const [selectedBaseUom, setSelectedBaseUom] = useState(null);
  const [selectedPurchaseUom, setSelectedPurchaseUom] = useState(null);
  const [selectedIssueUom, setSelectedIssueUom] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const isEdit = Boolean(item?.item_id);
  const isDisabled = saveLoading || readOnly;

  useEffect(() => {
    if (!show) {
      setApiError(null);
      setValidationErrors({});
      setSelectedBaseUom(null);
      setSelectedPurchaseUom(null);
      setSelectedIssueUom(null);
      setSelectedCategory(null);
      return;
    }
    setForm(toForm(item));
    setApiError(null);
    setValidationErrors({});
    setSelectedBaseUom(item?.base_uom || null);
    setSelectedPurchaseUom(item?.purchase_uom || null);
    setSelectedIssueUom(item?.issue_uom || null);
    setSelectedCategory(item?.category || null);
  }, [show, item]);

  /* ---------- Change handler with live sanitization ---------- */
  const handleChange = useCallback((field, rawValue) => {
    if (readOnly) return;

    let value = rawValue;
    switch (field) {
      case 'item_code':
        value = sanitizeAlnum(value, 50);
        break;
      case 'hsn_sac_code':
        value = sanitizeDigits(value, 8);
        break;
      case 'barcode':
        value = sanitizeDigits(value, 14);
        break;
      case 'gtin':
        value = sanitizeDigits(value, 14);
        break;
      case 'upc':
        value = sanitizeDigits(value, 12);
        break;
      case 'ean':
        value = sanitizeDigits(value, 13);
        break;
      case 'shelf_life_days':
      case 'default_lead_time_days':
        value = sanitizeInt(value, 5);
        break;
      case 'conversion_factor':
      case 'max_stack_height':
      case 'temperature_min':
      case 'temperature_max':
      case 'standard_cost':
      case 'last_purchase_price':
      case 'average_cost':
      case 'selling_price':
      case 'mrp':
      case 'tax_rate':
      case 'excise_duty_pct':
      case 'min_order_qty':
      case 'order_multiple':
        value = sanitizeDecimal(value);
        break;
      case 'drug_schedule':
        value = sanitizeAlnum(value, 20);
        break;
      case 'generic_name':
      case 'brand':
      case 'manufacturer':
      case 'model_number':
      case 'part_number':
        value = String(value || '').trim();
        break;
      default:
        value = rawValue;
    }

    setForm(prev => {
      const next = { ...prev, [field]: value };

      // Cross-field: if item_type is SERVICE → force is_asset off
      if (field === 'item_type' && value === 'SERVICE') {
        next.is_asset = false;
      }

      // Cross-field: if hazardous off → clear hazard_class
      if (field === 'hazardous' && !value) {
        next.hazard_class = '';
      }

      // Cross-field: if all of lot/serial/expiry off → clear shelf_life_days
      if (['lot_controlled', 'serial_controlled', 'expiry_controlled'].includes(field)) {
        const anyOn = next.lot_controlled || next.serial_controlled || next.expiry_controlled;
        if (!anyOn) next.shelf_life_days = '';
      }

      return next;
    });

    if (validationErrors[field]) {
      setValidationErrors(p => { const n = { ...p }; delete n[field]; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError, readOnly]);

  /* ---------- Validation ---------- */
  const validate = useCallback(async () => {
    try {
      await itemSchema.validate(
        {
          item_code: form.item_code,
          item_name: form.item_name,
          short_name: form.short_name || null,
          description: form.description || null,
          specifications: form.specifications || null,
          item_type: form.item_type,
          item_nature: form.item_nature || null,
          item_group: form.item_group || null,
          abc_class: form.abc_class || null,
          ved_class: form.ved_class || null,
          base_uom_id: numOrNull(form.base_uom_id),
          purchase_uom_id: numOrNull(form.purchase_uom_id),
          issue_uom_id: numOrNull(form.issue_uom_id),
          conversion_factor: numOrNull(form.conversion_factor),
          shelf_life_days: numOrNull(form.shelf_life_days),
          storage_conditions: form.storage_conditions || null,
          hazard_class: form.hazard_class || null,
          temperature_min: numOrNull(form.temperature_min),
          temperature_max: numOrNull(form.temperature_max),
          max_stack_height: numOrNull(form.max_stack_height),
          standard_cost: numOrNull(form.standard_cost),
          last_purchase_price: numOrNull(form.last_purchase_price),
          average_cost: numOrNull(form.average_cost),
          selling_price: numOrNull(form.selling_price),
          mrp: numOrNull(form.mrp),
          currency: form.currency || null,
          valuation_class: form.valuation_class || null,
          tax_category: form.tax_category || null,
          hsn_sac_code: form.hsn_sac_code || null,
          tax_rate: numOrNull(form.tax_rate),
          excise_duty_pct: numOrNull(form.excise_duty_pct),
          default_lead_time_days: numOrNull(form.default_lead_time_days),
          min_order_qty: numOrNull(form.min_order_qty),
          order_multiple: numOrNull(form.order_multiple),
          procurement_type: form.procurement_type || null,
          country_of_origin: form.country_of_origin || null,
          barcode: form.barcode || null,
          gtin: form.gtin || null,
          upc: form.upc || null,
          ean: form.ean || null,
          qr_code: form.qr_code || null,
          drug_schedule: form.drug_schedule || null,
          generic_name: form.generic_name || null,
          strength: form.strength || null,
          dosage_form: form.dosage_form || null,
          route_of_administration: form.route_of_administration || null,
          remarks: form.remarks || null,
        },
        { abortEarly: false }
      );

      // ----- Cross-field business rules -----
      const extra = {};

      // Hazardous → hazard_class required
      if (form.hazardous && !String(form.hazard_class || '').trim()) {
        extra.hazard_class = 'Hazard Class is required when item is hazardous';
      }

      // Temp min ≤ temp max
      const tmin = numOrNull(form.temperature_min);
      const tmax = numOrNull(form.temperature_max);
      if (tmin != null && tmax != null && tmin > tmax) {
        extra.temperature_max = 'Temp Max must be ≥ Temp Min';
      }

      // Conversion factor > 0 for non-base UoM
      const cf = numOrNull(form.conversion_factor);
      if (form.purchase_uom_id && (cf == null || cf <= 0)) {
        extra.conversion_factor = 'Conversion factor must be > 0 when Purchase UoM is set';
      }

      // MRP ≥ Selling Price ≥ Standard Cost sanity
      const sc = numOrNull(form.standard_cost);
      const sp = numOrNull(form.selling_price);
      const mrp = numOrNull(form.mrp);
      if (sc != null && sp != null && sp < sc) {
        extra.selling_price = 'Selling price cannot be less than standard cost';
      }
      if (sp != null && mrp != null && mrp < sp) {
        extra.mrp = 'MRP cannot be less than selling price';
      }

      // MOQ ≤ Order Multiple
      const moq = numOrNull(form.min_order_qty);
      const om = numOrNull(form.order_multiple);
      if (moq != null && om != null && moq > om) {
        extra.min_order_qty = 'MOQ cannot exceed Order Multiple';
      }

      // Expiry controls → shelf life must be set
      if (
        (form.lot_controlled || form.serial_controlled || form.expiry_controlled) &&
        (form.shelf_life_days === '' || numOrNull(form.shelf_life_days) < 0)
      ) {
        extra.shelf_life_days = 'Shelf Life is required for controlled items';
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
  }, [form]);

  const handleSave = useCallback(async () => {
    if (readOnly) return;
    const ok = await validate();
    if (!ok) return;

    setSaveLoading(true);
    setApiError(null);
    try {
      const payload = toPayload(form);
      if (isEdit) {
        await itemsAPI.updateItem(item.item_id, payload);
        toast.success('Item updated');
      } else {
        await itemsAPI.createItem(payload);
        toast.success('Item created');
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
  }, [form, isEdit, item, onSaved, validate, readOnly]);

  const displayBaseUom = useMemo(() => {
    if (selectedBaseUom) return `${selectedBaseUom.uom_code} — ${selectedBaseUom.uom_name}`;
    if (form.base_uom_id) return `ID: ${form.base_uom_id}`;
    return 'Select base UoM';
  }, [selectedBaseUom, form.base_uom_id]);

  const displayPurchaseUom = useMemo(() => {
    if (selectedPurchaseUom) return `${selectedPurchaseUom.uom_code} — ${selectedPurchaseUom.uom_name}`;
    if (form.purchase_uom_id) return `ID: ${form.purchase_uom_id}`;
    return 'Same as base';
  }, [selectedPurchaseUom, form.purchase_uom_id]);

  const displayIssueUom = useMemo(() => {
    if (selectedIssueUom) return `${selectedIssueUom.uom_code} — ${selectedIssueUom.uom_name}`;
    if (form.issue_uom_id) return `ID: ${form.issue_uom_id}`;
    return 'Same as base';
  }, [selectedIssueUom, form.issue_uom_id]);

  const displayCategory = useMemo(() => {
    if (selectedCategory) return `${selectedCategory.category_code} — ${selectedCategory.category_name}`;
    if (form.category_id) return `ID: ${form.category_id}`;
    return 'Uncategorized';
  }, [selectedCategory, form.category_id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1800px] w-full max-h-[94vh] flex flex-col shadow-xl">

        {/* HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 p-2.5 border-b">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View Item</>
                : (isEdit ? 'Edit Item' : 'Add Item')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {isEdit ? item?.item_name : 'Enter item details'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-3 flex-wrap">
              <Toggle label="Active" checked={form.is_active} onChange={(v) => handleChange('is_active', v)} disabled={isDisabled} />
              <Toggle label="Asset" checked={form.is_asset} onChange={(v) => handleChange('is_asset', v)} disabled={isDisabled || form.item_type === 'SERVICE'} />
              <Toggle label="QC Req" checked={form.qc_required} onChange={(v) => handleChange('qc_required', v)} disabled={isDisabled} />
              <Toggle label="Hazardous" checked={form.hazardous} onChange={(v) => handleChange('hazardous', v)} disabled={isDisabled} />
              <Toggle label="Saleable" checked={form.is_saleable} onChange={(v) => handleChange('is_saleable', v)} disabled={isDisabled} />
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
            <SectionCard title="Identity" className="col-span-full" cols="grid-cols-5">
              <Field label="Name" required error={validationErrors.item_name}>
                <input type="text" value={form.item_name} disabled={isDisabled}
                  onChange={e => handleChange('item_name', e.target.value)}
                  className={clsFor('item_name', validationErrors)} />
              </Field>
              <Field label="Code" required error={validationErrors.item_code}>
                <input type="text" value={form.item_code} disabled={isDisabled}
                  onChange={e => handleChange('item_code', e.target.value)}
                  className={`${clsFor('item_code', validationErrors)} uppercase`} />
              </Field>
              <Field label="Short Name">
                <input type="text" value={form.short_name} disabled={isDisabled}
                  onChange={e => handleChange('short_name', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Category">
                <div className="flex items-center gap-1">
                  <div
                    className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                    onClick={() => !isDisabled && setShowCategory(true)}
                  >
                    <span className={`truncate ${form.category_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayCategory}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                  </div>
                  {form.category_id && !isDisabled && (
                    <button onClick={() => { handleChange('category_id', ''); setSelectedCategory(null); }}
                      className="p-0.5 text-gray-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Field>

              <Field label="Brand">
                <input type="text" value={form.brand} disabled={isDisabled}
                  onChange={e => handleChange('brand', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Manufacturer">
                <input type="text" value={form.manufacturer} disabled={isDisabled}
                  onChange={e => handleChange('manufacturer', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Model Number">
                <input type="text" value={form.model_number} disabled={isDisabled}
                  onChange={e => handleChange('model_number', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Part Number">
                <input type="text" value={form.part_number} disabled={isDisabled}
                  onChange={e => handleChange('part_number', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Description" className="col-span-2">
                <input type="text" value={form.description} disabled={isDisabled}
                  onChange={e => handleChange('description', e.target.value)}
                  className={inputCls} />
              </Field>

              <Field label="Specifications" className="col-span-full">
                <textarea rows={2} value={form.specifications} disabled={isDisabled}
                  onChange={e => handleChange('specifications', e.target.value)}
                  placeholder="Technical specs used in quotation comparison..."
                  className={`${inputCls} resize-y`} />
              </Field>
            </SectionCard>

            {/* 2 · CLASSIFICATION */}
            <SectionCard title="Classification" className="col-span-full" cols="grid-cols-5">
              <Field label="Type" required error={validationErrors.item_type}>
                <select value={form.item_type} disabled={isDisabled}
                  onChange={e => handleChange('item_type', e.target.value)}
                  className={clsFor('item_type', validationErrors)}>
                  {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Nature" error={validationErrors.item_nature}>
                <select value={form.item_nature} disabled={isDisabled}
                  onChange={e => handleChange('item_nature', e.target.value)}
                  className={clsFor('item_nature', validationErrors)}>
                  <option value="">—</option>
                  {ITEM_NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Item Group">
                <input type="text" value={form.item_group} disabled={isDisabled}
                  onChange={e => handleChange('item_group', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="ABC Class">
                <select value={form.abc_class} disabled={isDisabled}
                  onChange={e => handleChange('abc_class', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {ABC_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="VED Class">
                <select value={form.ved_class} disabled={isDisabled}
                  onChange={e => handleChange('ved_class', e.target.value)}
                  className={inputCls}>
                  <option value="">—</option>
                  {VED_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </SectionCard>

            {/* 3 · UOM */}
            <SectionCard title="Units of Measure" className="col-span-12 xl:col-span-6" cols="grid-cols-4">
              <Field label="Base UoM" required error={validationErrors.base_uom_id}>
                <div className="flex items-center gap-1">
                  <div
                    className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'} ${validationErrors.base_uom_id ? 'border-red-400' : ''}`}
                    onClick={() => !isDisabled && setShowBaseUom(true)}
                  >
                    <span className={`truncate ${form.base_uom_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayBaseUom}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                  </div>
                  {form.base_uom_id && !isDisabled && (
                    <button onClick={() => { handleChange('base_uom_id', ''); setSelectedBaseUom(null); }}
                      className="p-0.5 text-gray-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Conversion Factor" error={validationErrors.conversion_factor}>
                <input type="number" step="0.000001" min="0" value={form.conversion_factor}
                  disabled={isDisabled}
                  onChange={e => handleChange('conversion_factor', e.target.value)}
                  className={clsFor('conversion_factor', validationErrors)} />
              </Field>
              <Field label="Purchase UoM">
                <div className="flex items-center gap-1">
                  <div
                    className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                    onClick={() => !isDisabled && setShowPurchaseUom(true)}
                  >
                    <span className={`truncate ${form.purchase_uom_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayPurchaseUom}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                  </div>
                  {form.purchase_uom_id && !isDisabled && (
                    <button onClick={() => { handleChange('purchase_uom_id', ''); setSelectedPurchaseUom(null); }}
                      className="p-0.5 text-gray-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Issue UoM">
                <div className="flex items-center gap-1">
                  <div
                    className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                    onClick={() => !isDisabled && setShowIssueUom(true)}
                  >
                    <span className={`truncate ${form.issue_uom_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayIssueUom}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                  </div>
                  {form.issue_uom_id && !isDisabled && (
                    <button onClick={() => { handleChange('issue_uom_id', ''); setSelectedIssueUom(null); }}
                      className="p-0.5 text-gray-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Shelf Life (days)" error={validationErrors.shelf_life_days} className="col-span-4">
                <input type="number" min="0" value={form.shelf_life_days}
                  disabled={isDisabled}
                  onChange={e => handleChange('shelf_life_days', e.target.value)}
                  className={clsFor('shelf_life_days', validationErrors)}
                  placeholder={(form.lot_controlled || form.serial_controlled || form.expiry_controlled) ? 'Required for controlled items' : ''} />
              </Field>
            </SectionCard>

            {/* 4 · STORAGE */}
            <SectionCard title="Storage & Handling" className="col-span-12 xl:col-span-6" cols="grid-cols-4">
              <Field label="Storage Conditions" className="col-span-2">
                <input type="text" value={form.storage_conditions} disabled={isDisabled}
                  onChange={e => handleChange('storage_conditions', e.target.value)}
                  placeholder="2–8°C, Dry" className={inputCls} />
              </Field>
              <Field label="Hazard Class" error={validationErrors.hazard_class} className="col-span-2">
                <input type="text" value={form.hazard_class} disabled={isDisabled}
                  onChange={e => handleChange('hazard_class', e.target.value)}
                  className={clsFor('hazard_class', validationErrors)}
                  placeholder={form.hazardous ? 'Required for hazardous items' : ''} />
              </Field>
              <Field label="Temp Min (°C)" error={validationErrors.temperature_min}>
                <input type="number" step="0.01" value={form.temperature_min}
                  disabled={isDisabled}
                  onChange={e => handleChange('temperature_min', e.target.value)}
                  className={clsFor('temperature_min', validationErrors)} />
              </Field>
              <Field label="Temp Max (°C)" error={validationErrors.temperature_max}>
                <input type="number" step="0.01" value={form.temperature_max}
                  disabled={isDisabled}
                  onChange={e => handleChange('temperature_max', e.target.value)}
                  className={clsFor('temperature_max', validationErrors)} />
              </Field>
              <Field label="Max Stack Height" className="col-span-2">
                <input type="number" step="0.01" value={form.max_stack_height}
                  disabled={isDisabled}
                  onChange={e => handleChange('max_stack_height', e.target.value)}
                  className={inputCls} />
              </Field>
            </SectionCard>

            {/* 5 · TRACEABILITY */}
            <SectionCard title="Traceability" className="col-span-12 xl:col-span-3" cols="grid-cols-3">
              <Toggle label="Lot Controlled" checked={form.lot_controlled} onChange={v => handleChange('lot_controlled', v)} disabled={isDisabled} />
              <Toggle label="Serial Controlled" checked={form.serial_controlled} onChange={v => handleChange('serial_controlled', v)} disabled={isDisabled} />
              <Toggle label="Expiry Controlled" checked={form.expiry_controlled} onChange={v => handleChange('expiry_controlled', v)} disabled={isDisabled} />
              <Toggle label="Mfg Date Required" checked={form.manufacture_date_required} onChange={v => handleChange('manufacture_date_required', v)} disabled={isDisabled} />
              <Toggle label="Fragile" checked={form.fragile} onChange={v => handleChange('fragile', v)} disabled={isDisabled} />
              <Toggle label="Stackable" checked={form.stackable} onChange={v => handleChange('stackable', v)} disabled={isDisabled} />
            </SectionCard>

            {/* 6 · COST & PRICING */}
            <SectionCard title="Cost & Pricing" className="col-span-12 xl:col-span-9" cols="grid-cols-7">
              <Field label="Standard Cost" error={validationErrors.standard_cost}>
                <input type="number" step="0.0001" min="0" value={form.standard_cost}
                  disabled={isDisabled}
                  onChange={e => handleChange('standard_cost', e.target.value)}
                  className={clsFor('standard_cost', validationErrors)} />
              </Field>
              <Field label="Last Purchase" error={validationErrors.last_purchase_price}>
                <input type="number" step="0.0001" min="0" value={form.last_purchase_price}
                  disabled={isDisabled}
                  onChange={e => handleChange('last_purchase_price', e.target.value)}
                  className={clsFor('last_purchase_price', validationErrors)} />
              </Field>
              <Field label="Average Cost">
                <input type="number" step="0.0001" value={form.average_cost}
                  disabled={isDisabled}
                  onChange={e => handleChange('average_cost', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Selling Price" error={validationErrors.selling_price}>
                <input type="number" step="0.0001" min="0" value={form.selling_price}
                  disabled={isDisabled}
                  onChange={e => handleChange('selling_price', e.target.value)}
                  className={clsFor('selling_price', validationErrors)} />
              </Field>
              <Field label="MRP" error={validationErrors.mrp}>
                <input type="number" step="0.0001" min="0" value={form.mrp}
                  disabled={isDisabled}
                  onChange={e => handleChange('mrp', e.target.value)}
                  className={clsFor('mrp', validationErrors)} />
              </Field>
              <Field label="Currency">
                <select value={form.currency} disabled={isDisabled}
                  onChange={e => handleChange('currency', e.target.value)}
                  className={inputCls}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Valuation Class">
                <input type="text" value={form.valuation_class} disabled={isDisabled}
                  onChange={e => handleChange('valuation_class', e.target.value)}
                  className={inputCls} />
              </Field>
            </SectionCard>

            {/* 7 · TAX */}
            <SectionCard title="Tax" className="col-span-12 md:col-span-6 xl:col-span-4" cols="grid-cols-2">
              <Field label="Tax Category">
                <input type="text" value={form.tax_category} disabled={isDisabled}
                  onChange={e => handleChange('tax_category', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="HSN / SAC" error={validationErrors.hsn_sac_code}>
                <input type="text" value={form.hsn_sac_code} disabled={isDisabled}
                  onChange={e => handleChange('hsn_sac_code', e.target.value)}
                  className={clsFor('hsn_sac_code', validationErrors)}
                  placeholder="4–8 digits" />
              </Field>
              <Field label="Tax Rate %" error={validationErrors.tax_rate}>
                <input type="number" step="0.01" min="0" max="100" value={form.tax_rate}
                  disabled={isDisabled}
                  onChange={e => handleChange('tax_rate', e.target.value)}
                  className={clsFor('tax_rate', validationErrors)} />
              </Field>
              <Field label="Excise Duty %">
                <input type="number" step="0.01" min="0" max="100" value={form.excise_duty_pct}
                  disabled={isDisabled}
                  onChange={e => handleChange('excise_duty_pct', e.target.value)}
                  className={inputCls} />
              </Field>
            </SectionCard>

            {/* 8 · PROCUREMENT */}
            <SectionCard title="Procurement" className="col-span-12 xl:col-span-4" cols="grid-cols-4">
              <Field label="Lead Time (days)" error={validationErrors.default_lead_time_days}>
                <input type="number" min="0" max="365" value={form.default_lead_time_days}
                  disabled={isDisabled}
                  onChange={e => handleChange('default_lead_time_days', e.target.value)}
                  className={clsFor('default_lead_time_days', validationErrors)} />
              </Field>
              <Field label="Min Order Qty" error={validationErrors.min_order_qty}>
                <input type="number" step="0.0001" min="0" value={form.min_order_qty}
                  disabled={isDisabled}
                  onChange={e => handleChange('min_order_qty', e.target.value)}
                  className={clsFor('min_order_qty', validationErrors)} />
              </Field>
              <Field label="Order Multiple" error={validationErrors.order_multiple}>
                <input type="number" step="0.0001" min="0" value={form.order_multiple}
                  disabled={isDisabled}
                  onChange={e => handleChange('order_multiple', e.target.value)}
                  className={clsFor('order_multiple', validationErrors)} />
              </Field>
              <Field label="Procurement Type">
                <select value={form.procurement_type} disabled={isDisabled}
                  onChange={e => handleChange('procurement_type', e.target.value)}
                  className={inputCls}>
                  {PROCUREMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Country of Origin" className="col-span-2">
                <input type="text" value={form.country_of_origin} disabled={isDisabled}
                  onChange={e => handleChange('country_of_origin', e.target.value)}
                  className={inputCls} />
              </Field>
              <div className="col-span-2 flex items-center gap-3 pt-2">
                <Toggle label="Single Source" checked={form.is_single_source} onChange={v => handleChange('is_single_source', v)} disabled={isDisabled} />
                <Toggle label="Imported" checked={form.is_imported} onChange={v => handleChange('is_imported', v)} disabled={isDisabled} />
              </div>
            </SectionCard>

            {/* 9 · IDENTIFIERS */}
            <SectionCard title="Identifiers" className="col-span-12 xl:col-span-4" cols="grid-cols-4">
              <Field label="Barcode" error={validationErrors.barcode} className="col-span-2">
                <input type="text" value={form.barcode} disabled={isDisabled}
                  onChange={e => handleChange('barcode', e.target.value)}
                  className={clsFor('barcode', validationErrors)}
                  placeholder="8–14 digits" />
              </Field>
              <Field label="QR Code" className="col-span-2">
                <input type="text" value={form.qr_code} disabled={isDisabled}
                  onChange={e => handleChange('qr_code', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="GTIN" error={validationErrors.gtin} className="col-span-2">
                <input type="text" value={form.gtin} disabled={isDisabled}
                  onChange={e => handleChange('gtin', e.target.value)}
                  className={clsFor('gtin', validationErrors)}
                  placeholder="8/12/13/14 digits" />
              </Field>
              <Field label="UPC" error={validationErrors.upc}>
                <input type="text" value={form.upc} disabled={isDisabled}
                  onChange={e => handleChange('upc', e.target.value)}
                  className={clsFor('upc', validationErrors)}
                  placeholder="12 digits" />
              </Field>
              <Field label="EAN" error={validationErrors.ean}>
                <input type="text" value={form.ean} disabled={isDisabled}
                  onChange={e => handleChange('ean', e.target.value)}
                  className={clsFor('ean', validationErrors)}
                  placeholder="8/13 digits" />
              </Field>
            </SectionCard>

            {/* 10 · MEDICAL */}
            <SectionCard title="Medical" className="col-span-12 xl:col-span-4" cols="grid-cols-4">
              <Field label="Drug Schedule" className="col-span-1">
                <input type="text" value={form.drug_schedule} disabled={isDisabled}
                  onChange={e => handleChange('drug_schedule', e.target.value)}
                  placeholder="H / H1 / X" className={inputCls} />
              </Field>
              <Field label="Generic Name" className="col-span-3">
                <input type="text" value={form.generic_name} disabled={isDisabled}
                  onChange={e => handleChange('generic_name', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Strength" className="col-span-1">
                <input type="text" value={form.strength} disabled={isDisabled}
                  onChange={e => handleChange('strength', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Dosage Form" className="col-span-1">
                <input type="text" value={form.dosage_form} disabled={isDisabled}
                  onChange={e => handleChange('dosage_form', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Route" className="col-span-2">
                <input type="text" value={form.route_of_administration} disabled={isDisabled}
                  onChange={e => handleChange('route_of_administration', e.target.value)}
                  className={inputCls} />
              </Field>
            </SectionCard>

            {/* 11 · FLAGS & REMARKS */}
            <SectionCard title="Flags & Remarks" className="col-span-12 xl:col-span-4" cols="grid-cols-4">
              <div className="col-span-4 grid grid-cols-3 gap-2 mb-2">
                <Toggle label="Is Obsolete" checked={form.is_obsolete} onChange={v => handleChange('is_obsolete', v)} disabled={isDisabled} />
                <Toggle label="Slow Moving" checked={form.is_slow_moving} onChange={v => handleChange('is_slow_moving', v)} disabled={isDisabled} />
                <Toggle label="Returnable" checked={form.is_returnable} onChange={v => handleChange('is_returnable', v)} disabled={isDisabled} />
              </div>
              <Field label="Remarks" className="col-span-4">
                <textarea rows={2} value={form.remarks} disabled={isDisabled}
                  onChange={e => handleChange('remarks', e.target.value)}
                  placeholder="Any internal notes about this item..."
                  className={`${inputCls} resize-y`} />
              </Field>
            </SectionCard>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {isEdit
              ? `Last updated: ${item?.updated_at || item?.updatedAt || '—'}`
              : 'New item'}
          </p>
        </div>
      </div>

      {/* --- PICKERS --- */}
      <Suspense fallback={null}>
        <UomSelectionModal
          show={showBaseUom}
          onClose={() => setShowBaseUom(false)}
          onSelect={(u) => {
            handleChange('base_uom_id', u ? u.uom_id : '');
            setSelectedBaseUom(u || null);
            setShowBaseUom(false);
          }}
          selectedUomId={form.base_uom_id || null}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <UomSelectionModal
          show={showPurchaseUom}
          onClose={() => setShowPurchaseUom(false)}
          onSelect={(u) => {
            handleChange('purchase_uom_id', u ? u.uom_id : '');
            setSelectedPurchaseUom(u || null);
            setShowPurchaseUom(false);
          }}
          selectedUomId={form.purchase_uom_id || null}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <UomSelectionModal
          show={showIssueUom}
          onClose={() => setShowIssueUom(false)}
          onSelect={(u) => {
            handleChange('issue_uom_id', u ? u.uom_id : '');
            setSelectedIssueUom(u || null);
            setShowIssueUom(false);
          }}
          selectedUomId={form.issue_uom_id || null}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <ItemCategorySelectionModal
          show={showCategory}
          onClose={() => setShowCategory(false)}
          onSelect={(c) => {
            handleChange('category_id', c ? c.category_id : '');
            setSelectedCategory(c || null);
            setShowCategory(false);
          }}
          selectedCategoryId={form.category_id || null}
          onlyActive
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(ItemModal);
// src/modules/Uoms/UomModal.jsx
import React, {
  useState, useEffect, useCallback, useMemo, useRef,
  lazy, Suspense,
} from 'react';
import {
  X, Save, AlertCircle, Eye, LockKeyhole, ChevronRight,
} from 'lucide-react';
import { uomsAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const UomSelectionModal = lazy(() => import('./UomSelectionModal'));

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
const TYPES = [
  'WEIGHT', 'VOLUME', 'LENGTH', 'AREA', 'COUNT', 'TIME', 'PACKAGING', 'OTHER',
];
const CATEGORIES = ['BASE', 'DERIVED', 'PACKAGING', 'CUSTOM'];

/* ------------------------------------------------------------------ */
/* Sanitizers                                                          */
/* ------------------------------------------------------------------ */
const sanitizeAlnum = (v, max) =>
  String(v || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, max);

const sanitizeDecimal = (v) =>
  String(v || '').replace(/[^0-9.\-]/g, '');

const sanitizeInt = (v, max) =>
  String(v || '').replace(/\D/g, '').slice(0, max);

/* ------------------------------------------------------------------ */
/* Yup schema                                                          */
/* ------------------------------------------------------------------ */
const uomSchema = yup.object().shape({
  uom_code: yup.string().trim().max(10, 'Max 10 chars').required('Code is required'),
  uom_name: yup.string().trim().max(100, 'Max 100 chars').required('Name is required'),
  short_name: yup.string().trim().max(20, 'Max 20 chars').nullable(),
  uom_type: yup.string().oneOf(TYPES, 'Invalid type').required('Type is required'),
  uom_category: yup.string().oneOf(CATEGORIES, 'Invalid category').nullable(),
  base_uom_id: yup.number().integer().nullable(),
  conversion_factor: yup.number().positive('Must be > 0').nullable(),
  decimal_places: yup.number().integer().min(0, 'Min 0').max(6, 'Max 6').nullable(),
  si_unit: yup.string().trim().max(20, 'Max 20 chars').nullable(),
});

/* ------------------------------------------------------------------ */
/* Form shape                                                          */
/* ------------------------------------------------------------------ */
const EMPTY_FORM = {
  org_id: '',
  uom_code: '',
  uom_name: '',
  short_name: '',
  description: '',

  uom_type: 'COUNT',
  uom_category: 'BASE',
  base_uom_id: '',
  conversion_factor: '1',
  is_metric: true,
  decimal_places: 2,
  allow_fractional_qty: true,

  si_unit: '',
  is_si_base: false,

  is_system_default: false,
  is_active: true,
  remarks: '',
};

const numOrNull = (v) =>
  v === '' || v === null || v === undefined ? null : Number(v);

const deriveShort = (name) => {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 8);
  return `${words[0]} ${words.slice(1).map(w => w[0].toUpperCase()).join('')}`.slice(0, 20);
};

const deriveCode = (name) => {
  const words = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 6);
  return words.map(w => w.slice(0, 3)).join('').slice(0, 8);
};

const toForm = (u) => {
  if (!u) return { ...EMPTY_FORM };
  const out = { ...EMPTY_FORM };
  for (const k of Object.keys(EMPTY_FORM)) {
    if (u[k] !== undefined && u[k] !== null) out[k] = u[k];
  }
  return out;
};

const toPayload = (form) => {
  const p = { ...form };
  ['org_id', 'base_uom_id', 'conversion_factor', 'decimal_places']
    .forEach(k => { p[k] = numOrNull(p[k]); });

  ['uom_code', 'uom_name', 'short_name', 'description', 'si_unit', 'remarks']
    .forEach(k => { if (typeof p[k] === 'string') p[k] = p[k].trim(); });

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

const UomModal = ({ show, uom, onClose, onSaved, readOnly = false }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // Base UoM picker state
  const [showBaseUom, setShowBaseUom] = useState(false);
  const [selectedBaseUom, setSelectedBaseUom] = useState(null);

  const userEditedCodeRef = useRef(false);
  const userEditedShortRef = useRef(false);

  const isEdit = Boolean(uom?.uom_id);
  const isSystem = Boolean(uom?.is_system_default);
  const isDisabled = saveLoading || readOnly;

  useEffect(() => {
    if (!show) {
      setApiError(null);
      setValidationErrors({});
      setSelectedBaseUom(null);
      setShowBaseUom(false);
      userEditedCodeRef.current = false;
      userEditedShortRef.current = false;
      return;
    }
    setForm(toForm(uom));
    setApiError(null);
    setValidationErrors({});
    setSelectedBaseUom(uom?.base_uom || null);
    setShowBaseUom(false);

    if (isEdit) {
      userEditedCodeRef.current = Boolean(uom?.uom_code);
      userEditedShortRef.current = Boolean(uom?.short_name);
    } else {
      userEditedCodeRef.current = false;
      userEditedShortRef.current = false;
    }
  }, [show, uom, isEdit]);

  /* ---------- Change handler with live sanitization ---------- */
  const handleChange = useCallback((field, rawValue) => {
    if (readOnly) return;

    let value = rawValue;
    switch (field) {
      case 'uom_code':
        value = sanitizeAlnum(value, 10);
        break;
      case 'short_name':
        value = String(value || '').slice(0, 20);
        break;
      case 'org_id':
        value = sanitizeInt(value, 10);
        break;
      case 'conversion_factor':
      case 'decimal_places':
        value = sanitizeDecimal(value);
        break;
      default:
        value = rawValue;
    }

    setForm(prev => {
      const next = { ...prev, [field]: value };

      if (field === 'uom_name') {
        if (!userEditedCodeRef.current) next.uom_code = deriveCode(value);
        if (!userEditedShortRef.current) next.short_name = deriveShort(value);
      }

      if (field === 'uom_code') userEditedCodeRef.current = true;
      if (field === 'short_name') userEditedShortRef.current = true;

      if (field === 'uom_category') {
        if (value === 'BASE') {
          next.base_uom_id = '';
          next.conversion_factor = '1';
        } else if (value === 'PACKAGING') {
          next.uom_type = 'PACKAGING';
          next.allow_fractional_qty = false;
          next.decimal_places = 0;
          next.is_metric = false;
        }
      }

      if (field === 'uom_type') {
        if (['COUNT', 'PACKAGING', 'TIME'].includes(value)) {
          next.allow_fractional_qty = false;
          next.decimal_places = 0;
        } else {
          next.allow_fractional_qty = true;
          if (Number(next.decimal_places) === 0) next.decimal_places = 3;
        }
        if (value === 'PACKAGING') {
          next.is_metric = false;
          if (next.uom_category === 'BASE') next.uom_category = 'PACKAGING';
        }
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
      await uomSchema.validate(
        {
          uom_code: form.uom_code,
          uom_name: form.uom_name,
          short_name: form.short_name || null,
          uom_type: form.uom_type,
          uom_category: form.uom_category || null,
          base_uom_id: numOrNull(form.base_uom_id),
          conversion_factor: numOrNull(form.conversion_factor),
          decimal_places: numOrNull(form.decimal_places),
          si_unit: form.si_unit || null,
        },
        { abortEarly: false }
      );

      // ----- Cross-field business rules -----
      const extra = {};

      if (form.uom_category && form.uom_category !== 'BASE') {
        if (!form.base_uom_id) {
          extra.base_uom_id = 'Base UoM is required for non-base categories';
        }
        const cf = numOrNull(form.conversion_factor);
        if (cf == null || cf <= 0) {
          extra.conversion_factor = 'Conversion factor must be > 0';
        }
      }

      if (form.uom_category === 'BASE' && form.base_uom_id) {
        extra.base_uom_id = 'Base category UoM cannot have a Base UoM';
      }

      if (form.allow_fractional_qty) {
        const dp = numOrNull(form.decimal_places);
        if (dp == null || dp < 0) {
          extra.decimal_places = 'Decimal places required when fractional qty allowed';
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
        if (isSystem) {
          delete payload.uom_code;
          delete payload.uom_category;
          delete payload.base_uom_id;
          delete payload.conversion_factor;
          delete payload.is_system_default;
        }
        await uomsAPI.updateUom(uom.uom_id, payload);
        toast.success('UoM updated');
      } else {
        delete payload.is_system_default;
        await uomsAPI.createUom(payload);
        toast.success('UoM created');
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
  }, [form, isEdit, isSystem, uom, onSaved, validate, readOnly]);

  const displayBaseUom = useMemo(() => {
    if (selectedBaseUom) return `${selectedBaseUom.uom_code} — ${selectedBaseUom.uom_name}`;
    if (form.base_uom_id) return `ID: ${form.base_uom_id}`;
    return 'Select base UoM';
  }, [selectedBaseUom, form.base_uom_id]);

  if (!show) return null;

  const isBase = form.uom_category === 'BASE';
  const isDerivedLike = !isBase;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1400px] w-full max-h-[94vh] flex flex-col shadow-xl">

        {/* HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 p-2.5 border-b">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View UoM</>
                : (isEdit ? 'Edit UoM' : 'Add UoM')}
              {isSystem && (
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                  SYSTEM
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {isEdit ? uom?.uom_name : 'Enter unit of measure details'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-3 flex-wrap">
              <Toggle label="Active" checked={form.is_active} onChange={v => handleChange('is_active', v)} disabled={isDisabled} />
              <Toggle label="Fractional Qty" checked={form.allow_fractional_qty} onChange={v => handleChange('allow_fractional_qty', v)} disabled={isDisabled} />
              <Toggle label="Metric" checked={form.is_metric} onChange={v => handleChange('is_metric', v)} disabled={isDisabled} />
              <Toggle label="SI Base" checked={form.is_si_base} onChange={v => handleChange('is_si_base', v)} disabled={isDisabled} />
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
            <SectionCard title="Identity" className="col-span-8" cols="grid-cols-4">
              <Field label="Name" required error={validationErrors.uom_name}>
                <input type="text" value={form.uom_name} disabled={isDisabled}
                  onChange={e => handleChange('uom_name', e.target.value)}
                  className={clsFor('uom_name', validationErrors)} />
              </Field>

              {/* CODE — always disabled (auto-derived, immutable) */}
              <Field label="Code" required error={validationErrors.uom_code} hint="(auto-generated)">
                <input
                  type="text"
                  value={form.uom_code}
                  disabled
                  onChange={() => {}}
                  className={`${clsFor('uom_code', validationErrors)} uppercase bg-gray-50 text-gray-600 cursor-not-allowed`}
                />
              </Field>

              <Field label="Short Name" hint="(auto)" error={validationErrors.short_name}>
                <input type="text" value={form.short_name} disabled={isDisabled}
                  onChange={e => handleChange('short_name', e.target.value)}
                  className={clsFor('short_name', validationErrors)} />
              </Field>
              <Field label="Org ID" hint="(null = global)">
                <input type="number" value={form.org_id} disabled={isDisabled || isSystem}
                  onChange={e => handleChange('org_id', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Type" required error={validationErrors.uom_type}>
                <select value={form.uom_type} disabled={isDisabled}
                  onChange={e => handleChange('uom_type', e.target.value)}
                  className={clsFor('uom_type', validationErrors)}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Category" error={validationErrors.uom_category}>
                <select value={form.uom_category} disabled={isDisabled || isSystem}
                  onChange={e => handleChange('uom_category', e.target.value)}
                  className={`${clsFor('uom_category', validationErrors)} ${isSystem ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="SI Unit">
                <input type="text" value={form.si_unit} disabled={isDisabled}
                  onChange={e => handleChange('si_unit', e.target.value)}
                  placeholder="kg, m, s" className={inputCls} />
              </Field>
              <Field label="Description" className="col-span-1">
                <input type="text" value={form.description} disabled={isDisabled}
                  onChange={e => handleChange('description', e.target.value)}
                  className={inputCls} />
              </Field>
            </SectionCard>

            {/* 2 · CONVERSION */}
            <SectionCard title="Conversion" className="col-span-4" cols="grid-cols-2">
              <Field label="Base UoM" required={isDerivedLike} error={validationErrors.base_uom_id}>
                <div className="flex items-center gap-1">
                  <div
                    className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${
                      (isDisabled || isBase || isSystem)
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                        : 'bg-white cursor-pointer hover:bg-gray-50'
                    } ${validationErrors.base_uom_id ? 'border-red-400' : ''}`}
                    onClick={() => !(isDisabled || isBase || isSystem) && setShowBaseUom(true)}
                  >
                    <span className={`truncate ${form.base_uom_id ? 'text-gray-900' : 'text-gray-400'}`}>
                      {isBase ? '—' : displayBaseUom}
                    </span>
                    {!(isDisabled || isBase || isSystem) && (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  {form.base_uom_id && !(isDisabled || isBase || isSystem) && (
                    <button
                      onClick={() => { handleChange('base_uom_id', ''); setSelectedBaseUom(null); }}
                      className="p-0.5 text-gray-400 hover:text-red-600"
                      title="Clear"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Conversion Factor" required={isDerivedLike} error={validationErrors.conversion_factor}>
                <input type="number" step="0.000001" min="0" value={form.conversion_factor}
                  disabled={isDisabled || isBase || isSystem}
                  onChange={e => handleChange('conversion_factor', e.target.value)}
                  className={`${clsFor('conversion_factor', validationErrors)} ${(isBase || isSystem) ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
              </Field>
              <Field label="Decimal Places" error={validationErrors.decimal_places}>
                <input type="number" min="0" max="6" value={form.decimal_places}
                  disabled={isDisabled || !form.allow_fractional_qty}
                  onChange={e => handleChange('decimal_places', e.target.value)}
                  className={`${clsFor('decimal_places', validationErrors)} ${!form.allow_fractional_qty ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} />
              </Field>
            </SectionCard>

            {/* 3 · REMARKS */}
            <SectionCard title="Remarks" className="col-span-full" cols="grid-cols-1">
              <Field label="Remarks / Notes">
                <textarea rows={3} value={form.remarks} disabled={isDisabled}
                  onChange={e => handleChange('remarks', e.target.value)}
                  placeholder="Any internal notes about this UoM..."
                  className={`${inputCls} resize-y`} />
              </Field>
            </SectionCard>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {isEdit
              ? `Last updated: ${uom?.updated_at || uom?.updatedAt || '—'}`
              : 'New UoM'}
          </p>
          {isSystem && (
            <p className="text-[10px] text-indigo-600 font-medium flex items-center gap-1">
              <LockKeyhole className="w-3 h-3" /> System-default — key fields locked
            </p>
          )}
        </div>
      </div>

      {/* --- BASE UOM PICKER --- */}
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
          excludeUomId={isEdit ? uom?.uom_id : undefined}
          onlyActive
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(UomModal);
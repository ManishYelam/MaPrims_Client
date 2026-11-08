// src/modules/ItemCategories/ItemCategoryModal.jsx
import React, {
  useState, useEffect, useCallback, useRef, useMemo,
  lazy, Suspense,
} from 'react';
import {
  X, Save, ChevronRight,
} from 'lucide-react';
import { itemCategoriesAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const ItemCategorySelectionModal = lazy(() => import('./ItemCategorySelectionModal'));

const categorySchema = yup.object().shape({
  category_code: yup.string().trim().max(30, 'Max 30 chars').required('Code is required'),
  category_name: yup.string().trim().max(150, 'Max 150 chars').required('Name is required'),
  description: yup.string().nullable(),
});

const EMPTY_FORM = {
  parent_category_id: '',
  category_code: '',
  category_name: '',
  description: '',
  is_active: true,
};

const numOrNull = (v) =>
  v === '' || v === null || v === undefined ? null : Number(v);

const deriveCode = (name) => {
  const words = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 6);
  return words.map(w => w.slice(0, 3)).join('-').slice(0, 20);
};

const toForm = (cat) => {
  if (!cat) return { ...EMPTY_FORM };
  return {
    parent_category_id: cat.parent_category_id ?? '',
    category_code: cat.category_code ?? '',
    category_name: cat.category_name ?? '',
    description: cat.description ?? '',
    is_active: cat.is_active ?? true,
  };
};

const toPayload = (form) => ({
  parent_category_id: numOrNull(form.parent_category_id),
  category_code: form.category_code,
  category_name: form.category_name,
  description: form.description || null,
  sort_order: 0, // Forced to 0 or omitted based on backend
  icon_url: null, // Forced to null as requested
  is_active: form.is_active,
});

/* ---------- atoms ---------- */
const Field = ({ label, required, error, children, hint }) => (
  <div>
    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">
      {label}
      {required && <span className="text-red-500"> *</span>}
      {hint && <span className="text-[9px] text-gray-400 ml-1">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-[9px] text-red-600 mt-0.5">{error}</p>}
  </div>
);

const Toggle = ({ label, checked, onChange, disabled }) => (
  <label className={`flex items-center gap-1.5 text-[11px] text-gray-700 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-1"
    />
    <span>{label}</span>
  </label>
);

const ItemCategoryModal = ({ show, itemCategory, onClose, onSaved, readOnly = false }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showParentModal, setShowParentModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  const userEditedCodeRef = useRef(false);
  const isEdit = Boolean(itemCategory?.category_id);

  useEffect(() => {
    if (!show) {
      setApiError(null);
      setValidationErrors({});
      setSelectedParent(null);
      userEditedCodeRef.current = false;
      return;
    }
    setForm(toForm(itemCategory));
    setApiError(null);
    setValidationErrors({});
    setSelectedParent(null);
    userEditedCodeRef.current = isEdit ? Boolean(itemCategory?.category_code) : false;
  }, [show, itemCategory, isEdit]);

  const handleChange = useCallback((field, value) => {
    if (readOnly) return;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'category_name' && !userEditedCodeRef.current) {
        next.category_code = deriveCode(value);
      }
      if (field === 'category_code') userEditedCodeRef.current = true;
      return next;
    });
    if (validationErrors[field]) {
      setValidationErrors(p => { const n = { ...p }; delete n[field]; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError, readOnly]);

  const handleParentSelect = useCallback((cat) => {
    if (readOnly) return;
    if (cat) {
      handleChange('parent_category_id', cat.category_id);
      setSelectedParent(cat);
    } else {
      handleChange('parent_category_id', '');
      setSelectedParent(null);
    }
    setShowParentModal(false);
  }, [handleChange, readOnly]);

  const validate = useCallback(async () => {
    try {
      await categorySchema.validate(
        {
          category_code: form.category_code,
          category_name: form.category_name,
          description: form.description || null,
        },
        { abortEarly: false }
      );
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
        await itemCategoriesAPI.updateItemCategory(itemCategory.category_id, payload);
        toast.success('Category updated');
      } else {
        await itemCategoriesAPI.createItemCategory(payload);
        toast.success('Category created');
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
  }, [form, isEdit, itemCategory, onSaved, validate, readOnly]);

  const displayParent = useMemo(() => {
    if (selectedParent) return `${selectedParent.category_code} — ${selectedParent.category_name}`;
    if (form.parent_category_id) return `ID: ${form.parent_category_id}`;
    return 'None (root)';
  }, [selectedParent, form.parent_category_id]);

  if (!show) return null;

  const title = readOnly
    ? 'View Item Category'
    : isEdit ? 'Edit Item Category' : 'Add Item Category';

  const disableAll = saveLoading || readOnly;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[700px] w-full flex flex-col shadow-xl">
        {/* HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? itemCategory.category_name : 'Enter category details'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Save button only in edit/create mode */}
            {!readOnly && (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="px-2.5 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1"
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
              </button>
            )}

            {/* X close — always available (this is the cancel) */}
            <button onClick={onClose} disabled={saveLoading} className="text-gray-400 hover:text-gray-600 p-1 ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {apiError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded-md flex items-start justify-between">
              <span className="text-sm text-red-700">{apiError}</span>
              <button onClick={() => setApiError(null)}><X className="w-4 h-4 text-red-500" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" required error={validationErrors.category_name}>
              <input type="text" value={form.category_name} disabled={disableAll}
                onChange={e => handleChange('category_name', e.target.value)}
                className="w-full px-2 py-1.5 border rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-700" />
            </Field>
            <Field label="Code" required error={validationErrors.category_code} hint="(auto-generated)">
              <input type="text" value={form.category_code} disabled={disableAll}
                onChange={e => handleChange('category_code', e.target.value.toUpperCase())}
                className="w-full px-2 py-1.5 border rounded text-xs uppercase font-mono focus:ring-1 focus:ring-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-700" />
            </Field>
          </div>

          <Field label="Parent Category">
            <div className="flex items-center gap-1">
              <div
                className={`flex-1 px-2 py-1.5 border rounded text-xs bg-white flex items-center justify-between ${
                  readOnly ? 'cursor-default text-gray-700' : 'cursor-pointer hover:bg-gray-50'
                }`}
                onClick={() => !disableAll && setShowParentModal(true)}
              >
                <span className={`truncate ${form.parent_category_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayParent}</span>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </div>
              {form.parent_category_id && !readOnly && (
                <button onClick={() => handleParentSelect(null)} className="p-1 text-gray-400 hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </Field>

          <Field label="Description">
            <textarea rows={3} value={form.description} disabled={disableAll}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-700" />
          </Field>

          <div className="pt-2">
            <Toggle label="Is Active" checked={form.is_active} onChange={v => handleChange('is_active', v)} disabled={disableAll} />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex items-center justify-end px-2.5 py-1 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {isEdit
              ? `Last updated: ${itemCategory.updated_at || itemCategory.updatedAt || '—'}`
              : 'New item category'}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ItemCategorySelectionModal
          show={showParentModal && !readOnly}
          onClose={() => setShowParentModal(false)}
          onSelect={handleParentSelect}
          selectedCategoryId={form.parent_category_id || null}
          excludeCategoryId={isEdit ? itemCategory?.category_id : undefined}
          onlyActive
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(ItemCategoryModal);
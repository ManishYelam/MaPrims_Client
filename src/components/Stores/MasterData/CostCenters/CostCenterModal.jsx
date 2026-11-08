// src/modules/CostCenters/CostCenterModal.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  X, Save, FolderTree, ChevronRight, DollarSign, Layers, Settings2,
} from 'lucide-react';
import { costCentersAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const CostCenterSelectionModal = lazy(() => import('./CostCenterSelectionModal'));

const COST_CENTER_TYPES = [
  'DEPARTMENT', 'PROJECT', 'PRODUCTION_LINE', 'SERVICE', 'ADMINISTRATIVE', 'OTHER',
];

const costCenterSchema = yup.object().shape({
  cost_center_code: yup.string().trim().max(30).required('Code is required'),
  cost_center_name: yup.string().trim().max(150).required('Name is required'),
  cost_center_type: yup.string().oneOf(COST_CENTER_TYPES).required('Type is required'),
  gl_account_code: yup.string().trim().max(50).nullable(),
});

const EMPTY_FORM = {
  parent_cost_center_id: '',
  cost_center_code: '',
  cost_center_name: '',
  cost_center_type: 'DEPARTMENT',
  department_id: '',
  manager_user_id: '',
  gl_account_code: '',
  is_billable: false,
  is_active: true,
  opened_date: '',
  closed_date: '',
  remarks: '',
};

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const toForm = (cc) => {
  if (!cc) return { ...EMPTY_FORM };
  const out = { ...EMPTY_FORM };
  for (const k of Object.keys(EMPTY_FORM)) {
    if (cc[k] !== undefined && cc[k] !== null) out[k] = cc[k];
  }
  return out;
};

const toPayload = (form) => {
  const p = { ...form };
  ['parent_cost_center_id', 'department_id', 'manager_user_id'].forEach(k => {
    p[k] = numOrNull(p[k]);
  });
  ['opened_date', 'closed_date'].forEach(k => { if (!p[k]) p[k] = null; });
  if (!p.gl_account_code) delete p.gl_account_code;
  return p;
};

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
  <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
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

const Section = ({ icon: Icon, title, children }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span className="text-xs font-medium">{title}</span>
    </div>
    <div className="p-2.5">{children}</div>
  </div>
);

const CostCenterModal = ({ show, costCenter, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showParentModal, setShowParentModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  const isEdit = Boolean(costCenter?.cost_center_id);

  useEffect(() => {
    if (!show) {
      setApiError(null);
      setValidationErrors({});
      setSelectedParent(null);
      return;
    }
    setForm(toForm(costCenter));
    setApiError(null);
    setValidationErrors({});
    setSelectedParent(costCenter?.parent || null);
  }, [show, costCenter]);

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(p => { const n = { ...p }; delete n[field]; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError]);

  const handleParentSelect = useCallback((cc) => {
    if (cc) {
      handleChange('parent_cost_center_id', cc.cost_center_id);
      setSelectedParent(cc);
    } else {
      handleChange('parent_cost_center_id', '');
      setSelectedParent(null);
    }
    setShowParentModal(false);
  }, [handleChange]);

  const validate = useCallback(async () => {
    try {
      await costCenterSchema.validate(
        {
          cost_center_code: form.cost_center_code,
          cost_center_name: form.cost_center_name,
          cost_center_type: form.cost_center_type,
          gl_account_code: form.gl_account_code || null,
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
    const ok = await validate();
    if (!ok) return;

    setSaveLoading(true);
    setApiError(null);
    try {
      const payload = toPayload(form);
      if (isEdit) {
        await costCentersAPI.updateCostCenter(costCenter.cost_center_id, payload);
        toast.success('Cost center updated');
      } else {
        await costCentersAPI.createCostCenter(payload);
        toast.success('Cost center created');
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
  }, [form, isEdit, costCenter, onSaved, validate]);

  const displayParent = useMemo(() => {
    if (selectedParent) return `${selectedParent.cost_center_code} — ${selectedParent.cost_center_name}`;
    if (form.parent_cost_center_id) return `ID: ${form.parent_cost_center_id}`;
    return 'None (root)';
  }, [selectedParent, form.parent_cost_center_id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1000px] w-full h-[80vh] flex flex-col shadow-xl">
        <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b">
          <div>
            <h2 className="text-sm font-semibold">{isEdit ? 'Edit Cost Center' : 'Add Cost Center'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? costCenter.cost_center_name : 'Enter cost center details'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onClose} disabled={saveLoading} className="px-2.5 py-1 text-xs border rounded bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saveLoading} className="px-2.5 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1">
              <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} disabled={saveLoading} className="text-gray-400 hover:text-gray-600 p-1 ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2.5 space-y-2.5">
            {apiError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start justify-between">
                <span className="text-sm text-red-700">{apiError}</span>
                <button onClick={() => setApiError(null)}><X className="w-4 h-4 text-red-500" /></button>
              </div>
            )}

            {/* 1 · IDENTITY */}
            <Section icon={FolderTree} title="1 · Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <Field label="Name" required error={validationErrors.cost_center_name}>
                  <input type="text" value={form.cost_center_name} disabled={saveLoading}
                    onChange={e => handleChange('cost_center_name', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Code" required error={validationErrors.cost_center_code}>
                  <input type="text" value={form.cost_center_code} disabled={saveLoading}
                    onChange={e => handleChange('cost_center_code', e.target.value.toUpperCase())}
                    className="w-full px-1.5 py-1 border rounded text-xs uppercase" />
                </Field>
                <Field label="Type" required error={validationErrors.cost_center_type}>
                  <select value={form.cost_center_type} disabled={saveLoading}
                    onChange={e => handleChange('cost_center_type', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs">
                    {COST_CENTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Parent Cost Center">
                  <div className="flex items-center gap-1">
                    <div
                      className="flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => !saveLoading && setShowParentModal(true)}
                    >
                      <span className={`truncate ${form.parent_cost_center_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayParent}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {form.parent_cost_center_id && (
                      <button onClick={() => handleParentSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Field>
              </div>
            </Section>

            {/* 2 · OWNERSHIP */}
            <Section icon={Layers} title="2 · Ownership">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <Field label="Department ID">
                  <input type="number" value={form.department_id} disabled={saveLoading}
                    onChange={e => handleChange('department_id', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Manager User ID">
                  <input type="number" value={form.manager_user_id} disabled={saveLoading}
                    onChange={e => handleChange('manager_user_id', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="GL Account Code" error={validationErrors.gl_account_code}>
                  <input type="text" value={form.gl_account_code} disabled={saveLoading}
                    onChange={e => handleChange('gl_account_code', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs font-mono" />
                </Field>
                <div className="flex items-end">
                  <Toggle label="Is Billable" checked={form.is_billable} onChange={v => handleChange('is_billable', v)} disabled={saveLoading} />
                </div>
              </div>
            </Section>

            {/* 3 · LIFECYCLE */}
            <Section icon={Settings2} title="3 · Lifecycle">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <Field label="Opened Date">
                  <input type="date" value={form.opened_date} disabled={saveLoading}
                    onChange={e => handleChange('opened_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Closed Date">
                  <input type="date" value={form.closed_date} disabled={saveLoading}
                    onChange={e => handleChange('closed_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <div className="flex items-end">
                  <Toggle label="Is Active" checked={form.is_active} onChange={v => handleChange('is_active', v)} disabled={saveLoading} />
                </div>
                <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
                  <Field label="Remarks">
                    <textarea rows={2} value={form.remarks} disabled={saveLoading}
                      onChange={e => handleChange('remarks', e.target.value)}
                      className="w-full px-1.5 py-1 border rounded text-xs" />
                  </Field>
                </div>
              </div>
            </Section>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end px-2.5 py-1 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {isEdit
              ? `Last updated: ${costCenter.updated_at || costCenter.updatedAt || '—'}`
              : 'New cost center'}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <CostCenterSelectionModal
          show={showParentModal}
          onClose={() => setShowParentModal(false)}
          onSelect={handleParentSelect}
          selectedCostCenterId={form.parent_cost_center_id || null}
          excludeCostCenterId={isEdit ? costCenter?.cost_center_id : undefined}
          onlyActive
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(CostCenterModal);
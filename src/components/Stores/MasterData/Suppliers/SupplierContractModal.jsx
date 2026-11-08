// src/modules/Suppliers/SupplierContractModal.jsx
import React, {
  useState, useEffect, useCallback, useMemo, useRef,
  lazy, Suspense,
} from 'react';
import {
  X, Save, FileText, ChevronRight, DollarSign, Calendar,
  ShieldCheck, Plus, Trash2, AlertCircle, Layers,
} from 'lucide-react';
import { supplierContractsAPI, itemsAPI, uomsAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const SupplierSelectionModal = lazy(() => import('./SupplierSelectionModal'));
const SupplierContractSelectionModal = lazy(() => import('./SupplierContractSelectionModal'));
const ItemSelectionModal = lazy(() => import('../Items/ItemSelectionModal'));
const UomSelectionModal = lazy(() => import('../Uoms/UomSelectionModal'));

const CONTRACT_TYPES = [
  'RATE_CONTRACT', 'BLANKET_PO', 'ANNUAL_AGREEMENT',
  'FRAMEWORK', 'RETAINER', 'AMC', 'ONE_TIME',
];
const CONTRACT_STATUSES = [
  'DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'EXPIRED',
  'TERMINATED', 'SUSPENDED', 'RENEWED', 'CLOSED',
];

const headerSchema = yup.object().shape({
  contract_no: yup.string().trim().max(50).required('Contract No is required'),
  contract_title: yup.string().trim().max(200).nullable(),
  contract_type: yup.string().oneOf(CONTRACT_TYPES).required('Type is required'),
  supplier_id: yup.number().required('Supplier is required'),
  start_date: yup.string().required('Start date is required'),
  end_date: yup.string().required('End date is required'),
  status: yup.string().oneOf(CONTRACT_STATUSES).required('Status is required'),
  payment_terms_days: yup.number().integer().min(0).nullable(),
  renewal_alert_days: yup.number().integer().min(0).max(365).nullable(),
  notice_period_days: yup.number().integer().min(0).nullable(),
});

const EMPTY_HEADER = {
  supplier_id: '',
  parent_contract_id: '',
  contract_no: '',
  contract_title: '',
  contract_type: 'RATE_CONTRACT',
  contract_date: '',
  start_date: '',
  end_date: '',
  renewal_alert_days: 30,
  auto_renewal: false,
  renewal_terms: '',

  currency: 'INR',
  payment_terms_days: 30,
  delivery_terms: '',
  price_escalation_clause: '',
  price_escalation_percent: '',
  ld_clause: '',
  warranty_terms: '',
  termination_clause: '',
  notice_period_days: '',
  security_deposit_amount: '',
  performance_bank_guarantee_amount: '',
  pbg_expiry_date: '',

  status: 'DRAFT',
  termination_reason: '',

  document_url: '',
  signed_copy_url: '',
  remarks: '',
};

const EMPTY_LINE = {
  contract_line_id: null,
  line_no: 1,
  item_id: '',
  uom_id: '',
  agreed_price: '',
  discount_percent: 0,
  tax_percent: 0,
  committed_qty: '',
  committed_value: '',
  lead_time_days: '',
  moq: '',
  order_multiple: '',
  price_valid_from: '',
  price_valid_to: '',
  spec_reference: '',
  is_active: true,
  remarks: '',
};

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const toHeaderForm = (c) => {
  if (!c) return { ...EMPTY_HEADER };
  const out = { ...EMPTY_HEADER };
  for (const k of Object.keys(EMPTY_HEADER)) {
    if (c[k] !== undefined && c[k] !== null) out[k] = c[k];
  }
  return out;
};

const toLineForm = (l, idx) => {
  if (!l) return { ...EMPTY_LINE, line_no: idx + 1 };
  return {
    contract_line_id: l.contract_line_id ?? null,
    line_no: l.line_no ?? idx + 1,
    item_id: l.item_id ?? '',
    uom_id: l.uom_id ?? '',
    agreed_price: l.agreed_price ?? '',
    discount_percent: l.discount_percent ?? 0,
    tax_percent: l.tax_percent ?? 0,
    committed_qty: l.committed_qty ?? '',
    committed_value: l.committed_value ?? '',
    lead_time_days: l.lead_time_days ?? '',
    moq: l.moq ?? '',
    order_multiple: l.order_multiple ?? '',
    price_valid_from: l.price_valid_from ?? '',
    price_valid_to: l.price_valid_to ?? '',
    spec_reference: l.spec_reference ?? '',
    is_active: l.is_active !== false,
    remarks: l.remarks ?? '',
  };
};

const headerPayload = (form) => {
  const p = { ...form };
  [
    'supplier_id', 'parent_contract_id',
    'renewal_alert_days', 'payment_terms_days', 'notice_period_days',
    'price_escalation_percent', 'security_deposit_amount',
    'performance_bank_guarantee_amount',
  ].forEach(k => { p[k] = numOrNull(p[k]); });
  ['contract_date', 'start_date', 'end_date', 'pbg_expiry_date'].forEach(k => {
    if (!p[k]) p[k] = null;
  });
  if (!p.renewal_terms) delete p.renewal_terms;
  if (!p.delivery_terms) delete p.delivery_terms;
  if (!p.price_escalation_clause) delete p.price_escalation_clause;
  if (!p.ld_clause) delete p.ld_clause;
  if (!p.warranty_terms) delete p.warranty_terms;
  if (!p.termination_clause) delete p.termination_clause;
  if (!p.termination_reason) delete p.termination_reason;
  if (!p.document_url) delete p.document_url;
  if (!p.signed_copy_url) delete p.signed_copy_url;
  if (!p.remarks) delete p.remarks;
  return p;
};

const linePayload = (L, idx) => {
  const committedQty = numOrNull(L.committed_qty);
  const committedValue = L.committed_value !== '' && L.committed_value != null
    ? Number(L.committed_value)
    : (numOrNull(L.agreed_price) || 0) * (committedQty || 0);

  return {
    contract_line_id: L.contract_line_id || undefined,
    line_no: idx + 1,
    item_id: Number(L.item_id),
    uom_id: numOrNull(L.uom_id),
    agreed_price: numOrNull(L.agreed_price) ?? 0,
    discount_percent: numOrNull(L.discount_percent) ?? 0,
    tax_percent: numOrNull(L.tax_percent) ?? 0,
    committed_qty: committedQty,
    committed_value: committedValue,
    lead_time_days: numOrNull(L.lead_time_days),
    moq: numOrNull(L.moq),
    order_multiple: numOrNull(L.order_multiple),
    price_valid_from: L.price_valid_from || null,
    price_valid_to: L.price_valid_to || null,
    spec_reference: L.spec_reference || null,
    is_active: L.is_active !== false,
    remarks: L.remarks || null,
  };
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
    <input type="checkbox" checked={!!checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-1" />
    <span>{label}</span>
  </label>
);

const Section = ({ icon: Icon, title, children, right }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 border-b">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="text-xs font-medium">{title}</span>
      </div>
      {right}
    </div>
    <div className="p-2.5">{children}</div>
  </div>
);

/* ---------- Lines editor ---------- */
const LinesEditor = ({
  lines, onChange, canEdit, onOpenItemPicker, onOpenUomPicker, currency,
}) => {
  const addLine = useCallback(() => {
    onChange([...lines, { ...EMPTY_LINE, line_no: lines.length + 1 }]);
  }, [lines, onChange]);

  const removeLine = useCallback((idx) => {
    onChange(lines.filter((_, i) => i !== idx));
  }, [lines, onChange]);

  const updateLine = useCallback((idx, field, value) => {
    onChange(lines.map((l, i) => {
      if (i !== idx) return l;
      const next = { ...l, [field]: value };
      // Auto-compute committed_value when price or qty changes
      if (field === 'agreed_price' || field === 'committed_qty') {
        const price = Number(next.agreed_price) || 0;
        const qty = Number(next.committed_qty) || 0;
        if (price && qty) next.committed_value = price * qty;
      }
      return next;
    }));
  }, [lines, onChange]);

  const totalCommittedValue = useMemo(() => {
    return lines.reduce((sum, l) => {
      const v = Number(l.committed_value) ||
        (Number(l.agreed_price) || 0) * (Number(l.committed_qty) || 0);
      return sum + v;
    }, 0);
  }, [lines]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full min-w-max">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-1 py-1 text-left text-[10px] font-medium text-gray-500 uppercase">#</th>
              <th className="px-1 py-1 text-left text-[10px] font-medium text-gray-500 uppercase">Item</th>
              <th className="px-1 py-1 text-left text-[10px] font-medium text-gray-500 uppercase">UoM</th>
              <th className="px-1 py-1 text-right text-[10px] font-medium text-gray-500 uppercase">Price</th>
              <th className="px-1 py-1 text-right text-[10px] font-medium text-gray-500 uppercase">Disc %</th>
              <th className="px-1 py-1 text-right text-[10px] font-medium text-gray-500 uppercase">Tax %</th>
              <th className="px-1 py-1 text-right text-[10px] font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-1 py-1 text-right text-[10px] font-medium text-gray-500 uppercase">Value</th>
              <th className="px-1 py-1 text-right text-[10px] font-medium text-gray-500 uppercase">Lead (d)</th>
              <th className="px-1 py-1 text-right text-[10px] font-medium text-gray-500 uppercase">MOQ</th>
              <th className="px-1 py-1 text-left text-[10px] font-medium text-gray-500 uppercase">From</th>
              <th className="px-1 py-1 text-left text-[10px] font-medium text-gray-500 uppercase">To</th>
              <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">Active</th>
              <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-2 py-3 text-center text-[11px] text-gray-500">
                  No lines yet. Click "Add Line" to start.
                </td>
              </tr>
            ) : (
              lines.map((L, idx) => (
                <tr key={L.contract_line_id ?? `new-${idx}`} className="hover:bg-gray-50">
                  <td className="px-1 py-0.5 text-[11px] text-gray-500">{idx + 1}</td>
                  <td className="px-1 py-0.5">
                    <div
                      className="min-w-[180px] px-1.5 py-0.5 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => canEdit && onOpenItemPicker(idx)}
                    >
                      <span className={`truncate ${L.item_id ? 'text-gray-900' : 'text-gray-400'}`}>
                        {L.item_id ? `#${L.item_id}` : 'Select item'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-1 py-0.5">
                    <div
                      className="min-w-[70px] px-1.5 py-0.5 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => canEdit && onOpenUomPicker(idx)}
                    >
                      <span className={`truncate ${L.uom_id ? 'text-gray-900' : 'text-gray-400'}`}>
                        {L.uom_id ? `#${L.uom_id}` : '—'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" step="0.0001" value={L.agreed_price}
                      onChange={e => updateLine(idx, 'agreed_price', e.target.value)}
                      disabled={!canEdit}
                      className="w-20 px-1 py-0.5 border rounded text-xs text-right" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" step="0.01" value={L.discount_percent}
                      onChange={e => updateLine(idx, 'discount_percent', e.target.value)}
                      disabled={!canEdit}
                      className="w-16 px-1 py-0.5 border rounded text-xs text-right" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" step="0.01" value={L.tax_percent}
                      onChange={e => updateLine(idx, 'tax_percent', e.target.value)}
                      disabled={!canEdit}
                      className="w-16 px-1 py-0.5 border rounded text-xs text-right" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" step="0.0001" value={L.committed_qty}
                      onChange={e => updateLine(idx, 'committed_qty', e.target.value)}
                      disabled={!canEdit}
                      className="w-20 px-1 py-0.5 border rounded text-xs text-right" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" step="0.01" value={L.committed_value}
                      onChange={e => updateLine(idx, 'committed_value', e.target.value)}
                      disabled={!canEdit}
                      className="w-24 px-1 py-0.5 border rounded text-xs text-right" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" value={L.lead_time_days}
                      onChange={e => updateLine(idx, 'lead_time_days', e.target.value)}
                      disabled={!canEdit}
                      className="w-16 px-1 py-0.5 border rounded text-xs text-right" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="number" step="0.0001" value={L.moq}
                      onChange={e => updateLine(idx, 'moq', e.target.value)}
                      disabled={!canEdit}
                      className="w-16 px-1 py-0.5 border rounded text-xs text-right" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="date" value={L.price_valid_from}
                      onChange={e => updateLine(idx, 'price_valid_from', e.target.value)}
                      disabled={!canEdit}
                      className="w-28 px-1 py-0.5 border rounded text-xs" />
                  </td>
                  <td className="px-1 py-0.5">
                    <input type="date" value={L.price_valid_to}
                      onChange={e => updateLine(idx, 'price_valid_to', e.target.value)}
                      disabled={!canEdit}
                      className="w-28 px-1 py-0.5 border rounded text-xs" />
                  </td>
                  <td className="px-1 py-0.5 text-center">
                    <input type="checkbox" checked={L.is_active}
                      onChange={e => updateLine(idx, 'is_active', e.target.checked)}
                      disabled={!canEdit}
                      className="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-1" />
                  </td>
                  <td className="px-1 py-0.5 text-center">
                    <button onClick={() => removeLine(idx)} disabled={!canEdit}
                      className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 disabled:opacity-40">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        {canEdit && (
          <button onClick={addLine}
            className="flex items-center gap-1 px-2 py-1 text-xs border rounded bg-white hover:bg-gray-50">
            <Plus className="w-3 h-3" /> Add Line
          </button>
        )}
        <div className="text-[11px] text-gray-700">
          Total committed value: <span className="font-medium font-mono">{currency} {totalCommittedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};

const SupplierContractModal = ({ show, supplierContract, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...EMPTY_HEADER });
  const [lines, setLines] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [itemPickerLineIdx, setItemPickerLineIdx] = useState(null);
  const [showUomPicker, setShowUomPicker] = useState(false);
  const [uomPickerLineIdx, setUomPickerLineIdx] = useState(null);
  const [selectedItemsMap, setSelectedItemsMap] = useState({}); // lineIdx -> item
  const [selectedUomsMap, setSelectedUomsMap] = useState({});   // lineIdx -> uom

  const isEdit = Boolean(supplierContract?.contract_id);

  useEffect(() => {
    if (!show) {
      setApiError(null); setValidationErrors({});
      setSelectedSupplier(null); setSelectedParent(null);
      setSelectedItemsMap({}); setSelectedUomsMap({});
      return;
    }
    setForm(toHeaderForm(supplierContract));
    setApiError(null);
    setValidationErrors({});
    setSelectedSupplier(supplierContract?.supplier || null);
    setSelectedParent(supplierContract?.parent_contract || null);

    if (isEdit && Array.isArray(supplierContract.lines)) {
      setLines(supplierContract.lines.map(toLineForm));
      // Pre-seed item/uom labels from the joined include
      const itmMap = {}; const uomMap = {};
      supplierContract.lines.forEach((l, i) => {
        if (l.item) itmMap[i] = l.item;
        if (l.uom)  uomMap[i] = l.uom;
      });
      setSelectedItemsMap(itmMap);
      setSelectedUomsMap(uomMap);
    } else {
      setLines([]);
      setSelectedItemsMap({}); setSelectedUomsMap({});
    }
  }, [show, supplierContract, isEdit]);

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(p => { const n = { ...p }; delete n[field]; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError]);

  const handleSupplierSelect = useCallback((s) => {
    handleChange('supplier_id', s ? s.supplier_id : '');
    setSelectedSupplier(s || null);
    setShowSupplierModal(false);
  }, [handleChange]);

  const handleParentSelect = useCallback((c) => {
    handleChange('parent_contract_id', c ? c.contract_id : '');
    setSelectedParent(c || null);
    setShowParentModal(false);
  }, [handleChange]);

  const openItemPicker = useCallback((idx) => {
    setItemPickerLineIdx(idx);
    setShowItemPicker(true);
  }, []);

  const handleItemSelect = useCallback((item) => {
    if (itemPickerLineIdx == null) return;
    const idx = itemPickerLineIdx;
    setLines(prev => prev.map((l, i) => i === idx ? {
      ...l,
      item_id: item.item_id,
      // Prefill price/qty from item defaults if empty
      agreed_price: l.agreed_price || item.standard_cost || '',
    } : l));
    setSelectedItemsMap(prev => ({ ...prev, [idx]: item }));
    setShowItemPicker(false);
    setItemPickerLineIdx(null);
  }, [itemPickerLineIdx]);

  const openUomPicker = useCallback((idx) => {
    setUomPickerLineIdx(idx);
    setShowUomPicker(true);
  }, []);

  const handleUomSelect = useCallback((uom) => {
    if (uomPickerLineIdx == null) return;
    const idx = uomPickerLineIdx;
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, uom_id: uom?.uom_id ?? '' } : l));
    setSelectedUomsMap(prev => ({ ...prev, [idx]: uom || null }));
    setShowUomPicker(false);
    setUomPickerLineIdx(null);
  }, [uomPickerLineIdx]);

  const validate = useCallback(async () => {
    try {
      await headerSchema.validate(
        {
          contract_no: form.contract_no,
          contract_title: form.contract_title || null,
          contract_type: form.contract_type,
          supplier_id: numOrNull(form.supplier_id),
          start_date: form.start_date,
          end_date: form.end_date,
          status: form.status,
          payment_terms_days: numOrNull(form.payment_terms_days),
          renewal_alert_days: numOrNull(form.renewal_alert_days),
          notice_period_days: numOrNull(form.notice_period_days),
        },
        { abortEarly: false }
      );

      if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
        setValidationErrors({ end_date: 'End date must be after start date' });
        toast.error('End date must be after start date');
        return false;
      }

      // Line validation
      const lineErrors = {};
      lines.forEach((L, i) => {
        if (!L.item_id) lineErrors[`line_${i}_item`] = 'Item required';
        if (L.agreed_price === '' || L.agreed_price == null) lineErrors[`line_${i}_price`] = 'Price required';
      });
      if (Object.keys(lineErrors).length) {
        setValidationErrors(lineErrors);
        toast.error('Please fix line items');
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
  }, [form, lines]);

  const handleSave = useCallback(async () => {
    const ok = await validate();
    if (!ok) return;

    setSaveLoading(true);
    setApiError(null);
    try {
      const payload = {
        ...headerPayload(form),
        lines: lines.map(linePayload),
      };

      if (isEdit) {
        await supplierContractsAPI.updateSupplierContract(supplierContract.contract_id, payload);
        toast.success('Contract updated');
      } else {
        await supplierContractsAPI.createSupplierContract(payload);
        toast.success('Contract created');
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
  }, [form, lines, isEdit, supplierContract, onSaved, validate]);

  const displaySupplier = useMemo(() => {
    if (selectedSupplier) return `${selectedSupplier.supplier_code} — ${selectedSupplier.legal_name}`;
    if (form.supplier_id) return `ID: ${form.supplier_id}`;
    return 'Select supplier';
  }, [selectedSupplier, form.supplier_id]);

  const displayParent = useMemo(() => {
    if (selectedParent) return `${selectedParent.contract_no} — ${selectedParent.contract_title}`;
    if (form.parent_contract_id) return `ID: ${form.parent_contract_id}`;
    return 'None';
  }, [selectedParent, form.parent_contract_id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1600px] w-full h-[94vh] flex flex-col shadow-xl">
        <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b">
          <div>
            <h2 className="text-sm font-semibold">{isEdit ? 'Edit Supplier Contract' : 'Add Supplier Contract'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? supplierContract.contract_title || supplierContract.contract_no : 'Enter contract details'}
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

            {/* 1 · HEADER */}
            <Section icon={FileText} title="1 · Contract">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                <Field label="Contract No" required error={validationErrors.contract_no}>
                  <input type="text" value={form.contract_no} disabled={saveLoading}
                    onChange={e => handleChange('contract_no', e.target.value.toUpperCase())}
                    className="w-full px-1.5 py-1 border rounded text-xs font-mono uppercase" />
                </Field>
                <Field label="Title" error={validationErrors.contract_title}>
                  <input type="text" value={form.contract_title} disabled={saveLoading}
                    onChange={e => handleChange('contract_title', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Type" required error={validationErrors.contract_type}>
                  <select value={form.contract_type} disabled={saveLoading}
                    onChange={e => handleChange('contract_type', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs">
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Supplier" required error={validationErrors.supplier_id}>
                  <div className="flex items-center gap-1">
                    <div
                      className="flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => !saveLoading && setShowSupplierModal(true)}
                    >
                      <span className={`truncate ${form.supplier_id ? 'text-gray-900' : 'text-gray-400'}`}>{displaySupplier}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {form.supplier_id && (
                      <button onClick={() => handleSupplierSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Parent Contract" hint="(amendment chain)">
                  <div className="flex items-center gap-1">
                    <div
                      className="flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => !saveLoading && setShowParentModal(true)}
                    >
                      <span className={`truncate ${form.parent_contract_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayParent}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {form.parent_contract_id && (
                      <button onClick={() => handleParentSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Status" required error={validationErrors.status}>
                  <select value={form.status} disabled={saveLoading}
                    onChange={e => handleChange('status', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs">
                    {CONTRACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            {/* 2 · DATES */}
            <Section icon={Calendar} title="2 · Dates & Renewal">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                <Field label="Contract Date">
                  <input type="date" value={form.contract_date} disabled={saveLoading}
                    onChange={e => handleChange('contract_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Start Date" required error={validationErrors.start_date}>
                  <input type="date" value={form.start_date} disabled={saveLoading}
                    onChange={e => handleChange('start_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="End Date" required error={validationErrors.end_date}>
                  <input type="date" value={form.end_date} disabled={saveLoading}
                    onChange={e => handleChange('end_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Renewal Alert (days)" error={validationErrors.renewal_alert_days}>
                  <input type="number" min="0" max="365" value={form.renewal_alert_days}
                    disabled={saveLoading}
                    onChange={e => handleChange('renewal_alert_days', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <div className="flex items-end">
                  <Toggle label="Auto Renewal" checked={form.auto_renewal} onChange={v => handleChange('auto_renewal', v)} disabled={saveLoading} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <Field label="Renewal Terms">
                  <textarea rows={2} value={form.renewal_terms} disabled={saveLoading}
                    onChange={e => handleChange('renewal_terms', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
              </div>
            </Section>

            {/* 3 · COMMERCIAL TERMS */}
            <Section icon={DollarSign} title="3 · Commercial Terms">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                <Field label="Currency">
                  <select value={form.currency} disabled={saveLoading}
                    onChange={e => handleChange('currency', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </Field>
                <Field label="Payment Terms (days)" error={validationErrors.payment_terms_days}>
                  <input type="number" min="0" value={form.payment_terms_days}
                    disabled={saveLoading}
                    onChange={e => handleChange('payment_terms_days', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Price Escalation %">
                  <input type="number" step="0.01" min="0" max="100" value={form.price_escalation_percent}
                    disabled={saveLoading}
                    onChange={e => handleChange('price_escalation_percent', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Notice Period (days)">
                  <input type="number" min="0" value={form.notice_period_days}
                    disabled={saveLoading}
                    onChange={e => handleChange('notice_period_days', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Security Deposit">
                  <input type="number" step="0.01" min="0" value={form.security_deposit_amount}
                    disabled={saveLoading}
                    onChange={e => handleChange('security_deposit_amount', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="PBG Amount">
                  <input type="number" step="0.01" min="0" value={form.performance_bank_guarantee_amount}
                    disabled={saveLoading}
                    onChange={e => handleChange('performance_bank_guarantee_amount', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="PBG Expiry">
                  <input type="date" value={form.pbg_expiry_date} disabled={saveLoading}
                    onChange={e => handleChange('pbg_expiry_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <Field label="Delivery Terms">
                  <textarea rows={2} value={form.delivery_terms} disabled={saveLoading}
                    onChange={e => handleChange('delivery_terms', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Price Escalation Clause">
                  <textarea rows={2} value={form.price_escalation_clause} disabled={saveLoading}
                    onChange={e => handleChange('price_escalation_clause', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="LD Clause">
                  <textarea rows={2} value={form.ld_clause} disabled={saveLoading}
                    onChange={e => handleChange('ld_clause', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Warranty Terms">
                  <textarea rows={2} value={form.warranty_terms} disabled={saveLoading}
                    onChange={e => handleChange('warranty_terms', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
              </div>
            </Section>

            {/* 4 · LINES */}
            <Section icon={Layers} title="4 · Line Items">
              <LinesEditor
                lines={lines}
                onChange={setLines}
                canEdit={!saveLoading}
                onOpenItemPicker={openItemPicker}
                onOpenUomPicker={openUomPicker}
                currency={form.currency}
              />
            </Section>

            {/* 5 · STATUS / TERMINATION */}
            <Section icon={ShieldCheck} title="5 · Approval & Termination">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {isEdit && supplierContract.approved_by && (
                  <Field label="Approved By">
                    <input type="number" value={supplierContract.approved_by} disabled
                      className="w-full px-1.5 py-1 border rounded text-xs bg-gray-50 text-gray-600" />
                  </Field>
                )}
                {isEdit && supplierContract.approved_at && (
                  <Field label="Approved At">
                    <input type="text" value={new Date(supplierContract.approved_at).toLocaleString()} disabled
                      className="w-full px-1.5 py-1 border rounded text-xs bg-gray-50 text-gray-600" />
                  </Field>
                )}
                {isEdit && supplierContract.terminated_by && (
                  <Field label="Terminated By">
                    <input type="number" value={supplierContract.terminated_by} disabled
                      className="w-full px-1.5 py-1 border rounded text-xs bg-gray-50 text-gray-600" />
                  </Field>
                )}
                {isEdit && supplierContract.terminated_at && (
                  <Field label="Terminated At">
                    <input type="text" value={new Date(supplierContract.terminated_at).toLocaleString()} disabled
                      className="w-full px-1.5 py-1 border rounded text-xs bg-gray-50 text-gray-600" />
                  </Field>
                )}
              </div>
              {form.status === 'TERMINATED' && (
                <div className="mt-2">
                  <Field label="Termination Reason" error={validationErrors.termination_reason}>
                    <textarea rows={2} value={form.termination_reason} disabled={saveLoading}
                      onChange={e => handleChange('termination_reason', e.target.value)}
                      className="w-full px-1.5 py-1 border rounded text-xs" />
                  </Field>
                </div>
              )}
              <div className="mt-2">
                <Field label="Termination Clause">
                  <textarea rows={2} value={form.termination_clause} disabled={saveLoading}
                    onChange={e => handleChange('termination_clause', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
              </div>
            </Section>

            {/* 6 · DOCUMENTS & REMARKS */}
            <Section icon={FileText} title="6 · Documents & Remarks">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <Field label="Contract Document URL">
                    <input type="url" value={form.document_url} disabled={saveLoading}
                      onChange={e => handleChange('document_url', e.target.value)}
                      placeholder="https://files.example.com/contracts/..."
                      className="w-full px-1.5 py-1 border rounded text-xs" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Signed Copy URL">
                    <input type="url" value={form.signed_copy_url} disabled={saveLoading}
                      onChange={e => handleChange('signed_copy_url', e.target.value)}
                      placeholder="https://files.example.com/contracts/signed/..."
                      className="w-full px-1.5 py-1 border rounded text-xs" />
                  </Field>
                </div>
                {(form.document_url || form.signed_copy_url) && (
                  <div className="sm:col-span-4 flex items-center gap-3">
                    {form.document_url && (
                      <a href={form.document_url} target="_blank" rel="noreferrer"
                         className="inline-flex items-center gap-1 text-[11px] text-primary-600 underline">
                        <FileText className="w-3 h-3" /> Open contract
                      </a>
                    )}
                    {form.signed_copy_url && (
                      <a href={form.signed_copy_url} target="_blank" rel="noreferrer"
                         className="inline-flex items-center gap-1 text-[11px] text-primary-600 underline">
                        <FileText className="w-3 h-3" /> Open signed copy
                      </a>
                    )}
                  </div>
                )}
                <div className="sm:col-span-4">
                  <Field label="Remarks">
                    <textarea rows={3} value={form.remarks} disabled={saveLoading}
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
              ? `Last updated: ${supplierContract.updated_at || supplierContract.updatedAt || '—'}`
              : 'New supplier contract'}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <SupplierSelectionModal
          show={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          onSelect={handleSupplierSelect}
          selectedSupplierId={form.supplier_id || null}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <SupplierContractSelectionModal
          show={showParentModal}
          onClose={() => setShowParentModal(false)}
          onSelect={handleParentSelect}
          selectedContractId={form.parent_contract_id || null}
          excludeContractId={isEdit ? supplierContract?.contract_id : undefined}
          filterSupplierId={form.supplier_id || undefined}
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <ItemSelectionModal
          show={showItemPicker}
          onClose={() => { setShowItemPicker(false); setItemPickerLineIdx(null); }}
          onSelect={handleItemSelect}
          selectedItemId={itemPickerLineIdx != null ? (lines[itemPickerLineIdx]?.item_id || null) : null}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <UomSelectionModal
          show={showUomPicker}
          onClose={() => { setShowUomPicker(false); setUomPickerLineIdx(null); }}
          onSelect={handleUomSelect}
          selectedUomId={uomPickerLineIdx != null ? (lines[uomPickerLineIdx]?.uom_id || null) : null}
          onlyActive
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(SupplierContractModal);
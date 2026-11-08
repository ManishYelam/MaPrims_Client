// src/modules/Suppliers/SupplierDocumentModal.jsx
import React, {
  useState, useEffect, useCallback, useMemo,
  lazy, Suspense,
} from 'react';
import {
  X, Save, FileText, ShieldCheck, Calendar, ChevronRight,
  XCircle, CheckCircle, AlertCircle,
} from 'lucide-react';
import { supplierDocumentsAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const SupplierSelectionModal = lazy(() => import('./SupplierSelectionModal'));
const SupplierDocumentSelectionModal = lazy(() => import('./SupplierDocumentSelectionModal'));

const DOCUMENT_TYPES = [
  'TAX_REGISTRATION', 'GST_CERTIFICATE', 'PAN', 'TAN', 'CIN',
  'BUSINESS_REGISTRATION', 'INCORPORATION_CERT', 'TRADE_LICENSE',
  'FACTORY_LICENSE', 'SHOP_ESTABLISHMENT', 'POLLUTION_CERT',
  'ISO_9001', 'ISO_14001', 'ISO_45001', 'ISO_22000', 'ISO_27001',
  'HACCP', 'GMP', 'PRODUCT_CERT', 'CE_CERT', 'FDA_CERT', 'BIS_CERT',
  'DRUG_LICENSE', 'FOOD_SAFETY', 'AYUSH_LICENSE',
  'MSME_CERT', 'UDYAM_CERT', 'STARTUP_CERT',
  'NDA', 'CODE_OF_CONDUCT', 'ANTI_BRIBERY', 'CONFLICT_OF_INTEREST',
  'INSURANCE_CERT', 'BANK_VERIFICATION', 'CANCELLED_CHEQUE',
  'ESG_REPORT', 'OTHER',
];
const VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'RENEWED'];
const FILE_TYPES = ['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX', 'OTHER'];

const supplierDocumentSchema = yup.object().shape({
  supplier_id: yup.number().required('Supplier is required'),
  document_type: yup.string().oneOf(DOCUMENT_TYPES).required('Type is required'),
  document_name: yup.string().trim().max(200).nullable(),
  document_no: yup.string().trim().max(100).nullable(),
  file_url: yup.string().url('Invalid URL').max(500).required('File URL is required'),
  file_type: yup.string().max(50).nullable(),
  file_size_kb: yup.number().integer().min(0).nullable(),
  expiry_alert_days: yup.number().integer().min(0).max(3650).nullable(),
  version: yup.number().integer().min(1).nullable(),
});

const EMPTY_FORM = {
  supplier_id: '',
  document_type: 'GST_CERTIFICATE',
  document_name: '',
  document_no: '',
  file_url: '',
  file_type: 'PDF',
  file_size_kb: '',

  issue_date: '',
  expiry_date: '',
  issued_by_authority: '',

  verification_status: 'PENDING',
  verification_remarks: '',
  rejection_reason: '',

  version: 1,
  parent_document_id: '',
  expiry_alert_days: 30,

  is_mandatory: false,
  is_active: true,
  remarks: '',
};

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

const toForm = (d) => {
  if (!d) return { ...EMPTY_FORM };
  const out = { ...EMPTY_FORM };
  for (const k of Object.keys(EMPTY_FORM)) {
    if (d[k] !== undefined && d[k] !== null) out[k] = d[k];
  }
  return out;
};

const toPayload = (form) => {
  const p = { ...form };
  [
    'supplier_id',
    'file_size_kb',
    'version',
    'parent_document_id',
    'expiry_alert_days',
  ].forEach(k => { p[k] = numOrNull(p[k]); });

  ['issue_date', 'expiry_date'].forEach(k => { if (!p[k]) p[k] = null; });
  if (!p.verification_remarks) delete p.verification_remarks;
  if (!p.rejection_reason) delete p.rejection_reason;
  if (!p.file_type) delete p.file_type;

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

const SupplierDocumentModal = ({ show, supplierDocument, onClose, onSaved }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [selectedParentDoc, setSelectedParentDoc] = useState(null);

  const isEdit = Boolean(supplierDocument?.document_id);

  useEffect(() => {
    if (!show) {
      setApiError(null);
      setValidationErrors({});
      setSelectedSupplier(null);
      setSelectedParentDoc(null);
      return;
    }
    setForm(toForm(supplierDocument));
    setApiError(null);
    setValidationErrors({});
    setSelectedSupplier(supplierDocument?.supplier || null);
    setSelectedParentDoc(supplierDocument?.parent_document || null);
  }, [show, supplierDocument]);

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

  const handleParentSelect = useCallback((d) => {
    handleChange('parent_document_id', d ? d.document_id : '');
    setSelectedParentDoc(d || null);
    setShowParentModal(false);
  }, [handleChange]);

  const validate = useCallback(async () => {
    try {
      await supplierDocumentSchema.validate(
        {
          supplier_id: numOrNull(form.supplier_id),
          document_type: form.document_type,
          document_name: form.document_name || null,
          document_no: form.document_no || null,
          file_url: form.file_url,
          file_type: form.file_type || null,
          file_size_kb: numOrNull(form.file_size_kb),
          expiry_alert_days: numOrNull(form.expiry_alert_days),
          version: numOrNull(form.version),
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
        await supplierDocumentsAPI.updateSupplierDocument(supplierDocument.document_id, payload);
        toast.success('Document updated');
      } else {
        await supplierDocumentsAPI.createSupplierDocument(payload);
        toast.success('Document created');
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
  }, [form, isEdit, supplierDocument, onSaved, validate]);

  const displaySupplier = useMemo(() => {
    if (selectedSupplier) return `${selectedSupplier.supplier_code} — ${selectedSupplier.legal_name}`;
    if (form.supplier_id) return `ID: ${form.supplier_id}`;
    return 'Select supplier';
  }, [selectedSupplier, form.supplier_id]);

  const displayParent = useMemo(() => {
    if (selectedParentDoc) return `#${selectedParentDoc.document_id} — ${selectedParentDoc.document_type} v${selectedParentDoc.version}`;
    if (form.parent_document_id) return `ID: ${form.parent_document_id}`;
    return 'None';
  }, [selectedParentDoc, form.parent_document_id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1400px] w-full h-[92vh] flex flex-col shadow-xl">
        <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b">
          <div>
            <h2 className="text-sm font-semibold">{isEdit ? 'Edit Supplier Document' : 'Add Supplier Document'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? supplierDocument.document_name || supplierDocument.document_type : 'Upload or register a supplier document'}
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

            {/* 1 · OWNERSHIP */}
            <Section icon={FileText} title="1 · Ownership & Type">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                <Field label="Supplier" required error={validationErrors.supplier_id}>
                  <div className="flex items-center gap-1">
                    <div
                      className={`flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between ${
                        isEdit ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                      }`}
                      onClick={() => !saveLoading && !isEdit && setShowSupplierModal(true)}
                    >
                      <span className={`truncate ${form.supplier_id ? 'text-gray-900' : 'text-gray-400'}`}>{displaySupplier}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {form.supplier_id && !isEdit && (
                      <button onClick={() => handleSupplierSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Document Type" required error={validationErrors.document_type}>
                  <select value={form.document_type} disabled={saveLoading}
                    onChange={e => handleChange('document_type', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs">
                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Document Name" error={validationErrors.document_name}>
                  <input type="text" value={form.document_name} disabled={saveLoading}
                    onChange={e => handleChange('document_name', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Document No." error={validationErrors.document_no}>
                  <input type="text" value={form.document_no} disabled={saveLoading}
                    onChange={e => handleChange('document_no', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs font-mono" />
                </Field>
                <Field label="Parent Document" hint="(if renewal)">
                  <div className="flex items-center gap-1">
                    <div
                      className="flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => !saveLoading && form.supplier_id && setShowParentModal(true)}
                    >
                      <span className={`truncate ${form.parent_document_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayParent}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                    {form.parent_document_id && (
                      <button onClick={() => handleParentSelect(null)} className="p-0.5 text-gray-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Version">
                  <input type="number" min="1" value={form.version} disabled={saveLoading}
                    onChange={e => handleChange('version', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
              </div>
            </Section>

            {/* 2 · FILE */}
            <Section icon={FileText} title="2 · File">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-4">
                  <Field label="File URL" required error={validationErrors.file_url}>
                    <input type="url" value={form.file_url} disabled={saveLoading}
                      onChange={e => handleChange('file_url', e.target.value)}
                      placeholder="https://files.example.com/..."
                      className="w-full px-1.5 py-1 border rounded text-xs" />
                  </Field>
                </div>
                <Field label="File Type">
                  <select value={form.file_type} disabled={saveLoading}
                    onChange={e => handleChange('file_type', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs">
                    <option value="">—</option>
                    {FILE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="File Size (KB)">
                  <input type="number" min="0" value={form.file_size_kb} disabled={saveLoading}
                    onChange={e => handleChange('file_size_kb', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                {form.file_url && (
                  <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                    <a href={form.file_url} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-[11px] text-primary-600 underline">
                      <FileText className="w-3 h-3" /> Open file in new tab
                    </a>
                  </div>
                )}
              </div>
            </Section>

            {/* 3 · VALIDITY */}
            <Section icon={Calendar} title="3 · Validity">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                <Field label="Issue Date">
                  <input type="date" value={form.issue_date} disabled={saveLoading}
                    onChange={e => handleChange('issue_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Expiry Date">
                  <input type="date" value={form.expiry_date} disabled={saveLoading}
                    onChange={e => handleChange('expiry_date', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Issued By Authority">
                  <input type="text" value={form.issued_by_authority} disabled={saveLoading}
                    onChange={e => handleChange('issued_by_authority', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <Field label="Expiry Alert (days)">
                  <input type="number" min="0" max="3650" value={form.expiry_alert_days}
                    disabled={saveLoading}
                    onChange={e => handleChange('expiry_alert_days', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
                <div className="flex items-end">
                  <Toggle label="Is Mandatory" checked={form.is_mandatory} onChange={v => handleChange('is_mandatory', v)} disabled={saveLoading} />
                </div>
              </div>
            </Section>

            {/* 4 · VERIFICATION */}
            <Section icon={ShieldCheck} title="4 · Verification">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                <Field label="Verification Status">
                  <select value={form.verification_status} disabled={saveLoading}
                    onChange={e => handleChange('verification_status', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs">
                    {VERIFICATION_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
                {isEdit && supplierDocument.verified_by && (
                  <Field label="Verified By (ID)">
                    <input type="number" value={supplierDocument.verified_by} disabled
                      className="w-full px-1.5 py-1 border rounded text-xs bg-gray-50 text-gray-600" />
                  </Field>
                )}
                {isEdit && supplierDocument.verified_at && (
                  <Field label="Verified At">
                    <input type="text" value={new Date(supplierDocument.verified_at).toLocaleString()} disabled
                      className="w-full px-1.5 py-1 border rounded text-xs bg-gray-50 text-gray-600" />
                  </Field>
                )}
                {form.verification_status === 'REJECTED' && (
                  <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                    <Field label="Rejection Reason" required error={validationErrors.rejection_reason}>
                      <textarea rows={2} value={form.rejection_reason} disabled={saveLoading}
                        onChange={e => handleChange('rejection_reason', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs" />
                    </Field>
                  </div>
                )}
                <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6">
                  <Field label="Verification Remarks">
                    <textarea rows={2} value={form.verification_remarks} disabled={saveLoading}
                      onChange={e => handleChange('verification_remarks', e.target.value)}
                      className="w-full px-1.5 py-1 border rounded text-xs" />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 5 · FLAGS & REMARKS */}
            <Section icon={AlertCircle} title="5 · Flags & Remarks">
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  <Toggle label="Is Active" checked={form.is_active} onChange={v => handleChange('is_active', v)} disabled={saveLoading} />
                </div>
                <Field label="Remarks">
                  <textarea rows={3} value={form.remarks} disabled={saveLoading}
                    onChange={e => handleChange('remarks', e.target.value)}
                    className="w-full px-1.5 py-1 border rounded text-xs" />
                </Field>
              </div>
            </Section>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end px-2.5 py-1 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {isEdit
              ? `Last updated: ${supplierDocument.updated_at || supplierDocument.updatedAt || '—'}`
              : 'New supplier document'}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <SupplierSelectionModal
          show={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          onSelect={handleSupplierSelect}
          selectedSupplierId={form.supplier_id || null}
          onlyActive={false}
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <SupplierDocumentSelectionModal
          show={showParentModal}
          onClose={() => setShowParentModal(false)}
          onSelect={handleParentSelect}
          selectedDocumentId={form.parent_document_id || null}
          excludeDocumentId={isEdit ? supplierDocument?.document_id : undefined}
          filterSupplierId={form.supplier_id || undefined}
          onlyActive
          quickSelect
        />
      </Suspense>
    </div>
  );
};

export default React.memo(SupplierDocumentModal);
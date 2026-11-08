import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  X, Save, PackageCheck, Boxes, ArrowLeftRight, Coins,
  RefreshCcw, ClipboardCheck, Tag, Truck, ShieldCheck,
  Send, Bell, Sliders, Hash, Eye, FileText, ChevronRight,
} from 'lucide-react';
import { stockPointSettingsAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const StockPointSelectionModal = lazy(() => import('../StockPoint/StockPointSelectionModal'));

const EMPTY = {
  receives_from_vendor: false, receives_from_parent: true, grn_requires_po: true,
  grn_over_delivery_tolerance_pct: 2, grn_under_delivery_tolerance_pct: 2, grn_price_variance_tolerance_pct: 1,
  negative_stock_allowed: false, consumption_relevant: false, backflush_enabled: false,
  issue_approval_required: false, issue_approval_value_threshold: 0, qc_hold_allowed: false,
  reservation_allowed: true, reservation_expiry_days: 30, partial_issue_allowed: true,
  return_allowed: true, return_window_days: 7, emergency_issue_override: false, emergency_issue_post_facto_days: 3,
  transfer_allowed_to: [], transfer_allowed_from: [], inter_store_transfer_dual_approval_value: 10000,
  transfer_requires_approval: false, max_qty_per_transfer: '', in_transit_aging_alert_days: 3,
  valuation_method: 'WEIGHTED_AVERAGE', revaluation_allowed: false, valuation_currency: 'INR',
  auto_replenishment_enabled: false, replenishment_source: 'BOTH', replenishment_run_time: '02:00',
  budget_check_required: false, budget_check_at_stage: 'PR_AND_STN', safety_stock_buffer_pct: 10, lead_time_consideration_days: 0,
  stock_count_frequency: 'MONTHLY', stock_count_method: 'SYSTEM_GUIDED', stock_variance_tolerance_pct: 1,
  stock_count_requires_approval: true, stock_count_freeze_store: true, cycle_count_abc_frequency: '{"A":30,"B":90,"C":180}',
  lot_control_enabled: false, serial_control_enabled: false, expiry_control_enabled: false,
  shelf_life_alert_days: 30, expiry_block_issue_days: 0, bin_tracking_enabled: false, fefo_enforced: false, fifo_enforced: false,
  min_suppliers_per_rfq: 3, supplier_rating_threshold: 0, supplier_blacklist_enforced: true,
  supplier_compliance_hold_enforced: true, preferred_supplier_auto_suggest: true,
  contract_price_auto_apply: true, rfq_auto_trigger_on_pr: true,
  mr_approval_required: true, pr_approval_required: true, po_approval_required: true,
  issue_approval_requires_dept_head: false, approval_sla_hours: 24, auto_escalate_on_sla_breach: true,
  issue_to_patient_enabled: false, issue_to_employee_enabled: false, issue_to_department_enabled: true,
  issue_requires_mr: true, auto_cost_center_debit: true,
  low_stock_alert_enabled: true, expiry_alert_enabled: true, replenishment_alert_emails: '',
  approval_pending_alert_enabled: true, daily_report_enabled: false, daily_report_time: '08:00',
  daily_report_recipients: '', alert_channels: 'EMAIL,IN_APP',
  allow_manual_stock_adjustment: true, stock_adjustment_approval_required: true, allow_stock_write_off: true,
  write_off_approval_threshold_value: 5000, allow_stock_revaluation: false,
  allow_bin_to_bin_transfer: true, allow_negative_reservation: false,
  mr_prefix: '', pr_prefix: '', po_prefix: '', grn_prefix: '', stn_prefix: '', rn_prefix: '',
  issue_prefix: '', return_prefix: '', adjustment_prefix: '', stock_count_prefix: '', rtv_prefix: '',
  remarks: '',
};

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const joinCsv = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');
const splitCsv = (str) => typeof str === 'string' ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

const toForm = (settings) => {
  if (!settings) return { ...EMPTY };
  return {
    ...EMPTY,
    ...settings,
    transfer_allowed_to: Array.isArray(settings.transfer_allowed_to) ? settings.transfer_allowed_to : [],
    transfer_allowed_from: Array.isArray(settings.transfer_allowed_from) ? settings.transfer_allowed_from : [],
    replenishment_alert_emails: joinCsv(settings.replenishment_alert_emails),
    daily_report_recipients: joinCsv(settings.daily_report_recipients),
    alert_channels: joinCsv(settings.alert_channels),
    cycle_count_abc_frequency: JSON.stringify(settings.cycle_count_abc_frequency || { A: 30, B: 90, C: 180 }),
    max_qty_per_transfer: settings.max_qty_per_transfer ?? '',
    remarks: settings.remarks ?? '',
  };
};

const toPayload = (form) => {
  const out = { ...form };
  const numericFields = [
    'grn_over_delivery_tolerance_pct', 'grn_under_delivery_tolerance_pct', 'grn_price_variance_tolerance_pct',
    'issue_approval_value_threshold', 'reservation_expiry_days', 'return_window_days', 'emergency_issue_post_facto_days',
    'inter_store_transfer_dual_approval_value', 'in_transit_aging_alert_days', 'safety_stock_buffer_pct',
    'lead_time_consideration_days', 'stock_variance_tolerance_pct', 'shelf_life_alert_days', 'expiry_block_issue_days',
    'min_suppliers_per_rfq', 'supplier_rating_threshold', 'approval_sla_hours', 'write_off_approval_threshold_value',
    'max_qty_per_transfer',
  ];
  for (const k of numericFields) out[k] = numOrNull(out[k]);

  // Ensure arrays are correctly formatted
  out.transfer_allowed_to = Array.isArray(out.transfer_allowed_to) ? out.transfer_allowed_to.map(Number).filter(Number.isInteger) : [];
  out.transfer_allowed_from = Array.isArray(out.transfer_allowed_from) ? out.transfer_allowed_from.map(Number).filter(Number.isInteger) : [];
  
  out.replenishment_alert_emails = splitCsv(out.replenishment_alert_emails);
  out.daily_report_recipients = splitCsv(out.daily_report_recipients);
  out.alert_channels = splitCsv(out.alert_channels).map(s => s.toUpperCase());

  try { out.cycle_count_abc_frequency = JSON.parse(out.cycle_count_abc_frequency); }
  catch { out.cycle_count_abc_frequency = { A: 30, B: 90, C: 180 }; }

  return out;
};

/* ---------- Shared compact styles ---------- */
const INPUT_CLS = 'w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-600';

const Field = ({ label, hint, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label className="text-[10px] font-medium text-gray-600 mb-0.5 block truncate" title={label}>
      {label}
      {hint && <span className="text-[8px] text-gray-400 ml-1">({hint})</span>}
    </label>
    {children}
  </div>
);

const Toggle = ({ label, hint, checked, onChange, disabled }) => (
  <label className={`flex items-center gap-1.5 text-[11px] text-gray-700 min-w-0 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`} title={label}>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      className="w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-1"
    />
    <span className="truncate">
      {label}
      {hint && <span className="text-[8px] text-gray-400 ml-1">({hint})</span>}
    </span>
  </label>
);

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border-b border-gray-200">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary-600" />}
      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">{title}</span>
    </div>
    <div className="p-2.5 flex-1">
      {children}
    </div>
  </div>
);

const StockPointSettingsModal = ({ show, stockPoint, onClose, onSaved, readOnly = false }) => {
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(null);
  const [hasExisting, setHasExisting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Multi-select stock point state
  const [showAllowedToModal, setShowAllowedToModal] = useState(false);
  const [showAllowedFromModal, setShowAllowedFromModal] = useState(false);
  const [selectedAllowedTo, setSelectedAllowedTo] = useState([]); // Array of stock point objects
  const [selectedAllowedFrom, setSelectedAllowedFrom] = useState([]);

  const isDisabled = saving || readOnly;

  useEffect(() => {
    if (!show || !stockPoint?.stock_po_id) {
      setApiError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setApiError(null);
        const res = await stockPointSettingsAPI.getByStockPoint(stockPoint.stock_po_id);
        const data = res.data?.data || {};
        if (cancelled) return;

        if (data.settings) {
          setForm(toForm(data.settings));
          setSettingsVersion(data.settings.settings_version ?? null);
          setHasExisting(true);
        } else {
          setForm({ ...EMPTY });
          setSettingsVersion(null);
          setHasExisting(false);
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(err.response?.data?.message || 'Failed to load settings');
          setForm({ ...EMPTY });
          setHasExisting(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [show, stockPoint]);

  // Load stock point names for the selected IDs
  useEffect(() => {
    if (!show) {
      setSelectedAllowedTo([]);
      setSelectedAllowedFrom([]);
      return;
    }
    
    // If we have IDs but no objects, we need to fetch them
    // For a real implementation, you'd fetch these in a batch
    // For now we just display the count if names aren't loaded
  }, [show, form.transfer_allowed_to, form.transfer_allowed_from]);

  const handleChange = useCallback((field, value) => {
    if (readOnly) return;
    setForm(prev => ({ ...prev, [field]: value }));
    if (apiError) setApiError(null);
  }, [apiError, readOnly]);

  const handleSave = useCallback(async () => {
    if (!stockPoint?.stock_po_id || readOnly) return;
    try {
      setSaving(true);
      setApiError(null);
      const payload = toPayload(form);
      await stockPointSettingsAPI.upsert(stockPoint.stock_po_id, payload);
      toast.success('Settings saved');
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [form, stockPoint, onSaved, readOnly]);

  const handleAllowedToSelect = useCallback((selectedItems) => {
    // selectedItems is an array from the multi-select modal
    const items = Array.isArray(selectedItems) ? selectedItems : [];
    setSelectedAllowedTo(items);
    setForm(prev => ({ ...prev, transfer_allowed_to: items.map(i => i.stock_po_id) }));
    setShowAllowedToModal(false);
  }, []);

  const handleAllowedFromSelect = useCallback((selectedItems) => {
    const items = Array.isArray(selectedItems) ? selectedItems : [];
    setSelectedAllowedFrom(items);
    setForm(prev => ({ ...prev, transfer_allowed_from: items.map(i => i.stock_po_id) }));
    setShowAllowedFromModal(false);
  }, []);

  const displayAllowedTo = useMemo(() => {
    const ids = form.transfer_allowed_to || [];
    if (ids.length === 0) return 'None (no restrictions)';
    if (selectedAllowedTo.length > 0 && selectedAllowedTo.length === ids.length) {
      return selectedAllowedTo.map(s => s.stock_point_code).join(', ');
    }
    return `${ids.length} selected`;
  }, [form.transfer_allowed_to, selectedAllowedTo]);

  const displayAllowedFrom = useMemo(() => {
    const ids = form.transfer_allowed_from || [];
    if (ids.length === 0) return 'None (no restrictions)';
    if (selectedAllowedFrom.length > 0 && selectedAllowedFrom.length === ids.length) {
      return selectedAllowedFrom.map(s => s.stock_point_code).join(', ');
    }
    return `${ids.length} selected`;
  }, [form.transfer_allowed_from, selectedAllowedFrom]);

  if (!show || !stockPoint) return null;

  const cardGrid = 'grid grid-cols-1 sm:grid-cols-2 gap-2';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-gray-100 rounded-md max-w-[1700px] w-full h-[94vh] flex flex-col shadow-xl">
        
        {/* HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between p-2.5 bg-white border-b">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly && <Eye className="w-4 h-4 text-blue-600" />}
              {readOnly ? 'View Stock Point Settings' : (hasExisting ? 'Edit Stock Point Settings' : 'Configure Stock Point Settings')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {stockPoint.stock_point_code} — {stockPoint.stock_point_name}
              {settingsVersion && (
                <span className="ml-2 text-[10px] text-gray-400">v{settingsVersion}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <button onClick={handleSave} disabled={saving || loading} className="px-3 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-xs text-gray-500">Loading settings...</div>
          ) : (
            <>
              {apiError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start justify-between mb-3">
                  <span className="text-sm text-red-700">{apiError}</span>
                  <button onClick={() => setApiError(null)}><X className="w-4 h-4 text-red-500" /></button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1 · RECEIVING */}
                <SectionCard icon={PackageCheck} title="1 · Receiving">
                  <div className={cardGrid}>
                    <Toggle label="From Vendor" checked={form.receives_from_vendor} onChange={v => handleChange('receives_from_vendor', v)} disabled={isDisabled} />
                    <Toggle label="From Parent" checked={form.receives_from_parent} onChange={v => handleChange('receives_from_parent', v)} disabled={isDisabled} />
                    <Toggle label="GRN Requires PO" checked={form.grn_requires_po} onChange={v => handleChange('grn_requires_po', v)} disabled={isDisabled} />
                    <Toggle label="QC Hold Allowed" checked={form.qc_hold_allowed} onChange={v => handleChange('qc_hold_allowed', v)} disabled={isDisabled} />
                    <Field label="Over-Delivery %">
                      <input type="number" step="0.01" value={form.grn_over_delivery_tolerance_pct} onChange={e => handleChange('grn_over_delivery_tolerance_pct', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Under-Delivery %">
                      <input type="number" step="0.01" value={form.grn_under_delivery_tolerance_pct} onChange={e => handleChange('grn_under_delivery_tolerance_pct', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Price Variance %" className="col-span-2">
                      <input type="number" step="0.01" value={form.grn_price_variance_tolerance_pct} onChange={e => handleChange('grn_price_variance_tolerance_pct', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                  </div>
                </SectionCard>

                {/* 2 · STOCK */}
                <SectionCard icon={Boxes} title="2 · Stock Behavior">
                  <div className={cardGrid}>
                    <Toggle label="Negative Stock" checked={form.negative_stock_allowed} onChange={v => handleChange('negative_stock_allowed', v)} disabled={isDisabled} />
                    <Toggle label="Consumption Relevant" checked={form.consumption_relevant} onChange={v => handleChange('consumption_relevant', v)} disabled={isDisabled} />
                    <Toggle label="Backflush" checked={form.backflush_enabled} onChange={v => handleChange('backflush_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Issue Approval Req" checked={form.issue_approval_required} onChange={v => handleChange('issue_approval_required', v)} disabled={isDisabled} />
                    <Field label="Approval Threshold">
                      <input type="number" step="0.01" value={form.issue_approval_value_threshold} onChange={e => handleChange('issue_approval_value_threshold', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Reservation Expiry (d)">
                      <input type="number" value={form.reservation_expiry_days} onChange={e => handleChange('reservation_expiry_days', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Reservation Allowed" checked={form.reservation_allowed} onChange={v => handleChange('reservation_allowed', v)} disabled={isDisabled} />
                    <Toggle label="Partial Issue" checked={form.partial_issue_allowed} onChange={v => handleChange('partial_issue_allowed', v)} disabled={isDisabled} />
                    <Toggle label="Return Allowed" checked={form.return_allowed} onChange={v => handleChange('return_allowed', v)} disabled={isDisabled} />
                    <Field label="Return Window (d)">
                      <input type="number" value={form.return_window_days} onChange={e => handleChange('return_window_days', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Emergency Override" checked={form.emergency_issue_override} onChange={v => handleChange('emergency_issue_override', v)} disabled={isDisabled} />
                    <Field label="Post-Facto Days">
                      <input type="number" value={form.emergency_issue_post_facto_days} onChange={e => handleChange('emergency_issue_post_facto_days', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                  </div>
                </SectionCard>

                {/* 3 · TRANSFER */}
                <SectionCard icon={ArrowLeftRight} title="3 · Transfer Rules">
                  <div className={cardGrid}>
                    <Field label="Allowed To (Stores)" className="col-span-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                          onClick={() => !isDisabled && setShowAllowedToModal(true)}
                        >
                          <span className={`truncate ${form.transfer_allowed_to.length > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                            {displayAllowedTo}
                          </span>
                          {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                        </div>
                        {form.transfer_allowed_to.length > 0 && !isDisabled && (
                          <button onClick={() => { handleChange('transfer_allowed_to', []); setSelectedAllowedTo([]); }} className="p-0.5 text-gray-400 hover:text-red-600" title="Clear">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </Field>
                    
                    <Field label="Allowed From (Stores)" className="col-span-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                          onClick={() => !isDisabled && setShowAllowedFromModal(true)}
                        >
                          <span className={`truncate ${form.transfer_allowed_from.length > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                            {displayAllowedFrom}
                          </span>
                          {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400" />}
                        </div>
                        {form.transfer_allowed_from.length > 0 && !isDisabled && (
                          <button onClick={() => { handleChange('transfer_allowed_from', []); setSelectedAllowedFrom([]); }} className="p-0.5 text-gray-400 hover:text-red-600" title="Clear">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </Field>

                    <Field label="Dual Approval Value">
                      <input type="number" step="0.01" value={form.inter_store_transfer_dual_approval_value} onChange={e => handleChange('inter_store_transfer_dual_approval_value', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Max Qty / Transfer">
                      <input type="number" step="0.01" value={form.max_qty_per_transfer} onChange={e => handleChange('max_qty_per_transfer', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="In-Transit Alert (d)">
                      <input type="number" value={form.in_transit_aging_alert_days} onChange={e => handleChange('in_transit_aging_alert_days', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Requires Approval" checked={form.transfer_requires_approval} onChange={v => handleChange('transfer_requires_approval', v)} disabled={isDisabled} />
                  </div>
                </SectionCard>

                {/* 4 · VALUATION */}
                <SectionCard icon={Coins} title="4 · Valuation">
                  <div className={cardGrid}>
                    <Field label="Method" className="col-span-2">
                      <select value={form.valuation_method} onChange={e => handleChange('valuation_method', e.target.value)} disabled={isDisabled} className={INPUT_CLS}>
                        <option value="FIFO">FIFO</option>
                        <option value="WEIGHTED_AVERAGE">Weighted Avg</option>
                        <option value="STANDARD_COST">Standard Cost</option>
                        <option value="LIFO">LIFO</option>
                      </select>
                    </Field>
                    <Field label="Currency">
                      <input type="text" maxLength={3} value={form.valuation_currency} onChange={e => handleChange('valuation_currency', e.target.value.toUpperCase())} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Toggle label="Revaluation Allowed" checked={form.revaluation_allowed} onChange={v => handleChange('revaluation_allowed', v)} disabled={isDisabled} />
                  </div>
                </SectionCard>

                {/* 5 · REPLENISHMENT */}
                <SectionCard icon={RefreshCcw} title="5 · Replenishment">
                  <div className={cardGrid}>
                    <Toggle label="Auto Replenish" checked={form.auto_replenishment_enabled} onChange={v => handleChange('auto_replenishment_enabled', v)} disabled={isDisabled} />
                    <Field label="Source">
                      <select value={form.replenishment_source} onChange={e => handleChange('replenishment_source', e.target.value)} disabled={isDisabled} className={INPUT_CLS}>
                        <option value="PARENT_STORE">Parent Store</option>
                        <option value="DIRECT_PR">Direct PR</option>
                        <option value="BOTH">Both</option>
                      </select>
                    </Field>
                    <Field label="Run Time">
                      <input type="text" value={form.replenishment_run_time} onChange={e => handleChange('replenishment_run_time', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Budget Check" checked={form.budget_check_required} onChange={v => handleChange('budget_check_required', v)} disabled={isDisabled} />
                    <Field label="Budget At">
                      <select value={form.budget_check_at_stage} onChange={e => handleChange('budget_check_at_stage', e.target.value)} disabled={isDisabled} className={INPUT_CLS}>
                        <option value="PR">PR</option>
                        <option value="STN">STN</option>
                        <option value="ISSUE">Issue</option>
                        <option value="PR_AND_STN">PR & STN</option>
                      </select>
                    </Field>
                    <Field label="Safety Stock %">
                      <input type="number" step="0.01" value={form.safety_stock_buffer_pct} onChange={e => handleChange('safety_stock_buffer_pct', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Lead Time (d)">
                      <input type="number" value={form.lead_time_consideration_days} onChange={e => handleChange('lead_time_consideration_days', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                  </div>
                </SectionCard>

                {/* 6 · STOCK COUNT */}
                <SectionCard icon={ClipboardCheck} title="6 · Stock Count">
                  <div className={cardGrid}>
                    <Field label="Frequency">
                      <select value={form.stock_count_frequency} onChange={e => handleChange('stock_count_frequency', e.target.value)} disabled={isDisabled} className={INPUT_CLS}>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                        <option value="ANNUAL">Annual</option>
                        <option value="NONE">None</option>
                      </select>
                    </Field>
                    <Field label="Method">
                      <select value={form.stock_count_method} onChange={e => handleChange('stock_count_method', e.target.value)} disabled={isDisabled} className={INPUT_CLS}>
                        <option value="BLIND">Blind</option>
                        <option value="SYSTEM_GUIDED">System Guided</option>
                        <option value="CYCLE">Cycle</option>
                      </select>
                    </Field>
                    <Field label="Variance Tol %">
                      <input type="number" step="0.01" value={form.stock_variance_tolerance_pct} onChange={e => handleChange('stock_variance_tolerance_pct', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Requires Approval" checked={form.stock_count_requires_approval} onChange={v => handleChange('stock_count_requires_approval', v)} disabled={isDisabled} />
                    <Toggle label="Freeze Store" checked={form.stock_count_freeze_store} onChange={v => handleChange('stock_count_freeze_store', v)} disabled={isDisabled} />
                    <Field label="ABC Frequency" hint='{"A":30,...}' className="col-span-2">
                      <input type="text" value={form.cycle_count_abc_frequency} onChange={e => handleChange('cycle_count_abc_frequency', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                  </div>
                </SectionCard>

                {/* 7 · TRACEABILITY */}
                <SectionCard icon={Tag} title="7 · Traceability">
                  <div className={cardGrid}>
                    <Toggle label="Lot Control" checked={form.lot_control_enabled} onChange={v => handleChange('lot_control_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Serial Control" checked={form.serial_control_enabled} onChange={v => handleChange('serial_control_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Expiry Control" checked={form.expiry_control_enabled} onChange={v => handleChange('expiry_control_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Bin Tracking" checked={form.bin_tracking_enabled} onChange={v => handleChange('bin_tracking_enabled', v)} disabled={isDisabled} />
                    <Toggle label="FEFO Enforced" checked={form.fefo_enforced} onChange={v => handleChange('fefo_enforced', v)} disabled={isDisabled} />
                    <Toggle label="FIFO Enforced" checked={form.fifo_enforced} onChange={v => handleChange('fifo_enforced', v)} disabled={isDisabled} />
                    <Field label="Shelf Life Alert (d)">
                      <input type="number" value={form.shelf_life_alert_days} onChange={e => handleChange('shelf_life_alert_days', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Expiry Block Issue (d)">
                      <input type="number" value={form.expiry_block_issue_days} onChange={e => handleChange('expiry_block_issue_days', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                  </div>
                </SectionCard>

                {/* 8 · SOURCING */}
                <SectionCard icon={Truck} title="8 · Sourcing">
                  <div className={cardGrid}>
                    <Field label="Min Suppliers / RFQ">
                      <input type="number" value={form.min_suppliers_per_rfq} onChange={e => handleChange('min_suppliers_per_rfq', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Rating Threshold">
                      <input type="number" step="0.01" min="0" max="5" value={form.supplier_rating_threshold} onChange={e => handleChange('supplier_rating_threshold', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Blacklist Enforced" checked={form.supplier_blacklist_enforced} onChange={v => handleChange('supplier_blacklist_enforced', v)} disabled={isDisabled} />
                    <Toggle label="Compliance Hold" checked={form.supplier_compliance_hold_enforced} onChange={v => handleChange('supplier_compliance_hold_enforced', v)} disabled={isDisabled} />
                    <Toggle label="Preferred Auto" checked={form.preferred_supplier_auto_suggest} onChange={v => handleChange('preferred_supplier_auto_suggest', v)} disabled={isDisabled} />
                    <Toggle label="Contract Auto Apply" checked={form.contract_price_auto_apply} onChange={v => handleChange('contract_price_auto_apply', v)} disabled={isDisabled} />
                    <Toggle label="RFQ Auto On PR" checked={form.rfq_auto_trigger_on_pr} onChange={v => handleChange('rfq_auto_trigger_on_pr', v)} disabled={isDisabled} />
                  </div>
                </SectionCard>

                {/* 9
                // src/modules/StockPoints/StockPointSettingsModal.jsx  (continued)
                {/* 9 · APPROVAL */}
                <SectionCard icon={ShieldCheck} title="9 · Approval Rules">
                  <div className={cardGrid}>
                    <Toggle label="MR Approval" checked={form.mr_approval_required} onChange={v => handleChange('mr_approval_required', v)} disabled={isDisabled} />
                    <Toggle label="PR Approval" checked={form.pr_approval_required} onChange={v => handleChange('pr_approval_required', v)} disabled={isDisabled} />
                    <Toggle label="PO Approval" checked={form.po_approval_required} onChange={v => handleChange('po_approval_required', v)} disabled={isDisabled} />
                    <Toggle label="Dept Head Req." checked={form.issue_approval_requires_dept_head} onChange={v => handleChange('issue_approval_requires_dept_head', v)} disabled={isDisabled} />
                    <Field label="SLA (hours)">
                      <input type="number" value={form.approval_sla_hours} onChange={e => handleChange('approval_sla_hours', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Auto Escalate SLA" checked={form.auto_escalate_on_sla_breach} onChange={v => handleChange('auto_escalate_on_sla_breach', v)} disabled={isDisabled} />
                  </div>
                </SectionCard>

                {/* 10 · ISSUE */}
                <SectionCard icon={Send} title="10 · Issue / Consumption">
                  <div className={cardGrid}>
                    <Toggle label="To Patient" checked={form.issue_to_patient_enabled} onChange={v => handleChange('issue_to_patient_enabled', v)} disabled={isDisabled} />
                    <Toggle label="To Employee" checked={form.issue_to_employee_enabled} onChange={v => handleChange('issue_to_employee_enabled', v)} disabled={isDisabled} />
                    <Toggle label="To Department" checked={form.issue_to_department_enabled} onChange={v => handleChange('issue_to_department_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Requires MR" checked={form.issue_requires_mr} onChange={v => handleChange('issue_requires_mr', v)} disabled={isDisabled} />
                    <Toggle label="Auto Cost Ctr Debit" checked={form.auto_cost_center_debit} onChange={v => handleChange('auto_cost_center_debit', v)} disabled={isDisabled} />
                  </div>
                </SectionCard>

                {/* 11 · NOTIFICATIONS */}
                <SectionCard icon={Bell} title="11 · Notifications">
                  <div className={cardGrid}>
                    <Toggle label="Low Stock Alert" checked={form.low_stock_alert_enabled} onChange={v => handleChange('low_stock_alert_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Expiry Alert" checked={form.expiry_alert_enabled} onChange={v => handleChange('expiry_alert_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Approval Pending" checked={form.approval_pending_alert_enabled} onChange={v => handleChange('approval_pending_alert_enabled', v)} disabled={isDisabled} />
                    <Toggle label="Daily Report" checked={form.daily_report_enabled} onChange={v => handleChange('daily_report_enabled', v)} disabled={isDisabled} />
                    <Field label="Report Time">
                      <input type="text" value={form.daily_report_time} onChange={e => handleChange('daily_report_time', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Alert Emails (CSV)" className="col-span-2">
                      <input type="text" value={form.replenishment_alert_emails} onChange={e => handleChange('replenishment_alert_emails', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Report Recipients" className="col-span-2">
                      <input type="text" value={form.daily_report_recipients} onChange={e => handleChange('daily_report_recipients', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Field label="Alert Channels" className="col-span-2">
                      <input type="text" value={form.alert_channels} onChange={e => handleChange('alert_channels', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                  </div>
                </SectionCard>

                {/* 12 · CONTROLS */}
                <SectionCard icon={Sliders} title="12 · Operational Controls">
                  <div className={cardGrid}>
                    <Toggle label="Manual Adjustments" checked={form.allow_manual_stock_adjustment} onChange={v => handleChange('allow_manual_stock_adjustment', v)} disabled={isDisabled} />
                    <Toggle label="Adjustment Approval" checked={form.stock_adjustment_approval_required} onChange={v => handleChange('stock_adjustment_approval_required', v)} disabled={isDisabled} />
                    <Toggle label="Allow Write-Off" checked={form.allow_stock_write_off} onChange={v => handleChange('allow_stock_write_off', v)} disabled={isDisabled} />
                    <Field label="Write-Off Above">
                      <input type="number" step="0.01" value={form.write_off_approval_threshold_value} onChange={e => handleChange('write_off_approval_threshold_value', e.target.value)} disabled={isDisabled} className={INPUT_CLS} />
                    </Field>
                    <Toggle label="Allow Revaluation" checked={form.allow_stock_revaluation} onChange={v => handleChange('allow_stock_revaluation', v)} disabled={isDisabled} />
                    <Toggle label="Bin-to-Bin Transfer" checked={form.allow_bin_to_bin_transfer} onChange={v => handleChange('allow_bin_to_bin_transfer', v)} disabled={isDisabled} />
                    <Toggle label="Negative Reservation" checked={form.allow_negative_reservation} onChange={v => handleChange('allow_negative_reservation', v)} disabled={isDisabled} />
                  </div>
                </SectionCard>

                {/* 13 · PREFIXES */}
                <SectionCard icon={Hash} title="13 · Document Prefixes">
                  <div className={cardGrid}>
                    <Field label="MR Prefix">
                      <input type="text" maxLength={10} value={form.mr_prefix} onChange={e => handleChange('mr_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="PR Prefix">
                      <input type="text" maxLength={10} value={form.pr_prefix} onChange={e => handleChange('pr_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="PO Prefix">
                      <input type="text" maxLength={10} value={form.po_prefix} onChange={e => handleChange('po_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="GRN Prefix">
                      <input type="text" maxLength={10} value={form.grn_prefix} onChange={e => handleChange('grn_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="STN Prefix">
                      <input type="text" maxLength={10} value={form.stn_prefix} onChange={e => handleChange('stn_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="RN Prefix">
                      <input type="text" maxLength={10} value={form.rn_prefix} onChange={e => handleChange('rn_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="Issue Prefix">
                      <input type="text" maxLength={10} value={form.issue_prefix} onChange={e => handleChange('issue_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="Return Prefix">
                      <input type="text" maxLength={10} value={form.return_prefix} onChange={e => handleChange('return_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="Adjustment Prefix">
                      <input type="text" maxLength={10} value={form.adjustment_prefix} onChange={e => handleChange('adjustment_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="Stock Count Prefix">
                      <input type="text" maxLength={10} value={form.stock_count_prefix} onChange={e => handleChange('stock_count_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                    <Field label="RTV Prefix">
                      <input type="text" maxLength={10} value={form.rtv_prefix} onChange={e => handleChange('rtv_prefix', e.target.value)} disabled={isDisabled} className={`${INPUT_CLS} font-mono`} />
                    </Field>
                  </div>
                </SectionCard>

                {/* 14 · REMARKS */}
                <SectionCard icon={FileText} title="14 · Remarks">
                  <div className="min-w-0">
                    <textarea
                      rows={6}
                      value={form.remarks}
                      onChange={e => handleChange('remarks', e.target.value)}
                      disabled={isDisabled}
                      placeholder="Any internal notes about these settings..."
                      className={`${INPUT_CLS} resize-y`}
                    />
                  </div>
                </SectionCard>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex items-center justify-end px-2.5 py-1.5 border-t bg-white">
          <p className="text-[10px] text-gray-500">
            {hasExisting
              ? `Editing existing settings (v${settingsVersion || '—'})`
              : 'First save will create settings for this stock point'}
          </p>
        </div>
      </div>

      {/* --- PICKERS --- */}
      <Suspense fallback={null}>
        <StockPointSelectionModal
          show={showAllowedToModal}
          onClose={() => setShowAllowedToModal(false)}
          onSelect={handleAllowedToSelect}
          selectedStockPointIds={form.transfer_allowed_to || []}
          excludeStockPointId={stockPoint?.stock_po_id}
          multiple
          quickSelect={false}
        />
      </Suspense>

      <Suspense fallback={null}>
        <StockPointSelectionModal
          show={showAllowedFromModal}
          onClose={() => setShowAllowedFromModal(false)}
          onSelect={handleAllowedFromSelect}
          selectedStockPointIds={form.transfer_allowed_from || []}
          excludeStockPointId={stockPoint?.stock_po_id}
          multiple
          quickSelect={false}
        />
      </Suspense>
    </div>
  );
};

export default React.memo(StockPointSettingsModal);
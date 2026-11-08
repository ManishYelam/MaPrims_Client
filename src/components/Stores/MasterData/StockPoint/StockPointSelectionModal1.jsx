import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Store } from 'lucide-react';

const resolveId = (sp, index) =>
  sp?.id ?? sp?._id ?? sp?.stock_po_id ?? sp?.stock_point_id ?? sp?.stockPointId ?? `sp-${index}`;

const resolveLabel = (sp, index) => {
  const name = sp?.name ?? sp?.stock_point_name ?? sp?.stockPointName;
  const code = sp?.code ?? sp?.stock_point_code ?? sp?.stockPointCode;
  if (name && code) return `${name} (${code})`;
  if (name) return name;
  if (code) return code;
  return `Stock Point ${index + 1}`;
};

const StockPointSelectionModal = ({
  open,
  stockPoints = [],
  onConfirm,
  onCancel,
  cancellable = true,
  title = 'Select Stock Point',
  confirmLabel = 'Continue',
  currentId,
}) => {
  const [selectedId, setSelectedId] = useState('');
  const [touched, setTouched] = useState(false);
  const selectRef = useRef(null);

  const options = useMemo(
    () =>
      stockPoints.map((sp, i) => ({
        key: String(resolveId(sp, i)),
        value: String(resolveId(sp, i)),
        label: resolveLabel(sp, i),
        raw: sp,
      })),
    [stockPoints]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedId(currentId != null ? String(currentId) : '');
    setTouched(false);
    const t = setTimeout(() => selectRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, currentId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open || !cancellable) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, cancellable, onCancel]);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === selectedId),
    [options, selectedId]
  );

  const handleConfirm = useCallback(() => {
    setTouched(true);
    if (!selectedOption) return;
    onConfirm?.(selectedOption.raw);
  }, [selectedOption, onConfirm]);

  const handleBackdrop = useCallback(
    (e) => {
      if (e.target === e.currentTarget && cancellable) onCancel?.();
    },
    [cancellable, onCancel]
  );

  if (!open) return null;

  const invalid = touched && !selectedOption;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-sm w-full flex flex-col shadow-xl">
        {/* Header — compact */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <div>
            <h2 className="text-xs font-semibold text-gray-900">{title}</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Choose the stock point to work with
            </p>
          </div>
          {cancellable && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-0.5"
              aria-label="Close"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Body — compact */}
        <div className="px-3 py-2">
          <label
            htmlFor="sp-select"
            className="block text-[11px] font-medium text-gray-700 mb-1"
          >
            Stock Point <span className="text-red-500">*</span>
          </label>

          <select
            id="sp-select"
            ref={selectRef}
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setTouched(true); }}
            className={`w-full px-2 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
              invalid ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">— Select a stock point —</option>
            {options.map((opt) => (
              <option key={opt.key} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {invalid && (
            <p className="mt-1 text-[10px] text-red-600">
              Please select a stock point to continue.
            </p>
          )}

          {options.length === 0 && (
            <p className="mt-1 text-[10px] text-gray-500">
              No stock points available for your account.
            </p>
          )}
        </div>

        {/* Footer — compact */}
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-gray-600 truncate pr-2">
              {selectedOption ? (
                <span>
                  Selected:{' '}
                  <span className="font-medium">{selectedOption.label}</span>
                </span>
              ) : (
                <span>No stock point selected</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedOption}
              className={`px-2.5 py-1 text-[11px] font-medium text-white rounded flex-shrink-0 ${
                selectedOption
                  ? 'bg-primary-600 hover:bg-primary-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockPointSelectionModal;
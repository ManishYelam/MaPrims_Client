import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
} from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react';
import { genericAPI } from '../../services/api';
import { buildYupSchema, deriveColumns } from './importValidator';

const CheckCircle = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// 🚀 Memoized Row Component – only re-renders when its data or errors change
const ImportRow = memo(
  ({
    row,
    columns,
    allowAddDelete,
    selectedIds,
    toggleSelect,
    editingCell,
    startEdit,
    inputRef,
    handleKeyDown,
    saveEdit,
    setEditingCell,
    errorsMap,
  }) => {
    const rowErrors = errorsMap.get(row.__rowId) || {};
    const hasError = Object.keys(rowErrors).length > 0;

    return (
      <tr
        data-rowid={row.__rowId}
        className={`hover:bg-gray-50 ${hasError ? 'bg-red-50' : ''}`}
      >
        {allowAddDelete && (
          <td className="border p-1 text-center">
            <input
              type="checkbox"
              checked={selectedIds.has(row.__rowId)}
              onChange={() => toggleSelect(row.__rowId)}
              className="w-3 h-3"
            />
          </td>
        )}
        {columns.map((col) => {
          const value = row[col.field] ?? '';
          const isEditing =
            editingCell?.rowId === row.__rowId &&
            editingCell.field === col.field;
          const errorMsg = rowErrors[col.field];
          return (
            <td
              key={col.field}
              className={`border p-0.5 relative ${
                errorMsg ? 'bg-red-200' : ''
              }`}
              title={errorMsg || ''}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingCell.value}
                  onChange={(e) =>
                    setEditingCell((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  onKeyDown={handleKeyDown}
                  onBlur={saveEdit}
                  className="w-full p-0.5 bg-transparent border-none focus:outline-none focus:ring-0 text-xs"
                  autoFocus
                />
              ) : (
                <div
                  className={`p-0.5 cursor-text flex items-center justify-between ${
                    errorMsg ? 'text-red-900 font-medium' : ''
                  }`}
                  onClick={() => startEdit(row.__rowId, col.field, value)}
                >
                  <span className="truncate">{value}</span>
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  }
);
ImportRow.displayName = 'ImportRow';

const ImportGrid = ({
  moduleName,
  initialData,
  onImport,
  onCancel,
  allowAddDelete = true,
  importError = null,
}) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [gridData, setGridData] = useState(() =>
    initialData.map((row, idx) => ({
      ...row,
      __rowId: `row_${idx}_${Date.now()}_${Math.random()}`,
    }))
  );
  const [errorsMap, setErrorsMap] = useState(new Map());
  const [filter, setFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [backendErrors, setBackendErrors] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  const [errorNavIndex, setErrorNavIndex] = useState(-1);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const inputRef = useRef(null);
  const prevInitialDataRef = useRef(initialData);

  // --- Fetch config ---
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const response = await genericAPI.getImportConfig(moduleName);
        const { data } = response.data;
        setConfig(data);
        setFetchError(null);
      } catch (err) {
        setFetchError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    }
    if (moduleName) fetchConfig();
  }, [moduleName]);

  // --- Derive columns & schema ---
  const columns = useMemo(() => {
    if (!config?.validationRules) return [];
    return deriveColumns(config.validationRules);
  }, [config]);

  const schema = useMemo(() => {
    if (!config?.validationRules) return null;
    return buildYupSchema(config.validationRules);
  }, [config]);

  // --- Sync gridData when initialData changes (e.g., CSV upload) ---
  useEffect(() => {
    if (initialData !== prevInitialDataRef.current) {
      const newData = initialData.map((row, idx) => ({
        ...row,
        __rowId: `row_${idx}_${Date.now()}_${Math.random()}`,
      }));
      setGridData(newData);
      setSelectedIds(new Set());
      setBackendErrors(null);
      setWarningMessage(null);
      setSuccessMessage(null);
      setErrorNavIndex(-1);
      prevInitialDataRef.current = initialData;
    }
  }, [initialData]);

  // --- Validate all rows when schema or gridData changes ---
  useEffect(() => {
    if (!schema) return;
    const newErrors = new Map();
    gridData.forEach((row) => {
      try {
        schema.validateSync(row, { abortEarly: false });
      } catch (err) {
        if (err.inner && err.inner.length) {
          const rowErrors = {};
          err.inner.forEach((e) => {
            if (e.path) rowErrors[e.path] = e.message;
          });
          if (Object.keys(rowErrors).length) {
            newErrors.set(row.__rowId, rowErrors);
          }
        } else {
          newErrors.set(row.__rowId, { _error: err.message });
        }
      }
    });
    setErrorsMap(newErrors);
  }, [gridData, schema]);

  // --- Memoized derived stats ---
  const totalRows = gridData.length;
  const invalidRows = errorsMap.size;
  const validRows = totalRows - invalidRows;
  const totalErrors = useMemo(
    () =>
      Array.from(errorsMap.values()).reduce(
        (sum, errors) => sum + Object.keys(errors).length,
        0
      ),
    [errorsMap]
  );
  const errorRowIds = useMemo(() => Array.from(errorsMap.keys()), [errorsMap]);

  const filteredData = useMemo(() => {
    if (filter === 'all') return gridData;
    if (filter === 'valid')
      return gridData.filter((row) => !errorsMap.has(row.__rowId));
    return gridData.filter((row) => errorsMap.has(row.__rowId));
  }, [gridData, errorsMap, filter]);

  // --- Handlers (memoized) ---
  const startEdit = useCallback((rowId, field, value) => {
    setEditingCell({ rowId, field, value });
    setTimeout(() => inputRef.current?.focus(), 10);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    const { rowId, field, value } = editingCell;
    setGridData((prev) =>
      prev.map((row) =>
        row.__rowId === rowId ? { ...row, [field]: value } : row
      )
    );
    setEditingCell(null);
    setBackendErrors(null);
  }, [editingCell]);

  const cancelEdit = useCallback(() => setEditingCell(null), []);
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') cancelEdit();
    },
    [saveEdit, cancelEdit]
  );

  const addRow = useCallback(() => {
    const row = { __rowId: `row_${Date.now()}_${Math.random()}` };
    columns.forEach((col) => {
      row[col.field] = col.defaultValue ?? '';
    });
    setGridData((prev) => [...prev, row]);
  }, [columns]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === filteredData.length
        ? new Set()
        : new Set(filteredData.map((row) => row.__rowId))
    );
  }, [filteredData]);

  const deleteSelected = useCallback(() => {
    if (!selectedIds.size) return;
    setGridData((prev) =>
      prev.filter((row) => !selectedIds.has(row.__rowId))
    );
    setErrorsMap((prev) => {
      const newMap = new Map(prev);
      selectedIds.forEach((id) => newMap.delete(id));
      return newMap;
    });
    setSelectedIds(new Set());
    setErrorNavIndex(-1);
  }, [selectedIds]);

  const goToError = useCallback(
    (index) => {
      if (!errorRowIds.length) return;
      const safe =
        ((index % errorRowIds.length) + errorRowIds.length) %
        errorRowIds.length;
      const target = errorRowIds[safe];
      document
        .querySelector(`[data-rowid="${target}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setErrorNavIndex(safe);
    },
    [errorRowIds]
  );

  const handleImport = useCallback(async () => {
    if (errorsMap.size || !gridData.length) return;
    const clean = gridData.map(({ __rowId, ...rest }) => rest);
    try {
      setImporting(true);
      setBackendErrors(null);
      setWarningMessage(null);
      const result = await onImport(clean);

      if (result.success && result.skipped === 0 && result.failed === 0) {
        setSuccessMessage(
          `Imported ${clean.length} ${moduleName.toLowerCase()}.`
        );
        setTimeout(() => setSuccessMessage(null), 1500);
      } else if (result.success && result.skipped > 0 && result.failed === 0) {
        const skippedDetails =
          result.errors?.filter((e) => e.error?.includes('Duplicate')) || [];
        const msg = `${result.created} created, ${result.skipped} skipped (duplicates).`;
        setWarningMessage({ message: msg, details: skippedDetails });
      } else if (result.failed > 0) {
        const newMap = new Map(errorsMap);
        result.errors?.forEach((err) => {
          const rowIndex = err.row - 1;
          const row = gridData[rowIndex];
          if (row) {
            const rowErr = newMap.get(row.__rowId) || {};
            const field = err.field || '_error';
            rowErr[field] = err.error;
            newMap.set(row.__rowId, rowErr);
          }
        });
        setErrorsMap(newMap);
        setBackendErrors(
          result.message ||
            'Server validation failed. Fix highlighted fields.'
        );
      } else {
        setBackendErrors(result.message || 'Import failed.');
      }
    } catch (err) {
      setBackendErrors(err.message || 'Network error.');
    } finally {
      setImporting(false);
    }
  }, [errorsMap, gridData, onImport, moduleName]);

  // --- Render states ---
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center text-gray-500 text-xs">
        Loading configuration...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center text-red-500 text-xs">
        Error: {fetchError}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {importError && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-1.5 text-red-700 text-xs flex items-center gap-1.5 flex-shrink-0">
          <AlertCircle size={14} />
          <span>File error: {importError}</span>
        </div>
      )}

      {warningMessage && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-3 py-1.5 text-yellow-800 text-xs flex items-start gap-1.5 flex-shrink-0">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">{warningMessage.message}</span>
            {warningMessage.details?.length > 0 && (
              <div className="mt-0.5 text-[10px] text-yellow-700">
                {warningMessage.details.map((err, idx) => (
                  <div key={idx}>Row {err.row}: {err.error}</div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="ml-auto text-yellow-700 hover:text-yellow-900"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-gray-50 border-b px-3 py-1.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 text-xs">
          <span>
            Rows: <strong>{totalRows}</strong>
          </span>
          <span className="text-green-600">
            Valid: <strong>{validRows}</strong>
          </span>
          <span className="text-red-600">
            Invalid: <strong>{invalidRows}</strong>
          </span>
          <span className="text-red-600">
            Errors: <strong>{totalErrors}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-1.5 py-0.5 text-xs bg-white"
          >
            <option value="all">All</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
          </select>
          {allowAddDelete && (
            <>
              <button
                onClick={addRow}
                className="px-2 py-0.5 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600 flex items-center gap-0.5"
              >
                <Plus size={12} /> Add
              </button>
              <button
                onClick={deleteSelected}
                disabled={!selectedIds.size}
                className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] hover:bg-red-600 disabled:opacity-50 flex items-center gap-0.5"
              >
                <Trash2 size={12} /> Del
              </button>
            </>
          )}
          <div className="flex items-center gap-0.5 border rounded overflow-hidden">
            <button
              onClick={() => goToError(0)}
              disabled={!errorRowIds.length}
              className="px-1.5 py-0.5 text-[10px] bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              <AlertCircle size={12} />
            </button>
            <button
              onClick={() => goToError(errorNavIndex - 1)}
              disabled={!errorRowIds.length}
              className="px-1 py-0.5 hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowLeft size={12} />
            </button>
            <button
              onClick={() => goToError(errorNavIndex + 1)}
              disabled={!errorRowIds.length}
              className="px-1 py-0.5 hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {backendErrors && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-1.5 text-red-700 text-xs flex items-center gap-1.5 flex-shrink-0">
          <AlertCircle size={14} />
          <span>{backendErrors}</span>
          <button
            onClick={() => setBackendErrors(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-b border-green-200 px-3 py-1.5 text-green-700 text-xs flex items-center gap-1.5 flex-shrink-0">
          <CheckCircle size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full border-collapse text-xs min-w-max">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {allowAddDelete && (
                <th className="border p-1 w-6 bg-gray-100">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredData.length &&
                      filteredData.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-3 h-3"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.field}
                  className="border p-1 text-left font-medium whitespace-nowrap bg-gray-100"
                >
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <ImportRow
                key={row.__rowId}
                row={row}
                columns={columns}
                allowAddDelete={allowAddDelete}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                editingCell={editingCell}
                startEdit={startEdit}
                inputRef={inputRef}
                handleKeyDown={handleKeyDown}
                saveEdit={saveEdit}
                setEditingCell={setEditingCell}
                errorsMap={errorsMap}
              />
            ))}
            {!filteredData.length && (
              <tr>
                <td
                  colSpan={columns.length + (allowAddDelete ? 1 : 0)}
                  className="text-center py-4 text-gray-500 text-xs"
                >
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t px-3 py-1.5 flex justify-between items-center flex-shrink-0 bg-white">
        <button
          onClick={onCancel}
          className="px-3 py-1 border rounded text-xs hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={errorsMap.size > 0 || !gridData.length || importing}
          className={`px-3 py-1 rounded text-xs font-medium ${
            errorsMap.size > 0 || !gridData.length || importing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {importing ? 'Importing...' : `Import ${gridData.length} Recs`}
        </button>
      </div>
    </div>
  );
};

export default ImportGrid;
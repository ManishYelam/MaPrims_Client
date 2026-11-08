import React, {
  useState, useEffect, useCallback, useMemo, memo, lazy, Suspense,
} from 'react';
import {
  X, Save, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { stockPointsAPI, hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';
import DepartmentSelectionModal from '../../../hr/Departments/DepartmentSelectionModal';

const StockPointSelectionModal = lazy(() =>
  import('./StockPointSelectionModal')
);

const MODE = { DEPT_WISE: 'dept', STOCK_WISE: 'stock' };
const FILTER = { ALL: 'all', PENDING: 'pending', MAPPED: 'mapped' };
const DEFAULT_LIMIT = 10;
const LIMIT_OPTIONS = [5, 10, 15, 25, 50];

const unwrap = (res) => res?.data ?? res;

const pickArray = (body, ...keys) => {
  for (const k of keys) {
    const v = k.split('.').reduce((o, p) => (o == null ? o : o[p]), body);
    if (Array.isArray(v)) return v;
  }
  return [];
};

const getDeptId = (d) => (d ? d.dept_id ?? d.department_id ?? d.id ?? '' : '');

const displayDepartment = (d) => {
  if (!d) return 'Select a department...';
  if (d.displayText) return d.displayText;
  if (d.display_text) return d.display_text;
  if (d.label) return d.label;

  const code = d.code || d.dept_code || '';
  const name = d.name || d.dept_name || '';
  if (code && name) return `${code} (${name})`;
  return name || code || `ID: ${getDeptId(d)}`;
};

const buildStockPointDisplayText = (sp) => {
  if (!sp) return '';
  if (sp.displayText) return sp.displayText;
  if (sp.display_text) return sp.display_text;
  if (sp.label) return sp.label;

  const code = sp.stock_point_code || '';
  const name = sp.stock_point_name || '';
  const type = sp.stock_point_type || '';
  const category = sp.stock_point_category || '';
  const level = sp.stock_point_level;
  const city = sp.city || '';
  const state = sp.state || '';
  const nature = sp.stock_point_nature;

  const head =
    code && name
      ? `${code} (${name})`
      : code || name || `ID: ${sp.stock_po_id}`;

  const classifyParts = [];
  if (type && category) classifyParts.push(`${type}/${category}`);
  else if (type) classifyParts.push(type);
  else if (category) classifyParts.push(category);
  if (level != null) classifyParts.push(`L${level}`);
  const classify = classifyParts.join(' — ');

  const loc = [city, state].filter(Boolean).join(', ');

  const extras = [];
  if (nature && nature !== 'PHYSICAL') extras.push(nature);
  if (sp.is_locked) extras.push('Locked');
  if (sp.is_active === false) extras.push('Inactive');

  return [head, classify, loc, ...extras]
    .filter(Boolean)
    .join(' — ')
    .replace(/\s+—\s+—\s+/g, ' — ');
};

const displayStockPoint = (sp) =>
  sp ? buildStockPointDisplayText(sp) : 'Select a stock point...';

const buildStockPointTooltip = (sp) => {
  if (!sp) return '';
  const lines = [];
  lines.push(`${sp.stock_point_code || '-'} — ${sp.stock_point_name || '-'}`);
  if (sp.stock_point_type) lines.push(`Type: ${sp.stock_point_type}`);
  if (sp.stock_point_category) lines.push(`Category: ${sp.stock_point_category}`);
  if (sp.stock_point_level != null) lines.push(`Level: ${sp.stock_point_level}`);
  if (sp.stock_point_nature) lines.push(`Nature: ${sp.stock_point_nature}`);
  if (sp.location_name) lines.push(`Location: ${sp.location_name}`);
  const addr = [
    sp.address_line1, sp.address_line2, sp.address_line3,
    sp.city, sp.state, sp.pincode, sp.country,
  ].filter(Boolean).join(', ');
  if (addr) lines.push(`Address: ${addr}`);
  if (sp.contact_person_name) lines.push(`Contact: ${sp.contact_person_name}`);
  if (sp.contact_phone) lines.push(`Phone: ${sp.contact_phone}`);
  if (sp.contact_email) lines.push(`Email: ${sp.contact_email}`);
  if (sp.gst_number) lines.push(`GST: ${sp.gst_number}`);
  if (sp.currency) lines.push(`Currency: ${sp.currency}`);
  if (sp.valuation_method) lines.push(`Valuation: ${sp.valuation_method}`);
  if (sp.operating_hours_start && sp.operating_hours_end)
    lines.push(`Hours: ${sp.operating_hours_start}–${sp.operating_hours_end}`);
  if (Array.isArray(sp.operating_days) && sp.operating_days.length)
    lines.push(`Days: ${sp.operating_days.join(',')}`);
  if (sp.is_active === false) lines.push('Status: Inactive');
  if (sp.is_locked) lines.push('Status: Locked');
  return lines.join('\n');
};

const cleanFilters = (obj) => {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') out[k] = String(v).trim();
  });
  return out;
};

const PaginationBar = ({
  page, limit, total, totalPages, onPageChange, onLimitChange, label,
}) => {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pageNumbers = () => {
    const arr = [];
    const win = 5;
    if (totalPages <= win) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= win; i++) arr.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - win + 1; i <= totalPages; i++) arr.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) arr.push(i);
    }
    return arr;
  };

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white">
      <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-1.5 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-600 flex-wrap">
          <span>Showing</span>
          <span className="font-medium">{from}</span>
          <span>to</span>
          <span className="font-medium">{to}</span>
          <span>of</span>
          <span className="font-medium">{total}</span>
          <span className="text-gray-400">·</span>
          <span>{label}</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="ml-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 bg-white"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-0.5">
          <button onClick={() => onPageChange(1)} disabled={page === 1}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronsLeft className="w-3 h-3" />
          </button>
          <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronLeft className="w-3 h-3" />
          </button>
          {pageNumbers().map((p) => (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-6 h-6 text-xs rounded border transition-colors ${
                page === p
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronRight className="w-3 h-3" />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronsRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

const HeaderFilterInput = ({ value, onChange, placeholder, disabled }) => (
  <input
    type="text"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-1 py-0.5 border border-gray-200 rounded text-[10px] focus:ring-1 focus:ring-primary-400 focus:border-primary-400 disabled:bg-gray-50"
  />
);

const MapToDepartmentModal = ({ show, onClose, onSaved }) => {
  const [mode, setMode] = useState(MODE.DEPT_WISE);
  const [filterModeDeptWise, setFilterModeDeptWise] = useState(FILTER.ALL);
  const [filterModeStockWise, setFilterModeStockWise] = useState(FILTER.ALL);

  const [deptId, setDeptId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedStockPoints, setSelectedStockPoints] = useState([]);
  const [mappedStockPoints, setMappedStockPoints] = useState([]);
  const [showDeptPicker, setShowDeptPicker] = useState(false);

  const [stockPointId, setStockPointId] = useState('');
  const [selectedStockPoint, setSelectedStockPoint] = useState(null);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [showStockPointPicker, setShowStockPointPicker] = useState(false);

  const [available, setAvailable] = useState([]);
  const [stockPointDepartments, setStockPointDepartments] = useState([]);

  const [spFilters, setSpFilters] = useState({});
  const [dFilters, setDFilters] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [spPage, setSpPage] = useState(1);
  const [spLimit, setSpLimit] = useState(DEFAULT_LIMIT);
  const [spTotal, setSpTotal] = useState(0);
  const [spTotalPages, setSpTotalPages] = useState(1);

  const [dPage, setDPage] = useState(1);
  const [dLimit, setDLimit] = useState(DEFAULT_LIMIT);

  const fetchAvailable = useCallback(async (filtersOverride) => {
    const filters = filtersOverride ?? spFilters;
    try {
      setLoading(true);
      const clean = cleanFilters(filters);
      const res = await stockPointsAPI.getAllStockPoints({
        page: spPage,
        limit: spLimit,
        search: '',
        searchFields: [],
        ...clean,
      });
      const body = unwrap(res);
      const list = pickArray(body, 'stockPoints', 'data.stockPoints', 'data');
      const pagination = body?.pagination ?? body?.data?.pagination ?? {};

      setAvailable(list.filter((sp) => sp?.is_active === true));
      setSpTotal(pagination.totalItems ?? list.length);
      setSpTotalPages(pagination.totalPages ?? 1);
    } catch (err) {
      console.error('fetchAvailable:', err);
      toast.error('Failed to load stock points');
      setAvailable([]);
      setSpTotal(0);
      setSpTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [spPage, spLimit, spFilters]);

  const fetchStockPointDepartments = useCallback(async (spid, filtersOverride) => {
    const filters = filtersOverride ?? dFilters;
    try {
      setLoading(true);
      const clean = cleanFilters(filters);
      const res = await hrAPI.getDepartments({
        page: 1,
        limit: 500,
        search: '',
        searchFields: ['name', 'code'],
        filters: { stock_po_id: Number(spid), ...clean },
      });
      const body = unwrap(res);
      const list = pickArray(body, 'departments', 'data.departments', 'data');
      const activeDepts = (Array.isArray(list) ? list : []).filter(
        (d) => d?.status !== 'inactive'
      );
      setStockPointDepartments(activeDepts);
    } catch (err) {
      console.error('fetchStockPointDepartments:', err);
      toast.error('Failed to load departments for this stock point');
      setStockPointDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [dFilters]);

  useEffect(() => {
    if (!show) {
      setMode(MODE.DEPT_WISE);
      setFilterModeDeptWise(FILTER.ALL);
      setFilterModeStockWise(FILTER.ALL);
      setDeptId('');
      setSelectedDepartment(null);
      setSelectedStockPoints([]);
      setMappedStockPoints([]);
      setStockPointId('');
      setSelectedStockPoint(null);
      setSelectedDepartments([]);
      setSpFilters({});
      setDFilters({});
      setShowDeptPicker(false);
      setShowStockPointPicker(false);
      setStockPointDepartments([]);
      setAvailable([]);
      setLoading(false);
      setSaving(false);
      setSpPage(1);
      setSpLimit(DEFAULT_LIMIT);
      setSpTotal(0);
      setSpTotalPages(1);
      setDPage(1);
      setDLimit(DEFAULT_LIMIT);
    }
  }, [show]);

  useEffect(() => {
    if (!show || mode !== MODE.DEPT_WISE) return;
    fetchAvailable();
  }, [show, mode, fetchAvailable]);

  useEffect(() => {
    if (!show || mode !== MODE.STOCK_WISE) return;
    if (!stockPointId) {
      setStockPointDepartments([]);
      return;
    }
    fetchStockPointDepartments(stockPointId);
  }, [show, mode, stockPointId, fetchStockPointDepartments]);

  useEffect(() => {
    setDPage(1);
  }, [stockPointId, filterModeStockWise, dFilters]);

  useEffect(() => {
    if (mode !== MODE.DEPT_WISE) return;
    if (!selectedDepartment) {
      setMappedStockPoints([]);
      setSelectedStockPoints([]);
      return;
    }
    const ids = Array.isArray(selectedDepartment.stock_points)
      ? selectedDepartment.stock_points
      : [];
    setMappedStockPoints(ids);
    setSelectedStockPoints(ids);
  }, [mode, selectedDepartment]);

  useEffect(() => {
    if (mode !== MODE.STOCK_WISE) return;
    if (!stockPointId) {
      setSelectedDepartments([]);
      return;
    }
    const ids = stockPointDepartments
      .filter(
        (d) => Array.isArray(d.stock_points) && d.stock_points.includes(stockPointId)
      )
      .map((d) => getDeptId(d));
    setSelectedDepartments(ids);
  }, [mode, stockPointId, stockPointDepartments]);

  const handleDepartmentSelect = useCallback((d) => {
    if (d) {
      setDeptId(getDeptId(d));
      setSelectedDepartment(d);
    } else {
      setDeptId('');
      setSelectedDepartment(null);
      setSelectedStockPoints([]);
      setMappedStockPoints([]);
    }
    setShowDeptPicker(false);
  }, []);

  const handleStockPointSelect = useCallback((sp) => {
    if (sp) {
      setStockPointId(sp.stock_po_id ?? sp.id);
      setSelectedStockPoint(sp);
    } else {
      setStockPointId('');
      setSelectedStockPoint(null);
      setSelectedDepartments([]);
    }
    setShowStockPointPicker(false);
  }, []);

  const toggleStockPoint = useCallback((id) => {
    setSelectedStockPoints((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleDepartment = useCallback((id) => {
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const setSpFilter = useCallback((key, value) => {
    setSpFilters((prev) => {
      const next = { ...prev, [key]: value };
      const clean = cleanFilters(next);
      setSpPage(1);
      fetchAvailable(clean);
      return next;
    });
  }, [fetchAvailable]);

  const setDFilter = useCallback((key, value) => {
    setDFilters((prev) => {
      const next = { ...prev, [key]: value };
      const clean = cleanFilters(next);
      if (stockPointId) fetchStockPointDepartments(stockPointId, clean);
      setDPage(1);
      return next;
    });
  }, [fetchStockPointDepartments, stockPointId]);

  const mappedStockSet = useMemo(
    () => new Set(mappedStockPoints),
    [mappedStockPoints]
  );

  const mappedDeptSet = useMemo(() => {
    if (!stockPointId) return new Set();
    const s = new Set();
    stockPointDepartments.forEach((d) => {
      if (Array.isArray(d.stock_points) && d.stock_points.includes(stockPointId)) {
        s.add(getDeptId(d));
      }
    });
    return s;
  }, [stockPointId, stockPointDepartments]);

  const filteredStockPoints = useMemo(() => {
    if (filterModeDeptWise === FILTER.ALL) return available;
    if (!deptId) return available;
    if (filterModeDeptWise === FILTER.MAPPED)
      return available.filter((sp) => mappedStockSet.has(sp.stock_po_id));
    return available.filter((sp) => !mappedStockSet.has(sp.stock_po_id));
  }, [available, filterModeDeptWise, deptId, mappedStockSet]);

  const filteredDepartments = useMemo(() => {
    if (filterModeStockWise === FILTER.ALL) return stockPointDepartments;
    if (!stockPointId) return stockPointDepartments;
    if (filterModeStockWise === FILTER.MAPPED)
      return stockPointDepartments.filter((d) => mappedDeptSet.has(getDeptId(d)));
    return stockPointDepartments.filter((d) => !mappedDeptSet.has(getDeptId(d)));
  }, [stockPointDepartments, filterModeStockWise, stockPointId, mappedDeptSet]);

  const dTotal = filteredDepartments.length;
  const dTotalPages = Math.max(1, Math.ceil(dTotal / dLimit));
  const dStart = (dPage - 1) * dLimit;
  const pagedDepartments = useMemo(
    () => filteredDepartments.slice(dStart, dStart + dLimit),
    [filteredDepartments, dStart, dLimit]
  );

  useEffect(() => {
    if (dPage > dTotalPages) setDPage(dTotalPages);
  }, [dPage, dTotalPages]);

  const allStockChecked =
    filteredStockPoints.length > 0 &&
    filteredStockPoints.every((sp) => selectedStockPoints.includes(sp.stock_po_id));

  const toggleAllStock = useCallback(() => {
    setSelectedStockPoints((prev) => {
      const allOn = filteredStockPoints.every((sp) => prev.includes(sp.stock_po_id));
      if (allOn) {
        const ids = new Set(filteredStockPoints.map((sp) => sp.stock_po_id));
        return prev.filter((id) => !ids.has(id));
      }
      const merged = new Set(prev);
      filteredStockPoints.forEach((sp) => merged.add(sp.stock_po_id));
      return [...merged];
    });
  }, [filteredStockPoints]);

  const allDeptsChecked =
    pagedDepartments.length > 0 &&
    pagedDepartments.every((d) => selectedDepartments.includes(getDeptId(d)));

  const toggleAllDepartments = useCallback(() => {
    setSelectedDepartments((prev) => {
      const allOn = pagedDepartments.every((d) => prev.includes(getDeptId(d)));
      if (allOn) {
        const ids = new Set(pagedDepartments.map((d) => getDeptId(d)));
        return prev.filter((id) => !ids.has(id));
      }
      const merged = new Set(prev);
      pagedDepartments.forEach((d) => merged.add(getDeptId(d)));
      return [...merged];
    });
  }, [pagedDepartments]);

  const saveDisabled =
    saving ||
    (mode === MODE.DEPT_WISE && (!deptId || selectedStockPoints.length === 0)) ||
    (mode === MODE.STOCK_WISE && (!stockPointId || selectedDepartments.length === 0));

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (mode === MODE.DEPT_WISE) {
      if (!deptId || selectedStockPoints.length === 0) {
        toast.error('Department and at least one stock point are required');
        return;
      }
      try {
        setSaving(true);
        await stockPointsAPI.mapStockPointsToDepartment({
          dept_id: Number(deptId),
          stock_point_ids: selectedStockPoints,
        });
        toast.success('Stock points updated for department');
        setMappedStockPoints([...selectedStockPoints]);
        onSaved?.();
        onClose?.();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to map stock points');
      } finally {
        setSaving(false);
      }
    } else {
      if (!stockPointId || selectedDepartments.length === 0) {
        toast.error('Stock point and at least one department are required');
        return;
      }
      try {
        setSaving(true);
        await stockPointsAPI.mapDepartmentsToStockPoint(
          Number(stockPointId),
          selectedDepartments
        );
        toast.success('Departments updated for stock point');
        onSaved?.();
        onClose?.();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to map departments');
      } finally {
        setSaving(false);
      }
    }
  }, [
    saving, mode, deptId, selectedStockPoints, stockPointId, selectedDepartments,
    onSaved, onClose,
  ]);

  const deptLabel = selectedDepartment
    ? displayDepartment(selectedDepartment)
    : deptId
    ? `ID: ${deptId}`
    : 'Select a department...';

  const stockPointLabel = selectedStockPoint
    ? displayStockPoint(selectedStockPoint)
    : stockPointId
    ? `ID: ${stockPointId}`
    : 'Select a stock point...';

  if (!show) return null;

  const activeFilter =
    mode === MODE.DEPT_WISE ? filterModeDeptWise : filterModeStockWise;
  const setActiveFilter =
    mode === MODE.DEPT_WISE ? setFilterModeDeptWise : setFilterModeStockWise;
  const filterDisabled =
    saving ||
    (mode === MODE.DEPT_WISE && !deptId) ||
    (mode === MODE.STOCK_WISE && !stockPointId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col">
        <div className="flex items-center gap-2 flex-wrap px-2.5 py-1.5 border-b">
          <h3 className="text-sm font-semibold whitespace-nowrap">
            Map Stock Points to Department
          </h3>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="mapMode"
                checked={mode === MODE.DEPT_WISE}
                onChange={() => setMode(MODE.DEPT_WISE)}
                disabled={saving} className="w-3 h-3" />
              Department-wise
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="mapMode"
                checked={mode === MODE.STOCK_WISE}
                onChange={() => setMode(MODE.STOCK_WISE)}
                disabled={saving} className="w-3 h-3" />
              Stock-Point-wise
            </label>
          </div>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap">
            <span className="text-gray-500">Show:</span>
            {[
              { v: FILTER.ALL, l: 'All' },
              { v: FILTER.PENDING, l: 'Pending' },
              { v: FILTER.MAPPED, l: 'Mapped' },
            ].map(({ v, l }) => {
              const off = filterDisabled && v !== FILTER.ALL;
              return (
                <label key={v}
                  className={`flex items-center gap-1 ${off ? 'opacity-50' : 'cursor-pointer'}`}
                  title={off ? (mode === MODE.DEPT_WISE ? 'Select a department first' : 'Select a stock point first') : ''}>
                  <input type="radio" name="filterMode"
                    checked={activeFilter === v}
                    onChange={() => setActiveFilter(v)}
                    disabled={off || saving} className="w-3 h-3" />
                  {l}
                </label>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={handleSave} disabled={saveDisabled}
              className="px-2 py-1 text-xs rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
              title="Save mapping">
              <Save className="w-3 h-3" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} disabled={saving}
              className="text-gray-400 hover:text-gray-600 p-0.5" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {mode === MODE.DEPT_WISE && (
          <>
            <div className="p-2.5 border-b">
              <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Department *</label>
              <div className="flex items-center gap-1">
                <div className="flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => !saving && setShowDeptPicker(true)}>
                  <span className={`truncate ${deptId ? 'text-gray-900' : 'text-gray-400'}`}>{deptLabel}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </div>
                {deptId && (
                  <button onClick={() => handleDepartmentSelect(null)}
                    className="p-0.5 text-gray-400 hover:text-red-600" title="Clear department">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {loading ? (
                <p className="text-xs text-gray-500 text-center p-4">Loading...</p>
              ) : filteredStockPoints.length === 0 ? (
                <p className="text-xs text-gray-500 text-center p-4">
                  {filterModeDeptWise === FILTER.ALL
                    ? 'No active stock points'
                    : filterModeDeptWise === FILTER.MAPPED
                    ? 'No stock points mapped to this department yet'
                    : 'No pending stock points for this department'}
                </p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="text-left text-[11px] text-gray-600 border-b">
                      <th className="px-2 py-1.5 w-8 border-r border-gray-200">
                        <input type="checkbox" checked={allStockChecked}
                          onChange={toggleAllStock} disabled={saving}
                          className="w-3 h-3 rounded border-gray-300" title="Select all visible" />
                      </th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Code</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Name</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Type</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Category</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Level</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">City</th>
                      <th className="px-2 py-1.5 font-medium">Mapping</th>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="px-1 py-0.5 border-r border-gray-200"></th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={spFilters.stock_point_code}
                          onChange={(v) => setSpFilter('stock_point_code', v)}
                          placeholder="Code..." disabled={saving} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={spFilters.stock_point_name}
                          onChange={(v) => setSpFilter('stock_point_name', v)}
                          placeholder="Name..." disabled={saving} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={spFilters.stock_point_type}
                          onChange={(v) => setSpFilter('stock_point_type', v)}
                          placeholder="Type..." disabled={saving} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={spFilters.stock_point_category}
                          onChange={(v) => setSpFilter('stock_point_category', v)}
                          placeholder="Category..." disabled={saving} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200"></th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={spFilters.city}
                          onChange={(v) => setSpFilter('city', v)}
                          placeholder="City..." disabled={saving} />
                      </th>
                      <th className="px-1 py-0.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockPoints.map((sp) => {
                      const checked = selectedStockPoints.includes(sp.stock_po_id);
                      const isMapped = mappedStockSet.has(sp.stock_po_id);
                      return (
                        <tr key={sp.stock_po_id}
                          onClick={() => !saving && toggleStockPoint(sp.stock_po_id)}
                          className={`border-b cursor-pointer ${checked ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 border-r border-gray-200">
                            <input type="checkbox" checked={checked}
                              onChange={() => toggleStockPoint(sp.stock_po_id)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={saving}
                              className="w-3 h-3 rounded border-gray-300" />
                          </td>
                          <td className="px-2 py-1.5 font-medium whitespace-nowrap border-r border-gray-200">
                            {sp.stock_point_code}
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-200">{sp.stock_point_name}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{sp.stock_point_type || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{sp.stock_point_category || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{sp.stock_point_level ?? '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{sp.city || '-'}</td>
                          <td className="px-2 py-1.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              isMapped ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isMapped ? 'Mapped' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <PaginationBar page={spPage} limit={spLimit} total={spTotal} totalPages={spTotalPages}
              onPageChange={(p) => setSpPage(Math.min(Math.max(1, p), spTotalPages))}
              onLimitChange={(l) => { setSpLimit(l); setSpPage(1); }}
              label="stock points" />
          </>
        )}

        {mode === MODE.STOCK_WISE && (
          <>
            <div className="p-2.5 border-b">
              <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Stock Point *</label>
              <div className="flex items-center gap-1">
                <div className="flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => !saving && setShowStockPointPicker(true)}
                  title={selectedStockPoint ? buildStockPointTooltip(selectedStockPoint) : 'Select a stock point'}>
                  <span className={`truncate ${stockPointId ? 'text-gray-900' : 'text-gray-400'}`}>{stockPointLabel}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </div>
                {stockPointId && (
                  <button onClick={() => handleStockPointSelect(null)}
                    className="p-0.5 text-gray-400 hover:text-red-600" title="Clear stock point">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2">
              {loading ? (
                <p className="text-xs text-gray-500 text-center p-4">Loading...</p>
              ) : !stockPointId ? (
                <p className="text-xs text-gray-500 text-center p-4">
                  Select a stock point to view its departments
                </p>
              ) : pagedDepartments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center p-4">
                  {filterModeStockWise === FILTER.ALL
                    ? 'No departments found'
                    : filterModeStockWise === FILTER.MAPPED
                    ? 'No departments mapped to this stock point yet'
                    : 'No pending departments for this stock point'}
                </p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="text-left text-[11px] text-gray-600 border-b border-gray-200">
                      <th className="px-2 py-1.5 w-8 border-r border-gray-200">
                        <input type="checkbox" checked={allDeptsChecked}
                          onChange={toggleAllDepartments} disabled={saving}
                          className="w-3 h-3 rounded border-gray-300" title="Select all visible" />
                      </th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Code</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Name</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Short</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Cost Center</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Status</th>
                      <th className="px-2 py-1.5 font-medium">Mapping</th>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="px-1 py-0.5 border-r border-gray-200"></th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={dFilters.code}
                          onChange={(v) => setDFilter('code', v)}
                          placeholder="Code..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={dFilters.name}
                          onChange={(v) => setDFilter('name', v)}
                          placeholder="Name..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={dFilters.short_name}
                          onChange={(v) => setDFilter('short_name', v)}
                          placeholder="Short..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={dFilters.cost_centre}
                          onChange={(v) => setDFilter('cost_centre', v)}
                          placeholder="Cost Center..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200"></th>
                      <th className="px-1 py-0.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedDepartments.map((d) => {
                      const did = getDeptId(d);
                      const checked = selectedDepartments.includes(did);
                      const isMapped = mappedDeptSet.has(did);
                      return (
                        <tr key={did}
                          onClick={() => !saving && toggleDepartment(did)}
                          className={`border-b cursor-pointer ${checked ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 border-r border-gray-200">
                            <input type="checkbox" checked={checked}
                              onChange={() => toggleDepartment(did)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={saving}
                              className="w-3 h-3 rounded border-gray-300" />
                          </td>
                          <td className="px-2 py-1.5 font-mono border-r border-gray-200">{d.code || d.dept_code || '-'}</td>
                          <td className="px-2 py-1.5 border-r border-gray-200">{d.name || d.dept_name || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{d.short_name || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{d.cost_centre || d.cost_center_name || '-'}</td>
                          <td className="px-2 py-1.5 border-r border-gray-200">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              d.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                            }`}>
                              {d.status === 'inactive' ? 'Inactive' : 'Active'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              isMapped ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isMapped ? 'Mapped' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <PaginationBar page={dPage} limit={dLimit} total={dTotal} totalPages={dTotalPages}
              onPageChange={(p) => setDPage(Math.min(Math.max(1, p), dTotalPages))}
              onLimitChange={(l) => { setDLimit(l); setDPage(1); }}
              label="departments" />
          </>
        )}

        <div className="px-2.5 py-1.5 border-t bg-gray-50 text-[11px] text-gray-600">
          {mode === MODE.DEPT_WISE
            ? `${selectedStockPoints.length} stock point(s) selected`
            : `${selectedDepartments.length} department(s) selected`}
        </div>
      </div>

      <Suspense fallback={null}>
        <DepartmentSelectionModal show={showDeptPicker}
          onClose={() => setShowDeptPicker(false)}
          onSelect={handleDepartmentSelect}
          selectedDepartmentId={deptId || null} />
      </Suspense>

      <Suspense fallback={null}>
        <StockPointSelectionModal show={showStockPointPicker}
          onClose={() => setShowStockPointPicker(false)}
          onSelect={handleStockPointSelect}
          selectedStockPointId={stockPointId || null}
          statusFilter="active" />
      </Suspense>
    </div>
  );
};

export default memo(MapToDepartmentModal);
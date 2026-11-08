import React, {
  useState, useEffect, useCallback, useMemo, memo, lazy, Suspense,
} from 'react';
import {
  X, Save, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { stockPointsAPI, userAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const UserSelectionModal = lazy(() =>
  import('../../../../components/ui/UserSelectionModal')
);
const StockPointSelectionModal = lazy(() =>
  import('./StockPointSelectionModal')
);

const MODE = { USER_WISE: 'user', STOCK_WISE: 'stock' };
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

const getUserId = (u) => (u ? u.user_id ?? u.id ?? '' : '');

const displayUser = (u) =>
  u
    ? u.displayText ||
      u.display_text ||
      u.label ||
      u.full_name ||
      u.name ||
      u.email ||
      `ID: ${getUserId(u)}`
    : 'Select a user...';

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
  ]
    .filter(Boolean)
    .join(', ');
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

const MapToUserModal = ({ show, onClose, onSaved }) => {
  const [mode, setMode] = useState(MODE.USER_WISE);
  const [filterModeUserWise, setFilterModeUserWise] = useState(FILTER.ALL);
  const [filterModeStockWise, setFilterModeStockWise] = useState(FILTER.ALL);

  const [userId, setUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStockPoints, setSelectedStockPoints] = useState([]);
  const [mappedStockPoints, setMappedStockPoints] = useState([]);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const [stockPointId, setStockPointId] = useState('');
  const [selectedStockPoint, setSelectedStockPoint] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showStockPointPicker, setShowStockPointPicker] = useState(false);
  const [showUserMultiPicker, setShowUserMultiPicker] = useState(false);

  const [available, setAvailable] = useState([]);
  const [stockPointUsers, setStockPointUsers] = useState([]);

  const [spFilters, setSpFilters] = useState({});
  const [uFilters, setUFilters] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [spPage, setSpPage] = useState(1);
  const [spLimit, setSpLimit] = useState(DEFAULT_LIMIT);
  const [spTotal, setSpTotal] = useState(0);
  const [spTotalPages, setSpTotalPages] = useState(1);

  const [uPage, setUPage] = useState(1);
  const [uLimit, setULimit] = useState(DEFAULT_LIMIT);

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

  const fetchStockPointUsers = useCallback(async (spid, filtersOverride) => {
    const filters = filtersOverride ?? uFilters;
    try {
      setLoading(true);
      const clean = cleanFilters(filters);
      const res = await userAPI.getAllUsers({
        page: 1,
        limit: 500,
        search: '',
        searchFields: [],
        filters: { stock_po_id: Number(spid), ...clean },
      });
      const body = unwrap(res);
      const list = pickArray(body, 'data', 'users');
      const activeUsers = (Array.isArray(list) ? list : []).filter(
        (u) => u?.status !== 'inactive'
      );
      setStockPointUsers(activeUsers);
    } catch (err) {
      console.error('fetchStockPointUsers:', err);
      toast.error('Failed to load users for this stock point');
      setStockPointUsers([]);
    } finally {
      setLoading(false);
    }
  }, [uFilters]);

  useEffect(() => {
    if (!show) {
      setMode(MODE.USER_WISE);
      setFilterModeUserWise(FILTER.ALL);
      setFilterModeStockWise(FILTER.ALL);
      setUserId('');
      setSelectedUser(null);
      setSelectedStockPoints([]);
      setMappedStockPoints([]);
      setStockPointId('');
      setSelectedStockPoint(null);
      setSelectedUsers([]);
      setSpFilters({});
      setUFilters({});
      setShowUserPicker(false);
      setShowStockPointPicker(false);
      setShowUserMultiPicker(false);
      setStockPointUsers([]);
      setAvailable([]);
      setLoading(false);
      setSaving(false);
      setSpPage(1);
      setSpLimit(DEFAULT_LIMIT);
      setSpTotal(0);
      setSpTotalPages(1);
      setUPage(1);
      setULimit(DEFAULT_LIMIT);
    }
  }, [show]);

  useEffect(() => {
    if (!show || mode !== MODE.USER_WISE) return;
    fetchAvailable();
  }, [show, mode, fetchAvailable]);

  useEffect(() => {
    if (!show || mode !== MODE.STOCK_WISE) return;
    if (!stockPointId) {
      setStockPointUsers([]);
      return;
    }
    fetchStockPointUsers(stockPointId);
  }, [show, mode, stockPointId, fetchStockPointUsers]);

  useEffect(() => {
    setUPage(1);
  }, [stockPointId, filterModeStockWise, uFilters]);

  useEffect(() => {
    if (mode !== MODE.USER_WISE) return;
    if (!selectedUser) {
      setMappedStockPoints([]);
      setSelectedStockPoints([]);
      return;
    }
    const ids = Array.isArray(selectedUser.stock_points)
      ? selectedUser.stock_points
      : [];
    setMappedStockPoints(ids);
    setSelectedStockPoints(ids);
  }, [mode, selectedUser]);

  useEffect(() => {
    if (mode !== MODE.STOCK_WISE) return;
    if (!stockPointId) {
      setSelectedUsers([]);
      return;
    }
    const ids = stockPointUsers
      .filter(
        (u) => Array.isArray(u.stock_points) && u.stock_points.includes(stockPointId)
      )
      .map((u) => getUserId(u));
    setSelectedUsers(ids);
  }, [mode, stockPointId, stockPointUsers]);

  const handleUserSelect = useCallback((user) => {
    if (user) {
      setUserId(getUserId(user));
      setSelectedUser(user);
    } else {
      setUserId('');
      setSelectedUser(null);
      setSelectedStockPoints([]);
      setMappedStockPoints([]);
    }
    setShowUserPicker(false);
  }, []);

  const handleStockPointSelect = useCallback((sp) => {
    if (sp) {
      setStockPointId(sp.stock_po_id ?? sp.id);
      setSelectedStockPoint(sp);
    } else {
      setStockPointId('');
      setSelectedStockPoint(null);
      setSelectedUsers([]);
    }
    setShowStockPointPicker(false);
  }, []);

  const toggleStockPoint = useCallback((id) => {
    setSelectedStockPoints((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleUser = useCallback((id) => {
    setSelectedUsers((prev) =>
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

  const setUFilter = useCallback((key, value) => {
    setUFilters((prev) => {
      const next = { ...prev, [key]: value };
      const clean = cleanFilters(next);
      if (stockPointId) fetchStockPointUsers(stockPointId, clean);
      setUPage(1);
      return next;
    });
  }, [fetchStockPointUsers, stockPointId]);

  const mappedStockSet = useMemo(
    () => new Set(mappedStockPoints),
    [mappedStockPoints]
  );

  const mappedUserSet = useMemo(() => {
    if (!stockPointId) return new Set();
    const s = new Set();
    stockPointUsers.forEach((u) => {
      if (Array.isArray(u.stock_points) && u.stock_points.includes(stockPointId)) {
        s.add(getUserId(u));
      }
    });
    return s;
  }, [stockPointId, stockPointUsers]);

  const filteredStockPoints = useMemo(() => {
    if (filterModeUserWise === FILTER.ALL) return available;
    if (!userId) return available;
    if (filterModeUserWise === FILTER.MAPPED)
      return available.filter((sp) => mappedStockSet.has(sp.stock_po_id));
    return available.filter((sp) => !mappedStockSet.has(sp.stock_po_id));
  }, [available, filterModeUserWise, userId, mappedStockSet]);

  const filteredUsers = useMemo(() => {
    if (filterModeStockWise === FILTER.ALL) return stockPointUsers;
    if (!stockPointId) return stockPointUsers;
    if (filterModeStockWise === FILTER.MAPPED)
      return stockPointUsers.filter((u) => mappedUserSet.has(getUserId(u)));
    return stockPointUsers.filter((u) => !mappedUserSet.has(getUserId(u)));
  }, [stockPointUsers, filterModeStockWise, stockPointId, mappedUserSet]);

  const uTotal = filteredUsers.length;
  const uTotalPages = Math.max(1, Math.ceil(uTotal / uLimit));
  const uStart = (uPage - 1) * uLimit;
  const pagedUsers = useMemo(
    () => filteredUsers.slice(uStart, uStart + uLimit),
    [filteredUsers, uStart, uLimit]
  );

  useEffect(() => {
    if (uPage > uTotalPages) setUPage(uTotalPages);
  }, [uPage, uTotalPages]);

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

  const allUsersChecked =
    pagedUsers.length > 0 &&
    pagedUsers.every((u) => selectedUsers.includes(getUserId(u)));

  const toggleAllUsers = useCallback(() => {
    setSelectedUsers((prev) => {
      const allOn = pagedUsers.every((u) => prev.includes(getUserId(u)));
      if (allOn) {
        const ids = new Set(pagedUsers.map((u) => getUserId(u)));
        return prev.filter((id) => !ids.has(id));
      }
      const merged = new Set(prev);
      pagedUsers.forEach((u) => merged.add(getUserId(u)));
      return [...merged];
    });
  }, [pagedUsers]);

  const saveDisabled =
    saving ||
    (mode === MODE.USER_WISE && (!userId || selectedStockPoints.length === 0)) ||
    (mode === MODE.STOCK_WISE && (!stockPointId || selectedUsers.length === 0));

  const handleSave = useCallback(async () => {
    if (saving) return;

    if (mode === MODE.USER_WISE) {
      if (!userId || selectedStockPoints.length === 0) {
        toast.error('User and at least one stock point are required');
        return;
      }
      try {
        setSaving(true);
        await stockPointsAPI.mapStockPointsToUser({
          user_id: Number(userId),
          stock_point_ids: selectedStockPoints,
        });
        toast.success('Stock points updated for user');
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
      if (!stockPointId || selectedUsers.length === 0) {
        toast.error('Stock point and at least one user are required');
        return;
      }
      try {
        setSaving(true);
        await stockPointsAPI.mapUsersToStockPoint(
          Number(stockPointId),
          selectedUsers
        );
        toast.success('Users updated for stock point');
        onSaved?.();
        onClose?.();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Failed to map users');
      } finally {
        setSaving(false);
      }
    }
  }, [
    saving, mode, userId, selectedStockPoints, stockPointId, selectedUsers,
    onSaved, onClose,
  ]);

  const userLabel = selectedUser
    ? displayUser(selectedUser)
    : userId
    ? `ID: ${userId}`
    : 'Select a user...';

  const stockPointLabel = selectedStockPoint
    ? displayStockPoint(selectedStockPoint)
    : stockPointId
    ? `ID: ${stockPointId}`
    : 'Select a stock point...';

  if (!show) return null;

  const activeFilter =
    mode === MODE.USER_WISE ? filterModeUserWise : filterModeStockWise;
  const setActiveFilter =
    mode === MODE.USER_WISE ? setFilterModeUserWise : setFilterModeStockWise;
  const filterDisabled =
    saving ||
    (mode === MODE.USER_WISE && !userId) ||
    (mode === MODE.STOCK_WISE && !stockPointId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col">
        <div className="flex items-center gap-2 flex-wrap px-2.5 py-1.5 border-b">
          <h3 className="text-sm font-semibold whitespace-nowrap">
            Map Stock Points to User
          </h3>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-2 text-[11px] whitespace-nowrap">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="mapMode"
                checked={mode === MODE.USER_WISE}
                onChange={() => setMode(MODE.USER_WISE)}
                disabled={saving} className="w-3 h-3" />
              User-wise
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
                  title={off ? (mode === MODE.USER_WISE ? 'Select a user first' : 'Select a stock point first') : ''}>
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

        {mode === MODE.USER_WISE && (
          <>
            <div className="p-2.5 border-b">
              <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">User *</label>
              <div className="flex items-center gap-1">
                <div className="flex-1 px-1.5 py-1 border rounded text-xs bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => !saving && setShowUserPicker(true)}>
                  <span className={`truncate ${userId ? 'text-gray-900' : 'text-gray-400'}`}>{userLabel}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                </div>
                {userId && (
                  <button onClick={() => handleUserSelect(null)}
                    className="p-0.5 text-gray-400 hover:text-red-600" title="Clear user">
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
                  {filterModeUserWise === FILTER.ALL
                    ? 'No active stock points'
                    : filterModeUserWise === FILTER.MAPPED
                    ? 'No stock points mapped to this user yet'
                    : 'No pending stock points for this user'}
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
                  Select a stock point to view its users
                </p>
              ) : pagedUsers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center p-4">
                  {filterModeStockWise === FILTER.ALL
                    ? 'No users found'
                    : filterModeStockWise === FILTER.MAPPED
                    ? 'No users mapped to this stock point yet'
                    : 'No pending users for this stock point'}
                </p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="text-left text-[11px] text-gray-600 border-b border-gray-200">
                      <th className="px-2 py-1.5 w-8 border-r border-gray-200">
                        <input type="checkbox" checked={allUsersChecked}
                          onChange={toggleAllUsers} disabled={saving}
                          className="w-3 h-3 rounded border-gray-300" title="Select all visible" />
                      </th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Name</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Email</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Role</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Phone</th>
                      <th className="px-2 py-1.5 font-medium border-r border-gray-200">Status</th>
                      <th className="px-2 py-1.5 font-medium">Mapping</th>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="px-1 py-0.5 border-r border-gray-200"></th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={uFilters.full_name}
                          onChange={(v) => setUFilter('full_name', v)}
                          placeholder="Name..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={uFilters.email}
                          onChange={(v) => setUFilter('email', v)}
                          placeholder="Email..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={uFilters.role}
                          onChange={(v) => setUFilter('role', v)}
                          placeholder="Role..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200">
                        <HeaderFilterInput value={uFilters.phone_number}
                          onChange={(v) => setUFilter('phone_number', v)}
                          placeholder="Phone..." disabled={saving || !stockPointId} />
                      </th>
                      <th className="px-1 py-0.5 border-r border-gray-200"></th>
                      <th className="px-1 py-0.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((u) => {
                      const uid = getUserId(u);
                      const checked = selectedUsers.includes(uid);
                      const isMapped = mappedUserSet.has(uid);
                      return (
                        <tr key={uid}
                          onClick={() => !saving && toggleUser(uid)}
                          className={`border-b cursor-pointer ${checked ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                          <td className="px-2 py-1.5 border-r border-gray-200">
                            <input type="checkbox" checked={checked}
                              onChange={() => toggleUser(uid)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={saving}
                              className="w-3 h-3 rounded border-gray-300" />
                          </td>
                          <td className="px-2 py-1.5 border-r border-gray-200">{u.full_name || u.name || u.label || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{u.email || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{u.role || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 border-r border-gray-200">{u.phone_number || u.phone || '-'}</td>
                          <td className="px-2 py-1.5 border-r border-gray-200">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              u.status === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                            }`}>
                              {u.status === 'inactive' ? 'Inactive' : 'Active'}
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

            <PaginationBar page={uPage} limit={uLimit} total={uTotal} totalPages={uTotalPages}
              onPageChange={(p) => setUPage(Math.min(Math.max(1, p), uTotalPages))}
              onLimitChange={(l) => { setULimit(l); setUPage(1); }}
              label="users" />
          </>
        )}

        <div className="px-2.5 py-1.5 border-t bg-gray-50 text-[11px] text-gray-600">
          {mode === MODE.USER_WISE
            ? `${selectedStockPoints.length} stock point(s) selected`
            : `${selectedUsers.length} user(s) selected`}
        </div>
      </div>

      <Suspense fallback={null}>
        <UserSelectionModal show={showUserPicker}
          onClose={() => setShowUserPicker(false)}
          onSelect={handleUserSelect}
          selectedUserId={userId || null}
          allowedRoles={['admin', 'staff', 'student']} />
      </Suspense>

      <Suspense fallback={null}>
        <UserSelectionModal show={showUserMultiPicker}
          onClose={() => setShowUserMultiPicker(false)}
          onSelect={(u) => {
            if (Array.isArray(u)) {
              setSelectedUsers(u.map((x) => getUserId(x)));
            } else if (u) {
              const id = getUserId(u);
              setSelectedUsers((prev) => prev.includes(id) ? prev : [...prev, id]);
            }
            setShowUserMultiPicker(false);
          }}
          multiSelect selectedUserIds={selectedUsers}
          allowedRoles={['admin', 'staff', 'student']} />
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

export default memo(MapToUserModal);
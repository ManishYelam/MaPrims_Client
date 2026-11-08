import React, { useState, useCallback, useMemo, useContext, memo, lazy, Suspense, useRef, useEffect } from 'react';
import {
  Search, Edit, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Calendar, CheckCircle, AlertCircle, Clock, Users, MapPin,
  LogIn, LogOut, CheckCircle2, XCircle, X, UserPlus, RefreshCw, Camera,
  RotateCcw
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import { usePermissions } from '../../../../hooks/usePermissions';

const AttendanceModal = lazy(() => import('./AttendanceModal'));
const FaceVerifyModal = lazy(() => import('./FaceVerifyModal'));
const FaceRegisterModal = lazy(() => import('./FaceRegisterModal'));
const FaceTestModal = lazy(() => import('./FaceTestModal'));
const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));
const Toast = lazy(() => import('../../../../components/common/Toast'));

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
};

const formatLocation = (locObj) => {
  if (!locObj || typeof locObj !== 'object') return '—';
  const lat = locObj.latitude ?? '';
  const lng = locObj.longitude ?? '';
  if (lat === '' && lng === '') return '—';
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
};

const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const subDays = (date, days) => { const r = new Date(date); r.setDate(date.getDate() - days); return r; };
const subMonths = (date, months) => { const r = new Date(date); r.setMonth(date.getMonth() - months); if (r.getDate() !== date.getDate()) r.setDate(0); return r; };
const subYears = (date, years) => { const r = new Date(date); r.setFullYear(date.getFullYear() - years); return r; };
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
const formatYMD = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseISODate = (str) => { if (!str) return null; const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };

const precomputeShiftInfoForList = (data) => {
  const cache = new Map();
  data.forEach(att => {
    const key = `${att.emp_id}_${att.date}`;
    if (!cache.has(key)) {
      const shiftAssignments = att.employee?.shift_assignments || [];
      const attDate = att.date;
      let assignment = shiftAssignments.find(
        a =>
          a.effective_from &&
          a.effective_from <= attDate &&
          (a.effective_to === null || a.effective_to >= attDate)
      );
      if (assignment && assignment.shift) {
        const shift = assignment.shift;
        cache.set(key, {
          expectedCheckIn: shift.start_time ? `${attDate}T${shift.start_time}` : null,
          expectedCheckOut: shift.end_time ? `${attDate}T${shift.end_time}` : null,
          shiftName: shift.name || shift.code,
        });
      } else {
        cache.set(key, null);
      }
    }
    const info = cache.get(key);
    att._expectedCheckIn = info?.expectedCheckIn ?? att.expected_check_in;
    att._expectedCheckOut = info?.expectedCheckOut ?? att.expected_check_out;
    att._shiftName = info?.shiftName ?? att.shift_name ?? '—';
  });
};

const StatusBadge = memo(({ status }) => {
  const statusMap = {
    present: { label: 'Present', color: 'bg-green-100 text-green-800 border-green-200' },
    absent: { label: 'Absent', color: 'bg-red-100 text-red-800 border-red-200' },
    late: { label: 'Late', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    half_day: { label: 'Half Day', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    holiday: { label: 'Holiday', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    weekend: { label: 'Weekend', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    on_leave: { label: 'On Leave', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    work_from_home: { label: 'WFH', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  };
  const s = statusMap[status] || statusMap.present;
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-[10px] font-medium border ${s.color}`}>
      {s.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const AttendanceRow = memo(({
  attendance, canBulk, isSelected, onToggleSelect, canUpdate,
  onEdit, onClockIn, onClockOut, actionLoading, getEmployeeName,
}) => {
  const handleCheckboxChange = useCallback((e) => {
    const id = parseInt(e.target.dataset.attendanceId, 10);
    onToggleSelect(id);
  }, [onToggleSelect]);

  const handleEditClick = useCallback(() => onEdit(attendance), [onEdit, attendance]);
  const handleClockInClick = useCallback(() => onClockIn(attendance.emp_id), [onClockIn, attendance.emp_id]);
  const handleClockOutClick = useCallback(() => onClockOut(attendance.emp_id), [onClockOut, attendance.emp_id]);

  const expectedIn = attendance._expectedCheckIn;
  const expectedOut = attendance._expectedCheckOut;
  const shiftName = attendance._shiftName;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {canBulk && (
        <td className="px-1 py-0.5 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            data-attendance-id={attendance.attendance_id}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
          />
        </td>
      )}
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.attendance_id}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.emp_id}</td>
      <td className="px-1 py-0.5 whitespace-nowrap">
        <div className="text-[10px] font-medium text-gray-900">{getEmployeeName(attendance)}</div>
        <div className="text-[10px] text-gray-500">{attendance.employee?.employee_code || ''}</div>
      </td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{formatDate(attendance.date)}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{formatTime(attendance.check_in)}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{formatTime(attendance.check_out)}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{formatTime(expectedIn)}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{formatTime(expectedOut)}</td>
      <td className="px-1 py-0.5 whitespace-nowrap">
        <StatusBadge status={attendance.status} />
      </td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.worked_hours || 0}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.break_hours || 0}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.overtime_hours || 0}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.late_minutes || 0}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.early_exit_minutes || 0}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{shiftName}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">
        {attendance.work_location_id || '—'}
      </td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">
        {formatLocation(attendance.check_in_location)}
      </td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">
        {formatLocation(attendance.check_out_location)}
      </td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.attendance_source || '—'}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.device_id || '—'}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">
        {attendance.is_regularized ? <span className="text-green-600 font-medium">Yes</span> : 'No'}
      </td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.approved_by || '—'}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">
        {attendance.approved_at ? formatDateTime(attendance.approved_at) : '—'}
      </td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700 max-w-[120px] truncate">{attendance.notes || '—'}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.createdAt ? formatDateTime(attendance.createdAt) : '—'}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] text-gray-700">{attendance.updatedAt ? formatDateTime(attendance.updatedAt) : '—'}</td>
      <td className="px-1 py-0.5 whitespace-nowrap text-[10px] font-medium">
        <div className="flex items-center gap-0.5">
          {canUpdate && (
            <>
              <button onClick={handleEditClick} className="text-gray-600 hover:text-gray-900 p-0.5 rounded hover:bg-gray-50" title="Edit">
                <Edit className="w-3 h-3" />
              </button>
              {!attendance.check_in && (
                <button onClick={handleClockInClick} disabled={actionLoading} className="text-green-600 hover:text-green-900 p-0.5 rounded hover:bg-green-50 disabled:opacity-50" title="Clock In">
                  <LogIn className="w-3 h-3" />
                </button>
              )}
              {attendance.check_in && !attendance.check_out && (
                <button onClick={handleClockOutClick} disabled={actionLoading} className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 disabled:opacity-50" title="Clock Out">
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.attendance.attendance_id === nextProps.attendance.attendance_id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.canBulk === nextProps.canBulk &&
    prevProps.canUpdate === nextProps.canUpdate &&
    prevProps.actionLoading === nextProps.actionLoading &&
    prevProps.getEmployeeName === nextProps.getEmployeeName &&
    prevProps.onToggleSelect === nextProps.onToggleSelect &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onClockIn === nextProps.onClockIn &&
    prevProps.onClockOut === nextProps.onClockOut
  );
});
AttendanceRow.displayName = 'AttendanceRow';

const TabsBar = memo(({ tabs, activeStatus, onStatusChange }) => (
  <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-md overflow-x-auto">
    {tabs.map(tab => {
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          onClick={() => onStatusChange(tab.id)}
          className={`px-2 py-1 text-xs font-medium rounded-sm transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${
            activeStatus === tab.id
              ? 'bg-white text-primary-600 shadow-xs border border-primary-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <Icon className={`w-3 h-3 ${activeStatus === tab.id ? tab.color : ''}`} />
          {tab.name}
          <span className={`px-0.5 py-0.5 text-xs rounded-full min-w-4 flex items-center justify-center ${
            activeStatus === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
          }`}>
            {tab.count}
          </span>
        </button>
      );
    })}
  </div>
));
TabsBar.displayName = 'TabsBar';

const FilterControls = memo(({
  showMisspunch, onMisspunchChange, misspunchCount,
  canViewAll, filterByEmployee, onToggleFilterByEmployee, employeeCount,
  selectedEmployee, onOpenEmployeeModal,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  datePreset, onDatePresetChange,
  limit, onLimitChange,
  canExport, exportLoading, onExport,
  onGetData, onRefresh, search, onSearchChange,
  canRegisterFace, onRegisterFace, onTestFace,
}) => (
  <div className="flex flex-wrap items-center gap-1.5 mt-2 lg:mt-0">
    <button
      onClick={() => onMisspunchChange(!showMisspunch)}
      className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${
        showMisspunch
          ? 'border-primary-300 bg-primary-50 text-primary-700'
          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <AlertCircle className="w-3 h-3" />
      Misspunch
      {misspunchCount > 0 && <span className="text-xs">({misspunchCount})</span>}
      {showMisspunch && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
    </button>

    {canViewAll && (
      <button
        onClick={onToggleFilterByEmployee}
        className={`flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-colors ${
          filterByEmployee
            ? 'border-primary-300 bg-primary-50 text-primary-700'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Users className="w-3 h-3" />
        {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Employees'}
        {employeeCount > 0 && !selectedEmployee && <span className="text-xs">({employeeCount})</span>}
        {filterByEmployee && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
      </button>
    )}

    {filterByEmployee && (
      <button onClick={onOpenEmployeeModal}
        className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors">
        <UserPlus className="w-3 h-3" />
        {selectedEmployee ? 'Change' : 'Select Employee'}
      </button>
    )}

    <select value={datePreset} onChange={onDatePresetChange}
      className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="last7days">Last 7 days</option>
      <option value="monthtodate">Month to date</option>
      <option value="previous-month">Previous month</option>
      <option value="yeartodate">Year to date</option>
      <option value="previous-year">Previous year</option>
    </select>

    <input type="date" value={dateFrom} onChange={onDateFromChange}
      className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />
    <input type="date" value={dateTo} onChange={onDateToChange}
      className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 w-28" />

    <button onClick={onGetData} className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors">
      <RefreshCw className="w-3 h-3" />
      Get Data
    </button>

    <button onClick={onRefresh} title="Reset filters"
      className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
      <RotateCcw className="w-3 h-3" />
      Refresh
    </button>

    <select value={limit} onChange={onLimitChange}
      className="text-xs border border-gray-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
      <option value="50">50 per page</option>
      <option value="100">100 per page</option>
      <option value="150">150 per page</option>
      <option value="200">200 per page</option>
      <option value="250">250 per page</option>
      <option value="300">300 per page</option>
    </select>

    {canExport && (
      <button onClick={onExport} disabled={exportLoading}
        className="flex items-center gap-0.5 px-2 py-0.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50">
        <Download className="w-2.5 h-2.5" />
        {exportLoading ? 'Exporting...' : 'Export'}
      </button>
    )}

    {canRegisterFace && selectedEmployee && (
      <>
        <button onClick={() => onRegisterFace(selectedEmployee.emp_id)}
          className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors">
          <Camera className="w-3 h-3" /> Register Face
        </button>
        <button onClick={() => onTestFace(selectedEmployee.emp_id)}
          className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium transition-colors">
          <Camera className="w-3 h-3" /> Test Face
        </button>
      </>
    )}
  </div>
));
FilterControls.displayName = 'FilterControls';

const BulkActions = memo(({ selectedCount, bulkAction, onBulkActionChange, onApplyBulk }) => {
  if (!selectedCount) return null;
  return (
    <div className="flex items-center gap-1.5 bg-primary-50 rounded-md">
      <select value={bulkAction} onChange={onBulkActionChange}
        className="text-xs border border-primary-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-primary-500 bg-white">
        <option value="">Bulk Actions</option>
        <option value="present">Mark Present</option>
        <option value="absent">Mark Absent</option>
        <option value="late">Mark Late</option>
        <option value="half_day">Mark Half Day</option>
        <option value="on_leave">Mark On Leave</option>
      </select>
      <button onClick={onApplyBulk} disabled={!bulkAction}
        className="px-1.5 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-xs font-medium">
        Apply
      </button>
      <span className="text-xs text-primary-700 font-medium">{selectedCount} selected</span>
    </div>
  );
});
BulkActions.displayName = 'BulkActions';

const SearchInput = memo(({ value, onChange }) => (
  <div className="relative">
    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
    <input type="text" placeholder="Search employee..." value={value}
      onChange={e => onChange(e.target.value)}
      className="pl-7 pr-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 w-full sm:w-40 text-xs" />
  </div>
));
SearchInput.displayName = 'SearchInput';

const TopBar = memo(({ canBulk, selectedCount, bulkAction, onBulkActionChange, onApplyBulk, search, onSearchChange }) => (
  <div className="flex items-center gap-1.5">
    {canBulk && (
      <BulkActions selectedCount={selectedCount} bulkAction={bulkAction} onBulkActionChange={onBulkActionChange} onApplyBulk={onApplyBulk} />
    )}
    <SearchInput value={search} onChange={onSearchChange} />
  </div>
));
TopBar.displayName = 'TopBar';

const TableHeader = memo(({ canBulk, allSelected, onToggleSelectAll, canBulkCheck }) => (
  <thead className="bg-indigo-50 border-b border-indigo-200 sticky top-0 z-10">
    <tr>
      {canBulk && (
        <th className="px-1 py-0.5 w-8">
          <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} disabled={!canBulkCheck}
            className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3" />
        </th>
      )}
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">ID</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Emp ID</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Employee</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Date</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Check In</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Check Out</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Expected In</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Expected Out</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Status</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Worked Hrs</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Break Hrs</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">OT Hrs</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Late (min)</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Early Exit</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Shift</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Work Loc ID</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Check‑In Loc</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Check‑Out Loc</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Source</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Device</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Regularized</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Approved By</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Approved At</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Notes</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Created At</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Updated At</th>
      <th className="px-1 py-0.5 text-left text-[10px] font-medium text-indigo-700 uppercase tracking-wider">Actions</th>
    </tr>
  </thead>
));
TableHeader.displayName = 'TableHeader';

const TableBody = memo(({
  attendances, selectedIds, canBulk, canUpdate,
  onEdit, onClockIn, onClockOut,
  actionLoading, getEmployeeName, onToggleSelect
}) => (
  <tbody className="bg-white divide-y divide-gray-200">
    {attendances.map(att => (
      <AttendanceRow
        key={att.attendance_id}
        attendance={att}
        canBulk={canBulk}
        isSelected={selectedIds.includes(att.attendance_id)}
        onToggleSelect={onToggleSelect}
        canUpdate={canUpdate}
        onEdit={onEdit}
        onClockIn={onClockIn}
        onClockOut={onClockOut}
        actionLoading={actionLoading}
        getEmployeeName={getEmployeeName}
      />
    ))}
  </tbody>
));
TableBody.displayName = 'TableBody';

const ErrorState = memo(({ message, onRetry }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2"><AlertCircle className="w-4 h-4 text-red-500" /></div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">Unable to Load Attendance</h3>
      <p className="text-xs text-gray-600 mb-3">{message}</p>
      <button onClick={onRetry} className="px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 text-xs font-medium">Try Again</button>
    </div>
  </div>
));
ErrorState.displayName = 'ErrorState';

const EmptyState = memo(() => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2"><Calendar className="w-4 h-4 text-gray-400" /></div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">No attendance records</h3>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

const Pagination = memo(({ pagination, currentPage, onPageChange }) => {
  const { totalPages, totalItems, limit } = pagination;
  const from = (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, totalItems);

  const getPageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-white">
      <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <span>Showing</span><span className="font-medium">{from}</span>
          <span>to</span><span className="font-medium">{to}</span>
          <span>of</span><span className="font-medium">{totalItems}</span>
        </div>
        <div className="flex items-center space-x-0.5">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronsLeft className="w-3 h-3" />
          </button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronLeft className="w-3 h-3" />
          </button>
          {getPageNumbers.map(num => (
            <button key={num} onClick={() => onPageChange(num)}
              className={`w-6 h-6 text-xs rounded border transition-colors ${currentPage === num ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
              {num}
            </button>
          ))}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronRight className="w-3 h-3" />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
            className="p-0.5 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
            <ChevronsRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
});
Pagination.displayName = 'Pagination';

const Attendance = () => {
  const { user: authUser } = useContext(AuthContext);
  const { hasPermission, isAdmin } = usePermissions();

  const canManage = useMemo(() => isAdmin, [isAdmin]);
  const canUpdate = useMemo(() => hasPermission('update', 'attendance', 'A4') || canManage, [hasPermission, canManage]);
  const canExport = useMemo(() => hasPermission('export', 'attendance', 'A4') || canManage, [hasPermission, canManage]);
  const canBulk = useMemo(() => hasPermission('bulk', 'attendance', 'A4') || canManage, [hasPermission, canManage]);
  const canViewAll = useMemo(() => hasPermission('view_all', 'attendance', 'A4') || canManage, [hasPermission, canManage]);
  const canRegisterFace = useMemo(() => hasPermission('register_face', 'attendance', 'A4') || canManage, [hasPermission, canManage]);

  const [attendances, setAttendances] = useState([]);
  const [counts, setCounts] = useState({ total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionLoading] = useState(false);

  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceEmployeeId, setFaceEmployeeId] = useState(null);
  const [faceAction, setFaceAction] = useState('checkin');

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerEmployeeId, setRegisterEmployeeId] = useState(null);

  const [showTestFaceModal, setShowTestFaceModal] = useState(false);
  const [testEmployeeId, setTestEmployeeId] = useState(null);

  const todayStr = getToday();
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: todayStr,
    dateTo: todayStr,
    page: 1,
    limit: 50,
  });

  const [datePreset, setDatePreset] = useState('today');

  const [showMisspunch, setShowMisspunch] = useState(false);
  const [filterByEmployee, setFilterByEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalItems: 0, totalPages: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const statusOptions = useMemo(() => [
    { value: 'present', label: 'Present', icon: CheckCircle, color: 'text-green-600' },
    { value: 'absent', label: 'Absent', icon: XCircle, color: 'text-red-600' },
    { value: 'late', label: 'Late', icon: AlertCircle, color: 'text-yellow-600' },
    { value: 'half_day', label: 'Half Day', icon: Clock, color: 'text-orange-600' },
    { value: 'on_leave', label: 'On Leave', icon: Users, color: 'text-blue-600' },
    { value: 'holiday', label: 'Holiday', icon: Calendar, color: 'text-purple-600' },
    { value: 'weekend', label: 'Weekend', icon: Calendar, color: 'text-gray-600' },
    { value: 'work_from_home', label: 'WFH', icon: MapPin, color: 'text-indigo-600' },
  ], []);

  const tabs = useMemo(() => {
    const allCount = counts.total || 0;
    return [
      { id: 'all', name: 'All', count: allCount, icon: Calendar, color: 'text-gray-600' },
      ...statusOptions.map(s => ({
        id: s.value,
        name: s.label,
        count: counts[s.value] || 0,
        icon: s.icon,
        color: s.color,
      })),
      { id: 'misspunch', name: 'Misspunch', count: counts.misspunch || 0, icon: AlertCircle, color: 'text-red-600' },
    ];
  }, [counts, statusOptions]);

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search.trim(),
        searchFields: ['first_name', 'last_name'],
        filters: {},
      };

      if (canViewAll) {
        if (filterByEmployee) {
          payload.filters.filterByEmployee = true;
          if (selectedEmployee) {
            payload.filters.employeeId = selectedEmployee.emp_id;
          }
        } else {
          payload.filters.allEmployees = true;
        }
      } else {
        payload.filters.employeeId = authUser?.emp_id || -1;
      }

      if (filters.status !== 'all') payload.filters.status = filters.status;
      if (filters.dateFrom) payload.filters.dateFrom = filters.dateFrom;
      if (filters.dateTo) payload.filters.dateTo = filters.dateTo;
      if (showMisspunch || filters.status === 'misspunch') {
        payload.filters.misspunch = true;
      }

      const response = await hrAPI.getAttendance(payload);
      if (response.data?.success) {
        const rawData = response.data.data || [];
        precomputeShiftInfoForList(rawData);
        setAttendances(rawData);
        setCounts(response.data.counts || { total: 0 });
        setPagination({
          page: filters.page,
          limit: filters.limit,
          totalItems: response.data.pagination?.totalItems || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch');
      }
    } catch (err) {
      setError('Failed to load attendance records. Please try again.');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, filterByEmployee, selectedEmployee, authUser, canViewAll, showMisspunch]);

  const isFirstRun = useRef(true);

  useEffect(() => {
    fetchAttendances();
  }, []);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchAttendances();
  }, [filters.page]);

  useEffect(() => {
    if (refreshKey > 0) {
      fetchAttendances();
    }
  }, [refreshKey]);

  useEffect(() => {
    if (!filterByEmployee) setSelectedEmployee(null);
  }, [filterByEmployee]);

  const handleFaceSuccess = useCallback(() => {
    setShowFaceModal(false);
    setFaceEmployeeId(null);
    fetchAttendances();
    showToast('Attendance recorded successfully!', 'success');
  }, [fetchAttendances, showToast]);

  const handleRegisterFace = useCallback((empId) => {
    if (!canRegisterFace) {
      showToast('You do not have permission to register face', 'error');
      return;
    }
    setRegisterEmployeeId(empId);
    setShowRegisterModal(true);
  }, [canRegisterFace, showToast]);

  const handleRegistered = useCallback(() => {
    setShowRegisterModal(false);
    showToast('Face registered successfully!', 'success');
  }, [showToast]);

  const handleTestFace = useCallback((empId) => {
    setTestEmployeeId(empId);
    setShowTestFaceModal(true);
  }, []);

  const handleClockIn = useCallback((employeeId) => {
    if (!canUpdate) {
      showToast('You do not have permission to clock in', 'error');
      return;
    }
    setFaceEmployeeId(employeeId);
    setFaceAction('checkin');
    setShowFaceModal(true);
  }, [canUpdate, showToast]);

  const handleClockOut = useCallback((employeeId) => {
    if (!canUpdate) {
      showToast('You do not have permission to clock out', 'error');
      return;
    }
    setFaceEmployeeId(employeeId);
    setFaceAction('checkout');
    setShowFaceModal(true);
  }, [canUpdate, showToast]);

  const handleEdit = useCallback((attendance) => {
    if (!canUpdate) {
      showToast('You do not have permission to edit attendance', 'error');
      return;
    }
    setEditingAttendance(attendance);
    setShowAttendanceModal(true);
  }, [canUpdate, showToast]);

  const handleSaved = useCallback(() => {
    setShowAttendanceModal(false);
    setEditingAttendance(null);
    fetchAttendances();
    showToast('Attendance updated successfully', 'success');
  }, [fetchAttendances, showToast]);

  const handleEmployeeSelect = useCallback((emp) => {
    setSelectedEmployee(emp);
    setShowEmployeeModal(false);
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const toggleSelection = useCallback((id) => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, [canBulk]);

  const toggleSelectAll = useCallback(() => {
    if (!canBulk) return;
    setSelectedIds(prev => prev.length === attendances.length ? [] : attendances.map(a => a.attendance_id));
  }, [canBulk, attendances]);

  const exportToCSV = useCallback(async () => {
    if (!canExport) {
      showToast('You do not have permission to export attendance', 'error');
      return;
    }
    try {
      setExportLoading(true);
      const response = await hrAPI.getAttendanceAll({ limit: 10000 });
      const rawData = response.data?.data || [];
      if (!rawData.length) {
        showToast('No records to export', 'error');
        return;
      }
      precomputeShiftInfoForList(rawData);

      const headers = [
        'ID', 'Employee ID', 'Employee Name', 'Date', 'Check In', 'Check Out',
        'Expected In', 'Expected Out', 'Status', 'Worked Hours', 'Break Hours',
        'Overtime', 'Late (min)', 'Early Exit (min)', 'Shift', 'Work Location ID',
        'Check In Location', 'Check Out Location', 'Source', 'Device', 'Regularized',
        'Approved By', 'Approved At', 'Notes', 'Created At', 'Updated At'
      ];
      const rows = rawData.map(a => {
        const name = a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : '';
        return [
          a.attendance_id || '', a.emp_id || '', name, a.date || '',
          a.check_in ? formatDateTime(a.check_in) : '',
          a.check_out ? formatDateTime(a.check_out) : '',
          a._expectedCheckIn ? formatDateTime(a._expectedCheckIn) : '',
          a._expectedCheckOut ? formatDateTime(a._expectedCheckOut) : '',
          a.status || '', a.worked_hours || 0, a.break_hours || 0,
          a.overtime_hours || 0, a.late_minutes || 0, a.early_exit_minutes || 0,
          a._shiftName || '', a.work_location_id || '',
          formatLocation(a.check_in_location), formatLocation(a.check_out_location),
          a.attendance_source || '', a.device_id || '',
          a.is_regularized ? 'Yes' : 'No', a.approved_by || '',
          a.approved_at ? formatDateTime(a.approved_at) : '', a.notes || '',
          a.createdAt ? formatDateTime(a.createdAt) : '',
          a.updatedAt ? formatDateTime(a.updatedAt) : ''
        ];
      });
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const dateStamp = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
      link.download = `attendance_export_${dateStamp}.csv`;
      link.click();
      showToast(`Exported ${rawData.length} records`, 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  }, [canExport, showToast]);

  const handleBulkApply = useCallback(async () => {
    if (!canBulk || !bulkAction || selectedIds.length === 0) return;
    try {
      const promises = selectedIds.map(id => hrAPI.updateAttendance(id, { status: bulkAction }));
      await Promise.all(promises);
      setSelectedIds([]);
      setBulkAction('');
      fetchAttendances();
      showToast(`Updated ${selectedIds.length} records`, 'success');
    } catch (err) {
      showToast('Bulk action failed', 'error');
    }
  }, [canBulk, bulkAction, selectedIds, fetchAttendances, showToast]);

  const getEmployeeName = useCallback((attendance) => {
    if (attendance.employee) return `${attendance.employee.first_name} ${attendance.employee.last_name}`;
    return 'Unknown';
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : prev.page }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.totalPages]);

  const handleSearchChange = useCallback((value) => handleFilterChange('search', value), [handleFilterChange]);

  const handleToggleFilterByEmployee = useCallback(() => {
    setFilterByEmployee(prev => !prev);
    handleFilterChange('page', 1);
  }, [handleFilterChange]);

  const handleStatusChange = useCallback((tabId) => {
    if (tabId === 'misspunch') {
      setShowMisspunch(true);
      handleFilterChange('status', 'all');
    } else {
      setShowMisspunch(false);
      handleFilterChange('status', tabId);
    }
  }, [handleFilterChange]);

  const handleRefresh = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: todayStr,
      dateTo: todayStr,
      page: 1,
      limit: 15,
    });
    setShowMisspunch(false);
    setFilterByEmployee(false);
    setSelectedEmployee(null);
    setSelectedIds([]);
    setBulkAction('');
    setDatePreset('today');
    setRefreshKey(prev => prev + 1);
  }, [todayStr]);

  const handleDatePresetChange = useCallback((e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    const today = new Date();
    let start, end;
    switch (preset) {
      case 'today':
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case 'yesterday':
        start = startOfDay(subDays(today, 1));
        end = endOfDay(subDays(today, 1));
        break;
      case 'last7days':
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
        break;
      case 'monthtodate':
        start = startOfMonth(today);
        end = endOfDay(today);
        break;
      case 'previous-month':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case 'yeartodate':
        start = startOfYear(today);
        end = endOfDay(today);
        break;
      case 'previous-year':
        start = startOfYear(subYears(today, 1));
        end = endOfYear(subYears(today, 1));
        break;
      default:
        return;
    }
    setFilters(prev => ({
      ...prev,
      dateFrom: formatYMD(start),
      dateTo: formatYMD(end),
      page: 1,
    }));
  }, []);

  return (
    /* ✅ FIXED: h-full fits inside <main>'s scroll container — no overlap under dashboard footer */
    <div className="flex flex-col h-full p-3 pt-0 gap-3 overflow-hidden">
      <Suspense fallback={null}>
        {toast && <Toast toast={toast} onClose={clearToast} />}
      </Suspense>

      {/* Toolbar — pinned, never shrinks */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs text-gray-600">Manage attendance</p></div>
        <FilterControls
          showMisspunch={showMisspunch}
          onMisspunchChange={(checked) => { setShowMisspunch(checked); handleFilterChange('page', 1); }}
          misspunchCount={counts.misspunch || 0}
          canViewAll={canViewAll}
          filterByEmployee={filterByEmployee}
          onToggleFilterByEmployee={handleToggleFilterByEmployee}
          employeeCount={counts.employees || 0}
          selectedEmployee={selectedEmployee}
          onOpenEmployeeModal={() => setShowEmployeeModal(true)}
          dateFrom={filters.dateFrom}
          onDateFromChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          dateTo={filters.dateTo}
          onDateToChange={(e) => handleFilterChange('dateTo', e.target.value)}
          datePreset={datePreset}
          onDatePresetChange={handleDatePresetChange}
          limit={filters.limit}
          onLimitChange={(e) => handleFilterChange('limit', e.target.value)}
          canExport={canExport}
          exportLoading={exportLoading}
          onExport={exportToCSV}
          onGetData={fetchAttendances}
          onRefresh={handleRefresh}
          search={filters.search}
          onSearchChange={handleSearchChange}
          canRegisterFace={canRegisterFace}
          onRegisterFace={handleRegisterFace}
          onTestFace={handleTestFace}
        />
      </div>

      {/* Card — fills remaining height */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Card header (tabs + search + bulk) — pinned */}
        <div className="flex-shrink-0 p-3 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
            <TabsBar
              tabs={tabs}
              activeStatus={filters.status === 'misspunch' ? 'misspunch' : filters.status}
              onStatusChange={handleStatusChange}
            />
            <TopBar
              canBulk={canBulk}
              selectedCount={selectedIds.length}
              bulkAction={bulkAction}
              onBulkActionChange={(e) => setBulkAction(e.target.value)}
              onApplyBulk={handleBulkApply}
              search={filters.search}
              onSearchChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Table body — the ONLY scroll area (both directions, table is very wide) */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (null) : error ? (
            <ErrorState message={error} onRetry={fetchAttendances} />
          ) : attendances.length > 0 ? (
            <table className="w-full min-w-[2200px]">
              <TableHeader
                canBulk={canBulk}
                allSelected={selectedIds.length === attendances.length && attendances.length > 0}
                onToggleSelectAll={toggleSelectAll}
                canBulkCheck={canBulk}
              />
              <TableBody
                attendances={attendances}
                selectedIds={selectedIds}
                canBulk={canBulk}
                canUpdate={canUpdate}
                onEdit={handleEdit}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                actionLoading={actionLoading}
                getEmployeeName={getEmployeeName}
                onToggleSelect={toggleSelection}
              />
            </table>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Pagination footer — pinned, never shrinks */}
        {pagination.totalPages > 1 && (
          <Pagination pagination={pagination} currentPage={filters.page} onPageChange={handlePageChange} />
        )}
      </div>

      <Suspense fallback={null}>
        {showAttendanceModal && (
          <AttendanceModal show={showAttendanceModal} attendance={editingAttendance} onClose={() => { setShowAttendanceModal(false); setEditingAttendance(null); }} onSaved={handleSaved} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showFaceModal && (
          <FaceVerifyModal
            show={showFaceModal}
            onClose={() => { setShowFaceModal(false); setFaceEmployeeId(null); }}
            employeeId={faceEmployeeId}
            action={faceAction}
            onSuccess={handleFaceSuccess}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showRegisterModal && (
          <FaceRegisterModal
            show={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            employeeId={registerEmployeeId}
            onRegistered={handleRegistered}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showTestFaceModal && (
          <FaceTestModal
            show={showTestFaceModal}
            onClose={() => setShowTestFaceModal(false)}
            employeeId={testEmployeeId}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showEmployeeModal && (
          <EmployeeSelectionModal show={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} onSelect={handleEmployeeSelect} selectedEmployeeId={selectedEmployee?.emp_id} />
        )}
      </Suspense>
    </div>
  );
};

export default Attendance;
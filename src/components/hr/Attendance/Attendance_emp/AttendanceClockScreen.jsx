import React, { useState, useEffect, useContext, useCallback, memo, lazy, Suspense } from 'react';
import {
  MapPin, LogIn, LogOut, AlertCircle, CheckCircle, RefreshCw,
  ExternalLink, Calendar, Loader,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import { AuthContext } from '../../../../context/AuthContext';
import toast from 'react-hot-toast';

const FaceVerifyModal = lazy(() => import('./FaceVerifyModal'));

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getShiftName = (attendance) => {
  const assignments = attendance.employee?.shift_assignments || [];
  if (!assignments.length) return null;
  const attDate = attendance.date;
  let assignment = assignments.find(a => a.date === attDate);
  if (!assignment) {
    assignment = assignments.find(
      a =>
        a.effective_from &&
        a.effective_from <= attDate &&
        (a.effective_to === null || a.effective_to >= attDate)
    );
  }
  return assignment?.shift ? assignment.shift.name || assignment.shift.code : null;
};

const getCoordinates = (locationObj) => {
  if (!locationObj) return null;
  const lat = locationObj.latitude ?? locationObj.lat;
  const lon = locationObj.longitude ?? locationObj.lon;
  if (lat == null || lon == null) return null;
  return { lat, lon };
};

const formatCoord = (coords) => {
  if (!coords) return '—';
  return `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
};

const getMapsLink = (coords) => {
  if (!coords) return '#';
  return `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;
};

const StatusBadge = memo(({ status }) => {
  const colors = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
    half_day: 'bg-orange-100 text-orange-800',
    holiday: 'bg-purple-100 text-purple-800',
    weekend: 'bg-gray-100 text-gray-800',
    on_leave: 'bg-blue-100 text-blue-800',
    work_from_home: 'bg-indigo-100 text-indigo-800',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[status] || colors.present}`}>
      {status?.replace('_', ' ') || 'present'}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

const AttendanceClockScreen = () => {
  const { user: authUser } = useContext(AuthContext);
  const empId = authUser?.user?.emp_id;

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceAction, setFaceAction] = useState('checkin');

  const todayStr = getTodayStr();
  const todayAttendance = allData.find(log => log.date === todayStr) || null;

  const fetchData = useCallback(async () => {
    if (!empId) return;
    try {
      setLoading(true);
      setError(null);
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const payload = {
        page: 1,
        limit: 31,
        filters: {
          filterByEmployee: true,
          employeeId: empId,
          dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0],
          sortBy: 'date',
          sortOrder: 'DESC',
        },
      };
      const response = await hrAPI.getAttendance(payload);
      if (response.data?.success) {
        setAllData(response.data.data || []);
      } else {
        setAllData([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [empId]);

  useEffect(() => {
    if (empId) fetchData();
  }, [empId, fetchData]);

  const handleClockIn = () => {
    setFaceAction('checkin');
    setShowFaceModal(true);
  };

  const handleClockOut = () => {
    setFaceAction('checkout');
    setShowFaceModal(true);
  };

  const handleFaceSuccess = () => {
    setShowFaceModal(false);
    toast.success(`${faceAction === 'checkin' ? 'Check‑in' : 'Check‑out'} recorded!`);
    fetchData();
  };

  if (!empId) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-gray-500">
        No employee linked to your account.
      </div>
    );
  }

  const hasCheckedIn = todayAttendance?.check_in;
  const hasCheckedOut = todayAttendance?.check_out;
  const checkInCoords = getCoordinates(todayAttendance?.check_in_location);
  const checkOutCoords = getCoordinates(todayAttendance?.check_out_location);

  const renderActionButton = () => {
    if (loading) return null;
    if (error) {
      return (
        <div className="flex items-center justify-center gap-1 text-red-600 text-xs py-2">
          <AlertCircle className="w-4 h-4" />
          Could not load status
        </div>
      );
    }
    if (hasCheckedOut) {
      return (
        <div className="flex items-center justify-center gap-1.5 text-green-600 text-xs font-medium py-2">
          <CheckCircle className="w-4 h-4" />
          You're done for today!
        </div>
      );
    }
    if (!hasCheckedIn) {
      return (
        <button
          onClick={handleClockIn}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow"
        >
          <LogIn className="w-4 h-4" />
          Clock In
        </button>
      );
    }
    if (hasCheckedIn && !hasCheckedOut) {
      return (
        <button
          onClick={handleClockOut}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-semibold shadow"
        >
          <LogOut className="w-4 h-4" />
          Clock Out
        </button>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row lg:gap-4 max-w-screen-xl mx-auto p-2 lg:p-4">
      <div className="lg:w-1/2 lg:max-w-md space-y-4">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-primary-700">Today’s Attendance</h2>
            <button
              onClick={fetchData}
              className="p-0.5 rounded hover:bg-primary-50"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && !loading && (
            <div className="flex items-center gap-1 p-1.5 mb-2 bg-red-50 text-red-700 rounded text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-3 text-xs text-gray-400">
              <Loader className="w-4 h-4 mx-auto mb-1 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check‑in</span>
                  <span className="font-medium text-gray-800">
                    {hasCheckedIn ? new Date(todayAttendance.check_in).toLocaleTimeString() : '—'}
                  </span>
                </div>
                {checkInCoords && (
                  <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{formatCoord(checkInCoords)}</span>
                    <a href={getMapsLink(checkInCoords)} target="_blank" rel="noopener noreferrer"
                       className="text-primary-600 hover:underline inline-flex items-center gap-0.5">
                      <ExternalLink className="w-3 h-3" /> Map
                    </a>
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check‑out</span>
                  <span className="font-medium text-gray-800">
                    {hasCheckedOut ? new Date(todayAttendance.check_out).toLocaleTimeString() : '—'}
                  </span>
                </div>
                {checkOutCoords && (
                  <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{formatCoord(checkOutCoords)}</span>
                    <a href={getMapsLink(checkOutCoords)} target="_blank" rel="noopener noreferrer"
                       className="text-primary-600 hover:underline inline-flex items-center gap-0.5">
                      <ExternalLink className="w-3 h-3" /> Map
                    </a>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium capitalize ${todayAttendance?.status === 'present' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {todayAttendance?.status || 'Not recorded'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {renderActionButton()}
        </div>

        <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3" />
          Your location will be recorded
        </p>
      </div>

      <div className="lg:w-1/2 lg:flex-1 mt-4 lg:mt-0">
        <div className="bg-white rounded-lg shadow p-3 h-full">
          <h2 className="text-sm font-semibold text-primary-700 mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary-600" />
            Last 30 Days
          </h2>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader className="w-5 h-5 text-primary-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-1 p-2 bg-red-50 text-red-700 rounded text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          ) : allData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No recent records.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-gray-500 border-b">
                  <tr>
                    <th className="pb-1.5 font-medium">Date</th>
                    <th className="pb-1.5 font-medium">In</th>
                    <th className="pb-1.5 font-medium">Out</th>
                    <th className="pb-1.5 font-medium">Status</th>
                    <th className="pb-1.5 font-medium">Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allData.map((log) => {
                    const shiftName = getShiftName(log);
                    return (
                      <tr key={log.attendance_id} className="hover:bg-gray-50">
                        <td className="py-1 text-gray-700">
                          {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-1">
                          {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-1">
                          {log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-1">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="py-1 text-gray-600">{shiftName || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        {showFaceModal && (
          <FaceVerifyModal
            show={showFaceModal}
            onClose={() => setShowFaceModal(false)}
            employeeId={empId}
            action={faceAction}
            onSuccess={handleFaceSuccess}
          />
        )}
      </Suspense>
    </div>
  );
};

export default AttendanceClockScreen;
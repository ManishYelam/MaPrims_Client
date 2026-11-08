import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, LogOut, Play, QrCode, Loader, MessageCircle } from 'lucide-react';
import { whatsappAPI } from '../../services/api';

// Helper: format ISO date to readable string with seconds and AM/PM
const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

// Memoized status badge
const StatusBadge = React.memo(({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
});

// Memoized action buttons
const ActionButtons = React.memo(({
  sessionName,
  status,
  actionLoading,
  onStart,
  onGetQR,
  onLogout,
  onDelete,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {status !== 'connected' && (
        <button
          onClick={() => onStart(sessionName)}
          disabled={actionLoading === 'start'}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 disabled:opacity-50"
        >
          {actionLoading === 'start' ? <Loader size={14} className="animate-spin" /> : <Play size={14} />}
          Start Session
        </button>
      )}

      <button
        onClick={() => onGetQR(sessionName)}
        disabled={actionLoading === 'qr'}
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 disabled:opacity-50"
      >
        {actionLoading === 'qr' ? <Loader size={14} className="animate-spin" /> : <QrCode size={14} />}
        Show QR
      </button>

      {status === 'connected' && (
        <button
          onClick={() => onLogout(sessionName)}
          disabled={actionLoading === 'logout'}
          className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 disabled:opacity-50"
        >
          {actionLoading === 'logout' ? <Loader size={14} className="animate-spin" /> : <LogOut size={14} />}
          Logout
        </button>
      )}

      <button
        onClick={() => onDelete(sessionName)}
        disabled={actionLoading === 'delete'}
        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 disabled:opacity-50"
      >
        {actionLoading === 'delete' ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
        Delete
      </button>
    </div>
  );
});

// Main component
const WhatsAppAccounts = ({ userId }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, qrCode: '', sessionName: '' });
  const [formData, setFormData] = useState({ account_name: '', whatsapp_number: '', session_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const pollIntervalRef = useRef(null);
  const qrTimeoutRef = useRef(null);

  const fetchAccounts = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await whatsappAPI.listAccounts(userId);
      setAccounts(prev => {
        const newData = response.data;
        if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
        return newData;
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch accounts', err);
      setError('Could not load accounts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAccounts();
      pollIntervalRef.current = setInterval(fetchAccounts, 10000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
    };
  }, [userId, fetchAccounts]);

  useEffect(() => {
    if (!qrModal.open && qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
      qrTimeoutRef.current = null;
    }
  }, [qrModal.open]);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await whatsappAPI.createAccount({ ...formData, user_id: userId });
      setShowCreateModal(false);
      setFormData({ account_name: '', whatsapp_number: '', session_name: '' });
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.error || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  }, [formData, userId, fetchAccounts]);

  const handleStartSession = useCallback(async (sessionName) => {
    setActionLoading(prev => ({ ...prev, [sessionName]: 'start' }));
    try {
      await whatsappAPI.startSession(sessionName);

      let attempts = 0;
      const maxAttempts = 8;
      const pollForQR = async () => {
        try {
          const qrResponse = await whatsappAPI.getQR(sessionName);
          if (qrResponse.data?.qr_code) {
            setQrModal({ open: true, qrCode: qrResponse.data.qr_code, sessionName });
            return true;
          }
        } catch (err) {
          // QR not ready yet
        }
        attempts++;
        if (attempts < maxAttempts) {
          qrTimeoutRef.current = setTimeout(pollForQR, 1000 * Math.min(1.5, attempts * 0.5));
        } else {
          alert('QR generation is taking longer than expected. Please click "Show QR" in a few seconds.');
        }
        return false;
      };
      pollForQR();
      setTimeout(() => fetchAccounts(), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Start failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionName]: false }));
    }
  }, [fetchAccounts]);

  const handleGetQR = useCallback(async (sessionName) => {
    setActionLoading(prev => ({ ...prev, [sessionName]: 'qr' }));
    try {
      const response = await whatsappAPI.getQR(sessionName);
      if (response.data?.qr_code) {
        setQrModal({ open: true, qrCode: response.data.qr_code, sessionName });
      } else {
        alert('QR code not available yet. Please try again.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'QR not available');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionName]: false }));
    }
  }, []);

  const handleLogout = useCallback(async (sessionName) => {
    if (!window.confirm('Logout from WhatsApp? You will need to scan QR again to reconnect.')) return;
    setActionLoading(prev => ({ ...prev, [sessionName]: 'logout' }));
    try {
      await whatsappAPI.logout(sessionName);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Logout failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionName]: false }));
    }
  }, [fetchAccounts]);

  const handleDelete = useCallback(async (sessionName) => {
    if (!window.confirm('Delete account permanently? This action cannot be undone.')) return;
    setActionLoading(prev => ({ ...prev, [sessionName]: 'delete' }));
    try {
      await whatsappAPI.deleteAccount(sessionName);
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionName]: false }));
    }
  }, [fetchAccounts]);

  const accountItems = useMemo(() => {
    if (accounts.length === 0) {
      return <div className="col-span-full text-center py-8 text-gray-500">No WhatsApp accounts. Click "Add Account" to start.</div>;
    }
    return accounts.map(acc => (
      <div key={acc.session_name} className="border border-gray-200 rounded-xl p-4 bg-white h-full">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <h3 className="font-medium text-gray-900">{acc.account_name}</h3>
            </div>
            <p className="text-sm text-gray-600">{acc.whatsapp_number || 'No number'}</p>
            <p className="text-xs text-gray-500 mt-1">Session: {acc.session_name}</p>
            <p className="text-xs text-gray-500 mt-1">Created: {formatDateTime(acc.created_at)}</p>
            <p className="text-xs text-gray-500">Updated: {formatDateTime(acc.updated_at)}</p>
          </div>
          <div><StatusBadge status={acc.status} /></div>
        </div>
        <ActionButtons
          sessionName={acc.session_name}
          status={acc.status}
          actionLoading={actionLoading[acc.session_name]}
          onStart={handleStartSession}
          onGetQR={handleGetQR}
          onLogout={handleLogout}
          onDelete={handleDelete}
        />
      </div>
    ));
  }, [accounts, actionLoading, handleStartSession, handleGetQR, handleLogout, handleDelete]);

  if (loading && accounts.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-gray-900">WhatsApp Accounts</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

      {/* Three-column grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountItems}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add WhatsApp Account</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.account_name}
                  onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">WhatsApp Number (optional)</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+1234567890"
                  value={formData.whatsapp_number}
                  onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Name (unique)</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.session_name}
                  onChange={e => setFormData({ ...formData, session_name: e.target.value })}
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary-600 text-white rounded-lg py-2 hover:bg-primary-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">Session: {qrModal.sessionName}</p>
            <div className="flex justify-center bg-white p-4 rounded-xl">
              <QRCodeSVG value={qrModal.qrCode} size={200} />
            </div>
            <p className="text-xs text-gray-500 mt-4">Open WhatsApp → Linked Devices → Link a Device</p>
            <button
              onClick={() => setQrModal({ open: false, qrCode: '', sessionName: '' })}
              className="mt-4 w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(WhatsAppAccounts);
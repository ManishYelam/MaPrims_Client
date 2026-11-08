// src/modules/StockPoints/UsersForStockPointModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Users, AlertCircle } from 'lucide-react';
import { stockPointsAPI } from '../../../../services/api';

const UsersForStockPointModal = ({ show, stockPoint, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show || !stockPoint?.stock_po_id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await stockPointsAPI.getUsersByStockPoint(stockPoint.stock_po_id);
        if (!cancelled) {
          const payload = res.data;
          setUsers(payload?.data || payload?.users || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load users');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [show, stockPoint]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between p-2.5 border-b">
          <div>
            <h3 className="text-sm font-semibold">Users for {stockPoint.stock_point_code}</h3>
            <p className="text-[11px] text-gray-500">{stockPoint.stock_point_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5">
          {loading ? (
            <p className="text-xs text-gray-500 text-center py-6">Loading...</p>
          ) : error ? (
            <p className="text-xs text-red-600 text-center py-6 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-6 h-6 text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-500">No users mapped to this stock point</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {users.map(u => {
                const id = u.user_id ?? u.id;
                const name = u.full_name || u.name || `User ${id}`;
                return (
                  <li key={id} className="py-1.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[10px] flex items-center justify-center font-medium">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{u.email || '—'}</p>
                    </div>
                    <span className="text-[10px] text-gray-500">{u.role || ''}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(UsersForStockPointModal);
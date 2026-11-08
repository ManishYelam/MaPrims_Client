import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ show, title, message, type = 'confirm', onConfirm, onCancel }) => {
  if (!show) return null;

  const isDelete = type === 'delete' || type === 'bulkDelete';
  const iconColor = isDelete ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600';
  const btnColor = isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-2 p-3 border-b border-gray-200">
          <div className={`p-1.5 rounded-full ${iconColor}`}>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-600">This action cannot be undone</p>
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-700">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200">
          <button onClick={onCancel} className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className={`px-2 py-1 text-xs font-medium text-white rounded ${btnColor}`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
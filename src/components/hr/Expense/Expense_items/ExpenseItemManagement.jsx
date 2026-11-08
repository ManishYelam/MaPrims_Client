import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Upload, Download, FileText } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import ExpenseItemModal from './ExpenseItemModal';

const ExpenseItemManagement = ({ expenseId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hrAPI.getExpenseItems(expenseId);
      setItems(res.data?.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = () => { setEditingItem(null); setShowItemModal(true); };
  const handleEdit = (item) => { setEditingItem(item); setShowItemModal(true); };
  const handleDelete = async (itemId) => {
    if (window.confirm('Delete this item?')) {
      try {
        await hrAPI.deleteExpenseItem(expenseId, itemId);
        fetchItems();
        showToast('Item deleted');
      } catch (err) {
        showToast('Delete failed', 'error');
      }
    }
  };

  const handleSaved = () => { setShowItemModal(false); fetchItems(); showToast('Item saved'); };

  // CSV Import for items
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }
    setImportLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        throw new Error('CSV file is empty');
      }
      const headers = lines[0].split(',').map(h => h.trim());
      const required = ['description', 'category', 'expense_date', 'total_amount'];
      const missing = required.filter(h => !headers.includes(h));
      if (missing.length) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`);
      }

      const itemsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, idx) => (obj[h] = values[idx]));
        itemsToImport.push({
          description: obj.description,
          category: obj.category || 'other',
          expense_date: obj.expense_date,
          total_amount: parseFloat(obj.total_amount),
          // Any additional fields can be mapped here
        });
      }

      // Validate and create items
      await Promise.all(itemsToImport.map(item => hrAPI.createExpenseItem(expenseId, item)));
      showToast(`Imported ${itemsToImport.length} items successfully`);
      setShowImportModal(false);
      fetchItems();
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  }, [expenseId, fetchItems, showToast]);

  const downloadSample = () => {
    const headers = ['description', 'category', 'expense_date', 'total_amount'];
    const sampleRow = ['Lunch with client', 'food', '2025-01-15', '500.00'];
    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'expense_items_sample.csv';
    link.click();
  };

  if (loading) return <div className="p-4 text-xs">Loading items...</div>;
  if (error) return <div className="p-4 text-xs text-red-600">{error}</div>;

  return (
    <div className="p-2">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg border text-xs font-medium ${
          toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Expense Items</h3>
        <div className="flex gap-1">
          <button
            onClick={downloadSample}
            className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50"
            title="Download sample CSV"
          >
            <FileText className="w-2.5 h-2.5" /> Sample
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded text-[10px] text-gray-700 hover:bg-gray-50"
            title="Import items from CSV"
          >
            <Upload className="w-2.5 h-2.5" /> Import
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-[10px]"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-base font-semibold">Import Expense Items</h3>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-gray-600 mb-3">
                Upload CSV with columns: <strong>description, category, expense_date, total_amount</strong>
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-csv-expense-item"
                />
                <label htmlFor="import-csv-expense-item" className="cursor-pointer block">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-medium">Choose CSV file</p>
                </label>
              </div>
              {importLoading && (
                <div className="mt-3 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-[10px] mt-1">Importing...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-gray-500">No items yet.</p>
      ) : (
        <table className="w-full text-[10px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left">Description</th>
              <th className="px-2 py-1 text-left">Category</th>
              <th className="px-2 py-1 text-left">Date</th>
              <th className="px-2 py-1 text-left">Amount</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.expense_item_id} className="border-t">
                <td className="px-2 py-1">{item.description}</td>
                <td className="px-2 py-1">{item.category?.replace('_',' ')}</td>
                <td className="px-2 py-1">{item.expense_date ? new Date(item.expense_date).toLocaleDateString() : '—'}</td>
                <td className="px-2 py-1">₹{parseFloat(item.total_amount).toLocaleString()}</td>
                <td className="px-2 py-1 flex gap-1">
                  <button onClick={() => handleEdit(item)} className="text-gray-600"><Edit className="w-3 h-3"/></button>
                  <button onClick={() => handleDelete(item.expense_item_id)} className="text-red-600"><Trash2 className="w-3 h-3"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ExpenseItemModal
        show={showItemModal}
        record={editingItem}
        expenseId={expenseId}
        onClose={() => setShowItemModal(false)}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default ExpenseItemManagement;
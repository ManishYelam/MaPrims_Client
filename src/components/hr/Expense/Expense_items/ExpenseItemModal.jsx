import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const ExpenseItemModal = ({ show, record, expenseId, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    description: '', category: 'other', expense_date: '',
    quantity: 1, unit_price: 0, amount: 0, tax_amount: 0, total_amount: 0,
    vendor_name: '', invoice_number: '', reimbursable: true
  });

  useEffect(() => {
    if (record) {
      setForm({
        description: record.description || '', category: record.category || 'other',
        expense_date: record.expense_date || '', quantity: record.quantity || 1,
        unit_price: record.unit_price || 0, amount: record.amount || 0,
        tax_amount: record.tax_amount || 0, total_amount: record.total_amount || 0,
        vendor_name: record.vendor_name || '', invoice_number: record.invoice_number || '',
        reimbursable: record.reimbursable ?? true
      });
    } else {
      setForm({ description: '', category: 'other', expense_date: '', quantity: 1, unit_price: 0, amount: 0, tax_amount: 0, total_amount: 0, vendor_name: '', invoice_number: '', reimbursable: true });
    }
    setErrors({});
  }, [record, show]);

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'unit_price' || field === 'tax_amount') {
        const qty = parseFloat(updated.quantity) || 0;
        const price = parseFloat(updated.unit_price) || 0;
        const tax = parseFloat(updated.tax_amount) || 0;
        updated.amount = qty * price;
        updated.total_amount = updated.amount + tax;
      }
      return updated;
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.expense_date) errs.expense_date = 'Date is required';
    if (form.total_amount <= 0) errs.total_amount = 'Total must be > 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, quantity: parseFloat(form.quantity), unit_price: parseFloat(form.unit_price), amount: parseFloat(form.amount), tax_amount: parseFloat(form.tax_amount), total_amount: parseFloat(form.total_amount) };
      if (record) {
        await hrAPI.updateExpenseItem(expenseId, record.expense_item_id, payload);
      } else {
        await hrAPI.addExpenseItem(expenseId, payload);
      }
      onSaved();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-md max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-sm font-semibold">{record ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} disabled={loading}><X className="w-4 h-4"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[10px]">
          <div><label className="block font-medium mb-0.5">Description *</label><input value={form.description} onChange={e => handleChange('description', e.target.value)} className={`w-full border rounded px-2 py-1 ${errors.description ? 'border-red-500' : ''}`} disabled={loading} />{errors.description && <p className="text-red-600 text-[9px]">{errors.description}</p>}</div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block font-medium mb-0.5">Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading}>
                <option value="travel">Travel</option><option value="food">Food</option><option value="accommodation">Accommodation</option><option value="transport">Transport</option><option value="medical">Medical</option><option value="training">Training</option><option value="office_supplies">Office Supplies</option><option value="client_meeting">Client Meeting</option><option value="internet">Internet</option><option value="other">Other</option>
              </select>
            </div>
            <div><label className="block font-medium mb-0.5">Date *</label><input type="date" value={form.expense_date} onChange={e => handleChange('expense_date', e.target.value)} className={`w-full border rounded px-2 py-1 ${errors.expense_date ? 'border-red-500' : ''}`} disabled={loading} />{errors.expense_date && <p className="text-red-600 text-[9px]">{errors.expense_date}</p>}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block font-medium mb-0.5">Qty</label><input type="number" value={form.quantity} onChange={e => handleChange('quantity', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} /></div>
            <div><label className="block font-medium mb-0.5">Unit Price</label><input type="number" value={form.unit_price} onChange={e => handleChange('unit_price', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} /></div>
            <div><label className="block font-medium mb-0.5">Tax</label><input type="number" value={form.tax_amount} onChange={e => handleChange('tax_amount', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block font-medium mb-0.5">Amount</label><input type="number" value={form.amount} readOnly className="w-full border rounded px-2 py-1 bg-gray-100" /></div>
            <div><label className="block font-medium mb-0.5">Total *</label><input type="number" value={form.total_amount} readOnly className={`w-full border rounded px-2 py-1 bg-gray-100 ${errors.total_amount ? 'border-red-500' : ''}`} />{errors.total_amount && <p className="text-red-600 text-[9px]">{errors.total_amount}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block font-medium mb-0.5">Vendor</label><input value={form.vendor_name} onChange={e => handleChange('vendor_name', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} /></div>
            <div><label className="block font-medium mb-0.5">Invoice #</label><input value={form.invoice_number} onChange={e => handleChange('invoice_number', e.target.value)} className="w-full border rounded px-2 py-1" disabled={loading} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.reimbursable} onChange={e => handleChange('reimbursable', e.target.checked)} className="rounded" disabled={loading} />
            <label className="text-[10px]">Reimbursable</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-3 border-t bg-gray-50">
          <button onClick={onClose} className="px-3 py-1 border rounded bg-white" disabled={loading}>Cancel</button>
          <button onClick={handleSave} className="px-3 py-1 bg-primary-600 text-white rounded flex items-center gap-1" disabled={loading}><Save className="w-3 h-3"/> {loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseItemModal;
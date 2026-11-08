// src/components/SystemSettings/BranchSelectionModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Check, Loader } from 'lucide-react';
import { branchAPI } from '../../../services/api';

const BranchSelectionModal = ({ show, onClose, onSelect, selectedBranchId = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(selectedBranchId);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;
    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await branchAPI.getBranches();
        const branchesData = response.data?.data?.data || response.data?.data || [];
        setBranches(branchesData);
      } catch (err) {
        setError('Failed to load branches');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, [show]);

  useEffect(() => {
    setSelectedId(selectedBranchId);
  }, [selectedBranchId]);

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches;
    const query = searchQuery.toLowerCase();
    return branches.filter(b =>
      b.branch_name?.toLowerCase().includes(query) ||
      b.branch_code?.toLowerCase().includes(query) ||
      b.address?.toLowerCase().includes(query) ||
      b.phone?.includes(query) ||
      b.email?.toLowerCase().includes(query)
    );
  }, [branches, searchQuery]);

  if (!show) return null;

  const handleSelect = (branch) => {
    setSelectedId(branch.branch_id);
  };

  const handleConfirm = () => {
    const selected = branches.find(b => b.branch_id === selectedId);
    onSelect(selected || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold">Select Branch</h2>
            <p className="text-xs text-gray-500">Choose a branch</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, code, address, phone, email..." className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader className="w-6 h-6 text-primary-500 animate-spin" /><span className="ml-2 text-sm">Loading branches...</span></div>
            ) : error ? (
              <div className="p-4 text-center text-red-600 text-sm">{error}</div>
            ) : filteredBranches.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No branches found.</div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b border-gray-200">
                  <tr>
                    <th className="text-left p-2 text-xs font-medium">Code</th>
                    <th className="text-left p-2 text-xs font-medium">Name</th>
                    <th className="text-left p-2 text-xs font-medium">Address</th>
                    <th className="text-left p-2 text-xs font-medium">Phone</th>
                    <th className="text-left p-2 text-xs font-medium">Email</th>
                    <th className="text-center p-2 text-xs font-medium w-16">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBranches.map(branch => {
                    const isSelected = branch.branch_id === selectedId;
                    return (
                      <tr key={branch.branch_id} onClick={() => handleSelect(branch)} className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <td className="p-2"><code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{branch.branch_code}</code></td>
                        <td className="p-2"><span className="text-xs font-medium">{branch.branch_name}</span></td>
                        <td className="p-2"><span className="text-xs text-gray-700 truncate max-w-[150px]" title={branch.address}>{branch.address}</span></td>
                        <td className="p-2"><span className="text-xs">{branch.phone}</span></td>
                        <td className="p-2"><span className="text-xs truncate max-w-[150px]" title={branch.email}>{branch.email}</span></td>
                        <td className="p-2 text-center">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-600">{selectedId ? 'Branch selected' : 'No branch selected'}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
            <button onClick={handleConfirm} disabled={loading} className="px-3 py-1.5 text-xs font-medium text-white rounded bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300">Select</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchSelectionModal;
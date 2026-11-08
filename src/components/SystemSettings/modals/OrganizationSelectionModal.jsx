// src/components/SystemSettings/OrganizationSelectionModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Check, Loader } from 'lucide-react';
import { organizationAPI } from '../../../services/api';

const OrganizationSelectionModal = ({ show, onClose, onSelect, selectedOrgId = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(selectedOrgId);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;
    const fetchOrgs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await organizationAPI.getOrganizations();
        const orgs = response.data?.data?.data || response.data?.data || [];
        setOrganizations(orgs);
      } catch (err) {
        setError('Failed to load organizations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, [show]);

  useEffect(() => {
    setSelectedId(selectedOrgId);
  }, [selectedOrgId]);

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const query = searchQuery.toLowerCase();
    return organizations.filter(org =>
      org.name?.toLowerCase().includes(query) ||
      org.branch?.toLowerCase().includes(query) ||
      org.email?.toLowerCase().includes(query) ||
      org.phone?.includes(query)
    );
  }, [organizations, searchQuery]);

  if (!show) return null;

  const handleSelect = (org) => {
    setSelectedId(org.org_id);
  };

  const handleConfirm = () => {
    const selected = organizations.find(org => org.org_id === selectedId);
    onSelect(selected || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[70]">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Select Organization</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose an organization</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, branch, email, phone..."
              className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 text-primary-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-600">Loading organizations...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600 text-sm">{error}</div>
            ) : filteredOrganizations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                {organizations.length === 0 ? 'No organizations found.' : 'No match found.'}
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b border-gray-200">
                  <tr>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">Branch</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-700 uppercase tracking-wider">Phone</th>
                    <th className="text-center p-2 text-xs font-medium text-gray-700 uppercase tracking-wider w-16">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrganizations.map((org) => {
                    const isSelected = org.org_id === selectedId;
                    return (
                      <tr
                        key={org.org_id}
                        onClick={() => handleSelect(org)}
                        className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="p-2">
                          <span className="text-xs font-medium text-gray-900">{org.name}</span>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-gray-700">{org.branch}</span>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-gray-700 truncate max-w-[150px]" title={org.email}>
                            {org.email}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-gray-700">{org.phone}</span>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 hover:border-gray-400'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
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

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {selectedId ? 'Organization selected' : 'No organization selected'}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-white rounded bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSelectionModal;
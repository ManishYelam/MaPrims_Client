// src/components/SystemSettings/BranchManagement.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  CheckCircle, XCircle, Edit, Plus, Activity, X, Save,
  MapPin, Phone, Mail, Building,
} from 'lucide-react';
import { branchAPI } from '../../../services/api';

// Validation schema
const branchSchema = yup.object({
  branch_code: yup.string().required('Branch code is required'),
  branch_name: yup.string().required('Branch name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  extra_metadata: yup.string(), // optional description
});

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [showBranches, setShowBranches] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchStatus, setBranchStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(branchSchema),
    defaultValues: {
      branch_code: '',
      branch_name: '',
      address: '',
      phone: '',
      email: '',
      extra_metadata: '',
    },
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Load branches from backend
  const loadBranches = async () => {
    setLoading(true);
    try {
      const response = await branchAPI.getBranches();
      // Expected response: { success: true, data: { data: [...], totalItems, ... } }
      const branchesData = response.data?.data?.data || response.data?.data || [];
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
      showMessage('error', 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, );

  const openNewModal = () => {
    setEditingBranch(null);
    setBranchStatus('active');
    reset({
      branch_code: '',
      branch_name: '',
      address: '',
      phone: '',
      email: '',
      extra_metadata: '',
    });
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setBranchStatus(branch.status || 'active');
    setValue('branch_code', branch.branch_code);
    setValue('branch_name', branch.branch_name);
    setValue('address', branch.address || '');
    setValue('phone', branch.phone || '');
    setValue('email', branch.email || '');
    setValue('extra_metadata', branch.extra_metadata ? JSON.stringify(branch.extra_metadata) : '');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingBranch(null);
    reset();
  };

  const handleFormSubmit = async (data) => {
    setSaving(true);
    try {
      // Prepare payload matching backend Branch model
      const payload = {
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        status: branchStatus,
        extra_metadata: data.extra_metadata ? JSON.parse(data.extra_metadata) : null,
        // Optional: add org_id if needed (default from user context)
      };

      if (editingBranch) {
        await branchAPI.updateBranch(editingBranch.branch_id, payload);
        showMessage('success', 'Branch updated successfully!');
      } else {
        await branchAPI.addBranch(payload);
        showMessage('success', 'Branch created successfully!');
      }
      closeModal();
      loadBranches(); // refresh list
    } catch (error) {
      console.error('Error saving branch:', error);
      showMessage('error', error.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const testBranch = (branch) => {
    showMessage('info', `Testing branch: ${branch.branch_code}...`);
    setTimeout(() => {
      showMessage('success', `Test for ${branch.branch_code} completed!`);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Message display (same as before) */}
      {message.text && (
        <div className={`rounded-lg p-3 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' :
          message.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600 mr-2" /> :
             message.type === 'error' ? <XCircle className="w-4 h-4 text-red-600 mr-2" /> :
             <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />}
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Branch Management</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Manage your branch locations ({branches.length} total)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBranches(!showBranches)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <Building className="w-3.5 h-3.5" />
              <span>{showBranches ? 'Hide' : 'Show'} Table</span>
            </button>
            <button
              onClick={openNewModal}
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {showBranches && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="table-fixed w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-20 px-2 py-1.5">Status</th>
                <th className="w-24 px-2 py-1.5">Code</th>
                <th className="w-32 px-2 py-1.5">Name</th>
                <th className="w-48 px-2 py-1.5">Address</th>
                <th className="w-28 px-2 py-1.5">Phone</th>
                <th className="w-36 px-2 py-1.5">Email</th>
                <th className="w-20 px-2 py-1.5">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
              ) : branches.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">No branches found.</td></tr>
              ) : (
                branches.map((branch) => {
                  const isActive = branch.status === 'active';
                  return (
                    <tr key={branch.branch_id} className={`hover:bg-gray-50 ${isActive ? 'bg-green-50' : ''}`}>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className={`inline-flex px-1 py-0.5 rounded text-xs font-medium ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>{branch.status}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5"><code className="bg-gray-100 px-1 py-0.5 rounded">{branch.branch_code}</code></td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center space-x-1">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">{branch.branch_name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 truncate" title={branch.address}>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{branch.address}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{branch.phone}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 truncate" title={branch.email}>
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{branch.email}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center space-x-0.5">
                          <button onClick={() => openEditModal(branch)} className="text-blue-600 hover:text-blue-800 p-0.5">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => testBranch(branch)} className="text-purple-600 hover:text-purple-800 p-0.5">
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold">{editingBranch ? 'Edit Branch' : 'New Branch'}</h2>
                <p className="text-xs text-gray-600">{editingBranch ? `Editing: ${editingBranch.branch_code}` : 'Create a new branch'}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Branch Code *</label>
                  <input type="text" {...register('branch_code')} className={`w-full px-2.5 py-2 text-sm border rounded-lg ${errors.branch_code ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} placeholder="e.g., BLR001" />
                  {errors.branch_code && <p className="mt-1 text-xs text-red-600">{errors.branch_code.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Branch Name *</label>
                  <input type="text" {...register('branch_name')} className={`w-full px-2.5 py-2 text-sm border rounded-lg ${errors.branch_name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} placeholder="e.g., Downtown Branch" />
                  {errors.branch_name && <p className="mt-1 text-xs text-red-600">{errors.branch_name.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Address *</label>
                  <textarea {...register('address')} rows="2" className={`w-full px-2.5 py-2 text-sm border rounded-lg ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} placeholder="Full address" />
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone *</label>
                  <input type="text" {...register('phone')} className={`w-full px-2.5 py-2 text-sm border rounded-lg ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} placeholder="+1 234 567 8900" />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" {...register('email')} className={`w-full px-2.5 py-2 text-sm border rounded-lg ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} placeholder="branch@example.com" />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Description (metadata)</label>
                  <textarea {...register('extra_metadata')} rows="2" className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded-lg" placeholder='{"notes": "optional info"}' />
                </div>
                {editingBranch && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-xs text-gray-600">Set as active/inactive</p>
                    </div>
                    <button type="button" onClick={() => setBranchStatus(branchStatus === 'active' ? 'inactive' : 'active')}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${branchStatus === 'active' ? 'bg-primary-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${branchStatus === 'active' ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => testBranch(editingBranch || { branch_code: 'NEW' })} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5" /><span>Test</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={closeModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium">Cancel</button>
                    <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-1.5 disabled:opacity-50">
                      <Save className="w-3.5 h-3.5" /><span>{saving ? 'Saving...' : editingBranch ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
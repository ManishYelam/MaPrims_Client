// src/modules/Departments/DepartmentModal.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  X, Save, Building2, Code, AlertCircle, RefreshCw,
  Layers, Briefcase, MapPin, Users, ChevronDown, ChevronUp, ChevronRight,
  Eye,
} from 'lucide-react';
import { hrAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const DepartmentSelectionModal = lazy(() => import('./DepartmentSelectionModal'));
const EmployeeSelectionModal = lazy(() => import('../Employees/EmployeeSelectionModal'));
const CostCenterSelectionModal = lazy(() => import('../../Stores/MasterData/CostCenters/CostCenterSelectionModal'));
const WorkLocationSelectionModal = lazy(() => import('../Attendance/Work_locations/WorkLocationSelectionModal'));

const generateCodeFromName = (name) => {
  if (!name || !name.trim()) return '';
  const words = name.trim().split(/\s+/);
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 5);
};

const DepartmentModal = ({
  show, department, onClose, onSaved,
  departments = [], employees = [], readOnly = false,
}) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showParentModal, setShowParentModal] = useState(false);
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [showCostCenterModal, setShowCostCenterModal] = useState(false);
  const [showWorkLocationModal, setShowWorkLocationModal] = useState(false);
  const [selectedHead, setSelectedHead] = useState(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState(null);
  const [selectedWorkLocation, setSelectedWorkLocation] = useState(null);
  const [loadingWorkLocation, setLoadingWorkLocation] = useState(false);
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  const isEdit = !!department;
  const isDisabled = saveLoading || readOnly;

  const [formData, setFormData] = useState({
    name: '', code: '', description: '', department_type: 'business',
    parent_id: '', head_id: '', budget: '',
    cost_center_id: '',
    location_id: '', email: '', phone: '', established_date: '', custom_fields: '',
  });

  const defaultCustomFields = `{
  "mission": "",
  "vision": "",
  "team_size": 0,
  "key_projects": [],
  "additional_notes": ""
}`;

  const departmentTypes = [
    { value: 'business', label: 'Business', icon: Briefcase },
    { value: 'support', label: 'Support', icon: Users },
    { value: 'operations', label: 'Operations', icon: Layers },
    { value: 'administration', label: 'Administration', icon: Building2 },
  ];

  const selectedParentName = useMemo(() => {
    if (!formData.parent_id) return 'None';
    const parent = departments.find(d => d.dept_id === formData.parent_id);
    return parent ? parent.name : 'None';
  }, [formData.parent_id, departments]);

  const displayCostCenter = useMemo(() => {
    if (selectedCostCenter) {
      const code = selectedCostCenter.cost_center_code || '';
      const name = selectedCostCenter.cost_center_name || '';
      if (code && name) return `${code} — ${name}`;
      if (code) return code;
      if (name) return name;
    }
    if (formData.cost_center_id) return `ID: ${formData.cost_center_id}`;
    return 'None';
  }, [selectedCostCenter, formData.cost_center_id]);

  const displayWorkLocation = useMemo(() => {
    if (loadingWorkLocation) return 'Loading...';
    if (selectedWorkLocation) {
      const name = selectedWorkLocation.name || selectedWorkLocation.work_location_name || '';
      const code = selectedWorkLocation.code || selectedWorkLocation.work_location_code || '';
      if (name && code) return `${name} (${code})`;
      if (name) return name;
      if (code) return code;
    }
    if (formData.location_id) return `ID: ${formData.location_id}`;
    return 'None';
  }, [selectedWorkLocation, formData.location_id, loadingWorkLocation]);

  const validateJSON = useCallback(jsonString => {
    try {
      if (!jsonString?.trim()) { setJsonError(null); return true; }
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object') { setJsonError('Custom fields must be a JSON object'); return false; }
      setJsonError(null); return true;
    } catch (error) {
      setJsonError(`Invalid JSON: ${error.message}`); return false;
    }
  }, []);

  useEffect(() => {
    if (!show) {
      setSelectedHead(null);
      setSelectedCostCenter(null);
      setSelectedWorkLocation(null);
      setLoadingWorkLocation(false);
      setShowParentModal(false);
      setShowHeadModal(false);
      setShowCostCenterModal(false);
      setShowWorkLocationModal(false);
      return;
    }

    if (department) {
      setFormData({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        department_type: department.department_type || 'business',
        parent_id: department.parent_id || '',
        head_id: department.head_id || '',
        budget: department.budget ?? '',
        cost_center_id: department.cost_center_id || '',
        location_id: department.location_id || '',
        email: department.email || '',
        phone: department.phone || '',
        established_date: department.established_date || '',
        custom_fields: department.custom_fields
          ? (() => {
              try {
                const cf = typeof department.custom_fields === 'string'
                  ? JSON.parse(department.custom_fields)
                  : department.custom_fields;
                return JSON.stringify(cf, null, 2);
              } catch (e) { return ''; }
            })()
          : '',
      });
      setAutoGenerateCode(!department.code);

      if (department.head_id && employees.length) {
        const head = employees.find(emp => emp.emp_id === department.head_id);
        setSelectedHead(head || null);
      } else {
        setSelectedHead(null);
      }

      if (department.cost_center) {
        setSelectedCostCenter(department.cost_center);
      } else if (department.cost_center_code || department.cost_center_name) {
        setSelectedCostCenter({
          cost_center_id: department.cost_center_id,
          cost_center_code: department.cost_center_code,
          cost_center_name: department.cost_center_name,
        });
      } else {
        setSelectedCostCenter(null);
      }

      if (department.work_location) {
        setSelectedWorkLocation(department.work_location);
        setLoadingWorkLocation(false);
      } else if (department.location_id) {
        setLoadingWorkLocation(true);
        (async () => {
          try {
            const res = await hrAPI.getWorklocation(department.location_id);
            if (res.data) setSelectedWorkLocation(res.data);
            else setSelectedWorkLocation({ work_location_id: department.location_id, name: 'Unknown', code: '' });
          } catch (err) {
            setSelectedWorkLocation({ work_location_id: department.location_id, name: 'Unknown', code: '' });
          } finally {
            setLoadingWorkLocation(false);
          }
        })();
      } else {
        setSelectedWorkLocation(null);
        setLoadingWorkLocation(false);
      }

      setValidationErrors({});
    } else {
      setFormData({
        name: '', code: '', description: '', department_type: 'business',
        parent_id: '', head_id: '', budget: '',
        cost_center_id: '',
        location_id: '', email: '', phone: '', established_date: '',
        custom_fields: defaultCustomFields,
      });
      setAutoGenerateCode(true);
      setSelectedHead(null);
      setSelectedCostCenter(null);
      setSelectedWorkLocation(null);
      setLoadingWorkLocation(false);
      setJsonError(null);
      setValidationErrors({});
    }
  }, [department, employees, show]);

  useEffect(() => {
    if (autoGenerateCode && show && !isEdit && !readOnly) {
      const generated = generateCodeFromName(formData.name);
      handleInputChange('code', generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, autoGenerateCode, isEdit, show, readOnly]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape' && show && !saveLoading) onClose(); };
    if (show) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, saveLoading, onClose]);

  if (!show) return null;

  const handleInputChange = (field, value) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
    if (field === 'custom_fields') validateJSON(value);
  };

  const handleParentSelect = (dept) => {
    if (readOnly) return;
    const newParentId = dept ? dept.dept_id : '';
    // If the parent actually changed, drop the current head so the picker
    // won't keep showing a head from the old scope
    if (formData.parent_id !== newParentId) {
      setSelectedHead(null);
      setFormData(prev => ({ ...prev, parent_id: newParentId, head_id: '' }));
    } else {
      handleInputChange('parent_id', newParentId);
    }
    setShowParentModal(false);
  };

  const handleHeadSelect = (emp) => {
    if (readOnly) return;
    if (emp) {
      setSelectedHead(emp);
      handleInputChange('head_id', emp.emp_id);
    } else {
      setSelectedHead(null);
      handleInputChange('head_id', '');
    }
    setShowHeadModal(false);
  };

  const handleCostCenterSelect = (cc) => {
    if (readOnly) return;
    if (cc) {
      setSelectedCostCenter(cc);
      handleInputChange('cost_center_id', cc.cost_center_id);
    } else {
      setSelectedCostCenter(null);
      handleInputChange('cost_center_id', '');
    }
    setShowCostCenterModal(false);
  };

  const handleWorkLocationSelect = (loc) => {
    if (readOnly) return;
    if (loc) {
      setSelectedWorkLocation(loc);
      handleInputChange('location_id', loc.work_location_id || loc.location_id || loc.id || '');
    } else {
      setSelectedWorkLocation(null);
      handleInputChange('location_id', '');
    }
    setShowWorkLocationModal(false);
  };

  const formatJSON = () => {
    if (readOnly) return;
    if (!formData.custom_fields?.trim()) { handleInputChange('custom_fields', '{}'); return; }
    try {
      const formatted = JSON.stringify(JSON.parse(formData.custom_fields), null, 2);
      handleInputChange('custom_fields', formatted);
      setJsonError(null);
      toast.success('JSON formatted successfully');
    } catch (e) {
      setJsonError(`Cannot format: ${e.message}`);
      toast.error('Invalid JSON - cannot format');
    }
  };

  const loadDefaultCustomFields = () => {
    if (readOnly) return;
    handleInputChange('custom_fields', defaultCustomFields);
    setJsonError(null);
    toast.success('Default custom fields loaded');
  };

  const clearCustomFields = () => {
    if (readOnly) return;
    handleInputChange('custom_fields', '');
    setJsonError(null);
    toast.success('Custom fields cleared');
  };

  const validateForm = () => {
    const errors = {};
    const required = [{ field: 'name', label: 'Name' }, { field: 'department_type', label: 'Type' }];
    required.forEach(({ field, label }) => {
      if (!formData[field]?.toString().trim()) { errors[field] = `${label} is required`; }
    });
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    if (formData.budget && isNaN(parseFloat(formData.budget))) errors.budget = 'Budget must be a number';
    if (formData.custom_fields?.trim() && !validateJSON(formData.custom_fields)) errors.custom_fields = 'Invalid JSON format';
    setValidationErrors(errors);
    if (Object.keys(errors).length) { toast.error(Object.values(errors)[0]); return false; }
    return true;
  };

  const handleSaveDepartment = async () => {
    if (readOnly) return;
    if (!validateForm()) return;

    const savePromise = async () => {
      try {
        const payload = {
          name: formData.name.trim(),
          code: formData.code.trim() || null,
          description: formData.description.trim() || null,
          department_type: formData.department_type,
          status: department?.status || 'active',
          parent_id: formData.parent_id || null,
          head_id: formData.head_id || null,
          cost_center_id: formData.cost_center_id ? Number(formData.cost_center_id) : null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          location_id: formData.location_id || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          established_date: formData.established_date || null,
          custom_fields: formData.custom_fields?.trim()
            ? (() => { try { return JSON.parse(formData.custom_fields); } catch { return null; } })()
            : null,
        };
        const response = department
          ? await hrAPI.updateDepartment(department.dept_id, payload)
          : await hrAPI.createDepartment(payload);
        onSaved();
        return response.data;
      } catch (err) {
        console.error('Save department error:', err.response?.data || err);
        throw err;
      }
    };

    setSaveLoading(true);
    try {
      await toast.promise(savePromise(), {
        loading: 'Saving...',
        success: 'Department saved successfully!',
        error: err => err.response?.data?.message || 'Failed to save department',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleSection = section => setExpandedSection(expandedSection === section ? null : section);
  const excludeId = department?.dept_id || null;

  /* ---- compact class helpers ---- */
  const labelCls = 'text-[10px] font-medium text-gray-700 mb-0.5 block';
  const inputCls = 'w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600';
  const pickerCls = `flex-1 px-1.5 py-1 border rounded text-[11px] flex items-center justify-between ${
    isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'
  }`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      {/* max-h instead of fixed h so the modal only grows to fit its content */}
      <div className="bg-white rounded-md max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl">

        {/* HEADER — compact */}
        <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-b">
          <div>
            <h2 className="text-xs font-semibold flex items-center gap-1.5">
              {readOnly
                ? <><Eye className="w-3.5 h-3.5 text-blue-600" /> View Department</>
                : (department ? 'Edit Department' : 'Create Department')}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              {department ? `Editing: ${department.name}` : 'Add department details'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!readOnly && (
              <button
                onClick={handleSaveDepartment}
                disabled={saveLoading || Object.keys(validationErrors).length > 0}
                className="px-2 py-0.5 text-[11px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving…' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={saveLoading}
              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BODY — compact paddings and gaps; min-h-0 lets it scroll inside max-h parent */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">

            {/* LEFT COLUMN */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Basic Information
              </h3>

              <div>
                <label className={labelCls}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className={`${inputCls} ${validationErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Department name"
                  disabled={isDisabled}
                  autoFocus
                />
                {validationErrors.name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.name}</p>}
              </div>

              <div>
                <label className={labelCls}>Code</label>
                <div className="flex items-center gap-1">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={e => handleInputChange('code', e.target.value)}
                      disabled={autoGenerateCode || isDisabled || isEdit}
                      className={`${inputCls} ${autoGenerateCode || isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      placeholder={autoGenerateCode ? 'Auto‑generated from name' : 'Short code (e.g., HR)'}
                    />
                    {autoGenerateCode && (
                      <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
                        <RefreshCw className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <label className="flex items-center gap-1 text-[10px] text-gray-600 cursor-pointer select-none whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={autoGenerateCode}
                        onChange={e => {
                          const checked = e.target.checked;
                          setAutoGenerateCode(checked);
                          if (checked && !isEdit) {
                            const generated = generateCodeFromName(formData.name);
                            handleInputChange('code', generated);
                          }
                        }}
                        disabled={isDisabled || isEdit}
                        className="rounded border-gray-300 text-primary-600 focus:ring-1 focus:ring-primary-500 w-3 h-3"
                      />
                      Auto
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="Department description"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {departmentTypes.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => handleInputChange('department_type', t.value)}
                        disabled={isDisabled}
                        className={`flex items-center gap-1 px-1.5 py-1 border rounded text-[10px] ${
                          formData.department_type === t.value
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-gray-50 hover:bg-gray-100'
                        } disabled:opacity-50 ${validationErrors.department_type ? 'border-red-300' : ''}`}
                      >
                        <Icon className="w-2.5 h-2.5" /> {t.label}
                      </button>
                    );
                  })}
                </div>
                {validationErrors.department_type && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.department_type}</p>}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                <Users className="w-3 h-3" /> Organizational & Financial
              </h3>

              <div>
                <label className={labelCls}>Parent Department</label>
                <div className="flex items-center gap-1">
                  <div className={pickerCls} onClick={() => !isDisabled && setShowParentModal(true)}>
                    <span className={`truncate ${formData.parent_id ? 'text-gray-900' : 'text-gray-400'}`}>{selectedParentName}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                  </div>
                  {formData.parent_id && !isDisabled && (
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, parent_id: '', head_id: '' }));
                        setSelectedHead(null);
                      }}
                      className="p-0.5 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Department Head</label>
                <div className="flex items-center gap-1">
                  <div className={pickerCls} onClick={() => !isDisabled && setShowHeadModal(true)}>
                    <span className={`truncate ${selectedHead ? 'text-gray-900' : 'text-gray-400'}`}>
                      {selectedHead ? `${selectedHead.first_name} ${selectedHead.last_name}` : 'None'}
                    </span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                  </div>
                  {formData.head_id && !isDisabled && (
                    <button
                      onClick={() => { setSelectedHead(null); handleInputChange('head_id', ''); }}
                      className="p-0.5 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Cost Center</label>
                <div className="flex items-center gap-1">
                  <div className={pickerCls} onClick={() => !isDisabled && setShowCostCenterModal(true)}>
                    <span className={`truncate ${formData.cost_center_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayCostCenter}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                  </div>
                  {formData.cost_center_id && !isDisabled && (
                    <button
                      onClick={() => { setSelectedCostCenter(null); handleInputChange('cost_center_id', ''); }}
                      className="p-0.5 text-gray-400 hover:text-red-600"
                      title="Clear"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Budget</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={e => handleInputChange('budget', e.target.value)}
                  className={`${inputCls} ${validationErrors.budget ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isDisabled}
                />
                {validationErrors.budget && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.budget}</p>}
              </div>

              <h3 className="text-[11px] font-medium text-gray-700 mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Contact & Location
              </h3>

              <div>
                <label className={labelCls}>Work Location</label>
                <div className="flex items-center gap-1">
                  <div className={pickerCls} onClick={() => !isDisabled && setShowWorkLocationModal(true)}>
                    <span className={`truncate ${formData.location_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayWorkLocation}</span>
                    {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                  </div>
                  {formData.location_id && !isDisabled && (
                    <button
                      onClick={() => { setSelectedWorkLocation(null); handleInputChange('location_id', ''); }}
                      className="p-0.5 text-gray-400 hover:text-red-600"
                      title="Clear"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className={`${inputCls} ${validationErrors.email ? 'border-red-500' : ''}`}
                    placeholder="dept@company.com"
                    disabled={isDisabled}
                  />
                  {validationErrors.email && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.email}</p>}
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    className={inputCls}
                    placeholder="Phone number"
                    disabled={isDisabled}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Established Date</label>
                <input
                  type="date"
                  value={formData.established_date}
                  onChange={e => handleInputChange('established_date', e.target.value)}
                  className={inputCls}
                  disabled={isDisabled}
                />
              </div>
            </div>
          </div>

          {/* CUSTOM FIELDS — compact */}
          <div className={`mt-2 border rounded-md overflow-hidden ${validationErrors.custom_fields ? 'border-red-300' : 'border-gray-200'}`}>
            <button
              onClick={() => toggleSection('custom_fields')}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 hover:bg-gray-100"
              disabled={saveLoading}
            >
              <div className="flex items-center gap-1.5">
                <Code className="w-3 h-3" />
                <span className="text-[11px] font-medium">Custom Fields (JSON)</span>
                {jsonError && <span className="text-[10px] text-red-600 ml-1"><AlertCircle className="w-2.5 h-2.5 inline" /> JSON Error</span>}
              </div>
              {expandedSection === 'custom_fields' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {expandedSection === 'custom_fields' && (
              <div className="p-2 space-y-2 bg-white">
                {!readOnly && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    <button onClick={loadDefaultCustomFields} disabled={isDisabled} className="px-2 py-0.5 text-[10px] bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50">Load Default</button>
                    <button onClick={formatJSON} disabled={isDisabled} className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"><Code className="w-2.5 h-2.5 inline" /> Format JSON</button>
                    <button onClick={clearCustomFields} disabled={isDisabled} className="px-2 py-0.5 text-[10px] bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50">Clear</button>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-medium text-gray-700">Enter custom fields as JSON</label>
                    <span className="text-[10px] text-gray-500">{formData.custom_fields.length} characters</span>
                  </div>
                  <textarea
                    rows={readOnly ? 4 : 6}
                    value={formData.custom_fields}
                    onChange={e => handleInputChange('custom_fields', e.target.value)}
                    className={`w-full px-2 py-1 border rounded text-[11px] font-mono resize-none focus:ring-1 disabled:bg-gray-50 disabled:text-gray-600 ${
                      jsonError || validationErrors.custom_fields ? 'border-red-300 focus:ring-red-500' : 'focus:ring-primary-500'
                    }`}
                    placeholder={`{\n  "mission": "",\n  "vision": "",\n  "team_size": 0,\n  "key_projects": [],\n  "additional_notes": ""\n}`}
                    disabled={isDisabled}
                    spellCheck="false"
                  />
                  {(jsonError || validationErrors.custom_fields) && (
                    <div className="mt-1 p-1.5 bg-red-50 border border-red-200 rounded">
                      <p className="text-[10px] text-red-700"><AlertCircle className="w-2.5 h-2.5 inline mr-1" />{jsonError || validationErrors.custom_fields}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex items-center justify-end px-2 py-1 border-t bg-gray-50">
          <p className="text-[9px] text-gray-500">
            {department?.updatedAt ? `Updated: ${new Date(department.updatedAt).toLocaleDateString()}` : 'New department'}
          </p>
        </div>
      </div>

      {/* PICKERS */}
      <Suspense fallback={null}>
        <DepartmentSelectionModal
          show={showParentModal && !readOnly}
          onClose={() => setShowParentModal(false)}
          onSelect={handleParentSelect}
          selectedDepartmentId={formData.parent_id || null}
          excludeId={excludeId}
        />
      </Suspense>

      <Suspense fallback={null}>
        <EmployeeSelectionModal
          show={showHeadModal && !readOnly}
          onClose={() => setShowHeadModal(false)}
          onSelect={handleHeadSelect}
          selectedEmployeeId={formData.head_id || null}
          deptId={formData.parent_id || null}
          title={
            selectedParentName && selectedParentName !== 'None'
              ? `Select Employee — ${selectedParentName}`
              : 'Select Employee'
          }
        />
      </Suspense>

      <Suspense fallback={null}>
        <CostCenterSelectionModal
          show={showCostCenterModal && !readOnly}
          onClose={() => setShowCostCenterModal(false)}
          onSelect={handleCostCenterSelect}
          selectedCostCenterId={formData.cost_center_id || null}
          onlyActive
          quickSelect
        />
      </Suspense>

      <Suspense fallback={null}>
        <WorkLocationSelectionModal
          show={showWorkLocationModal && !readOnly}
          onClose={() => setShowWorkLocationModal(false)}
          onSelect={handleWorkLocationSelect}
          selectedWorkLocationId={formData.location_id || null}
          statusFilter="active"
        />
      </Suspense>
    </div>
  );
};

export default React.memo(DepartmentModal);
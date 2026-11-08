import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  X, Save, FileArchive, Briefcase, Building2, TrendingUp, Code, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

// Lazy‑loaded selection modals
const DepartmentSelectionModal = lazy(() => import('../../Departments/DepartmentSelectionModal'));
const PositionSelectionModal = lazy(() => import('./PositionSelectionModal'));

const PositionModal = ({ show, position, onClose, onSaved, departments = [], positions = [] }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [showReportingPosModal, setShowReportingPosModal] = useState(false);
  const [selectedReportingPosition, setSelectedReportingPosition] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    dept_id: '',
    reporting_position_id: '',
    grade: '',
    level: '',
    status: 'active',
    custom_fields: '',
  });

  const defaultCustomFields = `{
  "responsibilities": [],
  "qualifications": [],
  "experience_required": "",
  "skills": [],
  "additional_notes": ""
}`;

  const gradeOptions = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Director' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'frozen', label: 'Frozen' },
  ];

  const validateJSON = useCallback(jsonString => {
    try {
      if (!jsonString || jsonString.trim() === '') {
        setJsonError(null);
        return true;
      }
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object') {
        setJsonError('Custom fields must be a JSON object');
        return false;
      }
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError(`Invalid JSON: ${error.message}`);
      return false;
    }
  }, []);

  useEffect(() => {
    if (position) {
      setFormData({
        title: position.title || '',
        code: position.code || '',
        description: position.description || '',
        dept_id: position.dept_id || '',
        reporting_position_id: position.reporting_position_id || '',
        grade: position.grade || '',
        level: position.level || '',
        status: position.status || 'active',
        custom_fields: position.custom_fields
          ? (() => {
              try {
                if (typeof position.custom_fields === 'string') {
                  return JSON.stringify(JSON.parse(position.custom_fields), null, 2);
                } else if (typeof position.custom_fields === 'object') {
                  return JSON.stringify(position.custom_fields, null, 2);
                }
              } catch (e) {}
              return '';
            })()
          : '',
      });
      const dept = departments.find(d => d.dept_id === position.dept_id);
      setSelectedDepartment(dept || null);
      const reportPos = positions.find(p => p.value === position.reporting_position_id);
      setSelectedReportingPosition(reportPos || null);
      setValidationErrors({});
    } else {
      setFormData({
        title: '',
        code: '',
        description: '',
        dept_id: '',
        reporting_position_id: '',
        grade: '',
        level: '',
        status: 'active',
        custom_fields: defaultCustomFields,
      });
      setSelectedDepartment(null);
      setSelectedReportingPosition(null);
      setJsonError(null);
      setValidationErrors({});
    }
  }, [position, departments, positions, defaultCustomFields]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
    if (field === 'custom_fields') validateJSON(value);
  };

  const handleDepartmentSelect = useCallback((selectedDept) => {
    if (selectedDept) {
      handleInputChange('dept_id', selectedDept.dept_id);
      setSelectedDepartment(selectedDept);
    } else {
      handleInputChange('dept_id', '');
      setSelectedDepartment(null);
    }
    setShowDeptModal(false);
  }, [handleInputChange]);

  const handleReportingPositionSelect = useCallback((selectedPos) => {
    if (selectedPos) {
      handleInputChange('reporting_position_id', selectedPos.position_id);
      setSelectedReportingPosition({ value: selectedPos.position_id, label: selectedPos.title });
    } else {
      handleInputChange('reporting_position_id', '');
      setSelectedReportingPosition(null);
    }
    setShowReportingPosModal(false);
  }, [handleInputChange]);

  const formatJSON = () => {
    if (!formData.custom_fields || formData.custom_fields.trim() === '') {
      setFormData(prev => ({ ...prev, custom_fields: '{}' }));
      return;
    }
    try {
      const parsed = JSON.parse(formData.custom_fields);
      setFormData(prev => ({ ...prev, custom_fields: JSON.stringify(parsed, null, 2) }));
      setJsonError(null);
      toast.success('JSON formatted successfully');
    } catch (error) {
      setJsonError(`Cannot format: ${error.message}`);
      toast.error('Invalid JSON - cannot format');
    }
  };

  const loadDefaultCustomFields = () => {
    setFormData(prev => ({ ...prev, custom_fields: defaultCustomFields }));
    setJsonError(null);
    toast.success('Default custom fields loaded');
  };

  const clearCustomFields = () => {
    setFormData(prev => ({ ...prev, custom_fields: '' }));
    setJsonError(null);
    toast.success('Custom fields cleared');
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = [{ field: 'title', label: 'Title' }];
    requiredFields.forEach(({ field, label }) => {
      if (!formData[field]?.toString().trim()) errors[field] = `${label} is required`;
    });
    if (formData.custom_fields?.trim()) {
      if (!validateJSON(formData.custom_fields)) errors.custom_fields = 'Invalid JSON format';
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const handleSavePosition = async (action) => {
    if (!validateForm()) return;
    setSaveLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        code: formData.code.trim() || null,
        description: formData.description.trim() || null,
        dept_id: formData.dept_id || null,
        reporting_position_id: formData.reporting_position_id || null,
        grade: formData.grade || null,
        level: formData.level || null,
        status: action,
        custom_fields: formData.custom_fields?.trim()
          ? (() => { try { return JSON.parse(formData.custom_fields); } catch { return null; } })()
          : null,
      };
      const response = position
        ? await hrAPI.updatePosition(position.position_id, payload)
        : await hrAPI.createPosition(payload);
      onSaved();
      return response.data;
    } catch (err) {
      console.error('Save position error:', err.response?.data || err);
      throw err;
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleSection = section => setExpandedSection(expandedSection === section ? null : section);

  useEffect(() => {
    const handleEscapeKey = e => { if (e.key === 'Escape' && show && !saveLoading) onClose(); };
    if (show) document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [show, saveLoading, onClose]);

  // Memoized display strings
  const displayDeptText = useMemo(() => {
    if (selectedDepartment) {
      const { dept_id, code, name } = selectedDepartment;
      return code ? `${dept_id} - ${code} - ${name}` : `${dept_id} - ${name}`;
    }
    return formData.dept_id ? `ID: ${formData.dept_id}` : 'None';
  }, [selectedDepartment, formData.dept_id]);

  const displayReportingPosText = useMemo(() => {
    if (selectedReportingPosition) return selectedReportingPosition.label;
    return formData.reporting_position_id ? `ID: ${formData.reporting_position_id}` : 'None';
  }, [selectedReportingPosition, formData.reporting_position_id]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-4xl w-full h-[95vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold">{position ? 'Edit Position' : 'Create Position'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {position ? `Editing: ${position.title}` : 'Add position details'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Position Details
              </h3>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={e => handleInputChange('title', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${validationErrors.title ? 'border-red-500' : ''}`}
                  placeholder="e.g., Senior Software Engineer" disabled={saveLoading} autoFocus />
                {validationErrors.title && <p className="text-xs text-red-600 mt-1">{validationErrors.title}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Code</label>
                <input type="text" value={formData.code} onChange={e => handleInputChange('code', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                  placeholder="e.g., SSE-001" disabled={saveLoading} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Description</label>
                <textarea rows="3" value={formData.description} onChange={e => handleInputChange('description', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none"
                  placeholder="Brief description of the position" disabled={saveLoading} />
              </div>
              {/* Department */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Department</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-2.5 py-1.5 border rounded text-sm bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => !saveLoading && setShowDeptModal(true)}>
                    <span className={formData.dept_id ? 'text-gray-900' : 'text-gray-400'}>{displayDeptText}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  {formData.dept_id && (
                    <button type="button" onClick={() => { handleInputChange('dept_id', ''); setSelectedDepartment(null); }}
                      className="p-1 text-gray-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              {/* Reporting Position */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Reporting Position</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-2.5 py-1.5 border rounded text-sm bg-white flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => !saveLoading && setShowReportingPosModal(true)}>
                    <span className={formData.reporting_position_id ? 'text-gray-900' : 'text-gray-400'}>{displayReportingPosText}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  {formData.reporting_position_id && (
                    <button type="button" onClick={() => { handleInputChange('reporting_position_id', ''); setSelectedReportingPosition(null); }}
                      className="p-1 text-gray-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Grade & Status
              </h3>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Grade</label>
                <select value={formData.grade} onChange={e => handleInputChange('grade', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500" disabled={saveLoading}>
                  <option value="">Select Grade</option>
                  {gradeOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Level</label>
                <input type="text" value={formData.level} onChange={e => handleInputChange('level', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500"
                  placeholder="e.g., L3, M1" disabled={saveLoading} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                <select value={formData.status} onChange={e => handleInputChange('status', e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500" disabled={saveLoading}>
                  {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {/* Custom Fields */}
              <div className={`mt-4 border rounded-lg overflow-hidden ${validationErrors.custom_fields ? 'border-red-300' : 'border-gray-200'}`}>
                <button onClick={() => toggleSection('custom_fields')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100" disabled={saveLoading}>
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="text-sm font-medium">Custom Fields (JSON)</span>
                    {jsonError && <span className="text-xs text-red-600 ml-2"><AlertCircle className="w-3 h-3" /> JSON Error</span>}
                  </div>
                  {expandedSection === 'custom_fields' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === 'custom_fields' && (
                  <div className="p-3 space-y-3 bg-white">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button onClick={loadDefaultCustomFields} disabled={saveLoading} className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50">Load Default</button>
                      <button onClick={formatJSON} disabled={saveLoading} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"><Code className="w-3 h-3" /> Format JSON</button>
                      <button onClick={clearCustomFields} disabled={saveLoading} className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 disabled:opacity-50">Clear</button>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-700">Enter custom fields as JSON</label>
                        <span className="text-xs text-gray-500">{formData.custom_fields.length} characters</span>
                      </div>
                      <textarea rows="8" value={formData.custom_fields} onChange={e => handleInputChange('custom_fields', e.target.value)}
                        className={`w-full px-3 py-2 border rounded text-sm font-mono resize-none focus:ring-1 ${jsonError || validationErrors.custom_fields ? 'border-red-300 focus:ring-red-500' : 'focus:ring-primary-500'}`}
                        placeholder={`{\n  "responsibilities": [],\n  "qualifications": [],\n  "experience_required": "",\n  "skills": [],\n  "additional_notes": ""\n}`}
                        disabled={saveLoading} spellCheck="false" />
                      {(jsonError || validationErrors.custom_fields) && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-xs text-red-700 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" />{jsonError || validationErrors.custom_fields}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500">{position?.updatedAt ? `Updated: ${new Date(position.updatedAt).toLocaleDateString()}` : 'New position'}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled={saveLoading}>Cancel</button>
            <button onClick={() => handleSavePosition('inactive')} className="px-3 py-1.5 text-xs border rounded bg-orange-100 text-orange-700 hover:bg-orange-200 flex items-center gap-1.5 disabled:opacity-50"
              disabled={saveLoading || Object.keys(validationErrors).length > 0}>
              <FileArchive className="w-3 h-3" /> Deactivate
            </button>
            <button onClick={() => handleSavePosition('active')} className="px-3 py-1.5 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1.5 disabled:opacity-50"
              disabled={saveLoading || Object.keys(validationErrors).length > 0}>
              <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Lazy‑loaded selection modals */}
      <Suspense fallback={null}>
        {showDeptModal && (
          <DepartmentSelectionModal
            show={showDeptModal}
            onClose={() => setShowDeptModal(false)}
            onSelect={handleDepartmentSelect}
            selectedDepartmentId={formData.dept_id || null}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showReportingPosModal && (
          <PositionSelectionModal
            show={showReportingPosModal}
            onClose={() => setShowReportingPosModal(false)}
            onSelect={handleReportingPositionSelect}
            selectedPositionId={formData.reporting_position_id || null}
            excludeId={position?.position_id}
            departmentId={formData.dept_id || null}
          />
        )}
      </Suspense>
    </div>
  );
};

export default React.memo(PositionModal);
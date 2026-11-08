import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { X, Save, Send, Search } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const DepartmentSelectionModal = lazy(() => import('../../Departments/DepartmentSelectionModal'));
const PositionSelectionModal = lazy(() => import('../Positions/PositionSelectionModal'));
const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));

const JobRequisitionModal = ({ show, record, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);

  const [formData, setFormData] = useState({
    dept_id: '',
    position_id: '',
    hiring_head_id: '',
    title: '',
    requisition_code: '',
    description: '',
    requirements: '',
    responsibilities: '',
    qualifications: '',
    skills_required: [],
    employment_type: 'full_time',
    work_mode: 'onsite',
    experience_min: 0,
    experience_max: 5,
    vacancy_count: 1,
    min_salary: 0,
    max_salary: 0,
    currency: 'INR',
    salary_visible: true,
    closing_date: '',
    expected_joining_date: '',
    publish_internal: true,
    publish_external: false,
    job_boards: [],
    hiring_budget: 0,
    status: 'draft',
    approval_comments: '',
    custom_fields: {},
  });

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    if (record) {
      setFormData({
        dept_id: record.dept_id || '',
        position_id: record.position_id || '',
        hiring_head_id: record.hiring_head_id || '',
        title: record.title || '',
        requisition_code: record.requisition_code || '',
        description: record.description || '',
        requirements: record.requirements || '',
        responsibilities: record.responsibilities || '',
        qualifications: record.qualifications || '',
        skills_required: record.skills_required || [],
        employment_type: record.employment_type || 'full_time',
        work_mode: record.work_mode || 'onsite',
        experience_min: record.experience_min || 0,
        experience_max: record.experience_max || 5,
        vacancy_count: record.vacancy_count || 1,
        min_salary: record.min_salary || 0,
        max_salary: record.max_salary || 0,
        currency: record.currency || 'INR',
        salary_visible: record.salary_visible ?? true,
        closing_date: record.closing_date || '',
        expected_joining_date: record.expected_joining_date || '',
        publish_internal: record.publish_internal ?? true,
        publish_external: record.publish_external ?? false,
        job_boards: record.job_boards || [],
        hiring_budget: record.hiring_budget || 0,
        status: record.status || 'draft',
        approval_comments: record.approval_comments || '',
        custom_fields: record.custom_fields || {},
      });
      setSelectedDept(record.department || null);
      setSelectedPos(record.position || null);
      setSelectedEmployee(record.hiring_manager || null);
    } else {
      setFormData({
        dept_id: '',
        position_id: '',
        hiring_head_id: '',
        title: '',
        requisition_code: '',
        description: '',
        requirements: '',
        responsibilities: '',
        qualifications: '',
        skills_required: [],
        employment_type: 'full_time',
        work_mode: 'onsite',
        experience_min: 0,
        experience_max: 5,
        vacancy_count: 1,
        min_salary: 0,
        max_salary: 0,
        currency: 'INR',
        salary_visible: true,
        closing_date: '',
        expected_joining_date: '',
        publish_internal: true,
        publish_external: false,
        job_boards: [],
        hiring_budget: 0,
        status: 'draft',
        approval_comments: '',
        custom_fields: {},
      });
      setSelectedDept(null);
      setSelectedPos(null);
      setSelectedEmployee(null);
    }
    setValidationErrors({});
  }, [record, show]);

  const handleDeptSelect = useCallback((dept) => {
    if (dept) {
      setFormData(prev => ({ ...prev, dept_id: dept.dept_id, position_id: '' }));
      setSelectedDept(dept);
      setSelectedPos(null);
    }
    setShowDeptModal(false);
  }, []);

  const handlePosSelect = useCallback((pos) => {
    if (pos) {
      setFormData(prev => ({ ...prev, position_id: pos.position_id }));
      setSelectedPos(pos);
    }
    setShowPosModal(false);
  }, []);

  const handleEmpSelect = useCallback((emp) => {
    if (emp) {
      setFormData(prev => ({ ...prev, hiring_head_id: emp.emp_id }));
      setSelectedEmployee(emp);
    }
    setShowEmpModal(false);
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (field, value) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    handleChange(field, arr);
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.dept_id) errors.dept_id = 'Department is required';
    if (!formData.position_id) errors.position_id = 'Position is required';
    if (!formData.hiring_head_id) errors.hiring_head_id = 'Hiring Head is required';
    if (formData.vacancy_count < 1) errors.vacancy_count = 'Must be at least 1';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (status = 'draft') => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = {
        ...formData,
        status: status,
        hiring_head_id: parseInt(formData.hiring_head_id) || null,
        skills_required: formData.skills_required || [],
        job_boards: formData.job_boards || [],
      };
      delete payload.requisition_code;

      const response = record
        ? await hrAPI.updateJobRequisition(record.job_requisition_id, payload)
        : await hrAPI.createJobRequisition(payload);

      if (response.data?.success) {
        onSaved();
      } else {
        throw new Error(response.data?.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  const getEmployeeDisplayName = (emp) => {
    if (!emp) return 'Select Hiring Head';
    return [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.email || `ID: ${emp.emp_id}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
        <div className="bg-white rounded-md max-w-4xl w-full h-[95vh] flex flex-col shadow-xl">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-2 border-b">
            <h2 className="text-sm font-semibold">{record ? 'Edit Requisition' : 'Create Requisition'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Title & Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Title <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)}
                  className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.title ? 'border-red-500' : ''}`}
                  disabled={saveLoading} />
                {validationErrors.title && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.title}</p>}
              </div>
              {record && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Requisition Code</label>
                  <input type="text" value={formData.requisition_code} className="w-full px-2 py-1 border rounded text-xs bg-gray-100" disabled />
                </div>
              )}
            </div>

            {/* Department, Position, Hiring Head */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Department <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setShowDeptModal(true)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 border rounded text-xs ${validationErrors.dept_id ? 'border-red-500' : ''}`}
                  disabled={saveLoading}>
                  <span className={selectedDept ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedDept ? selectedDept.name : 'Select Department'}
                  </span>
                  <Search className="w-3 h-3 text-gray-400" />
                </button>
                {validationErrors.dept_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.dept_id}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Position <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setShowPosModal(true)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 border rounded text-xs ${validationErrors.position_id ? 'border-red-500' : ''}`}
                  disabled={saveLoading}>
                  <span className={selectedPos ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedPos ? selectedPos.title : 'Select Position'}
                  </span>
                  <Search className="w-3 h-3 text-gray-400" />
                </button>
                {validationErrors.position_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.position_id}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Hiring Head <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setShowEmpModal(true)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 border rounded text-xs ${validationErrors.hiring_head_id ? 'border-red-500' : ''}`}
                  disabled={saveLoading}>
                  <span className={selectedEmployee ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedEmployee ? getEmployeeDisplayName(selectedEmployee) : 'Select Hiring Head'}
                  </span>
                  <Search className="w-3 h-3 text-gray-400" />
                </button>
                {validationErrors.hiring_head_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.hiring_head_id}</p>}
              </div>
            </div>

            {/* Employment Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employment Type</label>
                <select value={formData.employment_type} onChange={e => handleChange('employment_type', e.target.value)} className="w-full px-2 py-1 border rounded text-xs">
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Work Mode</label>
                <select value={formData.work_mode} onChange={e => handleChange('work_mode', e.target.value)} className="w-full px-2 py-1 border rounded text-xs">
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Vacancy Count <span className="text-red-500">*</span></label>
                <input type="number" value={formData.vacancy_count} onChange={e => handleChange('vacancy_count', parseInt(e.target.value) || 1)} min="1"
                  className={`w-full px-2 py-1 border rounded text-xs ${validationErrors.vacancy_count ? 'border-red-500' : ''}`} />
              </div>
            </div>

            {/* Experience & Skills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Experience (min years)</label>
                <input type="number" value={formData.experience_min} onChange={e => handleChange('experience_min', parseInt(e.target.value) || 0)} min="0" className="w-full px-2 py-1 border rounded text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Experience (max years)</label>
                <input type="number" value={formData.experience_max} onChange={e => handleChange('experience_max', parseInt(e.target.value) || 0)} min="0" className="w-full px-2 py-1 border rounded text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Skills Required (comma)</label>
                <input type="text" value={formData.skills_required.join(', ')} onChange={e => handleArrayChange('skills_required', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs" placeholder="e.g. JavaScript, React" />
              </div>
            </div>

            {/* Compensation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Min Salary</label><input type="number" value={formData.min_salary} onChange={e => handleChange('min_salary', parseFloat(e.target.value) || 0)} step="0.01" className="w-full px-2 py-1 border rounded text-xs" /></div>
              <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Max Salary</label><input type="number" value={formData.max_salary} onChange={e => handleChange('max_salary', parseFloat(e.target.value) || 0)} step="0.01" className="w-full px-2 py-1 border rounded text-xs" /></div>
              <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Hiring Budget</label><input type="number" value={formData.hiring_budget} onChange={e => handleChange('hiring_budget', parseFloat(e.target.value) || 0)} step="0.01" className="w-full px-2 py-1 border rounded text-xs" /></div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Closing Date</label><input type="date" value={formData.closing_date} onChange={e => handleChange('closing_date', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></div>
              <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Expected Joining Date</label><input type="date" value={formData.expected_joining_date} onChange={e => handleChange('expected_joining_date', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></div>
            </div>

            {/* Description */}
            <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Description</label><textarea rows={3} value={formData.description} onChange={e => handleChange('description', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Requirements</label><textarea rows={2} value={formData.requirements} onChange={e => handleChange('requirements', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></div>
              <div><label className="block text-[10px] font-medium text-gray-700 mb-0.5">Qualifications</label><textarea rows={2} value={formData.qualifications} onChange={e => handleChange('qualifications', e.target.value)} className="w-full px-2 py-1 border rounded text-xs" /></div>
            </div>

            {/* Publishing */}
            <div className="border-t pt-2">
              <h4 className="text-xs font-semibold text-gray-700 mb-1">Publishing</h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={formData.publish_internal} onChange={e => handleChange('publish_internal', e.target.checked)} className="rounded w-3 h-3" /> Internal</label>
                <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={formData.publish_external} onChange={e => handleChange('publish_external', e.target.checked)} className="rounded w-3 h-3" /> External</label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between p-2 border-t bg-gray-50">
            <p className="text-[10px] text-gray-500">{record ? 'Editing existing requisition' : 'New requisition'}</p>
            <div className="flex gap-1.5">
              <button onClick={onClose} className="px-2.5 py-1 text-[10px] border rounded bg-white hover:bg-gray-50" disabled={saveLoading}>Cancel</button>
              <button onClick={() => handleSave('draft')} className="px-2.5 py-1 text-[10px] border rounded bg-gray-200 hover:bg-gray-300 flex items-center gap-1" disabled={saveLoading}><Save className="w-3 h-3" /> Draft</button>
              <button onClick={() => handleSave('pending_approval')} className="px-2.5 py-1 text-[10px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1" disabled={saveLoading}><Send className="w-3 h-3" /> Submit</button>
            </div>
          </div>
        </div>
      </div>

      {/* Lazy‑loaded selection modals */}
      <Suspense fallback={null}>
        {showDeptModal && (
          <DepartmentSelectionModal
            show={showDeptModal}
            onClose={() => setShowDeptModal(false)}
            onSelect={handleDeptSelect}
            selectedDepartmentId={formData.dept_id}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showPosModal && (
          <PositionSelectionModal
            show={showPosModal}
            onClose={() => setShowPosModal(false)}
            onSelect={handlePosSelect}
            selectedPositionId={formData.position_id}
            departmentId={formData.dept_id}
            positionStatusFilter="open"
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {showEmpModal && (
          <EmployeeSelectionModal
            show={showEmpModal}
            onClose={() => setShowEmpModal(false)}
            onSelect={handleEmpSelect}
            selectedEmployeeId={formData.hiring_head_id}
            deptId={formData.dept_id}
          />
        )}
      </Suspense>
    </>
  );
};

export default JobRequisitionModal;
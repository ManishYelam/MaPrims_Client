import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, Save, ChevronRight } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const DepartmentSelectionModal = lazy(() => import('../../Departments/DepartmentSelectionModal'));
const PositionSelectionModal = lazy(() => import('../../Recruitment/Positions/PositionSelectionModal'));

const LeaveWorkflowModal = ({ show, workflow, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const [formData, setFormData] = useState({
    leave_type_id: '',
    level: 1,
    workflow_name: '',
    approver_role: 'manager',
    approver_position_id: '',
    approver_dept_id: '',
    custom_approvers: '',
    approval_type: 'single',
    auto_approve_if_no_action: false,
    escalation_hours: 48,
    escalate_to_role: '',
    is_mandatory: true,
    can_skip_level: false,
    stop_on_rejection: true,
    status: 'active',
  });

  const isLevelOne = Number(formData.level) === 1;

  useEffect(() => {
    if (show) {
      hrAPI.getLeaveTypes({ page: 1, limit: 10000 })
        .then(res => setLeaveTypes(res.data.data || []))
        .catch(() => {});
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;

    if (workflow) {
      const initialLevel = workflow.level || 1;
      const isInitialLevelOne = initialLevel === 1;

      let departmentObj = null;
      if (!isInitialLevelOne && workflow.approver_dept_id) {
        if (workflow.approver_department) {
          departmentObj = workflow.approver_department;
        } else {
          departmentObj = {
            dept_id: workflow.approver_dept_id,
            name: `Department ID: ${workflow.approver_dept_id}`,
            code: '',
          };
        }
      }

      let positionObj = null;
      if (!isInitialLevelOne && workflow.approver_position_id) {
        if (workflow.approver_position) {
          positionObj = workflow.approver_position;
        } else {
          positionObj = {
            position_id: workflow.approver_position_id,
            title: `Position ID: ${workflow.approver_position_id}`,
          };
        }
      }

      setFormData({
        leave_type_id: workflow.leave_type_id || '',
        level: initialLevel,
        workflow_name: workflow.workflow_name || '',
        approver_role: workflow.approver_role || 'manager',
        approver_position_id: isInitialLevelOne ? '' : workflow.approver_position_id || '',
        approver_dept_id: isInitialLevelOne ? '' : workflow.approver_dept_id || '',
        custom_approvers: Array.isArray(workflow.custom_approvers)
          ? workflow.custom_approvers.join(', ')
          : '',
        approval_type: workflow.approval_type || 'single',
        auto_approve_if_no_action: workflow.auto_approve_if_no_action || false,
        escalation_hours: workflow.escalation_hours ?? 48,
        escalate_to_role: workflow.escalate_to_role || '',
        is_mandatory: workflow.is_mandatory ?? true,
        can_skip_level: workflow.can_skip_level || false,
        stop_on_rejection: workflow.stop_on_rejection ?? true,
        status: workflow.status || 'active',
      });

      setSelectedDepartment(departmentObj);
      setSelectedPosition(positionObj);
    } else {
      setFormData({
        leave_type_id: '',
        level: 1,
        workflow_name: '',
        approver_role: 'manager',
        approver_position_id: '',
        approver_dept_id: '',
        custom_approvers: '',
        approval_type: 'single',
        auto_approve_if_no_action: false,
        escalation_hours: 48,
        escalate_to_role: '',
        is_mandatory: true,
        can_skip_level: false,
        stop_on_rejection: true,
        status: 'active',
      });
      setSelectedDepartment(null);
      setSelectedPosition(null);
    }
  }, [workflow, show]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLevelChange = (e) => {
    const value = parseInt(e.target.value) || 1;

    setFormData(prev => ({
      ...prev,
      level: value,
      approver_dept_id: value === 1 ? '' : prev.approver_dept_id,
      approver_position_id: value === 1 ? '' : prev.approver_position_id,
    }));

    if (value === 1) {
      setSelectedDepartment(null);
      setSelectedPosition(null);
    }
  };

  const handleDepartmentSelect = (dept) => {
    if (dept) {
      handleChange('approver_dept_id', dept.dept_id);
      setSelectedDepartment(dept);
    } else {
      handleChange('approver_dept_id', '');
      setSelectedDepartment(null);
    }
    setShowDeptModal(false);
  };

  const handlePositionSelect = (pos) => {
    if (pos) {
      handleChange('approver_position_id', pos.position_id);
      setSelectedPosition(pos);
    } else {
      handleChange('approver_position_id', '');
      setSelectedPosition(null);
    }
    setShowPosModal(false);
  };

  const handleSave = async () => {
    if (!formData.leave_type_id || !formData.approver_role) {
      toast.error('Leave Type and Approver Role are required');
      return;
    }

    const payload = {
      ...formData,
      custom_approvers: formData.custom_approvers
        ? formData.custom_approvers.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      approver_position_id: formData.approver_position_id || null,
      approver_dept_id: formData.approver_dept_id || null,
    };

    const savePromise = async () => {
      const response = workflow
        ? await hrAPI.updateLeaveWorkflow(workflow.leave_workflow_id, payload)
        : await hrAPI.createLeaveWorkflow(payload);
      if (response.data && response.data.success) {
        onSaved();
        return response.data;
      }
      throw new Error(response.data?.message || 'Save failed');
    };

    try {
      setSaveLoading(true);
      await toast.promise(savePromise(), {
        loading: 'Saving...',
        success: `Workflow ${workflow ? 'updated' : 'created'}!`,
        error: err => err.response?.data?.message || err.message || 'Save failed',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-7xl w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
          <div>
            <h2 className="text-base font-semibold">{workflow ? 'Edit Workflow' : 'Add Workflow'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {workflow ? `Editing: ${workflow.workflow_name || workflow.leave_workflow_id}` : 'Define a new approval workflow'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leave_type_id}
                onChange={e => handleChange('leave_type_id', e.target.value)}
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              >
                <option value="">Select</option>
                {leaveTypes.map(lt => (
                  <option key={lt.leave_type_id} value={lt.leave_type_id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.level}
                onChange={handleLevelChange}
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Workflow Name</label>
              <input
                type="text"
                value={formData.workflow_name}
                onChange={e => handleChange('workflow_name', e.target.value)}
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Approver Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.approver_role}
                onChange={e => handleChange('approver_role', e.target.value)}
                placeholder="e.g. manager"
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Approver Department</label>
              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 px-2.5 py-1.5 border rounded text-sm flex items-center justify-between ${
                    isLevelOne
                      ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                      : 'bg-white cursor-pointer hover:bg-gray-50'
                  }`}
                  onClick={() => !saveLoading && !isLevelOne && setShowDeptModal(true)}
                >
                  <span className={isLevelOne ? 'text-gray-500' : selectedDepartment ? 'text-gray-900' : 'text-gray-400'}>
                    {isLevelOne
                      ? 'Self Department'
                      : selectedDepartment
                        ? `${selectedDepartment.code || ''} - ${selectedDepartment.name}`
                        : 'None'}
                  </span>
                  {!isLevelOne && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
                {formData.approver_dept_id && !isLevelOne && (
                  <button
                    type="button"
                    onClick={() => handleDepartmentSelect(null)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Approver Position</label>
              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 px-2.5 py-1.5 border rounded text-sm flex items-center justify-between ${
                    isLevelOne
                      ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                      : 'bg-white cursor-pointer hover:bg-gray-50'
                  }`}
                  onClick={() => !saveLoading && !isLevelOne && setShowPosModal(true)}
                >
                  <span className={isLevelOne ? 'text-gray-500' : selectedPosition ? 'text-gray-900' : 'text-gray-400'}>
                    {isLevelOne
                      ? 'Head of Department'
                      : selectedPosition
                        ? selectedPosition.title || `Position #${selectedPosition.position_id}`
                        : 'None'}
                  </span>
                  {!isLevelOne && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
                {formData.approver_position_id && !isLevelOne && (
                  <button
                    type="button"
                    onClick={() => handlePositionSelect(null)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Approval Type</label>
              <select
                value={formData.approval_type}
                onChange={e => handleChange('approval_type', e.target.value)}
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              >
                <option value="single">Single</option>
                <option value="parallel">Parallel</option>
                <option value="any_one">Any One</option>
                <option value="all_required">All Required</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Escalation Hours</label>
              <input
                type="number"
                min="0"
                value={formData.escalation_hours}
                onChange={e => handleChange('escalation_hours', parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Escalate To Role</label>
              <input
                type="text"
                value={formData.escalate_to_role}
                onChange={e => handleChange('escalate_to_role', e.target.value)}
                placeholder="Optional"
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Custom Approvers (comma‑separated IDs)
              </label>
              <input
                type="text"
                value={formData.custom_approvers}
                onChange={e => handleChange('custom_approvers', e.target.value)}
                placeholder="e.g. 101, 102"
                className="w-full px-2.5 py-1.5 border rounded text-sm"
                disabled={saveLoading}
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Enter numeric IDs separated by commas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_mandatory}
                onChange={e => handleChange('is_mandatory', e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
                disabled={saveLoading}
              />
              <span className="text-sm">Mandatory</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.can_skip_level}
                onChange={e => handleChange('can_skip_level', e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
                disabled={saveLoading}
              />
              <span className="text-sm">Can Skip Level</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.stop_on_rejection}
                onChange={e => handleChange('stop_on_rejection', e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
                disabled={saveLoading}
              />
              <span className="text-sm">Stop on Rejection</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.auto_approve_if_no_action}
                onChange={e => handleChange('auto_approve_if_no_action', e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
                disabled={saveLoading}
              />
              <span className="text-sm">Auto Approve</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
            <select
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full md:w-1/2 lg:w-1/3 px-2.5 py-1.5 border rounded text-sm"
              disabled={saveLoading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between p-3 border-t bg-gray-50">
          <p className="text-xs text-gray-500">
            {workflow ? 'Edit existing workflow' : 'New workflow'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-50" disabled={saveLoading}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1"
              disabled={saveLoading}
            >
              <Save className="w-3 h-3" />
              {saveLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {showDeptModal && (
          <DepartmentSelectionModal
            show={showDeptModal}
            onClose={() => setShowDeptModal(false)}
            onSelect={handleDepartmentSelect}
            selectedDepartmentId={formData.approver_dept_id || null}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showPosModal && (
          <PositionSelectionModal
            show={showPosModal}
            onClose={() => setShowPosModal(false)}
            onSelect={handlePositionSelect}
            selectedPositionId={formData.approver_position_id || null}
          />
        )}
      </Suspense>
    </div>
  );
};

export default LeaveWorkflowModal;

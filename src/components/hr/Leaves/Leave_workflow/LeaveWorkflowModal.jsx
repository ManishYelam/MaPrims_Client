// src/modules/Leave/Leave_workflows/LeaveWorkflowModal.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, Save, ChevronRight, Eye } from 'lucide-react';
import { hrAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

const DepartmentSelectionModal = lazy(() => import('../../Departments/DepartmentSelectionModal'));
const PositionSelectionModal   = lazy(() => import('../../Recruitment/Positions/PositionSelectionModal'));

const LeaveWorkflowModal = ({ show, workflow, onClose, onSaved, readOnly = false }) => {
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
    // NOTE: status is workflow-managed — see LeaveWorkflowManagement quick actions.
  });

  const isLevelOne = Number(formData.level) === 1;
  const disabled = readOnly || saveLoading;

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
        if (workflow.approver_department) departmentObj = workflow.approver_department;
        else departmentObj = {
          dept_id: workflow.approver_dept_id,
          name: `Department ID: ${workflow.approver_dept_id}`,
          code: '',
        };
      }

      let positionObj = null;
      if (!isInitialLevelOne && workflow.approver_position_id) {
        if (workflow.approver_position) positionObj = workflow.approver_position;
        else positionObj = {
          position_id: workflow.approver_position_id,
          title: `Position ID: ${workflow.approver_position_id}`,
        };
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
      });
      setSelectedDepartment(null);
      setSelectedPosition(null);
    }
  }, [workflow, show]);

  const handleChange = (field, value) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLevelChange = (e) => {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
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

    setSaveLoading(true);
    try {
      if (workflow) {
        // Edit: do NOT send status — workflow-managed via row quick actions
        await hrAPI.updateLeaveWorkflow(workflow.leave_workflow_id, payload);
      } else {
        // Create: always start as 'active'
        await hrAPI.createLeaveWorkflow({ ...payload, status: 'active' });
      }
      toast.success(`Workflow ${workflow ? 'updated' : 'created'}!`);
      onSaved && onSaved();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed';
      toast.error(msg);
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  const labelCls = 'text-[10px] font-medium text-gray-700 mb-0.5 block';
  const inputCls = 'w-full px-1.5 py-1 border rounded text-[11px] focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-600';
  const pickerCls = `flex-1 px-1.5 py-1 border rounded text-[11px] flex items-center justify-between ${
    disabled || isLevelOne ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'
  }`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-3xl w-full max-h-[92vh] flex flex-col shadow-xl">

        {/* ── HEADER — ONLY Save + X ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 border-b">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold flex items-center gap-1.5">
              {readOnly
                ? <><Eye className="w-3.5 h-3.5 text-blue-600" /> View Workflow</>
                : (workflow ? 'Edit Workflow' : 'Create Workflow')}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              {workflow
                ? `Editing: ${workflow.workflow_name || `#${workflow.leave_workflow_id}`}`
                : 'New workflow (will be Active)'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!readOnly && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saveLoading}
                className="px-2.5 py-1 text-[11px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving…' : 'Save'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={saveLoading}
              className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">

          {/* Basic */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Leave Type <span className="text-red-500">*</span></label>
              <select value={formData.leave_type_id}
                onChange={e => handleChange('leave_type_id', e.target.value)}
                className={inputCls}
                disabled={disabled}>
                <option value="">Select</option>
                {leaveTypes.map(lt => (
                  <option key={lt.leave_type_id} value={lt.leave_type_id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Level <span className="text-red-500">*</span></label>
              <input type="number" min="1"
                value={formData.level}
                onChange={handleLevelChange}
                className={inputCls}
                disabled={disabled} />
            </div>
            <div>
              <label className={labelCls}>Workflow Name</label>
              <input type="text"
                value={formData.workflow_name}
                onChange={e => handleChange('workflow_name', e.target.value)}
                className={inputCls}
                disabled={disabled} />
            </div>
            <div>
              <label className={labelCls}>Approver Role <span className="text-red-500">*</span></label>
              <input type="text"
                value={formData.approver_role}
                onChange={e => handleChange('approver_role', e.target.value)}
                placeholder="e.g. manager"
                className={inputCls}
                disabled={disabled} />
            </div>
          </div>

          {/* Approver assignment */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Approver Department</label>
              <div className="flex items-center gap-1">
                <div className={pickerCls}
                  onClick={() => !disabled && !isLevelOne && setShowDeptModal(true)}>
                  <span className="truncate">
                    {isLevelOne
                      ? 'Self Department'
                      : selectedDepartment
                        ? `${selectedDepartment.code || ''} - ${selectedDepartment.name}`
                        : 'None'}
                  </span>
                  {!isLevelOne && !disabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                </div>
                {formData.approver_dept_id && !isLevelOne && !disabled && (
                  <button type="button" onClick={() => handleDepartmentSelect(null)}
                    className="p-0.5 text-gray-400 hover:text-red-600" title="Clear">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Approver Position</label>
              <div className="flex items-center gap-1">
                <div className={pickerCls}
                  onClick={() => !disabled && !isLevelOne && setShowPosModal(true)}>
                  <span className="truncate">
                    {isLevelOne
                      ? 'Head of Department'
                      : selectedPosition
                        ? (selectedPosition.title || `Position #${selectedPosition.position_id}`)
                        : 'None'}
                  </span>
                  {!isLevelOne && !disabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                </div>
                {formData.approver_position_id && !isLevelOne && !disabled && (
                  <button type="button" onClick={() => handlePositionSelect(null)}
                    className="p-0.5 text-gray-400 hover:text-red-600" title="Clear">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Approval Type</label>
              <select value={formData.approval_type}
                onChange={e => handleChange('approval_type', e.target.value)}
                className={inputCls}
                disabled={disabled}>
                <option value="single">Single</option>
                <option value="parallel">Parallel</option>
                <option value="any_one">Any One</option>
                <option value="all_required">All Required</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Escalation Hours</label>
              <input type="number" min="0"
                value={formData.escalation_hours}
                onChange={e => handleChange('escalation_hours', parseInt(e.target.value) || 0)}
                className={inputCls}
                disabled={disabled} />
            </div>
          </div>

          {/* Escalate + custom approvers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Escalate To Role</label>
              <input type="text"
                value={formData.escalate_to_role}
                onChange={e => handleChange('escalate_to_role', e.target.value)}
                placeholder="Optional"
                className={inputCls}
                disabled={disabled} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Custom Approvers (comma-separated IDs)</label>
              <input type="text"
                value={formData.custom_approvers}
                onChange={e => handleChange('custom_approvers', e.target.value)}
                placeholder="e.g. 101, 102"
                className={inputCls}
                disabled={disabled} />
              <p className="text-[9px] text-gray-400 mt-0.5">Numeric IDs separated by commas.</p>
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t pt-2">
            <label className="flex items-center gap-1.5">
              <input type="checkbox"
                checked={formData.is_mandatory}
                onChange={e => handleChange('is_mandatory', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 w-3 h-3"
                disabled={disabled} />
              <span className="text-[11px]">Mandatory</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox"
                checked={formData.can_skip_level}
                onChange={e => handleChange('can_skip_level', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 w-3 h-3"
                disabled={disabled} />
              <span className="text-[11px]">Can Skip Level</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox"
                checked={formData.stop_on_rejection}
                onChange={e => handleChange('stop_on_rejection', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 w-3 h-3"
                disabled={disabled} />
              <span className="text-[11px]">Stop on Rejection</span>
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox"
                checked={formData.auto_approve_if_no_action}
                onChange={e => handleChange('auto_approve_if_no_action', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 w-3 h-3"
                disabled={disabled} />
              <span className="text-[11px]">Auto Approve</span>
            </label>
          </div>
        </div>

        {/* ── FOOTER — no buttons ── */}
        <div className="flex-shrink-0 flex items-center justify-end px-2 py-1 border-t bg-gray-50">
          <p className="text-[9px] text-gray-500">
            {workflow
              ? `Workflow #${workflow.leave_workflow_id}`
              : 'New workflow (will be Active)'}
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        {showDeptModal && !readOnly && (
          <DepartmentSelectionModal
            show={showDeptModal}
            onClose={() => setShowDeptModal(false)}
            onSelect={handleDepartmentSelect}
            selectedDepartmentId={formData.approver_dept_id || null}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showPosModal && !readOnly && (
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
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { X, Save, User, Plus, AlertCircle } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));
const AllowanceSelectionModal = lazy(() => import('../Allowances/AllowanceSelectionModal'));
const DeductionSelectionModal = lazy(() => import('../Deductions/DeductionSelectionModal'));
const BonusSelectionModal = lazy(() => import('../Bonuses/BonusSelectionModal'));

const SalaryStructureModal = ({ show, record, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);

  const [selectedAllowances, setSelectedAllowances] = useState([]);
  const [selectedDeductions, setSelectedDeductions] = useState([]);
  const [selectedBonuses, setSelectedBonuses] = useState([]);
  const [reimbursementsList, setReimbursementsList] = useState([]);

  // Gratuity state
  const [gratuityEnabled, setGratuityEnabled] = useState(false);
  const [gratuityPercent, setGratuityPercent] = useState('4.81');

  const [baseSalaryWarning, setBaseSalaryWarning] = useState(false);

  const [formData, setFormData] = useState({
    emp_id: '',
    effective_date: '',
    end_date: '',
    base_salary: '',
    allowances: '{}',
    deductions: '{}',
    bonuses: '{}',
    reimbursements: '{}',
    gratuity: 0,
    revision_number: 1,
    revision_reason: '',
    status: 'active',
  });

  const isEdit = !!record;

  // Helper to safely parse JSON (handles object, string, or empty)
  const parseJsonSafely = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  // Helper to parse a stored string (with symbol) to numeric value and isPercentage flag
  const parseStoredValue = (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.endsWith('%')) {
        const num = parseFloat(trimmed.slice(0, -1));
        return { value: isNaN(num) ? 0 : num, isPercentage: true };
      } else if (trimmed.startsWith('₹')) {
        const num = parseFloat(trimmed.slice(1));
        return { value: isNaN(num) ? 0 : num, isPercentage: false };
      } else {
        const num = parseFloat(trimmed);
        return { value: isNaN(num) ? 0 : num, isPercentage: false };
      }
    } else if (typeof val === 'number') {
      return { value: val, isPercentage: false };
    }
    return { value: 0, isPercentage: false };
  };

  // Helper to format numeric value for storage (with symbol)
  const formatValueForStorage = (value, isPercentage) => {
    const num = parseFloat(value) || 0;
    return isPercentage ? `${num}%` : `₹${num}`;
  };

  const hasPercentageComponents = useMemo(() => {
    return (
      selectedAllowances.some(a => a.isPercentage) ||
      selectedDeductions.some(d => d.isPercentage) ||
      selectedBonuses.some(b => b.isPercentage)
    );
  }, [selectedAllowances, selectedDeductions, selectedBonuses]);

  const baseSalaryNum = parseFloat(formData.base_salary) || 0;

  const gratuityAmount = gratuityEnabled ? (baseSalaryNum * parseFloat(gratuityPercent || 0)) / 100 : 0;

  const calculatedGross = useMemo(() => {
    const allowancesSum = selectedAllowances.reduce((sum, item) => {
      const val = parseFloat(item.value) || 0;
      return sum + (item.isPercentage ? (baseSalaryNum * val) / 100 : val);
    }, 0);
    const bonusesSum = selectedBonuses.reduce((sum, item) => {
      const val = parseFloat(item.value) || 0;
      return sum + (item.isPercentage ? (baseSalaryNum * val) / 100 : val);
    }, 0);
    const reimbursementsSum = Object.values(parseJsonSafely(formData.reimbursements)).reduce(
      (sum, v) => {
        const parsed = parseStoredValue(v);
        return sum + parsed.value;
      },
      0
    );
    return baseSalaryNum + allowancesSum + bonusesSum + reimbursementsSum;
  }, [formData.base_salary, formData.reimbursements, selectedAllowances, selectedBonuses]);

  const calculatedNet = useMemo(() => {
    const deductionsSum = selectedDeductions.reduce((sum, item) => {
      const val = parseFloat(item.value) || 0;
      return sum + (item.isPercentage ? (baseSalaryNum * val) / 100 : val);
    }, 0);
    return calculatedGross - deductionsSum;
  }, [calculatedGross, selectedDeductions, baseSalaryNum]);

  const calculatedAnnualCTC = useMemo(() => calculatedGross * 12, [calculatedGross]);

  // Helper for employee display name
  const getEmployeeDisplayName = (emp) => {
    if (!emp) return '';
    if (emp.name) return emp.name;
    if (emp.display_name) return emp.display_name;
    return [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.email || `ID: ${emp.emp_id}`;
  };

  useEffect(() => {
    if (record) {
      // Set form data; ensure JSON fields are strings
      setFormData({
        emp_id: record.emp_id || '',
        effective_date: record.effective_date || '',
        end_date: record.end_date || '',
        base_salary: record.base_salary != null ? String(record.base_salary) : '',
        allowances: JSON.stringify(parseJsonSafely(record.allowances), null, 2),
        deductions: JSON.stringify(parseJsonSafely(record.deductions), null, 2),
        bonuses: JSON.stringify(parseJsonSafely(record.bonuses), null, 2),
        reimbursements: JSON.stringify(parseJsonSafely(record.reimbursements), null, 2),
        gratuity: record.gratuity || 0,
        revision_number: record.revision_number || 1,
        revision_reason: record.revision_reason || '',
        status: record.status || 'active',
      });

      // Gratuity setup
      if (record.gratuity && record.gratuity > 0) {
        setGratuityEnabled(true);
        const base = parseFloat(record.base_salary) || 0;
        if (base > 0) {
          setGratuityPercent(((record.gratuity / base) * 100).toFixed(2));
        } else {
          setGratuityPercent('4.81');
        }
      } else {
        setGratuityEnabled(false);
        setGratuityPercent('4.81');
      }

      // Convert selected components from parsed objects
      const allowancesObj = parseJsonSafely(record.allowances);
      const deductionsObj = parseJsonSafely(record.deductions);
      const bonusesObj = parseJsonSafely(record.bonuses);
      const reimbursementsObj = parseJsonSafely(record.reimbursements);

      setSelectedAllowances(
        Object.entries(allowancesObj).map(([name, value]) => {
          const parsed = parseStoredValue(value);
          return { name, value: parsed.value, isPercentage: parsed.isPercentage };
        })
      );
      setSelectedDeductions(
        Object.entries(deductionsObj).map(([name, value]) => {
          const parsed = parseStoredValue(value);
          return { name, value: parsed.value, isPercentage: parsed.isPercentage, code: '' };
        })
      );
      setSelectedBonuses(
        Object.entries(bonusesObj).map(([name, value]) => {
          const parsed = parseStoredValue(value);
          return { name, value: parsed.value, isPercentage: parsed.isPercentage };
        })
      );
      setReimbursementsList(
        Object.entries(reimbursementsObj).map(([name, value]) => {
          const parsed = parseStoredValue(value);
          return { name, value: parsed.value };
        })
      );

      setSelectedEmployee(record.employee_name ? { emp_id: record.emp_id, name: record.employee_name } : null);
    } else {
      // Reset for new entry
      setFormData({
        emp_id: '',
        effective_date: '',
        end_date: '',
        base_salary: '',
        allowances: '{}',
        deductions: '{}',
        bonuses: '{}',
        reimbursements: '{}',
        gratuity: 0,
        revision_number: 1,
        revision_reason: '',
        status: 'active',
      });
      setSelectedAllowances([]);
      setSelectedDeductions([]);
      setSelectedBonuses([]);
      setReimbursementsList([]);
      setSelectedEmployee(null);
      setGratuityEnabled(false);
      setGratuityPercent('4.81');
    }
    setValidationErrors({});
  }, [record]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleEmployeeSelect = (emp) => {
    if (emp) {
      setSelectedEmployee(emp);
      handleChange('emp_id', emp.emp_id);
    } else {
      setSelectedEmployee(null);
      handleChange('emp_id', '');
    }
    setShowEmployeeModal(false);
  };

  const isPercentageBased = (item, type) => {
    if (type === 'allowance' || type === 'deduction') {
      return item.calculation_basis === 'base_salary_percentage' || item.calculation_basis === 'gross_salary_percentage';
    } else if (type === 'bonus') {
      return item.calculation_method === 'base_salary_percentage' || item.calculation_method === 'gross_salary_percentage';
    }
    return false;
  };

  const handleAllowancesSelected = (selectedItems) => {
    const existing = parseJsonSafely(formData.allowances);
    const selectedList = [];
    selectedItems.forEach(item => {
      const isPct = isPercentageBased(item, 'allowance');
      const amount = isPct ? parseFloat(item.percentage) || 0 : parseFloat(item.value) || 0;
      existing[item.name] = formatValueForStorage(amount, isPct);
      selectedList.push({ name: item.name, value: amount, isPercentage: isPct });
    });
    const mergedList = [...selectedAllowances.filter(s => !selectedList.some(n => n.name === s.name)), ...selectedList];
    handleChange('allowances', JSON.stringify(existing, null, 2));
    setSelectedAllowances(mergedList);
    setShowAllowanceModal(false);
  };

  const handleDeductionsSelected = (selectedItems) => {
    const existing = parseJsonSafely(formData.deductions);
    const selectedList = [];
    selectedItems.forEach(item => {
      const isPct = isPercentageBased(item, 'deduction');
      const amount = isPct ? parseFloat(item.percentage) || 0 : parseFloat(item.value) || 0;
      existing[item.name] = formatValueForStorage(amount, isPct);
      selectedList.push({ name: item.name, value: amount, isPercentage: isPct, code: item.code });
    });
    const mergedList = [...selectedDeductions.filter(s => !selectedList.some(n => n.name === s.name)), ...selectedList];
    handleChange('deductions', JSON.stringify(existing, null, 2));
    setSelectedDeductions(mergedList);
    setShowDeductionModal(false);
  };

  const handleBonusesSelected = (selectedItems) => {
    const existing = parseJsonSafely(formData.bonuses);
    const selectedList = [];
    selectedItems.forEach(item => {
      const isPct = isPercentageBased(item, 'bonus');
      const amount = isPct ? parseFloat(item.percentage) || 0 : parseFloat(item.value) || 0;
      existing[item.name] = formatValueForStorage(amount, isPct);
      selectedList.push({ name: item.name, value: amount, isPercentage: isPct });
    });
    const mergedList = [...selectedBonuses.filter(s => !selectedList.some(n => n.name === s.name)), ...selectedList];
    handleChange('bonuses', JSON.stringify(existing, null, 2));
    setSelectedBonuses(mergedList);
    setShowBonusModal(false);
  };

  const removeAllowance = (nameToRemove) => {
    const updatedAllowances = selectedAllowances.filter(item => item.name !== nameToRemove);
    setSelectedAllowances(updatedAllowances);
    const currentJson = parseJsonSafely(formData.allowances);
    delete currentJson[nameToRemove];
    handleChange('allowances', JSON.stringify(currentJson, null, 2));
  };

  const removeDeduction = (nameToRemove) => {
    const updatedDeductions = selectedDeductions.filter(item => item.name !== nameToRemove);
    setSelectedDeductions(updatedDeductions);
    const currentJson = parseJsonSafely(formData.deductions);
    delete currentJson[nameToRemove];
    handleChange('deductions', JSON.stringify(currentJson, null, 2));
  };

  const removeBonus = (nameToRemove) => {
    const updatedBonuses = selectedBonuses.filter(item => item.name !== nameToRemove);
    setSelectedBonuses(updatedBonuses);
    const currentJson = parseJsonSafely(formData.bonuses);
    delete currentJson[nameToRemove];
    handleChange('bonuses', JSON.stringify(currentJson, null, 2));
  };

  const updateReimbursementsJson = (list) => {
    const obj = {};
    list.forEach(item => {
      if (item.name.trim()) obj[item.name.trim()] = `₹${parseFloat(item.value) || 0}`;
    });
    handleChange('reimbursements', JSON.stringify(obj, null, 2));
  };

  const addReimbursement = () => {
    const newList = [...reimbursementsList, { name: '', value: 0 }];
    setReimbursementsList(newList);
    updateReimbursementsJson(newList);
  };

  const updateReimbursement = (index, field, value) => {
    const newList = [...reimbursementsList];
    newList[index] = { ...newList[index], [field]: value };
    setReimbursementsList(newList);
    updateReimbursementsJson(newList);
  };

  const removeReimbursement = (index) => {
    const newList = reimbursementsList.filter((_, i) => i !== index);
    setReimbursementsList(newList);
    updateReimbursementsJson(newList);
  };

  const formatComponentText = (list) => {
    return list.map(item => {
      const val = parseFloat(item.value);
      if (item.isPercentage) {
        return `${item.name}: ${val.toFixed(2)}%`;
      } else {
        return `${item.name}: ₹${val.toFixed(2)}`;
      }
    }).join('\n');
  };

  const validate = () => {
    const errors = {};
    if (!formData.emp_id) errors.emp_id = 'Employee ID is required';
    if (!formData.effective_date) errors.effective_date = 'Effective date is required';
    const base = parseFloat(formData.base_salary);
    if (isNaN(base) || base < 0) errors.base_salary = 'Base salary must be a non-negative number';
    if (formData.end_date && formData.effective_date && new Date(formData.end_date) < new Date(formData.effective_date)) errors.end_date = 'End date cannot be before effective date';
    if (hasPercentageComponents && (!base || base <= 0)) {
      errors.base_salary = 'Base salary is required for percentage-based components';
    }
    try { JSON.parse(formData.allowances || '{}'); } catch (e) { errors.allowances = 'Invalid JSON'; }
    try { JSON.parse(formData.deductions || '{}'); } catch (e) { errors.deductions = 'Invalid JSON'; }
    try { JSON.parse(formData.bonuses || '{}'); } catch (e) { errors.bonuses = 'Invalid JSON'; }
    try { JSON.parse(formData.reimbursements || '{}'); } catch (e) { errors.reimbursements = 'Invalid JSON'; }
    setValidationErrors(errors);
    setBaseSalaryWarning(!!errors.base_salary);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = {
        emp_id: parseInt(formData.emp_id),
        effective_date: formData.effective_date,
        end_date: formData.end_date || null,
        base_salary: parseFloat(formData.base_salary) || 0,
        allowances: JSON.parse(formData.allowances || '{}'),
        deductions: JSON.parse(formData.deductions || '{}'),
        bonuses: JSON.parse(formData.bonuses || '{}'),
        reimbursements: JSON.parse(formData.reimbursements || '{}'),
        gratuity: gratuityEnabled ? gratuityAmount : 0,
        revision_number: parseInt(formData.revision_number) || 1,
        revision_reason: formData.revision_reason || '',
        status: formData.status || 'active',
        monthly_gross_salary: calculatedGross,
        monthly_net_salary: calculatedNet,
        annual_ctc: calculatedAnnualCTC,
        total_ctc: calculatedAnnualCTC,
      };
      const response = record
        ? await hrAPI.updateSalaryStructure(record.salary_structure_id, payload)
        : await hrAPI.createSalaryStructure(payload);
      if (response.data?.success) onSaved();
      else throw new Error(response.data?.message || 'Save failed');
    } catch (err) {
      console.error(err);
      alert(err.message || 'An error occurred while saving.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-6xl w-full h-[90vh] flex flex-col shadow-xl">
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b">
          <h2 className="text-sm font-semibold">{record ? 'Edit Salary Structure' : 'Create Salary Structure'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-2 py-1 border rounded text-xs bg-white flex items-center justify-between ${!isEdit && !saveLoading ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed bg-gray-100'}`}
                  onClick={() => !saveLoading && !isEdit && setShowEmployeeModal(true)}
                >
                  <span className={formData.emp_id ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedEmployee
                      ? `${getEmployeeDisplayName(selectedEmployee)} (${selectedEmployee.emp_id})`
                      : (formData.emp_id ? `Employee #${formData.emp_id}` : 'Select Employee')}
                  </span>
                  <User className="w-3 h-3 text-gray-400" />
                </div>
                {!isEdit && formData.emp_id && (
                  <button onClick={() => { handleChange('emp_id', ''); setSelectedEmployee(null); }} className="p-0.5 text-gray-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                )}
              </div>
              {validationErrors.emp_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.emp_id}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Effective Date <span className="text-red-500">*</span></label>
              <input type="date" value={formData.effective_date} onChange={e => handleChange('effective_date', e.target.value)} className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.effective_date ? 'border-red-500' : ''}`} disabled={saveLoading} />
              {validationErrors.effective_date && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.effective_date}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">End Date</label>
              <input type="date" value={formData.end_date} onChange={e => handleChange('end_date', e.target.value)} className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500" disabled={saveLoading} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Base Salary <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.base_salary}
                onChange={e => handleChange('base_salary', e.target.value)}
                className={`w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 ${validationErrors.base_salary ? 'border-red-500' : ''}`}
                placeholder="0.00"
                disabled={saveLoading}
              />
              {validationErrors.base_salary && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.base_salary}</p>}
            </div>
          </div>

          {baseSalaryWarning && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded flex items-start gap-1">
              <AlertCircle className="w-3 h-3 text-yellow-600 mt-0.5" />
              <p className="text-[10px] text-yellow-800">
                Base salary is required because percentage-based components are selected.
              </p>
            </div>
          )}

          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Salary Components</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Allowances */}
              <div className="border rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-medium text-gray-700">Allowances</span>
                  <button onClick={() => setShowAllowanceModal(true)} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                    <Plus className="w-3 h-3" /> Select
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedAllowances.length > 0 ? (
                    selectedAllowances.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px]">
                        {item.name}
                        <button
                          onClick={() => removeAllowance(item.name)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400">No allowances selected</span>
                  )}
                </div>
                <textarea
                  rows="4"
                  value={formatComponentText(selectedAllowances)}
                  readOnly
                  className="w-full px-2 py-1 border rounded text-xs font-mono bg-gray-100 text-gray-600"
                />
              </div>

              {/* Deductions */}
              <div className="border rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-medium text-gray-700">Deductions</span>
                  <button onClick={() => setShowDeductionModal(true)} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                    <Plus className="w-3 h-3" /> Select
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedDeductions.length > 0 ? (
                    selectedDeductions.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[10px]">
                        {item.name}
                        <button
                          onClick={() => removeDeduction(item.name)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400">No deductions selected</span>
                  )}
                </div>
                <textarea
                  rows="4"
                  value={formatComponentText(selectedDeductions)}
                  readOnly
                  className="w-full px-2 py-1 border rounded text-xs font-mono bg-gray-100 text-gray-600"
                />
              </div>

              {/* Bonuses */}
              <div className="border rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-medium text-gray-700">Bonuses</span>
                  <button onClick={() => setShowBonusModal(true)} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                    <Plus className="w-3 h-3" /> Select
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedBonuses.length > 0 ? (
                    selectedBonuses.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-[10px]">
                        {item.name}
                        <button
                          onClick={() => removeBonus(item.name)}
                          className="text-red-500 hover:text-red-700 focus:outline-none"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400">No bonuses selected</span>
                  )}
                </div>
                <textarea
                  rows="4"
                  value={formatComponentText(selectedBonuses)}
                  readOnly
                  className="w-full px-2 py-1 border rounded text-xs font-mono bg-gray-100 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Reimbursements (inline) */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Reimbursements</h4>
            <div className="space-y-1">
              {reimbursementsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateReimbursement(idx, 'name', e.target.value)}
                    placeholder="Name"
                    className="flex-1 px-2 py-1 border rounded text-xs"
                    disabled={saveLoading}
                  />
                  <input
                    type="number"
                    value={item.value}
                    onChange={e => updateReimbursement(idx, 'value', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-24 px-2 py-1 border rounded text-xs"
                    disabled={saveLoading}
                  />
                  <button onClick={() => removeReimbursement(idx)} className="text-red-500 hover:text-red-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={addReimbursement} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                <Plus className="w-3 h-3" /> Add Reimbursement
              </button>
            </div>
          </div>

          {/* Gratuity in single line */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Gratuity</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1 text-[10px] text-gray-700">
                <input
                  type="checkbox"
                  checked={gratuityEnabled}
                  onChange={e => setGratuityEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  disabled={saveLoading}
                />
                Enable Gratuity Calculation
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-700">Percentage:</span>
                <input
                  type="number"
                  value={gratuityPercent}
                  onChange={e => setGratuityPercent(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-20 px-2 py-0.5 border rounded text-xs focus:ring-1 focus:ring-primary-500"
                  disabled={saveLoading || !gratuityEnabled}
                />
                <span className="text-[10px] text-gray-500">%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-700">Amount:</span>
                <span className="text-sm font-mono font-semibold">₹{gratuityAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Revision & Status */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Revision Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Revision Number</label>
                <input type="number" value={formData.revision_number} onChange={e => handleChange('revision_number', e.target.value)} className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500" min="1" disabled={saveLoading} />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Status</label>
                <select value={formData.status} onChange={e => handleChange('status', e.target.value)} className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500" disabled={saveLoading}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Revision Reason</label>
                <textarea rows="1" value={formData.revision_reason} onChange={e => handleChange('revision_reason', e.target.value)} className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500 resize-none" disabled={saveLoading} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-2 bg-gray-50 rounded p-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Auto-calculated Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-[9px] text-gray-500">Monthly Gross</p>
                <p className="text-sm font-mono font-semibold">₹{calculatedGross.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Monthly Net</p>
                <p className="text-sm font-mono font-semibold">₹{calculatedNet.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Annual CTC</p>
                <p className="text-sm font-mono font-semibold">₹{calculatedAnnualCTC.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Total CTC</p>
                <p className="text-sm font-mono font-semibold">₹{calculatedAnnualCTC.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between p-2 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">{record ? `Editing salary structure #${record.salary_structure_id}` : 'New salary structure'}</p>
          <div className="flex gap-1.5">
            <button onClick={onClose} className="px-2.5 py-1 text-[10px] border rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled={saveLoading}>Cancel</button>
            <button onClick={handleSave} className="px-2.5 py-1 text-[10px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50" disabled={saveLoading}>
              <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <Suspense fallback={null}>
          {showEmployeeModal && <EmployeeSelectionModal show={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} onSelect={handleEmployeeSelect} selectedEmployeeId={formData.emp_id || null} />}
          {showAllowanceModal && <AllowanceSelectionModal show={showAllowanceModal} onClose={() => setShowAllowanceModal(false)} onSelect={handleAllowancesSelected} multiple quickSelect={false} />}
          {showDeductionModal && <DeductionSelectionModal show={showDeductionModal} onClose={() => setShowDeductionModal(false)} onSelect={handleDeductionsSelected} multiple quickSelect={false} />}
          {showBonusModal && <BonusSelectionModal show={showBonusModal} onClose={() => setShowBonusModal(false)} onSelect={handleBonusesSelected} multiple quickSelect={false} />}
        </Suspense>
      </div>
    </div>
  );
};

export default SalaryStructureModal;
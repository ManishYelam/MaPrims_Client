import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { X, Save, User, Plus, AlertCircle, Briefcase, Loader2 } from 'lucide-react';
import { hrAPI } from '../../../../services/api';

const EmployeeSelectionModal = lazy(() => import('../../Employees/EmployeeSelectionModal'));
const PayrollRunSelectionModal = lazy(() => import('../Payroll_runs/PayrollRunSelectionModal'));
const AllowanceSelectionModal = lazy(() => import('../Allowances/AllowanceSelectionModal'));
const DeductionSelectionModal = lazy(() => import('../Deductions/DeductionSelectionModal'));
const BonusSelectionModal = lazy(() => import('../Bonuses/BonusSelectionModal'));
const SalaryStructureSelectionModal = lazy(() => import('../Salary_structures/SalaryStructureSelectionModal'));

const PayrollItemModal = ({ show, record, onClose, onSaved }) => {
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPayrollRunModal, setShowPayrollRunModal] = useState(false);
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showSalaryStructureModal, setShowSalaryStructureModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPayrollRun, setSelectedPayrollRun] = useState(null);
  const [selectedSalaryStructure, setSelectedSalaryStructure] = useState(null);
  const [selectedAllowances, setSelectedAllowances] = useState([]);
  const [selectedDeductions, setSelectedDeductions] = useState([]);
  const [selectedBonuses, setSelectedBonuses] = useState([]);
  const [reimbursementsList, setReimbursementsList] = useState([]);

  const [runApproved, setRunApproved] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [toast, setToast] = useState(null);

  const [baseSalaryWarning, setBaseSalaryWarning] = useState(false);

  const [formData, setFormData] = useState({
    payroll_run_id: '',
    emp_id: '',
    salary_structure_id: '',
    base_salary: 0,
    allowances: '{}',
    deductions: '{}',
    bonuses: '{}',
    reimbursements: '{}',
    overtime_pay: 0,
    commission: 0,
    other_earnings: 0,
    payable_days: 0,
    present_days: 0,
    absent_days: 0,
    leave_days: 0,
    overtime_hours: 0,
    payment_mode: 'bank_transfer',
    payment_status: 'pending',
    payment_reference: '',
    bank_details: '{}',
    payslip_generated: false,
    payslip_url: '',
    remarks: '',
  });

  const isEdit = !!record;

  const hasPercentageComponents = useMemo(() => {
    return (
      selectedAllowances.some(a => a.isPercentage) ||
      selectedDeductions.some(d => d.isPercentage) ||
      selectedBonuses.some(b => b.isPercentage)
    );
  }, [selectedAllowances, selectedDeductions, selectedBonuses]);

  const baseSalaryNum = parseFloat(formData.base_salary) || 0;

  const totalAllowances = useMemo(() => {
    return selectedAllowances.reduce((sum, item) => {
      const val = parseFloat(item.value) || 0;
      return sum + (item.isPercentage ? (baseSalaryNum * val) / 100 : val);
    }, 0);
  }, [baseSalaryNum, selectedAllowances]);

  const totalBonuses = useMemo(() => {
    return selectedBonuses.reduce((sum, item) => {
      const val = parseFloat(item.value) || 0;
      return sum + (item.isPercentage ? (baseSalaryNum * val) / 100 : val);
    }, 0);
  }, [baseSalaryNum, selectedBonuses]);

  const totalDeductions = useMemo(() => {
    return selectedDeductions.reduce((sum, item) => {
      const val = parseFloat(item.value) || 0;
      return sum + (item.isPercentage ? (baseSalaryNum * val) / 100 : val);
    }, 0);
  }, [baseSalaryNum, selectedDeductions]);

  const totalReimbursements = useMemo(() => {
    return reimbursementsList.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
  }, [reimbursementsList]);

  const totalDaysInPeriod = useMemo(() => {
    if (!selectedPayrollRun?.period_start || !selectedPayrollRun?.period_end) return 0;
    const start = new Date(selectedPayrollRun.period_start);
    const end = new Date(selectedPayrollRun.period_end);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }, [selectedPayrollRun]);

  const payableSalary = useMemo(() => {
    if (totalDaysInPeriod <= 0) return 0;
    const payableDays = parseFloat(formData.payable_days) || 0;
    return (baseSalaryNum * payableDays) / totalDaysInPeriod;
  }, [baseSalaryNum, formData.payable_days, totalDaysInPeriod]);

  const grossPay = useMemo(() => {
    return (
      payableSalary + // prorated base salary
      totalAllowances +
      totalBonuses +
      parseFloat(formData.overtime_pay) || 0 +
      parseFloat(formData.commission) || 0 +
      parseFloat(formData.other_earnings) || 0 +
      totalReimbursements
    );
  }, [payableSalary, totalAllowances, totalBonuses, totalReimbursements, formData.overtime_pay, formData.commission, formData.other_earnings]);

  const netPay = useMemo(() => grossPay - totalDeductions, [grossPay, totalDeductions]);

  const getEmployeeDisplayName = (emp) => {
    if (!emp) return '';
    if (emp.name) return emp.name;
    if (emp.display_name) return emp.display_name;
    return [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.email || `ID: ${emp.emp_id}`;
  };

  const getPayrollRunDisplayName = (run) => {
    if (!run) return '';
    if (run.name) return `${run.name} (${run.payroll_code || run.payroll_run_id})`;
    if (run.payroll_run_name) return run.payroll_run_name;
    return `Run #${run.payroll_run_id}`;
  };

  const getSalaryStructureDisplayName = (ss) => {
    if (!ss) return '';
    const name = ss.employee_name || ss.name || '';
    const empId = ss.emp_id || (ss.employee && ss.employee.emp_id) || '';
    if (name && empId) return `${name} (${empId})`;
    if (name) return name;
    if (empId) return `Employee #${empId}`;
    return `Structure #${ss.salary_structure_id}`;
  };

  const isPercentageBased = (item, type) => {
    if (type === 'allowance' || type === 'deduction') {
      return item.calculation_basis === 'base_salary_percentage' || item.calculation_basis === 'gross_salary_percentage';
    } else if (type === 'bonus') {
      return item.calculation_method === 'base_salary_percentage' || item.calculation_method === 'gross_salary_percentage';
    }
    return false;
  };

  const parseJsonSafely = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const parseComponentValue = (val) => {
    if (val == null) return { value: 0, isPercentage: false };
    if (typeof val === 'number') return { value: val, isPercentage: false };
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.endsWith('%')) {
        const num = parseFloat(trimmed.slice(0, -1));
        return { value: isNaN(num) ? 0 : num, isPercentage: true };
      }
      if (trimmed.startsWith('₹')) {
        const num = parseFloat(trimmed.slice(1));
        return { value: isNaN(num) ? 0 : num, isPercentage: false };
      }
      const num = parseFloat(trimmed);
      return { value: isNaN(num) ? 0 : num, isPercentage: false };
    }
    return { value: 0, isPercentage: false };
  };

  const formatValueForStorage = (value, isPercentage) => {
    const num = parseFloat(value) || 0;
    return isPercentage ? `${num}%` : `₹${num}`;
  };

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedEmployee || !selectedPayrollRun || !runApproved) return;
    if (!selectedPayrollRun.period_start || !selectedPayrollRun.period_end) return;

    setAttendanceLoading(true);
    try {
      const response = await hrAPI.getAttendanceByEmployeePeriod(
        selectedEmployee.emp_id,
        selectedPayrollRun.period_start,
        selectedPayrollRun.period_end
      );
      if (response.data?.success) {
        const data = response.data.data;
        setAttendanceData(data);
        handleChange('payable_days', data.payable_days || 0);
        handleChange('present_days', data.present_days || 0);
        handleChange('absent_days', data.absent_days || 0);
        handleChange('leave_days', data.leave_days || 0);
        handleChange('overtime_hours', data.overtime_hours || 0);
      } else {
        setAttendanceData(null);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setAttendanceData(null);
      showToast('Failed to load attendance data', 'error');
    } finally {
      setAttendanceLoading(false);
    }
  }, [selectedEmployee, selectedPayrollRun, runApproved, showToast]);

  useEffect(() => {
    if (show && selectedEmployee && selectedPayrollRun && runApproved) {
      fetchAttendance();
    } else {
      setAttendanceData(null);
    }
  }, [show, selectedEmployee, selectedPayrollRun, runApproved, fetchAttendance]);

  useEffect(() => {
    if (record) {
      const allowancesObj = parseJsonSafely(record.allowances);
      const deductionsObj = parseJsonSafely(record.deductions);
      const bonusesObj = parseJsonSafely(record.bonuses);
      const reimbursementsObj = parseJsonSafely(record.reimbursements);

      const formattedAllowances = {};
      Object.entries(allowancesObj).forEach(([name, value]) => {
        const parsed = parseComponentValue(value);
        formattedAllowances[name] = formatValueForStorage(parsed.value, parsed.isPercentage);
      });
      const formattedDeductions = {};
      Object.entries(deductionsObj).forEach(([name, value]) => {
        const parsed = parseComponentValue(value);
        formattedDeductions[name] = formatValueForStorage(parsed.value, parsed.isPercentage);
      });
      const formattedBonuses = {};
      Object.entries(bonusesObj).forEach(([name, value]) => {
        const parsed = parseComponentValue(value);
        formattedBonuses[name] = formatValueForStorage(parsed.value, parsed.isPercentage);
      });
      const formattedReimbursements = {};
      Object.entries(reimbursementsObj).forEach(([name, value]) => {
        const parsed = parseComponentValue(value);
        formattedReimbursements[name] = formatValueForStorage(parsed.value, false);
      });

      setFormData({
        payroll_run_id: record.payroll_run_id || '',
        emp_id: record.emp_id || '',
        salary_structure_id: record.salary_structure_id || '',
        base_salary: record.base_salary || 0,
        allowances: JSON.stringify(formattedAllowances, null, 2),
        deductions: JSON.stringify(formattedDeductions, null, 2),
        bonuses: JSON.stringify(formattedBonuses, null, 2),
        reimbursements: JSON.stringify(formattedReimbursements, null, 2),
        overtime_pay: record.overtime_pay || 0,
        commission: record.commission || 0,
        other_earnings: record.other_earnings || 0,
        payable_days: record.payable_days || 0,
        present_days: record.present_days || 0,
        absent_days: record.absent_days || 0,
        leave_days: record.leave_days || 0,
        overtime_hours: record.overtime_hours || 0,
        payment_mode: record.payment_mode || 'bank_transfer',
        payment_status: record.payment_status || 'pending',
        payment_reference: record.payment_reference || '',
        bank_details: JSON.stringify(record.bank_details || {}, null, 2),
        payslip_generated: record.payslip_generated || false,
        payslip_url: record.payslip_url || '',
        remarks: record.remarks || '',
      });

      setSelectedAllowances(
        Object.entries(allowancesObj).map(([name, value]) => {
          const parsed = parseComponentValue(value);
          return { name, value: parsed.value, isPercentage: parsed.isPercentage, fromSalaryStructure: true };
        })
      );
      setSelectedDeductions(
        Object.entries(deductionsObj).map(([name, value]) => {
          const parsed = parseComponentValue(value);
          return { name, value: parsed.value, isPercentage: parsed.isPercentage, code: '', fromSalaryStructure: true };
        })
      );
      setSelectedBonuses(
        Object.entries(bonusesObj).map(([name, value]) => {
          const parsed = parseComponentValue(value);
          return { name, value: parsed.value, isPercentage: parsed.isPercentage, fromSalaryStructure: true };
        })
      );
      setReimbursementsList(
        Object.entries(reimbursementsObj).map(([name, value]) => {
          const parsed = parseComponentValue(value);
          return { name, value: parsed.value };
        })
      );

      setSelectedEmployee(record.employee_name ? { emp_id: record.emp_id, name: record.employee_name } : null);
      setSelectedPayrollRun(record.payroll_run_name ? { payroll_run_id: record.payroll_run_id, name: record.payroll_run_name, payroll_code: record.payroll_code } : null);
      setSelectedSalaryStructure(record.salary_structure_id ? { salary_structure_id: record.salary_structure_id, employee_name: record.employee_name, emp_id: record.emp_id } : null);

      if (record.payroll_run_id) {
        const runObj = record.payroll_run || {};
        setSelectedPayrollRun(runObj);
        const isApproved =
          runObj.status === 'approved' &&
          runObj.approved_by !== null &&
          runObj.approved_by !== undefined;
        setRunApproved(isApproved);
        if (!isApproved) {
          showToast('Payroll run is not approved', 'warning');
        }
      } else {
        setRunApproved(false);
      }
    } else {
      setFormData({
        payroll_run_id: '',
        emp_id: '',
        salary_structure_id: '',
        base_salary: 0,
        allowances: '{}',
        deductions: '{}',
        bonuses: '{}',
        reimbursements: '{}',
        overtime_pay: 0,
        commission: 0,
        other_earnings: 0,
        payable_days: 0,
        present_days: 0,
        absent_days: 0,
        leave_days: 0,
        overtime_hours: 0,
        payment_mode: 'bank_transfer',
        payment_status: 'pending',
        payment_reference: '',
        bank_details: '{}',
        payslip_generated: false,
        payslip_url: '',
        remarks: '',
      });
      setSelectedAllowances([]);
      setSelectedDeductions([]);
      setSelectedBonuses([]);
      setReimbursementsList([]);
      setSelectedEmployee(null);
      setSelectedPayrollRun(null);
      setSelectedSalaryStructure(null);
      setRunApproved(false);
      setAttendanceData(null);
    }
    setValidationErrors({});
  }, [record, showToast]);

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
      setSelectedSalaryStructure(null);
      handleChange('salary_structure_id', '');
    } else {
      setSelectedEmployee(null);
      handleChange('emp_id', '');
      setSelectedSalaryStructure(null);
      handleChange('salary_structure_id', '');
    }
    setShowEmployeeModal(false);
  };

  const handlePayrollRunSelect = (run) => {
    if (run) {
      const isApproved =
        run.status === 'approved' &&
        run.approved_by !== null &&
        run.approved_by !== undefined;

      if (!isApproved) {
        setSelectedPayrollRun(null);
        handleChange('payroll_run_id', '');
        setRunApproved(false);
        showToast('Payroll run is not approved', 'warning');
        setShowPayrollRunModal(false);
        return;
      }
      setSelectedPayrollRun(run);
      handleChange('payroll_run_id', run.payroll_run_id);
      setRunApproved(true);
    } else {
      setSelectedPayrollRun(null);
      handleChange('payroll_run_id', '');
      setRunApproved(false);
    }
    setShowPayrollRunModal(false);
  };

  const handleSalaryStructureSelect = (ss) => {
    if (ss) {
      setSelectedSalaryStructure(ss);
      handleChange('salary_structure_id', ss.salary_structure_id);
      if (ss.base_salary !== undefined) handleChange('base_salary', ss.base_salary);

      if (ss.allowances) {
        const rawAllowances = parseJsonSafely(ss.allowances);
        const formattedAllowances = {};
        Object.entries(rawAllowances).forEach(([name, value]) => {
          const parsed = parseComponentValue(value);
          formattedAllowances[name] = formatValueForStorage(parsed.value, parsed.isPercentage);
        });
        handleChange('allowances', JSON.stringify(formattedAllowances, null, 2));
        setSelectedAllowances(
          Object.entries(rawAllowances).map(([name, value]) => {
            const parsed = parseComponentValue(value);
            return { name, value: parsed.value, isPercentage: parsed.isPercentage, fromSalaryStructure: true };
          })
        );
      } else {
        handleChange('allowances', '{}');
        setSelectedAllowances([]);
      }

      if (ss.deductions) {
        const rawDeductions = parseJsonSafely(ss.deductions);
        const formattedDeductions = {};
        Object.entries(rawDeductions).forEach(([name, value]) => {
          const parsed = parseComponentValue(value);
          formattedDeductions[name] = formatValueForStorage(parsed.value, parsed.isPercentage);
        });
        handleChange('deductions', JSON.stringify(formattedDeductions, null, 2));
        setSelectedDeductions(
          Object.entries(rawDeductions).map(([name, value]) => {
            const parsed = parseComponentValue(value);
            return { name, value: parsed.value, isPercentage: parsed.isPercentage, code: '', fromSalaryStructure: true };
          })
        );
      } else {
        handleChange('deductions', '{}');
        setSelectedDeductions([]);
      }

      if (ss.bonuses) {
        const rawBonuses = parseJsonSafely(ss.bonuses);
        const formattedBonuses = {};
        Object.entries(rawBonuses).forEach(([name, value]) => {
          const parsed = parseComponentValue(value);
          formattedBonuses[name] = formatValueForStorage(parsed.value, parsed.isPercentage);
        });
        handleChange('bonuses', JSON.stringify(formattedBonuses, null, 2));
        setSelectedBonuses(
          Object.entries(rawBonuses).map(([name, value]) => {
            const parsed = parseComponentValue(value);
            return { name, value: parsed.value, isPercentage: parsed.isPercentage, fromSalaryStructure: true };
          })
        );
      } else {
        handleChange('bonuses', '{}');
        setSelectedBonuses([]);
      }

      if (ss.reimbursements) {
        const rawReimb = parseJsonSafely(ss.reimbursements);
        const formattedReimb = {};
        Object.entries(rawReimb).forEach(([name, value]) => {
          const parsed = parseComponentValue(value);
          formattedReimb[name] = formatValueForStorage(parsed.value, false);
        });
        handleChange('reimbursements', JSON.stringify(formattedReimb, null, 2));
        setReimbursementsList(
          Object.entries(rawReimb).map(([name, value]) => {
            const parsed = parseComponentValue(value);
            return { name, value: parsed.value };
          })
        );
      } else {
        handleChange('reimbursements', '{}');
        setReimbursementsList([]);
      }
    } else {
      setSelectedSalaryStructure(null);
      handleChange('salary_structure_id', '');
    }
    setShowSalaryStructureModal(false);
  };

  const handleAllowancesSelected = (selectedItems) => {
    const existing = { ...parseJsonSafely(formData.allowances) };
    const selectedList = [];
    selectedItems.forEach(item => {
      const isPct = isPercentageBased(item, 'allowance');
      const amount = isPct ? parseFloat(item.percentage) || 0 : parseFloat(item.value) || 0;
      existing[item.name] = formatValueForStorage(amount, isPct);
      selectedList.push({ name: item.name, value: amount, isPercentage: isPct, fromSalaryStructure: false });
    });
    const mergedList = [...selectedAllowances.filter(s => !selectedList.some(n => n.name === s.name)), ...selectedList];
    handleChange('allowances', JSON.stringify(existing, null, 2));
    setSelectedAllowances(mergedList);
    setShowAllowanceModal(false);
  };

  const handleDeductionsSelected = (selectedItems) => {
    const existing = { ...parseJsonSafely(formData.deductions) };
    const selectedList = [];
    selectedItems.forEach(item => {
      const isPct = isPercentageBased(item, 'deduction');
      const amount = isPct ? parseFloat(item.percentage) || 0 : parseFloat(item.value) || 0;
      existing[item.name] = formatValueForStorage(amount, isPct);
      selectedList.push({ name: item.name, value: amount, isPercentage: isPct, code: item.code, fromSalaryStructure: false });
    });
    const mergedList = [...selectedDeductions.filter(s => !selectedList.some(n => n.name === s.name)), ...selectedList];
    handleChange('deductions', JSON.stringify(existing, null, 2));
    setSelectedDeductions(mergedList);
    setShowDeductionModal(false);
  };

  const handleBonusesSelected = (selectedItems) => {
    const existing = { ...parseJsonSafely(formData.bonuses) };
    const selectedList = [];
    selectedItems.forEach(item => {
      const isPct = isPercentageBased(item, 'bonus');
      const amount = isPct ? parseFloat(item.percentage) || 0 : parseFloat(item.value) || 0;
      existing[item.name] = formatValueForStorage(amount, isPct);
      selectedList.push({ name: item.name, value: amount, isPercentage: isPct, fromSalaryStructure: false });
    });
    const mergedList = [...selectedBonuses.filter(s => !selectedList.some(n => n.name === s.name)), ...selectedList];
    handleChange('bonuses', JSON.stringify(existing, null, 2));
    setSelectedBonuses(mergedList);
    setShowBonusModal(false);
  };

  const removeAllowance = (nameToRemove) => {
    const updated = selectedAllowances.filter(item => item.name !== nameToRemove);
    setSelectedAllowances(updated);
    const json = parseJsonSafely(formData.allowances);
    delete json[nameToRemove];
    handleChange('allowances', JSON.stringify(json, null, 2));
  };

  const removeDeduction = (nameToRemove) => {
    const updated = selectedDeductions.filter(item => item.name !== nameToRemove);
    setSelectedDeductions(updated);
    const json = parseJsonSafely(formData.deductions);
    delete json[nameToRemove];
    handleChange('deductions', JSON.stringify(json, null, 2));
  };

  const removeBonus = (nameToRemove) => {
    const updated = selectedBonuses.filter(item => item.name !== nameToRemove);
    setSelectedBonuses(updated);
    const json = parseJsonSafely(formData.bonuses);
    delete json[nameToRemove];
    handleChange('bonuses', JSON.stringify(json, null, 2));
  };

  const updateReimbursements = (list) => {
    setReimbursementsList(list);
    const obj = {};
    list.forEach(item => {
      if (item.name.trim()) obj[item.name.trim()] = formatValueForStorage(parseFloat(item.value) || 0, false);
    });
    handleChange('reimbursements', JSON.stringify(obj, null, 2));
  };

  const addReimbursement = () => {
    const newList = [...reimbursementsList, { name: '', value: 0 }];
    updateReimbursements(newList);
  };

  const updateReimbursement = (index, field, value) => {
    const newList = [...reimbursementsList];
    newList[index] = { ...newList[index], [field]: value };
    updateReimbursements(newList);
  };

  const removeReimbursement = (index) => {
    const newList = reimbursementsList.filter((_, i) => i !== index);
    updateReimbursements(newList);
  };

  const formatComponentText = (list) => {
    return list.map(item => {
      const val = parseFloat(item.value);
      if (item.isPercentage) return `${item.name}: ${val.toFixed(2)}%`;
      return `${item.name}: ₹${val.toFixed(2)}`;
    }).join('\n');
  };

  const validate = () => {
    const errors = {};
    if (!formData.payroll_run_id) errors.payroll_run_id = 'Payroll Run is required';
    if (!formData.emp_id) errors.emp_id = 'Employee is required';
    if (!formData.salary_structure_id) errors.salary_structure_id = 'Salary Structure is required';
    if (!runApproved) errors.payroll_run_id = 'Payroll run must be approved';
    const base = parseFloat(formData.base_salary);
    if (isNaN(base) || base < 0) errors.base_salary = 'Base salary must be a non-negative number';
    if (hasPercentageComponents && (!base || base <= 0)) {
      errors.base_salary = 'Base salary is required for percentage-based components';
    }
    try { JSON.parse(formData.allowances || '{}'); } catch (e) { errors.allowances = 'Invalid JSON'; }
    try { JSON.parse(formData.deductions || '{}'); } catch (e) { errors.deductions = 'Invalid JSON'; }
    try { JSON.parse(formData.bonuses || '{}'); } catch (e) { errors.bonuses = 'Invalid JSON'; }
    try { JSON.parse(formData.reimbursements || '{}'); } catch (e) { errors.reimbursements = 'Invalid JSON'; }
    try { JSON.parse(formData.bank_details || '{}'); } catch (e) { errors.bank_details = 'Invalid JSON'; }
    setValidationErrors(errors);
    setBaseSalaryWarning(!!errors.base_salary);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      const payload = {
        payroll_run_id: parseInt(formData.payroll_run_id),
        emp_id: parseInt(formData.emp_id),
        salary_structure_id: formData.salary_structure_id ? parseInt(formData.salary_structure_id) : null,
        base_salary: parseFloat(formData.base_salary) || 0,
        allowances: JSON.parse(formData.allowances || '{}'),
        deductions: JSON.parse(formData.deductions || '{}'),
        bonuses: JSON.parse(formData.bonuses || '{}'),
        reimbursements: JSON.parse(formData.reimbursements || '{}'),
        overtime_pay: parseFloat(formData.overtime_pay) || 0,
        commission: parseFloat(formData.commission) || 0,
        other_earnings: parseFloat(formData.other_earnings) || 0,
        payable_days: parseFloat(formData.payable_days) || 0,
        present_days: parseFloat(formData.present_days) || 0,
        absent_days: parseFloat(formData.absent_days) || 0,
        leave_days: parseFloat(formData.leave_days) || 0,
        overtime_hours: parseFloat(formData.overtime_hours) || 0,
        bank_details: JSON.parse(formData.bank_details || '{}'),
        payment_mode: formData.payment_mode,
        payment_status: formData.payment_status,
        payment_reference: formData.payment_reference || null,
        payslip_generated: formData.payslip_generated,
        payslip_url: formData.payslip_url || null,
        remarks: formData.remarks || '',
        total_allowances: totalAllowances,
        total_deductions: totalDeductions,
        total_bonuses: totalBonuses,
        total_reimbursements: totalReimbursements,
        gross_pay: grossPay,   // gross pay now includes prorated base salary
        net_pay: netPay,
      };

      const response = record
        ? await hrAPI.updatePayrollItem(record.payroll_item_id, payload)
        : await hrAPI.createPayrollItem(payload);

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
      <div className="bg-white rounded-md max-w-5xl w-full h-[90vh] flex flex-col shadow-xl">
        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b">
          <h2 className="text-sm font-semibold">{record ? 'Edit Payroll Item' : 'Create Payroll Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {toast && (
          <div className={`fixed top-4 right-4 z-[60] px-4 py-2 rounded shadow-lg text-xs font-medium ${
            toast.type === 'error' ? 'bg-red-100 text-red-800' :
            toast.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {toast.message}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {!runApproved && formData.payroll_run_id && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded flex items-start gap-1">
              <AlertCircle className="w-3 h-3 text-yellow-600 mt-0.5" />
              <p className="text-[10px] text-yellow-800">
                This payroll run is not approved. Please select an approved payroll run.
              </p>
            </div>
          )}

          {attendanceLoading && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading attendance data...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Payroll Run <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-2 py-1 border rounded text-xs bg-white flex items-center justify-between ${!isEdit && !saveLoading ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed bg-gray-100'}`}
                  onClick={() => !saveLoading && !isEdit && setShowPayrollRunModal(true)}
                >
                  <span className={formData.payroll_run_id ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedPayrollRun ? getPayrollRunDisplayName(selectedPayrollRun) : (formData.payroll_run_id ? `Run #${formData.payroll_run_id}` : 'Select Payroll Run')}
                  </span>
                  <User className="w-3 h-3 text-gray-400" />
                </div>
                {!isEdit && formData.payroll_run_id && (
                  <button onClick={() => { handleChange('payroll_run_id', ''); setSelectedPayrollRun(null); }} className="p-0.5 text-gray-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                )}
              </div>
              {validationErrors.payroll_run_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.payroll_run_id}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Employee <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-2 py-1 border rounded text-xs bg-white flex items-center justify-between ${!isEdit && !saveLoading ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed bg-gray-100'}`}
                  onClick={() => !saveLoading && !isEdit && setShowEmployeeModal(true)}
                >
                  <span className={formData.emp_id ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedEmployee ? `${getEmployeeDisplayName(selectedEmployee)} (${selectedEmployee.emp_id})` : (formData.emp_id ? `Employee #${formData.emp_id}` : 'Select Employee')}
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
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Salary Structure <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-1">
                <div
                  className={`flex-1 px-2 py-1 border rounded text-xs bg-white flex items-center justify-between ${
                    formData.emp_id && !isEdit && !saveLoading ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed bg-gray-100'
                  }`}
                  onClick={() => formData.emp_id && !saveLoading && !isEdit && setShowSalaryStructureModal(true)}
                >
                  <span className={formData.salary_structure_id ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedSalaryStructure ? getSalaryStructureDisplayName(selectedSalaryStructure) : (formData.emp_id ? 'Select Salary Structure' : 'Select Employee first')}
                  </span>
                  <Briefcase className="w-3 h-3 text-gray-400" />
                </div>
                {!isEdit && formData.salary_structure_id && (
                  <button onClick={() => { handleChange('salary_structure_id', ''); setSelectedSalaryStructure(null); }} className="p-0.5 text-gray-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                )}
              </div>
              {validationErrors.salary_structure_id && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.salary_structure_id}</p>}
            </div>
          </div>

          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Earnings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="border rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-medium text-gray-700">Allowances</span>
                  <button onClick={() => setShowAllowanceModal(true)} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                    <Plus className="w-3 h-3" /> Select
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedAllowances.length > 0 ? selectedAllowances.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px]">
                      {item.name}
                      {!item.fromSalaryStructure && (
                        <button onClick={() => removeAllowance(item.name)} className="text-red-500 hover:text-red-700 focus:outline-none" title="Remove"><X className="w-3 h-3" /></button>
                      )}
                    </span>
                  )) : <span className="text-[10px] text-gray-400">No allowances selected</span>}
                </div>
                <textarea rows="3" value={formatComponentText(selectedAllowances)} readOnly className="w-full px-2 py-1 border rounded text-xs font-mono bg-gray-100 text-gray-600" />
              </div>

              <div className="border rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-medium text-gray-700">Bonuses</span>
                  <button onClick={() => setShowBonusModal(true)} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                    <Plus className="w-3 h-3" /> Select
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {selectedBonuses.length > 0 ? selectedBonuses.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-[10px]">
                      {item.name}
                      {!item.fromSalaryStructure && (
                        <button onClick={() => removeBonus(item.name)} className="text-red-500 hover:text-red-700 focus:outline-none" title="Remove"><X className="w-3 h-3" /></button>
                      )}
                    </span>
                  )) : <span className="text-[10px] text-gray-400">No bonuses selected</span>}
                </div>
                <textarea rows="3" value={formatComponentText(selectedBonuses)} readOnly className="w-full px-2 py-1 border rounded text-xs font-mono bg-gray-100 text-gray-600" />
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Base Salary</label>
                <input
                  type="number"
                  value={formData.base_salary}
                  onChange={e => handleChange('base_salary', e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed"
                  step="0.01"
                  min="0"
                  disabled={true}
                  title="Base salary is auto-filled from the selected salary structure"
                />
                {baseSalaryWarning && <p className="text-[9px] text-red-600 mt-0.5">Base salary is required for percentage components</p>}
              </div>
            </div>

            <div className="mt-2">
              <h4 className="text-xs font-semibold text-gray-700 mb-1">Reimbursements</h4>
              {reimbursementsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1 mb-1">
                  <input type="text" value={item.name} onChange={e => updateReimbursement(idx, 'name', e.target.value)} placeholder="Name" className="flex-1 px-2 py-1 border rounded text-xs" disabled={saveLoading} />
                  <input type="number" value={item.value} onChange={e => updateReimbursement(idx, 'value', e.target.value)} placeholder="0.00" step="0.01" min="0" className="w-24 px-2 py-1 border rounded text-xs" disabled={saveLoading} />
                  <button onClick={() => removeReimbursement(idx)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={addReimbursement} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                <Plus className="w-3 h-3" /> Add Reimbursement
              </button>
            </div>
          </div>

          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Deductions</h4>
            <div className="border rounded p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-medium text-gray-700">Deductions</span>
                <button onClick={() => setShowDeductionModal(true)} className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center gap-0.5" disabled={saveLoading}>
                  <Plus className="w-3 h-3" /> Select
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {selectedDeductions.length > 0 ? selectedDeductions.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[10px]">
                    {item.name}
                    {!item.fromSalaryStructure && (
                      <button onClick={() => removeDeduction(item.name)} className="text-red-500 hover:text-red-700 focus:outline-none" title="Remove"><X className="w-3 h-3" /></button>
                    )}
                  </span>
                )) : <span className="text-[10px] text-gray-400">No deductions selected</span>}
              </div>
              <textarea rows="3" value={formatComponentText(selectedDeductions)} readOnly className="w-full px-2 py-1 border rounded text-xs font-mono bg-gray-100 text-gray-600" />
            </div>
          </div>

          {/* Other Earnings - disabled */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Other Earnings</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Overtime Pay</label>
                <input type="number" value={formData.overtime_pay} onChange={e => handleChange('overtime_pay', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Commission</label>
                <input type="number" value={formData.commission} onChange={e => handleChange('commission', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Other Earnings</label>
                <input type="number" value={formData.other_earnings} onChange={e => handleChange('other_earnings', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
            </div>
          </div>

          {/* Attendance - disabled and compact summary */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Attendance</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Payable Days</label>
                <input type="number" value={formData.payable_days} onChange={e => handleChange('payable_days', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Present Days</label>
                <input type="number" value={formData.present_days} onChange={e => handleChange('present_days', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Absent Days</label>
                <input type="number" value={formData.absent_days} onChange={e => handleChange('absent_days', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Leave Days</label>
                <input type="number" value={formData.leave_days} onChange={e => handleChange('leave_days', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Overtime Hours</label>
                <input type="number" value={formData.overtime_hours} onChange={e => handleChange('overtime_hours', e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-gray-100 text-gray-600 cursor-not-allowed" step="0.01" min="0" disabled />
              </div>
            </div>

            {/* Compact Attendance Summary */}
            {attendanceData && (
              <div className="mt-2 bg-gray-50 rounded p-2 text-[10px]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                  <div>Present: <span className="font-semibold">{attendanceData.attendance.present_days}</span></div>
                  <div>Absent: <span className="font-semibold">{attendanceData.attendance.absent_days}</span></div>
                  <div>Leave: <span className="font-semibold">{attendanceData.attendance.leave_days}</span></div>
                  <div>Overtime: <span className="font-semibold">{attendanceData.attendance.overtime_hours}h</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Payable Summary */}
          <div className="border-t pt-2 bg-blue-50 rounded p-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Payable Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-[9px] text-gray-500">Base Salary</p>
                <p className="text-sm font-mono font-semibold">₹{baseSalaryNum.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Payable Days</p>
                <p className="text-sm font-mono font-semibold">{formData.payable_days}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Total Days</p>
                <p className="text-sm font-mono font-semibold">{totalDaysInPeriod}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Prorated Base</p>
                <p className="text-sm font-mono font-semibold">₹{payableSalary.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Payment Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Payment Mode</label>
                <select value={formData.payment_mode} onChange={e => handleChange('payment_mode', e.target.value)} className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500" disabled={saveLoading}>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Payment Status</label>
                <select value={formData.payment_status} onChange={e => handleChange('payment_status', e.target.value)} className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500" disabled={saveLoading}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="processed">Processed</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Payment Reference</label>
                <input type="text" value={formData.payment_reference} onChange={e => handleChange('payment_reference', e.target.value)} className="w-full px-2 py-1 border rounded text-xs focus:ring-1 focus:ring-primary-500" disabled={saveLoading} />
              </div>
            </div>
          </div>

          <div className="border-t pt-2 bg-gray-50 rounded p-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Summary (Auto‑calculated)</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] text-gray-500">Gross Pay</p>
                <p className="text-sm font-mono font-semibold">₹{grossPay.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Total Deductions</p>
                <p className="text-sm font-mono font-semibold">₹{totalDeductions.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500">Net Pay</p>
                <p className="text-sm font-mono font-semibold">₹{netPay.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between p-2 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">{record ? `Editing payroll item #${record.payroll_item_id}` : 'New payroll item'}</p>
          <div className="flex gap-1.5">
            <button onClick={onClose} className="px-2.5 py-1 text-[10px] border rounded bg-white hover:bg-gray-50 disabled:opacity-50" disabled={saveLoading}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={saveLoading || !runApproved}
              className="px-2.5 py-1 text-[10px] border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-50"
            >
              <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <Suspense fallback={null}>
          {showPayrollRunModal && <PayrollRunSelectionModal show={showPayrollRunModal} onClose={() => setShowPayrollRunModal(false)} onSelect={handlePayrollRunSelect} selectedItemId={formData.payroll_run_id || null} />}
          {showEmployeeModal && <EmployeeSelectionModal show={showEmployeeModal} onClose={() => setShowEmployeeModal(false)} onSelect={handleEmployeeSelect} selectedEmployeeId={formData.emp_id || null} />}
          {showSalaryStructureModal && (
            <SalaryStructureSelectionModal
              show={showSalaryStructureModal}
              onClose={() => setShowSalaryStructureModal(false)}
              onSelect={handleSalaryStructureSelect}
              selectedItemId={formData.salary_structure_id || null}
              empId={formData.emp_id}
            />
          )}
          {showAllowanceModal && <AllowanceSelectionModal show={showAllowanceModal} onClose={() => setShowAllowanceModal(false)} onSelect={handleAllowancesSelected} multiple quickSelect={false} />}
          {showDeductionModal && <DeductionSelectionModal show={showDeductionModal} onClose={() => setShowDeductionModal(false)} onSelect={handleDeductionsSelected} multiple quickSelect={false} />}
          {showBonusModal && <BonusSelectionModal show={showBonusModal} onClose={() => setShowBonusModal(false)} onSelect={handleBonusesSelected} multiple quickSelect={false} />}
        </Suspense>
      </div>
    </div>
  );
};

export default PayrollItemModal;
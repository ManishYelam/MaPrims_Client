import React from 'react';
import EntitySelectionModal from '../../../common/EntitySelectionModal';
import { hrAPI } from '../../../../services/api';

const SalaryStructureSelectionModal = (props) => {
  const { empId, ...rest } = props;

  const fetchSalaryStructures = async (page, columnFilters, limit) => {
    const params = { page, limit };
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });
    // If empId is provided, filter by it and prevent other structures
    if (empId) {
      params.emp_id = empId;
    }
    const res = await hrAPI.getSalaryStructuresAll(params);
    const data = res.data;
    if (!data?.success) return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    const payload = data.rows ? data : data.data || {};
    // Additional client-side filter (backup)
    let rows = payload.rows || [];
    if (empId) {
      rows = rows.filter(item => String(item.emp_id) === String(empId));
    }
    return {
      rows,
      totalItems: payload.count || payload.totalItems || rows.length,
      totalPages: payload.totalPages || 1,
      currentPage: payload.currentPage || page,
    };
  };

  const columns = [
    { key: 'salary_structure_id', label: 'ID', searchable: true, filterKey: 'salary_structure_id' },
    { key: 'emp_id', label: 'Emp ID', searchable: true, filterKey: 'emp_id' },
    { key: 'employee_name', label: 'Employee', searchable: true, filterKey: 'employee_name' },
    { key: 'base_salary', label: 'Base', searchable: true, filterKey: 'base_salary', render: (item) => `₹${parseFloat(item.base_salary).toFixed(2)}` },
    { key: 'monthly_gross_salary', label: 'Gross', searchable: true, filterKey: 'monthly_gross_salary', render: (item) => (item.monthly_gross_salary ? `₹${parseFloat(item.monthly_gross_salary).toFixed(2)}` : '—') },
    { key: 'effective_date', label: 'Effective', searchable: true, filterKey: 'effective_date', render: (item) => (item.effective_date ? new Date(item.effective_date).toLocaleDateString() : '—') },
    { key: 'status', label: 'Status', searchable: true, filterKey: 'status' },
  ];

  return (
    <EntitySelectionModal
      {...rest}
      title="Select Salary Structure"
      fetchData={fetchSalaryStructures}
      columns={columns}
      getItemId={(item) => item.salary_structure_id}
      getItemLabel={(item) => `${item.employee_name || `#${item.emp_id}`} - ${item.effective_date || ''}`}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(SalaryStructureSelectionModal);
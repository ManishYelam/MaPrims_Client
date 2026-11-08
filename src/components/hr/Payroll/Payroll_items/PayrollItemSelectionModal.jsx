import React from 'react';
import EntitySelectionModal from '../../common/EntitySelectionModal';
import { hrAPI } from '../../../../services/api';

const PayrollItemSelectionModal = (props) => {
  const fetchPayrollItems = async (page, columnFilters, limit) => {
    const params = { page, limit };
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });
    const res = await hrAPI.getPayrollItemsAll(params);
    const data = res.data;
    if (!data?.success) return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    const payload = data.rows ? data : data.data || {};
    return {
      rows: payload.rows || [],
      totalItems: payload.count || 0,
      totalPages: payload.totalPages || 1,
      currentPage: payload.currentPage || page,
    };
  };

  const columns = [
    { key: 'employee_name', label: 'Employee', searchable: true, filterKey: 'employee_name' },
    { key: 'payroll_run_id', label: 'Run ID', searchable: true, filterKey: 'payroll_run_id' },
    { key: 'gross_pay', label: 'Gross Pay', searchable: true, filterKey: 'gross_pay' },
    { key: 'net_pay', label: 'Net Pay', searchable: true, filterKey: 'net_pay' },
  ];

  return (
    <EntitySelectionModal
      {...props}
      title="Select Payroll Item"
      fetchData={fetchPayrollItems}
      columns={columns}
      getItemId={(item) => item.payroll_item_id}
      getItemLabel={(item) => item?.employee_name || `Item #${item?.payroll_item_id}`}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(PayrollItemSelectionModal);
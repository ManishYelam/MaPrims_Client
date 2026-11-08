import React from 'react';
import EntitySelectionModal from '../../../common/EntitySelectionModal';
import { hrAPI } from '../../../../services/api';

const PayrollRunSelectionModal = (props) => {
  const fetchPayrollRuns = async (page, columnFilters, limit) => {
    const params = { page, limit };
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });
    const res = await hrAPI.getPayrollRunsAll(params);
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
    { key: 'name', label: 'Name', searchable: true, filterKey: 'name' },
    { key: 'payroll_code', label: 'Code', searchable: true, filterKey: 'payroll_code' },
    { key: 'payroll_month', label: 'Month', searchable: true, filterKey: 'payroll_month' },
    { key: 'payroll_year', label: 'Year', searchable: true, filterKey: 'payroll_year' },
    { key: 'status', label: 'Status', searchable: true, filterKey: 'status' },
  ];

  return (
    <EntitySelectionModal
      {...props}
      title="Select Payroll Run"
      fetchData={fetchPayrollRuns}
      columns={columns}
      getItemId={(item) => item.payroll_run_id}
      getItemLabel={(item) => item?.name || ''}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(PayrollRunSelectionModal);
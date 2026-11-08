import React from 'react';
import EntitySelectionModal from '../../../common/EntitySelectionModal';
import { hrAPI } from '../../../../services/api';

const DeductionSelectionModal = (props) => {
  const fetchDeductions = async (page, columnFilters, limit) => {
    const params = { page, limit };
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });
    const res = await hrAPI.getDeductionsAll(params);
    const data = res.data;
    if (!data?.success) return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    const payload = data.rows ? data : data.data || {};
    return {
      rows: payload.rows || [],
      totalItems: payload.count || payload.totalItems || 0,
      totalPages: payload.totalPages || 1,
      currentPage: payload.currentPage || page,
    };
  };

  const columns = [
    {
      key: 'deduction_id',
      label: 'ID',
      searchable: true,
      filterKey: 'deduction_id',
      render: (item) => <span className="font-mono text-gray-700">{item.deduction_id}</span>,
    },
    { key: 'name', label: 'Name', searchable: true, filterKey: 'name' },
    { key: 'code', label: 'Code', searchable: true, filterKey: 'code' },
    { key: 'type', label: 'Type', searchable: true, filterKey: 'type' },
    {
      key: 'value',
      label: 'Value',
      searchable: true,
      filterKey: 'value',
      render: (item) => `₹${parseFloat(item.value).toFixed(2)}`,
    },
    {
      key: 'percentage',
      label: '%',
      searchable: true,
      filterKey: 'percentage',
      render: (item) => `${item.percentage}%`,
    },
    {
      key: 'calculation_basis',
      label: 'Basis',
      searchable: true,
      filterKey: 'calculation_basis',
    },
  ];

  return (
    <EntitySelectionModal
      {...props}
      title="Select Deduction"
      fetchData={fetchDeductions}
      columns={columns}
      getItemId={(item) => item.deduction_id}
      getItemLabel={(item) => item?.name || ''}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(DeductionSelectionModal);
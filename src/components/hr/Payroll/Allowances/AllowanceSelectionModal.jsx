import React from 'react';
import EntitySelectionModal from '../../../common/EntitySelectionModal';
import { hrAPI } from '../../../../services/api';

const AllowanceSelectionModal = (props) => {
  const fetchAllowances = async (page, columnFilters, limit) => {
    const params = { page, limit };
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });
    const res = await hrAPI.getAllowancesAll(params);
    const data = res.data;
    if (!data?.success) return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    // API returns { rows, counts, pagination }
    const rows = data.rows || [];
    const pagination = data.pagination || {};
    return {
      rows,
      totalItems: pagination.totalItems || rows.length,
      totalPages: pagination.totalPages || 1,
      currentPage: pagination.page || page,
    };
  };

  const columns = [
    { key: 'allowance_id', label: 'ID', searchable: true, filterKey: 'allowance_id' },
    { key: 'name', label: 'Name', searchable: true, filterKey: 'name' },
    { key: 'code', label: 'Code', searchable: true, filterKey: 'code' },
    { key: 'type', label: 'Type', searchable: true, filterKey: 'type' },
    {
      key: 'value',
      label: 'Value',
      searchable: true,
      filterKey: 'value',
      render: (item) => `₹${parseFloat(item.value).toFixed(2)}`
    },
    {
      key: 'percentage',
      label: '%',
      searchable: true,
      filterKey: 'percentage',
      render: (item) => `${item.percentage}%`
    },
    {
      key: 'calculation_basis',
      label: 'Basis',
      searchable: true,
      filterKey: 'calculation_basis'
    },
  ];

  return (
    <EntitySelectionModal
      {...props}
      title="Select Allowance"
      fetchData={fetchAllowances}
      columns={columns}
      getItemId={(item) => item.allowance_id}
      getItemLabel={(item) => item?.name || ''}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(AllowanceSelectionModal);
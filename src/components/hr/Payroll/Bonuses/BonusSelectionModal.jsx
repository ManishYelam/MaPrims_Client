import React from 'react';
import EntitySelectionModal from '../../../common/EntitySelectionModal';
import { hrAPI } from '../../../../services/api';

const BonusSelectionModal = (props) => {
  const fetchBonuses = async (page, columnFilters, limit) => {
    const params = { page, limit };
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });
    const res = await hrAPI.getBonusesAll(params);
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
      key: 'bonus_id',
      label: 'ID',
      searchable: true,
      filterKey: 'bonus_id',
      render: (item) => <span className="font-mono text-gray-700">{item.bonus_id}</span>,
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
      key: 'calculation_method',
      label: 'Method',
      searchable: true,
      filterKey: 'calculation_method',
    },
    {
      key: 'frequency',
      label: 'Frequency',
      searchable: true,
      filterKey: 'frequency',
    },
  ];

  return (
    <EntitySelectionModal
      {...props}
      title="Select Bonus"
      fetchData={fetchBonuses}
      columns={columns}
      getItemId={(item) => item.bonus_id}
      getItemLabel={(item) => item?.name || ''}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(BonusSelectionModal);
import React from 'react';
import EntitySelectionModal from '../../common/EntitySelectionModal';
import { assetAPI } from '../../../services/api';

const AssetSelectionModal = (props) => {
  const { excludeId, ...rest } = props;

  const fetchAssets = async (page, columnFilters, limit) => {
    const params = { page, limit };
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });

    // If excludeId is provided, filter it out client‑side or via API
    // (adjust backend if possible for efficiency; here we'll do client‑side fallback)
    const res = await assetAPI.getAssets(params);
    const data = res.data;

    if (!data?.success) return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };

    let rows = data.assets || [];
    // Client‑side exclusion (backup)
    if (excludeId) {
      rows = rows.filter((item) => String(item.id) !== String(excludeId));
    }

    return {
      rows,
      totalItems: data.pagination?.totalItems || rows.length,
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
    };
  };

  const columns = [
    { key: 'code', label: 'Code', searchable: true, filterKey: 'code' },
    { key: 'name', label: 'Name', searchable: true, filterKey: 'name' },
    { key: 'category', label: 'Category', searchable: true, filterKey: 'category' },
    {
      key: 'status',
      label: 'Status',
      searchable: true,
      filterKey: 'status',
      render: (item) => item.status || '—',
    },
    {
      key: 'criticality',
      label: 'Criticality',
      searchable: true,
      filterKey: 'criticality',
      render: (item) => item.criticality || '—',
    },
  ];

  return (
    <EntitySelectionModal
      {...rest}
      title="Select Asset"
      fetchData={fetchAssets}
      columns={columns}
      getItemId={(item) => item.id}
      getItemLabel={(item) => `${item.name || `#${item.code}`}`}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(AssetSelectionModal);
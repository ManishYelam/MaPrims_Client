// src/modules/CostCenters/CostCenterSelectionModal.jsx
import React from 'react';
import { FolderTree, Layers } from 'lucide-react';
import { costCentersAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../../components/common/EntitySelectionModal';

const CostCenterSelectionModal = (props) => {
  const {
    onlyActive = true,
    filterType,
    filterLevel,
    excludeCostCenterId,
    selectedCostCenterId,
    selectedCostCenterIds,
    quickSelect,
    multiple,
    ...rest
  } = props;

  const fetchCostCenters = async (page, columnFilters, limit) => {
    const filterObj = {};
    if (onlyActive)   filterObj.status = 'active';
    if (filterType)   filterObj.cost_center_type = filterType;
    if (filterLevel)  filterObj.level = filterLevel;

    const payload = {
      page,
      limit,
      search: '',
      searchFields: ['cost_center_code', 'cost_center_name', 'gl_account_code'],
      filters: filterObj,
    };

    const code = (columnFilters.cost_center_code || '').trim();
    const name = (columnFilters.cost_center_name || '').trim();
    const term = code 

    if (term) payload.search = term;

    let response;
    try {
      response = await costCentersAPI.getAllCostCenters(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.costCenters || [];
    if (excludeCostCenterId) rows = rows.filter(r => r.cost_center_id !== excludeCostCenterId);
    if (code) {
      const v = code.toLowerCase();
      rows = rows.filter(r => String(r.cost_center_code || '').toLowerCase().includes(v));
    }
    if (name) {
      const v = name.toLowerCase();
      rows = rows.filter(r => String(r.cost_center_name || '').toLowerCase().includes(v));
    }

    return {
      rows,
      totalItems: data.pagination?.totalItems ?? rows.length,
      totalPages: data.pagination?.totalPages ?? 1,
      currentPage: data.pagination?.currentPage ?? page,
    };
  };

  const columns = [
    {
      key: 'cost_center_id',
      label: 'ID',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.cost_center_id}</span>,
    },
    {
      key: 'cost_center_code',
      label: 'Code',
      searchable: true,
      filterKey: 'cost_center_code',
      render: (r) => <span className="font-mono font-semibold text-gray-900">{r.cost_center_code || '—'}</span>,
    },
    {
      key: 'cost_center_name',
      label: 'Name',
      searchable: true,
      filterKey: 'cost_center_name',
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-900">
          <FolderTree className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[220px]">{r.cost_center_name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'cost_center_type',
      label: 'Type',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.cost_center_type || '—'}</span>,
    },
    {
      key: 'level',
      label: 'Level',
      searchable: false,
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Layers className="w-3 h-3 text-gray-400" />
          <span>{r.level || 1}</span>
        </div>
      ),
    },
    {
      key: 'parent_cost_center_id',
      label: 'Parent',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.parent_cost_center_id || '—'}</span>,
    },
    {
      key: 'gl_account_code',
      label: 'GL Code',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.gl_account_code || '—'}</span>,
    },
    {
      key: 'is_billable',
      label: 'Billable',
      searchable: false,
      render: (r) => (
        <span className={r.is_billable ? 'text-green-700 font-medium' : 'text-gray-400'}>
          {r.is_billable ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Active',
      searchable: false,
      render: (r) => (
        <span className={r.is_active ? 'text-green-700 font-medium' : 'text-gray-400'}>
          {r.is_active ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  const getDisplayName = (r) => {
    if (!r || !r.cost_center_id) return '';
    return `${r.cost_center_code} — ${r.cost_center_name}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select Cost Center'}
      fetchData={fetchCostCenters}
      columns={columns}
      getItemId={(r) => r.cost_center_id}
      getItemLabel={(r) => getDisplayName(r)}
      selectedItemId={selectedCostCenterId ?? null}
      selectedItemIds={selectedCostCenterIds ?? []}
      excludeId={excludeCostCenterId ?? null}
      quickSelect={quickSelect}
      multiple={multiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(CostCenterSelectionModal);
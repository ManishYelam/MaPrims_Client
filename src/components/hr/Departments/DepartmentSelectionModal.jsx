import React from 'react';
import { Building2, Hash, Layers } from 'lucide-react';
import { hrAPI } from '../../../services/api';
import EntitySelectionModal from '../../common/EntitySelectionModal';

const DepartmentSelectionModal = (props) => {
  const {
    excludeId,
    excludeDepartmentId,
    selectedDepartmentId,
    selectedDepartmentIds,
    quickSelect,
    onlyActive = true,
    filterType,
    filterParentId,
    ...rest
  } = props;

  const exclude = excludeId ?? excludeDepartmentId ?? null;
  const useMultiple = Array.isArray(selectedDepartmentIds);

  const fetchDepartments = async (page, columnFilters, limit) => {
    const filterObj = {};
    if (onlyActive)      filterObj.status = 'active';
    if (filterType)      filterObj.department_type = filterType;
    if (filterParentId)  filterObj.parent_id = filterParentId;

    const payload = {
      page,
      limit,
      search: '',
      searchFields: ['name', 'code', 'description'],
      filters: filterObj,
    };

    const code = (columnFilters.code || '').trim();
    const name = (columnFilters.name || '').trim();
    const term = [code, name].filter(Boolean).join(' ').trim();
    if (term) payload.search = term;

    let response;
    try {
      response = await hrAPI.getDepartments(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.departments || [];
    if (exclude) rows = rows.filter(r => r.dept_id !== exclude);

    if (code) {
      const v = code.toLowerCase();
      rows = rows.filter(r => String(r.code || '').toLowerCase().includes(v));
    }
    if (name) {
      const v = name.toLowerCase();
      rows = rows.filter(r => String(r.name || '').toLowerCase().includes(v));
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
      key: 'dept_id',
      label: 'ID',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.dept_id}</span>,
    },
    {
      key: 'code',
      label: 'Code',
      searchable: true,
      filterKey: 'code',
      render: (r) => <span className="font-mono font-semibold text-gray-900">{r.code || '—'}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      searchable: true,
      filterKey: 'name',
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-900">
          <Building2 className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[220px]">{r.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'department_type',
      label: 'Type',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.department_type || '—'}</span>,
    },
    {
      key: 'parent',
      label: 'Parent',
      searchable: false,
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Layers className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[160px]">
            {r.parent?.name || (r.parent_id ? `ID: ${r.parent_id}` : '—')}
          </span>
        </div>
      ),
    },
    {
      key: 'cost_centre',
      label: 'Cost Centre',
      searchable: false,
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Hash className="w-3 h-3 text-gray-400" />
          <span className="font-mono">
            {r.cost_center?.cost_center_code || r.cost_center_code || r.cost_centre || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      searchable: false,
      render: (r) => (
        <span className={r.status === 'active' ? 'text-green-700 font-medium' : 'text-gray-400'}>
          {r.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const getDisplayName = (r) => {
    if (!r || !r.dept_id) return '';
    if (r.code && r.name) return `${r.code} — ${r.name}`;
    return r.name || r.code || `ID: ${r.dept_id}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select Department'}
      fetchData={fetchDepartments}
      columns={columns}
      getItemId={(r) => r.dept_id}
      getItemLabel={(r) => getDisplayName(r)}
      selectedItemId={useMultiple ? null : (selectedDepartmentId ?? null)}
      selectedItemIds={useMultiple ? selectedDepartmentIds : []}
      excludeId={exclude}
      quickSelect={quickSelect}
      multiple={useMultiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(DepartmentSelectionModal);
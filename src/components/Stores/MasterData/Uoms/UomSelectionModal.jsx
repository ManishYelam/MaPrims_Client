import React from 'react';
import { Ruler, LockKeyhole, Scale } from 'lucide-react';
import { uomsAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../common/EntitySelectionModal';

const UomSelectionModal = (props) => {
  const {
    filterCategory,        // e.g. 'BASE' — restrict to that category
    filterType,            // e.g. 'WEIGHT'
    excludeUomId,          // exclude one uom_id (e.g. self when picking a base)
    onlyActive = true,
    selectedUomId,
    selectedUomIds,
    quickSelect,
    multiple,
    ...rest
  } = props;

  const fetchUoms = async (page, columnFilters, limit) => {
    const filterObj = {};

    if (onlyActive) filterObj.status = 'active';
    if (filterCategory) filterObj.uom_category = filterCategory;
    if (filterType) filterObj.uom_type = filterType;

    // Anything the user typed in the per-column filter row goes
    // into a dedicated search field for the backend.
    const searchFields = [
      'uom_code',
      'uom_name',
      'short_name',
      'description',
      'si_unit',
    ];

    const payload = {
      page,
      limit,
      search: '',
      searchFields,
      filters: filterObj,
    };

    // The EntitySelectionModal gives us an object of columnFilters keyed
    // by filterKey. The UoM backend accepts `search` (single term) plus
    // `filters.uom_category`, `filters.uom_type`, `filters.status`. So we
    // forward a few well-known keys as structured filters, and use the
    // remaining (code/name) values as part of a client-side post-filter.
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value || !value.trim()) return;
      const v = value.trim();
      if (key === 'uom_category') payload.filters.uom_category = v.toUpperCase();
      else if (key === 'uom_type') payload.filters.uom_type = v.toUpperCase();
      else if (key === 'uom_code') payload.search = v;
      else if (key === 'uom_name') payload.search = v;
      else if (key === 'short_name') payload.search = v;
    });

    let response;
    try {
      response = await uomsAPI.getAllUoms(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.uoms || [];

    // Client-side refinements (cheap, small lists)
    if (excludeUomId) {
      rows = rows.filter(u => u.uom_id !== excludeUomId);
    }
    if (columnFilters.uom_code) {
      const v = columnFilters.uom_code.trim().toLowerCase();
      if (v) rows = rows.filter(u => String(u.uom_code || '').toLowerCase().includes(v));
    }
    if (columnFilters.uom_name) {
      const v = columnFilters.uom_name.trim().toLowerCase();
      if (v) rows = rows.filter(u => String(u.uom_name || '').toLowerCase().includes(v));
    }
    if (columnFilters.short_name) {
      const v = columnFilters.short_name.trim().toLowerCase();
      if (v) rows = rows.filter(u => String(u.short_name || '').toLowerCase().includes(v));
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
      key: 'uom_id',
      label: 'ID',
      searchable: false,
      render: (u) => (
        <span className="font-mono text-gray-700">{u.uom_id}</span>
      ),
    },
    {
      key: 'uom_code',
      label: 'Code',
      searchable: true,
      filterKey: 'uom_code',
      render: (u) => (
        <span className="font-mono font-semibold text-gray-900">
          {u.uom_code || '—'}
        </span>
      ),
    },
    {
      key: 'uom_name',
      label: 'Name',
      searchable: true,
      filterKey: 'uom_name',
      render: (u) => (
        <div className="flex items-center gap-1 text-gray-900">
          <Ruler className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[180px]">{u.uom_name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'short_name',
      label: 'Short',
      searchable: true,
      filterKey: 'short_name',
      render: (u) => <span className="text-gray-700">{u.short_name || '—'}</span>,
    },
    {
      key: 'uom_type',
      label: 'Type',
      searchable: false,
      render: (u) => <span className="text-gray-700">{u.uom_type || '—'}</span>,
    },
    {
      key: 'uom_category',
      label: 'Category',
      searchable: false,
      render: (u) => (
        <span className="text-gray-700">
          {u.uom_category || '—'}
        </span>
      ),
    },
    {
      key: 'conversion_factor',
      label: 'Conv.',
      searchable: false,
      render: (u) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Scale className="w-3 h-3 text-gray-400" />
          <span className="font-mono">
            {u.conversion_factor === null || u.conversion_factor === undefined
              ? '—'
              : Number(u.conversion_factor).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
          </span>
        </div>
      ),
    },
    {
      key: 'base_uom_id',
      label: 'Base',
      searchable: false,
      render: (u) => (
        <span className="font-mono text-gray-700">{u.base_uom_id || '—'}</span>
      ),
    },
    {
      key: 'is_system_default',
      label: 'System',
      searchable: false,
      render: (u) =>
        u.is_system_default ? (
          <LockKeyhole className="w-3 h-3 text-indigo-600" title="System default" />
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  const getDisplayName = (u) => {
    if (!u || !u.uom_id) return '';
    return `${u.uom_code} — ${u.uom_name}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select UoM'}
      fetchData={fetchUoms}
      columns={columns}
      getItemId={(u) => u.uom_id}
      getItemLabel={(u) => getDisplayName(u)}
      selectedItemId={selectedUomId ?? null}
      selectedItemIds={selectedUomIds ?? []}
      excludeId={excludeUomId ?? null}
      quickSelect={quickSelect}
      multiple={multiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(UomSelectionModal);
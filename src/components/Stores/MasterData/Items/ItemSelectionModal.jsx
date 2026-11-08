import React from 'react';
import { Package } from 'lucide-react';
import { itemsAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../../components/common/EntitySelectionModal';

const ItemSelectionModal = (props) => {
  const {
    onlyActive = true,
    filterCategoryId,
    filterItemType,
    excludeItemId,
    selectedItemId,
    selectedItemIds,
    quickSelect,
    multiple,
    ...rest
  } = props;

  const fetchItems = async (page, columnFilters, limit) => {
    const filterObj = {};
    if (onlyActive) filterObj.status = 'active';
    if (filterCategoryId) filterObj.category_id = filterCategoryId;
    if (filterItemType) filterObj.item_type = filterItemType;

    const payload = {
      page,
      limit,
      search: '',
      searchFields: ['item_code', 'item_name', 'short_name', 'brand', 'barcode'],
      filters: filterObj,
    };

    const code = (columnFilters.item_code || '').trim();
    const name = (columnFilters.item_name || '').trim();
    const term = code || name;
    if (term) payload.search = term;

    let response;
    try {
      response = await itemsAPI.getAllItems(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.items || [];
    if (excludeItemId) rows = rows.filter(r => r.item_id !== excludeItemId);
    if (code) {
      const v = code.toLowerCase();
      rows = rows.filter(r => String(r.item_code || '').toLowerCase().includes(v));
    }
    if (name) {
      const v = name.toLowerCase();
      rows = rows.filter(r => String(r.item_name || '').toLowerCase().includes(v));
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
      key: 'item_id',
      label: 'ID',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.item_id}</span>,
    },
    {
      key: 'item_code',
      label: 'Code',
      searchable: true,
      filterKey: 'item_code',
      render: (r) => <span className="font-mono font-semibold text-gray-900">{r.item_code || '—'}</span>,
    },
    {
      key: 'item_name',
      label: 'Name',
      searchable: true,
      filterKey: 'item_name',
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-900">
          <Package className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[220px]">{r.item_name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      searchable: false,
      render: (r) => (
        <span className="text-gray-700">
          {r.category ? `${r.category.category_code}` : (r.category_id || '—')}
        </span>
      ),
    },
    {
      key: 'item_type',
      label: 'Type',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.item_type || '—'}</span>,
    },
    {
      key: 'base_uom',
      label: 'UoM',
      searchable: false,
      render: (r) => (
        <span className="text-gray-700">
          {r.base_uom ? r.base_uom.uom_code : (r.base_uom_id || '—')}
        </span>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.brand || '—'}</span>,
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
    if (!r || !r.item_id) return '';
    return `${r.item_code} — ${r.item_name}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select Item'}
      fetchData={fetchItems}
      columns={columns}
      getItemId={(r) => r.item_id}
      getItemLabel={(r) => getDisplayName(r)}
      selectedItemId={selectedItemId ?? null}
      selectedItemIds={selectedItemIds ?? []}
      excludeId={excludeItemId ?? null}
      quickSelect={quickSelect}
      multiple={multiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(ItemSelectionModal);
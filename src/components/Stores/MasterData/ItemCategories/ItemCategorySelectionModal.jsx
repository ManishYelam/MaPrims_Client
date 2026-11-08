// src/modules/ItemCategories/ItemCategorySelectionModal.jsx
import React from 'react';
import { FolderTree, Layers } from 'lucide-react';
import { itemCategoriesAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../../components/common/EntitySelectionModal';

const ItemCategorySelectionModal = (props) => {
  const {
    onlyActive = true,
    excludeCategoryId,
    selectedCategoryId,
    selectedCategoryIds,
    quickSelect,
    multiple,
    ...rest
  } = props;

  const fetchCategories = async (page, columnFilters, limit) => {
    const filterObj = {};
    if (onlyActive) filterObj.status = 'active';

    const payload = {
      page,
      limit,
      search: '',
      searchFields: ['category_code', 'category_name', 'description'],
      filters: filterObj,
    };

    // Forward free-text column filters as a single search term
    const code = (columnFilters.category_code || '').trim();
    const name = (columnFilters.category_name || '').trim();
    const term = code || name;
    if (term) payload.search = term;

    let response;
    try {
      response = await itemCategoriesAPI.getAllItemCategories(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.itemCategories || [];

    if (excludeCategoryId) rows = rows.filter(c => c.category_id !== excludeCategoryId);

    // Client-side refinement per column
    if (code) {
      const v = code.toLowerCase();
      rows = rows.filter(c => String(c.category_code || '').toLowerCase().includes(v));
    }
    if (name) {
      const v = name.toLowerCase();
      rows = rows.filter(c => String(c.category_name || '').toLowerCase().includes(v));
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
      key: 'category_id',
      label: 'ID',
      searchable: false,
      render: (c) => <span className="font-mono text-gray-700">{c.category_id}</span>,
    },
    {
      key: 'category_code',
      label: 'Code',
      searchable: true,
      filterKey: 'category_code',
      render: (c) => <span className="font-mono font-semibold text-gray-900">{c.category_code || '—'}</span>,
    },
    {
      key: 'category_name',
      label: 'Name',
      searchable: true,
      filterKey: 'category_name',
      render: (c) => (
        <div className="flex items-center gap-1 text-gray-900">
          <FolderTree className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[220px]">{c.category_name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'parent_category_id',
      label: 'Parent',
      searchable: false,
      render: (c) => <span className="font-mono text-gray-700">{c.parent_category_id || '—'}</span>,
    },
    {
      key: 'level',
      label: 'Level',
      searchable: false,
      render: (c) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Layers className="w-3 h-3 text-gray-400" />
          <span>{c.level || 1}</span>
        </div>
      ),
    },
    {
      key: 'sort_order',
      label: 'Sort',
      searchable: false,
      render: (c) => <span className="text-gray-700">{c.sort_order ?? 0}</span>,
    },
    {
      key: 'is_active',
      label: 'Active',
      searchable: false,
      render: (c) => (
        <span className={c.is_active ? 'text-green-700 font-medium' : 'text-gray-400'}>
          {c.is_active ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  const getDisplayName = (c) => {
    if (!c || !c.category_id) return '';
    return `${c.category_code} — ${c.category_name}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select Item Category'}
      fetchData={fetchCategories}
      columns={columns}
      getItemId={(c) => c.category_id}
      getItemLabel={(c) => getDisplayName(c)}
      selectedItemId={selectedCategoryId ?? null}
      selectedItemIds={selectedCategoryIds ?? []}
      excludeId={excludeCategoryId ?? null}
      quickSelect={quickSelect}
      multiple={multiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(ItemCategorySelectionModal);
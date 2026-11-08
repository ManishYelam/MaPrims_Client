// src/modules/Suppliers/SupplierSelectionModal.jsx
import React from 'react';
import { Truck } from 'lucide-react';
import { suppliersAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../../components/common/EntitySelectionModal';

const SupplierSelectionModal = (props) => {
  const {
    onlyActive = false,
    filterStatus,
    filterType,
    filterCategory,
    excludeSupplierId,
    selectedSupplierId,
    selectedSupplierIds,
    quickSelect,
    multiple,
    ...rest
  } = props;

  const fetchSuppliers = async (page, columnFilters, limit) => {
    const filterObj = {};
    if (onlyActive)        filterObj.status = 'ACTIVE';
    if (filterStatus)      filterObj.status = filterStatus;
    if (filterType)        filterObj.supplier_type = filterType;
    if (filterCategory)    filterObj.supplier_category = filterCategory;

    const payload = {
      page,
      limit,
      search: '',
      searchFields: ['supplier_code', 'legal_name', 'trade_name', 'short_name', 'gstin', 'pan'],
      filters: filterObj,
    };

    const code = (columnFilters.supplier_code || '').trim();
    const name = (columnFilters.legal_name || '').trim();
    const term = code || name;
    if (term) payload.search = term;

    let response;
    try {
      response = await suppliersAPI.getAllSuppliers(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.suppliers || [];
    if (excludeSupplierId) rows = rows.filter(r => r.supplier_id !== excludeSupplierId);
    if (code) {
      const v = code.toLowerCase();
      rows = rows.filter(r => String(r.supplier_code || '').toLowerCase().includes(v));
    }
    if (name) {
      const v = name.toLowerCase();
      rows = rows.filter(r => String(r.legal_name || '').toLowerCase().includes(v));
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
      key: 'supplier_id',
      label: 'ID',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.supplier_id}</span>,
    },
    {
      key: 'supplier_code',
      label: 'Code',
      searchable: true,
      filterKey: 'supplier_code',
      render: (r) => <span className="font-mono font-semibold text-gray-900">{r.supplier_code || '—'}</span>,
    },
    {
      key: 'legal_name',
      label: 'Legal Name',
      searchable: true,
      filterKey: 'legal_name',
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-900">
          <Truck className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[220px]">{r.legal_name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'trade_name',
      label: 'Trade',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.trade_name || '—'}</span>,
    },
    {
      key: 'supplier_type',
      label: 'Type',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.supplier_type || '—'}</span>,
    },
    {
      key: 'supplier_category',
      label: 'Category',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.supplier_category || '—'}</span>,
    },
    {
      key: 'gstin',
      label: 'GSTIN',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.gstin || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      searchable: false,
      render: (r) => (
        <span className={
          r.status === 'ACTIVE'      ? 'text-green-700 font-medium' :
          r.status === 'BLACKLISTED' ? 'text-red-700 font-medium' :
          r.status === 'SUSPENDED'   ? 'text-orange-700 font-medium' :
          'text-gray-700'
        }>
          {r.status || '—'}
        </span>
      ),
    },
  ];

  const getDisplayName = (r) => {
    if (!r || !r.supplier_id) return '';
    return `${r.supplier_code} — ${r.legal_name}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select Supplier'}
      fetchData={fetchSuppliers}
      columns={columns}
      getItemId={(r) => r.supplier_id}
      getItemLabel={(r) => getDisplayName(r)}
      selectedItemId={selectedSupplierId ?? null}
      selectedItemIds={selectedSupplierIds ?? []}
      excludeId={excludeSupplierId ?? null}
      quickSelect={quickSelect}
      multiple={multiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(SupplierSelectionModal);
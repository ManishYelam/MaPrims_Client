import React from 'react';
import { Mail, Tag, MapPin } from 'lucide-react';
import { stockPointsAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../common/EntitySelectionModal';

const StockPointSelectionModal = (props) => {
  const {
    statusFilter,
    excludeId,
    selectedStockPointId,
    quickSelect,
    ...rest
  } = props;

  const fetchStockPoints = async (page, columnFilters, limit) => {
    const params = { page, limit };
    if (statusFilter) params.status = statusFilter;

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });

    const response = await stockPointsAPI.getAllStockPoints(params);
    const data = response.data;

    if (!data) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const list = data.stockPoints || data.data || data.rows || [];

    const pagination = data.pagination || {};
    const totalItems =
      pagination.totalItems ??
      data.totalRecords ??
      data.count ??
      list.length;
    const totalPages =
      pagination.totalPages ??
      data.totalPages ??
      (Math.ceil(totalItems / limit) || 1);
    const currentPage =
      pagination.page ??
      data.currentPage ??
      page;

    let rows = Array.isArray(list) ? list : [];

    if (excludeId != null) {
      rows = rows.filter((sp) => sp.stock_po_id !== excludeId);
    }

    return { rows, totalItems, totalPages, currentPage };
  };

  const columns = [
    {
      key: 'stock_po_id',
      label: 'ID',
      searchable: false,
      render: (sp) => (
        <span className="font-mono text-gray-700">{sp.stock_po_id}</span>
      ),
    },
    {
      key: 'stock_point_code',
      label: 'Code',
      searchable: true,
      filterKey: 'stock_point_code',
      render: (sp) => (
        <span className="font-mono text-gray-900">
          {sp.stock_point_code || '—'}
        </span>
      ),
    },
    {
      key: 'stock_point_name',
      label: 'Name',
      searchable: true,
      filterKey: 'stock_point_name',
      render: (sp) => (
        <div className="flex items-center gap-1 text-gray-900">
          <Tag className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[220px]">
            {sp.stock_point_name || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'stock_point_type',
      label: 'Type',
      searchable: true,
      filterKey: 'stock_point_type',
      render: (sp) => (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
          {sp.stock_point_type || '—'}
        </span>
      ),
    },
    {
      key: 'stock_point_category',
      label: 'Category',
      searchable: true,
      filterKey: 'stock_point_category',
      render: (sp) => (
        <span className="text-gray-700">{sp.stock_point_category || '—'}</span>
      ),
    },
    {
      key: 'city',
      label: 'Location',
      searchable: true,
      filterKey: 'city',
      render: (sp) => {
        const loc = [sp.city, sp.state].filter(Boolean).join(', ');
        return (
          <div className="flex items-center gap-1 text-gray-700">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="truncate max-w-[160px]">{loc || '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'contact_email',
      label: 'Contact',
      searchable: true,
      filterKey: 'contact_email',
      render: (sp) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Mail className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[180px]">
            {sp.contact_email || sp.contact_phone || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      searchable: false,
      render: (sp) => (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
            sp.is_active !== false
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {sp.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const getDisplayName = (sp) => {
    if (!sp || !sp.stock_po_id) return '';
    const code = sp.stock_point_code || '';
    const name = sp.stock_point_name || '';
    if (code && name) return `${code} — ${name}`;
    return name || code || `ID: ${sp.stock_po_id}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      selectedItemId={selectedStockPointId}
      title="Select Stock Point"
      fetchData={fetchStockPoints}
      columns={columns}
      getItemId={(sp) => sp.stock_po_id}
      getItemLabel={(sp) => getDisplayName(sp)}
      quickSelect={quickSelect}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(StockPointSelectionModal);
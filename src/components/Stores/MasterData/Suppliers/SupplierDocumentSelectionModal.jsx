// src/modules/Suppliers/SupplierDocumentSelectionModal.jsx
import React from 'react';
import { FileText } from 'lucide-react';
import { supplierDocumentsAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../../components/common/EntitySelectionModal';

const SupplierDocumentSelectionModal = (props) => {
  const {
    onlyActive = false,
    filterSupplierId,
    filterDocumentType,
    filterStatus,
    excludeDocumentId,
    selectedDocumentId,
    selectedDocumentIds,
    quickSelect,
    multiple,
    ...rest
  } = props;

  const fetchDocuments = async (page, columnFilters, limit) => {
    const filterObj = {};
    if (onlyActive)         filterObj.is_active = true;
    if (filterSupplierId)   filterObj.supplier_id = filterSupplierId;
    if (filterDocumentType) filterObj.document_type = filterDocumentType;
    if (filterStatus)       filterObj.verification_status = filterStatus;

    const payload = {
      page,
      limit,
      search: '',
      searchFields: ['document_type', 'document_name', 'document_no', 'issued_by_authority'],
      filters: filterObj,
    };

    const type = (columnFilters.document_type || '').trim();
    const name = (columnFilters.document_name || '').trim();
    const term = name || type;
    if (term) payload.search = term;

    let response;
    try {
      response = await supplierDocumentsAPI.getAllSupplierDocuments(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.supplierDocuments || [];
    if (excludeDocumentId) rows = rows.filter(r => r.document_id !== excludeDocumentId);
    if (type) {
      const v = type.toLowerCase();
      rows = rows.filter(r => String(r.document_type || '').toLowerCase().includes(v));
    }
    if (name) {
      const v = name.toLowerCase();
      rows = rows.filter(r => String(r.document_name || '').toLowerCase().includes(v));
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
      key: 'document_id',
      label: 'ID',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.document_id}</span>,
    },
    {
      key: 'document_type',
      label: 'Type',
      searchable: true,
      filterKey: 'document_type',
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-900">
          <FileText className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[180px]">{r.document_type || '—'}</span>
        </div>
      ),
    },
    {
      key: 'document_name',
      label: 'Name',
      searchable: true,
      filterKey: 'document_name',
      render: (r) => <span className="text-gray-700 truncate max-w-[200px] block">{r.document_name || '—'}</span>,
    },
    {
      key: 'document_no',
      label: 'Doc No',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.document_no || '—'}</span>,
    },
    {
      key: 'supplier',
      label: 'Supplier',
      searchable: false,
      render: (r) => (
        <span className="text-gray-700">
          {r.supplier ? `${r.supplier.supplier_code}` : (r.supplier_id || '—')}
        </span>
      ),
    },
    {
      key: 'expiry_date',
      label: 'Expires',
      searchable: false,
      render: (r) => {
        if (!r.expiry_date) return <span className="text-gray-400">—</span>;
        const isExpired = new Date(r.expiry_date) < new Date();
        return (
          <span className={isExpired ? 'text-red-700 font-medium' : 'text-gray-700'}>
            {new Date(r.expiry_date).toLocaleDateString('en-IN')}
          </span>
        );
      },
    },
    {
      key: 'verification_status',
      label: 'Status',
      searchable: false,
      render: (r) => (
        <span className={
          r.verification_status === 'VERIFIED' ? 'text-green-700 font-medium' :
          r.verification_status === 'PENDING'  ? 'text-amber-700 font-medium' :
          r.verification_status === 'REJECTED' ? 'text-red-700 font-medium' :
          'text-gray-700'
        }>
          {r.verification_status || '—'}
        </span>
      ),
    },
    {
      key: 'version',
      label: 'Ver',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.version ?? 1}</span>,
    },
  ];

  const getDisplayName = (r) => {
    if (!r || !r.document_id) return '';
    return `#${r.document_id} — ${r.document_type}${r.document_name ? ` (${r.document_name})` : ''}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select Supplier Document'}
      fetchData={fetchDocuments}
      columns={columns}
      getItemId={(r) => r.document_id}
      getItemLabel={(r) => getDisplayName(r)}
      selectedItemId={selectedDocumentId ?? null}
      selectedItemIds={selectedDocumentIds ?? []}
      excludeId={excludeDocumentId ?? null}
      quickSelect={quickSelect}
      multiple={multiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(SupplierDocumentSelectionModal);
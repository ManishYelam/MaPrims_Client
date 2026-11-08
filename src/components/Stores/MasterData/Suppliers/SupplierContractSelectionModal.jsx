import React from 'react';
import { FileText } from 'lucide-react';
import { supplierContractsAPI } from '../../../../services/api';
import EntitySelectionModal from '../../../../components/common/EntitySelectionModal';

const SupplierContractSelectionModal = (props) => {
  const {
    filterSupplierId,
    filterContractType,
    filterStatus,
    excludeContractId,
    selectedContractId,
    selectedContractIds,
    quickSelect,
    multiple,
    ...rest
  } = props;

  const fetchContracts = async (page, columnFilters, limit) => {
    const filterObj = {};
    if (filterSupplierId)   filterObj.supplier_id = filterSupplierId;
    if (filterContractType) filterObj.contract_type = filterContractType;
    if (filterStatus)       filterObj.status = filterStatus;

    const payload = {
      page,
      limit,
      search: '',
      searchFields: ['contract_no', 'contract_title', 'remarks'],
      filters: filterObj,
    };

    const no = (columnFilters.contract_no || '').trim();
    const title = (columnFilters.contract_title || '').trim();
    const term = no || title;
    if (term) payload.search = term;

    let response;
    try {
      response = await supplierContractsAPI.getAllSupplierContracts(payload);
    } catch {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const data = response.data;
    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    let rows = data.supplierContracts || [];
    if (excludeContractId) rows = rows.filter(r => r.contract_id !== excludeContractId);
    if (no) {
      const v = no.toLowerCase();
      rows = rows.filter(r => String(r.contract_no || '').toLowerCase().includes(v));
    }
    if (title) {
      const v = title.toLowerCase();
      rows = rows.filter(r => String(r.contract_title || '').toLowerCase().includes(v));
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
      key: 'contract_id',
      label: 'ID',
      searchable: false,
      render: (r) => <span className="font-mono text-gray-700">{r.contract_id}</span>,
    },
    {
      key: 'contract_no',
      label: 'No',
      searchable: true,
      filterKey: 'contract_no',
      render: (r) => <span className="font-mono font-semibold text-gray-900">{r.contract_no || '—'}</span>,
    },
    {
      key: 'contract_title',
      label: 'Title',
      searchable: true,
      filterKey: 'contract_title',
      render: (r) => (
        <div className="flex items-center gap-1 text-gray-900">
          <FileText className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[220px]">{r.contract_title || '—'}</span>
        </div>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      searchable: false,
      render: (r) => (
        <span className="text-gray-700">
          {r.supplier ? r.supplier.supplier_code : (r.supplier_id || '—')}
        </span>
      ),
    },
    {
      key: 'contract_type',
      label: 'Type',
      searchable: false,
      render: (r) => <span className="text-gray-700">{r.contract_type || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      searchable: false,
      render: (r) => (
        <span className={
          r.status === 'ACTIVE'     ? 'text-green-700 font-medium' :
          r.status === 'TERMINATED' ? 'text-red-700 font-medium' :
          r.status === 'EXPIRED'    ? 'text-orange-700 font-medium' :
          'text-gray-700'
        }>
          {r.status || '—'}
        </span>
      ),
    },
    {
      key: 'start_date',
      label: 'From',
      searchable: false,
      render: (r) => r.start_date
        ? <span className="text-gray-700">{new Date(r.start_date).toLocaleDateString('en-IN')}</span>
        : <span className="text-gray-400">—</span>,
    },
    {
      key: 'end_date',
      label: 'To',
      searchable: false,
      render: (r) => {
        if (!r.end_date) return <span className="text-gray-400">—</span>;
        const expired = new Date(r.end_date) < new Date();
        return (
          <span className={expired ? 'text-red-700 font-medium' : 'text-gray-700'}>
            {new Date(r.end_date).toLocaleDateString('en-IN')}
          </span>
        );
      },
    },
  ];

  const getDisplayName = (r) => {
    if (!r || !r.contract_id) return '';
    return `${r.contract_no}${r.contract_title ? ` — ${r.contract_title}` : ''}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      title={rest.title || 'Select Supplier Contract'}
      fetchData={fetchContracts}
      columns={columns}
      getItemId={(r) => r.contract_id}
      getItemLabel={(r) => getDisplayName(r)}
      selectedItemId={selectedContractId ?? null}
      selectedItemIds={selectedContractIds ?? []}
      excludeId={excludeContractId ?? null}
      quickSelect={quickSelect}
      multiple={multiple}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(SupplierContractSelectionModal);
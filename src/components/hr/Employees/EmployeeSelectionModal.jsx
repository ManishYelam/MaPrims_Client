import React from 'react';
import { User, Mail, Building2 } from 'lucide-react';
import { hrAPI } from '../../../services/api';
import EntitySelectionModal from '../../common/EntitySelectionModal';

const EmployeeSelectionModal = (props) => {
  const {
    deptId,
    excludeId,
    selectedEmployeeId,
    quickSelect,
    ...rest
  } = props;

  const fetchEmployees = async (page, columnFilters, limit) => {
    const params = {
      page,
      limit,
      status: 'active',
    };

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && value.trim()) params[key] = value.trim();
    });

    if (deptId) params.dept_id = deptId;

    const response = await hrAPI.getDropdownEmployees(params);
    const data = response.data;

    if (!data?.success) {
      return { rows: [], totalItems: 0, totalPages: 1, currentPage: page };
    }

    const payload = data.data || {};
    let rows = payload.rows || [];

    if (excludeId) rows = rows.filter(emp => emp.emp_id !== excludeId);

    return {
      rows,
      totalItems: payload.count || rows.length,
      totalPages: payload.totalPages || Math.ceil((payload.count || rows.length) / limit),
      currentPage: payload.currentPage || page,
    };
  };

  const columns = [
    {
      key: 'emp_id',
      label: 'ID',
      searchable: true,
      filterKey: 'emp_id',
      render: (emp) => <span className="font-mono text-gray-700">{emp.emp_id}</span>,
    },
    {
      key: 'first_name',
      label: 'First Name',
      searchable: true,
      filterKey: 'first_name',
      render: (emp) => <span className="text-gray-900">{emp.first_name || '—'}</span>,
    },
    {
      key: 'last_name',
      label: 'Last Name',
      searchable: true,
      filterKey: 'last_name',
      render: (emp) => <span className="text-gray-900">{emp.last_name || '—'}</span>,
    },
    {
      key: 'display_name',
      label: 'Display Name',
      searchable: true,
      filterKey: 'display_name',
      render: (emp) => <span className="text-gray-900">{emp.display_name || '—'}</span>,
    },
    {
      key: 'employee_code',
      label: 'Code',
      searchable: true,
      filterKey: 'employee_code',
      render: (emp) => <span className="font-mono text-gray-700">{emp.employee_code || '—'}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      searchable: true,
      filterKey: 'email',
      render: (emp) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Mail className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[180px]">{emp.email}</span>
        </div>
      ),
    },
    {
      key: 'dept_id',
      label: 'Dept ID',
      searchable: true,
      filterKey: 'dept_id',
      render: (emp) => <span className="font-mono text-gray-700">{emp.dept_id || '—'}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      searchable: false,
      render: (emp) => (
        <div className="flex items-center gap-1 text-gray-700">
          <Building2 className="w-3 h-3 text-gray-400" />
          <span>{emp.department?.name || '—'}</span>
        </div>
      ),
    },
  ];

  const getDisplayName = (emp) => {
    if (!emp || !emp.emp_id) return '';
    if (emp.display_name) return emp.display_name;
    return [emp.first_name, emp.last_name].filter(Boolean).join(' ') || emp.email || `ID: ${emp.emp_id}`;
  };

  return (
    <EntitySelectionModal
      {...rest}
      selectedItemId={selectedEmployeeId}
      title="Select Employee"
      fetchData={fetchEmployees}
      columns={columns}
      getItemId={(emp) => emp.emp_id}
      getItemLabel={(emp) => getDisplayName(emp)}
      quickSelect={quickSelect}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
};

export default React.memo(EmployeeSelectionModal);
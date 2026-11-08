import React from 'react';
import {
  Coins,
  HandCoins,
  Folder,
  FileText,
  DollarSign,
  Receipt,
  CreditCard,
  Calendar,
} from 'lucide-react';
import ModuleGrid from '../../../layouts/ModuleGrid';

const EXPENSE_ICON_MAP = {
  'expenses': Coins,
  'expense claims': FileText,
  'expense items': Folder,
  'expense reports': Folder,
  'reimbursements': HandCoins,
  'receipts': Receipt,
  'credit card expenses': CreditCard,
  'expense approvals': Calendar,
  'expense': DollarSign,
};

const ExpenseManagement = () => (
  <ModuleGrid
    iconMap={EXPENSE_ICON_MAP}
    emptyMessage="No expense sub‑modules available."
  />
);

export default ExpenseManagement;
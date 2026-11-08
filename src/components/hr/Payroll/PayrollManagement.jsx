import React from 'react';
import {
  DollarSign,
  Coins,
  HandCoins,
  Gift,
} from 'lucide-react';
import ModuleGrid from '../../../layouts/ModuleGrid';

const PAYROLL_ICON_MAP = {
  'payroll runs': Coins,
  'payroll items': HandCoins,
  'salary structure': Coins,
  allowances: Gift,
  deductions: HandCoins,
  bonuses: Gift,
  payroll: DollarSign,
};

const PayrollManagement = () => (
  <ModuleGrid
    iconMap={PAYROLL_ICON_MAP}
    emptyMessage="No payroll sub‑modules available."
  />
);

export default PayrollManagement;
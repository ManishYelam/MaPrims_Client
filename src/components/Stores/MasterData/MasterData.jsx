import React from 'react';
import {
  Store,
    ShoppingCart,
  ClipboardList,
  FileText,
  ClipboardCheck,
  TrendingUp,
  ArrowLeftRight,
  PackageCheck,
  PackageMinus,
  Boxes,
  BarChart3,
  Wallet,
  ShieldCheck,
  Settings,
    Layers,
  Ruler,
  Wallet2,
  FileSignature,
  FileBadge,
  FileSpreadsheet,
  FilePlus2,
  FileMinus2,
  Inbox,
  Send,
  RotateCcw,
  Package,
   Scale,
  ListChecks,
  History,
  Bell,
  UserCog,
  Hash,
  Clock,
  Shield,
  Truck 
} from 'lucide-react';
import ModuleGrid from '../../../layouts/ModuleGrid';

const STORE_ICON_MAP = {
  'stock points': Store,
  'stock point settings': Settings,
  'items': Package,
  'item categories': Layers,
  'uoms': Ruler,
  'suppliers': Truck,
  'supplier documents': FileBadge,
  'supplier contracts': FileSignature,
  'cost centers': Wallet2,

  // ===== A3 — Requisitions =====
  'material requisitions': FilePlus2,
  'purchase requisitions': FileText,

  // ===== A3 — Procurement =====
  'rfqs': Send,
  'quotations': FileSpreadsheet,
  'quotation comparison': Scale,
  'purchase orders': ShoppingCart,
  'grns': PackageCheck,

  // ===== A3 — Quality Control =====
  'qc inspections': ClipboardCheck,
  'return to vendor': RotateCcw,
  'three-way match': ListChecks,

  // ===== A3 — Transfers =====
  'stock transfer notes': ArrowLeftRight,
  'receive notes': Inbox,

  // ===== A3 — Consumption =====
  'material issues': PackageMinus,
  'material returns': RotateCcw,

  // ===== A3 — Inventory =====
  'stock balances': Boxes,
  'inventory movements': History,
  'stock counts': ClipboardList,
  'stock adjustments': Scale,
  'stock reservations': FileMinus2,

  // ===== A3 — Reports =====
  'stock reports': BarChart3,
  'consumption reports': TrendingUp,
  'procurement reports': ShoppingCart,
  'supplier reports': Truck,
  'budget reports': Wallet,
  'audit reports': ShieldCheck,

  // ===== A3 — Budget =====
  'department budgets': Wallet,
  'budget utilization': TrendingUp,

  // ===== A3 — Approvals =====
  'pending approvals': Clock,
  'approval history': History,

  // ===== A3 — Settings =====
  'approval matrix': Shield,
  'document sequences': Hash,
  'notification settings': Bell,
  'user role mapping': UserCog,
};

const Stores = () => (
  <ModuleGrid
    iconMap={STORE_ICON_MAP}
    emptyMessage="No Store sub-modules available."
  />
);

export default Stores;
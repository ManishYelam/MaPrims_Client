import React from 'react';
import {
  Wrench,
  AlertTriangle,
  ClipboardList,
  Boxes,
  PackageSearch,
  Warehouse,
  FileSpreadsheet,
  Settings,
  BarChart3,
} from 'lucide-react';
import ModuleGrid from '../../layouts/ModuleGrid';

const EQUIPMENT_ICON_MAP = {
  'assets': Wrench,
  'breakdowns': AlertTriangle,
  'work orders': ClipboardList,
  'work order items': FileSpreadsheet,
  'items': Boxes,
  'inventory': PackageSearch,
  'stock': Warehouse,
  'item stocks': Warehouse,
  'settings': Settings,
  'reports': BarChart3,
};

const Equipment = () => (
  <ModuleGrid
    iconMap={EQUIPMENT_ICON_MAP}
    emptyMessage="No Equipment sub‑modules available."
  />
);

export default Equipment;
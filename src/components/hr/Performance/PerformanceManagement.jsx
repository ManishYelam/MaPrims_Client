import React from 'react';
import {
  Award,
  TrendingUp,
  FileCheck,
  BarChart3,
  Target,
} from 'lucide-react';
import ModuleGrid from '../../../layouts/ModuleGrid';

const PERFORMANCE_ICON_MAP = {
  'performance reviews': Award,
  'review cycles': BarChart3,
  'reviews': FileCheck,
  'goals': Target,
  'performance': TrendingUp,
  'performance management': Award,
};

const PerformanceManagement = () => (
  <ModuleGrid
    iconMap={PERFORMANCE_ICON_MAP}
    emptyMessage="No performance sub‑modules available."
  />
);

export default PerformanceManagement;
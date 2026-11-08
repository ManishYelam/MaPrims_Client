import React from 'react';
import {
  CalendarDays,
  ClipboardList,
  Ticket,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react';
import ModuleGrid from '../../../layouts/ModuleGrid';

const LEAVE_ICON_MAP = {
  'leave requests': ClipboardList,
  'leave balances': TrendingUp,
  'leave types': Ticket,
  'leave workflow': Settings,
  'leave rules': Shield,
  'leaves management': CalendarDays,
  'leave': CalendarDays,
};

const LeaveManagement = () => (
  <ModuleGrid
    iconMap={LEAVE_ICON_MAP}
    emptyMessage="No leave sub‑modules available."
  />
);

export default LeaveManagement;
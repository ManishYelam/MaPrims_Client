import React from 'react';
import {
  Users,
  Building2,
  Briefcase,
  Clock,
  CalendarDays,
  TrendingUp,
  MapPin,
  Calendar,
  Clock as ShiftIcon,
  UserCheck,
  DollarSign,
  Coins,
  Gift,
  HandCoins,
  FileText,
  GraduationCap,
  ClipboardList,
  Ticket,
  Folder,
  Award,
  Settings,
  UserPlus,
  FileCheck,
  BookOpen,
  BarChart3,
  Shield,
  LayoutDashboard
} from 'lucide-react';
import ModuleGrid from '../../layouts/ModuleGrid';

const HR_ICON_MAP = {
  'hrms dashboard': LayoutDashboard,
  'employees': Users,
  'departments': Building2,
  'positions': Briefcase,
  'clock': Clock,
  'attendance': Clock,
  'leaves': CalendarDays,
  'leave balances': TrendingUp,
  'leave requests': ClipboardList,
  'leave types': Ticket,
  'leave workflow': Settings,
  'leave rules': Shield,
  performance: Award,
  'review cycles': BarChart3,
  reviews: FileCheck,
  goals: TrendingUp,
  'work locations': MapPin,
  holidays: Calendar,
  shifts: ShiftIcon,
  'shifts assignments': UserCheck,
  payroll: DollarSign,
  'payroll runs': Coins,
  'payroll items': HandCoins,
  'salary structure': Coins,
  allowances: Gift,
  deductions: HandCoins,
  bonuses: Gift,
  recruitment: UserPlus,
  requisitions: FileText,
  applications: FileText,
  'offer letters': FileCheck,
  expense: Coins,
  expenses: Coins,
  'expenses item': Folder,
  documents: Folder,
  traning: GraduationCap,
  'traning attendance': BookOpen,
};

const HR = () => (
  <ModuleGrid
    iconMap={HR_ICON_MAP}
    emptyMessage="No HR sub‑modules available."
  />
);

export default HR;
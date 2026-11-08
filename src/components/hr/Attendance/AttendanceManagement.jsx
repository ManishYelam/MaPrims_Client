import React from 'react';
import {
  Clock,
  Calendar,
  MapPin,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import ModuleGrid from '../../../layouts/ModuleGrid';

const ATTENDANCE_ICON_MAP = {
  attendance: Clock,
  holidays: Calendar,
  shifts: UserCheck,
  'work locations': MapPin,
  training: GraduationCap,
};

const AttendanceManagement = () => (
  <ModuleGrid
    iconMap={ATTENDANCE_ICON_MAP}
    emptyMessage="No attendance sub‑modules available."
  />
);

export default AttendanceManagement;

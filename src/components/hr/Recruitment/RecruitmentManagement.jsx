import React from 'react';
import {
  UserPlus,
  FileText,
  FileCheck,
  Calendar,
  Users,
  Briefcase,
  Folder,
  UserMinus,
} from 'lucide-react';
import ModuleGrid from '../../../layouts/ModuleGrid';

const RECRUITMENT_ICON_MAP = {
  requisitions: FileText,
  'job requisitions': FileText,
  applications: FileText,
  'job applications': FileText,
  interviews: Calendar,
  'offer letters': FileCheck,
  recruitment: UserPlus,
  candidates: Users,
  positions: Briefcase,
  'job positions': Briefcase,
  resignations: UserMinus,
};

const RecruitmentManagement = () => (
  <ModuleGrid
    iconMap={RECRUITMENT_ICON_MAP}
    emptyMessage="No recruitment sub‑modules available."
  />
);

export default RecruitmentManagement;
import React from 'react';
import { GraduationCap, UserCheck } from 'lucide-react';
import ModuleGrid from '../../../../layouts/ModuleGrid';

const TRAINING_ICON_MAP = {
  'trainings': GraduationCap,
  'attendance': UserCheck,
  'training attendances': UserCheck,
};

const Training = () => (
  <ModuleGrid
    iconMap={TRAINING_ICON_MAP}
    emptyMessage="No training sub‑modules available."
  />
);

export default Training;
import React from 'react';
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Trash2,
  AlertTriangle,
  Archive,
  Users,
  Settings,
  Mailbox,
} from 'lucide-react';
import ModuleGrid from '../../layouts/ModuleGrid';

const MAIL_MANAGEMENT_ICON_MAP = {
  mail: Mailbox,
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  trash: Trash2,
  spam: AlertTriangle,
  archive: Archive,
  contacts: Users,
  settings: Settings,
  email: Mail,
};

const MailManagement = () => (
  <ModuleGrid
    iconMap={MAIL_MANAGEMENT_ICON_MAP}
    emptyMessage="No mail management sub-modules available."
  />
);

export default MailManagement;
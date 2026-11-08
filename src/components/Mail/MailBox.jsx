import React, { useState, useRef, useEffect } from 'react';
import {
  Inbox,
  Send,
  Trash2,
  Mail,
  CheckCircle,
  Circle,
  Search,
  X,
  Plus,
  Clock,
  User,
  Paperclip,
  Reply,
  Forward,
  Archive,
  FileText,
  AlertCircle,
  Users,
  File,
  Settings,
  Star,
  ChevronDown,
  Printer,
  Edit,
  Copy,
  Folder,
} from 'lucide-react';

// ----- Mock data (with 'starred' field) -----
const baseEmails = [
  {
    id: 1,
    from: 'hr@company.com',
    subject: 'Upcoming Team Building Event',
    body: "Hi Team,\n\nWe're excited to announce a team-building event on Friday, July 15th. Please RSVP by Wednesday.\n\nBest,\nHR",
    date: '2026-07-03T09:30:00',
    read: false,
    starred: true,
    folder: 'inbox',
  },
  {
    id: 2,
    from: 'finance@company.com',
    subject: 'Monthly Expense Report',
    body: 'Dear all,\n\nPlease submit your monthly expense reports by the 5th of July. Use the new template attached.\n\nThanks,\nFinance',
    date: '2026-07-02T14:15:00',
    read: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 3,
    from: 'project-manager@company.com',
    subject: 'Project Status Update - Q3',
    body: 'Hello team,\n\nHere is the Q3 project status update. Please review and provide feedback by end of week.\n\nRegards,\nProject Manager',
    date: '2026-07-01T11:45:00',
    read: false,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 4,
    from: 'it-support@company.com',
    subject: 'Scheduled Maintenance - July 10',
    body: 'All,\n\nThere will be a scheduled system maintenance on July 10 from 2 AM to 4 AM. Please save your work.\n\nIT Support',
    date: '2026-06-30T08:00:00',
    read: true,
    starred: true,
    folder: 'inbox',
  },
  {
    id: 5,
    from: 'ceo@company.com',
    subject: 'Company Town Hall - July 12',
    body: "Dear team,\n\nJoin us for the quarterly town hall on July 12 at 3 PM. We'll share key updates and recognise top performers.\n\nBest,\nCEO",
    date: '2026-06-29T16:20:00',
    read: false,
    starred: false,
    folder: 'inbox',
  },
  // Sent emails
  {
    id: 6,
    from: 'me@company.com',
    to: 'alice@client.com',
    subject: 'Proposal Review',
    body: 'Hi Alice,\n\nPlease find the updated proposal attached. Let me know your thoughts.\n\nThanks,\nMe',
    date: '2026-07-04T10:00:00',
    read: true,
    starred: false,
    folder: 'sent',
  },
  {
    id: 7,
    from: 'me@company.com',
    to: 'bob@partner.com',
    subject: 'Meeting Reschedule',
    body: 'Bob,\n\nCan we move our call to 3 PM tomorrow? I have a conflict at 2.\n\nBest,\nMe',
    date: '2026-07-03T16:30:00',
    read: true,
    starred: false,
    folder: 'sent',
  },
  // Draft
  {
    id: 8,
    from: 'me@company.com',
    subject: 'Draft: Weekly Report',
    body: 'Draft of weekly report...',
    date: '2026-07-04T08:00:00',
    read: true,
    starred: false,
    folder: 'drafts',
  },
  // Spam (mock)
  {
    id: 9,
    from: 'spammer@fake.com',
    subject: 'You won a prize!',
    body: 'Congratulations! Click here to claim your prize.',
    date: '2026-07-01T00:00:00',
    read: true,
    starred: false,
    folder: 'spam',
  },
  // Archive (mock)
  {
    id: 10,
    from: 'old-project@company.com',
    subject: 'Archived Project Notes',
    body: 'These are old project notes.',
    date: '2026-06-01T12:00:00',
    read: true,
    starred: false,
    folder: 'archive',
  },
];

// Mock contacts data
const mockContacts = [
  { id: 1, name: 'Alice Johnson', email: 'alice@company.com', group: 'Work', type: 'personal' },
  { id: 2, name: 'Bob Smith', email: 'bob@company.com', group: 'Work', type: 'personal' },
  { id: 3, name: 'Carol White', email: 'carol@company.com', group: 'Friends', type: 'personal' },
  { id: 4, name: 'Dave Brown', email: 'dave@company.com', group: 'Work', type: 'personal' },
  { id: 5, name: 'Eve Davis', email: 'eve@company.com', group: 'Friends', type: 'personal' },
  { id: 6, name: 'Support Team', email: 'support@company.com', group: 'Work', type: 'group' },
  { id: 7, name: 'HR Team', email: 'hr@company.com', group: 'Work', type: 'group' },
];

// Mock templates data
const initialTemplates = [
  { id: 1, name: 'Meeting Request', subject: 'Meeting Request: [Topic]', body: 'Hi [Name],\n\nI would like to schedule a meeting to discuss [topic]. Please let me know your availability.\n\nThanks,\n[Your Name]' },
  { id: 2, name: 'Follow-up', subject: 'Following up on [Project]', body: 'Hi [Name],\n\nI hope this email finds you well. I am writing to follow up on the [project] we discussed.\n\nBest,\n[Your Name]' },
];

// ----- Helper: format date -----
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ----- Sidebar menu configuration -----
const menuItems = [
  { id: 'compose', label: 'Compose', icon: Plus, type: 'compose' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, view: 'inbox' },
  { id: 'sent', label: 'Sent', icon: Send, view: 'sent' },
  { id: 'drafts', label: 'Drafts', icon: FileText, view: 'drafts' },
  { id: 'trash', label: 'Trash', icon: Trash2, view: 'trash' },
  { id: 'spam', label: 'Spam', icon: AlertCircle, view: 'spam' },
  { id: 'archive', label: 'Archive', icon: Archive, view: 'archive' },
  { id: 'contacts', label: 'Contacts', icon: Users, view: 'contacts' },
  { id: 'templates', label: 'Templates', icon: File, view: 'templates' },
  { id: 'folders', label: 'Folders', icon: Folder, view: 'folders' },
];

// System folders (used for navigation and filtering)
const SYSTEM_VIEWS = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'];

// User email (used for avatar and copy)
const userEmail = 'me@company.com';

// ----- MailBox Component -----
const MailBox = () => {
  const [emails, setEmails] = useState(baseEmails);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [newEmail, setNewEmail] = useState({
    to: '',
    subject: '',
    body: '',
    cc: '',
    bcc: '',
    attachments: [],
  });
  const [activeView, setActiveView] = useState('inbox');
  const [contactsTab, setContactsTab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedEmailIds, setSelectedEmailIds] = useState(new Set());

  // Templates state
  const [templates, setTemplates] = useState(initialTemplates);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '' });

  // Custom folders
  const [customFolders, setCustomFolders] = useState(['Work', 'Personal', 'Projects']);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Toast notification
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const toastTimeout = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message, type });
    toastTimeout.current = setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 3000);
  };

  // Ref for hidden file input
  const fileInputRef = useRef(null);

  // ----- Computed -----
  const isSystemView = SYSTEM_VIEWS.includes(activeView);
  const isCustomFolder = customFolders.includes(activeView);

  const filteredEmails = emails
    .filter((email) => email.folder === activeView)
    .filter((email) =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.to && email.to.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter((email) => {
      if (filterType === 'unread') return !email.read;
      if (filterType === 'read') return email.read;
      if (filterType === 'starred') return email.starred;
      return true;
    });

  const selectedEmail = emails.find((e) => e.id === selectedId);

  const getCount = (folder) => emails.filter(e => e.folder === folder).length;
  const unreadCount = emails.filter(e => e.folder === 'inbox' && !e.read).length;

  // Contacts filtering
  const getFilteredContacts = () => {
    if (contactsTab === 'all') return mockContacts;
    if (contactsTab === 'my') return mockContacts.filter(c => c.type === 'personal');
    if (contactsTab === 'groups') return mockContacts.filter(c => c.type === 'group');
    return mockContacts;
  };

  const filteredContacts = getFilteredContacts();

  const groupedContacts = {};
  if (contactsTab === 'groups') {
    filteredContacts.forEach(contact => {
      if (!groupedContacts[contact.group]) groupedContacts[contact.group] = [];
      groupedContacts[contact.group].push(contact);
    });
  }

  // ----- Auto-select first email when view changes -----
  useEffect(() => {
    // Only auto-select if there are emails and the current selection is not in the filtered list
    if (filteredEmails.length > 0) {
      // Check if current selectedId is still in the filtered list
      const isSelectedInFilter = filteredEmails.some(e => e.id === selectedId);
      if (!isSelectedInFilter) {
        // Auto-select the first email
        const firstEmail = filteredEmails[0];
        setSelectedId(firstEmail.id);
        // Mark as read automatically
        if (!firstEmail.read) {
          markAsRead(firstEmail.id);
        }
      }
    } else {
      // No emails, clear selection
      setSelectedId(null);
    }
  }, [activeView, filterType, searchTerm, filteredEmails.length]);

  // ----- Core Actions -----
  const markAsRead = (id) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === id ? { ...email, read: true } : email
      )
    );
  };

  const toggleRead = (id) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === id ? { ...email, read: !email.read } : email
      )
    );
  };

  const toggleStarred = (id) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === id ? { ...email, starred: !email.starred } : email
      )
    );
  };

  const moveToFolder = (id, newFolder) => {
    const email = emails.find(e => e.id === id);
    if (!email || email.folder === newFolder) return;
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, folder: newFolder } : e
      )
    );
    if (selectedId === id) setSelectedId(null);
  };

  const deletePermanently = (id) => {
    setEmails((prev) => prev.filter((email) => email.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const deleteEmail = (id) => {
    if (activeView === 'trash') {
      deletePermanently(id);
    } else {
      moveToFolder(id, 'trash');
    }
  };

  // Specific shortcuts
  const reportAsSpam = (id) => moveToFolder(id, 'spam');
  const notSpam = (id) => moveToFolder(id, 'inbox');

  // Copy email to clipboard
  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Email copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy email.', 'error');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Email copied to clipboard!', 'success');
      } catch (err) {
        showToast('Failed to copy email.', 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  // Print function
  const handlePrint = (email) => {
    if (!email) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      showToast('Please allow popups to print.', 'error');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${email.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: auto; }
            h1 { font-size: 24px; margin-bottom: 6px; }
            .meta { color: #555; font-size: 14px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .body { white-space: pre-wrap; line-height: 1.6; }
            .attachments { margin-top: 20px; font-size: 14px; color: #555; }
          </style>
        </head>
        <body>
          <h1>${email.subject}</h1>
          <div class="meta">
            From: ${email.from}<br>
            ${email.to ? `To: ${email.to}<br>` : ''}
            ${email.cc ? `CC: ${email.cc}<br>` : ''}
            ${email.bcc ? `BCC: ${email.bcc}<br>` : ''}
            Date: ${new Date(email.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          <div class="body">${email.body}</div>
          ${email.attachments && email.attachments.length > 0
        ? `<div class="attachments"><strong>Attachments:</strong> ${email.attachments.join(', ')}</div>`
        : ''
      }
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ----- Bulk Actions -----
  const bulkAction = (action, folder) => {
    const ids = Array.from(selectedEmailIds);
    if (ids.length === 0) return;

    setEmails((prev) => {
      let updated = [...prev];
      ids.forEach(id => {
        const index = updated.findIndex(e => e.id === id);
        if (index === -1) return;
        const email = updated[index];
        switch (action) {
          case 'delete':
            if (activeView === 'trash') {
              updated = updated.filter(e => e.id !== id);
            } else {
              updated[index] = { ...email, folder: 'trash' };
            }
            break;
          case 'archive':
            if (activeView !== 'archive') {
              updated[index] = { ...email, folder: 'archive' };
            }
            break;
          case 'move':
            if (folder && email.folder !== folder) {
              updated[index] = { ...email, folder };
            }
            break;
          case 'markRead':
            updated[index] = { ...email, read: true };
            break;
          case 'markUnread':
            updated[index] = { ...email, read: false };
            break;
          case 'star':
            updated[index] = { ...email, starred: true };
            break;
          case 'unstar':
            updated[index] = { ...email, starred: false };
            break;
          case 'spam':
            updated[index] = { ...email, folder: 'spam' };
            break;
          case 'inbox':
            updated[index] = { ...email, folder: 'inbox' };
            break;
          default:
            break;
        }
      });
      return updated;
    });

    if (selectedId && selectedEmailIds.has(selectedId)) {
      setSelectedId(null);
    }
    setSelectedEmailIds(new Set());
  };

  // ----- Compose -----
  const handleCompose = (e) => {
    e.preventDefault();
    const toList = newEmail.to.split(',').map(s => s.trim()).filter(Boolean);
    if (toList.length === 0) {
      showToast('Please enter at least one recipient.', 'error');
      return;
    }
    if (!newEmail.subject.trim() || !newEmail.body.trim()) {
      showToast('Subject and body are required.', 'error');
      return;
    }

    const newId = Math.max(0, ...emails.map((e) => e.id)) + 1;
    const email = {
      id: newId,
      from: userEmail,
      to: toList.join(', '),
      cc: newEmail.cc.trim(),
      bcc: newEmail.bcc.trim(),
      subject: newEmail.subject.trim(),
      body: newEmail.body.trim(),
      date: new Date().toISOString(),
      read: true,
      starred: false,
      folder: 'sent',
      attachments: newEmail.attachments.map(file => file.name),
    };
    setEmails((prev) => [email, ...prev]);
    setNewEmail({ to: '', subject: '', body: '', cc: '', bcc: '', attachments: [] });
    setShowCompose(false);
    showToast('Email sent successfully!', 'success');
  };

  const handleAttachmentRemove = (index) => {
    setNewEmail(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleAttachmentAdd = (e) => {
    if (e.target.files) {
      setNewEmail({
        ...newEmail,
        attachments: [...newEmail.attachments, ...Array.from(e.target.files)],
      });
    }
    e.target.value = '';
  };

  // ----- Template functions -----
  const openTemplateModal = (template = null) => {
    if (template) {
      setEditingTemplateId(template.id);
      setTemplateForm({ name: template.name, subject: template.subject, body: template.body });
    } else {
      setEditingTemplateId(null);
      setTemplateForm({ name: '', subject: '', body: '' });
    }
    setShowTemplateModal(true);
  };

  const saveTemplate = () => {
    const { name, subject, body } = templateForm;
    if (!name.trim() || !subject.trim() || !body.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (editingTemplateId !== null) {
      setTemplates(prev =>
        prev.map(t => t.id === editingTemplateId ? { ...t, name, subject, body } : t)
      );
      showToast('Template updated!', 'success');
    } else {
      const newId = Math.max(0, ...templates.map(t => t.id)) + 1;
      setTemplates(prev => [...prev, { id: newId, name, subject, body }]);
      showToast('Template created!', 'success');
    }
    setShowTemplateModal(false);
  };

  const deleteTemplate = (id) => {
    if (window.confirm('Delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast('Template deleted.', 'success');
    }
  };

  const useTemplate = (template) => {
    setNewEmail(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body,
    }));
    setActiveView('inbox');
    setShowCompose(true);
  };

  // ----- Folder functions -----
  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) {
      showToast('Please enter a folder name.', 'error');
      return;
    }
    if (customFolders.includes(name) || SYSTEM_VIEWS.includes(name)) {
      showToast('A folder with this name already exists.', 'error');
      return;
    }
    setCustomFolders([...customFolders, name]);
    setNewFolderName('');
    setShowFolderModal(false);
    showToast(`Folder "${name}" created.`, 'success');
  };

  const deleteFolder = (folderName) => {
    if (!window.confirm(`Delete folder "${folderName}"? Any emails in it will be moved to Inbox.`)) return;
    setEmails(prev =>
      prev.map(email =>
        email.folder === folderName ? { ...email, folder: 'inbox' } : email
      )
    );
    setCustomFolders(customFolders.filter(f => f !== folderName));
    if (activeView === folderName) {
      setActiveView('inbox');
      setSelectedId(null);
    }
    showToast(`Folder "${folderName}" deleted. Emails moved to Inbox.`, 'success');
  };

  // Get list of destinations for move dropdowns
  const getDestinations = (currentFolder) => {
    const all = [
      { value: 'inbox', label: 'Inbox' },
      { value: 'spam', label: 'Spam' },
      { value: 'trash', label: 'Trash' },
      { value: 'archive', label: 'Archive' },
      ...customFolders.map(f => ({ value: f, label: f })),
    ];
    return all.filter(d => d.value !== currentFolder);
  };

  const isEmailView = SYSTEM_VIEWS.includes(activeView) || customFolders.includes(activeView);

  const getViewLabel = () => {
    if (SYSTEM_VIEWS.includes(activeView)) {
      const item = menuItems.find(i => i.view === activeView);
      return item ? item.label : 'Inbox';
    }
    if (customFolders.includes(activeView)) {
      return activeView;
    }
    if (activeView === 'settings') return 'Settings';
    if (activeView === 'folders') return 'Folders';
    return 'Inbox';
  };

  // Toggle individual selection
  const toggleSelect = (id) => {
    const newSet = new Set(selectedEmailIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEmailIds(newSet);
  };

  // Toggle all visible emails
  const toggleSelectAll = () => {
    if (selectedEmailIds.size === filteredEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(filteredEmails.map(e => e.id)));
    }
  };

  // ----- Render -----
  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - Compact (w-48) */}
      <div className="w-48 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = item.view === activeView;
            const count = item.view ? getCount(item.view) : 0;
            if (item.type === 'compose') {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowCompose(true)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Compose</span>
                </button>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.view);
                  setSelectedId(null);
                  setSelectedEmailIds(new Set());
                }}
                className={`
                  w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors
                  ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {count > 0 && (
                  <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* ----- Header (Compact) ----- */}
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between flex-wrap gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-gray-800">{getViewLabel()}</h2>
            {activeView === 'inbox' && (
              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-6 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-32 md:w-48"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-600">
              <span className="font-medium">{userEmail}</span>
              <button
                onClick={() => copyToClipboard(userEmail)}
                className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Copy email"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <Settings
              className="cursor-pointer text-gray-500 hover:text-gray-700 transition-colors w-4 h-4"
              onClick={() => {
                setActiveView('settings');
                setSelectedId(null);
                setSelectedEmailIds(new Set());
              }}
            />
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-hidden">
          {isEmailView ? (
            // ----- Email Views (System or Custom Folder) -----
            <div className="flex h-full">
              {/* Email list column */}
              <div className="w-full md:w-2/5 lg:w-1/3 border-r border-gray-200 flex flex-col bg-white h-full overflow-hidden">
                {/* Filter Bar (Compact) */}
                <div className="flex items-center gap-1.5 p-1 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={filteredEmails.length > 0 && selectedEmailIds.size === filteredEmails.length}
                    onChange={toggleSelectAll}
                    className="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
                    title="Select all visible emails"
                  />
                  <div className="flex gap-0.5 flex-1">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-colors text-center ${
                        filterType === 'all'
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Mails
                    </button>
                    <button
                      onClick={() => setFilterType('unread')}
                      className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-colors text-center ${
                        filterType === 'unread'
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Unread
                    </button>
                    <button
                      onClick={() => setFilterType('read')}
                      className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-colors text-center ${
                        filterType === 'read'
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Read
                    </button>
                    <button
                      onClick={() => setFilterType('starred')}
                      className={`flex-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-colors text-center ${
                        filterType === 'starred'
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Starred
                    </button>
                  </div>
                </div>

                {/* Bulk Action Bar (Compact) */}
                {selectedEmailIds.size > 0 && (
                  <div className="flex items-center gap-0.5 p-1 bg-primary-50 border-b border-primary-100 flex-shrink-0 flex-wrap">
                    <span className="text-[10px] font-medium text-primary-700 mr-0.5">
                      {selectedEmailIds.size} selected
                    </span>
                    {activeView === 'spam' && (
                      <button
                        onClick={() => bulkAction('inbox')}
                        className="p-0.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                        title="Move to Inbox"
                      >
                        <Inbox className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => bulkAction('delete')}
                      className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => bulkAction('archive')}
                      className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-3 h-3" />
                    </button>
                    {activeView !== 'spam' && (
                      <button
                        onClick={() => bulkAction('spam')}
                        className="p-0.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                        title="Report as spam"
                      >
                        <AlertCircle className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => bulkAction('markRead')}
                      className="p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      title="Mark Read"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => bulkAction('markUnread')}
                      className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Mark Unread"
                    >
                      <Circle className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => bulkAction('star')}
                      className="p-0.5 text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                      title="Star"
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      onClick={() => bulkAction('unstar')}
                      className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Unstar"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                    <div className="relative inline-block">
                      <select
                        onChange={(e) => {
                          const folder = e.target.value;
                          if (folder) {
                            bulkAction('move', folder);
                            e.target.value = '';
                          }
                        }}
                        value=""
                        className="text-[10px] bg-white border border-gray-300 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">Move to</option>
                        {getDestinations(activeView).map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setSelectedEmailIds(new Set())}
                      className="ml-auto p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Email List (Compact) */}
                <div className="flex-1 overflow-y-auto">
                  {filteredEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                      <Inbox className="w-10 h-10 mb-1.5" />
                      <p className="text-xs">No emails in {getViewLabel().toLowerCase()}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {filteredEmails.map((email) => {
                        const isSelected = selectedId === email.id;
                        return (
                          <li
                            key={email.id}
                            onClick={() => {
                              setSelectedId(email.id);
                              if (!email.read) markAsRead(email.id);
                            }}
                            className={`
                              px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-1.5
                              ${isSelected ? 'bg-blue-50 border-l-4 border-primary-500' : ''}
                              ${!email.read ? 'bg-white' : 'bg-gray-50/50'}
                            `}
                          >
                            <div className="flex-shrink-0 pt-0.5">
                              <input
                                type="checkbox"
                                checked={selectedEmailIds.has(email.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(email.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3 h-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                              />
                            </div>
                            <div
                              className="flex-1 min-w-0"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {!email.read ? (
                                      <Circle className="w-2 h-2 text-primary-500 fill-primary-500 flex-shrink-0" />
                                    ) : (
                                      <CheckCircle className="w-2 h-2 text-gray-300 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium text-gray-900 truncate">
                                      {email.folder === 'sent' && email.to ? `To: ${email.to}` : email.from}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <p className="text-xs text-gray-700 truncate font-medium">
                                      {email.subject}
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStarred(email.id);
                                      }}
                                      className="flex-shrink-0 text-gray-400 hover:text-yellow-400 transition-colors"
                                    >
                                      {email.starred ? (
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      ) : (
                                        <Star className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                    {email.body.slice(0, 80)}...
                                  </p>
                                </div>
                                <div className="text-[10px] text-gray-400 whitespace-nowrap ml-2 flex flex-col items-end gap-0.5 flex-shrink-0">
                                  <span>{formatDate(email.date)}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Email detail (Compact) */}
              <div className="flex-1 bg-white overflow-y-auto p-3 md:p-4 hidden md:block">
                {selectedEmail ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {selectedEmail.subject}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                          <span>
                            {selectedEmail.folder === 'sent' && selectedEmail.to
                              ? `To: ${selectedEmail.to}`
                              : `From: ${selectedEmail.from}`
                            }
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(selectedEmail.date).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        {selectedEmail.cc && (
                          <div className="text-[10px] text-gray-500 mt-0.5">CC: {selectedEmail.cc}</div>
                        )}
                        {selectedEmail.bcc && (
                          <div className="text-[10px] text-gray-500">BCC: {selectedEmail.bcc}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 flex-wrap">
                        <button
                          onClick={() => toggleStarred(selectedEmail.id)}
                          className="p-1 text-gray-500 hover:text-yellow-400 hover:bg-gray-100 rounded transition-colors"
                          title={selectedEmail.starred ? 'Unstar' : 'Star'}
                        >
                          {selectedEmail.starred ? (
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <Star className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleRead(selectedEmail.id)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title={selectedEmail.read ? 'Mark as unread' : 'Mark as read'}
                        >
                          {selectedEmail.read ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {selectedEmail.folder !== 'spam' && (
                          <button
                            onClick={() => reportAsSpam(selectedEmail.id)}
                            className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                            title="Report as spam"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {selectedEmail.folder === 'spam' && (
                          <button
                            onClick={() => notSpam(selectedEmail.id)}
                            className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            title="Not spam - move to inbox"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="relative inline-block">
                          <select
                            onChange={(e) => {
                              const folder = e.target.value;
                              if (folder) {
                                moveToFolder(selectedEmail.id, folder);
                                e.target.value = '';
                              }
                            }}
                            value=""
                            className="text-[10px] bg-gray-100 border border-gray-300 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="">Move to</option>
                            {getDestinations(selectedEmail.folder).map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => deleteEmail(selectedEmail.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {activeView !== 'archive' && (
                          <button
                            onClick={() => archiveEmail(selectedEmail.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrint(selectedEmail)}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          title="Print this email"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedEmail.body}
                      </p>
                    </div>
                    {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                      <div className="border-t border-gray-100 pt-2">
                        <p className="text-[10px] font-medium text-gray-500">Attachments:</p>
                        <ul className="flex flex-wrap gap-1 mt-1">
                          {selectedEmail.attachments.map((name, idx) => (
                            <li key={idx} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                              {name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-primary-600 transition-colors">
                        <Reply className="w-3 h-3" /> Reply
                      </button>
                      <button className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-primary-600 transition-colors">
                        <Forward className="w-3 h-3" /> Forward
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Inbox className="w-12 h-12 mb-2" />
                    <p className="text-xs">Select an email to read</p>
                  </div>
                )}
              </div>

              {/* Mobile detail view (Compact) */}
              {selectedEmail && (
                <div className="md:hidden fixed inset-0 z-40 bg-white p-3 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setSelectedId(null)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-0.5 flex-wrap">
                      <button
                        onClick={() => toggleStarred(selectedEmail.id)}
                        className="p-1 text-gray-500 hover:text-yellow-400"
                      >
                        {selectedEmail.starred ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleRead(selectedEmail.id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        {selectedEmail.read ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      {selectedEmail.folder !== 'spam' && (
                        <button
                          onClick={() => reportAsSpam(selectedEmail.id)}
                          className="p-1 text-orange-500 hover:text-orange-700"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      )}
                      {selectedEmail.folder === 'spam' && (
                        <button
                          onClick={() => notSpam(selectedEmail.id)}
                          className="p-1 text-green-500 hover:text-green-700"
                          title="Not spam - move to inbox"
                        >
                          <Inbox className="w-4 h-4" />
                        </button>
                      )}
                      <select
                        onChange={(e) => {
                          const folder = e.target.value;
                          if (folder) {
                            moveToFolder(selectedEmail.id, folder);
                            e.target.value = '';
                          }
                        }}
                        value=""
                        className="text-[10px] bg-gray-100 border border-gray-300 rounded-md px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">Move</option>
                        {getDestinations(selectedEmail.folder).map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteEmail(selectedEmail.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(selectedEmail)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Print this email"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {selectedEmail.folder === 'sent' && selectedEmail.to
                          ? `To: ${selectedEmail.to}`
                          : `From: ${selectedEmail.from}`
                        }
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(selectedEmail.date)}
                      </span>
                    </div>
                    {selectedEmail.cc && (
                      <div className="text-[10px] text-gray-500">CC: {selectedEmail.cc}</div>
                    )}
                    {selectedEmail.bcc && (
                      <div className="text-[10px] text-gray-500">BCC: {selectedEmail.bcc}</div>
                    )}
                    <div className="border-t border-gray-200 pt-2">
                      <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedEmail.body}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-primary-600">
                        <Reply className="w-3 h-3" /> Reply
                      </button>
                      <button className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-primary-600">
                        <Forward className="w-3 h-3" /> Forward
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeView === 'contacts' ? (
            // ----- Contacts View (Compact) -----
            <div className="h-full bg-white flex flex-col">
              <div className="border-b border-gray-200 px-3 py-1.5 flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex gap-1">
                  <button
                    onClick={() => setContactsTab('all')}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-lg transition-colors ${
                      contactsTab === 'all'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Contacts
                  </button>
                  <button
                    onClick={() => setContactsTab('my')}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-lg transition-colors ${
                      contactsTab === 'my'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    My Contacts
                  </button>
                  <button
                    onClick={() => setContactsTab('groups')}
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-lg transition-colors ${
                      contactsTab === 'groups'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Groups
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => showToast('Create Group functionality coming soon!', 'info')}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    Create Group
                  </button>
                  <button
                    onClick={() => showToast('Add Contacts functionality coming soon!', 'info')}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Contacts
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {filteredContacts.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <Users className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-[10px]">No contacts found</p>
                  </div>
                ) : contactsTab === 'groups' ? (
                  <div className="space-y-3">
                    {Object.keys(groupedContacts).map(group => (
                      <div key={group}>
                        <h3 className="text-[10px] font-semibold text-gray-600 mb-1">{group}</h3>
                        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                          {groupedContacts[group].map(contact => (
                            <li key={contact.id} className="px-2 py-1.5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-900">{contact.name}</p>
                                <p className="text-[10px] text-gray-500">{contact.email}</p>
                              </div>
                              <span className="text-[10px] text-gray-400">{contact.type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                    {filteredContacts.map(contact => (
                      <li key={contact.id} className="px-2 py-1.5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{contact.name}</p>
                          <p className="text-[10px] text-gray-500">{contact.email}</p>
                        </div>
                        <span className="text-[10px] text-gray-400">{contact.group}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : activeView === 'templates' ? (
            // ----- Templates View (Compact) -----
            <div className="h-full bg-white flex flex-col">
              <div className="border-b border-gray-200 px-3 py-1.5 flex items-center justify-between flex-wrap gap-1.5">
                <h3 className="text-xs font-semibold text-gray-800">Email Templates</h3>
                <button
                  onClick={() => openTemplateModal()}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New Template
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {templates.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <FileText className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-[10px]">No templates saved yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {templates.map(template => (
                      <div key={template.id} className="border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium text-gray-900">{template.name}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">Subject: {template.subject}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{template.body.slice(0, 80)}...</p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                            <button
                              onClick={() => useTemplate(template)}
                              className="p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Use this template"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => openTemplateModal(template)}
                              className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeView === 'folders' ? (
            // ----- Folders View (Compact) -----
            <div className="h-full bg-white flex flex-col">
              <div className="border-b border-gray-200 px-3 py-1.5 flex items-center justify-between flex-wrap gap-1.5">
                <h3 className="text-xs font-semibold text-gray-800">Your Folders</h3>
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New Folder
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {customFolders.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <Folder className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-[10px]">No custom folders yet. Create one to organise your emails.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                    {customFolders.map(folder => {
                      const count = getCount(folder);
                      return (
                        <li key={folder} className="px-2 py-1.5 hover:bg-gray-50 transition-colors flex items-center justify-between">
                          <button
                            onClick={() => {
                              setActiveView(folder);
                              setSelectedId(null);
                              setSelectedEmailIds(new Set());
                            }}
                            className="flex items-center gap-1.5 flex-1 text-left"
                          >
                            <Folder className="w-3.5 h-3.5 text-primary-600" />
                            <span className="text-xs font-medium text-gray-900">{folder}</span>
                            <span className="text-[10px] text-gray-400 ml-1">({count} emails)</span>
                          </button>
                          <button
                            onClick={() => deleteFolder(folder)}
                            className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            // Settings placeholder
            <div className="h-full bg-white flex items-center justify-center p-4">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">
                  {activeView === 'settings' && <Settings className="w-12 h-12 mx-auto text-gray-300" />}
                </div>
                <h3 className="text-sm font-semibold text-gray-700 capitalize">{getViewLabel()}</h3>
                <p className="text-[10px]">This section is under construction.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <div className="fixed top-3 right-3 z-50 max-w-xs w-full animate-slide-in">
          <div className={`
            px-3 py-2 rounded-lg shadow-lg border border-gray-200 flex items-start gap-2
            ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}>
            <div className="flex-1 text-xs font-medium">
              {toast.message}
            </div>
            <button
              onClick={() => setToast({ message: '', type: 'success' })}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">New Message</h3>
              <button
                onClick={() => {
                  setShowCompose(false);
                  setNewEmail({ to: '', subject: '', body: '', cc: '', bcc: '', attachments: [] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCompose} className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">To</label>
                <input
                  type="text"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="recipient1@example.com, recipient2@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">CC</label>
                <input
                  type="text"
                  value={newEmail.cc}
                  onChange={(e) => setNewEmail({ ...newEmail, cc: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="cc@example.com (comma separated)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">BCC</label>
                <input
                  type="text"
                  value={newEmail.bcc}
                  onChange={(e) => setNewEmail({ ...newEmail, bcc: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="bcc@example.com (comma separated)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Subject</label>
                <input
                  type="text"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Subject"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Message</label>
                <textarea
                  rows="3"
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Write your message..."
                  required
                />
              </div>
              {newEmail.attachments.length > 0 && (
                <ul className="space-y-1">
                  {newEmail.attachments.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between text-xs bg-gray-50 px-2.5 py-1 rounded-lg">
                      <span className="truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleAttachmentRemove(idx)}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-end items-center gap-2 pt-1">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleAttachmentAdd}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-all flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                {editingTemplateId !== null ? 'Edit Template' : 'New Template'}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Meeting Request"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Subject</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Meeting Request: [Topic]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Body</label>
                <textarea
                  rows="4"
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Hi [Name],\n\nI would like to ..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">New Folder</h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Client Projects"
                  onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createFolder}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MailBox;
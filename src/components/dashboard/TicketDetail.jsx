import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
  memo,
  lazy,
  Suspense,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const ReactQuill = lazy(() => import('react-quill-new'));
import 'react-quill-new/dist/quill.snow.css';
import {
  ArrowLeft,
  Paperclip,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { FaEdit } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { supportAPI } from '../../services/api';
import { useTicketSocket } from '../../context/useTicketSocket';

const UserHoverPopup = memo(({ user, children }) => {
  if (!user) return children;
  return (
    <div className="relative inline-block group">
      {children}
      <div className="absolute left-0 top-full hidden group-hover:block z-20">
        <div className="bg-gray-900 text-white text-[10px] rounded-md shadow-lg px-2 py-1 whitespace-nowrap">
          <div className="leading-tight">
            <span className="font-semibold">Name:</span> {user.full_name || 'User'},{' '}
            <span className="font-semibold">Email:</span> {user.email || 'N/A'},{' '}
            <span className="font-semibold">Phone:</span> {user.phone_number || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
});

const Toast = memo(({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-1 px-3 py-1 rounded-md shadow-lg border text-xs ${
      toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      {toast.type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      <span>{toast.message}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
    </div>
  );
});

const StatusBadge = memo(({ status }) => {
  const statusConfig = {
    open: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${statusConfig[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
});

const PriorityBadge = memo(({ priority }) => {
  const priorityConfig = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
    urgent: 'bg-red-600 text-white',
  };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${priorityConfig[priority] || 'bg-gray-100 text-gray-700'}`}>{priority}</span>;
});

const TicketDetail = () => {
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userData = user?.user;
  const isAdmin = userData?.role === 'admin';

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceContent, setSourceContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const [quillEditor, setQuillEditor] = useState(null);

  const [updateForm, setUpdateForm] = useState({
    status: '',
    priority: 'medium',
    time_spent: '',
    due_date: '',
    temp: '',
    note: '',
    attachment: null,
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const { isConnected, sendMessage, markAsRead, fetchHistory } = useTicketSocket(ticket_id, {
    onNewMessage: useCallback((newMsg) => {
      setMessages(prev => {
        const description = prev.find(m => m.type === 'description');
        const newReply = {
          type: 'reply',
          ticket_reply_id: newMsg.ticket_message_id,
          user: newMsg.user,
          message: newMsg.message,
          created_at: newMsg.created_at,
        };
        const existingIds = new Set(prev.map(m => m.ticket_reply_id).filter(id => id));
        if (!existingIds.has(newMsg.ticket_message_id)) {
          return [description, ...prev.filter(m => m.type === 'reply'), newReply];
        }
        return prev;
      });
      showToast('New message received', 'info');
      setRefreshFlag(prev => prev + 1);
    }, [showToast]),

    onMessageHistory: useCallback((data) => {
      if (data.ticket_id === Number(ticket_id) && data.messages?.messages) {
        const messagesArray = data.messages.messages;
        const historyMessages = messagesArray.map(msg => ({
          type: 'reply',
          ticket_reply_id: msg.ticket_message_id,
          user: msg.user,
          message: msg.message,
          created_at: msg.created_at,
        }));
        setMessages(prev => {
          const description = prev.find(m => m.type === 'description');
          return [description, ...historyMessages];
        });
      }
    }, [ticket_id]),

    onError: useCallback((err) => {
      console.error('Socket error:', err);
      showToast(err.message || 'Connection error', 'error');
    }, [showToast]),
  });

  useEffect(() => {
    if (refreshFlag > 0 && isConnected && ticket_id) {
      fetchHistory();
    }
  }, [refreshFlag, isConnected, ticket_id, fetchHistory]);

  const refreshMessages = useCallback(() => {
    if (isConnected && ticket_id) {
      fetchHistory();
    }
  }, [isConnected, ticket_id, fetchHistory]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
        [{ script: 'sub' }, { script: 'super' }],
      ],
    },
    clipboard: { matchVisual: false },
  }), []);

  const quillFormats = useMemo(() => [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list',
    'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image', 'video',
    'script',
  ], []);

  const handleQuillMount = useCallback((quillComponent) => {
    if (quillComponent) {
      quillRef.current = quillComponent;
      setQuillEditor(quillComponent.getEditor());
    }
  }, []);

  const toggleSourceMode = useCallback(() => {
    if (!isSourceMode && quillEditor) {
      setSourceContent(quillEditor.root.innerHTML);
    } else if (isSourceMode && quillEditor && sourceContent !== quillEditor.root.innerHTML) {
      quillEditor.root.innerHTML = sourceContent;
      setUpdateForm(prev => ({ ...prev, note: sourceContent }));
    }
    setIsSourceMode(prev => !prev);
  }, [isSourceMode, quillEditor, sourceContent]);

  const handleSourceChange = useCallback((e) => setSourceContent(e.target.value), []);
  const formatHTML = useCallback((html) => {
    let formatted = html.replace(/>\s*</g, '>\n<').replace(/\n\s*\n/g, '\n')
      .split('\n').map(l => l.trim()).filter(l => l.length).join('\n');
    let indent = 0;
    return formatted.split('\n').map(line => {
      if (line.match(/<\/[^>]+>/)) indent = Math.max(0, indent - 1);
      const out = '  '.repeat(indent) + line;
      if (line.match(/<[^\/][^>]*>/) && !line.match(/<br|img|input|hr|link|meta/)) indent++;
      return out;
    }).join('\n');
  }, []);
  const handlePrettify = useCallback(() => setSourceContent(formatHTML(sourceContent)), [formatHTML, sourceContent]);
  const handleWrapInTable = useCallback(() => {
    const ta = document.getElementById('source-textarea');
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    let selected = sourceContent.substring(start, end);
    if (!selected.trim()) selected = '&nbsp;';
    const table = `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">\n  <tbody>\n    <tr>\n      <td>${selected}</td>\n    </tr>\n  </tbody>\n</table>`;
    const newVal = sourceContent.substring(0, start) + table + sourceContent.substring(end);
    setSourceContent(newVal);
    setTimeout(() => { ta.selectionStart = start; ta.selectionEnd = start + table.length; }, 0);
  }, [sourceContent]);
  const handleClearFormatting = useCallback(() => {
    setSourceContent(prev => prev.replace(/\sstyle="[^"]*"/gi, '').replace(/\sclass="[^"]*"/gi, '').replace(/\sdata-[^=]+="[^"]*"/gi, ''));
  }, []);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportAPI.getTicket(ticket_id);
      if (res.data?.success) {
        const ticketData = res.data.data.ticket;
        setTicket(ticketData);
        const descriptionMsg = {
          type: 'description',
          id: 'desc',
          user: ticketData.user,
          message: ticketData.description,
          created_at: ticketData.created_at,
        };
        setMessages([descriptionMsg]);
      } else {
        setError(res.data?.message || 'Failed to load ticket');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load ticket details');
    } finally {
      setLoading(false);
    }
  }, [ticket_id]);

  useEffect(() => {
    if (ticket_id) fetchTicket();
  }, [ticket_id, fetchTicket]);

  useEffect(() => {
    if (isConnected && ticket) {
      refreshMessages();
      markAsRead();
    }
  }, [isConnected, ticket, refreshMessages, markAsRead]);

  const formatDateTime = useCallback((dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A', []);

  const handleUpdateChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (name === 'attachment') {
      setUpdateForm(prev => ({ ...prev, attachment: files[0] }));
    } else {
      setUpdateForm(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleReset = useCallback(() => {
    if (quillEditor) quillEditor.setText('');
    setUpdateForm({
      status: '',
      priority: 'medium',
      time_spent: '',
      due_date: '',
      temp: '',
      note: '',
      attachment: null,
    });
    setSourceContent('');
    setIsSourceMode(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [quillEditor]);

  const handleSubmitUpdate = useCallback(async () => {
    try {
      setSubmitting(true);
      let noteContent = updateForm.note;
      if (isSourceMode) noteContent = sourceContent;

      if (updateForm.attachment) {
        const formData = new FormData();
        formData.append('note', noteContent);
        if (updateForm.status) formData.append('status', updateForm.status);
        if (updateForm.priority) formData.append('priority', updateForm.priority);
        if (updateForm.time_spent) formData.append('time_spent', updateForm.time_spent);
        if (updateForm.due_date) formData.append('due_date', updateForm.due_date);
        if (updateForm.temp) formData.append('temp', updateForm.temp);
        formData.append('attachment', updateForm.attachment);

        const response = await supportAPI.post(`/tickets/${ticket_id}/replies`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (!response.data?.success) throw new Error(response.data?.message);
        showToast('Message with attachment sent');
        await refreshMessages();
      } else {
        if (!noteContent.trim()) {
          showToast('Message cannot be empty', 'error');
          return;
        }
        const success = sendMessage(noteContent, false);
        if (!success) throw new Error('Socket not connected');
        showToast('Message sent');
        setTimeout(() => refreshMessages(), 300);
      }

      setShowAddUpdate(false);
      handleReset();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [updateForm, isSourceMode, sourceContent, sendMessage, showToast, handleReset, ticket_id, refreshMessages]);

  const handleManageAttachments = useCallback(() => {
    window.open(`/dashboard/support/ticket/${ticket_id}/attachments`, '_blank');
  }, [ticket_id]);

  if (loading) return <div className="flex justify-center items-center h-[400px]"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !ticket) return (
    <div className="p-4"><div className="bg-red-50 border border-red-200 rounded p-4 text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
      <h2 className="text-base font-semibold text-gray-800 mb-1">Error Loading Ticket</h2>
      <p className="text-sm text-gray-600 mb-3">{error || 'Ticket not found'}</p>
      <button onClick={() => navigate('/dashboard/support')} className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"><ArrowLeft className="w-3 h-3" /> Back</button>
    </div></div>
  );

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <style>{`
        .compact-quill .ql-toolbar {
          padding: 2px 6px !important;
          min-height: 30px !important;
          border-top-left-radius: 0.25rem;
          border-top-right-radius: 0.25rem;
        }
        .compact-quill .ql-toolbar button {
          width: 20px !important;
          height: 20px !important;
          padding: 1px !important;
        }
        .compact-quill .ql-toolbar .ql-picker {
          font-size: 11px !important;
        }
        .compact-quill .ql-container {
          min-height: 80px !important;
          max-height: 240px !important;
          overflow-y: auto !important;
          font-size: 12px !important;
          border-bottom-left-radius: 0.25rem;
          border-bottom-right-radius: 0.25rem;
        }
        .compact-quill .ql-editor {
          padding: 4px 8px !important;
          line-height: 1.3 !important;
        }
        .compact-quill .ql-editor.ql-blank::before {
          font-size: 12px !important;
          font-style: normal !important;
          color: #9ca3af !important;
        }
      `}</style>

      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-1 border-b bg-blue-50/50 px-2 py-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <button onClick={() => navigate('/dashboard/support')} className="text-blue-600 hover:text-blue-800 p-0.5 -m-0.5">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-x-1">
              <div className="font-semibold text-gray-800 text-[10px]">#{ticket.ticket_number}</div>
              <StatusBadge status={ticket.status} />
              {isConnected ? (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Live</span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Offline</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-1.5 gap-y-0 text-[10px]">
              <div><span className="text-gray-500">Title:</span><span className="font-medium ml-1">{ticket.subject}</span></div>
              <div><span className="text-gray-500">Client:</span><span className="ml-1">{ticket.client_name || 'N/A'}</span></div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button onClick={() => console.log('Edit Ticket')} className="p-1 rounded hover:bg-blue-100 text-blue-600"><FaEdit size={11} /></button>
              <button onClick={handleManageAttachments} className="p-1 rounded hover:bg-blue-100 text-blue-600"><Paperclip size={11} /></button>
            </div>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center text-[10px] border-b bg-white">
          <div className="flex items-center gap-1 border-r px-1.5 py-0.5"><span className="text-gray-500">Raised By:</span><span className="font-medium text-gray-800 truncate max-w-[80px]">{ticket.user?.full_name || 'Unknown'}</span></div>
          <div className="flex items-center gap-1 border-r px-1.5 py-0.5"><span className="text-gray-500">Priority:</span><PriorityBadge priority={ticket.priority} /></div>
          <div className="flex items-center gap-1 border-r px-1.5 py-0.5"><span className="text-gray-500">Product:</span><span className="text-gray-800 truncate max-w-[70px]">{ticket.product || 'Support'}</span></div>
          <div className="flex items-center gap-1 border-r px-1.5 py-0.5"><span className="text-gray-500">Module:</span><span className="text-gray-800 truncate max-w-[70px]">{ticket.category || 'General'}</span></div>
          <div className="flex items-center gap-1 border-r px-1.5 py-0.5"><span className="text-gray-500">Created:</span><span className="text-gray-800">{formatDateTime(ticket.created_at)}</span></div>
          <div className="flex items-center gap-1 border-r px-1.5 py-0.5"><span className="text-gray-500">Updated:</span><span className="text-gray-800">{formatDateTime(ticket.updated_at)}</span></div>
          <div className="flex items-center gap-1 px-1.5 py-0.5"><span className="text-gray-500">Resolved:</span><span className="text-gray-800">{formatDateTime(ticket.resolved_at)}</span></div>
        </div>

        {/* Messages */}
        <div className="px-1.5 py-1">
          <h2 className="text-xs font-semibold text-gray-800 mb-1.5">Messages</h2>
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <div key={msg.id || msg.ticket_reply_id || idx} className="flex border rounded overflow-hidden">
                <div className={`w-36 p-2 ${msg.type === 'description' ? 'bg-blue-500 text-white' : 'bg-gray-100 border-r'}`}>
                  <UserHoverPopup user={msg.user}>
                    <p className="font-semibold text-[10px] cursor-help">
                      {msg.user?.full_name || (msg.type === 'description' ? 'Client' : 'Support')}
                    </p>
                  </UserHoverPopup>
                  <p className="text-[9px] mt-0.5">{formatDateTime(msg.created_at)}</p>
                </div>
                <div className="flex-1 bg-white p-2">
                  <div className="prose max-w-none text-gray-800 text-xs" dangerouslySetInnerHTML={{ __html: msg.message || '' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Update Button */}
        {!showAddUpdate && (
          <div className="mt-2 flex justify-start px-1.5 pb-1.5">
            <button onClick={() => setShowAddUpdate(true)} className="bg-green-600 hover:bg-green-700 text-white text-[10px] px-2.5 py-1 rounded">Add Update</button>
          </div>
        )}

        {/* Add Update Form */}
        {showAddUpdate && (
          <div className="mt-2 bg-white overflow-hidden">
            <div className="bg-gray-100 border-b px-2 py-1 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-700">Add Update</h2>
              <div className="flex items-center gap-1.5">
                <button onClick={toggleSourceMode} className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-gray-200 hover:bg-gray-300 rounded">
                  {isSourceMode ? '📄 Rich Text' : '🔧 Source'}
                </button>
                <button onClick={() => { setShowAddUpdate(false); handleReset(); }} className="bg-green-600 hover:bg-green-700 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-1.5 mb-1.5">
                <div><label className="block text-[10px] text-gray-600 mb-0.5">Status</label><select name="status" value={updateForm.status} onChange={handleUpdateChange} className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]"><option value="">--SELECT--</option><option value="open">Open</option><option value="in-progress">In Progress</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div>
                <div><label className="block text-[10px] text-gray-600 mb-0.5">Priority</label><select name="priority" value={updateForm.priority} onChange={handleUpdateChange} className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                <div><label className="block text-[10px] text-gray-600 mb-0.5">Time Spent</label><input type="text" name="time_spent" value={updateForm.time_spent} onChange={handleUpdateChange} placeholder="HH:MM" className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]" /></div>
                <div><label className="block text-[10px] text-gray-600 mb-0.5">Due Date</label><input type="date" name="due_date" value={updateForm.due_date} onChange={handleUpdateChange} className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]" /></div>
                <div><label className="block text-[10px] text-gray-600 mb-0.5">Temp</label><select name="temp" value={updateForm.temp} onChange={handleUpdateChange} className="w-full border border-gray-300 rounded px-1 py-0.5 text-[10px]"><option value="">--Select--</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                <div><label className="block text-[10px] text-gray-600 mb-0.5">Attachment</label><input type="file" name="attachment" ref={fileInputRef} onChange={handleUpdateChange} className="w-full text-[10px] border border-gray-300 rounded file:mr-1 file:px-1 file:py-0.5 file:text-[10px] file:border-0 file:bg-gray-100" /></div>
              </div>
              <div className="mb-2">
                <label className="block text-[10px] text-gray-600 mb-1">Note</label>
                {!isSourceMode ? (
                  <Suspense fallback={<div className="text-[10px] text-gray-500">Loading editor…</div>}>
                    <div className="compact-quill">
                      <ReactQuill
                        ref={handleQuillMount}
                        theme="snow"
                        value={updateForm.note}
                        onChange={val => setUpdateForm(prev => ({ ...prev, note: val }))}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Enter update note..."
                      />
                    </div>
                  </Suspense>
                ) : (
                  <div>
                    <div className="flex gap-1 mb-1.5">
                      <button onClick={handlePrettify} className="bg-gray-200 hover:bg-gray-300 text-[10px] px-1.5 py-0.5 rounded">Prettify</button>
                      <button onClick={handleWrapInTable} className="bg-gray-200 hover:bg-gray-300 text-[10px] px-1.5 py-0.5 rounded">Wrap in Table</button>
                      <button onClick={handleClearFormatting} className="bg-gray-200 hover:bg-gray-300 text-[10px] px-1.5 py-0.5 rounded">Clear Formatting</button>
                    </div>
                    <textarea id="source-textarea" value={sourceContent} onChange={handleSourceChange} className="w-full h-48 p-2 border border-gray-300 rounded text-xs font-mono" placeholder="HTML source..." />
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-1.5">
                <button onClick={handleSubmitUpdate} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[10px] px-3 py-1 rounded">
                  {submitting ? 'Sending...' : 'Send'}
                </button>
                <button onClick={handleReset} className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] px-3 py-1 rounded">Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
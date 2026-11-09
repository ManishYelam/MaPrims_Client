import api from './axiosInstance'

export const organizationAPI = {
  getAll: () => api.get('/organizations'),
  getById: (id) => api.get(`/organization/${id}`),
  createOrUpdate: (data) => api.post('/organization', data),
};

export const domainAPI = {
  // Public availability search — calls your backend, never ResellerClub directly
  search: (sld, tlds, params = {}) =>
    api.get('/domains/search', {
      params: {
        domain: sld,
        tlds: Array.isArray(tlds) ? tlds.join(',') : tlds,
        ...params, // currency, etc.
      },
    }),
}

export const dbConnectionAPI = {
  create: (data) => api.post('/db', data),
  getAll: (params) => api.get('/db', { params }),
  getById: (id) => api.get(`/db/${id}`),
  update: (id, data) => api.put(`/db/${id}`, data),
  delete: (id) => api.delete(`/db/${id}`),
  toggleStatus: (id, is_active) => api.patch(`/db/${id}/status`, { is_active }),
  getStats: () => api.get('/db/stats/overall'),
  getByOrgId: async (org_id) => {
    const res = await api.get('/db', { params: { org_id, limit: 1 } });
    const data = res.data?.data?.data || [];
    return { data: { data: data[0] || null } };
  },
};

export const policyAPI = {
  create: (data) => api.post('/company-policy', data),
  getAll: (params) => api.get('/company-policy', { params }),
  getById: (id) => api.get(`/company-policy/${id}`),
  update: (id, data) => api.put(`/company-policy/${id}`, data),
  delete: (id) => api.delete(`/company-policy/${id}`),
  toggleStatus: (id, is_active) => api.patch(`/company-policy/${id}/status`, { is_active }),
  getStats: () => api.get('/company-policy/stats/overall'),
  getByOrgId: async (org_id) => {
    const res = await api.get('/company-policy', { params: { org_id, limit: 1 } });
    const data = res.data?.data?.data || [];
    return { data: { data: data[0] || null } };
  },
};

export const authAPI = {
  login: credentials => api.post('/login', credentials),
  logout: () => api.post('/logout'),
  register: userData => api.post('/users', userData),
  getProfile: id => api.get(`/users/${id}`),
  updateProfile: (userId, profileData) => api.put(`/users/${userId}`, profileData),
  changePassword: passwordData => api.post('/change-password', passwordData),
  forgetPassword: email => api.post(`/forget-password/${email}`),
  otpChangePasswordService: (email, data) => api.post(`/change-password-otp/${email}`, data),
}

export const branchAPI = {
  getBranches: (params) => api.get('/branches', { params }),
  getBranchById: (id, includeOrg = false) => api.get(`/branches/${id}?includeOrg=${includeOrg}`),
  addBranch: (data) => api.post('/branches', data),
  updateBranch: (id, data) => api.put(`/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/branches/${id}`),
  updateBranchStatus: (id, status) => api.patch(`/branches/${id}/status`, { status }),
  getOverallStats: () => api.get('/branches/stats/overall'),
  getBranchesPerOrganization: () => api.get('/branches/stats/by-org'),
};

export const mappingAPI = {
  getMappings: data => api.post('/system-mappings-get', data),
  getMappingById: id => api.get(`/system-mappings/${id}`),
  createMapping: data => api.post('/system-mappings', data),
  updateMapping: (id, data) => api.put(`/system-mappings/${id}`, data),
  deleteMapping: id => api.delete(`/system-mappings/${id}`),
}

export const aiAPI = {
  callOpenAi: data => api.post('/ai/openai-chat', data),
  callGemini: data => api.post('/ai/gemini-chat', data),
}

// ===============================
// ROLE & PERMISSION APIs
// ===============================

export const rolePermissionAPI = {
  // ===== Roles =====
  getAllRoles: () => api.get('/roles'),
  getRoleById: id => api.get(`/roles/${id}`),
  createRole: data => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  deleteRole: id => api.delete(`/roles/${id}`),

  // ===== Permissions =====
  // Inside rolePermissionAPI object
  getPermissionList: (search) => api.get('/permissions/search', { params: { search } }),
  getRolePermissions: role_id => api.post(`/roles/${role_id}/permissions`),
  getAllPermissions: () => api.get('/permissions'),
  getPermissionById: id => api.get(`/permissions/${id}`),
  createPermission: data => api.post('/permissions', data),
  updatePermission: (id, data) => api.put(`/permissions/${id}`, data),
  deletePermission: id => api.delete(`/permissions/${id}`),
  getA1Priorities: () => api.get(`/permissions/a1-priorities`),
  updatePriorityA1: data => api.put(`/update-priority-a1`, data),

  // ===== User Role Permissions =====
  getUserRolePermissions: userId => api.get(`/users/${userId}/role-permissions`),
  assignUserRolePermissions: (user_id, data) => api.post(`/users/${user_id}/permissions`, data),
  updateUserRolePermissions: (userId, data) => api.put(`/users/${userId}/role-permissions`, data),
  deleteUserRolePermissions: userId => api.delete(`/users/${userId}/role-permissions`),
  // ===== Effective Permissions =====
  getEffectivePermissionIds: user_id => api.get(`/users/${user_id}/effective-permission_ids`),
  getEffectivePermissions: userId => api.get(`/users/${userId}/effective-permissions`),
  assignPermissionsToRole: (role_id, permission_ids) =>
    api.put(`/${role_id}/permissions`, permission_ids),
}

export const userAPI = {
  getAllUsers: data => api.post(`/users/v2`, data),
  updateUser: (userId, profileData) => api.put(`/users/${userId}`, profileData),
  deleteUser: userId => api.delete(`/users/${userId}`),
  getUsersDropdown: (params = {}) =>
    api.get('/users/dropdown', {
      params: {
        // role: 'admin',
        limit: 100,
        sortBy: 'full_name',
        sortOrder: 'ASC',
        ...params,
      },
    }),
  // Optional: Add a method specifically for modal with pagination
  getDropdownList: (params = {}) =>
    api.get('/users/dropdown', {
      params: {
        role: 'admin',
        limit: 10,
        sortBy: 'full_name',
        sortOrder: 'ASC',
        ...params,
      },
    }),
}

export const coursesAPI = {
  getAll: data => api.post('/courses', data),
  getFeatured: () => api.get('/courses/featured'),
  getBySlug: slug => api.get(`/courses/slug/${slug}`),
  getById: id => api.get(`/courses/${id}`),
  getCourseMetaDataById: id => api.get(`/courses/metadata/${id}`),
  getDropdownList: (params = {}) =>
    api.get('/courses/dropdown', {
      params: { status: 'published', limit: 100, sortBy: 'title', sortOrder: 'ASC', ...params },
    }),
  create: courseData =>
    api.post('/courses/create', courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': 'single',
        'upload-category': 'documents',
        'upload-storage': 'COURSE_SYLLABUS_Drive',
      },
    }),
  update: (id, courseData) =>
    api.put(`/courses/${id}`, courseData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': 'single',
        'upload-category': 'documents',
        'upload-storage': 'COURSE_SYLLABUS_Drive',
      },
    }),
  delete: id => api.delete(`/courses/${id}`),

  getEnrolled: async data => api.post(`/courses/enrolled`, data),
  completeEnrollment: async data => api.post(`/courses/complete-enrolled`, data),
  getWishlist: async id => api.get(`/courses/enrolled/${id}`),
}

export const servicesAPI = {
  // Public endpoints
  getAll: data => api.post('/services', data),
  getPurchased: data => api.post('/services/purchased', data),
  getFeatured: () => api.get('/services/featured'),
  getBySlug: slug => api.get(`/services/slug/${slug}`),
  getById: id => api.get(`/services/${id}`),

  // Admin endpoints
  adminGetAll: data => api.post('/services/admin/all', data),

  // Create service (with gallery images)
  create: serviceData =>
    api.post('/services/create', serviceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': '',
        'upload-category': 'images',
        'upload-storage': 'SERVICE_FILES_Services',
      },
    }),

  // Update service (with optional new gallery images)
  update: (id, serviceData) =>
    api.put(`/services/${id}`, serviceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': 'multiple',
        'upload-category': 'images',
        'upload-storage': 'SERVICE_FILES_Services',
      },
    }),

  delete: id => api.delete(`/services/${id}`),

  // Dropdown / lookup (optional)
  getDropdownList: (params = {}) =>
    api.get('/services/dropdown', {
      params: { status: 'published', limit: 100, sortBy: 'title', sortOrder: 'ASC', ...params },
    }),
}

export const paymentsAPI = {
  createRazorpayOrder: orderData => api.post('/payments/create-order', orderData),
  verifyPayment: paymentData => api.post('/payments/verify-payment', paymentData),
  getHistory: (params = {}) => api.get('/payments/history', { params }),
  getPayments: data => api.post('/payments/user-payments', data),
  checkEnrollment: courseId => api.get(`/payments/check-enrollment/${courseId}`),
  getUserEnrollments: () => api.get('/payments/user-enrollments'),
  getPaymentDetails: paymentId => api.get(`/payments/payment-details/${paymentId}`),
  getPaymentMethods: () => api.get('/payments/payment-methods'),
  refundPayment: (paymentId, refundData) => api.post(`/payments/${paymentId}/refund`, refundData),
  updatePaymentMetadata: data => api.post(`/payments/update-metadata`, data),
}

export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getMyCourses: (params = {}) => api.get('/student/courses', { params }),
  getCourseProgress: courseId => api.get(`/student/courses/${courseId}/progress`),
  updateProgress: (courseId, data) => api.put(`/student/courses/${courseId}/progress`, data),
  getCertificates: () => api.get('/student/certificates'),
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: (params = {}) => api.get('/admin/students', { params }),
  getStudentDetail: id => api.get(`/admin/students/${id}`),
  updateStudentStatus: (id, data) => api.put(`/admin/students/${id}/status`, data),
  getFinancialReports: (params = {}) => api.get('/admin/reports/financial', { params }),
}

export const contactAPI = {
  submitContact: data => api.post('/contact/', data),
  getContacts: (params = {}) => api.get('/contact/', { params }),
  getContactById: id => api.get(`/contact/${id}`),
  deleteContact: id => api.delete(`/contact/${id}`),
  updateStatus: (id, data) => api.put(`/contact/${id}/status`, data),
  updateRemarks: (id, data) => api.put(`/contact/${id}/remarks`, data),
  getStats: () => api.get('/contact/stats'),
  searchContacts: (query, params = {}) =>
    api.get('/contact/search', { params: { q: query, ...params } }),
  getContactsByStatus: (status, params = {}) => api.get(`/contact/status/${status}`, { params }),
}

export const applicationAPI = {
  createOrUpdateProperty: data => api.post('/application/property', data),
  createOrUpdateBulkProperties: data => api.post('/application/properties/bulk', data),
  getAllProperties: data => api.post(`/application/properties`, data),
  getPropertyById: id => api.get(`/application/property/${id}`),
  deleteProperty: app_prop_id => api.delete(`/application/property/${app_prop_id}`),
  activeAppProperty: (property_name, app_prop_id) =>
    api.put(`/application/property/${property_name}/${app_prop_id}`),
  getGoogleMeetProperty: data => api.post(`/application/property/google-meet`, data),
}

export const genericAPI = {
  createOrUpdateLOV: data => api.post('/generics/lov', data),
  getAllLOVs: data => api.post('/generics/lov/all', data),
  getLOVById: id => api.get(`/generics/lov/${id}`),
  deleteLOV: id => api.delete(`/generics/lov/${id}`),
  dowloadBackup: () => api.post(`/generics/backup`),
  getImportConfig: (moduleName) => api.get(`/generics/import-config/${moduleName}`),
  createOrUpdateImportConfig: (data) => api.post('/generics/import-config', data),
}

export const feedbackAPI = {
  submitFeedback: feedbackData => api.post(`/feedback/submit`, feedbackData),
  getUserFeedback: (page = 1, limit = 10) =>
    api.get(`/feedback/my-feedback?page=${page}&limit=${limit}`),
  getAllFeedback: data => api.post(`/feedback/`, data),
  getFeedbackStats: () => api.get(`/feedback/stats`),
  updateFeedbackStatus: (id, status, adminNotes = '') =>
    api.patch(`/feedback/${id}/status`, { status, adminNotes }),
  deleteFeedback: id => api.delete(`/feedback/${id}`),
}

export const analyticsAPI = {
  getDashboardOverview: () => api.get('/analytics/dashboard-overview'),
  getRevenueAnalytics: (params = {}) => api.get('/analytics/revenue', { params }),
  getUserAnalytics: () => api.get('/analytics/users'),
  getCourseAnalytics: () => api.get('/analytics/courses'),
  getSupportAnalytics: () => api.get('/analytics/support'),
  getBlogAnalytics: () => api.get('/analytics/blogs'),
  getCustomAnalytics: (params = {}) => api.get('/analytics/custom', { params }),
  getEnrollmentAnalytics: (params = {}) => api.get('/analytics/enrollments', { params }),
  getDemoRequestAnalytics: (params = {}) => api.get('/analytics/demo-requests', { params }),
  getTestimonialAnalytics: () => api.get('/analytics/testimonials'),
  getServiceOverview: () => api.get('/analytics/service-overview'),
  getServiceRevenueAnalytics: () => api.get('/analytics/service-revenue'),
  getServiceOrderAnalytics: () => api.get('/analytics/service-orders'),
  getServicePerformance: () => api.get('/analytics/service-performance'),
}

export const supportAPI = {
  // 🎟️ Ticket methods
  createTicket: ticketData => api.post(`/support/tickets`, ticketData),
  getTickets: data => api.post(`/support/all-tickets`, data),
  getUserTickets: (params = {}) => api.get(`/support/tickets/user`, { params }),
  getTicket: ticketId => api.get(`/support/tickets/${ticketId}`),
  updateTicket: (ticketId, updateData) => api.put(`/support/tickets/${ticketId}`, updateData),
  deleteTicket: ticketId => api.delete(`/support/tickets/${ticketId}`),
  UpdateTicketAttachments: (support_ticket_id, files) =>
    api.post(`/support/ticket-attachments/${support_ticket_id}`, files, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': '',
        'upload-category': 'documents,images',
        'upload-storage': 'USER_DOCUMENTS_Ticket',
      },
    }),
  DeleteTicketAttachments: support_ticket_id =>
    api.delete(`/support/ticket-attachments/${support_ticket_id}`),
  // 💬 Message methods
  addMessage: (ticketId, messageData) =>
    api.post(`/support/tickets/${ticketId}/messages`, messageData),
  getTicketMessages: ticketId => api.get(`/support/tickets/${ticketId}/messages`),
  // ❓ FAQ methods
  getFAQs: (params = {}) => api.get(`/support/faqs`, { params }),
  createFAQ: faqData => api.post(`/support/faqs`, faqData),
  updateFAQ: (faqId, updateData) => api.put(`/support/faqs/${faqId}`, updateData),
  deleteFAQ: faqId => api.delete(`/support/faqs/${faqId}`),
  // 📊 Stats
  getStats: () => api.get(`/support/tickets/stats`),
  // 👤 User support history
  getUserSupportHistory: userId => api.get(`/support/users/${userId}/support-history`),
  // 🧾 Case tickets
  getCaseTickets: caseId => api.get(`/support/cases/${caseId}/tickets`),
}

export const demoRequestAPI = {
  create: async data => api.post('/demo-requests', data),
  getAll: data => api.post('/demo-requests/requests', data),
  getById: id => api.get(`/demo-requests/${id}`),
  update: (id, data) => api.put(`/demo-requests/${id}`, data),
  updateStatus: (id, status) => api.patch(`/demo-requests/${id}/status`, { status }),
  delete: id => api.delete(`/demo-requests/${id}`),
  getStats: () => api.get('/demo-requests/stats/summary'),
  getByCourse: (courseId, params = {}) =>
    api.get('/demo-requests', { params: { ...params, course_id: courseId } }),
}

export const assignmentAPI = {
  // ========== PUBLIC ROUTES ==========
  publicSearch: (params = {}) => api.get('/assignments/public/search', { params }),
  publicGetByTechnology: (technology, params = {}) =>
    api.get(`/assignments/public/technology/${technology}`, { params }),
  publicGetById: (id, params = {}) => api.get(`/assignments/public/${id}`, { params }),
  publicGetCourseAssignments: (courseId, params = {}) =>
    api.get(`/assignments/public/course/${courseId}`, { params }),

  // ========== AUTHENTICATED ROUTES ==========
  // Course-specific
  getCourseAssignments: course_id => api.get(`/assignments/course/${course_id}`),
  getCourseStats: courseId => api.get(`/assignments/course/${courseId}/stats`),
  reorderAssignments: (courseId, assignmentOrder) =>
    api.post(`/assignments/course/${courseId}/reorder`, { assignments: assignmentOrder }),

  // CRUD Operations
  create: data => api.post('/assignments', data),
  getById: id => api.get(`/assignments/${id}`),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: id => api.delete(`/assignments/${id}`),

  // Search & Filter
  search: (params = {}) => api.get('/assignments/search', { params }),
  getByTechnology: (technology, params = {}) =>
    api.get(`/assignments/technology/${technology}`, { params }),
  getAvailableFilters: (params = {}) => api.get('/assignments/available-filters', { params }),
  getRecommendations: (params = {}) => api.get('/assignments/recommendations', { params }),

  // Stats & Analytics
  getStats: (params = {}) => api.get('/assignments/stats', { params }),
  getDashboardData: (params = {}) => api.get('/assignments/dashboard', { params }),
  getAssignmentAnalytics: (assignmentId, params = {}) =>
    api.get(`/assignments/${assignmentId}/analytics`, { params }),

  // Status Management
  toggleStatus: id => api.patch(`/assignments/${id}/toggle-status`),

  // Bulk Operations
  bulkCreate: assignments => api.post('/assignments/bulk', assignments),
  batchUpdate: (assignments, updates) =>
    api.post('/assignments/batch-update', { assignments, updates }),

  // Import/Export
  import: formData =>
    api.post('/assignments/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  export: (params = {}) => api.get('/assignments/export', { params, responseType: 'blob' }),

  // Validation & Preview
  validate: data => api.post('/assignments/validate', data),
  preview: data => api.post('/assignments/preview', data),

  // Templates & Cloning
  getTemplates: (params = {}) => api.get('/assignments/templates', { params }),
  clone: (id, modifications = {}) => api.post(`/assignments/${id}/clone`, modifications),

  // Health Check
  health: () => api.get('/assignments/health'),

  // ========== UTILITY METHODS ==========
  // File Upload Helper
  uploadFile: file => {
    const formData = new FormData()
    formData.append('file', file)
    return assignmentAPI.import(formData)
  },

  // Export with Format
  exportAsFormat: (format = 'json', params = {}) => assignmentAPI.export({ format, ...params }),

  // Quick Status Toggle
  quickToggle: (id, active) =>
    active ? assignmentAPI.update(id, { is_active: active }) : assignmentAPI.toggleStatus(id),

  // Bulk Delete
  bulkDelete: ids => Promise.all(ids.map(id => assignmentAPI.delete(id))),

  // Validate with Preview
  validateAndPreview: data =>
    Promise.all([assignmentAPI.validate(data), assignmentAPI.preview(data)]).then(
      ([validation, preview]) => ({ validation, preview })
    ),

  // Fetch with Related Data
  getWithRelated: (id, includeCourse = true, includeSubmissions = false) =>
    assignmentAPI.getById(id, {
      include_course: includeCourse,
      include_submissions: includeSubmissions,
    }),
}

export const tutorialNoteAPI = {
  // ========== PUBLIC ROUTES ==========
  publicSearch: (params = {}) => api.get('/tutorial-notes/search', { params }),
  publicGetByCourseId: (courseId, params = {}) =>
    api.get(`/tutorial-notes/public/course/${courseId}`, { params }),

  // ========== AUTHENTICATED ROUTES ==========
  // Course-specific operations
  getByCourseId: courseId => api.get(`/tutorial-notes/course/${courseId}`),
  getOrCreateForCourse: courseId => api.get(`/tutorial-notes/course/${courseId}/get-or-create`),

  // CRUD Operations
  create: data => api.post('/tutorial-notes', data),
  upsert: data => api.post('/tutorial-notes/upsert', data),
  getById: id => api.get(`/tutorial-notes/${id}`),
  update: (id, data) => api.put(`/tutorial-notes/${id}`, data),
  delete: id => api.delete(`/tutorial-notes/${id}`),

  // Section Management
  addSection: (noteId, data) => api.post(`/tutorial-notes/${noteId}/sections`, data),
  getTableOfContents: noteId => api.get(`/tutorial-notes/${noteId}/toc`),

  // Interaction Operations
  incrementDownloadCount: noteId => api.post(`/tutorial-notes/${noteId}/download`),
  rate: (noteId, rating) => api.post(`/tutorial-notes/${noteId}/rate`, { rating }),

  // Bulk Operations
  bulkUpsert: notes => api.post('/tutorial-notes/bulk-upsert', { notes }),

  // Search & Filter
  search: (params = {}) => api.get('/tutorial-notes/search', { params }),
  getPopular: (limit = 10) => api.get(`/tutorial-notes/popular?limit=${limit}`),
  getTopRated: (minRating = 4, params = {}) =>
    api.get(`/tutorial-notes/top-rated?minRating=${minRating}`, { params }),

  // Export/Import
  exportAsJSON: noteId => api.get(`/tutorial-notes/${noteId}/export/json`),
  exportAsMarkdown: noteId => api.get(`/tutorial-notes/${noteId}/export/markdown`),
  import: (courseId, data) => api.post(`/tutorial-notes/import/course/${courseId}`, data),

  // Validation & Preview
  validate: data => api.post('/tutorial-notes/validate', data),
  preview: data => api.post('/tutorial-notes/preview', data),

  // ========== UTILITY METHODS ==========
  // Quick create with course
  createForCourse: (courseId, title = null) =>
    api.post('/tutorial-notes', {
      course_id: courseId,
      title: title || `Tutorial Notes for Course ${courseId}`,
      content: {},
      metadata: {},
    }),

  // Quick update by course
  updateByCourseId: (courseId, data) => api.put(`/tutorial-notes/course/${courseId}`, data),

  // Check existence
  existsForCourse: courseId => api.get(`/tutorial-notes/course/${courseId}/exists`),

  // Clone from existing
  clone: (sourceNoteId, targetCourseId) =>
    api.post(`/tutorial-notes/${sourceNoteId}/clone`, { target_course_id: targetCourseId }),

  // Format validation
  validateFormat: content => api.post('/tutorial-notes/validate-format', { content }),

  // Health check
  health: () => api.get('/tutorial-notes/health'),

  // Quick save (auto-detect create/update)
  quickSave: async data => {
    try {
      // Try to find existing note
      const existing = await api.get(`/tutorial-notes/course/${data.course_id}`)
      if (existing.data.data) {
        return await tutorialNoteAPI.update(existing.data.data.note_id, data)
      } else {
        return await tutorialNoteAPI.create(data)
      }
    } catch (error) {
      // If not found, create new
      if (error.response?.status === 404) {
        return await tutorialNoteAPI.create(data)
      }
      throw error
    }
  },
}

export const communicationAPI = {
  getUserRooms: user_id => api.post(`/socket/broadcast/${user_id}`),
}

export const proposalAPI = {
  submitProposalRequest: proposalData =>
    api.post(`/proposals/`, proposalData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': 'single',
        'upload-category': 'documents',
        'upload-storage': 'PROPOSALS_Proposals',
      },
    }),

  //Admin
  getProposals: data => api.post(`/proposals/get-all`, data),
  getProposalById: id => api.get(`/proposals/${id}`),
  updateProposal: (id, data) => api.put(`/proposals/${id}`, data),
  deleteProposal: id => api.delete(`/proposals/${id}`),
}

export const whatsappAPI = {
  createAccount: (data) => api.post(`/whatsapp/accounts`, data),
  startSession: (session_name) => api.post(`/whatsapp/accounts/${session_name}/start`),
  getQR: (session_name) => api.get(`/whatsapp/accounts/${session_name}/qr`),
  getStatus: (session_name) => api.get(`/whatsapp/accounts/${session_name}/status`),
  logout: (session_name) => api.post(`/whatsapp/accounts/${session_name}/logout`),
  deleteAccount: (session_name) => api.delete(`/whatsapp/accounts/${session_name}`),
  listAccounts: (userId) => api.get(`/whatsapp/users/${userId}/accounts`),
};

export const blogAPI = {
  getAll: (payload = {}) => api.post('/blogs/list', payload),
  search: (payload = {}) => api.post('/blogs/search', payload),
  getByIdentifier: (identifier, incrementView = false) =>
    api.get(`/blogs/${identifier}`, { params: { incrementView } }),
  create: (data) => api.post('/blogs', data),
  update: (id, data) => api.put(`/blogs/${id}`, data),
  delete: (id) => api.delete(`/blogs/${id}`),
  like: (id) => api.post(`/blogs/${id}/like`),
  getBySlug: (slug, incrementView = false) => blogAPI.getByIdentifier(slug, incrementView),
  getById: (id, incrementView = false) => blogAPI.getByIdentifier(id, incrementView),
};

export const testimonialAPI = {
  // Public endpoints
  getAll: (payload = {}) => api.post('/testimonials/list', payload),
  getFeatured: (limit = 12, type) => api.get('/testimonials/featured', { params: { limit, type } }),
  getByType: (type, limit = 10) => api.get(`/testimonials/type/${type}`, { params: { limit } }),
  getByIdentifier: (identifier, incrementView = false) =>
    api.get(`/testimonials/${identifier}`, { params: { incrementView } }),
  // Authenticated endpoints
  create: (data) => api.post('/testimonials', data),
  update: (id, data) => api.put(`/testimonials/${id}`, data),
  delete: (id) => api.delete(`/testimonials/${id}`),
  like: (id) => api.post(`/testimonials/${id}/like`),
  // Convenience methods
  getBySlug: (slug, incrementView = false) => testimonialAPI.getByIdentifier(slug, incrementView),
  getById: (id, incrementView = false) => testimonialAPI.getByIdentifier(id, incrementView),
};

export const hrAPI = {
  // ========== Dashboard ==========
  getDashboardAll: () => api.get('/hr/dashboard/all'),

  // ========== Employees ==========
  getEmployees: (data) => api.post('/hr/employees-all', data),
  getEmployee: (id) => api.get(`/hr/employees/${id}`),
  createEmployee: (data) =>
    api.post('/hr/employees', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': 'multiple',
        'upload-category': 'images',
        'upload-storage': 'HRMS_Document',
      },
    }),
  bulkImportEmployees: (data) => api.post('/hr/employees/bulk-import', data),
  updateEmployee: (id, data) =>
    api.put(`/hr/employees/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'no',
        'upload-type': 'multiple',
        'upload-category': 'images',
        'upload-storage': 'HRMS_Document',
      },
    }),
  deleteEmployee: (id) => api.delete(`/hr/employees/${id}`),
  getDropdownEmployees: (params) => api.get('/hr/employees/dropdown', { params }),
  registerFace: (empId, capturedImage) =>
    api.post(`/hr/employees/${empId}/face-embedding`, { captured_image: capturedImage }),
  getFaceEmbedding: (empId) =>
    api.get(`/hr/employees/${empId}/face-embedding`),
  verifyFace: (empId, capturedImage) =>
    api.post(`/hr/employees/${empId}/verify-face`, { captured_image: capturedImage }),

  // ========== Departments ==========
  getDepartments: (data) => api.post('/hr/departments', data),
  getDepartmentoptions: () => api.get('/hr/departments/options'),
  getDepartment: (id) => api.get(`/hr/departments/${id}`),
  createDepartment: (data) => api.post('/hr/department', data),
  bulkImportDepartments: (data) => api.post('/hr/departments/bulk-import', data),
  updateDepartment: (id, data) => api.put(`/hr/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/hr/departments/${id}`),

  // ========== Positions ==========
  getPositions: () => api.get('/hr/positions-all'),
  getPosition: (id) => api.get(`/hr/positions/${id}`),
  createPosition: (data) => api.post('/hr/positions', data),
  updatePosition: (id, data) => api.put(`/hr/positions/${id}`, data),
  deletePosition: (id) => api.delete(`/hr/positions/${id}`),
  getPositionDropdown: (params) => api.get('/hr/positions/dropdown', { params }),

  getShiftsAll: (data) => api.post('/hr/shift/all', data),
  getShift: (id) => api.get(`/hr/shift/${id}`),
  createShift: (data) => api.post('/hr/shift/', data),
  updateShift: (id, data) => api.put(`/hr/shift/${id}`, data),
  deleteShift: (id) => api.delete(`/hr/shift/${id}`),
  getShiftDropdown: (params = {}) =>
    api.get('/hr/shift/dropdown', {
      params: {
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
        ...params,
      },
    }),

  getShiftAssignmentsAll: (data) => api.post('/hr/shift-assignments/all', data),
  getShiftAssignment: (id) => api.get(`/hr/shift-assignments/${id}`),
  createShiftAssignment: (data) => api.post('/hr/shift-assignments', data),
  updateShiftAssignment: (id, data) => api.put(`/hr/shift-assignments/${id}`, data),
  deleteShiftAssignment: (id) => api.delete(`/hr/shift-assignments/${id}`),
  getShiftAssignmentDropdown: (params) => api.get('/hr/shift-assignments/dropdown', { params }),

  // ========== Attendance ==========
  clockIn: (data) => api.post('/hr/attendance/clock-in', data),
  clockOut: (data) => api.post('/hr/attendance/clock-out', data),
  getAttendance: (data) => api.post('/hr/attendance', data),
  getAttendanceByEmployeePeriod: (empId, startDate, endDate) =>
    api.get('/hr/attendance/employee-period-summary', { params: { emp_id: empId, start_date: startDate, end_date: endDate }, }),

  // ========== Leave Types, Rules, Workflows (new) ==========
  getLeaveTypes: () => api.get('/hr/leave-types'),
  getLeaveType: (id) => api.get(`/hr/leave-types/${id}`),
  createLeaveType: (data) => api.post('/hr/leave-types', data),
  updateLeaveType: (id, data) => api.put(`/hr/leave-types/${id}`, data),
  deleteLeaveType: (id) => api.delete(`/hr/leave-types/${id}`),

  getLeaveRulesAll: (data) => api.post('/hr/leave-rules/all', data),
  getLeaveRulesDropdown: (params) => api.get('/hr/leave-rules/dropdown', { params }),
  getLeaveRules: (leaveTypeId) => api.get(`/hr/leave-types/${leaveTypeId}/rules`),
  createLeaveRule: (data) => api.post('/hr/leave-rules', data),
  updateLeaveRule: (id, data) => api.put(`/hr/leave-rules/${id}`, data),
  deleteLeaveRule: (id) => api.delete(`/hr/leave-rules/${id}`),

  // ========== Leave Balances ==========
  getLeaveBalancesAll: (data) => api.post('/hr/leave-balances/all', data),
  getLeaveBalance: (id) => api.get(`/hr/leave-balances/${id}`),
  createLeaveBalance: (data) => api.post('/hr/leave-balances', data),
  updateLeaveBalance: (id, data) => api.put(`/hr/leave-balances/${id}`, data),
  deleteLeaveBalance: (id) => api.delete(`/hr/leave-balances/${id}`),

  getLeaveWorkflows: (leaveTypeId) => api.get(`/hr/leave-types/${leaveTypeId}/workflows`),
  createLeaveWorkflow: (data) => api.post('/hr/leave-workflows', data),
  updateLeaveWorkflow: (id, data) => api.put(`/hr/leave-workflows/${id}`, data),
  deleteLeaveWorkflow: (id) => api.delete(`/hr/leave-workflows/${id}`),
  bulkUpdateLeaveWorkflows: (leaveTypeId, workflows) =>
    api.put(`/hr/leave-types/${leaveTypeId}/workflows/bulk`, { workflows }),

  // ========== Payroll ==========
  getPayrollRuns: () => api.get('/hr/payroll-runs'),
  createPayrollRun: (data) => api.post('/hr/payroll-runs', data),
  processPayrollRun: (id) => api.post(`/hr/payroll-runs/${id}/process`),

  getSalaryStructuresAll: (data) => api.post('/hr/salary-structures/all', data),
  getSalaryStructureById: (id) => api.get(`/hr/salary-structures/${id}`),
  createSalaryStructure: (data) => api.post('/hr/salary-structures', data),
  updateSalaryStructure: (id, data) => api.put(`/hr/salary-structures/${id}`, data),
  deleteSalaryStructure: (id) => api.delete(`/hr/salary-structures/${id}`),
  exportSalaryStructures: (data) => api.post('/hr/salary-structures/export', data),

  // ========== Allowances ==========
  getAllowancesAll: (data) => api.post('/hr/allowances/all', data),
  getAllowanceById: (id) => api.get(`/hr/allowances/${id}`),
  createAllowance: (data) => api.post('/hr/allowances', data),
  updateAllowance: (id, data) => api.put(`/hr/allowances/${id}`, data),
  deleteAllowance: (id) => api.delete(`/hr/allowances/${id}`),
  exportAllowances: (data) => api.post('/hr/allowances/export', data),

  // ========== Deductions ==========
  getDeductionsAll: (data) => api.post('/hr/deductions/all', data),
  getDeductionById: (id) => api.get(`/hr/deductions/${id}`),
  createDeduction: (data) => api.post('/hr/deductions', data),
  updateDeduction: (id, data) => api.put(`/hr/deductions/${id}`, data),
  deleteDeduction: (id) => api.delete(`/hr/deductions/${id}`),
  exportDeductions: (data) => api.post('/hr/deductions/export', data),

  // ========== Bonuses ==========
  getBonusesAll: (data) => api.post('/hr/bonuses/all', data),
  getBonusById: (id) => api.get(`/hr/bonuses/${id}`),
  createBonus: (data) => api.post('/hr/bonuses', data),
  updateBonus: (id, data) => api.put(`/hr/bonuses/${id}`, data),
  deleteBonus: (id) => api.delete(`/hr/bonuses/${id}`),
  exportBonuses: (data) => api.post('/hr/bonuses/export', data),

  // ========== Payroll Items ==========
  getPayrollItemsAll: (data) => api.post('/hr/payroll-items/all', data),
  getPayrollItemById: (id) => api.get(`/hr/payroll-items/${id}`),
  createPayrollItem: (data) => api.post('/hr/payroll-items', data),
  updatePayrollItem: (id, data) => api.put(`/hr/payroll-items/${id}`, data),
  deletePayrollItem: (id) => api.delete(`/hr/payroll-items/${id}`),
  exportPayrollItems: (data) => api.post('/hr/payroll-items/export', data),

  // ========== Payroll Runs ==========
  getPayrollRunsAll: (data) => api.post('/hr/payroll-runs/all', data),
  getPayrollRunById: (id) => api.get(`/hr/payroll-runs/${id}`),
  createPayrollRun: (data) => api.post('/hr/payroll-runs', data),
  updatePayrollRun: (id, data) => api.put(`/hr/payroll-runs/${id}`, data),
  deletePayrollRun: (id) => api.delete(`/hr/payroll-runs/${id}`),
  exportPayrollRuns: (data) => api.post('/hr/payroll-runs/export', data),

  // ========== Recruitment ==========
  // ========== Job Requisition ==========
  getJobRequisitionsDropdown: (params) => api.get('/hr/job-requisitions/dropdown', { params }),
  getJobRequisitionsAll: (data) => api.post('/hr/job-requisitions/list', data),
  createJobRequisition: (data) => api.post('/hr/job-requisitions', data),
  updateJobRequisition: (id, data) => api.put(`/hr/job-requisitions/${id}`, data),
  deleteJobRequisition: (id) => api.delete(`/hr/job-requisitions/${id}`),
  changeRequisitionStatus: (id, data) => api.patch(`/hr/job-requisitions/${id}/status`, data),

  // ========== Job Application ==========
  getJobApplicationsDropdown: (params) => api.get('/hr/job-applications/dropdown', { params }),
  getJobApplicationsAll: (data) => api.post('/hr/job-applications/list', data),
  createJobApplication: (data) => api.post('/hr/job-applications', data),
  updateJobApplication: (id, data) => api.put(`/hr/job-applications/${id}`, data),
  deleteJobApplication: (id) => api.delete(`/hr/job-applications/${id}`),
  changeApplicationStatus: (id, data) => api.patch(`/hr/job-applications/${id}/status`, data),

  // ========== Interview ==========
  getInterviewsAll: (data) => api.post('/hr/interviews/list', data),
  createInterview: (data) => api.post('/hr/interviews', data),
  updateInterview: (id, data) => api.put(`/hr/interviews/${id}`, data),
  deleteInterview: (id) => api.delete(`/hr/interviews/${id}`),
  changeInterviewStatus: (id, data) => api.patch(`/hr/interviews/${id}/status`, data),

  // ========== Offer Letter ==========
  getOfferLettersAll: (data) => api.post('/hr/offer-letters/list', data),
  createOfferLetter: (data) => api.post('/hr/offer-letters', data),
  updateOfferLetter: (id, data) => api.put(`/hr/offer-letters/${id}`, data),
  deleteOfferLetter: (id) => api.delete(`/hr/offer-letters/${id}`),
  changeOfferLetterStatus: (id, data) => api.patch(`/hr/offer-letters/${id}/status`, data),
  initiateOnboarding: (id) => api.post(`/hr/offer-letters/${id}/onboarding`),

  // ========== Resignation ==========
  getResignationsAll: (data) => api.post('/hr/resignations/list', data),
  createResignation: (data) => api.post('/hr/resignations', data),
  updateResignation: (id, data) => api.put(`/hr/resignations/${id}`, data),
  deleteResignation: (id) => api.delete(`/hr/resignations/${id}`),
  changeResignationStatus: (id, data) => api.patch(`/hr/resignations/${id}/status`, data),
  updateExitDetails: (id, data) => api.patch(`/hr/resignations/${id}/exit-details`, data),

  // ========== Performance ==========
  getReviewCycles: () => api.get('/hr/review-cycles'),
  createReviewCycle: (data) => api.post('/hr/review-cycles', data),
  getReviews: (params = {}) => api.get('/hr/reviews', { params }),
  createReview: (data) => api.post('/hr/reviews', data),
  updateReview: (id, data) => api.put(`/hr/reviews/${id}`, data),

  getAllWorklocations: (data) => api.post('/hr/worklocation-all', data),
  getByIdWorklocation: (id) => api.get(`/hr/worklocation/${id}`),
  createWorklocation: (data) => api.post('/hr/worklocation', data),
  updateWorklocation: (id, data) => api.put(`/hr/worklocation/${id}`, data),
  deleteWorklocation: (id) => api.delete(`/hr/worklocation/${id}`),
  getEmployeesWorklocation: (id) => api.get(`/hr/worklocation/${id}/employees`),

  getHolidays: (data) => api.post('/hr/holidays/list', data),
  createHoliday: (data) => api.post('/hr/holidays', data),
  updateHoliday: (id, data) => api.put(`/hr/holidays/${id}`, data),
  deleteHoliday: (id) => api.delete(`/hr/holidays/${id}`),
  toggleHolidayStatus: (id, status) => api.patch(`/hr/holidays/${id}/status`, { status }),
  bulkDeleteHolidays: (ids) => api.post('/hr/holidays/bulk-delete', { ids }),
  bulkUpdateHolidayStatus: (ids, status) => api.post('/hr/holidays/bulk-status', { ids, status }),

  getLeaveTypes: (params) => api.get('/hr/leave-type', { params }),
  getLeaveTypeById: (id) => api.get(`/hr/leave-type/${id}`),
  createLeaveType: (data) => api.post(`/hr/leave-type`, data),
  updateLeaveType: (id, data) => api.put(`/hr/leave-type/${id}`, data),
  deleteLeaveType: (id) => api.delete(`/hr/leave-type/${id}`),

  getLeaveWorkflows: (params) => api.get('/hr/leave-workflows', { params }),
  getLeaveWorkflowById: (id) => api.get(`/hr/leave-workflows/${id}`),
  createLeaveWorkflow: (data) => api.post('/hr/leave-workflows', data),
  updateLeaveWorkflow: (id, data) => api.put(`/hr/leave-workflows/${id}`, data),
  deleteLeaveWorkflow: (id) => api.delete(`/hr/leave-workflows/${id}`),

  getLeaveRequestsAll: (data) => api.post('/hr/leave-requests/all', data),
  getLeaveRequest: (id) => api.get(`/hr/leave-requests/${id}`),
  createLeaveRequest: (data) => api.post('/hr/leave-requests/', data),
  updateLeaveRequest: (id, data) => api.put(`/hr/leave-requests/${id}`, data),
  deleteLeaveRequest: (id) => api.delete(`/hr/leave-requests/${id}`),
  approveLeaveRequest: (id) => api.put(`/hr/leave-requests/${id}/approve`),
  rejectLeaveRequest: (id, reason) => api.put(`/hr/leave-requests/${id}/reject`, { reason }),
  cancelLeaveRequest: (id, reason) => api.put(`/hr/leave-requests/${id}/cancel`, { reason }),

  getExpensesAll: (data) => api.post('/hr/expenses/list', data),
  createExpense: (data) => api.post('/hr/expenses', data),
  updateExpense: (id, data) => api.put(`/hr/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/hr/expenses/${id}`),
  changeExpenseStatus: (id, data) => api.patch(`/hr/expenses/${id}/status`, data),
  getExpenseById: (id) => api.get(`/hr/expenses/${id}`),

  getExpenseItems: (expenseId) => api.get(`/hr/expenses/${expenseId}/items`),
  addExpenseItem: (expenseId, data) => api.post(`/hr/expenses/${expenseId}/items`, data),
  updateExpenseItem: (expenseId, itemId, data) => api.put(`/hr/expenses/${expenseId}/items/${itemId}`, data),
  deleteExpenseItem: (expenseId, itemId) => api.delete(`/hr/expenses/${expenseId}/items/${itemId}`),
  getAllExpenseItems: (data) => api.post('/hr/expenses/items/list', data),

  getAllDocuments: (params) => api.get('/hr/documents', { params }),
  getDocumentById: (id) => api.get(`/hr/documents/${id}`),
  createDocument: (formData) =>
    api.post('/hr/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'upload-required': 'yes',
        'upload-type': 'single',
        'upload-category': 'documents',
        'upload-storage': 'HRMS_Document',
      },
    }),
  updateDocument: (id, data) => api.put(`/hr/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/hr/documents/${id}`),
};

// services/api.js  — add alongside hrAPI
export const stockPointsAPI = {
  // ========== Stock Points CRUD ==========
  getAllStockPoints: (data) => api.post('/store/stock-points/getAll', data),
  getStockPoint: (id) => api.get(`/store/stock-points/${id}`),
  createStockPoint: (data) => api.post('/store/stock-points', data),
  updateStockPoint: (id, data) => api.put(`/store/stock-points/${id}`, data),
  deleteStockPoint: (id) => api.delete(`/store/stock-points/${id}`),

  // ========== Users mapped to a stock point ==========
  getUsersByStockPoint: (id) => api.get(`/store/stock-points/${id}/users`),

  // ========== Map stock points to a user ==========
  mapStockPointsToUser: (data) => api.post('/store/stock-points/map-to-user', data),
  mapUsersToStockPoint: (stock_po_id, user_ids) => api.post(`/store/stock-points/${stock_po_id}/map-users`, { user_ids }),
  getStockPointsByUser: (userId) => api.get(`/store/stock-points/user/${userId}`),
  mapStockPointsToDepartment: ({ dept_id, stock_point_ids }) => api.post(`/store/stock-points/${dept_id}/map-stock-points`, { stock_point_ids }),
  mapDepartmentsToStockPoint: (stock_po_id, department_ids) => api.post(`/store/stock-points/${stock_po_id}/map-departments`, { department_ids }),

  // ========== Dropdown helpers (reuse existing) ==========
  getDropdownUsers: (params) => api.get('/store/users/dropdown', { params }),
};

export const stockPointSettingsAPI = {
  create: (data) => api.post('/store/stock-point-settings', data),
  upsert: (stockPoId, data) => api.put(`/store/stock-point-settings/${stockPoId}/upsert`, data),
  getByStockPoint: (stockPoId) => api.get(`/store/stock-point-settings/by-stock-point/${stockPoId}`),
  getById: (id) => api.get(`/store/stock-point-settings/${id}`),
  update: (id, data) => api.put(`/store/stock-point-settings/${id}`, data),
  delete: (id) => api.delete(`/store/stock-point-settings/${id}`),
  getAll: (data) => api.post('/store/stock-point-settings/getAll', data),
};

export const itemCategoriesAPI = {
  getAllItemCategories: (data) => api.post('store/item-categories/getAll', data),
  getItemCategoryById: (id) => api.get(`store/item-categories/${id}`),
  createItemCategory: (data) => api.post('store/item-categories', data),
  updateItemCategory: (id, data) => api.put(`store/item-categories/${id}`, data),
  deleteItemCategory: (id) => api.delete(`store/item-categories/${id}`),
};

export const uomsAPI = {
  getAllUoms: (data) => api.post('/store/uoms/getAll', data),
  getUomById: (id) => api.get(`/store/uoms/${id}`),
  createUom: (data) => api.post('/store/uoms', data),
  updateUom: (id, data) => api.put(`/store/uoms/${id}`, data),
  deleteUom: (id) => api.delete(`/store/uoms/${id}`),
};

export const itemsAPI = {
  getAllItems: (data) => api.post('/store/items/getAll', data),
  getItemById: (id) => api.get(`/store/items/${id}`),
  createItem: (data) => api.post('/store/items', data),
  updateItem: (id, data) => api.put(`/store/items/${id}`, data),
  deleteItem: (id) => api.delete(`/store/items/${id}`),
};

export const suppliersAPI = {
  getAllSuppliers: (data) => api.post('/store/suppliers/getAll', data),
  getSupplierById: (id) => api.get(`/store/suppliers/${id}`),
  createSupplier: (data) => api.post('/store/suppliers', data),
  updateSupplier: (id, data) => api.put(`/store/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/store/suppliers/${id}`),
};

export const supplierDocumentsAPI = {
  getAllSupplierDocuments: (data) => api.post('/store/suppliers/documents/getAll', data),
  getSupplierDocumentById: (id) => api.get(`/store/suppliers/documents/${id}`),
  createSupplierDocument: (data) => api.post('/store/suppliers/documents', data),
  updateSupplierDocument: (id, data) => api.put(`/store/suppliers/documents/${id}`, data),
  deleteSupplierDocument: (id) => api.delete(`/store/suppliers/documents/${id}`),
};

export const costCentersAPI = {
  getAllCostCenters: (data) => api.post('/store/cost-centers/getAll', data),
  getCostCenterById: (id) => api.get(`/store/cost-centers/${id}`),
  createCostCenter: (data) => api.post('/store/cost-centers', data),
  updateCostCenter: (id, data) => api.put(`/store/cost-centers/${id}`, data),
  deleteCostCenter: (id) => api.delete(`/store/cost-centers/${id}`),
};

export const supplierContractsAPI = {
  getAllSupplierContracts: (data) => api.post('/store/suppliers/contracts/getAll', data),
  getSupplierContractById: (id) => api.get(`/store/suppliers/contracts/${id}`),
  createSupplierContract: (data) => api.post('/store/suppliers/contracts', data),
  updateSupplierContract: (id, data) => api.put(`/store/suppliers/contracts/${id}`, data),
  deleteSupplierContract: (id) => api.delete(`/store/suppliers/contracts/${id}`),
};

export const storageAPI = {
  list: () => api.get('/storage/all'),
};

export const assetAPI = {
};


export default api

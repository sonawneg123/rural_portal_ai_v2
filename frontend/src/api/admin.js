import client from './client.js';

export const adminApi = {
  getDashboard:   ()          => client.get('/admin/dashboard'),
  getProblems:    (params)    => client.get('/admin/problems', { params }),
  updateStatus:   (id, data)  => client.patch(`/admin/problems/${id}/status`, data),
  getInsight:     (id)        => client.get(`/admin/problems/${id}/insight`),
  getUsers:       (params)    => client.get('/admin/users', { params }),
  toggleUser:     (id)        => client.patch(`/admin/users/${id}/toggle`),
  officialComment:(id, content) => client.post(`/admin/problems/${id}/comment`, { content }),
  exportCsv:      (params)    => client.get('/admin/export/csv', { params, responseType: 'blob' }),
};

export const notificationsApi = {
  getAll:    (params) => client.get('/notifications', { params }),
  markRead:  (id)     => client.patch(`/notifications/${id}/read`),
  markAllRead: ()     => client.patch('/notifications/read-all'),
};

export const governanceApi = {
  // CM
  getCMDashboard:         ()     => client.get('/cm/dashboard'),
  cmAllocateBudget:       (data) => client.post('/cm/budget/allocate', data),
  // Collector
  getCollectorDashboard:  ()     => client.get('/collector/dashboard'),
  collectorAllocateBudget:(data) => client.post('/collector/budget/allocate', data),
  // MLA
  getMLADashboard:        ()     => client.get('/mla/dashboard'),
  mlaAllocateBudget:      (data) => client.post('/mla/budget/allocate', data),
  // MP
  getMPDashboard:         ()     => client.get('/mp/dashboard'),
  mpAllocateBudget:       (data) => client.post('/mp/budget/allocate', data),
  // Sarpanch
  getSarpanchDashboard:   ()             => client.get('/sarpanch/dashboard'),
  sarpanchUpdateStatus:   (id, data)     => client.patch(`/sarpanch/problems/${id}/status`, data),
  // GramSevak
  getGramSevakDashboard:  ()     => client.get('/gramsevak/dashboard'),
  // Announcements
  getAnnouncements: (params) => client.get('/announcements', { params }),
  postAnnouncement: (data)   => client.post('/announcements', data),
};

import client from './client.js';

export const problemsApi = {
  getAll: (params)  => client.get('/problems', { params }),
  getMy:  ()        => client.get('/problems/my'),
  getById:(id)      => client.get(`/problems/${id}`),
  create: (formData)=> client.post('/problems', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  upvote:    (id)            => client.post(`/problems/${id}/upvote`),
  comment:   (id, content)   => client.post(`/problems/${id}/comment`, { content }),
  getDeadline: (id)          => client.get(`/problems/${id}/deadline`),

  // Work progress
  getWorkUpdates: (id)       => client.get(`/problems/${id}/work-updates`),
  addWorkUpdate:  (id, fd)   => client.post(`/problems/${id}/work-updates`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  approveUpdate:  (id)       => client.patch(`/work-updates/${id}/approve`),
  disputeUpdate:  (id)       => client.patch(`/work-updates/${id}/dispute`),
  markHelpful:    (id)       => client.post(`/work-updates/${id}/helpful`),
};

export const categoriesApi = {
  getAll: () => client.get('/categories'),
};

export const locationsApi = {
  getStates:    ()      => client.get('/locations/states'),
  getDistricts: (state) => client.get('/locations/districts', { params: { state } }),
};

export const statsApi = {
  getSummary:    ()   => client.get('/stats/summary'),
  getLeaderboard:()   => client.get('/stats/leaderboard'),
  getTags:       ()   => client.get('/stats/tags'),
};

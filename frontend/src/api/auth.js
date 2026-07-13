import client from './client.js';

export const authApi = {
  login:          (data)  => client.post('/auth/login', data),
  register:       (data)  => client.post('/auth/register', data),
  getMe:          ()      => client.get('/auth/me'),
  getMyStats:     ()      => client.get('/auth/my-stats'),
  updateProfile:  (data)  => client.patch('/auth/profile', data),
  changePassword: (data)  => client.post('/auth/change-password', data),
};

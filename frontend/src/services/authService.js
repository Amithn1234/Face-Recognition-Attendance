import api from './api';

export const authService = {
  login: async (username_or_email, password) => {
    const response = await api.post('/auth/login', { username_or_email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  getCurrentAdmin: async () => {
    const response = await api.get('/auth/me');
    return response.data.admin;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

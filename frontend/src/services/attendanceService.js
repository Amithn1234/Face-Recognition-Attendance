import api from './api';
import { API_BASE_URL } from '../utils/constants';

export const attendanceService = {
  getHistory: async (params = {}) => {
    const response = await api.get('/attendance', { params });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getExportUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/attendance/export?${query}&token=${token}`;
  },

  downloadCsv: async (params = {}) => {
    const response = await api.get('/attendance/export', {
      params,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

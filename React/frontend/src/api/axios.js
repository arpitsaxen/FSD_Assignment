// src/api/axios.js
import axios from 'axios';

// Create a custom axios instance with your backend URL
const API = axios.create({
    baseURL: 'http://localhost:8000/api/',  // Your Django API URL
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true  // Include cookies with cross-origin requests
});

// Add request interceptor to include auth token with every request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
API.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                
                const response = await axios.post('http://localhost:8000/api/auth/refresh/', {
                    refresh: refreshToken
                });
                
                const { access } = response.data;
                
                // Update stored token
                localStorage.setItem('access_token', access);
                
                // Update authorization header
                originalRequest.headers['Authorization'] = `Bearer ${access}`;
                
                // Retry the original request
                return axios(originalRequest);
            } catch (refreshError) {
                // Refresh token failed, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export const studentAPI = {
  getAll: (params = {}) => API.get('students/', { params }),
  getById: (id) => API.get(`students/${id}/`),
  create: (data) => API.post('students/', data),
  update: (id, data) => API.put(`students/${id}/`, data),
  delete: (id) => API.delete(`students/${id}/`),
  bulkImport: (formData) => API.post('students/bulk_import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const driveAPI = {
  getAll: (params = {}) => API.get('drives/', { params }),
  getById: (id) => API.get(`drives/${id}/`),
  create: (data) => API.post('drives/', data),
  update: (id, data) => API.put(`drives/${id}/`, data),
  delete: (id) => API.delete(`drives/${id}/`),
  markStudents: (id, studentIds) => API.post(`drives/${id}/mark_students/`, { student_ids: studentIds }),
};

export default API;
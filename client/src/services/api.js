import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/password', { currentPassword, newPassword }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Identity API
export const identityAPI = {
  getStatus: () => api.get('/identity/status'),
  verify: (formData) => api.post('/identity/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCertificate: () => api.get('/identity/certificate'),
  downloadCertificate: (certificateId) => 
    api.get(`/identity/certificate/${certificateId}/download`),
  verifyOnChain: (userId, verificationHash) => 
    api.post('/identity/verify-on-chain', { userId, verificationHash }),
  getWallet: () => api.get('/identity/wallet'),
};

// Documents API
export const documentsAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  download: (id) => api.get(`/documents/${id}/download`, {
    responseType: 'blob'
  }),
  addComment: (id, content) => api.post(`/documents/${id}/comments`, { content }),
};

// Signatures API
export const signaturesAPI = {
  sign: (documentId, signature, signatureHash) => 
    api.post('/signatures/sign', { documentId, signature, signatureHash }),
  verify: (documentId, signature, signerAddress) => 
    api.post('/signatures/verify', { documentId, signature, signerAddress }),
  getDocumentSignatures: (documentId) => api.get(`/signatures/document/${documentId}`),
  generateSignatureData: (documentId) => 
    api.post('/signatures/generate-signature-data', { documentId }),
  getPending: (params) => api.get('/signatures/pending', { params }),
  getHistory: (params) => api.get('/signatures/history', { params }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export const chatAPI = {
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (userId, content) => api.post(`/chat/messages/${userId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
};

export default api; 
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ph_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ph_token');
      localStorage.removeItem('ph_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (email, password) =>
  api.post('/auth/register', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const getMe = () =>
  api.get('/auth/me');

// Simulations
export const getScenarios = () =>
  api.get('/simulations/scenarios');

export const startSimulation = () =>
  api.post('/simulations/start');

export const submitAnswer = (simulationId, scenarioId, studentAnswer) =>
  api.post(`/simulations/${simulationId}/answer`, { scenarioId, studentAnswer });

export const completeSimulation = (simulationId) =>
  api.post(`/simulations/${simulationId}/complete`);

export const getMyHistory = () =>
  api.get('/simulations/my-history');

export const getSimulationResults = (simulationId) =>
  api.get(`/simulations/${simulationId}/results`);

// Admin
export const getAdminDashboard = () =>
  api.get('/admin/dashboard');

export const getAdminStudents = () =>
  api.get('/admin/students');

export const getAdminSimulations = () =>
  api.get('/admin/simulations');

export const getSimulationDetails = (id) =>
  api.get(`/admin/simulations/${id}/details`);

export const getAdminScenarios = () =>
  api.get('/admin/scenarios');

export const createScenario = (data) =>
  api.post('/admin/scenarios', data);

export const updateScenario = (id, data) =>
  api.put(`/admin/scenarios/${id}`, data);

export const deleteScenario = (id) =>
  api.delete(`/admin/scenarios/${id}`);

export const getAnalytics = () =>
  api.get('/admin/analytics');

export default api;

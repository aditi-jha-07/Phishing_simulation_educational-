import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import Simulation from './pages/Simulation';
import SimulationResults from './pages/SimulationResults';
import AdminDashboard from './pages/AdminDashboard';
import AdminScenarios from './pages/AdminScenarios';

function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-hunter-bg flex items-center justify-center">
      <div className="terminal-text text-lg animate-pulse">INITIALIZING...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={
            <PrivateRoute requiredRole="student"><StudentDashboard /></PrivateRoute>
          } />
          <Route path="/simulation" element={
            <PrivateRoute requiredRole="student"><Simulation /></PrivateRoute>
          } />
          <Route path="/results/:id" element={
            <PrivateRoute requiredRole="student"><SimulationResults /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/scenarios" element={
            <PrivateRoute requiredRole="admin"><AdminScenarios /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

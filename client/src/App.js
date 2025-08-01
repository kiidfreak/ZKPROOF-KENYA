import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import IdentityVerification from './pages/IdentityVerification';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import Signatures from './pages/Signatures';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Chat from './pages/Chat';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import ForumNew from './pages/ForumNew';
import MyBlogs from './pages/MyBlogs';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181c2a] transition-colors duration-300">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/identity" element={
          <ProtectedRoute>
            <Layout>
              <IdentityVerification />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/documents" element={
          <ProtectedRoute>
            <Layout>
              <Documents />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/documents/:id" element={
          <ProtectedRoute>
            <Layout>
              <DocumentDetail />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/signatures" element={
          <ProtectedRoute>
            <Layout>
              <Signatures />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <Layout>
              <Chat />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/forum" element={<Layout><Forum /></Layout>} />
        <Route path="/forum/new" element={<Layout><ForumNew /></Layout>} />
        <Route path="/forum/:id" element={<Layout><ForumPost /></Layout>} />
        
        <Route path="/my-blogs" element={
          <ProtectedRoute>
            <Layout>
              <MyBlogs />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default App; 
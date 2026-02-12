import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Devices from './pages/Devices';
import Rules from './pages/Rules';
import Reporting from './pages/Reporting';
import Analytics from './pages/Analytics';
import DeviceDetails from './pages/DeviceDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';

import './App.css';

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('factoryops_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PageWrapper = ({ children, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Header title={title} />
      <div className="page-content">
        {children}
      </div>
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<ProtectedRoute><PageWrapper title="Dashboard Control"><Dashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><PageWrapper title="User Management"><Users /></PageWrapper></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><PageWrapper title="Equipment Fleet"><Devices /></PageWrapper></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute><PageWrapper title="Automation Rules"><Rules /></PageWrapper></ProtectedRoute>} />
        <Route path="/reporting" element={<ProtectedRoute><PageWrapper title="Operations Reports"><Reporting /></PageWrapper></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><PageWrapper title="Deep Analytics"><Analytics /></PageWrapper></ProtectedRoute>} />
        <Route path="/devices/:id" element={<ProtectedRoute><PageWrapper title="Device Details"><DeviceDetails /></PageWrapper></ProtectedRoute>} />

        <Route path="*" element={<PageWrapper title="404 - Not Found"><div>Page coming soon...</div></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return <AnimatedRoutes />;
  }

  return (
    <div className="app-hub">
      <Sidebar />
      <main className="main-canvas">
        <AnimatedRoutes />
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;

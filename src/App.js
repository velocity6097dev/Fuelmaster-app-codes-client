import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Lock, WifiOff, RefreshCw, LogOut } from 'lucide-react';
import { initAudio } from './utils/audio';

import { useAuth } from './context/AuthContext';
import { useBroadcast } from './context/BroadcastContext';
import { useStation } from './context/StationContext';

// Pages
import Login from './pages/auth/Login';
import ClientDashboard from './pages/client/ClientDashboard';
import Density from './pages/client/Density';
import Stocks from './pages/client/Stocks';
import Variance from './pages/client/Variance';
import Staff from './pages/client/Staff';
import Compliance from './pages/client/Compliance';
import About from './pages/client/About';
import ReimbursementInvoice from './pages/client/ReimbursementInvoice';
import Maintenance from './pages/client/Maintenance';
import Blocked from './pages/auth/Blocked';

// ==========================================
// GLOBAL GUARD (Handles Maintenance Routing)
// ==========================================
const GlobalGuard = ({ children }) => {
  const { maintenance } = useBroadcast();
  const location = useLocation();

  if (maintenance?.active && location.pathname !== '/maintenance') {
    return <Navigate to="/maintenance" replace />;
  }

  if (!maintenance?.active && location.pathname === '/maintenance') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ==========================================
// PROTECTED ROUTE (Handles Auth & Station Loading)
// ==========================================
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading, logout } = useAuth();
  const { station, loading: stationLoading } = useStation();

  if (authLoading) {
    return <div className="spinner-mini darker"></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (stationLoading) {
    return (
      <div style={{height:'100vh', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}}>
        <div className="spinner-mini darker"></div>
        <p style={{marginTop: 15, fontSize: '0.85rem', color: '#64748b', fontWeight: 500}}>
          Syncing Station Data...
        </p>
      </div>
    );
  }

  if (!station) {
    return (
      <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center'}}>
        <WifiOff size={48} color="#ef4444" style={{marginBottom:20}}/>
        <h3 style={{marginBottom:10}}>Connection Failed</h3>
        <p style={{color:'#64748b', marginBottom:30}}>
          We could not load your station data. This usually happens due to poor internet or an invalid session.
        </p>
        <div style={{display:'flex', flexDirection:'column', gap:15, width:'100%'}}>
          <button className="primary-btn" onClick={() => window.location.reload()}>
            <RefreshCw size={18} style={{marginRight:8}}/> Retry Connection
          </button>
          <button className="secondary-btn" onClick={logout} style={{border:'1px solid #e2e8f0'}}>
            <LogOut size={18} style={{marginRight:8}}/> Logout & Reset
          </button>
        </div>
      </div>
    );
  }

  // --- THE NEW MEMBERSHIP CHECK GOES HERE ---
  const currentStatus = (station.subscription_status || 'active').toLowerCase().trim();
  if (currentStatus === 'inactive') {
    return <Navigate to="/blocked" replace />;
  }
  // ------------------------------------------

  return children;
};

// ==========================================
// APP ROUTES
// ==========================================
const AppRoutes = () => {
  useEffect(() => {
    try {
      initAudio();
    } catch(e) {}

    let backListener;
    const setupBackButton = async () => {
      if (CapacitorApp?.addListener) {
        backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            CapacitorApp.exitApp();
          }
        });
      }
    };

    setupBackButton();

    return () => {
      if (backListener && backListener.remove) backListener.remove();
    };
  }, []);

  return (
    <GlobalGuard>
      <Routes>
        {/* Public / Unprotected Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/blocked" element={<Blocked />} />
        
        {/* Dedicated Maintenance Route */}
        <Route path="/maintenance" element={<Maintenance />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="/density" element={<ProtectedRoute><Density /></ProtectedRoute>} />
        <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
        <Route path="/variance" element={<ProtectedRoute><Variance /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        <Route path="/reimbursement" element={<ProtectedRoute><ReimbursementInvoice /></ProtectedRoute>} />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </GlobalGuard>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStation } from '../../context/StationContext';

const RequireAuth = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { station } = useStation(); 
  const location = useLocation();

  // --- DIAGNOSTICS: Check your F12 Browser Console ---
  useEffect(() => {
    console.log("RequireAuth Check -> User:", user?.email || "None");
    console.log("RequireAuth Check -> Station Fetched:", station ? "Yes" : "No");
    if (station) {
      console.log("RequireAuth Check -> Subscription Status in DB:", station.subscription_status);
    }
  }, [user, station]);
  // ---------------------------------------------------

  // 1. Wait for Auth to finish initializing
  if (authLoading) {
      return null;
  }

  // 2. If no user, kick to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If logged in but no station data yet, show a loader
  if (!station) {
     return (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div className="spinner-mini darker"></div>
            <p style={{marginLeft: 10, color: '#666'}}>Loading Station Data...</p>
        </div>
     );
  }

  // 4. Clean up the text just in case there are spaces or capital letters in Supabase
  const currentStatus = (station.subscription_status || 'active').toLowerCase().trim();

  // 5. If inactive, intercept and route to Blocked page
  if (currentStatus === 'inactive') {
    return <Navigate to="/blocked" replace />;
  }

  // 6. Success - Render the Dashboard
  return children;
};

export default RequireAuth;
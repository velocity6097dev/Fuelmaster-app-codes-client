import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('manager'); // 'manager' | 'staff'
  const [loading, setLoading] = useState(true);

  // --- 1. LIVE SESSION & BLOCK VALIDATION ---
  useEffect(() => {
    const validateSession = async () => {
      try {
        const storedRole = localStorage.getItem('fm_user_role');
        const savedId = localStorage.getItem('fm_saved_id');
        const savedToken = localStorage.getItem('fm_auth_token');
        const stationId = localStorage.getItem('fm_station_id');

        // Short-circuit if the browser is offline to prevent random logouts
        if (!navigator.onLine) {
          console.log("Offline mode: Skipping live validation.");
          if (storedRole === 'manager' && savedId && savedToken) {
            setRole('manager');
            setUser({ id: savedId, name: 'Manager' });
          } else if (storedRole === 'staff' && savedId && savedToken) {
            setRole('staff');
            setUser({ id: savedId, name: localStorage.getItem('fm_user_name') || 'Staff' });
          } else {
            clearLocalAuth();
          }
          setLoading(false);
          return;
        }

        if (storedRole === 'manager' && savedId && savedToken) {
          // Scoped query specifically targeting the saved station ID and user
          let query = supabase
            .from('stations')
            .select('manager_pass, is_blocked')
            .eq('manager_user', savedId);

          if (stationId) query = query.eq('station_id', stationId);

          // Added limit(1) to prevent PGRST116 (Multiple rows returned) errors
          const { data: stData, error } = await query.limit(1).maybeSingle();

          // DO NOT wipe session on network/server errors
          if (error) {
            console.error("DB/Network Error during manager validation:", error);
            setRole('manager');
            setUser({ id: savedId, name: 'Manager' });
            return;
          }

          if (!stData || stData.is_blocked === true || String(stData.manager_pass) !== savedToken) {
            console.log("Session invalid: Password changed, account blocked, or wrong credentials.");
            clearLocalAuth();
          } else {
            setRole('manager');
            setUser({ id: savedId, name: 'Manager' });
          }
          
        } else if (storedRole === 'staff' && savedId && savedToken) {
          
          const { data: staff, error } = await supabase
            .from('staff')
            .select('pin, is_blocked, name')
            .eq('phone', savedId)
            .limit(1)
            .maybeSingle();

          // DO NOT wipe session on network/server errors
          if (error) {
            console.error("DB/Network Error during staff validation:", error);
            setRole('staff');
            setUser({ id: savedId, name: localStorage.getItem('fm_user_name') || 'Staff' });
            return;
          }

          if (!staff || staff.is_blocked === true || String(staff.pin) !== savedToken) {
            console.log("Session invalid: PIN changed or account blocked.");
            clearLocalAuth();
          } else {
            setRole('staff');
            setUser({ id: savedId, name: staff.name });
          }
          
        } else {
          clearLocalAuth();
        }
      } catch (error) {
        console.error("Auth Validation Exception:", error);
        // Do not call clearLocalAuth() inside catch to protect against random JS failures tearing down the session.
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  // --- 2. CLEAR GLOBAL CSS LOADER ---
  useEffect(() => {
    if (!loading) {
      const loader = document.getElementById('app-loader');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        const timeout = setTimeout(() => {
          loader.remove();
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [loading]);

  // --- 3. HELPER TO WIPE SESSION ---
  const clearLocalAuth = () => {
    localStorage.removeItem('fm_station_id');
    localStorage.removeItem('fm_user_role');
    localStorage.removeItem('fm_auth_token'); 
    localStorage.removeItem('fm_station_data');
    setUser(null);
    setRole('manager');
  };

  // --- 4. CUSTOM LOGIN LOGIC ---
  const login = async (id, pass) => {
    if (!navigator.onLine) throw new Error("No Internet Connection");

    // Try Manager Login
    let { data: stData, error: stError } = await supabase
      .from('stations')
      .select('station_id, manager_user, manager_pass, is_blocked')
      .eq('manager_user', id)
      .eq('manager_pass', pass)
      .limit(1)
      .maybeSingle();

    if (stError && stError.code !== 'PGRST116') {
      throw new Error("Database Connection Failed");
    }

    if (stData) {
      if (stData.is_blocked) throw new Error("Account Suspended by Admin.");

      localStorage.setItem('fm_station_id', stData.station_id);
      localStorage.setItem('fm_user_role', 'manager');
      localStorage.setItem('fm_saved_id', id);
      localStorage.setItem('fm_user_name', 'Manager');
      localStorage.setItem('fm_auth_token', pass); 

      setRole('manager');
      setUser({ id: id, name: 'Manager' });
      return true;
    }

    // Try Staff Login
    const { data: staff } = await supabase
      .from('staff')
      .select('*, stations(station_id)')
      .eq('phone', id)
      .eq('pin', pass)
      .limit(1)
      .maybeSingle();

    if (staff) {
      if (staff.is_blocked) throw new Error("Account Suspended by Admin.");

      localStorage.setItem('fm_station_id', staff.stations.station_id);
      localStorage.setItem('fm_user_role', 'staff');
      localStorage.setItem('fm_saved_id', staff.phone);
      localStorage.setItem('fm_user_name', staff.name);
      localStorage.setItem('fm_auth_token', pass); 

      setRole('staff');
      setUser({ id: staff.phone, name: staff.name });
      return true;
    }

    throw new Error("Invalid ID or Password");
  };

  const logout = () => {
    clearLocalAuth();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
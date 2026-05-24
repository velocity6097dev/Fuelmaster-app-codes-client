import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Check, Info } from 'lucide-react';

const SystemContext = createContext();

export const SystemProvider = ({ children }) => {
  // --- 1. Assets State ---
  const [systemAssets, setSystemAssets] = useState({ density: null, charts: null });
  
  // --- 2. UI State ---
  const [toast, setToast] = useState(null);
  const [alertState, setAlertState] = useState({ show: false, msg: '', title: '', onConfirm: null });
  
  // --- 3. Status State ---
  // We expose setSysStatus so StationContext can update this when data loads
  const [sysStatus, setSysStatus] = useState({ 
    pulse: 'yellow', 
    text: 'INITIALIZING...', 
    checks: [], 
    checked: false 
  });

  // --- 4. Toast Logic ---
  const showToast = useCallback((msg) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3000); 
  }, []);

  // --- 5. Alert Logic ---
  const showAlert = (msg, title, onConfirm) => {
    setAlertState({ show: true, msg, title, onConfirm });
  };

  // --- 6. Asset Loader (Internal) ---
  const loadAssets = async () => {
      try {
        const { data: c } = await supabase.from('system_assets').select('data').eq('key', 'tank_charts').single();
        const { data: d } = await supabase.from('system_assets').select('data').eq('key', 'density_table').single();
        setSystemAssets({ charts: c?.data, density: d?.data });
        return true;
      } catch(e) { 
        console.error("Asset Load Error", e);
        return false;
      }
  };

  // Load assets on mount only
  useEffect(() => {
    loadAssets();
  }, []);

  return (
    <SystemContext.Provider value={{ 
        systemAssets, 
        sysStatus, 
        setSysStatus, // Exposed so StationContext can use it
        showToast, 
        showAlert 
    }}>
      {children}

      {/* GLOBAL ALERT UI */}
      {alertState.show && (
         <div className="custom-alert-overlay" style={{ display: 'flex' }}>
            <div className="custom-alert-box animate__animated animate__zoomIn">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                    <Info size={50} color="var(--primary)" strokeWidth={1.5} />
                </div>
                <h3>{alertState.title || "Notice"}</h3>
                <p>{alertState.msg}</p>
                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
                    {alertState.onConfirm && (
                        <button className="secondary-btn" onClick={() => setAlertState(p=>({...p, show:false}))}>
                            Cancel
                        </button>
                    )}
                    <button className="custom-alert-btn" style={{ background: 'var(--primary)', flex: 1 }} 
                        onClick={() => { if (alertState.onConfirm) alertState.onConfirm(); setAlertState(p=>({...p, show:false})); }}>
                        Confirm
                    </button>
                </div>
            </div>
         </div>
      )}  

      {/* GLOBAL TOAST UI */}
      {toast && <div className="update-toast"><Check size={14}/> {toast}</div>}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
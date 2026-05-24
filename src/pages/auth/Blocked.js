import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStation } from '../../context/StationContext';
import { Lock, Phone, CreditCard, RefreshCw, LogOut } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';

export default function Blocked() {
  const { logout } = useAuth();
  
  // 1. Pull station data and the retry function from context
  const { station, retry } = useStation(); 
  
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- THE ESCAPE HATCH ---
  // Listens in real-time. If the DB status changes to active, or if the page reloads
  // and detects an active status, it instantly pulls them back into the app.
  useEffect(() => {
    if (station) {
      const currentStatus = (station.subscription_status || '').toLowerCase().trim();
      if (currentStatus === 'active') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [station, navigate]);

  const handleLogout = async () => {
    try { if (triggerHaptic) triggerHaptic(); } catch(e) {}
    setIsLoggingOut(true);
    await logout();
    navigate('/login');
  };

  const handleRefresh = async () => {
    try { if (triggerHaptic) triggerHaptic(); } catch(e) {}
    setIsRefreshing(true);
    
    // Seamlessly ping Supabase for the latest data without a hard page reload
    if (retry) {
      await retry();
    } else {
      window.location.reload();
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800); // Slight delay so the button animation feels natural
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      backgroundColor: 'var(--bg-body, #f1f5f9)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      
      <div className="animate-fade-in" style={{ 
        background: 'var(--surface, #ffffff)', 
        maxWidth: '440px', 
        width: '100%', 
        borderRadius: '28px', 
        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(239, 68, 68, 0.05)', 
        overflow: 'hidden', 
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* --- TOP ZONE: DANGER HEADER --- */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.01) 100%)',
          padding: '48px 32px 32px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(239,68,68,0.05)'
        }}>
          <div style={{ 
            width: '80px', height: '80px', margin: '0 auto 20px', 
            background: 'var(--surface, #ffffff)', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            position: 'relative',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.2)'
          }}>
            <div className="danger-pulse" style={{ 
              position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--danger, #ef4444)' 
            }} />
            <Lock size={34} style={{ color: 'var(--danger, #ef4444)', zIndex: 2 }} strokeWidth={2.5} />
          </div>

          <h1 style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-main, #0f172a)', marginBottom: '10px', letterSpacing: '-0.5px' }}>
            System Locked
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, padding: '0 10px' }}>
            Access to your FuelMaster dashboard has been suspended due to an inactive monthly subscription.
          </p>
        </div>

        {/* --- BOTTOM ZONE: ACTIONS & STEPS --- */}
        <div style={{ padding: '32px' }}>
          
          <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            Steps to Restore Access
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <div className="step-card">
              <div className="step-icon"><Phone size={18} /></div>
              <div>
                <div className="step-title">Contact Administration</div>
                <div className="step-desc">Reach out to your system admin.</div>
              </div>
            </div>

            <div className="step-card">
              <div className="step-icon"><CreditCard size={18} /></div>
              <div>
                <div className="step-title">Clear Pending Dues</div>
                <div className="step-desc">Ensure the subscription is paid.</div>
              </div>
            </div>
          </div>

          {/* --- BUTTONS --- */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleLogout} disabled={isLoggingOut} className="action-btn secondary">
              <LogOut size={18} />
              Logout
            </button>

            <button onClick={handleRefresh} disabled={isRefreshing} className="action-btn primary">
              <RefreshCw size={18} className={isRefreshing ? "spin-animation" : ""} />
              {isRefreshing ? 'Checking...' : 'Check Status'}
            </button>
          </div>

        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .danger-pulse { animation: danger-pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
        .spin-animation { animation: spin 1s linear infinite; }
        .step-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-body, #f8fafc); border-radius: 20px; border: 1px solid var(--border-color, #f1f5f9); transition: transform 0.2s ease, background 0.2s ease; }
        .step-card:hover { background: var(--surface, #ffffff); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-color: var(--primary-light, #e2e8f0); }
        .step-icon { background: var(--surface, #ffffff); padding: 12px; border-radius: 14px; color: var(--primary, #2563eb); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: center; }
        .step-title { font-size: 0.95rem; font-weight: 700; color: var(--text-main, #0f172a); margin-bottom: 2px; }
        .step-desc { font-size: 0.85rem; color: var(--text-muted, #64748b); }
        .action-btn { flex: 1; padding: 16px 12px; border-radius: 16px; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s ease; }
        .action-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .action-btn.secondary { background-color: transparent; color: var(--text-main, #0f172a); border: 2px solid var(--border-color, #e2e8f0); }
        .action-btn.secondary:hover:not(:disabled) { background-color: var(--bg-body, #f8fafc); }
        .action-btn.primary { background-color: var(--primary, #2563eb); color: #ffffff; border: none; box-shadow: 0 8px 16px var(--primary-glow, rgba(37, 99, 235, 0.25)); }
        .action-btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 20px var(--primary-glow, rgba(37, 99, 235, 0.35)); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes danger-pulse { 0% { transform: scale(0.85); opacity: 0.8; } 100% { transform: scale(1.7); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
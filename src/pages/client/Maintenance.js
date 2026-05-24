import React, { useState, useEffect } from 'react';
import { useBroadcast } from '../../context/BroadcastContext';
import { Settings, Wrench, ShieldAlert, Activity, RefreshCcw } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';
import { ImpactStyle } from '@capacitor/haptics';

const Maintenance = () => {
    const { maintenance } = useBroadcast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dots, setDots] = useState('');

    // Animating loading dots for the "Monitoring status" text
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const handleManualRefresh = () => {
        try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
        setIsRefreshing(true);
        setTimeout(() => {
            window.location.reload();
        }, 800); // Give a slight delay to show the spinner before reloading
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            background: 'var(--bg-body)', // Theme Background
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decorative Circles */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.15, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--success) 0%, transparent 70%)', opacity: 0.1, borderRadius: '50%' }} />

            <div className="animate__animated animate__fadeInUp" style={{
                background: 'var(--surface)', // Theme Surface (White in light mode, Dark in dark mode)
                maxWidth: '480px',
                width: '100%',
                borderRadius: '28px',
                padding: '40px 30px',
                boxShadow: 'var(--shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.15))',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ 
                        background: 'rgba(245, 158, 11, 0.15)', // Warning tint background
                        color: 'var(--warning, #f59e0b)', 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        fontWeight: '700', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        letterSpacing: '0.5px' 
                    }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--warning, #f59e0b)', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite' }} />
                        SYSTEM LOCKED
                    </div>
                </div>

                {/* Animated Dual Gears */}
                <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 24px' }}>
                    {/* Big Gear */}
                    <div style={{ position: 'absolute', top: 0, left: 0, color: 'var(--primary)', animation: 'spin-slow 6s linear infinite' }}>
                        <Settings size={64} strokeWidth={1.5} />
                    </div>
                    {/* Small Gear */}
                    <div style={{ position: 'absolute', bottom: 5, right: 5, color: 'var(--text-main)', animation: 'spin-reverse 4s linear infinite', background: 'var(--surface)', borderRadius: '50%' }}>
                        <Settings size={40} strokeWidth={2} />
                    </div>
                    {/* Little Wrench Badge */}
                    <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--success)', color: '#fff', borderRadius: '50%', padding: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}>
                        <Wrench size={16} />
                    </div>
                </div>

                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                    Maintenance Break
                </h1>
                
                {/* Dynamic Admin Message or Fallback */}
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '25px', padding: '0 10px' }}>
                    {maintenance?.message || "We're currently upgrading the station system to improve performance and reliability. We'll be back online shortly."}
                </p>

                {/* Info Alert Box */}
                <div style={{ background: 'var(--bg-body)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left', border: '1px solid var(--border)', marginBottom: '30px' }}>
                    <ShieldAlert size={22} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        The app is continuously monitoring the server. You will be reconnected automatically once maintenance is complete.
                    </span>
                </div>

                {/* Footer Action Area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '14px',
                            background: isRefreshing ? 'var(--border)' : 'var(--primary)',
                            color: isRefreshing ? 'var(--text-muted)' : '#ffffff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isRefreshing ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        <RefreshCcw size={18} className={isRefreshing ? "animate-spin" : ""} />
                        {isRefreshing ? 'Checking Status...' : 'Refresh Connection'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                        <Activity size={14} />
                        Monitoring network status{dots}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
                @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); } }
                .animate-spin { animation: spin-slow 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default Maintenance;
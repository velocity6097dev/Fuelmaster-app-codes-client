import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, AlertOctagon, X, BellRing, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/audio';
import { ImpactStyle } from '@capacitor/haptics';

const BroadcastBanner = ({ msg, type = 'info', updatedAt }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // React to new Broadcasts instantly
  useEffect(() => {
    if (msg) {
      setIsVisible(false);
      setShowPopup(false);
      const timer = setTimeout(() => setIsVisible(true), 50); // Faster reset
      return () => clearTimeout(timer);
    }
  }, [updatedAt, msg]);

  if (!msg || !isVisible) return null;

  // PREMIUM UI Configuration
  const themeConfig = {
    info: { 
        icon: <Info size={18} strokeWidth={2.5} />, 
        color: '#3b82f6', // FORCED BRILLIANT BLUE (Removed var(--primary))
        glow: 'rgba(59, 130, 246, 0.5)', 
        bgTint: 'rgba(59, 130, 246, 0.12)', 
        title: 'System Notice',
        badge: 'INFO' 
    },
    warning: { 
        icon: <AlertTriangle size={18} strokeWidth={2.5} />, 
        color: '#f59e0b', // ORANGE
        glow: 'rgba(245, 158, 11, 0.5)', 
        bgTint: 'rgba(245, 158, 11, 0.12)', 
        title: 'Important Warning',
        badge: 'WARNING'
    },
    critical: { 
        icon: <AlertOctagon size={18} strokeWidth={2.5} />, 
        color: '#ef4444', // RED
        glow: 'rgba(239, 68, 68, 0.5)', 
        bgTint: 'rgba(239, 68, 68, 0.12)', 
        title: 'Critical Alert',
        badge: 'URGENT'
    },
    success: { 
        icon: <CheckCircle2 size={18} strokeWidth={2.5} />, 
        color: '#10b981', // GREEN (Just in case DB sends 'success')
        glow: 'rgba(16, 185, 129, 0.5)', 
        bgTint: 'rgba(16, 185, 129, 0.12)', 
        title: 'Success Notice',
        badge: 'NEW'
    }
  };

  // Select theme based on DB input (Defaults to the Blue INFO theme)
  const currentTheme = themeConfig[type] || themeConfig.info;

  const handleOpenPopup = () => {
    try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    try { triggerHaptic(ImpactStyle.Light); } catch(e) {}
    setShowPopup(false);
  };

  // The text payload block
  const BroadcastContent = () => (
    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ background: currentTheme.color, color: '#fff', padding: '3px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px' }}>
          {currentTheme.badge}
      </span>
      {msg}
      <span style={{ color: currentTheme.color, fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.8, margin: '0 5px' }}>
        &nbsp; • TAP TO READ • &nbsp;
      </span>
    </span>
  );

  return (
    <>
      {/* 1. GLOWING BANNER STRIP */}
      <div
        className="animate__animated animate__slideInDown"
        onClick={handleOpenPopup}
        style={{
          margin: '12px 16px',
          padding: '10px 14px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, var(--surface, #ffffff), ${currentTheme.bgTint})`,
          border: `1px solid ${currentTheme.color}`, 
          boxShadow: `0 8px 20px -6px ${currentTheme.glow}`, 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 50,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* Pulsing Alert Icon */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div className="broadcast-pulse-ring" style={{ background: currentTheme.glow }}></div>
            <div style={{ color: '#fff', background: currentTheme.color, borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, boxShadow: `0 2px 8px ${currentTheme.glow}` }}>
                {currentTheme.icon}
            </div>
        </div>

        {/* LAG-FREE SEAMLESS MARQUEE */}
        <div style={{ 
            flex: 1, overflow: 'hidden', display: 'flex', whiteSpace: 'nowrap', position: 'relative',
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%)'
        }}>
          <div className="gpu-smooth-marquee" style={{ display: 'flex', gap: '20px' }}>
             <BroadcastContent />
             <BroadcastContent />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          style={{
            background: 'var(--bg-body)', border: `1px solid rgba(100,116,139,0.2)`, color: 'var(--text-muted)',
            borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. PREMIUM POPUP MODAL */}
      {showPopup && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', 
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', zIndex: 100002
        }}>
          <div className="animate__animated animate__zoomIn animate__faster" style={{
            background: 'var(--surface, #ffffff)', maxWidth: '420px', width: '100%',
            borderRadius: '28px', padding: '35px 25px',
            boxShadow: `0 30px 60px -10px ${currentTheme.glow}`, 
            position: 'relative', border: `1px solid rgba(100, 116, 139, 0.1)`
          }}>
            <button onClick={handleClosePopup} style={{
              position: 'absolute', top: '15px', right: '15px', background: 'var(--bg-body)', border: 'none', color: 'var(--text-muted)',
              borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <X size={20} />
            </button>

            <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: currentTheme.bgTint, color: currentTheme.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', border: `2px solid ${currentTheme.glow}`
            }}>
                <BellRing size={36} className="animate__animated animate__tada animate__delay-1s" />
            </div>

            <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              {currentTheme.title}
            </h3>

            <div style={{
                background: 'var(--bg-body)', borderRadius: '16px', padding: '24px',
                fontSize: '1rem', color: 'var(--text-main)', lineHeight: '1.7',
                border: '1px solid var(--border)', maxHeight: '350px', overflowY: 'auto',
                whiteSpace: 'pre-wrap', fontWeight: '500'
            }}>
              {msg}
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleClosePopup} style={{
                  width: '100%', padding: '16px', borderRadius: '16px', background: currentTheme.color, color: '#fff', fontSize: '1.05rem',
                  fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: `0 8px 20px -6px ${currentTheme.glow}`, transition: 'transform 0.2s'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded High-Performance CSS */}
      <style>{`
        .broadcast-pulse-ring {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            z-index: 1;
            opacity: 0;
            animation: broadcast-sonar 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes broadcast-sonar {
            0% { transform: scale(0.8); opacity: 0.8; }
            100% { transform: scale(2); opacity: 0; }
        }

        .gpu-smooth-marquee {
            animation: hardware-scroll 12s linear infinite;
            will-change: transform;
            transform: translateZ(0);
        }

        @keyframes hardware-scroll {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(calc(-50% - 10px), 0, 0); } 
        }
      `}</style>
    </>
  );
};

export default BroadcastBanner;
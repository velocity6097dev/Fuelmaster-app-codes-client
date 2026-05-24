import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  User, Mail, Globe, Heart, ShieldCheck, Code2,
  Zap, Layers, GitBranch, Cpu, Star, ChevronDown,
  Package, Smartphone, Clock, Fuel, Activity,
} from 'lucide-react';

// ─────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────
const TECH_STACK = [
  { name: 'React',        iconClass: 'blue',   desc: 'UI Framework'        },
  { name: 'Capacitor',    iconClass: 'blue',   desc: 'Native Android Bridge'},
  { name: 'jsPDF',        iconClass: 'green',  desc: 'PDF Generation'      },
  { name: 'Supabase',     iconClass: 'green',  desc: 'Realtime Backend'    },
  { name: 'ML Kit',       iconClass: 'orange', desc: 'Document Scanner'    },
  { name: 'LocalStorage', iconClass: 'purple', desc: 'Offline Persistence' },
];

const FEATURES = [
  { icon: Activity,   iconClass: 'blue',   label: 'Real-time Density Checks',  desc: 'Automated calculations with tolerance alerts'   },
  { icon: Layers,     iconClass: 'green',  label: 'Stock Volume Calculator',   desc: 'Precise dip-to-litre conversions per tank'      },
  { icon: Package,    iconClass: 'orange', label: 'W&M Invoice Generator',     desc: 'One-tap PDF reimbursement invoices'             },
  { icon: ShieldCheck,iconClass: 'blue',   label: 'Compliance Task Manager',   desc: 'Priority-based task tracking with due dates'    },
  { icon: Cpu,        iconClass: 'purple', label: 'Document Scanner',          desc: 'ML Kit edge detection with auto crop'           },
  { icon: Clock,      iconClass: 'green',  label: 'Offline First',             desc: 'Full functionality without internet'            },
];

const CHANGELOG = [
  { version: 'v4.0', date: 'May 2025',  note: 'Document scanner (ML Kit), media picker sheet, compliance overhaul, realtime sync fix' },
  { version: 'v3.5', date: 'Jan 2025',  note: 'W&M reimbursement invoice with PDF export & native Android share'                      },
  { version: 'v3.0', date: 'Sep 2024',  note: 'Capacitor migration — full Android APK build pipeline'                                },
  { version: 'v2.0', date: 'Apr 2024',  note: 'Stock calculator, density module, localStorage persistence'                           },
  { version: 'v1.0', date: 'Nov 2023',  note: 'Initial release — basic fuel management dashboard'                                    },
];

// ─────────────────────────────────────────────
// FADE-SLIDE MOUNT ANIMATION
// ─────────────────────────────────────────────
const FadeSlide = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    const t = setTimeout(() => {
      el.style.transition = `opacity 0.45s ease ${delay}ms, transform 0.45s cubic-bezier(0.34,1.1,0.64,1) ${delay}ms`;
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, 60);
    return () => clearTimeout(t);
  }, [delay]);
  return <div ref={ref}>{children}</div>;
};

// ─────────────────────────────────────────────
// SECTION HEADER  (matches app card-head style)
// ─────────────────────────────────────────────
const CardHead = ({ icon: Icon, label, iconClass = 'blue' }) => (
  <div className="card-head" style={{ marginBottom: '16px' }}>
    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
      <div className={`icon-box ${iconClass}`} style={{ width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} />
      </div>
      {label}
    </h3>
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const About = () => {
  const { station } = useAuth();
  const [changelogOpen, setChangelogOpen] = useState(false);

  return (
    <div className="app-layout">
      <Navbar title="About" />

      <main className="main-content" style={{ paddingTop: '8px', paddingBottom: '40px' }}>

        {/* ── Hero  (uses existing welcome-card class → theme-aware) ── */}
        <FadeSlide delay={0}>
          <div className="welcome-card animate__animated animate__fadeIn" style={{ marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            {/* decorative watermark */}
            <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', opacity: 0.08, pointerEvents: 'none' }}>
              <Code2 size={100} />
            </div>

            <div className="welcome-text" style={{ zIndex: 1 }}>
              <span className="sub-welcome">Lead Developer</span>
              <h2 style={{ margin: '4px 0 6px', fontSize: '1.75rem', letterSpacing: '-0.02em' }}>Velocity6097</h2>

              {/* stat pills — use semi-transparent white so they work on any theme color */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                {[
                  { icon: GitBranch,  text: 'v3.9'    },
                  { icon: Smartphone, text: 'Android'  },
                  { icon: Globe,      text: 'India'    },
                  { icon: Zap,        text: 'Active'   },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '99px', padding: '4px 10px',
                    fontSize: '0.72rem', fontWeight: 700, color: 'inherit',
                  }}>
                    <Icon size={11} /> {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeSlide>

        {/* ── Vision ── */}
        <FadeSlide delay={70}>
          <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '16px' }}>
            <CardHead icon={Heart} label="The Vision" iconClass="orange" />
            <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              FuelMaster was built to <strong style={{ color: 'var(--text-main)' }}>eliminate manual calculation errors</strong> and modernise the daily operations of fuel stations across India.
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              By combining real-time density monitoring, dip-to-litre conversions, compliance tracking, and ML-powered document scanning into a single offline-first Android app, we put everything a station manager needs right in their pocket.
            </p>
          </div>
        </FadeSlide>

        {/* ── Developer Details ── */}
        <FadeSlide delay={130}>
          <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '16px' }}>
            <CardHead icon={User} label="Developer Details" iconClass="blue" />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { iconClass: 'blue',   icon: User,        label: 'NAME / HANDLE',    value: 'Velocity6097'                 },
                { iconClass: 'green',  icon: ShieldCheck, label: 'SYSTEM STATUS',    value: 'FuelMaster v4.0 · Stable'    },
                { iconClass: 'orange', icon: Globe,       label: 'REGION',           value: 'West Bengal, India'           },
                { iconClass: 'purple', icon: Mail,        label: 'SUPPORT & FEEDBACK', value: 'velocity6097.dev@gmail.com' },
              ].map(({ iconClass, icon: Icon, label, value }, i, arr) => (
                <div key={label} style={{
                  display: 'flex', gap: '14px', alignItems: 'center',
                  paddingBlock: '13px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div className={`icon-box ${iconClass}`} style={{ flexShrink: 0 }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
                      {label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSlide>

        {/* ── Key Features ── */}
        <FadeSlide delay={190}>
          <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '16px' }}>
            <CardHead icon={Star} label="Key Features" iconClass="orange" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FEATURES.map(({ icon: Icon, iconClass, label, desc }, i, arr) => (
                <div key={label} style={{
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  paddingBlock: '12px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div className={`icon-box ${iconClass}`} style={{ flexShrink: 0, marginTop: '1px' }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSlide>

        {/* ── Tech Stack ── */}
        <FadeSlide delay={250}>
          <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '16px' }}>
            <CardHead icon={Cpu} label="Tech Stack" iconClass="purple" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {TECH_STACK.map(({ name, iconClass, desc }) => (
                <div key={name} style={{
                  background: 'var(--bg-body)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '12px 8px',
                  textAlign: 'center',
                }}>
                  {/* colored dot using the icon-box accent color */}
                  <div className={`icon-box ${iconClass}`} style={{
                    width: 28, height: 28, borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <Code2 size={13} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '2px' }}>{name}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.3 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeSlide>

        {/* ── Changelog (collapsible) ── */}
        <FadeSlide delay={310}>
          <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '16px' }}>

            {/* Tappable header */}
            <button
              onClick={() => setChangelogOpen(o => !o)}
              style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <CardHead icon={GitBranch} label="Changelog" iconClass="green" />
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--bg-body)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginBottom: '16px',
                  transition: 'transform 0.3s ease',
                  transform: changelogOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  <ChevronDown size={15} color="var(--text-muted)" />
                </div>
              </div>
            </button>

            {/* Animated expand */}
            <div style={{
              overflow: 'hidden',
              maxHeight: changelogOpen ? '700px' : '0px',
              transition: 'max-height 0.42s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{ position: 'relative', paddingLeft: '22px', paddingTop: '4px' }}>
                {/* vertical line */}
                <div style={{
                  position: 'absolute', left: '8px', top: 0, bottom: 0,
                  width: '2px', background: 'var(--border)', borderRadius: '99px',
                }} />

                {CHANGELOG.map(({ version, date, note }, i) => (
                  <div key={version} style={{ position: 'relative', paddingBottom: i < CHANGELOG.length - 1 ? '18px' : 0 }}>
                    {/* timeline dot */}
                    <div style={{
                      position: 'absolute', left: '-18px', top: '4px',
                      width: 10, height: 10, borderRadius: '50%',
                      background: i === 0 ? 'var(--primary)' : 'var(--border)',
                      border: '2px solid var(--surface)',
                      boxShadow: i === 0 ? '0 0 0 3px var(--primary-light, #eff6ff)' : 'none',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.82rem', color: i === 0 ? 'var(--primary)' : 'var(--text-main)' }}>
                        {version}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{date}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeSlide>

        {/* ── Footer ── */}
        <FadeSlide delay={370}>
          <footer className="app-footer" style={{ marginTop: '8px' }}>
            <p>Made with <span className="heart">♥</span> by <strong>Velocity6097</strong></p>
            <p style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '4px' }}>FuelMaster © 2025 · All rights reserved</p>
          </footer>
        </FadeSlide>

      </main>
    </div>
  );
};

export default About;
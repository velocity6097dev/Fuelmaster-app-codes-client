import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import { triggerHaptic } from '../../utils/audio';
import { ImpactStyle } from '@capacitor/haptics';
import {
  Plus, Flame, Settings2, ShieldAlert, AlertCircle,
  X, ListTodo, CheckCircle2, Circle, Trash2,
  CalendarDays, Flag, Clock, ChevronRight,
  ClipboardList, AlertTriangle, StickyNote,
} from 'lucide-react';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const FILTERS    = ['All', 'Statutory', 'Maintenance', 'Safety'];
const CATEGORIES = ['Safety', 'Statutory', 'Maintenance'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const CATEGORY_META = {
  Safety:      { icon: Flame,       color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  Statutory:   { icon: Settings2,   color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  Maintenance: { icon: ShieldAlert, color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0' },
};

const PRIORITY_META = {
  Low:    { color: '#64748b', bg: '#f1f5f9' },
  Medium: { color: '#f59e0b', bg: '#fffbeb' },
  High:   { color: '#ef4444', bg: '#fef2f2' },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(todayStr());
};

const daysUntil = (dueDate) => {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate) - new Date(todayStr())) / 86400000);
};

// ─────────────────────────────────────────────
// CUSTOM DATE INPUT  (DD-MM-YYYY overlay)
// ─────────────────────────────────────────────
const CustomDateInput = ({ value, onChange, min }) => {
  const display = value ? formatDate(value) : 'DD-MM-YYYY';
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* visible label */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', paddingLeft: '12px',
        color: value ? 'var(--text-main)' : 'var(--text-muted, #9ca3af)',
        fontSize: 'inherit', fontFamily: 'inherit',
      }}>
        {display}
      </div>
      {/* invisible native picker on top */}
      <input
        type="date"
        value={value}
        min={min}
        onChange={onChange}
        style={{
          width: '100%', position: 'relative', zIndex: 2,
          opacity: 0, cursor: 'pointer',
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// DUE BADGE
// ─────────────────────────────────────────────
const DueBadge = ({ dueDate }) => {
  if (!dueDate) return null;
  const days    = daysUntil(dueDate);
  const overdue = days < 0;
  const soon    = !overdue && days <= 2;
  const color   = overdue ? '#ef4444' : soon ? '#f59e0b' : '#64748b';
  const bg      = overdue ? '#fef2f2' : soon ? '#fffbeb' : '#f1f5f9';
  const label   = overdue ? `${Math.abs(days)}d overdue`
    : days === 0 ? 'Due today'
    : days === 1 ? 'Due tomorrow'
    : `${days}d left`;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      fontSize: '0.68rem', fontWeight: 700, color, background: bg,
      padding: '3px 7px', borderRadius: '99px', flexShrink: 0,
    }}>
      {overdue ? <AlertTriangle size={9} /> : <Clock size={9} />}
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────
// PILL SELECTOR
// ─────────────────────────────────────────────
const PillSelector = ({ options, value, onChange, getMeta }) => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {options.map(opt => {
      const meta   = getMeta?.(opt);
      const active = value === opt;
      return (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: '8px 16px', borderRadius: '99px',
          background: active ? (meta?.color || 'var(--primary)') : 'var(--bg-body)',
          color: active ? '#fff' : 'var(--text-muted)',
          fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
          border: active ? `2px solid ${meta?.color || 'var(--primary)'}` : '1.5px solid var(--border)',
          transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
          transform: active ? 'scale(1.05)' : 'scale(1)',
          boxShadow: active ? `0 2px 12px ${meta?.color || 'var(--primary)'}44` : 'none',
        }}>
          {opt}
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────
// MODAL SHELL  (bottom-sheet)
// ─────────────────────────────────────────────
const ModalShell = ({ zIndex = 10001, onBackdropClick, children }) => (
  <div style={{
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  }}>
    <div onClick={onBackdropClick} style={{ position: 'absolute', inset: 0 }} />
    <div style={{
      position: 'relative',
      background: 'var(--surface, #ffffff)',
      width: '100%', maxWidth: '480px',
      maxHeight: '92vh',
      borderRadius: '24px 24px 0 0',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      padding: '0 0 env(safe-area-inset-bottom, 24px)',
      boxShadow: '0 -12px 48px rgba(0,0,0,0.22)',
      animation: 'sheetUp 0.38s cubic-bezier(0.32,0.72,0,1)',
      willChange: 'transform',
    }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }) => (
  <>
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
      <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--border, #e2e8f0)' }} />
    </div>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 20px 14px',
      borderBottom: '1px solid var(--border)',
    }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h3>
      <button onClick={onClose} style={{
        background: 'var(--bg-body)', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer',
        padding: '6px', borderRadius: '50%', display: 'flex',
        transition: 'background 0.15s',
      }}>
        <X size={20} />
      </button>
    </div>
  </>
);

// ─────────────────────────────────────────────
// ANIMATED TASK CARD WRAPPER
// ─────────────────────────────────────────────
const TaskCard = ({ children, isCompleted, isOverdue: overdueProp, onClick, style }) => {
  const ref = useRef(null);

  // Mount animation — slide in from right
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(18px)';
    const t = requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.2,0.64,1)';
      el.style.opacity    = '1';
      el.style.transform  = 'translateX(0)';
    });
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        display: 'flex', gap: '12px', alignItems: 'center',
        padding: '14px 12px',
        background: overdueProp ? '#fff5f5' : 'var(--bg-body)',
        border: overdueProp
          ? '1.5px solid #fca5a5'
          : isCompleted
            ? '1.5px dashed var(--border)'
            : '1.5px solid var(--border)',
        borderRadius: '16px',
        opacity: isCompleted ? 0.5 : 1,
        // Completion fade handled here
        transition: 'opacity 0.45s ease, border-color 0.3s ease, background 0.3s ease',
        cursor: isCompleted ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const Compliance = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('fuelmaster_compliance_todos');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [showAddModal, setShowAddModal]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDetailModal, setShowDetailModal]     = useState(null);

  // form state
  const [newTask, setNewTask]         = useState('');
  const [newCategory, setNewCategory] = useState('Safety');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate]   = useState('');
  const [newNote, setNewNote]         = useState('');

  useEffect(() => {
    localStorage.setItem('fuelmaster_compliance_todos', JSON.stringify(todos));
  }, [todos]);

  // stats
  const total   = todos.length;
  const pending = todos.filter(t => t.status === 'Pending').length;
  const overdue = todos.filter(t => t.status === 'Pending' && isOverdue(t.dueDate)).length;

  // ── actions ──────────────────────────────
  const openAdd = () => {
    try { triggerHaptic(ImpactStyle.Light); } catch (_) {}
    setNewTask(''); setNewCategory('Safety');
    setNewPriority('Medium'); setNewDueDate(''); setNewNote('');
    setShowAddModal(true);
  };

  const handleAddTodo = () => {
    if (!newTask.trim()) return;
    try { triggerHaptic(ImpactStyle.Medium); } catch (_) {}
    setTodos(prev => [{
      id: Date.now(),
      title:     newTask.trim(),
      note:      newNote.trim(),
      status:    'Pending',
      category:  newCategory,
      priority:  newPriority,
      dueDate:   newDueDate || null,
      createdAt: todayStr(),
    }, ...prev]);
    setShowAddModal(false);
  };

  const markAsCompleted = (id) => {
    try { triggerHaptic(ImpactStyle.Light); } catch (_) {}
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
    setTimeout(() => setTodos(prev => prev.filter(t => t.id !== id)), 700);
    setShowDetailModal(null);
  };

  const confirmDelete = (id) => {
    try { triggerHaptic(ImpactStyle.Heavy); } catch (_) {}
    setShowDeleteConfirm(id);
    setShowDetailModal(null);
  };

  const executeDelete = () => {
    try { triggerHaptic(ImpactStyle.Heavy); } catch (_) {}
    setTodos(prev => prev.filter(t => t.id !== showDeleteConfirm));
    setShowDeleteConfirm(null);
  };

  // ── filter + sort ─────────────────────────
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const filtered = (activeFilter === 'All' ? todos : todos.filter(t => t.category === activeFilter));
  const sorted   = [...filtered].sort((a, b) => {
    const aO = isOverdue(a.dueDate) ? 0 : 1;
    const bO = isOverdue(b.dueDate) ? 0 : 1;
    if (aO !== bO) return aO - bO;
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
  });

  // ── render ────────────────────────────────
  return (
    <div className="app-layout">
      <Navbar title="Task List" />

      <main className="main-content">

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total',   value: total,   color: 'var(--primary)', bg: 'var(--primary-light, #eff6ff)' },
            { label: 'Pending', value: pending,  color: '#f59e0b',        bg: '#fffbeb' },
            { label: 'Overdue', value: overdue,  color: '#ef4444',        bg: '#fef2f2' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: '16px', padding: '14px 8px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.68rem', fontWeight: 700, color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="scroll-wrapper" style={{ marginBottom: '16px' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { try { triggerHaptic(ImpactStyle.Light); } catch (_) {} setActiveFilter(f); }}
              className={`tank-btn ${activeFilter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task list card */}
        <div className="content-card" style={{ position: 'relative' }}>
          <div className="card-head">
            <h3><ListTodo size={20} color="var(--primary)" /> Compliance Tasks</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {sorted.length} task{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <ClipboardList size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontWeight: 700, margin: '0 0 6px', color: 'var(--text-main)' }}>All clear!</p>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Tap + to add a compliance task.</p>
            </div>
          ) : (
            /* Scrollable container — max 5.5 cards visible, then scrolls */
            <div style={{
              maxHeight: '62vh',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              paddingRight: '2px',       /* keep scrollbar from clipping */
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {sorted.map((todo) => {
                const isCompleted  = todo.status === 'Completed';
                const catMeta      = CATEGORY_META[todo.category] || {};
                const priMeta      = PRIORITY_META[todo.priority]  || PRIORITY_META.Medium;
                const CatIcon      = catMeta.icon || AlertCircle;
                const overdueTodo  = isOverdue(todo.dueDate) && !isCompleted;

                return (
                  <TaskCard
                    key={todo.id}
                    isCompleted={isCompleted}
                    isOverdue={overdueTodo}
                    onClick={() => !isCompleted && setShowDetailModal(todo)}
                  >
                    {/* Circle / check */}
                    <div
                      onClick={e => { e.stopPropagation(); !isCompleted && markAsCompleted(todo.id); }}
                      style={{ cursor: isCompleted ? 'default' : 'pointer', flexShrink: 0, display: 'flex' }}
                    >
                      {isCompleted
                        ? <CheckCircle2 size={28} color="var(--success, #10b981)" />
                        : <Circle size={28} color={catMeta.color || 'var(--border)'} />
                      }
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                        <h4 style={{
                          margin: 0, fontSize: '0.93rem', fontWeight: 700,
                          color: 'var(--text-main)',
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: '155px',
                        }}>
                          {todo.title}
                        </h4>
                        {/* priority dot */}
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: priMeta.color, flexShrink: 0 }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                          color: catMeta.color, background: catMeta.bg,
                          padding: '2px 7px', borderRadius: '99px',
                        }}>
                          <CatIcon size={9} /> {todo.category}
                        </span>
                        <DueBadge dueDate={todo.dueDate} />
                      </div>
                    </div>

                    {/* Trash + arrow */}
                    {!isCompleted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); confirmDelete(todo.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#ef4444', display: 'flex', borderRadius: '8px' }}
                        >
                          <Trash2 size={17} />
                        </button>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </div>
                    )}
                  </TaskCard>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={openAdd}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--primary)', color: 'white',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-float)', cursor: 'pointer', zIndex: 100,
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.9)'; }}
        onPointerUp={e   => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <Plus size={30} strokeWidth={2.5} />
      </button>

      {/* ══════════════════════════
          ADD TASK MODAL
      ══════════════════════════ */}
      {showAddModal && (
        <ModalShell onBackdropClick={() => setShowAddModal(false)}>
          <ModalHeader title="New Task" onClose={() => setShowAddModal(false)} />
          <div style={{ padding: '20px 20px 8px' }}>

            <div className="input-group">
              <label>Task Description *</label>
              <input
                type="text"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="e.g. Check fire extinguishers"
                autoFocus
              />
            </div>

            <div className="input-group">
              <label>Category</label>
              <PillSelector
                options={CATEGORIES}
                value={newCategory}
                onChange={setNewCategory}
                getMeta={c => ({ color: CATEGORY_META[c]?.color })}
              />
            </div>

            <div className="input-group">
              <label>Priority</label>
              <PillSelector
                options={PRIORITIES}
                value={newPriority}
                onChange={setNewPriority}
                getMeta={p => ({ color: PRIORITY_META[p]?.color })}
              />
            </div>

            {/* Due Date — DD-MM-YYYY overlay */}
            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarDays size={13} color="var(--primary)" />
                Due Date
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(optional)</span>
              </label>
              <CustomDateInput
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                min={todayStr()}
              />
            </div>

            {/* Notes — properly styled */}
            <div className="input-group" style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StickyNote size={13} color="var(--primary)" />
                Note
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(optional)</span>
              </label>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Any additional details or instructions…"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'none',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  padding: '10px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '12px',
                  background: 'var(--bg-body)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)'; }}
              />
            </div>

            <button
              onClick={handleAddTodo}
              disabled={!newTask.trim()}
              style={{
                width: '100%', padding: '15px',
                borderRadius: '14px', border: 'none',
                background: newTask.trim() ? 'var(--primary)' : 'var(--border)',
                color: newTask.trim() ? '#fff' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '1rem',
                cursor: newTask.trim() ? 'pointer' : 'not-allowed',
                marginTop: '12px', marginBottom: '8px',
                transition: 'background 0.2s, transform 0.15s',
              }}
            >
              Save Task
            </button>
          </div>
        </ModalShell>
      )}

      {/* ══════════════════════════
          TASK DETAIL MODAL
      ══════════════════════════ */}
      {showDetailModal && (() => {
        const t       = showDetailModal;
        const catMeta = CATEGORY_META[t.category] || {};
        const priMeta = PRIORITY_META[t.priority]  || PRIORITY_META.Medium;
        const CatIcon = catMeta.icon || AlertCircle;

        return (
          <ModalShell onBackdropClick={() => setShowDetailModal(null)}>
            <ModalHeader title="Task Detail" onClose={() => setShowDetailModal(null)} />
            <div style={{ padding: '20px' }}>

              {/* Title */}
              <p style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>
                {t.title}
              </p>

              {/* Chip row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: catMeta.color, background: catMeta.bg, border: `1px solid ${catMeta.border}`, padding: '4px 10px', borderRadius: '99px' }}>
                  <CatIcon size={12} /> {t.category}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: priMeta.color, background: priMeta.bg, padding: '4px 10px', borderRadius: '99px' }}>
                  <Flag size={11} /> {t.priority} Priority
                </span>
                {t.dueDate && <DueBadge dueDate={t.dueDate} />}
              </div>

              {/* Dates */}
              <div style={{ background: 'var(--bg-body)', borderRadius: '14px', padding: '14px', marginBottom: '14px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: t.dueDate ? '8px' : 0 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Created</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formatDate(t.createdAt)}</span>
                </div>
                {t.dueDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Due Date</span>
                    <span style={{ color: isOverdue(t.dueDate) ? '#ef4444' : 'var(--text-main)', fontWeight: 700 }}>{formatDate(t.dueDate)}</span>
                  </div>
                )}
              </div>

              {/* Note — styled card */}
              {t.note ? (
                <div style={{
                  background: 'var(--bg-body)',
                  borderRadius: '14px',
                  padding: '14px',
                  marginBottom: '20px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <StickyNote size={14} color="var(--primary)" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Note</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{t.note}</p>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }} />
              )}

              {/* Actions */}
              <button
                onClick={() => markAsCompleted(t.id)}
                style={{
                  width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                  background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '1rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', marginBottom: '10px',
                  boxShadow: '0 4px 16px #10b98133',
                }}
              >
                <CheckCircle2 size={20} /> Mark as Completed
              </button>
              <button
                onClick={() => confirmDelete(t.id)}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px',
                  border: '1.5px solid #fca5a5', background: '#fff5f5',
                  color: '#ef4444', fontWeight: 700, fontSize: '0.95rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                }}
              >
                <Trash2 size={18} /> Delete Task
              </button>
            </div>
          </ModalShell>
        );
      })()}

      {/* ══════════════════════════
          DELETE CONFIRM
      ══════════════════════════ */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 10002,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            background: 'var(--surface, #fff)', borderRadius: '22px',
            padding: '28px 24px', width: '100%', maxWidth: '320px',
            animation: 'popIn 0.28s cubic-bezier(0.34,1.4,0.64,1)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={26} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Delete Task?</h3>
            <p style={{ margin: '0 0 24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              This task will be permanently removed and cannot be recovered.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'var(--bg-body)', border: '1.5px solid var(--border)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px #ef444433' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Bottom-sheet slide up */
        @keyframes sheetUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        /* Confirm dialog pop */
        @keyframes popIn {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        /* Thin custom scrollbar for the task list */
        .compliance-scroll::-webkit-scrollbar { width: 3px; }
        .compliance-scroll::-webkit-scrollbar-track { background: transparent; }
        .compliance-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        /* Hidden date input overlay */
        .hidden-date-cover {
          opacity: 0;
          position: relative;
          z-index: 2;
          width: 100%;
          cursor: pointer;
        }
        .hidden-date-cover::-webkit-datetime-edit,
        .hidden-date-cover::-webkit-datetime-edit-fields-wrapper { color: transparent !important; }
        .hidden-date-cover::-webkit-calendar-picker-indicator {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          opacity: 0; cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Compliance;
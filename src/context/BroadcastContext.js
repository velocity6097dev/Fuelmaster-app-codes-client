import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const BroadcastContext = createContext();

export const BroadcastProvider = ({ children }) => {
  // 1. Initial State from Storage (Instant load on refresh)
  const [maintenance, setMaintenance] = useState(() => {
    const saved = localStorage.getItem('fm_maint_v2');
    try { return saved ? JSON.parse(saved) : { active: false }; } catch (e) { return { active: false }; }
  });

  const [broadcast, setBroadcast] = useState(() => {
    const saved = localStorage.getItem('fm_broad_v2');
    try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });

  // Heartbeat — tells the Dashboard to re-render
  const [syncToken, setSyncToken] = useState(Date.now());

  const applySettings = useCallback((settings) => {
    if (!settings) return;

    // Maintenance Lock
    const maintObj = { active: !!settings.downtime_active };
    setMaintenance(maintObj);
    localStorage.setItem('fm_maint_v2', JSON.stringify(maintObj));

    // Broadcast Message
    const msg = settings.broadcast_msg?.trim() || '';
    if (msg !== '') {
      const broadObj = {
        msg,
        type: settings.broadcast_type || 'info',
        updatedAt: Date.now(),
      };
      setBroadcast(broadObj);
      localStorage.setItem('fm_broad_v2', JSON.stringify(broadObj));
    } else {
      setBroadcast(null);
      localStorage.removeItem('fm_broad_v2');
    }

    // CRITICAL: Forces UI re-render
    setSyncToken(Date.now());
  }, []);

  useEffect(() => {
    let timeoutId;
    let activeChannel = null; // always holds the current live channel

    const startSync = async () => {
      // ── Step 1: Tear down any existing channel BEFORE creating a new one.
      // This prevents the "cannot add postgres_changes after subscribe()" error
      // that occurs when the same channel name is reused while still registered.
      if (activeChannel) {
        await supabase.removeChannel(activeChannel);
        activeChannel = null;
      }

      // ── Step 2: Fresh initial fetch so we never miss an update that happened
      // during the reconnect window.
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) applySettings(data);

      // ── Step 3: Create a new channel with a unique name on every attempt.
      // The timestamp suffix is a belt-and-suspenders guard: even if removeChannel
      // hasn't fully flushed from Supabase's internal registry yet, the new name
      // guarantees zero collision so .on() can always be called safely before .subscribe().
      const channel = supabase
        .channel(`system-broadcast-realtime-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.1' },
          (payload) => {
            console.log('Real-time Broadcast Sync:', payload.new);
            applySettings(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('Broadcast sync lost. Reconnecting in 5s…');
            timeoutId = setTimeout(startSync, 5000);
          }
        });

      // Store reference so cleanup and next reconnect can reach it
      activeChannel = channel;
    };

    startSync();

    return () => {
      clearTimeout(timeoutId);
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [applySettings]);

  return (
    <BroadcastContext.Provider value={{ maintenance, broadcast, syncToken }}>
      {children}
    </BroadcastContext.Provider>
  );
};

export const useBroadcast = () => useContext(BroadcastContext);
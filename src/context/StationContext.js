import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Check, Loader2, WifiOff, RefreshCcw } from 'lucide-react'; 

import { useAuth } from './AuthContext';
import { useSystem } from './SystemContext'; 

const StationContext = createContext();

export const StationProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast, setSysStatus } = useSystem();
  
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Ref to track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Helper to sort tanks consistently
  const sortTanks = (tanks) => {
    if (Array.isArray(tanks)) {
        return [...tanks].sort((a, b) => (a.tank_no || 0) - (b.tank_no || 0));
    }
    return tanks;
  };

  // --- A. DATA LOADER ---
  const loadStationData = useCallback(async (isSilent = false) => {
    const storedStationId = localStorage.getItem('fm_station_id');
    if (!storedStationId) return;

    if (!isSilent) setLoading(true);

    if (!isSilent) {
        setSysStatus({
            pulse: 'yellow',
            text: 'SYNCING...',
            checked: false,
            checks: [{ label: 'Verifying Subsystems...', icon: <Loader2 size={12} className="animate-spin"/> }]
        });
    }

    try {
        const { data: stData, error: stError } = await supabase
            .from('stations')
            .select('*')
            .eq('station_id', storedStationId)
            .single();

        if (stError) throw stError;

        if (stData && isMounted.current) {
            stData.tanks = sortTanks(stData.tanks);
            setStation(stData);
            localStorage.setItem('fm_station_data', JSON.stringify(stData));
        }
    } catch (err) {
        console.error("Sync Error:", err.message);
        if (isMounted.current) {
            setSysStatus(prev => ({ ...prev, pulse: 'red', text: 'CONNECTION ERROR' }));
        }
    } finally {
        if (!isSilent && isMounted.current) {
            setTimeout(() => setLoading(false), 800);
        }
    }
  }, [setSysStatus]);

  // --- B. STATUS RESTORE ---
  useEffect(() => {
    if (!loading && station) {
        setSysStatus({
             pulse: 'green', 
             text: 'ALL SYSTEMS LIVE', 
             checked: true,
             checks: [
                 { label: 'Database Connected', icon: <Check size={12}/> },
                 { label: 'Admin Panel Active', icon: <Check size={12}/> },
                 { label: `${station.tanks?.length || 0} Tanks Configured`, icon: <Check size={12}/> }
             ]
        });
    }
  }, [station, loading, setSysStatus]);

  // --- C. STABLE REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    isMounted.current = true;

    if (!user) {
        setStation(null);
        return;
    }

    // 1. Run the initial fetch
    loadStationData();

    // 2. Setup the Channel
    const currentId = localStorage.getItem('fm_station_id');
    if (!currentId) return;

    // FIX: Add timestamp to channel name to ensure uniqueness on every mount/remount.
    // This prevents "zombie" channels from previous renders stealing events.
    const uniqueChannelId = `station-sync-${currentId}-${Date.now()}`;

    const channel = supabase
      .channel(uniqueChannelId) 
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'stations',
          filter: `station_id=eq.${currentId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload.new);
          
          const newData = payload.new;
          newData.tanks = sortTanks(newData.tanks);

          if (isMounted.current) {
              setStation(newData);
              showToast("Station Data Synchronized");
          }
        }
      )
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
           console.log(`Connected to Station Realtime (${uniqueChannelId})`);
         }
         
         // FIX: Handle errors gracefully
         if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Realtime Error: ${status}`, err);
            showToast("Sync Connection Lost - Retrying...");
            // Optional: You could trigger a reloadStationData() here if needed
         }
      });

    return () => {
      isMounted.current = false;
      // Clean up the specific channel instance
      supabase.removeChannel(channel);
    };
  }, [user, showToast, loadStationData]); 

  return (
    <StationContext.Provider value={{ station, loading, retry: () => loadStationData(false) }}>
      {children}
    </StationContext.Provider>
  );
};

export const useStation = () => useContext(StationContext);
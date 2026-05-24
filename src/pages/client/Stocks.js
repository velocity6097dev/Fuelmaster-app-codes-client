import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
// 1. IMPORT THE CORRECT HOOKS
import { useStation } from '../../context/StationContext'; 
import { useSystem } from '../../context/SystemContext';
import { Droplet, Cylinder } from 'lucide-react';

const Stocks = () => {
  // 2. GET DATA FROM RESPECTIVE CONTEXTS
  const { station } = useStation(); 
  const { systemAssets, showAlert } = useSystem(); 
  
  const [selectedTank, setSelectedTank] = useState(null);
  const [dip, setDip] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync selectedTank when station data arrives
  useEffect(() => {
    if (station?.tanks?.length > 0 && !selectedTank) {
      setSelectedTank(station.tanks[0]);
    }
  }, [station, selectedTank]);

  const calculate = async () => {
    // SAFETY GUARDS
    if (!systemAssets?.charts) {
        return showAlert("Calibration charts are still syncing. Please wait.", "System Busy");
    }
    if (!dip) return showAlert("Please enter a dip reading.", "Input Required");
    if (!selectedTank) return showAlert("Please select a tank.", "Input Required");
    
    setLoading(true);
    setResult(null);

    // Animation Delay
    await new Promise(r => setTimeout(r, 800));

    // Lookup Chart
    const chartKey = `${selectedTank.type}_CHART`;
    const chart = systemAssets.charts[chartKey] || systemAssets.charts[selectedTank.type];

    if (!chart) { 
        setLoading(false); 
        return showAlert(`Chart data missing for type: ${selectedTank.type}`, "Error"); 
    }

    const dipVal = parseFloat(dip);
    // Convert all string keys to numbers for math comparison
    const dips = Object.keys(chart).map(Number).sort((a, b) => a - b);
    
    if (dipVal < dips[0] || dipVal > dips[dips.length - 1]) {
        setLoading(false);
        return showAlert(`Dip out of range (Min: ${dips[0]}, Max: ${dips[dips.length - 1]})`, "Range Error");
    }

    // --- ROBUST CALCULATION LOGIC ---
    let finalVol = 0;
    
    // 1. Check for Exact Match (Number to Number comparison)
    const exactMatch = dips.find(d => d === dipVal);
    
    if (exactMatch !== undefined) {
        // Find the string key that matches this number (handles "200" vs "200.0")
        const key = Object.keys(chart).find(k => Number(k) === dipVal);
        finalVol = chart[key];
    } else {
        // 2. Interpolation (For values like 150.5)
        const lower = dips.find((d, i) => d < dipVal && dips[i+1] > dipVal);
        const upper = dips.find(d => d > dipVal);
        
        if (lower !== undefined && upper !== undefined) {
             const k1 = Object.keys(chart).find(k => Number(k) === lower);
             const k2 = Object.keys(chart).find(k => Number(k) === upper);
             const v1 = chart[k1];
             const v2 = chart[k2];
             
             // Linear Interpolation: y = y1 + ((y2 - y1) / (x2 - x1)) * (x - x1)
             finalVol = v1 + ((v2 - v1) / (upper - lower)) * (dipVal - lower);
        }
    }

    setResult(Math.floor(finalVol).toLocaleString());
    setLoading(false); 
  };

  return (
    <div className="app-layout">
      <Navbar title="Tank Stocks" />
      <main className="main-content">
        
        {/* TANK SELECTOR GRID */}
        <div style={{display:'flex', flexWrap:'wrap', gap:10, marginBottom:20}}>
            {station?.tanks?.map(tank => (
                <button key={tank.name} 
                    className={`tank-btn ${selectedTank?.name === tank.name ? 'active' : ''}`}
                    onClick={() => {setSelectedTank(tank); setResult(null);}}
                    style={{flex: '1 0 40%', justifyContent:'center'}}
                >
                    <Cylinder size={16}/> {tank.name}
                </button>
            ))}
        </div>

        <div className="content-card animate__animated animate__fadeIn">
            <div className="card-head">
                <h3 style={{textTransform:'uppercase'}}>{selectedTank?.name || 'Loading Tanks...'}</h3>
            </div>

            <div className="input-group">
                <label>Dip Reading (cm)</label>
                <input 
                    type="number" 
                    value={dip} 
                    onChange={e=>setDip(e.target.value)} 
                    placeholder="e.g. 150.5" 
                    inputMode="decimal"
                />
            </div>
            
            <div className="grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10}}>
                <button className="secondary-btn" onClick={() => {setDip(''); setResult(null);}}>Reset</button>
                <button className="primary-btn" onClick={calculate} disabled={loading}>
                     {loading ? (
                         <><div className="spinner-mini"></div> Calculating...</>
                     ) : (
                         "Calculate"
                     )}
                </button>
            </div>

            {result && (
                <div className="theme-box pop-in" style={{marginTop:20}}>
                    <div>
                        <span className="label">Current Volume</span>
                        <div className="val">{result}<small>L</small></div>
                    </div>
                    <Droplet className="vol-icon" />
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Stocks;
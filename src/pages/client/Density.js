import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import { useSystem } from '../../context/SystemContext'; // Use SystemContext for assets and alerts
import { CheckCircle } from 'lucide-react';

const Density = () => {
  // Destructure systemAssets and showAlert from the SystemProvider
  const { systemAssets, showAlert } = useSystem(); 
  
  const [temp, setTemp] = useState('');
  const [den, setDen] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    // Safety Guard: Ensure the density table is fully synced before calculation
    if (!systemAssets || !systemAssets.density) {
        return showAlert("System assets are still syncing. Please wait a moment.", "System Busy");
    }

    if (!temp || !den) return showAlert("Please enter valid values.", "Input Required");

    setLoading(true);
    setResult(null);

    // Simulate network/calculation delay for UI feedback
    await new Promise(r => setTimeout(r, 800));

    const t = parseFloat(temp);
    const d = parseFloat(den);
    
    // ASTM 53B Logic: Rounds to nearest 0.5°C increment for table lookup
    const roundedTemp = (Math.round(t * 2) / 2).toFixed(1);
    const table = systemAssets.density;

    // Verify if the temperature exists within the table range (0-50°C)
    if (!table[roundedTemp]) {
        setLoading(false);
        return showAlert("Temperature out of range (0-50°C).", "Invalid Input");
    }

    // ASTM 53B Logic: Observed density index starts at 700 kg/m³
    const index = Math.round(d - 700);
    const val = table[roundedTemp][index];

    setLoading(false);
    
    // Final check for density range validity
    if (!val) {
        return showAlert("Density value is out of the supported range.", "Invalid Input");
    }
    
    setResult(val);
  };

  return (
    <div className="app-layout">
      <Navbar title="Density Calculator" />
      <main className="main-content">
        <div className="content-card animate__animated animate__fadeIn">
            <div className="input-group">
                <label>Observed Density</label>
                <input 
                  type="number" 
                  value={den} 
                  onChange={e => setDen(e.target.value)} 
                  placeholder="e.g. 745"
                />
            </div>
            <div className="input-group">
                <label>Temperature (°C)</label>
                <input 
                  type="number" 
                  value={temp} 
                  onChange={e => setTemp(e.target.value)} 
                  placeholder="e.g. 29.5"
                />
            </div>
            
            <div className="grid-2" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20}}>
                <button 
                  className="secondary-btn" 
                  onClick={() => {setTemp(''); setDen(''); setResult(null);}}
                >
                  Reset
                </button>
                
                <button 
                  className="primary-btn" 
                  onClick={calculate} 
                  disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="spinner-mini"></div> Calculating...
                        </>
                    ) : (
                        "Calculate"
                    )}
                </button>
            </div>

            {result && (
                <div className="result-box pop-in" style={{marginTop: 20, background: 'var(--primary-light)', padding: 20, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Density @ 15°C</span>
                        <div style={{fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)'}}>
                          {result} <small style={{fontSize: '1rem'}}>kg/m³</small>
                        </div>
                    </div>
                    <CheckCircle color="var(--primary)" size={32} />
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Density;
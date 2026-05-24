import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useStation } from '../../context/StationContext';
import { useSystem } from '../../context/SystemContext';
import { Trash2, Plus, User } from 'lucide-react';

const Staff = () => {
  const { station } = useStation();
  const { showAlert, showToast } = useSystem();
  
  const [staffList, setStaffList] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(true);

  // Helper to safely get the correct station ID
  const targetStationId = station?.station_id || station?.id;

  const fetchStaff = async () => {
    if (!targetStationId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('station_id', targetStationId)
      .order('name');
      
    if (!error) setStaffList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, [station]);

  const addStaff = async () => {
    if (!newName || !newPhone || !newPin) {
      return showAlert("Please fill all fields", "Missing Info");
    }

    if (!targetStationId) {
      return showAlert("Error: Could not identify your station ID.", "Error");
    }

    console.log("Attempting to add staff. Sending Data:", {
      station_id: targetStationId,
      name: newName,
      phone: newPhone,
      pin: newPin
    });

    const { error } = await supabase.from('staff').insert({
      station_id: targetStationId,
      name: newName,
      phone: newPhone,
      pin: newPin
    });

    if (error) {
      console.error("Supabase Error Details:", error);
      showAlert(error.message, "Error");
    } else {
      setNewName('');
      setNewPhone('');
      setNewPin('');
      showToast("Staff Added Successfully");
      fetchStaff();
    }
  };

  const removeStaff = (id, name) => {
    if (typeof showAlert === 'function') {
      showAlert(
        `Are you sure you want to remove ${name}? This action cannot be undone.`,
        "Confirm Deletion",
        async () => {
          const { error } = await supabase.from('staff').delete().eq('id', id);
          if (error) {
            showAlert(error.message, "Error");
          } else {
            showToast("Staff Member Removed");
            fetchStaff();
          }
        }
      );
    } else {
      if (window.confirm(`Remove ${name}?`)) {
        supabase.from('staff').delete().eq('id', id).then(() => fetchStaff());
      }
    }
  };

  return (
    // Locked layout to prevent body scroll
    <div className="app-layout" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Staff Management" />
      
      {/* Scrollable container - scrollbar will appear automatically when needed */}
      <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        
        <div className="content-card animate__animated animate__fadeIn">
          <h3>Add New Staff</h3>
          
          <div className="input-group" style={{marginTop: 15}}>
            <label>Staff Name</label>
            <input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Full Name" 
              autoComplete="off" 
            />
          </div>
          
          <div style={{display:'flex', gap:10}}>
            <div className="input-group" style={{flex: 1}}>
              <label>Phone / Login ID</label>
              <input 
                value={newPhone} 
                onChange={e => setNewPhone(e.target.value)} 
                placeholder="Phone Number" 
                type="tel"
                autoComplete="one-time-code" 
              />
            </div>
            
            <div className="input-group" style={{width: 100}}>
              <label>PIN</label>
              <input 
                value={newPin} 
                onChange={e => setNewPin(e.target.value)} 
                placeholder="0000" 
                type="password"
                maxLength="4"
                autoComplete="new-password" 
              />
            </div>
          </div>

          <button onClick={addStaff} className="primary-btn" style={{marginTop:5}}>
            <Plus size={18}/> Add Staff
          </button>
        </div>

        <h3 style={{marginTop:20, marginLeft:5, color:'var(--text-muted)', fontSize:'0.9rem', textTransform:'uppercase'}}>
          Active Staff Members
        </h3>

        <div className="staff-list" style={{ marginTop:10, paddingBottom: 20 }}>
          {loading ? (
            <div style={{textAlign:'center', padding:20}}><div className="spinner-mini darker"></div></div>
          ) : staffList.length === 0 ? (
            <p style={{textAlign:'center', padding:20, color:'var(--text-light)'}}>No staff members found.</p>
          ) : (
            staffList.map(s => (
              <div key={s.id} className="content-card" style={{padding:15, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', borderRadius:16}}>
                <div style={{display:'flex', gap:12, alignItems:'center'}}>
                  <div style={{background:'var(--primary-light)', padding:10, borderRadius:'50%'}}>
                    <User size={20} color="var(--primary)"/>
                  </div>
                  <div>
                    <div style={{fontWeight:700, fontSize:'1rem'}}>{s.name}</div>
                    <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>
                      ID: {s.phone} | PIN: {s.pin}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeStaff(s.id, s.name)}
                  style={{background:'none', border:'none', color:'var(--danger)', padding:10, cursor:'pointer'}}
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            ))
          )}
        </div>
        
      </main>
    </div>
  );
};

export default Staff;
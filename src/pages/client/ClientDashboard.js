import React from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import Navbar from '../../components/common/Navbar'; 
import BroadcastBanner from '../../components/common/BroadcastBanner'; 
import { triggerHaptic, playClick } from '../../utils/audio'; 
import { ImpactStyle } from '@capacitor/haptics'; 
import { Activity, Thermometer, Cylinder, FileCheck, Info, RefreshCw, FileText, UserCircle, Receipt } from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext'; 
import { useStation } from '../../context/StationContext'; 
import { useSystem } from '../../context/SystemContext'; 
import { useBroadcast } from '../../context/BroadcastContext'; 

const ClientDashboard = () => { 
  const navigate = useNavigate(); 
  const { user, role } = useAuth(); 
  const { station, loading: stationLoading, retry } = useStation(); 
  const { sysStatus } = useSystem(); 
  const { broadcast, syncToken } = useBroadcast(); 

  const handleNav = (path) => { 
    playClick(); 
    navigate(path); 
  }; 

  const handleRefresh = () => { 
    if (!stationLoading) { 
      triggerHaptic(ImpactStyle.Medium); 
      retry(); 
    } 
  }; 

  return ( 
    /* FIX APPLIED: Removed the `key` from app-layout. 
       React will safely update inner text elements when context changes without destroying the DOM,
       which completely stops the animate__fadeIn from re-triggering and flickering.
    */
    <div className="app-layout"> 
      <Navbar title="FUELMASTER" isHome={true} /> 
      
      <main className="main-content"> 
        {/* It is perfectly fine to keep the key on the banner, so the marquee animation resets smoothly */}
        <BroadcastBanner 
          key={syncToken} 
          msg={broadcast?.msg} 
          type={broadcast?.type} 
          updatedAt={broadcast?.updatedAt} 
        /> 

        {/* SYSTEM STATUS CARD */} 
        <div className="system-status-card"> 
          <div className="status-header"> 
            <div className="live-indicator" onClick={handleRefresh} style={{ cursor: 'pointer' }}> 
              <span className={`pulse-dot ${stationLoading ? 'yellow' : sysStatus.pulse}`}></span> 
              <span className="status-text" style={{ color: stationLoading ? '#f59e0b' : (sysStatus.pulse === 'green' ? 'var(--success)' : 'var(--warning)') }}> 
                {stationLoading ? 'SYNCING...' : sysStatus.text} 
              </span> 
            </div> 
            <button className={`icon-btn-refresh ${stationLoading ? 'spinning' : ''}`} onClick={handleRefresh} disabled={stationLoading}> 
              <RefreshCw size={16}/> 
            </button> 
          </div> 
          <div className="status-details"> 
            {sysStatus.checks.map((check, i) => ( 
              <div key={i} className="success-item" style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.75rem', color: (sysStatus.pulse === 'green' && !stationLoading) ? 'var(--success)' : 'var(--text-muted)' }}> 
                {check.icon} {check.label} 
              </div> 
            ))} 
          </div> 
        </div> 

        {/* WELCOME SECTION */} 
        {/* The animate__fadeIn will now ONLY run once when the user first lands on the page */}
        <div className="welcome-card animate__animated animate__fadeIn"> 
          <div className="welcome-text"> 
            <span className="sub-welcome" style={{textTransform: 'uppercase', letterSpacing: '1px'}}> 
              WELCOME, {role === 'manager' ? 'MANAGER' : (user?.name || 'STAFF')} 
            </span> 
            <h2 style={{textTransform: 'uppercase'}}>{station?.name || 'STATION'}</h2> 
            <div className="welcome-id"> ID: {user?.id} </div> 
          </div> 
          <Activity className="welcome-icon" size={48} /> 
        </div> 

        {/* APP NAVIGATION GRID */} 
        <div className="nav-grid"> 
          <button className="nav-card" onClick={() => handleNav('/density')}> 
            <div className="icon-box blue"><Thermometer /></div> 
            <span>Density</span> 
          </button> 
          
          <button className="nav-card" onClick={() => handleNav('/stocks')}> 
            <div className="icon-box orange"><Cylinder /></div> 
            <span>Stocks</span> 
          </button> 
          
          <button className="nav-card" onClick={() => handleNav('/variance')}> 
            <div className="icon-box green"><FileCheck /></div> 
            <span>Variance</span> 
          </button> 
          
          <button className="nav-card" onClick={() => handleNav('/reimbursement')}> 
            <div className="icon-box" style={{background:'#0ea5e9'}}><Receipt /></div> 
            <span style={{fontSize:'0.75rem'}}>Invoice</span> 
          </button> 
          
          <button className="nav-card" onClick={() => handleNav('/compliance')}> 
            <div className="icon-box purple" style={{background:'#8b5cf6'}}><FileText /></div> 
            <span style={{fontSize:'0.75rem'}}>Reminders</span> 
          </button> 
          
          <button className="nav-card" onClick={() => handleNav('/about')}> 
            <div className="icon-box red" style={{background:'#ef4444'}}><UserCircle /></div> 
            <span>Owner</span> 
          </button> 
        </div> 

        <div className="info-card"> 
          <h3><Info size={16}/> Anti-Piracy Warning</h3> 
          <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}> 
            Any unauthorized duplication, modification, or distribution of this software is prohibited. 
          </p> 
        </div> 

        <footer className="app-footer"> 
          <p>Made with <span className="heart">♥</span> by <strong>Velocity6097</strong></p> 
        </footer> 
      </main> 
    </div> 
  ); 
}; 

export default ClientDashboard;
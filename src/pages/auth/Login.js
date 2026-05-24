import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Droplet, Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { playClick } from '../../utils/audio';

// Import the modern styling
import '../../styles/login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    playClick(); // Audio/Haptic feedback
    
    if (!identifier || !password) {
      setError('Please enter your ID and password.');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(identifier, password);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Connection error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modern-login-container">
      
      {/* Decorative Background Element */}
      <div className="modern-bg-shape"></div>

      <div className="modern-login-card animate__animated animate__fadeInUp animate__faster">
        
        {/* Header & Logo */}
        <div className="modern-header">
          <div className="modern-logo-wrapper">
            <Droplet size={32} strokeWidth={2.5} />
          </div>
          <h1 className="modern-title">FuelMaster</h1>
          <p className="modern-subtitle">Sign in to manage your station</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="modern-error animate__animated animate__headShake">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="modern-form">
          
          {/* User ID Field */}
          <div className="modern-input-group">
            <User size={20} className="modern-icon" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="User ID"
              className="modern-input"
              disabled={isLoading}
              required
              autoCapitalize="none"
              autoComplete="username"
            />
          </div>

          {/* Password Field */}
          <div className="modern-input-group">
            <Lock size={20} className="modern-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="modern-input"
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowPassword(!showPassword);
              }}
              className="modern-pwd-toggle"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="modern-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="modern-spinner" size={20} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* EXTERNAL SIGNUP LINK SECTION */}
        <div className="modern-signup-box">
          Don't have an account? 
          {/* Change this href to your actual prebuilt HTML/CSS website URL */}
          <a 
            href="https://download-fuelmaster.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="modern-signup-link"
            onClick={playClick}
          >
            Sign up here
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;
import React, { useEffect } from 'react';
import { useStation } from './StationContext';

const THEMES = {
  'bpcl': { primary: '#fbbf24', secondary: '#005ba3', bg: '#fffbeb' }, 
  'iocl': { primary: '#f97316', secondary: '#003366', bg: '#fff7ed' }, 
  'hpcl': { primary: '#00418c', secondary: '#ed1c24', bg: '#eff6ff' }, 
  'jio': { primary: '#00a651', secondary: '#e9da32', bg: '#ecfdf5' },
  'default': { primary: '#2563eb', secondary: '#1e3a8a', bg: '#eff6ff' }
};

export const ThemeProvider = ({ children }) => {
  const { station } = useStation();

  useEffect(() => {
    // If no station loaded yet, do nothing (or set default)
    if (!station?.theme) return;

    const t = THEMES[station.theme] || THEMES['default'];
    const root = document.documentElement.style;
    
    root.setProperty('--primary', t.primary);
    root.setProperty('--primary-dark', t.secondary); 
    root.setProperty('--primary-light', t.bg);
    root.setProperty('--primary-glow', t.primary + '40');
    
  }, [station?.theme]);

  return children;
};
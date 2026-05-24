import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css'; 
import App from './App';

// Make sure this path is correct! 
// If AppProviders.js is in src/context/ folder:
import { AppProviders } from './context/AppProviders';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
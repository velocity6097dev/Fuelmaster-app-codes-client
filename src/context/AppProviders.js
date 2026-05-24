import React from 'react';
// These assume all Context files are in the same 'context' folder
import { AuthProvider } from './AuthContext';
import { StationProvider } from './StationContext';
import { SystemProvider } from './SystemContext';
import { BroadcastProvider } from './BroadcastContext';
import { ThemeProvider } from './ThemeContext';

export const AppProviders = ({ children }) => {
  return (
    <SystemProvider>
      <AuthProvider>
         <BroadcastProvider>
            <StationProvider>
               <ThemeProvider>
                  {children}
               </ThemeProvider>
            </StationProvider>
         </BroadcastProvider>
      </AuthProvider>
    </SystemProvider>
  );
};
import React, { createContext, useContext, useState } from 'react';

const XPContext = createContext();

export const XPProvider = ({ children }) => {
  const [xp, setXPState] = useState(0);

  const addXP = (amount) => {
    setXPState(prevXP => prevXP + amount);
  };

  const setXP = (amount) => {
    setXPState(amount);
  };

  const value = {
    xp,
    addXP,
    setXP
  };

  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  );
};

export const useXP = () => {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
};
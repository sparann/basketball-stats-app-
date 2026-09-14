import { createContext, useContext } from 'react';

export const UIContext = createContext(null);

/** toast(message, { type }) and confirm({ title, message, confirmLabel, destructive }) */
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};

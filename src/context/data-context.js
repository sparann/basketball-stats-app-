import { createContext, useContext } from 'react';

export const DataContext = createContext(null);

/** Players, sessions, locations, admin state and the mutations that change them. */
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

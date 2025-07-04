import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the possible roles
type Role = 'operations' | 'sales';

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  loading: boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('operations');
  const [loading, setLoading] = useState(false);
  return (
    <RoleContext.Provider value={{ role, setRole, loading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}; 
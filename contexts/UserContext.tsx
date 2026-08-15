'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getClientSessionId } from '@/lib/client-session';

interface UserContextType {
  sessionId: string;
  userId: string | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  sessionId: '',
  userId: null,
  isLoading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(() => getClientSessionId());
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/zalo/session');
      const data = await response.json();
      
      if (data.success && data.user) {
        setUserId(data.user.id);
      } else {
        setUserId(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [sessionId]);

  return (
    <UserContext.Provider value={{ sessionId, userId, isLoading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { clientSessionService } from '@/lib/ClientSessionService';

interface SessionContextType {
  savePageData: (data: any, options?: { immediate?: boolean; fallback?: boolean }) => Promise<void>;
  loadPageData: () => Promise<any>;
  saveToLocalStorage: (key: string, data: any) => void;
  loadFromLocalStorage: (key: string) => any;
  clearPageData: () => Promise<void>;
  isLoading: boolean;
  isOnline: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pathname = usePathname();
  const safePathname = pathname || '/';
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const pendingData = useRef<any>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save functionality
  const startAutoSave = useCallback(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }

    autoSaveInterval.current = setInterval(async () => {
      if (pendingData.current && hasUnsavedChanges) {
        await savePageData(pendingData.current, { immediate: false, fallback: true });
      }
    }, 30000); // Auto-save every 30 seconds
  }, [hasUnsavedChanges]);

  const stopAutoSave = useCallback(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
      autoSaveInterval.current = null;
    }
  }, []);

  // Page visibility API for saving when user switches tabs
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && pendingData.current && hasUnsavedChanges) {
        await savePageData(pendingData.current, { immediate: true, fallback: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasUnsavedChanges]);

  // Before unload handler
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && pendingData.current) {
        // Try to save synchronously
        try {
          const userId = localStorage.getItem('userId');
          if (userId) {
            // Use sendBeacon for reliable data sending
            const data = JSON.stringify({
              userId,
              page: safePathname,
              data: pendingData.current,
              timestamp: new Date().toISOString()
            });
            
            navigator.sendBeacon('/api/session/save-page-data', data);
          }
        } catch (error) {
          console.error('Error saving data before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, pathname]);

  // Start auto-save when component mounts
  useEffect(() => {
    startAutoSave();
    return () => stopAutoSave();
  }, [startAutoSave, stopAutoSave]);

  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  const loadFromLocalStorage = useCallback((key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        return parsed.data;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  }, []);

  const savePageData = async (data: any, options: { immediate?: boolean; fallback?: boolean } = {}) => {
    const { immediate = false, fallback = true } = options;
    
    try {
      if (!immediate) {
        pendingData.current = data;
        setHasUnsavedChanges(true);
        return;
      }

      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        if (fallback) {
          saveToLocalStorage(`page_data_${safePathname}`, data);
        }
        return;
      }

      try {
        await clientSessionService.savePageData(userId, safePathname, data);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        pendingData.current = null;
      } catch (error) {
        console.error('Error saving page data to server:', error);
        if (fallback) {
          saveToLocalStorage(`page_data_${safePathname}`, data);
          console.log('Data saved to localStorage as fallback');
        }
        throw error;
      }
    } catch (error) {
      console.error('Error saving page data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPageData = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      
      // Try to load from server first
      if (userId) {
        try {
          const serverData = await clientSessionService.loadPageData(userId, safePathname);
          if (serverData) {
            setLastSaved(new Date());
            return serverData;
          }
        } catch (error) {
          console.error('Error loading from server:', error);
        }
      }

      // Fallback to localStorage
      const localData = loadFromLocalStorage(`page_data_${safePathname}`);
      if (localData) {
        console.log('Loaded data from localStorage fallback');
        return localData;
      }

      return null;
    } catch (error) {
      console.error('Error loading page data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearPageData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        await clientSessionService.savePageData(userId, safePathname, null);
      }
      localStorage.removeItem(`page_data_${safePathname}`);
      setHasUnsavedChanges(false);
      pendingData.current = null;
    } catch (error) {
      console.error('Error clearing page data:', error);
    }
  };

  // Auto-save page data on unmount
  useEffect(() => {
    return () => {
      if (pendingData.current && hasUnsavedChanges) {
        // Synchronous save attempt
        const userId = localStorage.getItem('userId');
        if (userId) {
          try {
            const data = JSON.stringify({
              userId,
              page: safePathname,
              data: pendingData.current,
              timestamp: new Date().toISOString()
            });
            navigator.sendBeacon('/api/session/save-page-data', data);
          } catch (error) {
            console.error('Error in cleanup save:', error);
          }
        }
      }
    };
  }, [pathname, hasUnsavedChanges]);

  const value = {
    savePageData,
    loadPageData,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearPageData,
    isLoading,
    isOnline,
    hasUnsavedChanges,
    lastSaved
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export default SessionProvider;

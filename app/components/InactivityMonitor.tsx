'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface InactivityMonitorProps {
  inactivityTimeout?: number; // in milliseconds (default: 5 minutes)
  backgroundTimeout?: number; // in milliseconds (default: 5 minutes)
}

export default function InactivityMonitor({
  inactivityTimeout = 5 * 60 * 1000, // 5 minutes default
  backgroundTimeout = 5 * 60 * 1000, // 5 minutes default
}: InactivityMonitorProps) {
  const pathname = usePathname();
  const lastActivityTime = useRef<number>(Date.now());
  const backgroundStartTime = useRef<number | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimer = useRef<NodeJS.Timeout | null>(null);

  // Check if current path is a public route (should not trigger logout)
  const isPublicRoute = useCallback(() => {
    if (!pathname) return true;
    const publicRoutes = [
      '/login',
      '/register',
      '/',
      '/about-us',
      '/pricing',
      '/contact',
      '/terms-and-conditions',
      '/privacy-policy',
      '/super-admin-login',
    ];
    return publicRoutes.includes(pathname) || pathname.startsWith('/invite');
  }, [pathname]);

  // Function to clear auth and redirect
  const handleLogout = useCallback(() => {
    // Only logout if not on a public route
    if (isPublicRoute()) {
      return;
    }

    // Clear auth token cookie
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    
    // Clear localStorage items related to auth
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    // Attempt to call logout API (fire-and-forget, won't block redirect)
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignore errors since we're redirecting anyway
    });
    
    // Refresh the page and redirect to home
    window.location.href = '/';
  }, [isPublicRoute]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    lastActivityTime.current = Date.now();

    // Only set timer if not on public route
    if (!isPublicRoute()) {
      inactivityTimer.current = setTimeout(() => {
        handleLogout();
      }, inactivityTimeout);
    }
  }, [inactivityTimeout, handleLogout, isPublicRoute]);

  // Handle visibility change (tab becomes hidden/visible)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab became hidden - record the time
      backgroundStartTime.current = Date.now();
      
      // Set a timer to logout if tab remains hidden for too long
      if (backgroundTimer.current) {
        clearTimeout(backgroundTimer.current);
      }

      if (!isPublicRoute()) {
        backgroundTimer.current = setTimeout(() => {
          handleLogout();
        }, backgroundTimeout);
      }
    } else {
      // Tab became visible again
      if (backgroundStartTime.current !== null) {
        const timeInBackground = Date.now() - backgroundStartTime.current;
        
        // If tab was in background for more than the timeout, logout
        if (timeInBackground >= backgroundTimeout && !isPublicRoute()) {
          handleLogout();
          return;
        }
        
        backgroundStartTime.current = null;
      }

      // Clear background timer
      if (backgroundTimer.current) {
        clearTimeout(backgroundTimer.current);
        backgroundTimer.current = null;
      }

      // Reset inactivity timer when tab becomes visible
      resetInactivityTimer();
    }
  }, [backgroundTimeout, handleLogout, resetInactivityTimer, isPublicRoute]);

  // Track user activity events
  const handleActivity = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Set up event listeners for user activity
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Also listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize the inactivity timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      if (backgroundTimer.current) {
        clearTimeout(backgroundTimer.current);
      }
    };
  }, [handleActivity, handleVisibilityChange, resetInactivityTimer]);

  // Reset timer when pathname changes (user navigates)
  useEffect(() => {
    resetInactivityTimer();
  }, [pathname, resetInactivityTimer]);

  // This component doesn't render anything
  return null;
}

import { useState, useEffect, useRef } from 'react';

/**
 * Hook that ensures a loading state persists for at least the specified minimum time
 * @param isLoading - The loading state from parent component
 * @param minDisplayTime - Minimum time in milliseconds (default: 3000ms = 3 seconds)
 * @returns A boolean indicating whether the loading state should be displayed
 */
export function useMinimumDisplayTime(
  isLoading: boolean,
  minDisplayTime: number = 3000
): boolean {
  const [shouldShow, setShouldShow] = useState(false);
  const loadingStartTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start loading - record the time
      if (loadingStartTimeRef.current === null) {
        loadingStartTimeRef.current = Date.now();
        setShouldShow(true);
      }
    } else {
      // Loading finished - check if minimum time has elapsed
      if (loadingStartTimeRef.current !== null) {
        const elapsed = Date.now() - loadingStartTimeRef.current;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);

        if (remainingTime > 0) {
          // Still need to wait before hiding
          timeoutRef.current = setTimeout(() => {
            setShouldShow(false);
            loadingStartTimeRef.current = null;
          }, remainingTime);
        } else {
          // Minimum time has already passed, can hide immediately
          setShouldShow(false);
          loadingStartTimeRef.current = null;
        }
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, minDisplayTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return shouldShow || isLoading;
}

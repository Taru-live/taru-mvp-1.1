'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showInDevelopment?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  showInDevelopment = true,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const startTimeRef = React.useRef<number>(Date.now());
  const renderStartRef = React.useRef<number>(Date.now());

  // Check if we should show the monitor
  const shouldShow = React.useMemo(() => {
    if (!enabled) return false;
    if (process.env.NODE_ENV === 'development' && showInDevelopment) return true;
    return false;
  }, [enabled, showInDevelopment]);

  React.useEffect(() => {
    if (!shouldShow) return;

    const measurePerformance = () => {
      const now = Date.now();
      const loadTime = now - startTimeRef.current;
      const renderTime = now - renderStartRef.current;

      const performanceMetrics: PerformanceMetrics = {
        loadTime,
        renderTime
      };

      // Get Web Vitals if available
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = window.performance.getEntriesByType('paint');

        if (navigation) {
          performanceMetrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        }

        // First Contentful Paint
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          performanceMetrics.fcp = fcp.startTime;
        }

        // Memory usage (if available)
        if ('memory' in window.performance) {
          const memory = (window.performance as any).memory;
          performanceMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        }
      }

      setMetrics(performanceMetrics);
      if (onMetricsUpdate) {
        onMetricsUpdate(performanceMetrics);
      }
    };

    // Measure after component mounts
    const timeoutId = setTimeout(measurePerformance, 100);

    // Measure Web Vitals
    if (typeof window !== 'undefined') {
      // Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setMetrics(prev => prev ? { ...prev, lcp: lastEntry.startTime } : null);
        }
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observation not supported');
      }

      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
      };
    }

    return () => clearTimeout(timeoutId);
  }, [shouldShow, onMetricsUpdate]);

  const getPerformanceGrade = (loadTime: number): { grade: string; color: string } => {
    if (loadTime < 1000) return { grade: 'A', color: 'text-green-600' };
    if (loadTime < 2000) return { grade: 'B', color: 'text-blue-600' };
    if (loadTime < 3000) return { grade: 'C', color: 'text-yellow-600' };
    if (loadTime < 5000) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const formatTime = (time: number): string => {
    if (time < 1000) return `${time.toFixed(0)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatMemory = (memory: number): string => {
    return `${memory.toFixed(1)}MB`;
  };

  if (!shouldShow || !metrics) return null;

  const { grade, color } = getPerformanceGrade(metrics.loadTime);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm text-white rounded-lg shadow-lg border border-gray-600 overflow-hidden"
        initial={{ opacity: 0, x: -100, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Header */}
        <div 
          className="px-3 py-2 bg-gray-800 cursor-pointer flex items-center justify-between"
          onClick={() => setIsVisible(!isVisible)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Performance</span>
            <span className={`text-sm font-bold ${color}`}>{grade}</span>
          </div>
          <motion.div
            animate={{ rotate: isVisible ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>

        {/* Metrics */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              className="p-3 space-y-2 text-xs"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-700 rounded px-2 py-1">
                  <div className="text-gray-300">Load Time</div>
                  <div className={`font-mono ${color}`}>
                    {formatTime(metrics.loadTime)}
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded px-2 py-1">
                  <div className="text-gray-300">Render</div>
                  <div className="font-mono text-blue-400">
                    {formatTime(metrics.renderTime)}
                  </div>
                </div>

                {metrics.fcp && (
                  <div className="bg-gray-700 rounded px-2 py-1">
                    <div className="text-gray-300">FCP</div>
                    <div className="font-mono text-purple-400">
                      {formatTime(metrics.fcp)}
                    </div>
                  </div>
                )}

                {metrics.lcp && (
                  <div className="bg-gray-700 rounded px-2 py-1">
                    <div className="text-gray-300">LCP</div>
                    <div className="font-mono text-orange-400">
                      {formatTime(metrics.lcp)}
                    </div>
                  </div>
                )}

                {metrics.memoryUsage && (
                  <div className="bg-gray-700 rounded px-2 py-1 col-span-2">
                    <div className="text-gray-300">Memory Usage</div>
                    <div className="font-mono text-yellow-400">
                      {formatMemory(metrics.memoryUsage)}
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Tips */}
              <div className="pt-2 border-t border-gray-600">
                <div className="text-gray-300 mb-1">Tips:</div>
                <div className="text-gray-400 space-y-1">
                  {metrics.loadTime > 3000 && (
                    <div>• Consider code splitting</div>
                  )}
                  {metrics.memoryUsage && metrics.memoryUsage > 50 && (
                    <div>• High memory usage detected</div>
                  )}
                  {metrics.lcp && metrics.lcp > 2500 && (
                    <div>• Optimize largest content element</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for using performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  const startMeasurement = React.useCallback(() => {
    const startTime = Date.now();
    
    return {
      end: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const newMetrics: PerformanceMetrics = {
          loadTime: duration,
          renderTime: duration
        };
        
        setMetrics(newMetrics);
        return newMetrics;
      }
    };
  }, []);

  const measureAsync = React.useCallback(async <T,>(
    asyncOperation: () => Promise<T>,
    label?: string
  ): Promise<T> => {
    const measurement = startMeasurement();
    
    try {
      const result = await asyncOperation();
      const metrics = measurement.end();
      
      // Log performance metrics for monitoring (both dev and prod)
      if (label) {
        console.log(`[Performance] ${label}:`, metrics);
      }
      
      return result;
    } catch (error) {
      measurement.end();
      throw error;
    }
  }, [startMeasurement]);

  return {
    metrics,
    startMeasurement,
    measureAsync
  };
};

export default PerformanceMonitor;

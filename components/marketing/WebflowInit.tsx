'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Component to handle Webflow initialization on route changes
function WebflowInit() {
  const pathname = usePathname();

  useEffect(() => {
    // Fallback: Show content if Webflow takes too long
    const showContentFallback = () => {
      const hiddenElements = document.querySelectorAll('[data-w-id]');
      hiddenElements.forEach(el => {
        const style = (el as HTMLElement).getAttribute('style') || '';
        if (style.includes('opacity:0') || style.includes('opacity: 0')) {
          // Make visible immediately
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.transition = 'opacity 0.5s ease';
        }
      });
      // Also ensure body is marked as ready
      document.body.classList.add('webflow-ready');
    };

    // Initialize Webflow animations
    const initWebflow = () => {
      if (typeof window !== 'undefined' && (window as any).Webflow && (window as any).jQuery) {
        try {
          // Remove ready class to reset state
          document.body.classList.remove('webflow-ready');
          
          // Destroy existing Webflow instance
          if ((window as any).Webflow.destroy) {
            (window as any).Webflow.destroy();
          }
          
          // Wait for DOM to be fully rendered
          setTimeout(() => {
            // Reinitialize Webflow
            if ((window as any).Webflow.ready) {
              (window as any).Webflow.ready();
            }
            
            // Initialize interactions (ix2) - handles scroll animations
            if ((window as any).Webflow.require && (window as any).Webflow.require('ix2')) {
              (window as any).Webflow.require('ix2').init();
            }
            
            // Force reflow to ensure DOM is ready
            void document.body.offsetHeight;
            
            // Trigger scroll events to activate animations
            requestAnimationFrame(() => {
              // Scroll to top first
              window.scrollTo(0, 0);
              
              // Trigger events to help Webflow detect elements
              window.dispatchEvent(new Event('scroll'));
              window.dispatchEvent(new Event('resize'));
              
              // Trigger scroll again after a moment to ensure animations activate
              setTimeout(() => {
                window.dispatchEvent(new Event('scroll'));
                
                // Mark as ready after animations should have started
                setTimeout(() => {
                  document.body.classList.add('webflow-ready');
                }, 200);
              }, 150);
            });
          }, 100);
        } catch (e) {
          console.log('Webflow initialization error:', e);
          showContentFallback();
        }
      } else {
        showContentFallback();
      }
    };

    // Wait for dependencies - ensure both jQuery and Webflow are fully loaded
    let checkCount = 0;
    const maxChecks = 60; // 3 seconds max wait
    
    const checkDependencies = setInterval(() => {
      checkCount++;
      const hasJQuery = typeof window !== 'undefined' && 
                       (window as any).jQuery && 
                       typeof (window as any).jQuery === 'function';
      const hasWebflow = typeof window !== 'undefined' && 
                        (window as any).Webflow && 
                        typeof (window as any).Webflow === 'object';
      
      if (hasJQuery && hasWebflow) {
        clearInterval(checkDependencies);
        // Add small delay to ensure everything is ready
        setTimeout(() => {
          initWebflow();
        }, 100);
      } else if (checkCount >= maxChecks) {
        // Timeout: show content anyway
        clearInterval(checkDependencies);
        console.log('Webflow dependencies timeout. jQuery:', hasJQuery, 'Webflow:', hasWebflow);
        showContentFallback();
      }
    }, 50);

    return () => {
      clearInterval(checkDependencies);
    };
  }, [pathname]);

  return null;
}

export default WebflowInit;

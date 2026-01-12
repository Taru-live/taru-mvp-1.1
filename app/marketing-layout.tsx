'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import GlobalStyles from '../components/marketing/GlobalStyles';
import WebflowInit from '../components/marketing/WebflowInit';
import FloatingButtons from '../components/marketing/FloatingButtons';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add Webflow data attributes to html element for marketing pages
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-wf-page', '69623f13dfa44f1ebfcc53f2');
      document.documentElement.setAttribute('data-wf-site', '69623f12dfa44f1ebfcc5334');
      
      // Load Webflow CSS dynamically
      const loadCSS = (href: string) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.type = 'text/css';
        document.head.appendChild(link);
        return link;
      };
      
      const normalizeLink = loadCSS('/css/normalize.css');
      const webflowLink = loadCSS('/css/webflow.css');
      const taruLink = loadCSS('/css/taru-home-page.webflow.css');
      
      return () => {
        // Clean up on unmount
        document.documentElement.removeAttribute('data-wf-page');
        document.documentElement.removeAttribute('data-wf-site');
        normalizeLink.remove();
        webflowLink.remove();
        taruLink.remove();
      };
    }
  }, []);

  return (
    <>
      {/* Webflow Scripts - Only loaded on marketing pages */}
      {/* Load jQuery first - must be before webflow.js */}
      <Script 
        src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=69623f12dfa44f1ebfcc5334" 
        integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" 
        crossOrigin="anonymous" 
        strategy="beforeInteractive"
        onLoad={() => {
          // Ensure jQuery is available globally
          if (typeof window !== 'undefined' && (window as any).jQuery) {
            (window as any).$ = (window as any).jQuery;
          }
        }}
      />
      
      {/* Webfont loader */}
      <Script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" strategy="beforeInteractive" />
      <Script id="webfont-config" strategy="beforeInteractive" dangerouslySetInnerHTML={{
        __html: `
if (typeof WebFont !== 'undefined') {
  WebFont.load({  google: {    families: ["Inter:300,regular,500,600,700"]  }});
}
        `
      }} />
      
      {/* Add w-mod-js class early */}
      <Script id="webflow-classes" strategy="beforeInteractive" dangerouslySetInnerHTML={{
        __html: `
if (typeof document !== 'undefined') {
  const html = document.documentElement;
  html.className += ' w-mod-js';
  // Check for touch support
  if ('ontouchstart' in window || 
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)) {
    html.className += ' w-mod-touch';
  }
}
        `
      }} />
      
      {/* Load webflow.js after jQuery is confirmed ready */}
      <Script 
        id="webflow-loader"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  function checkAndLoadWebflow() {
    // Check if jQuery is loaded and is a function
    if (typeof window === 'undefined' || typeof window.jQuery === 'undefined' || typeof window.jQuery !== 'function') {
      setTimeout(checkAndLoadWebflow, 50);
      return;
    }
    
    // jQuery is ready, load webflow.js
    if (document.querySelector('script[src="/js/webflow.js"]')) {
      return; // Already loading or loaded
    }
    
    const script = document.createElement('script');
    script.src = '/js/webflow.js';
    script.async = false; // Load synchronously after jQuery
    script.onload = function() {
      // Webflow loaded, let WebflowInit handle initialization
    };
    script.onerror = function() {
      console.error('Failed to load webflow.js');
    };
    document.head.appendChild(script);
  }
  
  // Start checking once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndLoadWebflow);
  } else {
    checkAndLoadWebflow();
  }
})();
          `
        }}
      />
      
      {/* Lazy load boosters slider */}
      <Script src="https://cdn.jsdelivr.net/npm/@flowbase-co/boosters-before-after-slider@1.0.3/dist/before-after-slider.js" integrity="sha384-/RSm0Qu1NXGqCSO4ctpC2/GhhnzNR+54P5yc578u1mPFLEozEnAhXVdCg1CdEO0F" crossOrigin="anonymous" strategy="lazyOnload" />
      
      <WebflowInit />
      <div className="page-wrapper navbar-on-page">
        <GlobalStyles />
        <Navbar />
        <div className="main-wrapper max-width-full">
          {children}
        </div>
        <Footer />
        <FloatingButtons />
      </div>
    </>
  );
}

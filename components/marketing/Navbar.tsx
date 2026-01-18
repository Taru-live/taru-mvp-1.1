'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close menu when route changes (Webflow way)
    if (navRef.current && navRef.current.classList.contains('w--open')) {
      // Trigger click on button to close (Webflow handles this)
      const button = navRef.current.querySelector('.w-nav-button');
      if (button) {
        (button as HTMLElement).click();
      }
    }
  }, [pathname]);

  const isActive = (path: string) => {
    return pathname === path ? 'w--current' : '';
  };

  return (
    <div 
      ref={navRef}
      data-collapse="medium" 
      data-animation="default" 
      data-duration="400" 
      data-w-id="c718d996-64e2-fd48-91d6-4ec75582b6a9"
      data-easing="ease" 
      data-easing2="ease" 
      role="banner" 
      className="navbar-component w-nav"
    >
      <div className="navbar-container">
        <Link href="/" className={`navbar-logo-link w-nav-brand ${isActive('/')}`}>
          <Image src="/images/taru-logo-final-1.png" width={120} height={40} alt="Taru Logo" className="navbar-logo" />
        </Link>
        <nav role="navigation" className="navbar-menu w-nav-menu">
          <div className="navbar-menu-link-wrapper">
            <Link href="/about-us" className={`navbar-link w-nav-link ${isActive('/about-us')}`}>
              About Us
            </Link>
            <Link href="/pricing" className={`navbar-link w-nav-link ${isActive('/pricing')}`}>
              Pricing
            </Link>
            <Link href="/contact" className={`navbar-link w-nav-link ${isActive('/contact')}`}>
              Contact Us
            </Link>
            <div className="navbar-button-wrapper">
              <Link href="/login" className="button is-navbar logn w-inline-block">
                <div className="button-text-item color-change">Login</div>
              </Link>
              <Link href="/register" className="button is-navbar w-inline-block">
                <div className="button-text-item">Register</div>
              </Link>
            </div>
          </div>
        </nav>
        <div className="navbar-menu-button w-nav-button">
          <div className="menu-icon">
            <div className="menu-icon-line-top"></div>
            <div className="menu-icon-line-middle">
              <div className="menu-icon-line-middle-inner"></div>
            </div>
            <div className="menu-icon-line-bottom"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

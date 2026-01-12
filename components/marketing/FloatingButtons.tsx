'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FloatingButtons = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const getHomeButtonBottom = () => {
    if (isVisible) {
      return isMobile ? 75 : 90;
    }
    return isMobile ? 15 : 20;
  };

  return (
    <>
      {/* Navigate to Home Button - Always visible if not on home page */}
      {pathname !== '/' && (
        <Link
          href="/"
          className="floating-button floating-button-home"
          style={{
            bottom: `${getHomeButtonBottom()}px`
          }}
          aria-label="Navigate to Home"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 22V12H15V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}

      {/* Scroll to Top Button - Visible when scrolled down */}
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="floating-button floating-button-scroll"
          aria-label="Scroll to Top"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 15L12 9L6 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <style jsx>{`
        .floating-button {
          position: fixed;
          right: 20px;
          width: 50px;
          height: 50px;
          background-color: #4d65ff;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(77, 101, 255, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
          text-decoration: none;
        }

        .floating-button:hover {
          background-color: #3d55ef;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(77, 101, 255, 0.5);
        }

        .floating-button:active {
          transform: translateY(0);
        }

        .floating-button-scroll {
          bottom: 20px;
        }

        @media (max-width: 767px) {
          .floating-button {
            width: 45px;
            height: 45px;
            right: 15px;
          }

          .floating-button-scroll {
            bottom: 15px;
          }
        }
      `}</style>
    </>
  );
};

export default FloatingButtons;

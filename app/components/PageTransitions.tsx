'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

// Page Transition Wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: 'slide' | 'fade' | 'scale' | 'rotate' | 'curtain' | 'wave' | 'morph';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  transitionType = 'slide',
  direction = 'right',
  duration = 0.5
}) => {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const getTransitionVariants = () => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }

    switch (transitionType) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 }
        };
      
      case 'rotate':
        return {
          initial: { opacity: 0, rotate: -10 },
          animate: { opacity: 1, rotate: 0 },
          exit: { opacity: 0, rotate: 10 }
        };
      
      case 'curtain':
        return {
          initial: { clipPath: 'inset(0 100% 0 0)' },
          animate: { clipPath: 'inset(0 0% 0 0)' },
          exit: { clipPath: 'inset(0 0 0 100%)' }
        };
      
      case 'wave':
        return {
          initial: { 
            clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)'
          },
          animate: { 
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)'
          },
          exit: { 
            clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'
          }
        };
      
      case 'morph':
        return {
          initial: { 
            borderRadius: '50%',
            scale: 0,
            opacity: 0
          },
          animate: { 
            borderRadius: '0%',
            scale: 1,
            opacity: 1
          },
          exit: { 
            borderRadius: '50%',
            scale: 0,
            opacity: 0
          }
        };
      
      default: // slide
        const slideVariants = {
          left: { x: '-100%' },
          right: { x: '100%' },
          up: { y: '-100%' },
          down: { y: '100%' }
        };
        
        return {
          initial: slideVariants[direction],
          animate: { x: 0, y: 0 },
          exit: slideVariants[direction === 'left' ? 'right' : direction === 'right' ? 'left' : direction === 'up' ? 'down' : 'up']
        };
    }
  };

  const variants = getTransitionVariants();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className={`${className}`}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{
          duration,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Staggered Container for child animations
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  initialDelay = 0
}) => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};

// Individual stagger item
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'fadeUp' | 'fadeIn' | 'scale' | 'slideLeft' | 'slideRight';
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  animationType = 'fadeUp'
}) => {
  const getVariants = () => {
    switch (animationType) {
      case 'fadeIn':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 }
        };
      case 'slideLeft':
        return {
          hidden: { opacity: 0, x: -30 },
          visible: { opacity: 1, x: 0 }
        };
      case 'slideRight':
        return {
          hidden: { opacity: 0, x: 30 },
          visible: { opacity: 1, x: 0 }
        };
      default: // fadeUp
        return {
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 }
        };
    }
  };

  return (
    <motion.div
      className={className}
      variants={getVariants()}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Route-specific transition wrapper
export const RouteTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  const getTransitionForRoute = (path: string) => {
    if (path.includes('/dashboard')) {
      return { type: 'slide', direction: 'left' as const };
    }
    if (path.includes('/login') || path.includes('/register')) {
      return { type: 'scale', direction: 'right' as const };
    }
    if (path.includes('/modules')) {
      return { type: 'fade', direction: 'up' as const };
    }
    return { type: 'slide', direction: 'right' as const };
  };

  const transition = getTransitionForRoute(pathname || '/');

  return (
    <PageTransition 
      transitionType={transition.type as any} 
      direction={transition.direction}
      duration={0.4}
    >
      {children}
    </PageTransition>
  );
};

// Loading transition component
interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  transitionDuration?: number;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  isLoading,
  children,
  loadingComponent,
  transitionDuration = 0.3
}) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: transitionDuration }}
        >
          {loadingComponent}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: transitionDuration }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Modal transition wrapper
interface ModalTransitionProps {
  isOpen: boolean;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
  backdropClassName?: string;
  animationType?: 'scale' | 'slide' | 'fade' | 'bounce';
}

export const ModalTransition: React.FC<ModalTransitionProps> = ({
  isOpen,
  children,
  onClose,
  className = '',
  backdropClassName = '',
  animationType = 'scale'
}) => {
  const getModalVariants = () => {
    switch (animationType) {
      case 'slide':
        return {
          hidden: { y: '100%', opacity: 0 },
          visible: { y: '0%', opacity: 1 }
        };
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'bounce':
        return {
          hidden: { scale: 0.3, opacity: 0 },
          visible: { 
            scale: 1, 
            opacity: 1,
            transition: {
              type: "spring" as const,
              stiffness: 300,
              damping: 20
            }
          }
        };
      default: // scale
        return {
          hidden: { scale: 0.8, opacity: 0 },
          visible: { scale: 1, opacity: 1 }
        };
    }
  };

  const modalVariants = getModalVariants();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={`fixed inset-0 bg-black/50 z-40 ${backdropClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Scroll-triggered animations
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale';
  threshold?: number;
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  animationType = 'fadeUp',
  threshold = 0.1,
  delay = 0
}) => {
  const ref = React.useRef(null);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const getVariants = () => {
    switch (animationType) {
      case 'fadeIn':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'slideLeft':
        return {
          hidden: { opacity: 0, x: -50 },
          visible: { opacity: 1, x: 0 }
        };
      case 'slideRight':
        return {
          hidden: { opacity: 0, x: 50 },
          visible: { opacity: 1, x: 0 }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 }
        };
      default: // fadeUp
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 }
        };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getVariants()}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

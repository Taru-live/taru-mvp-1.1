'use client';

import React from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

// Typewriter Effect Component
interface TypewriterProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
}

export const TypewriterText: React.FC<TypewriterProps> = ({
  text,
  delay = 0,
  speed = 0.05,
  className = '',
  onComplete,
  cursor = true
}) => {
  const [displayText, setDisplayText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [showCursor, setShowCursor] = React.useState(cursor);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      } else {
        setShowCursor(false);
        if (onComplete) onComplete();
      }
    }, currentIndex === 0 ? delay * 1000 : speed * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay, speed, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && (
        <motion.span
          className="inline-block"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          |
        </motion.span>
      )}
    </span>
  );
};

// Staggered Text Animation
interface StaggeredTextProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  animationType?: 'fadeUp' | 'fadeIn' | 'scale' | 'rotate' | 'slideLeft' | 'slideRight';
}

export const StaggeredText: React.FC<StaggeredTextProps> = ({
  text,
  className = '',
  delay = 0,
  staggerDelay = 0.03,
  animationType = 'fadeUp'
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
      case 'rotate':
        return {
          hidden: { opacity: 0, rotate: -10 },
          visible: { opacity: 1, rotate: 0 }
        };
      case 'slideLeft':
        return {
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 }
        };
      case 'slideRight':
        return {
          hidden: { opacity: 0, x: 20 },
          visible: { opacity: 1, x: 0 }
        };
      default: // fadeUp
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        };
    }
  };

  const variants = getVariants();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay
      }
    }
  };

  const words = text.split(' ');

  return (
    <motion.span
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={variants}
          className="inline-block"
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          {word}{index < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Character by Character Animation
interface CharacterAnimationProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  animationType?: 'bounce' | 'wave' | 'flip' | 'glow';
}

export const CharacterAnimation: React.FC<CharacterAnimationProps> = ({
  text,
  className = '',
  delay = 0,
  staggerDelay = 0.1,
  animationType = 'bounce'
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const getVariants = () => {
    switch (animationType) {
      case 'wave':
        return {
          hidden: { y: 0 },
          visible: { 
            y: [0, -10, 0],
            transition: { duration: 0.6, ease: "easeInOut" as const }
          }
        };
      case 'flip':
        return {
          hidden: { rotateY: 0 },
          visible: { 
            rotateY: [0, 180, 360],
            transition: { duration: 0.8, ease: "easeInOut" as const }
          }
        };
      case 'glow':
        return {
          hidden: { textShadow: "0 0 0px rgba(124, 58, 237, 0)" },
          visible: { 
            textShadow: [
              "0 0 0px rgba(124, 58, 237, 0)",
              "0 0 20px rgba(124, 58, 237, 0.8)",
              "0 0 0px rgba(124, 58, 237, 0)"
            ],
            transition: { duration: 1, ease: "easeInOut" as const }
          }
        };
      default: // bounce
        return {
          hidden: { y: 0 },
          visible: { 
            y: [0, -15, 0],
            transition: { duration: 0.5, ease: "easeOut" as const }
          }
        };
    }
  };

  const variants = getVariants();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay
      }
    }
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={variants}
          className="inline-block"
          style={{ transformOrigin: 'center' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Reveal Text Animation (sliding mask effect)
interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className = '',
  delay = 0,
  direction = 'right'
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  const getClipPath = () => {
    switch (direction) {
      case 'left':
        return {
          hidden: 'inset(0 0 0 100%)',
          visible: 'inset(0 0 0 0%)'
        };
      case 'up':
        return {
          hidden: 'inset(100% 0 0 0)',
          visible: 'inset(0% 0 0 0)'
        };
      case 'down':
        return {
          hidden: 'inset(0 0 100% 0)',
          visible: 'inset(0 0 0% 0)'
        };
      default: // right
        return {
          hidden: 'inset(0 100% 0 0)',
          visible: 'inset(0 0% 0 0)'
        };
    }
  };

  const clipPath = getClipPath();

  return (
    <div ref={ref} className="relative inline-block overflow-hidden">
      <motion.span
        className={className}
        initial={{ clipPath: clipPath.hidden }}
        animate={isInView ? { clipPath: clipPath.visible } : { clipPath: clipPath.hidden }}
        transition={{ duration: 0.8, delay, ease: "easeInOut" as const }}
      >
        {text}
      </motion.span>
    </div>
  );
};

// Morphing Text Animation
interface MorphingTextProps {
  texts: string[];
  className?: string;
  interval?: number;
  animationDuration?: number;
}

export const MorphingText: React.FC<MorphingTextProps> = ({
  texts,
  className = '',
  interval = 3000,
  animationDuration = 0.5
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <div className="relative inline-block">
      {texts.map((text, index) => (
        <motion.span
          key={index}
          className={`absolute top-0 left-0 ${className}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: index === currentIndex ? 1 : 0,
            y: index === currentIndex ? 0 : 20
          }}
          transition={{ duration: animationDuration, ease: "easeInOut" as const }}
        >
          {text}
        </motion.span>
      ))}
      {/* Invisible text for layout */}
      <span className={`opacity-0 ${className}`}>
        {texts.reduce((a, b) => a.length > b.length ? a : b)}
      </span>
    </div>
  );
};

// Gradient Text Animation
interface GradientTextProps {
  text: string;
  className?: string;
  colors?: string[];
  speed?: number;
}

export const GradientText: React.FC<GradientTextProps> = ({
  text,
  className = '',
  colors = ['#6D18CE', '#8B5CF6', '#A855F7', '#C084FC'],
  speed = 3
}) => {
  return (
    <motion.span
      className={`bg-gradient-to-r bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(45deg, ${colors.join(', ')})`,
        backgroundSize: '300% 300%'
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "linear" as const
      }}
    >
      {text}
    </motion.span>
  );
};

// Text with floating letters effect
interface FloatingTextProps {
  text: string;
  className?: string;
  intensity?: number;
}

export const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  className = '',
  intensity = 5
}) => {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          className="inline-block"
          animate={{
            y: [0, -intensity, 0],
            rotate: [0, Math.random() * 2 - 1, 0]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut" as const
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

// Hook for scroll-triggered text animations
export const useScrollAnimation = (threshold = 0.1) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: `-${threshold * 100}% 0px -${threshold * 100}% 0px` as any 
  });
  const controls = useAnimation();

  React.useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return { ref, controls, isInView };
};

# Home Page Context

**Path:** `/`  
**File:** `app/page.tsx`

## Purpose
The landing page for the Taru educational platform. Serves as the main entry point for visitors and provides an overview of the platform's features, benefits, and value proposition.

## Key Features
- **Navigation Bar**: Fixed header with links to About Us, Pricing, Contact, Login, and Register
- **Hero Section**: Main value proposition and call-to-action
- **Feature Showcase**: Highlights platform capabilities
- **Scroll Animations**: Intersection Observer-based fade-in animations for enhanced UX
- **Responsive Design**: Mobile-friendly with hamburger menu for smaller screens

## User Access
- **Public**: Accessible to all visitors (no authentication required)
- **Navigation**: Links to registration, login, and informational pages

## Dependencies
- Next.js Image component for optimized images
- Framer Motion for animations
- ScrollAnimations component for scroll-based effects
- Webflow images from `/public/webflow-images/`

## Related Pages
- `/about-us` - About Us page
- `/pricing` - Pricing information
- `/contact` - Contact form
- `/login` - User login
- `/register` - User registration

## State Management
- Local state for mobile menu toggle (`isMenuOpen`)
- No persistent state or session management

## Notes
- Uses client-side rendering (`'use client'`)
- Implements scroll-based animations on mount
- Logo image path: `/webflow-images/taru-logo-final-1.png`

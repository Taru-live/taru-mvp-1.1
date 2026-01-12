# About Us Page Context

**Path:** `/about-us`  
**File:** `app/about-us/page.tsx`

## Purpose
Informational page that provides details about the Taru platform, its mission, vision, and team. Helps visitors understand what the platform offers and why they should choose it.

## Key Features
- **Company Information**: Mission, vision, and values
- **Team Section**: Information about the team behind Taru
- **Scroll Animations**: Intersection Observer-based animations
- **Scroll to Top Button**: Appears after scrolling 300px
- **Responsive Navigation**: Mobile-friendly menu system

## User Access
- **Public**: Accessible to all visitors (no authentication required)

## Dependencies
- Next.js Image component
- Framer Motion for animations
- ScrollAnimations component
- Webflow images

## Related Pages
- `/` - Home page
- `/pricing` - Pricing information
- `/contact` - Contact form

## State Management
- Local state for mobile menu toggle
- Scroll position tracking for "scroll to top" button visibility

## Notes
- Uses client-side rendering (`'use client'`)
- Implements smooth scroll-to-top functionality

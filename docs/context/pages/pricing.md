# Pricing Page Context

**Path:** `/pricing`  
**File:** `app/pricing/page.tsx`

## Purpose
Displays pricing plans and subscription options for the Taru platform. Helps potential customers understand pricing tiers and features included in each plan.

## Key Features
- **Pricing Plans**: Multiple subscription tiers with feature comparisons
- **Scroll Animations**: Intersection Observer-based fade-in animations
- **Scroll to Top Button**: Appears after scrolling 300px
- **Responsive Navigation**: Mobile-friendly menu system
- **Call-to-Action**: Links to registration or contact

## User Access
- **Public**: Accessible to all visitors (no authentication required)

## Dependencies
- Next.js Image component
- Framer Motion for animations
- ScrollAnimations component
- Webflow images

## Related Pages
- `/` - Home page
- `/register` - User registration
- `/contact` - Contact form
- `/about-us` - About Us page

## State Management
- Local state for mobile menu toggle
- Scroll position tracking for "scroll to top" button visibility

## Notes
- Uses client-side rendering (`'use client'`)
- Standard informational page with pricing details

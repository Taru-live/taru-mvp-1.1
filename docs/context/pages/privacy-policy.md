# Privacy Policy Page Context

**Path:** `/privacy-policy`  
**File:** `app/privacy-policy/page.tsx`

## Purpose
Legal page displaying the platform's privacy policy. Explains how user data is collected, used, and protected in compliance with privacy regulations (GDPR, COPPA, etc.).

## Key Features
- **Privacy Policy Content**: Detailed privacy policy text
- **Scroll Animations**: Intersection Observer-based animations
- **Scroll to Top Button**: Appears after scrolling 300px
- **Responsive Navigation**: Mobile-friendly menu system

## User Access
- **Public**: Accessible to all visitors (no authentication required)
- **Legal Requirement**: Required for compliance with privacy regulations

## Dependencies
- Next.js Image component
- Framer Motion for animations
- ScrollAnimations component

## Related Pages
- `/terms-and-conditions` - Terms and Conditions page
- `/` - Home page

## State Management
- Local state for mobile menu toggle
- Scroll position tracking

## Notes
- Uses client-side rendering (`'use client'`)
- Legal compliance document
- Should be reviewed regularly for regulatory updates

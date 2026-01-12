# Terms and Conditions Page Context

**Path:** `/terms-and-conditions`  
**File:** `app/terms-and-conditions/page.tsx`

## Purpose
Legal page displaying the platform's terms and conditions of use. Defines the rules and guidelines for using the Taru platform.

## Key Features
- **Terms Content**: Detailed terms and conditions text
- **Scroll Animations**: Intersection Observer-based animations
- **Scroll to Top Button**: Appears after scrolling 300px
- **Responsive Navigation**: Mobile-friendly menu system

## User Access
- **Public**: Accessible to all visitors (no authentication required)
- **Legal Requirement**: Required for platform usage agreements

## Dependencies
- Next.js Image component
- Framer Motion for animations
- ScrollAnimations component

## Related Pages
- `/privacy-policy` - Privacy Policy page
- `/register` - User registration (should reference terms)

## State Management
- Local state for mobile menu toggle
- Scroll position tracking

## Notes
- Uses client-side rendering (`'use client'`)
- Legal compliance document
- Should be referenced during user registration

# Migration Notes: React to Next.js App Router

## Overview
This document outlines the migration of the "Taru site react app" from React (with React Router) to Next.js 15 (App Router) as "taru-mvp-1.1".

## Migration Summary

### ✅ Completed Tasks

1. **Project Structure**
   - Created Next.js App Router structure
   - Migrated all components to `components/marketing/`
   - Created all page routes in `app/` directory

2. **Assets Migration**
   - Copied all CSS files from `public/css/` (normalize.css, webflow.css, taru-home-page.webflow.css)
   - Copied all images from `public/images/`
   - Copied Webflow JS from `public/js/webflow.js`
   - Copied favicon and webclip icons

3. **Components Migration**
   - **Navbar**: Converted `react-router-dom` `Link` to Next.js `next/link`, `useLocation` to `usePathname`
   - **Footer**: Converted all `Link` components to Next.js `Link`
   - **GlobalStyles**: Preserved exactly as-is (inline styles component)
   - **WebflowInit**: Created new client component to handle Webflow initialization on route changes

4. **Pages Migration**
   All pages converted to Next.js App Router format:
   - `/` → `app/page.tsx` (Home)
   - `/about-us` → `app/about-us/page.tsx`
   - `/contact` → `app/contact/page.tsx` (with form state)
   - `/pricing` → `app/pricing/page.tsx` (with tab state)
   - `/detail_services` → `app/detail_services/page.tsx`
   - `/detail_blog` → `app/detail_blog/page.tsx`
   - `/detail_case-studies` → `app/detail_case-studies/page.tsx`
   - `/privacy-policy` → `app/privacy-policy/page.tsx`
   - `/terms-and-conditions` → `app/terms-and-conditions/page.tsx`

5. **Layout & Scripts**
   - Updated root layout (`app/layout.tsx`) to include:
     - Webflow CSS files
     - Webflow JavaScript libraries (jQuery, Webflow.js)
     - WebFont loader
     - Proper script loading with Next.js `Script` component
   - Created `MarketingLayout` component to wrap marketing pages with Navbar, Footer, GlobalStyles, and WebflowInit

6. **Metadata**
   - Updated page metadata to match original React app
   - Set proper title, description, and Open Graph tags

## Key Changes from React Router to Next.js

### Routing
- **Before**: `<BrowserRouter>`, `<Routes>`, `<Route>` from `react-router-dom`
- **After**: File-based routing in `app/` directory with `page.tsx` files

### Navigation
- **Before**: `import { Link } from 'react-router-dom'`
- **After**: `import Link from 'next/link'`
- **Before**: `useLocation()` hook
- **After**: `usePathname()` hook from `next/navigation`

### Client Components
- Pages with state (Contact, Pricing) marked with `'use client'` directive
- Components using hooks or browser APIs marked as client components

### Script Loading
- **Before**: Scripts in `public/index.html`
- **After**: Using Next.js `Script` component with appropriate loading strategies:
  - `beforeInteractive`: jQuery, WebFont (critical)
  - `afterInteractive`: Webflow.js (after page load)
  - `lazyOnload`: Before-after slider (non-critical)

## Webflow Integration

The migration preserves all Webflow functionality:
- Webflow animations and interactions
- Webflow CSS classes and styles
- Webflow JavaScript initialization
- Route change handling for Webflow re-initialization

The `WebflowInit` component handles:
- Reinitializing Webflow on route changes
- Fallback content visibility if Webflow takes too long
- Proper scroll event triggering for animations

## Running the Application

### Development
```bash
cd taru-mvp-1.1
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## File Structure

```
taru-mvp-1.1/
├── app/
│   ├── layout.tsx              # Root layout with Webflow scripts
│   ├── marketing-layout.tsx    # Marketing pages layout
│   ├── page.tsx                # Home page
│   ├── about-us/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── detail_services/
│   │   └── page.tsx
│   ├── detail_blog/
│   │   └── page.tsx
│   ├── detail_case-studies/
│   │   └── page.tsx
│   ├── privacy-policy/
│   │   └── page.tsx
│   └── terms-and-conditions/
│       └── page.tsx
├── components/
│   └── marketing/
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       ├── GlobalStyles.tsx
│       └── WebflowInit.tsx
└── public/
    ├── css/                    # Webflow CSS files
    ├── js/                     # Webflow JS
    └── images/                 # All images
```

## Unavoidable Next.js-Specific Changes

1. **Client Components**: Pages with state (Contact form, Pricing tabs) must be client components (`'use client'`)

2. **Script Loading**: Scripts moved from HTML to Next.js `Script` components with loading strategies

3. **Layout Structure**: Marketing pages use a `MarketingLayout` wrapper component instead of being directly in the Router

4. **Route Detection**: Using `usePathname()` instead of `useLocation().pathname`

## Verification Checklist

- ✅ All routes match original React app
- ✅ All components preserve original styling and behavior
- ✅ Webflow animations and interactions work
- ✅ Form state management preserved (Contact page)
- ✅ Tab state management preserved (Pricing page)
- ✅ All images and assets load correctly
- ✅ Navigation links work correctly
- ✅ Footer links work correctly
- ✅ Webflow initialization on route changes

## Notes

- The original React app used `react-scripts` (Create React App). This has been fully migrated to Next.js.
- All Webflow-specific classes, data attributes, and JavaScript integration have been preserved.
- The migration maintains pixel-perfect UI/UX matching the original React app.
- No visual redesign or optimization was performed - this is a direct migration.

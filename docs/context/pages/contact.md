# Contact Page Context

**Path:** `/contact`  
**File:** `app/contact/page.tsx`

## Purpose
Contact form page allowing visitors to reach out to the Taru team with inquiries, questions, or support requests.

## Key Features
- **Contact Form**: Multi-field form with validation
  - Name, Email, Phone
  - Subject
  - Message
  - Inquiry Type selector (general, support, partnership, etc.)
- **Form Validation**: Client-side validation before submission
- **Submission Status**: Success/error feedback after form submission
- **Scroll Animations**: Intersection Observer-based animations
- **Scroll to Top Button**: Appears after scrolling 300px

## User Access
- **Public**: Accessible to all visitors (no authentication required)

## Form Fields
- `name`: User's full name
- `email`: Contact email address
- `phone`: Phone number (optional)
- `subject`: Subject line for the inquiry
- `message`: Detailed message content
- `inquiryType`: Type of inquiry (general, support, partnership, etc.)

## State Management
- Form data state (`formData`)
- Submission status (`isSubmitting`, `submitStatus`)
- Mobile menu toggle
- Scroll position tracking

## API Integration
- Form submission endpoint (needs to be implemented or verified)
- Handles success and error states

## Related Pages
- `/` - Home page
- `/about-us` - About Us page
- `/pricing` - Pricing information

## Notes
- Uses client-side rendering (`'use client'`)
- Form submission status: 'idle' | 'success' | 'error'
- Implements loading state during submission

# Student Onboarding Page Context

**Path:** `/student-onboarding`  
**File:** `app/student-onboarding/page.tsx`

## Purpose
Multi-step onboarding flow for new students to complete their profile setup, preferences, and initial configuration.

## Key Features
- **Multi-Step Form**: Progressive form with multiple steps
- **Personal Information**: Name, date of birth, gender, class/grade, school
- **Preferences**: Language, learning modes, interests, career domains, subjects, learning styles
- **Guardian Information**: Guardian contact details
- **Location & Device**: Location and device ID
- **Consent**: Data usage consent and terms acceptance
- **Student ID Generation**: Generates unique student ID
- **Data Persistence**: Uses RegistrationDataManager for data handling
- **Loading States**: Loading indicators during submission

## User Access
- **New Students**: Students who have registered but not completed onboarding
- **Redirect**: Redirects to dashboard after completion

## Onboarding Steps
1. Personal Information
2. Preferences Selection
3. Guardian Information
4. Location & Technical Details
5. Consent & Terms

## State Management
- Form data across all steps
- Current step tracking
- Validation errors
- Loading states
- Student unique ID generation

## Dependencies
- RegistrationDataManager utility
- StudentKeyGenerator for unique ID generation
- ConsistentLoadingPage component
- API endpoint: `/api/student/onboarding`

## Related Pages
- `/register` - User registration
- `/dashboard/student` - Student dashboard (redirect after completion)
- `/diagnostic-assessment` - Diagnostic assessment (next step)

## Data Structure
```typescript
interface StudentOnboardingData {
  fullName: string;
  nickname: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  classGrade: string;
  schoolName: string;
  languagePreference: string;
  learningModePreference: string[];
  interestsOutsideClass: string[];
  preferredCareerDomains: string[];
  favoriteSubjects: string[];
  preferredLearningStyles: string[];
  guardianName: string;
  guardianContactNumber: string;
  guardianEmail: string;
  location: string;
  deviceId: string;
  consentForDataUsage: boolean;
  termsAndConditionsAccepted: boolean;
  uniqueId: string;
}
```

## Notes
- Uses client-side rendering (`'use client'`)
- Multi-step form with validation
- Generates unique student ID using StudentKeyGenerator
- Data managed through RegistrationDataManager
- Required before accessing student dashboard

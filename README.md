# 🎓 Taru - AI-Powered Personalized Learning Platform

<div align="center">

![Taru Logo](https://img.shields.io/badge/Taru-Education%20Platform-blue?style=for-the-badge&logo=graduation-cap)
![Next.js](https://img.shields.io/badge/Next.js-15.3.8-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-6.17-green?style=for-the-badge&logo=mongodb)

**Transform education with AI-powered personalized learning experiences**

</div>

---

## 🌟 Overview

Taru is a comprehensive educational platform that provides personalized learning experiences for students through AI-powered assessments, adaptive learning paths, and interactive content. The platform supports multiple user roles, payment subscriptions, and advanced features like PDF processing, mind maps, and YouTube-based learning modules.

### 🎯 Key Capabilities

- **Multi-Role Platform**: Students, Parents, Teachers, Organization Admins, and Platform Super Admins
- **AI-Powered Learning**: Google Gemini integration for intelligent tutoring and chat assistance
- **Subscription-Based Access**: Razorpay payment integration with Basic (₹99/month) and Premium (₹199/month) plans
- **Comprehensive Assessments**: Skill, interest, and diagnostic assessments for personalized learning paths
- **Learning Path Management**: AI-generated career-focused learning paths with module access control
- **Data Persistence**: Comprehensive state management preserving user progress across sessions

---

## ✨ Core Features

### 🧠 AI-Powered Personalization

- **Smart Assessment System**:
  - Interest assessment (multi-step profile setup)
  - Diagnostic test (grade-specific skill evaluation)
  - Skill assessment (comprehensive knowledge evaluation)
  - AI-generated learning recommendations based on results

- **AI Buddy Chat**:
  - Context-aware chat assistant powered by Google Gemini
  - Chapter-specific tutoring with PDF/document context
  - Voice input/output support
  - Multilingual support
  - Usage limits based on subscription plan

- **Content Generation**:
  - AI-generated MCQ quizzes from learning materials
  - PDF processing and explanation services
  - Mind map generation from educational content
  - Infographic creation from PDFs

### 📚 Learning Management

- **YouTube-Based Modules**:
  - Video-based learning content
  - Chapter progression tracking
  - Transcript extraction and AI explanations
  - Progress persistence across sessions

- **Learning Paths**:
  - AI-generated career-focused paths
  - Module unlocking based on subscription renewals
  - Career exploration with detailed information
  - One learning path save per payment

- **Access Control**:
  - Sequential module unlocking per learning path
  - Subscription-based feature access
  - Daily chat limits per chapter (3-5 based on plan)
  - Monthly MCQ generation limits (3-5 based on plan)

### 💳 Payment & Subscriptions

- **Razorpay Integration**:
  - Secure payment processing
  - Subscription management (Basic/Premium)
  - Usage tracking and enforcement
  - Payment verification with signature validation

- **Subscription Plans**:
  - **Basic Plan (₹99/month)**: 3 AI chats/day/chapter, 3 MCQs/month
  - **Premium Plan (₹199/month)**: 5 AI chats/day/chapter, 5 MCQs/month
  - One learning path save per payment

### 🔐 Authentication & Security

- **Multiple Auth Methods**:
  - Traditional email/password authentication
  - Google OAuth integration
  - JWT-based session management
  - HTTP-only cookie security

- **Role-Based Access Control**:
  - Granular permissions per user role
  - Secure API endpoints
  - Session management with automatic logout
  - Student key system for unique identification

### 👥 User Roles & Dashboards

1. **Student Dashboard**:
   - Overview with progress tracking
   - Learning Path management
   - Modules browsing and access
   - Tests and assignments
   - Enhanced Learning (AI features)
   - Progress reports
   - Rewards and badges
   - Settings and profile

2. **Parent Dashboard**:
   - Child progress monitoring
   - Activity graphs and reports
   - Notification center
   - Profile management

3. **Teacher Dashboard**:
   - Student management
   - Test creation and assignment
   - Analytics and reporting
   - Bulk student import
   - Module management

4. **Organization Admin Dashboard**:
   - Organization management
   - Branch management
   - Teacher and student management
   - Reports center
   - Audit logs
   - Credential generation

5. **Platform Super Admin Dashboard**:
   - Platform-wide analytics
   - Organization approval/rejection
   - System-wide management
   - Audit logs

### 📊 Data Management

- **Comprehensive Persistence**:
  - Form data preservation across navigation
  - Scroll position memory
  - Offline support with localStorage fallback
  - Auto-save functionality
  - Data recovery UI

- **Session Management**:
  - Progress tracking per module/chapter
  - Assessment state preservation
  - Career path data management
  - Navigation history

### 🎮 Gamification

- **XP System**: Experience points for module completion
- **Achievement Badges**: Milestone rewards
- **Progress Tracking**: Visual progress indicators
- **Streaks**: Learning streak tracking

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 15.3.8, React 19, TypeScript 5 | Modern, type-safe UI framework |
| **Styling** | Tailwind CSS 3.3.2 | Utility-first CSS framework |
| **UI Components** | Material-UI 7.2.0, Headless UI, Lucide React | Component library and icons |
| **Animations** | Framer Motion 12.23.12 | Smooth animations and transitions |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | MongoDB 6.17, Mongoose 8.16.1 | Flexible document storage |
| **Authentication** | JWT (jsonwebtoken), jose, bcryptjs | Secure user sessions |
| **AI Integration** | Google Generative AI (@google/generative-ai) | AI-powered features |
| **Payment** | Razorpay 2.9.6 | Payment processing |
| **OAuth** | Google Auth Library | Google sign-in |
| **Charts** | Recharts 3.1.0 | Data visualization |
| **PDF** | jsPDF 3.0.1, react-pdf, pdfjs-dist | PDF generation and processing |
| **Video** | react-youtube 10.1.0 | YouTube integration |
| **Notifications** | Sonner 1.7.4 | Toast notifications |
| **Other** | canvas-confetti, react-speech-recognition | Celebrations and voice input |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or Atlas)
- Google Cloud Console account (for Gemini AI and OAuth)
- Razorpay account (for payments)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd taru-mvp-1.1
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # Authentication
   JWT_SECRET=your_jwt_secret_key

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key

   # Razorpay Payment
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # N8N Webhooks (optional)
   N8N_WEBHOOK_URL=your_n8n_webhook_url
   ```

4. **Configure Google Cloud Console**

   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Enable Gemini API and create API key

5. **Configure Razorpay**

   - Create test account at [Razorpay](https://razorpay.com)
   - Get test Key ID and Key Secret
   - For production, use live credentials

6. **Seed Database**

   ```bash
   # Seed modules
   npm run seed-modules

   # Seed demo users
   npm run seed-users

   # Or clean and reseed everything
   npm run cleanup-reseed
   ```

7. **Start Development Server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

### Demo Accounts

After seeding, you can use these demo accounts:

- **System Admin**: `admin@system.com` / `admin123`
- **Students**: 
  - `student1@demo.com` / `demopass`
  - `student2@demo.com` / `demopass`
  - `student3@demo.com` / `demopass`
- **Parents**:
  - `parent1@demo.com` / `demopass`
  - `parent2@demo.com` / `demopass`
- **Teachers**:
  - `teacher1@demo.com` / `demopass`
  - `teacher2@demo.com` / `demopass`

---

## 📁 Project Structure

```
taru-mvp-1.1/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── assessment/          # Assessment APIs
│   │   ├── auth/                # Authentication APIs
│   │   ├── chat/                # AI chat API
│   │   ├── dashboard/           # Dashboard data APIs
│   │   ├── learning-paths/      # Learning path management
│   │   ├── mindmap/             # Mind map generation
│   │   ├── modules/             # Module and chapter APIs
│   │   ├── payments/            # Payment and subscription APIs
│   │   ├── session/             # Session management APIs
│   │   └── webhook/             # N8N webhook integrations
│   ├── dashboard/               # Role-based dashboards
│   │   ├── student/             # Student dashboard
│   │   ├── parent/              # Parent dashboard
│   │   ├── teacher/             # Teacher dashboard
│   │   ├── organization-admin/  # Organization admin dashboard
│   │   └── platform-super-admin/# Platform super admin dashboard
│   ├── modules/                 # Learning module pages
│   ├── skill-assessment/        # Skill assessment flow
│   └── diagnostic-assessment/   # Diagnostic assessment flow
├── components/                   # Reusable UI components
│   ├── TextAnimations.tsx       # Text animation components
│   ├── InteractiveElements.tsx  # Interactive UI elements
│   └── ScrollAnimations.tsx     # Scroll-based animations
├── lib/                         # Utility functions and services
│   ├── ai-buddy/               # AI integration services
│   │   ├── gemini.ts           # Gemini API service
│   │   ├── speechService.ts    # Speech synthesis
│   │   ├── pdfProcessorService.ts # PDF processing
│   │   └── multilingualService.ts # Multilingual support
│   ├── hooks/                   # Custom React hooks
│   │   ├── useDataPersistence.ts # Data persistence hook
│   │   ├── useEnhancedSession.ts # Session management hook
│   │   └── useModuleState.ts   # Module state management
│   └── utils/                   # Utility functions
│       ├── moduleAccessControl.ts # Module access control
│       ├── paymentUtils.ts      # Payment utilities
│       └── persistenceUtils.ts  # Persistence utilities
├── models/                      # MongoDB models
│   ├── User.ts                  # User model
│   ├── Student.ts               # Student model
│   ├── Assessment.ts            # Assessment model
│   ├── Payment.ts               # Payment model
│   ├── Subscription.ts          # Subscription model
│   └── ...                      # Other models
├── scripts/                     # Database scripts
│   ├── seed-modules.js          # Module seeding
│   ├── seed-demo-users.js       # User seeding
│   ├── cleanup-and-reseed.js    # Database cleanup
│   └── validate-student-keys.js # Student key validation
└── docs/                        # Documentation
    ├── RAZORPAY_INTEGRATION.md  # Payment integration guide
    ├── MODULE_ACCESS_CONTROL_IMPLEMENTATION.md
    ├── DATA_PERSISTENCE_GUIDE.md
    ├── SESSION_MANAGEMENT.md
    └── STUDENT_KEYS.md
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run seed-modules     # Seed learning modules
npm run seed-users       # Seed demo users
npm run cleanup-reseed   # Clean database and reseed
npm run validate-keys    # Validate student keys
```

---

## 📖 Documentation

Detailed documentation is available in the `docs/` directory:

- **[Razorpay Integration](./docs/RAZORPAY_INTEGRATION.md)**: Payment and subscription setup
- **[Module Access Control](./docs/MODULE_ACCESS_CONTROL_IMPLEMENTATION.md)**: Module unlocking logic
- **[Data Persistence Guide](./docs/DATA_PERSISTENCE_GUIDE.md)**: State management system
- **[Session Management](./docs/SESSION_MANAGEMENT.md)**: Session handling details
- **[Student Keys](./docs/STUDENT_KEYS.md)**: Student identification system
- **[Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)**: Google authentication setup
- **[Test Management](./docs/TEST_MANAGEMENT_IMPLEMENTATION.md)**: Test system documentation

---

## 🎯 Key Workflows

### Student Onboarding Flow

```
Registration → Profile Setup → Interest Assessment → 
Diagnostic Test → Skill Assessment → Personalized Dashboard
```

### Learning Flow

```
Dashboard → Learning Path Selection → Module Access Check → 
Chapter Learning → AI Chat/Quiz → Progress Tracking
```

### Payment Flow

```
Career Options → Subscription Check → Payment Modal → 
Razorpay Checkout → Payment Verification → Access Granted
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
- **Role-Based Access Control**: Granular permissions per user role
- **Payment Verification**: Server-side Razorpay signature verification
- **CSRF Protection**: State parameter validation for OAuth
- **Input Validation**: Comprehensive validation on all API endpoints
- **Secure Headers**: Security headers configured in Next.js config
- **Student Key System**: Unique, validated student identifiers

---

## 🧪 Testing

### Razorpay Test Mode

Use Razorpay test credentials:
- Key ID: `rzp_test_xxx`
- Key Secret: `rzp_test_xxx`

Test Cards:
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

### Database Validation

```bash
# Validate student keys
npm run validate-keys

# Check database consistency
node scripts/verify-current-data.js
```

---

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set all production environment variables
2. **Database**: Configure production MongoDB connection
3. **Razorpay**: Switch to live credentials
4. **Google OAuth**: Update redirect URIs for production domain
5. **Base URL**: Update `NEXT_PUBLIC_BASE_URL` to production domain
6. **Security**: Ensure HTTPS is enabled
7. **Build**: Run `npm run build` and test with `npm run start`

### Recommended Hosting

- **Frontend**: Vercel, Netlify, or similar
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3 or similar (if needed)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript best practices
4. Write meaningful commit messages
5. Test your changes thoroughly
6. Submit a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add appropriate error handling
- Update documentation for new features
- Ensure accessibility compliance
- Test with multiple user roles

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **MongoDB** for reliable data storage
- **Google** for Gemini AI and OAuth services
- **Razorpay** for payment processing
- **Open Source Community** for various libraries and tools

---

<div align="center">

**Made with ❤️ by the Taru Team**

*Empowering the future of education, one student at a time.*

</div>

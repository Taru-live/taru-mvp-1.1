# 🎓 Taru - The Future of Personalized Learning

<div align="center">

![taru Logo](https://img.shields.io/badge/taru-Education%20Platform-blue?style=for-the-badge&logo=graduation-cap)
![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-6.17-green?style=for-the-badge&logo=mongodb)

**Transform education with AI-powered personalized learning experiences**

[🚀 Live Demo](#) • [📖 Documentation](#) • [💡 Features](#-key-features) • [🛠️ Tech Stack](#-technology-stack)

</div>

---

## 🌟 What is Taru?

Taru is a revolutionary educational platform that personalizes learning for every student. Using advanced AI and real-time data synchronization, we create unique learning journeys that adapt to each student's strengths, interests, and learning style.

### 🎯 Perfect For:
- **Students** seeking personalized learning paths
- **Parents** wanting to track their child's progress
- **Teachers** managing diverse classrooms
- **Schools** implementing adaptive learning
- **Educational Organizations** scaling personalized education

---

## ✨ Key Features

### 🧠 AI-Powered Personalization
- **Smart Assessment**: 4-step comprehensive evaluation of skills, interests, and learning styles
- **Adaptive Recommendations**: AI suggests modules based on individual strengths and weaknesses
- **Dynamic Learning Paths**: Curriculum that evolves with student progress
- **Real-time Analytics**: Instant insights into learning patterns and achievements

### 🎮 Gamified Learning Experience
- **XP System**: Earn experience points for completing modules and activities
- **Achievement Badges**: Unlock badges for milestones and accomplishments
- **Progress Tracking**: Visual progress indicators and milestone celebrations
- **Leaderboards**: Friendly competition to motivate learning

### 👥 Multi-Role Platform
- **Student Dashboard**: Personalized learning interface with AI chat assistant
- **Parent Portal**: Monitor progress, view reports, and support learning
- **Teacher Tools**: Manage classes, track student progress, and customize content
- **Admin Panel**: Comprehensive platform management and analytics

### 🔄 Real-Time Synchronization
- **Live Updates**: Changes reflect instantly across all devices
- **Offline Support**: Continue learning even without internet connection
- **Smart Caching**: Optimized performance with intelligent data management
- **Cross-Device Sync**: Seamless experience across phones, tablets, and computers

---

## 🚀 Getting Started

### Quick Start (5 minutes)

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-org/taru.git
   cd taru
   npm install
   ```

2. **Set Up Environment**
   ```bash
   # Create .env.local file
   echo "MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key" > .env.local
   ```

3. **Seed the Database**
   ```bash
   npm run seed-modules
   npm run seed-users
   ```

4. **Launch the Platform**
   ```bash
   npm run dev
   ```

5. **Explore with Demo Accounts**
   - **Student**: `student1@demo.com` / `demopass`
   - **Parent**: `parent1@demo.com` / `demopass`
   - **Teacher**: `teacher1@demo.com` / `demopass`
   - **Admin**: `admin1@demo.com` / `demopass`

Visit [http://localhost:3000](http://localhost:3000) and start exploring! 🎉

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript | Modern, type-safe UI framework |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | MongoDB + Mongoose | Flexible document storage |
| **Authentication** | JWT + HTTP-only cookies | Secure user sessions |
| **Real-time** | Custom sync system | Live data synchronization |
| **UI Components** | Lucide React, Framer Motion | Beautiful, animated interfaces |
| **Charts** | Recharts | Data visualization |
| **PDF Generation** | jsPDF | Certificate and report generation |

---

## 📊 Platform Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Student App   │    │   Parent App    │    │  Teacher App    │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Progress      │    │ • Class Mgmt    │
│ • Learning      │    │ • Reports       │    │ • Analytics     │
│ • Assessment    │    │ • Notifications │    │ • Content       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │                 │
                    │ • Authentication│
                    │ • Real-time Sync│
                    │ • File Upload   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │                 │
                    │ • User Data     │
                    │ • Learning Data │
                    │ • Analytics     │
                    └─────────────────┘
```

---

## 🎯 Learning Journey

### 1. **Student Onboarding** 🎓
```
Registration → Profile Setup → Skill Assessment → Diagnostic Test → Personalized Dashboard
```

### 2. **Personalized Learning** 📚
```
Assessment Results → AI Recommendations → Learning Paths → Module Completion → Progress Tracking
```

### 3. **Continuous Growth** 📈
```
Real-time Analytics → Adaptive Content → Achievement Unlocks → Skill Development → Mastery
```

---

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed-modules # Populate learning modules
npm run seed-users   # Create demo users
npm run reset-db     # Reset database
```

### Project Structure

```
taru/
├── 📁 app/                    # Next.js app directory
│   ├── 📁 api/               # API endpoints
│   ├── 📁 dashboard/         # Role-based dashboards
│   ├── 📁 skill-assessment/  # Student assessment flow
│   └── 📁 modules/           # Learning content
├── 📁 components/            # Reusable UI components
├── 📁 lib/                   # Utility functions
├── 📁 models/                # Database models
├── 📁 scripts/               # Database seeding
└── 📁 types/                 # TypeScript definitions
```

---

## 🎨 UI/UX Highlights

- **🎨 Modern Design**: Clean, intuitive interface with dark mode support
- **📱 Responsive**: Perfect experience on all devices
- **♿ Accessible**: WCAG compliant for inclusive learning
- **🎭 Animations**: Smooth transitions and micro-interactions
- **🎊 Celebrations**: Confetti effects for achievements
- **🎤 Voice Input**: Speech recognition for hands-free interaction

---

## 🔒 Security & Privacy

- **🔐 Secure Authentication**: JWT tokens with HTTP-only cookies
- **🛡️ Role-based Access**: Granular permissions for each user type
- **🔒 Data Encryption**: All sensitive data is encrypted
- **📊 Privacy Compliant**: GDPR and COPPA compliant
- **🔄 Session Management**: Secure session handling with automatic logout

---

## 📈 Performance

- **⚡ Fast Loading**: Optimized bundle sizes and lazy loading
- **🔄 Real-time Updates**: Instant data synchronization
- **💾 Smart Caching**: Intelligent caching with TTL
- **📊 Analytics**: Real-time performance monitoring
- **🚀 CDN Ready**: Optimized for global content delivery

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure accessibility compliance

---

## 📞 Support & Community

- **📧 Email**: support@taru.com
- **💬 Discord**: [Join our community](https://discord.gg/taru)
- **🐛 Issues**: [Report bugs](https://github.com/your-org/taru/issues)
- **💡 Ideas**: [Feature requests](https://github.com/your-org/taru/discussions)
- **📖 Docs**: [Full documentation](https://docs.taru.com)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **MongoDB** for reliable data storage
- **Tailwind CSS** for beautiful styling
- **Our Community** for feedback and contributions

---

<div align="center">

**Made with ❤️ by the taru Team**

[⭐ Star this repo](https://github.com/your-org/taru) • [🚀 Deploy to Vercel](#) • [📖 Read the docs](#)

*Empowering the future of education, one student at a time.*

</div> 
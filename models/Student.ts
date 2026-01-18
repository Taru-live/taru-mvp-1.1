import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  organizationId: {
    type: String,
    ref: 'Organization',
    required: false
  },
  teacherId: {
    type: String,
    required: false,
    ref: 'User'
  },
  // OWNERSHIP TRACKING: Store who created/manages this student
  // This is used for:
  // 1. Access control (canAccessStudent checks these fields)
  // 2. Free access determination (isStudentLinked checks these)
  // 3. Display in dashboards/reports (shows who added the student)
  // SECURITY: These fields are set server-side and cannot be spoofed from client
  createdBy: {
    type: {
      type: String,
      enum: ['teacher', 'organization', 'self'],
      required: false
    },
    id: {
      type: String,
      required: false
    },
    name: {
      type: String,
      required: false
    }
  },
  managedBy: {
    type: {
      type: String,
      enum: ['teacher', 'organization', 'self'],
      required: false
    },
    id: {
      type: String,
      required: false
    },
    name: {
      type: String,
      required: false
    }
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true
    // Note: uniqueId should be generated using StudentKeyGenerator.generate() 
    // in the code before creating the Student instance, not in the schema default
  },
  fullName: {
    type: String,
    required: true,
    maxlength: 50
  },
  nickname: {
    type: String,
    maxlength: 30
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    min: 1,
    max: 99
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'],
    maxlength: 6
  },
  classGrade: {
    type: String,
    required: true,
    maxlength: 10
  },
  schoolName: {
    type: String,
    required: true,
    maxlength: 100
  },
  schoolId: {
    type: String,
    required: true,
    maxlength: 20
  },
  profilePictureUrl: {
    type: String
  },
  avatar: {
    type: String,
    default: '/avatars/Group.svg'
  },
  languagePreference: {
    type: String,
    required: true,
    maxlength: 10
  },
  learningModePreference: [{
    type: String,
    maxlength: 100
  }],
  interestsOutsideClass: [{
    type: String,
    maxlength: 100
  }],
  preferredCareerDomains: [{
    type: String,
    maxlength: 100
  }],
  guardian: {
    name: {
      type: String,
      required: true,
      maxlength: 50
    },
    contactNumber: {
      type: String,
      required: true,
      maxlength: 10
    },
    email: {
      type: String,
      maxlength: 100
    }
  },
  location: {
    type: String,
    maxlength: 100
  },
  deviceId: {
    type: String,
    maxlength: 64
  },
  consentForDataUsage: {
    type: Boolean,
    required: true,
    default: false
  },
  termsAndConditionsAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    required: true,
    default: false
  },
  onboardingCompletedAt: {
    type: Date
  },
  preferredSubject: {
    id: {
      type: String
    },
    name: {
      type: String
    },
    selectedAt: {
      type: Date
    }
  },
  
  // Interest Assessment Data
  interestAssessmentCompleted: {
    type: Boolean,
    default: false
  },
  interestAssessmentCompletedAt: {
    type: Date
  },
  
  // Step 1: Broad Interest Cluster Selection
  broadInterestClusters: [{
    type: String,
    enum: [
      'Technology & Computers',
      'Science & Experiments',
      'Art & Design',
      'Language & Communication',
      'Business & Money',
      'Performing Arts (Music/Dance/Acting)',
      'Cooking & Nutrition',
      'Sports & Fitness',
      'Farming, Gardening & Nature',
      'Social Work & Helping People',
      'Mechanics / DIY / Repairs',
      'Fashion & Tailoring',
      'Animal Care',
      'Spirituality / Mindfulness'
    ]
  }],
  
  // Step 2: Cluster-specific Deep Dive
  clusterDeepDive: {
    technologyComputers: {
      techInterests: String,
      codingExperience: String,
      buildingGoals: String
    },
    scienceExperiments: {
      scienceTopics: String,
      projectExperience: String,
      inventionIdeas: String
    },
    artDesign: {
      artTypes: String,
      creativeTime: String,
      artisticExpression: String
    },
    languageCommunication: {
      writingSpeaking: String,
      confidentLanguages: String,
      skillImprovement: String
    },
    businessMoney: {
      sellingExperience: String,
      businessIdeas: String,
      problemSolving: String
    },
    performingArts: {
      preferredArts: String,
      performanceExperience: String,
      performanceGoals: String
    },
    cookingNutrition: {
      favoriteDishes: String,
      nutritionKnowledge: String,
      culinaryAspirations: String
    },
    sportsFitness: {
      favoriteActivities: String,
      competitionParticipation: String,
      fitnessGoals: String
    },
    farmingGardening: {
      farmingExperience: String,
      naturePreferences: String,
      environmentalGoals: String
    },
    socialWork: {
      volunteerExperience: String,
      socialProblems: String,
      careerAspirations: String
    },
    mechanicsDIY: {
      repairExperience: String,
      machineInterests: String,
      learningGoals: String
    },
    fashionTailoring: {
      designInterests: String,
      wearableCreations: String,
      careerGoals: String
    },
    animalCare: {
      animalAffinity: String,
      careExperience: String,
      careerAspirations: String
    },
    spiritualityMindfulness: {
      quietTimeActivities: String,
      stressManagement: String,
      learningGoals: String
    }
  },
  
  // Step 3: Cross-Cluster Personality Insights
  personalityInsights: {
    learningStyle: [{
      type: String,
      enum: [
        'I learn by doing or practicing',
        'I learn by watching or reading',
        'I learn by discussing or teaching',
        'I prefer learning alone',
        'I enjoy group learning'
      ]
    }],
    challengeApproach: {
      type: String,
      enum: [
        'I enjoy trying it myself',
        'I break it into steps',
        'I seek help when stuck',
        'I avoid difficult tasks',
        'It depends on the topic'
      ]
    },
    coreValues: [{
      type: String,
      enum: [
        'Creativity',
        'Curiosity',
        'Empathy',
        'Discipline',
        'Leadership',
        'Spirituality',
        'Respect',
        'Innovation',
        'Teamwork'
      ]
    }]
  },
  
  // Step 4: Future Dream / Career Direction
  careerDirection: {
    dreamCareer: String,
    excitingCareerTypes: [{
      type: String,
      enum: [
        'Scientist or Researcher',
        'Engineer or Technologist',
        'Teacher or Educator',
        'Doctor or Health Worker',
        'Artist or Designer',
        'Entrepreneur or Business Owner',
        'Athlete or Fitness Coach',
        'Actor, Dancer, or Performer',
        'Chef or Nutrition Expert',
        'Fashion Designer or Tailor',
        'Mechanic or Technician',
        'Farmer or Nature Expert',
        'Animal Care Specialist',
        'Social Worker or Leader',
        'Spiritual Guide or Wellness Coach',
        'I\'m still exploring'
      ]
    }],
    careerAttraction: String
  },
  
  // Session and Navigation State
  currentSession: {
    sessionId: String,
    currentPage: String,
    lastActivity: { type: Date, default: Date.now }
  },
  navigationHistory: [{
    page: String,
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
studentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default (mongoose.models && mongoose.models.Student) || mongoose.model('Student', studentSchema); 
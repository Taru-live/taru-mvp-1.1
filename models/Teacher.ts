import mongoose from 'mongoose';

export interface ITeacher {
  _id: string;
  userId: string;
  organizationId?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  subjectSpecialization: string;
  experienceYears: number;
  qualification: string;
  schoolName?: string;
  schoolId?: string;
  gradeLevels: string[]; // e.g., ['Grade 6', 'Grade 7', 'Grade 8']
  subjects: string[]; // e.g., ['Mathematics', 'Science']
  bio?: string;
  profilePictureUrl?: string;
  onboardingCompleted: boolean;
  isActive: boolean;
  preferences: {
    notificationEmail: boolean;
    notificationSMS: boolean;
    weeklyReports: boolean;
    studentProgressAlerts: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new mongoose.Schema<ITeacher>({
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
  fullName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  phoneNumber: { 
    type: String 
  },
  subjectSpecialization: { 
    type: String, 
    required: true 
  },
  experienceYears: { 
    type: Number, 
    required: true,
    min: 0,
    max: 50
  },
  qualification: { 
    type: String, 
    required: true 
  },
  schoolName: { 
    type: String 
  },
  schoolId: { 
    type: String 
  },
  gradeLevels: [{ 
    type: String 
  }],
  subjects: [{ 
    type: String 
  }],
  bio: { 
    type: String 
  },
  profilePictureUrl: { 
    type: String 
  },
  onboardingCompleted: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  preferences: {
    notificationEmail: { type: Boolean, default: true },
    notificationSMS: { type: Boolean, default: false },
    weeklyReports: { type: Boolean, default: true },
    studentProgressAlerts: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Index for efficient queries
// Note: userId already has an index from unique: true
teacherSchema.index({ schoolId: 1 });
teacherSchema.index({ subjectSpecialization: 1 });
teacherSchema.index({ isActive: 1 });

export default (mongoose.models && mongoose.models.Teacher) || mongoose.model<ITeacher>('Teacher', teacherSchema); 
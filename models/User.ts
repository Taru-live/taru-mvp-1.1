import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'teacher' | 'parent' | 'organization' | 'admin' | 'platform_super_admin';

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  profile: Record<string, any>;
  avatar?: string;
  firstTimeLogin: boolean;
  organizationId?: string; // For users associated with organizations
  isIndependent: boolean; // For users not associated with any organization
  googleId?: string; // For Google OAuth users
  authProvider?: 'local' | 'google'; // Track authentication provider
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const profileSchema = new mongoose.Schema({
  // Student profile fields
  grade: { type: String },
  language: { type: String },
  location: { type: String },
  interests: [{ type: String }],
  
  // Teacher profile fields
  subjectSpecialization: { type: String },
  experienceYears: { type: String },
  
  // Parent profile fields
  linkedStudentId: { type: String },
  linkedStudentUniqueId: { type: String },
  
  // Organization profile fields
  organizationType: { type: String },
  industry: { type: String },
  
  // Common fields
  guardianName: { type: String },
}, { _id: false });

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function(this: IUser) {
      // Password is required only for local auth (not Google OAuth)
      return !this.googleId;
    },
    validate: {
      validator: function(this: IUser, value: string) {
        // If user has googleId or password is empty/undefined, validation passes
        // (OAuth users don't need passwords)
        if (this.googleId || !value || value === '') {
          return true;
        }
        // For local auth, password must be at least 6 characters
        return value.length >= 6;
      },
      message: 'Password must be at least 6 characters long'
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'organization', 'admin', 'platform_super_admin'],
    required: true,
    default: 'student',
  },
  profile: {
    type: profileSchema,
    default: {},
  },
  avatar: {
    type: String,
    default: '/avatars/Group.svg',
  },
  firstTimeLogin: {
    type: Boolean,
    default: true,
  },
  organizationId: {
    type: String,
    ref: 'Organization',
    required: false
  },
  isIndependent: {
    type: Boolean,
    default: true // Default to independent users
  }
}, {
  timestamps: true
});

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  // Skip password hashing if user is using Google OAuth or password is not modified
  if (!this.isModified('password') || this.googleId) return next();
  
  // Skip if password is empty (for Google OAuth users)
  if (!this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // OAuth users don't have passwords, so password comparison always fails
  if (!this.password || this.googleId) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent password from being returned in queries
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

export default (mongoose.models && mongoose.models.User) || mongoose.model<IUser>('User', userSchema); 
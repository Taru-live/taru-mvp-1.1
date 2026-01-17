import mongoose from 'mongoose';

export interface ITest extends mongoose.Document {
  title: string;
  description?: string;
  createdBy: {
    type: 'teacher' | 'organization';
    id: string;
    name: string;
  };
  organizationId?: string;
  subject: string;
  grade?: string;
  classGrade?: string; // For class-specific tests
  questions: mongoose.Types.ObjectId[]; // References to TestQuestion
  totalPoints: number;
  passingScore: number;
  duration?: number; // in minutes
  instructions?: string;
  status: 'draft' | 'published' | 'archived';
  assignmentType: 'individual' | 'class' | 'all_students';
  assignedTo: {
    studentIds?: string[];
    classGrades?: string[];
  };
  startDate?: Date;
  endDate?: Date;
  allowLateSubmission: boolean;
  showResultsImmediately: boolean; // For auto-graded MCQ tests
  randomizeQuestions: boolean;
  randomizeOptions: boolean; // For MCQ questions
  attemptsAllowed: number;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new mongoose.Schema<ITest>({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  createdBy: {
    type: {
      type: String,
      enum: ['teacher', 'organization'],
      required: true
    },
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  organizationId: {
    type: String,
    ref: 'Organization',
    required: false
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot be more than 100 characters']
  },
  grade: {
    type: String,
    trim: true
  },
  classGrade: {
    type: String,
    trim: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestQuestion',
    required: true
  }],
  totalPoints: {
    type: Number,
    required: true,
    min: 1,
    default: 100
  },
  passingScore: {
    type: Number,
    required: true,
    min: 0,
    default: 50
  },
  duration: {
    type: Number, // in minutes
    min: 1
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  assignmentType: {
    type: String,
    enum: ['individual', 'class', 'all_students'],
    required: true,
    default: 'individual'
  },
  assignedTo: {
    studentIds: [{
      type: String,
      ref: 'Student'
    }],
    classGrades: [{
      type: String
    }]
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  showResultsImmediately: {
    type: Boolean,
    default: false
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  attemptsAllowed: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
testSchema.index({ 'createdBy.id': 1, createdAt: -1 });
testSchema.index({ organizationId: 1, status: 1 });
testSchema.index({ status: 1, startDate: 1, endDate: 1 });
testSchema.index({ 'assignedTo.studentIds': 1 });
testSchema.index({ 'assignedTo.classGrades': 1 });

export default (mongoose.models && mongoose.models.Test) || mongoose.model<ITest>('Test', testSchema);

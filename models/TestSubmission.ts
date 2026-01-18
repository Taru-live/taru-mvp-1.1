import mongoose from 'mongoose';

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  questionType: 'mcq' | 'written' | 'video';
  answer: string | string[]; // For MCQ: option ID(s), for written: text, for video: video URL
  videoUrl?: string; // For video answers
  submittedAt: Date;
}

export interface ITestSubmission extends mongoose.Document {
  testId: mongoose.Types.ObjectId;
  studentId: string; // Student uniqueId or userId
  studentUserId: string; // User ID for the student
  attemptNumber: number;
  answers: IAnswer[];
  startedAt: Date;
  submittedAt?: Date;
  timeSpent?: number; // in seconds
  status: 'in_progress' | 'submitted' | 'evaluated' | 'graded';
  autoScore?: number; // For MCQ auto-grading
  totalScore?: number; // Final score after evaluation
  percentage?: number;
  isPassed?: boolean;
  evaluatedBy?: {
    type: 'teacher' | 'organization';
    id: string;
    name: string;
    evaluatedAt: Date;
  };
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestQuestion',
    required: true
  },
  questionType: {
    type: String,
    enum: ['mcq', 'written', 'video'],
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string or array
    required: true
  },
  videoUrl: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const testSubmissionSchema = new mongoose.Schema<ITestSubmission>({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  studentId: {
    type: String,
    required: true,
    ref: 'Student'
  },
  studentUserId: {
    type: String,
    required: true,
    ref: 'User'
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  answers: [answerSchema],
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  submittedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // in seconds
    min: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'evaluated', 'graded'],
    default: 'in_progress'
  },
  autoScore: {
    type: Number,
    min: 0
  },
  totalScore: {
    type: Number,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  isPassed: {
    type: Boolean
  },
  evaluatedBy: {
    type: {
      type: String,
      enum: ['teacher', 'organization']
    },
    id: {
      type: String
    },
    name: {
      type: String
    },
    evaluatedAt: {
      type: Date
    }
  },
  feedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot be more than 2000 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
testSubmissionSchema.index({ testId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
testSubmissionSchema.index({ studentId: 1, status: 1 });
testSubmissionSchema.index({ testId: 1, status: 1 });
testSubmissionSchema.index({ submittedAt: -1 });

export default (mongoose.models && mongoose.models.TestSubmission) || mongoose.model<ITestSubmission>('TestSubmission', testSubmissionSchema);

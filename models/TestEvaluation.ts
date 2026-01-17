import mongoose from 'mongoose';

export interface IQuestionEvaluation {
  questionId: mongoose.Types.ObjectId;
  pointsAwarded: number;
  maxPoints: number;
  feedback?: string;
  evaluatedAt: Date;
}

export interface ITestEvaluation extends mongoose.Document {
  submissionId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  studentId: string;
  evaluatedBy: {
    type: 'teacher' | 'organization';
    id: string;
    name: string;
  };
  questionEvaluations: IQuestionEvaluation[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  overallFeedback?: string;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const questionEvaluationSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestQuestion',
    required: true
  },
  pointsAwarded: {
    type: Number,
    required: true,
    min: 0
  },
  maxPoints: {
    type: Number,
    required: true,
    min: 0
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot be more than 1000 characters']
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const testEvaluationSchema = new mongoose.Schema<ITestEvaluation>({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSubmission',
    required: true,
    unique: true
    // Note: unique: true automatically creates an index
  },
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
  evaluatedBy: {
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
  questionEvaluations: [questionEvaluationSchema],
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isPassed: {
    type: Boolean,
    required: true
  },
  overallFeedback: {
    type: String,
    maxlength: [2000, 'Overall feedback cannot be more than 2000 characters']
  },
  evaluatedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
testEvaluationSchema.index({ testId: 1, studentId: 1 });
testEvaluationSchema.index({ 'evaluatedBy.id': 1, evaluatedAt: -1 });
// Note: submissionId already has an index from unique: true

export default (mongoose.models && mongoose.models.TestEvaluation) || mongoose.model<ITestEvaluation>('TestEvaluation', testEvaluationSchema);

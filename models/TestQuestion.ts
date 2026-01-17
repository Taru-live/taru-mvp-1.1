import mongoose from 'mongoose';

export type QuestionType = 'mcq' | 'written' | 'video';

export interface IMCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ITestQuestion extends mongoose.Document {
  testId: mongoose.Types.ObjectId;
  questionType: QuestionType;
  questionText: string;
  points: number;
  order: number;
  
  // MCQ specific fields
  options?: IMCQOption[];
  correctAnswer?: string; // For single correct answer MCQ
  correctAnswers?: string[]; // For multiple correct answers
  
  // Written answer specific fields
  expectedAnswer?: string; // Sample answer for reference
  evaluationCriteria?: {
    keyword: string;
    points: number;
    description: string;
  }[];
  minWords?: number;
  maxWords?: number;
  
  // Video specific fields
  videoUrl?: string;
  videoDuration?: number; // in seconds
  prompt?: string; // What the student should demonstrate in the video
  
  // Common fields
  explanation?: string; // For MCQ - shown after submission
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const mcqOptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false
  }
}, { _id: false });

const evaluationCriteriaSchema = new mongoose.Schema({
  keyword: {
    type: String,
    required: true,
    trim: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
}, { _id: false });

const testQuestionSchema = new mongoose.Schema<ITestQuestion>({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  questionType: {
    type: String,
    enum: ['mcq', 'written', 'video'],
    required: true
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [2000, 'Question text cannot be more than 2000 characters']
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    default: 10
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  
  // MCQ fields
  options: [mcqOptionSchema],
  correctAnswer: {
    type: String
  },
  correctAnswers: [{
    type: String
  }],
  
  // Written answer fields
  expectedAnswer: {
    type: String,
    maxlength: [5000, 'Expected answer cannot be more than 5000 characters']
  },
  evaluationCriteria: [evaluationCriteriaSchema],
  minWords: {
    type: Number,
    min: 0
  },
  maxWords: {
    type: Number,
    min: 0
  },
  
  // Video fields
  videoUrl: {
    type: String
  },
  videoDuration: {
    type: Number, // in seconds
    min: 0
  },
  prompt: {
    type: String,
    maxlength: [1000, 'Prompt cannot be more than 1000 characters']
  },
  
  // Common fields
  explanation: {
    type: String,
    maxlength: [1000, 'Explanation cannot be more than 1000 characters']
  },
  attachments: [attachmentSchema]
}, {
  timestamps: true
});

// Indexes
testQuestionSchema.index({ testId: 1, order: 1 });
testQuestionSchema.index({ questionType: 1 });

export default (mongoose.models && mongoose.models.TestQuestion) || mongoose.model<ITestQuestion>('TestQuestion', testQuestionSchema);

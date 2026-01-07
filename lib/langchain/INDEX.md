# LangChain Implementation Index

Quick reference for all LangChain components.

## 📁 Directory Structure

```
lib/langchain/
├── chains/                          # LangChain chains
│   ├── chatChain.ts                # AI Buddy Chat
│   ├── learningPathChain.ts        # Learning Path Generation
│   ├── assessmentChain.ts          # Assessment Questions
│   ├── moduleContentChain.ts       # MCQ/Flashcards
│   └── assessmentAnalysisChain.ts  # Assessment Analysis
│
├── prompts/                         # Prompt templates
│   ├── chat.ts                     # Chat prompts
│   ├── learningPath.ts             # Learning path prompts
│   ├── assessment.ts               # Assessment prompts
│   ├── moduleContent.ts            # Module content prompts
│   └── assessmentAnalysis.ts      # Analysis prompts
│
├── memory/                          # Memory management
│   └── chatMemory.ts              # Chat conversation memory
│
├── utils/                           # Utilities
│   ├── config.ts                   # Configuration
│   └── llm.ts                      # LLM factory
│
├── LangChainService.ts              # Main service (replaces N8NService)
├── README.md                        # Complete documentation
├── MIGRATION_EXAMPLES.md            # Code migration examples
└── INDEX.md                         # This file
```

## 🔗 Quick Links

### Documentation
- [Complete README](./README.md) - Full LangChain documentation
- [Migration Examples](./MIGRATION_EXAMPLES.md) - Code examples for migrating routes
- [Migration Guide](../../LANGCHAIN_MIGRATION_GUIDE.md) - Step-by-step migration guide

### Core Components

#### Chains
- [`chatChain.ts`](./chains/chatChain.ts) - Chat assistant chain
- [`learningPathChain.ts`](./chains/learningPathChain.ts) - Learning path generation
- [`assessmentChain.ts`](./chains/assessmentChain.ts) - Assessment question generation
- [`moduleContentChain.ts`](./chains/moduleContentChain.ts) - MCQ/flashcard generation
- [`assessmentAnalysisChain.ts`](./chains/assessmentAnalysisChain.ts) - Result analysis

#### Prompts
- [`chat.ts`](./prompts/chat.ts) - Chat conversation prompts
- [`learningPath.ts`](./prompts/learningPath.ts) - Learning path prompts
- [`assessment.ts`](./prompts/assessment.ts) - Assessment question prompts
- [`moduleContent.ts`](./prompts/moduleContent.ts) - MCQ/flashcard prompts
- [`assessmentAnalysis.ts`](./prompts/assessmentAnalysis.ts) - Analysis prompts

#### Services
- [`LangChainService.ts`](./LangChainService.ts) - Main service class

## 🚀 Usage Examples

### Chat
```typescript
import { LangChainService } from '@/lib/langchain/LangChainService';
const service = new LangChainService();
const response = await service.generateResponse(message, context, studentData);
```

### Learning Path
```typescript
const path = await service.generateLearningPath(content, preferences);
```

### Assessment Questions
```typescript
const questions = await service.generateAssessmentQuestions({
  studentName, age, classGrade, languagePreference, schoolName, preferredSubject, type
});
```

### Module Content
```typescript
const mcqs = await service.generateMCQs(uniqueId);
const flashcards = await service.generateFlashcards(uniqueId);
```

### Assessment Analysis
```typescript
const analysis = await service.analyzeAssessmentResults(uniqueId, responses);
```

## 📊 Workflow Mappings

| Original n8n Workflow | LangChain Chain | Service Method |
|----------------------|----------------|----------------|
| AI-BUDDY-MAIN | `chatChain.ts` | `generateResponse()` |
| learnign-path | `learningPathChain.ts` | `generateLearningPath()` |
| assessment-questions | `assessmentChain.ts` | `generateAssessmentQuestions()` |
| MCQ/Flash/questions | `moduleContentChain.ts` | `generateMCQs()` / `generateFlashcards()` |
| Score-result | `assessmentAnalysisChain.ts` | `analyzeAssessmentResults()` |

## ⚙️ Configuration

All configuration in [`utils/config.ts`](./utils/config.ts):
- Temperature settings per workflow
- Token limits
- Model selection
- Cache settings

## 🔧 Environment Variables

Required:
- `OPENAI_API_KEY`

Optional:
- `OPENAI_MODEL` (default: 'gpt-4o-mini')
- `CHAT_TEMPERATURE` (default: 0.7)
- `LEARNING_PATH_TEMPERATURE` (default: 0.5)
- `ASSESSMENT_TEMPERATURE` (default: 0.3)
- `MODULE_CONTENT_TEMPERATURE` (default: 0.4)

## 📝 Migration Checklist

- [ ] Install LangChain dependencies
- [ ] Set `OPENAI_API_KEY` environment variable
- [ ] Update API routes to use `LangChainService`
- [ ] Test all workflows
- [ ] Verify caching behavior
- [ ] Check error handling
- [ ] Monitor OpenAI API usage

## 🆘 Troubleshooting

1. Check [`README.md`](./README.md) for detailed docs
2. Review [`MIGRATION_EXAMPLES.md`](./MIGRATION_EXAMPLES.md) for code patterns
3. Verify environment variables are set
4. Check error logs for specific issues


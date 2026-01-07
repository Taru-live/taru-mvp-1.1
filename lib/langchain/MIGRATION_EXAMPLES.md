# LangChain Migration Examples

This document shows how to migrate API routes from n8n webhooks to LangChain.

## Example 1: Chat Route Migration

### Before (n8n webhook):
```typescript
// app/api/chat/route.ts (OLD)
const webhookUrl = process.env.N8N_WEBHOOK_URL;
const response = await fetch(webhookUrl, { ... });
```

### After (LangChain):
```typescript
// app/api/chat/route.ts (NEW)
import { LangChainService } from '@/lib/langchain/LangChainService';

const langChainService = new LangChainService();
const result = await langChainService.generateResponse(
  query,
  { pdfContent, selectedText, currentTime, bookmarks, action },
  { name: studentData.name, grade: studentData.grade, school: studentData.school }
);
```

## Example 2: Learning Path Generation

### Before (n8n webhook):
```typescript
// app/api/learning-paths/generate/route.ts (OLD)
const response = await fetch(N8N_LEARNING_PATH_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify(learningPathData)
});
```

### After (LangChain):
```typescript
// app/api/learning-paths/generate/route.ts (NEW)
import { LangChainService } from '@/lib/langchain/LangChainService';

const langChainService = new LangChainService();
const learningPath = await langChainService.generateLearningPath(
  content,
  {
    studentName: user.name,
    grade: user.profile?.grade,
    skills: assessment.subjectsILike,
    interests: assessment.topicsThatExciteMe,
    // ... other fields
  }
);
```

## Example 3: Assessment Questions Generation

### Before (n8n webhook):
```typescript
// app/api/assessment/generate-questions/route.ts (OLD)
const urlParams = new URLSearchParams({ uniqueID: student.uniqueId });
const response = await fetch(`${N8N_ASSESSMENT_WEBHOOK_URL}?${urlParams}`);
```

### After (LangChain):
```typescript
// app/api/assessment/generate-questions/route.ts (NEW)
import { LangChainService } from '@/lib/langchain/LangChainService';

const langChainService = new LangChainService();
const questions = await langChainService.generateAssessmentQuestions({
  studentName: user.name,
  age: student.age,
  classGrade: student.classGrade,
  languagePreference: student.languagePreference,
  schoolName: student.schoolName,
  preferredSubject: student.preferredSubject,
  type: 'diagnostic',
});
```

## Example 4: Module Content Generation (MCQ)

### Before (n8n webhook):
```typescript
// app/api/modules/generate-content/route.ts (OLD)
const urlParams = new URLSearchParams({ uniqueID: uniqueId });
const response = await fetch(`${N8N_MODULE_ASSESSMENT_WEBHOOK_URL}?${urlParams}`);
```

### After (LangChain):
```typescript
// app/api/modules/generate-content/route.ts (NEW)
import { LangChainService } from '@/lib/langchain/LangChainService';

const langChainService = new LangChainService();
if (type === 'mcq') {
  const questions = await langChainService.generateMCQs(uniqueId, forceRegenerate);
} else if (type === 'flash') {
  const flashcards = await langChainService.generateFlashcards(uniqueId, forceRegenerate);
}
```

## Example 5: Assessment Result Analysis

### Before (n8n webhook):
```typescript
// app/api/assessment/result/route.ts (OLD)
const urlParams = new URLSearchParams({ uniqueId: student.uniqueId });
const response = await fetch(`${N8N_SCORE_WEBHOOK_URL}?${urlParams}`);
```

### After (LangChain):
```typescript
// app/api/assessment/result/route.ts (NEW)
import { LangChainService } from '@/lib/langchain/LangChainService';

const langChainService = new LangChainService();
const analysis = await langChainService.analyzeAssessmentResults(
  student.uniqueId,
  assessmentResponse.responses
);
```

## Migration Checklist

For each API route that uses n8n:

1. ✅ Import `LangChainService` from `@/lib/langchain/LangChainService`
2. ✅ Replace `fetch()` calls to n8n webhooks with `LangChainService` methods
3. ✅ Update error handling (LangChain throws standard errors, not HTTP errors)
4. ✅ Remove n8n webhook URL environment variables (keep for fallback if needed)
5. ✅ Update response parsing (LangChain returns structured data directly)
6. ✅ Test the migrated route thoroughly
7. ✅ Update any related TypeScript types/interfaces

## Environment Variables Migration

### Remove (n8n-specific):
- `N8N_WEBHOOK_URL`
- `N8N_ASSESSMENT_WEBHOOK_URL`
- `N8N_LEARNING_PATH_WEBHOOK_URL`
- `N8N_MODULE_ASSESSMENT_WEBHOOK_URL`

### Add (LangChain):
- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional, defaults to 'gpt-4o-mini')
- `OPENAI_TEMPERATURE` (optional, defaults vary by use case)
- `OPENAI_MAX_TOKENS` (optional, defaults vary by use case)


# LangChain Migration - Complete Documentation

## Overview

This directory contains the complete LangChain implementation that replaces all n8n workflows. The migration maintains **100% business logic compatibility** while moving from workflow-based automation to code-driven LangChain architecture.

## Architecture

```
lib/langchain/
├── chains/              # LangChain chains for each workflow
│   ├── chatChain.ts                    # AI Buddy Chat
│   ├── learningPathChain.ts            # Learning Path Generation
│   ├── assessmentChain.ts              # Assessment Questions Generation
│   ├── moduleContentChain.ts          # MCQ/Flashcard Generation
│   └── assessmentAnalysisChain.ts     # Assessment Result Analysis
├── prompts/            # Prompt templates for each workflow
│   ├── chat.ts
│   ├── learningPath.ts
│   ├── assessment.ts
│   ├── moduleContent.ts
│   └── assessmentAnalysis.ts
├── memory/             # Memory management for conversations
│   └── chatMemory.ts
├── utils/              # Utilities and configuration
│   ├── config.ts        # LangChain configuration
│   └── llm.ts          # LLM factory functions
└── LangChainService.ts  # Main service (replaces N8NService)
```

## Workflow Mappings

### 1. AI Buddy Chat
- **Original n8n Workflow**: `AI-BUDDY-MAIN`
- **LangChain Chain**: `chatChain.ts`
- **Prompt**: `prompts/chat.ts`
- **Service Method**: `LangChainService.generateResponse()`
- **Input**: Message, student context, PDF content, selected text
- **Output**: AI response with suggestions and related questions

### 2. Learning Path Generation
- **Original n8n Workflow**: `learnign-path`
- **LangChain Chain**: `learningPathChain.ts`
- **Prompt**: `prompts/learningPath.ts`
- **Service Method**: `LangChainService.generateLearningPath()`
- **Input**: Student profile, assessment results, preferences
- **Output**: Structured learning path with milestones

### 3. Assessment Questions Generation
- **Original n8n Workflow**: `assessment-questions`
- **LangChain Chain**: `assessmentChain.ts`
- **Prompt**: `prompts/assessment.ts`
- **Service Method**: `LangChainService.generateAssessmentQuestions()`
- **Input**: Student profile data
- **Output**: Array of assessment questions (MCQ and Open-ended)

### 4. Module Content Generation (MCQ/Flashcards)
- **Original n8n Workflow**: `MCQ/Flash/questions`
- **LangChain Chain**: `moduleContentChain.ts`
- **Prompt**: `prompts/moduleContent.ts`
- **Service Methods**: 
  - `LangChainService.generateMCQs()`
  - `LangChainService.generateFlashcards()`
- **Input**: Module uniqueId
- **Output**: MCQ questions or flashcards array

### 5. Assessment Result Analysis
- **Original n8n Workflow**: `Score-result`
- **LangChain Chain**: `assessmentAnalysisChain.ts`
- **Prompt**: `prompts/assessmentAnalysis.ts`
- **Service Method**: `LangChainService.analyzeAssessmentResults()`
- **Input**: Student uniqueId, assessment responses
- **Output**: Analysis with score, summary, learning style, recommendations

## Usage

### Basic Usage

```typescript
import { LangChainService } from '@/lib/langchain/LangChainService';

const langChainService = new LangChainService();

// Generate chat response
const chatResponse = await langChainService.generateResponse(
  "What is photosynthesis?",
  {
    pdfContent: "...",
    selectedText: "photosynthesis",
    currentTime: 120,
  },
  {
    name: "John Doe",
    grade: "6",
    school: "Example School",
  }
);

// Generate learning path
const learningPath = await langChainService.generateLearningPath(
  content,
  {
    studentName: "John Doe",
    grade: "6",
    skills: ["Math", "Science"],
    // ... other fields
  }
);
```

### Configuration

All configuration is centralized in `utils/config.ts`:

```typescript
import { LangChainConfig } from '@/lib/langchain/utils/config';

// Access configuration
const temperature = LangChainConfig.chat.temperature;
const maxTokens = LangChainConfig.learningPath.maxTokens;
```

### Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

Optional (with defaults):
- `OPENAI_MODEL` - Model name (default: 'gpt-4o-mini')
- `OPENAI_TEMPERATURE` - Default temperature (default: 0.7)
- `CHAT_TEMPERATURE` - Chat-specific temperature (default: 0.7)
- `LEARNING_PATH_TEMPERATURE` - Learning path temperature (default: 0.5)
- `ASSESSMENT_TEMPERATURE` - Assessment temperature (default: 0.3)
- `MODULE_CONTENT_TEMPERATURE` - Module content temperature (default: 0.4)

## Key Features

### 1. **Zero Business Logic Loss**
- All original n8n workflows are faithfully replicated
- Input/output contracts remain identical
- Caching behavior preserved
- Error handling maintained

### 2. **Structured Outputs**
- Uses Zod schemas for type-safe outputs
- Validates all LLM responses
- Provides fallback handling

### 3. **Caching Integration**
- Integrates with existing `N8NCacheService`
- Preserves 24-hour cache behavior
- Supports force regeneration

### 4. **Error Handling**
- Comprehensive try/catch blocks
- Graceful fallback to empty arrays/null
- Detailed error logging

### 5. **Type Safety**
- Full TypeScript support
- Zod schema validation
- Type-safe interfaces throughout

## Migration Steps

1. **Install Dependencies**
   ```bash
   npm install @langchain/core @langchain/openai @langchain/community langchain zod
   ```

2. **Set Environment Variables**
   - Add `OPENAI_API_KEY` to `.env`
   - Optionally configure temperature and token limits

3. **Update API Routes**
   - Replace `N8NService` imports with `LangChainService`
   - Update method calls (see `MIGRATION_EXAMPLES.md`)
   - Remove n8n webhook URL references

4. **Test Thoroughly**
   - Test each migrated endpoint
   - Verify output formats match original
   - Check caching behavior
   - Test error scenarios

5. **Remove n8n Dependencies** (Optional)
   - Remove n8n webhook URLs from `.env`
   - Clean up unused n8n-related code
   - Update documentation

## Temperature Settings Explained

Different workflows use different temperature settings to match original n8n behavior:

- **Chat (0.7)**: Balanced creativity and accuracy for conversational responses
- **Learning Path (0.5)**: More structured, deterministic output for consistent paths
- **Assessment (0.3)**: Very low temperature for accurate, consistent questions
- **Module Content (0.4)**: Balanced for creative but structured content

## Caching Behavior

All LangChain services integrate with the existing `N8NCacheService`:

- **Default Cache**: 24 hours
- **Cache Keys**: Based on uniqueId and resultType
- **Force Regenerate**: Supported via `forceRegenerate` parameter
- **Cache Storage**: MongoDB via `N8NResult` model

## Error Handling

All chains include comprehensive error handling:

1. **LLM Errors**: Caught and logged, returns empty/null
2. **Parsing Errors**: JSON parsing errors logged, fallback to empty
3. **Validation Errors**: Zod validation errors logged, fallback to empty
4. **Network Errors**: Not applicable (no external webhooks)

## Testing

To test LangChain services:

```typescript
import { LangChainService } from '@/lib/langchain/LangChainService';

const service = new LangChainService();

// Test chat
const chatResult = await service.generateResponse(
  "Test message",
  {},
  { name: "Test", grade: "6", school: "Test School" }
);
console.log(chatResult);
```

## Performance Considerations

- **Response Time**: LangChain calls are typically faster than n8n webhooks (no network overhead)
- **Token Usage**: Monitor OpenAI API usage via their dashboard
- **Caching**: Aggressive caching reduces LLM calls significantly
- **Cost**: Direct LLM calls may have different cost structure than n8n

## Troubleshooting

### Common Issues

1. **"OpenAI API key not found"**
   - Ensure `OPENAI_API_KEY` is set in `.env`
   - Restart the development server after adding

2. **"Failed to parse JSON response"**
   - Check LLM response in logs
   - May need to adjust prompt or temperature
   - Fallback handling should prevent crashes

3. **"Empty responses"**
   - Check OpenAI API quota/limits
   - Verify API key is valid
   - Check error logs for details

## Future Enhancements

Potential improvements:

1. **Streaming Responses**: Add streaming support for chat
2. **Memory Persistence**: Enhanced conversation memory
3. **Multi-Model Support**: Support for other LLM providers
4. **Fine-Tuning**: Custom fine-tuned models for specific tasks
5. **Agent Architecture**: Add agents for complex decision-making

## Support

For issues or questions:
1. Check error logs in console
2. Review `MIGRATION_EXAMPLES.md` for usage patterns
3. Verify environment variables are set correctly
4. Test with minimal examples first


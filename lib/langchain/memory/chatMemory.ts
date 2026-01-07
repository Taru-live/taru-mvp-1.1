/**
 * Chat Memory Management
 * 
 * Manages conversation memory for AI Buddy Chat.
 * Replaces n8n workflow memory/state handling.
 */

import { BufferMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/memory';
import connectDB from '@/lib/mongodb';
import { N8NResult } from '@/models/N8NResult';

/**
 * Create a buffer memory instance for a chat session
 * Original n8n behavior: Maintains conversation context
 */
export function createChatMemory(sessionId: string): BufferMemory {
  return new BufferMemory({
    memoryKey: 'chat_history',
    returnMessages: true,
    inputKey: 'message',
    outputKey: 'response',
  });
}

/**
 * Load chat history from database (if stored)
 * This replaces n8n's state persistence
 */
export async function loadChatHistory(sessionId: string): Promise<ChatMessageHistory | null> {
  try {
    await connectDB();
    
    // Check if we have stored chat history for this session
    const storedHistory = await N8NResult.findOne({
      'metadata.sessionId': sessionId,
      resultType: 'chat_history',
    }).sort({ createdAt: -1 });

    if (storedHistory && storedHistory.processedData) {
      const history = new ChatMessageHistory();
      // Restore messages from stored data
      // This would need to be implemented based on your storage format
      return history;
    }

    return null;
  } catch (error) {
    console.error('Error loading chat history:', error);
    return null;
  }
}

/**
 * Save chat history to database
 * Replaces n8n's state persistence mechanism
 */
export async function saveChatHistory(
  sessionId: string,
  history: ChatMessageHistory
): Promise<void> {
  try {
    await connectDB();
    
    const messages = await history.getMessages();
    
    await N8NResult.create({
      uniqueId: sessionId,
      resultType: 'chat_history',
      webhookUrl: 'langchain-chat',
      requestPayload: { sessionId },
      responseData: messages,
      processedData: messages,
      status: 'completed',
      metadata: {
        sessionId,
        contentType: 'chat_history',
      },
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}


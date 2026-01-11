'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    n8nOutput?: unknown;
    responseMetadata?: unknown;
    fallback?: boolean;
    error?: boolean;
  };
}

interface StudentData {
  name: string;
  grade?: string;
  interests?: string[];
  currentModules?: string[];
  email?: string;
  school?: string;
  studentId?: string;
  uniqueId?: string; // Add uniqueId field
  avatar?: string; // Add avatar field
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: StudentData;
}

export default function ChatModal({ isOpen, onClose, studentData }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showN8nOutput, setShowN8nOutput] = useState(false);
  const [studentUniqueId, setStudentUniqueId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to extract HTML from markdown code blocks
  const extractHTMLFromMarkdown = (content: string): string => {
    // Check if content contains HTML code block
    const htmlBlockRegex = /```html\s*([\s\S]*?)```/;
    const match = content.match(htmlBlockRegex);
    
    if (match && match[1]) {
      // Extract just the HTML content from the code block
      return match[1].trim();
    }
    
    return content;
  };

  // Function to safely render HTML content
  const renderHTMLContent = (htmlContent: string): React.ReactElement => {
    // First extract HTML from markdown if present
    const extractedHTML = extractHTMLFromMarkdown(htmlContent);
    
    // Check if content contains HTML tags
    const hasHTML = /<[^>]*>/g.test(extractedHTML);
    
    if (hasHTML) {
      // If it's HTML, render it safely
      return (
        <div 
          className="html-content break-words overflow-wrap-anywhere"
          style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: extractedHTML }}
        />
      );
    } else {
      // If it's plain text, render as text
      return <p className="text-xs sm:text-sm leading-relaxed break-words overflow-wrap-anywhere" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{extractedHTML}</p>;
    }
  };

  // Function to extract and format response content
  const extractResponseContent = (message: Message): React.ReactElement => {
    if (message.metadata?.n8nOutput) {
      const n8nOutput = message.metadata.n8nOutput as any;
      
      // Check if we have extracted response data
      if (n8nOutput.aiResponse && typeof n8nOutput.aiResponse === 'string') {
        const htmlContent = n8nOutput.aiResponse.trim();
        if (htmlContent) {
          return renderHTMLContent(htmlContent);
        }
      }
      
      // Check for responseText as alternative
      if (n8nOutput.responseText && typeof n8nOutput.responseText === 'string') {
        const htmlContent = n8nOutput.responseText.trim();
        if (htmlContent) {
          return renderHTMLContent(htmlContent);
        }
      }
      
      // Fallback to regular content
      if (message.content) {
        return renderHTMLContent(message.content);
      }
    }
    
    // Default fallback - ensure content is always a string
    const content = message.content || '';
    return renderHTMLContent(content);
  };

  const fetchStudentUniqueId = useCallback(async () => {
    try {
      // If studentData already has uniqueId, use it
      if (studentData.uniqueId) {
        setStudentUniqueId(studentData.uniqueId);
        return;
      }

      // Otherwise, fetch it from the API
      const response = await fetch('/api/student/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.uniqueId) {
          setStudentUniqueId(data.uniqueId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch student unique ID:', error);
    }
  }, [studentData.uniqueId]);

  // Generate session ID and fetch student's unique ID when modal opens
  useEffect(() => {
    if (isOpen && !sessionId) {
      // Generate a unique session ID for this chat session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      fetchStudentUniqueId();
      
      // Initialize with welcome message
      setMessages([
        {
          id: '1',
          content: `Hi ${studentData.name}! I&apos;m your AI Learning Assistant. I&apos;m here to help you with your studies, answer questions, and guide you through your learning journey. What would you like to know?`,
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    }
  }, [isOpen, sessionId, studentData.name, fetchStudentUniqueId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call your n8n API with student unique ID
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentMessage,
          studentUniqueId: studentUniqueId, // Send student's unique ID
          sessionId: sessionId, // Send session ID
          studentData: {
            name: studentData.name,
            email: studentData.email,
            grade: studentData.grade,
            school: studentData.school || 'Taru Learning',
            uniqueId: studentUniqueId, // Include unique ID in student data
            timestamp: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();
      
      // Log debug information to console
      console.log('Chat API Response:', data);
      if (data.n8nOutput) {
        console.log('N8N Output:', data.n8nOutput);
        console.log('AI-BUDDY Input:', data.n8nOutput.aiInput);
        console.log('AI-BUDDY Response:', data.n8nOutput.aiResponse);
        console.log('Response Metadata:', data.metadata);
        console.log('Webhook URL used:', data.metadata?.webhookUrl);
        console.log('Response time:', data.metadata?.responseTime);
      }

      if (data.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          isUser: false,
          timestamp: new Date(),
          metadata: {
            n8nOutput: data.n8nOutput,
            responseMetadata: data.metadata,
            fallback: data.fallback || false
          }
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Handle API errors
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || "I&apos;m having trouble connecting right now. Please try again later.",
          isUser: false,
          timestamp: new Date(),
          metadata: {
            error: true,
            fallback: true
          }
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      // Fallback response for network errors
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Hi ${studentData.name}! I&apos;m having trouble connecting to my learning database right now. While I work on reconnecting, feel free to ask me about your studies, and I&apos;ll help you as soon as I can!`,
        isUser: false,
        timestamp: new Date(),
        metadata: {
          error: true,
          fallback: true
        }
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      x: 100,
      y: 100,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: 100,
      y: 100,
    }
  };

  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    }
  };

  const loadingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Add styles for HTML content */}
      <style jsx>{`
        .html-content {
          font-family: inherit;
          line-height: inherit;
          color: inherit;
        }
        .html-content h1 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: inherit;
          line-height: 1.3;
        }
        .html-content h2 {
           font-size: 1.125rem;
           font-weight: 600;
           margin-bottom: 0.5rem;
           color: inherit;
           line-height: 1.3;
         }
         .html-content h3 {
           font-size: 1rem;
           font-weight: 600;
           margin-bottom: 0.5rem;
           margin-top: 0.75rem;
           color: inherit;
           line-height: 1.3;
         }
        .html-content p {
          margin-bottom: 0.5rem;
          line-height: 1.5;
          color: inherit;
        }
        .html-content hr {
          margin: 0.75rem 0;
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, currentColor, transparent);
          opacity: 0.3;
        }
        .html-content em {
          font-style: italic;
        }
        .html-content strong {
          font-weight: 600;
        }
        .html-content ul, .html-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .html-content li {
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
        .html-content blockquote {
          margin: 0.5rem 0;
          padding-left: 1rem;
          border-left: 3px solid currentColor;
          opacity: 0.8;
        }
        .html-content code {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
        }
        .html-content pre {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.75rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        .html-content pre code {
          background: none;
          padding: 0;
        }
        .html-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.5rem 0;
        }
        .html-content th, .html-content td {
          border: 1px solid currentColor;
          padding: 0.25rem 0.5rem;
          text-align: left;
        }
        .html-content th {
          background-color: rgba(0, 0, 0, 0.1);
          font-weight: 600;
        }
        .html-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        .html-content a {
          color: inherit;
          text-decoration: underline;
          text-decoration-color: currentColor;
          text-decoration-thickness: 1px;
        }
        .html-content a:hover {
           opacity: 0.8;
         }
         .html-content head,
         .html-content title {
           display: none;
         }
         .html-content body {
           margin: 0;
           padding: 0;
         }
         .scrollbar-hide::-webkit-scrollbar {
           display: none;
         }
      `}</style>
      
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div 
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl sm:max-w-5xl h-[90vh] sm:h-[600px] max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button positioned at top-right corner */}
            <motion.button 
              onClick={onClose} 
              className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-transparent p-1.5 sm:p-2 touch-manipulation z-10 flex items-center justify-center"
              whileHover={{ 
                scale: 1.1,
                rotate: 90,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Image 
                src="/icons/cross-icon.png" 
                alt="Close" 
                width={20} 
                height={20} 
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            </motion.button>

            {/* Messages */}
            <motion.div 
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none', /* IE and Edge */
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {/* Welcome text at the start of chatbox */}
              <motion.div
                className="flex flex-col justify-center items-center mb-4 sm:mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {/* Mask group image */}
                <motion.div
                  className="mb-3 sm:mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Image
                    src="/icons/Mask group.png"
                    alt="Chatbot Icon"
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  />
                </motion.div>
                <motion.p
                  className="text-gray-700 text-sm sm:text-base md:text-lg font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  What can i help you?
                </motion.p>
              </motion.div>
              
              <AnimatePresence>
                {messages.map((message, _index) => (
                  <motion.div
                    key={message.id}
                    className={`flex items-start gap-2 sm:gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                  >
                    {/* Chatbot Avatar - Left side for bot messages */}
                    {!message.isUser && (
                      <motion.div
                        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center border-2 border-purple-200 shadow-sm overflow-hidden p-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                      >
                        <Image 
                          src="/icons/chatbot-icon.png" 
                          alt="AI Assistant" 
                          width={32} 
                          height={32} 
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    )}
                    
                    <motion.div
                      className="max-w-[50%] p-2.5 sm:p-3 rounded-2xl bg-white text-gray-900 shadow-sm border border-gray-100 break-words overflow-wrap-anywhere"
                      style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                    >
                      {extractResponseContent(message)}
                      
                      <motion.p 
                        className="text-xs mt-1 text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </motion.p>
                    </motion.div>
                    
                    {/* User Avatar - Right side for user messages */}
                    {message.isUser && (
                      <motion.div
                        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-200 shadow-sm overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                      >
                        {studentData.avatar ? (
                          <Image 
                            src={studentData.avatar} 
                            alt={studentData.name} 
                            width={40} 
                            height={40} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold text-xs sm:text-sm">
                            {studentData.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    className="flex justify-start"
                    variants={loadingVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.div 
                      className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100"
                      animate={{ 
                        scale: [1, 1.02, 1],
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 0.8,
                            repeat: Infinity,
                            delay: 0
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 0.8,
                            repeat: Infinity,
                            delay: 0.2
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 0.8,
                            repeat: Infinity,
                            delay: 0.4
                          }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </motion.div>

            {/* Input */}
            <motion.div 
              className="p-3 sm:p-4 border-t border-gray-200 rounded-b-2xl sm:rounded-b-3xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {/* Input Mode Options */}
              <div className="flex gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <motion.button
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium transition-all duration-200 ${
                    inputMode === 'text'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    borderRadius: '20px'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Type className="w-3 h-3" />
                  <span>Text</span>
                </motion.button>
                <motion.button
                  onClick={() => setInputMode('voice')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium transition-all duration-200 ${
                    inputMode === 'voice'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    borderRadius: '20px'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic className="w-3 h-3" />
                  <span>Voice</span>
                </motion.button>
              </div>
              
              <div className="flex gap-2 items-center">
                <motion.button
                  className={`flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-1 border transition-colors touch-manipulation flex items-center justify-center ${
                    inputMode === 'voice'
                      ? 'border-purple-300 bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                  }`}
                  style={{
                    borderRadius: '20px'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={inputMode === 'voice' ? "Start voice recording" : "Switch to voice mode"}
                  onClick={() => setInputMode('voice')}
                >
                  <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </motion.button>
                <motion.textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={inputMode === 'text' ? "Ask me anything about your learning..." : "Tap the mic to speak..."}
                  className="flex-1 h-8 sm:h-9 px-2 sm:px-2.5 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-gray-900 bg-white text-sm touch-manipulation"
                  style={{
                    borderRadius: '20px'
                  }}
                  rows={1}
                  disabled={isLoading || inputMode === 'voice'}
                  whileFocus={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="h-8 w-8 sm:h-9 sm:w-9 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation flex items-center justify-center"
                  whileHover={{ 
                    scale: 1.05
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-purple-600 border-t-transparent rounded-full"
                    />
                  ) : (
                    <Image 
                      src="/icons/send.png" 
                      alt="Send" 
                      width={30} 
                      height={30} 
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                    />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

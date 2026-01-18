'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FileText, PlayCircle, Send, Loader2, Upload, ZoomIn, ZoomOut, Bot, User, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { Button } from './ai-buddy/ui/button';
import { Input } from './ai-buddy/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ai-buddy/ui/card';
import { Alert, AlertDescription } from './ai-buddy/ui/alert';
import { initializeGemini, getGeminiService, ActionType, AIResponse } from '@/lib/ai-buddy/gemini';
import contextService from '@/lib/ai-buddy/contextService';
import speechService from '@/lib/ai-buddy/speechService';
import multilingualService from '@/lib/ai-buddy/multilingualService';
import '@/lib/ai-buddy/setGeminiKey'; // Auto-set the Gemini API key

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  language?: string;
  hasAudio?: boolean;
}

export default function AIBuddyTab() {
  const [isPDFReady, setIsPDFReady] = useState(false);
  const [pdfContent, setPdfContent] = useState('');
  const [isAPIKeySet, setIsAPIKeySet] = useState(false);
  const [isSettingUpAPI, setIsSettingUpAPI] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState<string>('');
  const [learningMode, setLearningMode] = useState<'pdf' | 'video'>('pdf');
  const [zoom, setZoom] = useState(100);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your AI reading assistant. Upload a PDF and I\'ll help you understand and interact with the content.',
      timestamp: new Date()
    }
  ]);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleAPIKeySet = async (apiKey: string) => {
    setIsSettingUpAPI(true);
    try {
      if (apiKey === 'demo-mode') {
        // Demo mode - no API initialization needed
      } else {
        initializeGemini(apiKey);
        localStorage.setItem('gemini_api_key', apiKey);
      }
      setCurrentApiKey(apiKey);
      setIsAPIKeySet(true);
    } catch (error) {
      console.error('Error setting up API:', error);
    } finally {
      setIsSettingUpAPI(false);
    }
  };

  // Auto-initialize with API key on mount
  useEffect(() => {
    // Initialize Gemini service with the API key from environment variable
    const apiKey: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (apiKey && apiKey !== 'demo-mode') {
      handleAPIKeySet(apiKey);
    } else {
      setIsAPIKeySet(true);
      setCurrentApiKey('demo-mode');
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePDFReady = (extractedText: string) => {
    setPdfContent(extractedText);
    setIsPDFReady(true);
    contextService.setDocument(extractedText, 'PDF Document');
    
    const welcomeMessage: Message = {
      id: Date.now(),
      type: 'assistant',
      content: 'Your book is ready! Click on any sentence or ask me something below. I can help explain content, define words, or read text aloud.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, welcomeMessage]);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setIsLoading(true);
    try {
      // Dynamically import pdfjs-dist only on client side
      if (typeof window === 'undefined') {
        throw new Error('PDF processing is only available in the browser');
      }

      const pdfjsLib = await import('pdfjs-dist');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Ensure worker is configured before loading document
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
      }
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer, 
        verbosity: 0
      });
      const pdf = await loadingTask.promise;
      
      const pages: string[] = [];
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str.trim())
          .join(' ');
        
        if (pageText) fullText += pageText + '\n\n';

        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas: canvas, canvasContext: context, viewport }).promise;
        pages.push(canvas.toDataURL('image/png', 0.8));
      }

      setPdfPages(pages);
      handlePDFReady(fullText.trim());
    } catch (error: any) {
      console.error('PDF processing error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to process PDF. ';
      if (error?.message?.includes('worker') || error?.message?.includes('Worker')) {
        errorMessage += 'PDF.js worker failed to load. Please check your internet connection and try again.';
      } else if (error?.message?.includes('Invalid PDF')) {
        errorMessage += 'The file appears to be corrupted or not a valid PDF.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const question = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const aiService = getGeminiService();
      if (aiService && isPDFReady && currentApiKey !== 'demo-mode') {
        const response = await aiService.processTextSelection(
          question,
          'general-question',
          pdfContent,
          false
        );
        const assistantMessage: Message = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.text,
          timestamp: new Date(),
          hasAudio: true
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          type: 'assistant',
          content: isPDFReady 
            ? `I understand your question: "${question}". In demo mode, I provide basic responses. For full AI-powered assistance, please add your Gemini API key in settings.`
            : 'Please upload a PDF first so I can provide context-aware assistance.',
          timestamp: new Date(),
          hasAudio: true
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (messageId: number, text: string) => {
    try {
      speechService.stopSpeaking();
      setPlayingMessageId(messageId);
      const languageCode = multilingualService.getCurrentLanguage().code;
      speechService.setLanguage(languageCode);
      await speechService.speakWithBrowser(text, { language: languageCode });
      setPlayingMessageId(null);
    } catch (error) {
      console.error('Audio playback error:', error);
      setPlayingMessageId(null);
    }
  };

  const stopAudio = () => {
    speechService.stopSpeaking();
    setPlayingMessageId(null);
  };

  if (!isAPIKeySet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold">Setup AI Reading Assistant</CardTitle>
            <CardDescription>
              Enter your Gemini API key or use demo mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => handleAPIKeySet('demo-mode')}
              disabled={isSettingUpAPI}
            >
              {isSettingUpAPI ? 'Setting up...' : 'Start with Demo Mode'}
            </Button>
            <Alert>
              <AlertDescription className="text-xs">
                Demo mode provides limited features. For full AI-powered assistance, add your Gemini API key.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">Learning Mode</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={learningMode === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLearningMode('pdf')}
              >
                <FileText className="w-4 h-4" />
                PDF Reader
              </Button>
              <Button
                variant={learningMode === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLearningMode('video')}
              >
                <PlayCircle className="w-4 h-4" />
                Video Learning
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {learningMode === 'pdf' ? (
          <>
            {/* Left Panel - PDF Viewer */}
            <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">PDF Reader</h3>
            {isPDFReady && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(50, zoom - 25))} disabled={zoom <= 50}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))} disabled={zoom >= 200}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 max-h-[calc(100vh-200px)]">
            {!isPDFReady ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Upload PDF Document</h3>
                  <p className="text-sm text-gray-600">Select a PDF file to start reading with AI assistance</p>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2"/>
                        Choose PDF File
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pdfPages.map((pageUrl, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                  >
                    <Image src={pageUrl} alt={`Page ${index + 1}`} width={800} height={1000} className="w-full h-auto" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - AI Assistant */}
        <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
          <div className="flex-shrink-0 p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-500">
              {isPDFReady ? 'Ready to help with your document' : 'Your intelligent reading companion'}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {message.type === 'assistant' && message.hasAudio && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playingMessageId === message.id ? stopAudio() : playAudio(message.id, message.content)}
                      >
                        {playingMessageId === message.id ? (
                          <VolumeX className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-end gap-3">
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                onClick={() => setIsRecording(!isRecording)}
                disabled={!isPDFReady || isLoading}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Input
                placeholder={isPDFReady ? "Ask me anything about your document..." : "Upload a PDF to start..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isLoading || !isPDFReady}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!inputText.trim() || isLoading || !isPDFReady}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
          </>
        ) : (
          /* Video Learning Mode - Placeholder */
          <div className="col-span-2 h-full flex items-center justify-center bg-white rounded-lg border border-gray-200">
            <div className="text-center space-y-4">
              <PlayCircle className="w-16 h-16 text-gray-400 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900">Video Learning Mode</h3>
              <p className="text-sm text-gray-600">Video learning features coming soon!</p>
              <Button onClick={() => setLearningMode('pdf')} variant="outline">
                Switch to PDF Mode
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useCallback } from 'react';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface MindMapData {
  title: string;
  summary?: string;
  children: MindMapSection[];
}

interface MindMapSection {
  title: string;
  icon?: string;
  description?: string;
  children?: MindMapSection[];
}

export default function MindMapTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setProcessingStep('Reading your PDF...');

    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProcessingStep('Analyzing content with AI...');

      // Call API route
      const response = await fetch('/api/mindmap/process-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          fileName: file.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process PDF');
      }

      const data = await response.json();
      if (!data?.mindMap) {
        throw new Error('No mind map data received');
      }

      setProcessingStep('Building your mind map...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      setMindMapData(data.mindMap);
      toast.success('Mind map generated successfully!');
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to generate mind map. Please try again.'
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setMindMapData(null);
    setIsProcessing(false);
    setProcessingStep('');
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {!mindMapData && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Transform PDFs into Beautiful Mind Maps
                </h2>
                <p className="text-gray-600">
                  Upload any document and watch as AI crafts a stunning, interactive mind map
                </p>
              </div>

              {isProcessing ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-700">{processingStep}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="pdf-upload"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Drop your PDF here
                      </h3>
                      <p className="text-gray-600">
                        or <span className="text-purple-600 font-medium">browse</span> to choose a file
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports PDF files up to 20MB
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {mindMapData && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{mindMapData.title}</h3>
                    {mindMapData.summary && (
                      <p className="text-gray-600 mt-2">{mindMapData.summary}</p>
                    )}
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    New Mind Map
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {mindMapData.children.map((section, idx) => (
                    <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        {section.icon && <span className="text-xl">{section.icon}</span>}
                        <h4 className="font-semibold text-gray-900">{section.title}</h4>
                      </div>
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                      )}
                      {section.children && (
                        <div className="ml-6 mt-2 space-y-2">
                          {section.children.map((sub, subIdx) => (
                            <div key={subIdx} className="border-l-2 border-gray-300 pl-3 py-1">
                              <div className="flex items-center gap-2">
                                {sub.icon && <span>{sub.icon}</span>}
                                <span className="text-sm font-medium text-gray-700">{sub.title}</span>
                              </div>
                              {sub.children && (
                                <div className="ml-4 mt-1 space-y-1">
                                  {sub.children.map((point, pointIdx) => (
                                    <div key={pointIdx} className="text-xs text-gray-600 flex items-center gap-2">
                                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                      {point.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

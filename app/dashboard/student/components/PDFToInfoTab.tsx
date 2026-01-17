'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { FileText, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedPDF {
  title: string;
  totalPages: number;
  fullText: string;
}

interface BrainstormedTopic {
  id: string;
  title: string;
  description: string;
}

interface GeneratedInfographic {
  id: string;
  sectionTitle: string;
  imageUrl: string;
  isLoading: boolean;
  error?: string;
}

type InfographicTheme = 'handwritten' | 'professional' | 'cartoon' | 'retro' | 'minimal';

export default function PDFToInfoTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedPdf, setParsedPdf] = useState<ParsedPDF | null>(null);
  const [topics, setTopics] = useState<BrainstormedTopic[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<InfographicTheme>('handwritten');
  const [infographics, setInfographics] = useState<GeneratedInfographic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);

  const parsePDF = useCallback(async (file: File): Promise<ParsedPDF> => {
    const arrayBuffer = await file.arrayBuffer();
    // Using pdfjs-dist from the project
    const pdfjsLib = await import('pdfjs-dist');
    
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return {
      title: file.name.replace('.pdf', ''),
      totalPages,
      fullText,
    };
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setInfographics([]);
    setTopics([]);

    try {
      const parsed = await parsePDF(file);
      setParsedPdf(parsed);

      // Brainstorm topics
      const response = await fetch('/api/pdf-to-info/brainstorm-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: parsed.fullText.slice(0, 3000) }),
      });

      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
      }

      toast.success(`PDF processed successfully! Found ${parsed.totalPages} pages.`);
    } catch (error) {
      console.error('Failed to parse PDF:', error);
      toast.error('Failed to process PDF');
      setSelectedFile(null);
      setParsedPdf(null);
    } finally {
      setIsProcessing(false);
    }
  }, [parsePDF]);

  const handleGenerateInfographics = useCallback(async () => {
    if (!parsedPdf || topics.length === 0) return;

    setIsGenerating(true);
    setTotalToGenerate(topics.length);
    setCurrentProgress(0);

    const newInfographics: GeneratedInfographic[] = topics.map((topic, idx) => ({
      id: `infographic-${topic.id}-${Date.now()}-${idx}`,
      sectionTitle: topic.title,
      imageUrl: '',
      isLoading: true,
    }));

    setInfographics(newInfographics);

    for (let i = 0; i < topics.length; i++) {
      try {
        const response = await fetch('/api/pdf-to-info/generate-infographic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topics[i].title,
            content: parsedPdf.fullText.slice(0, 800),
            theme: selectedTheme,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setInfographics((prev) =>
            prev.map((inf) =>
              inf.id === newInfographics[i].id
                ? { ...inf, imageUrl: data.imageUrl, isLoading: false }
                : inf
            )
          );
        } else {
          setInfographics((prev) =>
            prev.map((inf) =>
              inf.id === newInfographics[i].id
                ? { ...inf, isLoading: false, error: 'Failed to generate' }
                : inf
            )
          );
        }
      } catch (error) {
        setInfographics((prev) =>
          prev.map((inf) =>
            inf.id === newInfographics[i].id
              ? { ...inf, isLoading: false, error: 'Failed to generate' }
              : inf
          )
        );
      }

      setCurrentProgress(i + 1);
      if (i < topics.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setIsGenerating(false);
  }, [parsedPdf, topics, selectedTheme]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setParsedPdf(null);
    setTopics([]);
    setInfographics([]);
    setIsProcessing(false);
    setIsGenerating(false);
  }, []);

  const handleDownload = useCallback((infographic: GeneratedInfographic) => {
    if (!infographic.imageUrl) return;
    const link = document.createElement('a');
    link.href = infographic.imageUrl;
    link.download = `${infographic.sectionTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const themes: { id: InfographicTheme; name: string; icon: string }[] = [
    { id: 'handwritten', name: 'Handwritten', icon: '✏️' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'cartoon', name: 'Cartoon', icon: '🎨' },
    { id: 'retro', name: 'Retro', icon: '📻' },
    { id: 'minimal', name: 'Minimal', icon: '📋' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {!parsedPdf && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Transform PDFs into Beautiful Infographics
                </h2>
                <p className="text-gray-600">
                  Upload a PDF and generate stunning infographics from its content
                </p>
              </div>

              {isProcessing ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-lg text-gray-700">Processing your PDF...</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="pdf-upload-info"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="pdf-upload-info"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Drop your PDF here
                      </h3>
                      <p className="text-gray-600">
                        or <span className="text-blue-600 font-medium">browse</span> to choose a file
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {parsedPdf && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{parsedPdf.title}</h3>
                    <p className="text-gray-600 mt-1">{parsedPdf.totalPages} pages</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    New PDF
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Theme
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          selectedTheme === theme.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{theme.icon}</span>
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics */}
                {topics.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Topics</h4>
                    <div className="space-y-2">
                      {topics.map((topic) => (
                        <div key={topic.id} className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium text-gray-900">{topic.title}</h5>
                          <p className="text-sm text-gray-600">{topic.description}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleGenerateInfographics}
                      disabled={isGenerating}
                      className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                          Generating... ({currentProgress}/{totalToGenerate})
                        </>
                      ) : (
                        'Generate Infographics'
                      )}
                    </button>
                  </div>
                )}

                {/* Infographics Gallery */}
                {infographics.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Generated Infographics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {infographics.map((infographic) => (
                        <div
                          key={infographic.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <h5 className="font-medium text-gray-900 mb-2">{infographic.sectionTitle}</h5>
                          {infographic.isLoading ? (
                            <div className="aspect-video bg-gray-200 rounded flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                          ) : infographic.error ? (
                            <div className="aspect-video bg-red-50 rounded flex items-center justify-center text-red-600">
                              {infographic.error}
                            </div>
                          ) : infographic.imageUrl ? (
                            <div className="space-y-2">
                              <Image
                                src={infographic.imageUrl}
                                alt={infographic.sectionTitle}
                                width={800}
                                height={450}
                                className="w-full rounded aspect-video object-cover"
                              />
                              <button
                                onClick={() => handleDownload(infographic)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Youtube, PenTool, LayoutTemplate, Sparkles, Download, Share2, AlertCircle, PlayCircle, Image as ImageIcon, Video } from 'lucide-react';
import { AppStatus, VisualStyle, GenerationResult } from './types';
import { analyzeVideoContent, generateInfographic, checkApiKeySelection, openApiKeySelection } from './services/geminiService';
import { Button } from './components/Button';
import { StyleCard } from './components/StyleCard';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState<VisualStyle>(VisualStyle.WHITEBOARD);
  const [customPrompt, setCustomPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keySelected, setKeySelected] = useState(false);

  // Initial check for API Key
  useEffect(() => {
    const initKeyCheck = async () => {
      try {
        const hasKey = await checkApiKeySelection();
        setKeySelected(hasKey);
      } catch (e) {
        // If the API isn't available, we assume true (e.g. env var usage fallback) 
        // or handle gracefully.
        console.warn("API Key check skipped or failed", e);
        setKeySelected(true);
      }
    };
    initKeyCheck();
  }, []);

  const handleKeySelection = async () => {
    try {
      await openApiKeySelection();
      setKeySelected(true);
    } catch (e) {
      console.error("Failed to select key", e);
      setError("Could not select API key. Please try again.");
    }
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a valid YouTube URL.");
      return;
    }
    
    // Ensure key is selected for the premium image model
    if (!keySelected) {
      await handleKeySelection();
      // We assume success if no error thrown, but safer to re-check or just proceed
      // due to race condition handling mentioned in prompt.
    }

    setStatus(AppStatus.ANALYZING);
    setError(null);
    setResult(null);

    try {
      // Step 1: Analyze
      const analysis = await analyzeVideoContent(url, style, customPrompt);
      
      setStatus(AppStatus.GENERATING);
      
      // Step 2: Generate Image
      const imageUrl = await generateInfographic(analysis.imagePrompt);

      setResult({
        imageUrl,
        summary: analysis.summary,
        videoTitle: analysis.videoTitle
      });
      setStatus(AppStatus.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
      setStatus(AppStatus.ERROR);
    }
  };

  const downloadImage = useCallback(() => {
    if (result?.imageUrl) {
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = `recapio-whiteboard-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-gray-50 bg-grid-pattern text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <PenTool className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Recapio</span>
          </div>
          {!keySelected && (
            <button onClick={handleKeySelection} className="text-sm text-blue-600 hover:underline font-medium">
              Connect Google Cloud Billing
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            YouTube to <span className="font-hand text-blue-600 relative inline-block">
              Whiteboard
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Transform educational videos into beautiful, hand-drawn infographics in seconds using Gemini AI.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-8">
            
            {/* URL Input */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                1. Paste Video URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Youtube className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                2. Choose Style
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StyleCard 
                  style={VisualStyle.WHITEBOARD} 
                  selected={style === VisualStyle.WHITEBOARD}
                  onSelect={setStyle}
                  icon={<PenTool className="w-6 h-6" />}
                  description="Clean markers on a white board"
                />
                <StyleCard 
                  style={VisualStyle.NOTEBOOK} 
                  selected={style === VisualStyle.NOTEBOOK}
                  onSelect={setStyle}
                  icon={<LayoutTemplate className="w-6 h-6" />}
                  description="Blue pen on lined paper"
                />
                <StyleCard 
                  style={VisualStyle.CUSTOM} 
                  selected={style === VisualStyle.CUSTOM}
                  onSelect={setStyle}
                  icon={<Sparkles className="w-6 h-6" />}
                  description="Describe your own unique style"
                />
              </div>
              
              {style === VisualStyle.CUSTOM && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="E.g., A futuristic neon schematic diagram..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    rows={2}
                  />
                </div>
              )}
            </div>

            {/* Action Area */}
            <div className="pt-4 flex flex-col items-center gap-4">
               {error && (
                <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                isLoading={status === AppStatus.ANALYZING || status === AppStatus.GENERATING}
                className="w-full md:w-auto text-lg px-12 py-4"
              >
                {status === AppStatus.IDLE || status === AppStatus.ERROR || status === AppStatus.COMPLETE ? (
                  <>Create Visual <Sparkles className="w-5 h-5 ml-2" /></>
                ) : (
                  <span className="flex items-center">
                    {status === AppStatus.ANALYZING ? "Watching Video..." : "Drawing Infographic..."}
                  </span>
                )}
              </Button>
              
              {!keySelected && (
                <p className="text-xs text-gray-400 text-center max-w-md">
                  Note: High-quality image generation requires connecting your own Google Cloud Project with billing enabled. You will be prompted to select it.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(status === AppStatus.GENERATING || status === AppStatus.COMPLETE) && (
          <div className="mt-12 space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-8">
            
            {/* Loading Skeleton or Image */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl bg-white border-4 border-white ring-1 ring-gray-200 aspect-video flex items-center justify-center">
              
              {status === AppStatus.GENERATING && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-hand font-bold text-gray-800 mb-2">Creating your masterpiece...</h3>
                  <p className="text-gray-500 max-w-sm">We are synthesizing the video concepts into a cohesive {style.toLowerCase()} illustration.</p>
                </div>
              )}

              {status === AppStatus.COMPLETE && result && (
                <img 
                  src={result.imageUrl} 
                  alt="Generated Infographic" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {status === AppStatus.COMPLETE && result && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Summary Card */}
                <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Video className="w-4 h-4" /> Video Summary
                  </h3>
                  {result.videoTitle && (
                    <h4 className="text-lg font-bold text-gray-900 mb-3">{result.videoTitle}</h4>
                  )}
                  <div className="prose prose-blue prose-sm max-w-none">
                    <p className="whitespace-pre-wrap font-hand text-lg leading-relaxed text-gray-700">
                      {result.summary}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <Button onClick={downloadImage} variant="secondary" className="w-full justify-center">
                    Download PNG <Download className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" className="w-full justify-center">
                    Share Link <Share2 className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 leading-relaxed">
                    <strong>Tip:</strong> You can regenerate the image with a different style above if you want to see another perspective!
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
import React, { useState, useEffect, useCallback } from 'react';
import { Youtube, PenTool, LayoutTemplate, Sparkles, Download, Share2, AlertCircle, Video, Lock, Gem, Zap, Loader2, CheckCircle2, CircleDashed } from 'lucide-react';
import { AppStatus, VisualStyle, GenerationResult } from './types';
import { analyzeVideoContent, generateInfographic, checkApiKeySelection, openApiKeySelection } from './services/geminiService';
import { Button } from './components/Button';
import { StyleCard } from './components/StyleCard';

const FREE_TIER_LIMIT = 3;

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [style, setStyle] = useState<VisualStyle>(VisualStyle.WHITEBOARD);
  const [customPrompt, setCustomPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keySelected, setKeySelected] = useState(false);
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load generation count
  useEffect(() => {
    const savedCount = localStorage.getItem('mindcanvas_generations');
    if (savedCount) {
      setGenerationsUsed(parseInt(savedCount, 10));
    }
  }, []);

  // Update localStorage when count changes
  useEffect(() => {
    localStorage.setItem('mindcanvas_generations', generationsUsed.toString());
  }, [generationsUsed]);

  // Initial check for API Key - purely for UI state, not blocking strictly yet
  useEffect(() => {
    const initKeyCheck = async () => {
      try {
        const hasKey = await checkApiKeySelection();
        setKeySelected(hasKey);
      } catch (e) {
        setKeySelected(true); // Fallback to allow usage if check fails
      }
    };
    initKeyCheck();
  }, []);

  const handleKeySelection = async () => {
    try {
      await openApiKeySelection();
      setKeySelected(true);
      setShowUpgradeModal(false);
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

    // Free Tier Logic
    const isFreeTier = generationsUsed < FREE_TIER_LIMIT;

    if (!isFreeTier && !keySelected) {
      setShowUpgradeModal(true);
      return;
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
      
      // Increment usage
      setGenerationsUsed(prev => prev + 1);
      
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
      link.download = `mindcanvas-visual-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-soft-gradient relative overflow-hidden text-slate-800">
      
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 border-white/20">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-800">MindCanvas</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center px-4 py-1.5 bg-white/50 rounded-full text-xs font-semibold text-slate-600 border border-white/60">
               <Zap className="w-3 h-3 mr-1.5 text-amber-500 fill-amber-500" />
               {generationsUsed < FREE_TIER_LIMIT ? (
                 <span>{FREE_TIER_LIMIT - generationsUsed} free credits left</span>
               ) : (
                 <span className="text-indigo-600">Pro Plan Active</span>
               )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        
        {/* Hero */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Visualize your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">learning journey</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-light">
            Turn complex YouTube videos into crystal-clear, hand-drawn infographic summaries instantly using Gemini AI.
          </p>
        </div>

        {/* Input Card */}
        <div className="glass-panel rounded-3xl p-1 shadow-2xl shadow-indigo-100/50">
          <div className="bg-white/40 rounded-[20px] p-6 md:p-10 space-y-10">
            
            {/* Step 1: URL */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs">1</span>
                  Paste Video URL
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
                  <Youtube className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-14 pr-4 py-5 bg-white/60 border border-white/60 shadow-inner rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white outline-none transition-all text-slate-800 placeholder-slate-400 font-medium text-lg"
                />
              </div>
            </div>

            {/* Step 2: Style */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs">2</span>
                Choose Style
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                  description="Your creative prompt"
                />
              </div>
              
              {style === VisualStyle.CUSTOM && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe the visual style you want (e.g., 'Futuristic neon blueprint', 'Medieval parchment scroll')..."
                    className="w-full p-4 bg-white/50 border border-white/60 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-base"
                    rows={2}
                  />
                </div>
              )}
            </div>

            {/* Action */}
            <div className="pt-2 flex flex-col items-center gap-6">
               {error && (
                <div className="w-full bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                isLoading={status === AppStatus.ANALYZING || status === AppStatus.GENERATING}
                className="w-full md:w-auto text-lg px-16 py-5 rounded-full shadow-2xl shadow-indigo-300 hover:shadow-indigo-400 hover:-translate-y-1"
              >
                {status === AppStatus.IDLE || status === AppStatus.ERROR || status === AppStatus.COMPLETE ? (
                  <>Create Masterpiece <Sparkles className="w-5 h-5 ml-2 text-indigo-200" /></>
                ) : (
                  <span className="flex items-center">
                    Processing...
                  </span>
                )}
              </Button>
              
              {generationsUsed < FREE_TIER_LIMIT ? (
                <p className="text-xs font-semibold text-slate-400">
                  {FREE_TIER_LIMIT - generationsUsed} free generations remaining
                </p>
              ) : !keySelected ? (
                 <p className="text-xs font-semibold text-indigo-500 flex items-center gap-1 cursor-pointer" onClick={() => setShowUpgradeModal(true)}>
                    <Lock className="w-3 h-3" /> Upgrade to continue generating
                 </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Results */}
        {(status === AppStatus.ANALYZING || status === AppStatus.GENERATING || status === AppStatus.COMPLETE) && (
          <div className="mt-12 space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-8 pb-20">
            
            {/* Visual Canvas */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border border-white/50 aspect-video flex items-center justify-center group">
              
              {/* Granular Loading State */}
              {(status === AppStatus.ANALYZING || status === AppStatus.GENERATING) && (
                <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                    <div className="max-w-sm w-full space-y-6">
                        
                        <div className="text-center mb-6">
                           <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-full mb-4">
                              <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                           </div>
                           <h3 className="text-2xl font-hand font-bold text-slate-800">Creating your masterpiece...</h3>
                        </div>

                        {/* Step 1: Analysis */}
                        <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border ${status === AppStatus.ANALYZING ? 'bg-white shadow-lg border-indigo-100 scale-105 ring-1 ring-indigo-50' : 'bg-slate-50 border-transparent opacity-80'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${status === AppStatus.ANALYZING ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                                {status === AppStatus.ANALYZING ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className={`font-bold ${status === AppStatus.ANALYZING ? 'text-indigo-900' : 'text-slate-700'}`}>Deep Analysis</h4>
                                    {status === AppStatus.ANALYZING && <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">Thinking</span>}
                                </div>
                                <p className="text-sm text-slate-500 leading-snug">Extracting video insights, transcripts & structure using Gemini 3 Pro</p>
                            </div>
                        </div>

                        {/* Connector */}
                        <div className={`h-8 w-0.5 mx-auto -my-2 transition-colors duration-500 ${status === AppStatus.GENERATING ? 'bg-indigo-200' : 'bg-slate-200'}`}></div>

                        {/* Step 2: Generation */}
                        <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border ${status === AppStatus.GENERATING ? 'bg-white shadow-lg border-indigo-100 scale-105 ring-1 ring-indigo-50' : 'bg-slate-50/50 border-transparent opacity-60'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${status === AppStatus.GENERATING ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                 {status === AppStatus.GENERATING ? <Loader2 className="w-6 h-6 animate-spin" /> : <CircleDashed className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className={`font-bold ${status === AppStatus.GENERATING ? 'text-indigo-900' : 'text-slate-700'}`}>Visual Synthesis</h4>
                                <p className="text-sm text-slate-500 leading-snug">Generating high-fidelity hand-drawn infographic with Gemini Image Gen</p>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {status === AppStatus.COMPLETE && result && (
                <>
                  <img 
                    src={result.imageUrl} 
                    alt="Generated Infographic" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={downloadImage} variant="primary" className="shadow-2xl">
                       Download <Download className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            {status === AppStatus.COMPLETE && result && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Summary */}
                <div className="md:col-span-2 glass-panel rounded-3xl p-8">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Video className="w-4 h-4" /> Video Analysis
                  </h3>
                  {result.videoTitle && (
                    <h4 className="text-xl font-bold text-slate-800 mb-4">{result.videoTitle}</h4>
                  )}
                  <div className="prose prose-slate prose-lg max-w-none">
                    <p className="whitespace-pre-wrap font-hand text-xl leading-relaxed text-slate-700">
                      {result.summary}
                    </p>
                  </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-4">
                  <div className="glass-panel rounded-3xl p-6 space-y-4">
                     <Button onClick={downloadImage} variant="secondary" className="w-full justify-center text-sm">
                       Download PNG <Download className="w-4 h-4 ml-2" />
                     </Button>
                     <Button variant="glass" className="w-full justify-center text-sm">
                       Share Link <Share2 className="w-4 h-4 ml-2" />
                     </Button>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-lg">
                    <h5 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Gem className="w-5 h-5" /> Pro Tip
                    </h5>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                      Try the "Custom" style and describe a specific aesthetic like "Cyberpunk schematic" or "Da Vinci sketchbook" for unique results!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowUpgradeModal(false)}></div>
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full relative z-10 animate-in zoom-in-95 duration-200">
             <div className="text-center space-y-6">
               <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                 <Gem className="w-8 h-8" />
               </div>
               
               <div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Free Limit Reached</h2>
                 <p className="text-slate-600">
                   You've used your 3 free MindCanvas generations. Connect your own Google Cloud API Key to continue creating unlimited visuals.
                 </p>
               </div>

               <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 text-sm border border-slate-100">
                 <div className="flex gap-3">
                   <span className="bg-white text-slate-900 font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200">1</span>
                   <p className="text-slate-600">Create a Project in <a href="https://console.cloud.google.com/" target="_blank" className="text-indigo-600 font-medium hover:underline">Google Cloud Console</a>.</p>
                 </div>
                 <div className="flex gap-3">
                   <span className="bg-white text-slate-900 font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200">2</span>
                   <p className="text-slate-600">Enable <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-600 font-medium hover:underline">Billing</a> for your project.</p>
                 </div>
                 <div className="flex gap-3">
                   <span className="bg-white text-slate-900 font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm shrink-0 border border-slate-200">3</span>
                   <p className="text-slate-600">Click below to select your project.</p>
                 </div>
               </div>

               <Button onClick={handleKeySelection} className="w-full justify-center">
                 Connect API Key
               </Button>
               
               <button onClick={() => setShowUpgradeModal(false)} className="text-sm text-slate-400 hover:text-slate-600 font-medium">
                 Cancel
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
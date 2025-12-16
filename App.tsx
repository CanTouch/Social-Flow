import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Loader2, RefreshCw, KeyRound, Calendar, LayoutGrid, CheckCircle, Target, MessageSquare, Download, Share2 } from 'lucide-react';
import { BrandInfo, GeneratedContent, INITIAL_BRAND_INFO, ScheduledCampaign, SocialPost } from './types';
import { InputGroup } from './components/InputGroup';
import { PlatformCard } from './components/PlatformCard';
import { PlatformSelector } from './components/PlatformSelector';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ScheduleView } from './components/ScheduleView';
import { generateSocialContent, generateImage, refineContent } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'generator' | 'schedule'>('generator');
  
  const [formData, setFormData] = useState<BrandInfo>(INITIAL_BRAND_INFO);
  const [lastSubmittedData, setLastSubmittedData] = useState<BrandInfo | null>(null);
  const [results, setResults] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // API Key State
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Scheduling State
  const [scheduledCampaigns, setScheduledCampaigns] = useState<ScheduledCampaign[]>([]);
  const [justScheduled, setJustScheduled] = useState(false);

  // Load schedule from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('socialFlow_schedule');
    if (saved) {
        try {
            setScheduledCampaigns(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse scheduled items", e);
        }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (platforms: string[]) => {
    setFormData(prev => ({ ...prev, platforms }));
  };

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    setShowApiKeyModal(false);
    setApiKeyError(null);
  };

  const handleUpdatePost = (index: number, updatedPost: SocialPost) => {
    if (!results) return;
    const newResults = [...results];
    newResults[index] = updatedPost;
    setResults(newResults);
  };

  const handleRefinePost = async (content: string, instruction: string, platform: string): Promise<string> => {
     try {
         const newContent = await refineContent(content, platform, instruction, userApiKey);
         return newContent;
     } catch (err: any) {
         if (err.message === 'API_KEY_INVALID' || err.message === 'API_KEY_MISSING') {
             setApiKeyError(err.message);
             setShowApiKeyModal(true);
         }
         throw err;
     }
  };

  const handleGenerateImage = async (post: SocialPost): Promise<string> => {
     // Use the data that generated the current results, or fallback to current form data
     const sourceData = lastSubmittedData || formData;

     // Determine Aspect Ratio
     let aspectRatioDesc = "square (1:1)";
     if (post.platform === 'TikTok') {
        aspectRatioDesc = "vertical (9:16) - full screen phone size";
     }

     // Construct a prompt based on the post and brand info
     const prompt = `Create a photorealistic, high-quality social media image for a ${post.platform} post.
     Topic: ${sourceData.topic}.
     Brand Industry: ${sourceData.industry}.
     Brand Voice: ${sourceData.brandVoice}.
     Aspect Ratio: ${aspectRatioDesc}.
     
     Context from post:
     ${post.content.slice(0, 500)}
     
     The image should be engaging, professional, and visually stunning.`;
     
     try {
         const imageUrl = await generateImage(prompt, userApiKey);
         return imageUrl;
     } catch (err: any) {
         if (err.message === 'API_KEY_INVALID' || err.message === 'API_KEY_MISSING') {
             setApiKeyError(err.message);
             setShowApiKeyModal(true);
         }
         throw err;
     }
  };

  const handleExportCSV = () => {
    if (!results) return;
    
    // Headers
    const headers = ['Platform', 'Content', 'Hashtags', 'Image Status'];
    const rows = results.map(post => {
        const content = post.content.replace(/"/g, '""'); // Escape quotes
        const hashtags = post.hashtags ? post.hashtags.join(' ') : '';
        const hasImage = post.imageUrl ? 'Image Generated' : 'No Image';
        
        return [
            post.platform,
            `"${content}"`,
            `"${hashtags}"`,
            hasImage
        ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `socialflow_campaign_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToSchedule = () => {
    if (!results) return;
    
    // Use lastSubmittedData if available (source of truth for results), otherwise formData
    const campaignInfo = lastSubmittedData || formData;

    if (!formData.scheduleDate) {
        setError("Please select a date and time to schedule this content.");
        return;
    }

    const newCampaign: ScheduledCampaign = {
        id: crypto.randomUUID(),
        brandInfo: {
            ...campaignInfo,
            scheduleDate: formData.scheduleDate
        },
        generatedContent: results,
        createdAt: Date.now()
    };

    const updatedSchedule = [...scheduledCampaigns, newCampaign];
    setScheduledCampaigns(updatedSchedule);
    localStorage.setItem('socialFlow_schedule', JSON.stringify(updatedSchedule));
    
    setJustScheduled(true);
    setTimeout(() => setJustScheduled(false), 3000);
    setError(null);
    
    setFormData(prev => ({ ...prev, scheduleDate: '' }));
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = scheduledCampaigns.filter(c => c.id !== id);
    setScheduledCampaigns(updated);
    localStorage.setItem('socialFlow_schedule', JSON.stringify(updated));
  };

  const handleCopySchedule = (campaign: ScheduledCampaign) => {
    const newCampaign: ScheduledCampaign = {
        ...campaign,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        brandInfo: { ...campaign.brandInfo },
        generatedContent: JSON.parse(JSON.stringify(campaign.generatedContent))
    };

    const updatedSchedule = [...scheduledCampaigns, newCampaign];
    setScheduledCampaigns(updatedSchedule);
    localStorage.setItem('socialFlow_schedule', JSON.stringify(updatedSchedule));
  };

  const handleRegenerate = async () => {
    const sourceData = lastSubmittedData || formData;
    setLoading(true);
    setError(null);
    setResults(null);
    setApiKeyError(null);
    setJustScheduled(false);

    try {
        const content = await generateSocialContent(sourceData, userApiKey);
        setResults(content);
    } catch (err: any) {
        console.error(err);
        const errorMessage = err.message || "Something went wrong.";
  
        if (errorMessage === 'API_KEY_MISSING' || errorMessage === 'API_KEY_INVALID') {
          setApiKeyError(errorMessage);
          setShowApiKeyModal(true);
        } else {
          setError(errorMessage);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setApiKeyError(null);
    setJustScheduled(false);

    try {
      if (!formData.brandName || !formData.topic) {
        throw new Error("Please fill in at least Brand Name and Topic.");
      }
      if (formData.platforms.length === 0) {
        throw new Error("Please select at least one platform.");
      }
      
      const content = await generateSocialContent(formData, userApiKey);
      setResults(content);
      setLastSubmittedData(formData);
      setFormData(INITIAL_BRAND_INFO);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "Something went wrong.";

      if (errorMessage === 'API_KEY_MISSING' || errorMessage === 'API_KEY_INVALID') {
        setApiKeyError(errorMessage);
        setShowApiKeyModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500/30">
      
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        initialError={apiKeyError}
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SocialFlow AI
            </h1>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
            <button
                onClick={() => setCurrentView('generator')}
                className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currentView === 'generator' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
            >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Generator
            </button>
            <button
                onClick={() => setCurrentView('schedule')}
                className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currentView === 'schedule' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
            >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
                {scheduledCampaigns.length > 0 && (
                    <span className="ml-2 bg-indigo-500/20 text-indigo-200 text-xs px-1.5 py-0.5 rounded-full">
                        {scheduledCampaigns.length}
                    </span>
                )}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button 
                onClick={() => setShowApiKeyModal(true)}
                className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
                title="Update API Key"
            >
                <KeyRound className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {currentView === 'schedule' ? (
            <ScheduleView 
                campaigns={scheduledCampaigns} 
                onDelete={handleDeleteSchedule} 
                onCopy={handleCopySchedule}
            />
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Input Form */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center text-indigo-400 mb-2">
                             <Sparkles className="w-4 h-4 mr-2" />
                             <h3 className="text-sm font-bold uppercase tracking-wider">Brand Essentials</h3>
                        </div>
                        <InputGroup
                            label="Brand Name"
                            name="brandName"
                            value={formData.brandName}
                            onChange={handleInputChange}
                            placeholder="e.g. Acme Co."
                            required
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <InputGroup
                                label="Industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleInputChange}
                                placeholder="e.g. SaaS"
                            />
                            <InputGroup
                                label="Brand Voice"
                                name="brandVoice"
                                value={formData.brandVoice}
                                onChange={handleInputChange}
                                type="select"
                                options={[
                                    "Professional yet approachable",
                                    "Witty and humorous",
                                    "Inspiring and motivational",
                                    "Educational and authoritative",
                                    "Friendly and casual",
                                    "Luxury and exclusive"
                                ]}
                            />
                        </div>
                    </div>

                    {/* Audience Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center text-indigo-400 mb-2">
                             <Target className="w-4 h-4 mr-2" />
                             <h3 className="text-sm font-bold uppercase tracking-wider">Audience Intelligence</h3>
                        </div>
                        <InputGroup
                            label="Target Audience"
                            name="targetAudience"
                            value={formData.targetAudience}
                            onChange={handleInputChange}
                            placeholder="e.g. Busy SMB Owners"
                        />
                        <InputGroup
                            label="Audience Pain Points"
                            name="audiencePainPoints"
                            value={formData.audiencePainPoints}
                            onChange={handleInputChange}
                            type="textarea"
                            placeholder="What keeps them up at night? e.g., 'Too much admin work, low leads'"
                        />
                    </div>

                    {/* Content Strategy Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center text-indigo-400 mb-2">
                             <MessageSquare className="w-4 h-4 mr-2" />
                             <h3 className="text-sm font-bold uppercase tracking-wider">Campaign Strategy</h3>
                        </div>
                        
                         <InputGroup
                            label="Topic / Offer"
                            name="topic"
                            value={formData.topic}
                            onChange={handleInputChange}
                            type="textarea"
                            placeholder="What is this post about?"
                            required
                        />
                        
                         <div className="grid grid-cols-2 gap-3">
                            <InputGroup
                                label="Campaign Goal"
                                name="campaignGoal"
                                value={formData.campaignGoal}
                                onChange={handleInputChange}
                                placeholder="e.g. Leads"
                            />
                             <InputGroup
                                label="Hook Style"
                                name="hookStyle"
                                value={formData.hookStyle}
                                onChange={handleInputChange}
                                type="select"
                                options={[
                                    "Curiosity/Question",
                                    "Contrarian/Polarizing",
                                    "Storytelling/Personal",
                                    "Direct Benefit/Value",
                                    "Statistical/Shocking",
                                    "FOMO/Urgency"
                                ]}
                            />
                        </div>

                        <InputGroup
                            label="Key Benefits"
                            name="keyBenefits"
                            value={formData.keyBenefits}
                            onChange={handleInputChange}
                            type="textarea"
                            placeholder="Why should people care?"
                        />

                        <InputGroup
                            label="Call to Action"
                            name="cta"
                            value={formData.cta}
                            onChange={handleInputChange}
                            placeholder="e.g. Sign up today"
                        />
                    </div>

                    <PlatformSelector 
                        selectedPlatforms={formData.platforms}
                        onChange={handlePlatformChange}
                    />

                    <div className="pt-2 border-t border-slate-700/50 mt-2">
                        <InputGroup 
                            label="Schedule Post (Optional)"
                            name="scheduleDate"
                            type="datetime-local"
                            value={formData.scheduleDate || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating Magic...
                            </>
                        ) : (
                            <>
                            <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Generate Content
                            </>
                        )}
                    </button>
                </form>
                </div>
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-8 xl:col-span-9">
                {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 px-4 py-3 rounded-xl mb-6 flex items-start">
                    <div className="mr-3 mt-0.5">⚠️</div>
                    <div>
                        <p className="font-semibold">Attention</p>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
                )}

                {!results && !loading && !error && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-800/20">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-300 mb-2">Ready to Create?</h3>
                    <p className="text-slate-500 max-w-md">
                    Fill out the brand strategy on the left. The AI will analyze your audience pain points and craft high-performing copy optimized for each platform.
                    </p>
                </div>
                )}

                {loading && !results && (
                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-slate-400 animate-pulse">Analyzing audience psychographics...</p>
                </div>
                )}

                {results && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <h2 className="text-2xl font-bold text-white">Generated Drafts</h2>
                        <div className="flex items-center space-x-3">
                             <button
                                onClick={handleExportCSV}
                                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Export CSV
                            </button>
                             <button
                                onClick={handleSaveToSchedule}
                                disabled={justScheduled}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    justScheduled 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                            >
                                {justScheduled ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Scheduled!
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Save to Schedule
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={handleRegenerate} 
                                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Regenerate
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
                    {results.map((post, index) => (
                        <div key={post.platform} className={post.platform === 'X' || post.platform === 'YouTube' ? 'md:col-span-2 xl:col-span-1' : ''}>
                            <PlatformCard 
                                post={post} 
                                onUpdate={(updatedPost) => handleUpdatePost(index, updatedPost)}
                                onGenerateImage={
                                    (post.platform === 'Instagram' || post.platform === 'Facebook' || post.platform === 'TikTok') 
                                    ? () => handleGenerateImage(post) 
                                    : undefined
                                }
                                onRefine={(content, instruction) => handleRefinePost(content, instruction, post.platform)}
                            />
                        </div>
                    ))}
                    </div>
                </div>
                )}
            </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
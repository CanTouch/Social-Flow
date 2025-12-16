import React, { useState, useEffect, useRef } from 'react';
import { SocialPost } from '../types';
import { Copy, Check, Twitter, Instagram, Facebook, Youtube, Linkedin, Hash, Edit2, Save, X, Image as ImageIcon, Loader2, Sparkles, RefreshCw, Upload, Music, Wand2, Download } from 'lucide-react';

interface PlatformCardProps {
  post: SocialPost;
  onUpdate?: (post: SocialPost) => void;
  onGenerateImage?: () => Promise<string>;
  onRefine?: (content: string, instruction: string) => Promise<string>;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ post, onUpdate, onGenerateImage, onRefine }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showRefineMenu, setShowRefineMenu] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for editing
  const [content, setContent] = useState(post.content);
  const [title, setTitle] = useState(post.youtubeMetadata?.title || '');
  const [hook, setHook] = useState(post.youtubeMetadata?.videoHook || '');
  const [hashtags, setHashtags] = useState(post.hashtags?.join(' ') || '');

  // Sync state when post changes (e.g. regeneration)
  useEffect(() => {
    setContent(post.content);
    setTitle(post.youtubeMetadata?.title || '');
    setHook(post.youtubeMetadata?.videoHook || '');
    setHashtags(post.hashtags?.join(' ') || '');
  }, [post]);

  const handleCopy = () => {
    let textToCopy = post.content;
    
    if (post.platform === 'YouTube' && post.youtubeMetadata) {
      textToCopy = `TITLE:\n${post.youtubeMetadata.title}\n\nHOOK:\n${post.youtubeMetadata.videoHook}\n\nDESCRIPTION:\n${post.content}`;
    } else if (post.hashtags && post.hashtags.length > 0) {
      textToCopy += `\n\n${post.hashtags.join(' ')}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const updatedPost: SocialPost = {
        ...post,
        content: content,
        hashtags: hashtags.split(' ').filter(t => t.trim() !== '')
    };

    if (post.platform === 'YouTube') {
        updatedPost.youtubeMetadata = {
            title: title,
            videoHook: hook
        };
    }

    if (onUpdate) {
        onUpdate(updatedPost);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Revert to props
    setContent(post.content);
    setTitle(post.youtubeMetadata?.title || '');
    setHook(post.youtubeMetadata?.videoHook || '');
    setHashtags(post.hashtags?.join(' ') || '');
    setIsEditing(false);
  };

  const handleImageGenerationClick = async () => {
    if (!onGenerateImage || !onUpdate) return;
    
    setIsGeneratingImage(true);
    try {
        const imageUrl = await onGenerateImage();
        onUpdate({ ...post, imageUrl });
    } catch (e) {
        console.error("Failed to generate image", e);
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (!post.imageUrl) return;
    const link = document.createElement('a');
    link.href = post.imageUrl;
    link.download = `${post.platform.toLowerCase()}_post_image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdate) {
        const reader = new FileReader();
        reader.onloadend = () => {
            onUpdate({ ...post, imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRefineClick = async (instruction: string) => {
    if (!onRefine) return;
    setShowRefineMenu(false);
    setIsRefining(true);
    try {
        const newContent = await onRefine(content, instruction);
        setContent(newContent);
        // Automatically save refined content or just show it in edit mode?
        // Let's just update the local state and maybe auto-save to parent if we want,
        // but sticking to local state allows user to review it.
        // Actually, let's auto-switch to edit mode so they see it changed.
        setIsEditing(true);
    } catch (e) {
        console.error("Refine failed", e);
    } finally {
        setIsRefining(false);
    }
  };

  const getIcon = () => {
    switch (post.platform) {
      case 'X': return <Twitter className="w-5 h-5 text-sky-400" />;
      case 'Instagram': return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'Facebook': return <Facebook className="w-5 h-5 text-blue-500" />;
      case 'YouTube': return <Youtube className="w-5 h-5 text-red-500" />;
      case 'LinkedIn': return <Linkedin className="w-5 h-5 text-blue-400" />;
      case 'TikTok': return <Music className="w-5 h-5 text-pink-400" />;
      default: return null;
    }
  };

  // Determine if we should show the image section
  // TikTok supports "Photo Mode" and Green Screen backgrounds, so we enable it.
  const supportsImages = post.platform === 'Instagram' || post.platform === 'Facebook' || post.platform === 'TikTok';
  
  const showCharCounter = isEditing && post.platform === 'X';
  const charCount = content.length;
  const maxChars = 280;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-visible shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full relative">
      {/* Header */}
      <div className="bg-slate-900/50 px-5 py-4 border-b border-slate-700 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
            {getIcon()}
          </div>
          <h3 className="font-semibold text-lg text-slate-100">{post.platform}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
            {/* Refine Menu */}
            {onRefine && !isEditing && (
                <div className="relative">
                    <button
                        onClick={() => setShowRefineMenu(!showRefineMenu)}
                        disabled={isRefining}
                        className={`p-1.5 rounded-md transition-colors ${isRefining ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700'}`}
                        title="AI Magic Edit"
                    >
                        {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </button>
                    
                    {showRefineMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                             <div className="py-1">
                                {['Make it shorter', 'Make it funnier', 'Fix grammar', 'More professional', 'Add emojis'].map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => handleRefineClick(action)}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                                    >
                                        {action}
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                    
                    {/* Backdrop for menu to close on click outside */}
                    {showRefineMenu && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowRefineMenu(false)} />
                    )}
                </div>
            )}

            {onUpdate && !isEditing && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
                    title="Edit Draft"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            )}

            {isEditing ? (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleCancel}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                        title="Cancel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-1.5 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                        title="Save Changes"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    title="Copy to clipboard"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-grow overflow-y-auto max-h-[500px] custom-scrollbar">
        
        {/* Image Section */}
        {supportsImages && (
            <div className="mb-6">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {post.imageUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                        <img 
                            src={post.imageUrl} 
                            alt={`Visual for ${post.platform}`} 
                            className="w-full h-auto object-cover max-h-80"
                        />
                         {/* Image Overlay Controls */}
                         <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                             <div className="flex gap-2">
                                 {onGenerateImage && (
                                    <button
                                        onClick={handleImageGenerationClick}
                                        disabled={isGeneratingImage}
                                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
                                        title="Regenerate Image"
                                    >
                                        {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    </button>
                                 )}
                                 <button
                                    onClick={handleUploadClick}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg flex items-center space-x-2 transition-colors border border-slate-600"
                                    title="Upload Image"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDownloadImage}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
                                    title="Download Image"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4 group hover:border-slate-600 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform duration-300">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                             <p className="text-sm text-slate-300 font-medium">
                                {post.platform === 'TikTok' ? 'Add Photo Mode Slide / Background' : 'Add Visual Content'}
                             </p>
                             <p className="text-xs text-slate-500 mt-1">Generate with AI or upload your own</p>
                        </div>
                        <div className="flex items-center gap-3 w-full max-w-xs pt-2">
                             {onGenerateImage && (
                                <button
                                    onClick={handleImageGenerationClick}
                                    disabled={isGeneratingImage}
                                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                >
                                    {isGeneratingImage ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Generate</span>
                                        </>
                                    )}
                                </button>
                             )}
                            <button
                                onClick={handleUploadClick}
                                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center justify-center space-x-2 transition-all border border-slate-700 hover:border-slate-600 hover:text-white hover:-translate-y-0.5"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {post.platform === 'YouTube' && (
          <div className="mb-4 space-y-4">
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Title</span>
                {isEditing ? (
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                        placeholder="Video Title"
                    />
                ) : (
                    <p className="text-slate-100 font-medium">{post.youtubeMetadata?.title}</p>
                )}
             </div>
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Visual Hook (0-5s)</span>
                {isEditing ? (
                    <input 
                        type="text" 
                        value={hook}
                        onChange={(e) => setHook(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                         placeholder="Visual Hook"
                    />
                ) : (
                    <p className="text-slate-200 italic text-sm">"{post.youtubeMetadata?.videoHook}"</p>
                )}
             </div>
          </div>
        )}

        <div className="prose prose-invert prose-sm max-w-none">
            {isEditing ? (
                <div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        className={`w-full bg-slate-800 border rounded-lg p-3 text-slate-300 leading-relaxed font-light focus:outline-none focus:border-indigo-500 resize-y placeholder-slate-500 ${showCharCounter && charCount > maxChars ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-600'}`}
                        placeholder="Enter post content..."
                    />
                    {showCharCounter && (
                        <div className="flex justify-end mt-1.5">
                             <div className={`text-xs font-medium px-2 py-0.5 rounded ${charCount > maxChars ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500'}`}>
                                {charCount} / {maxChars}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="whitespace-pre-wrap text-slate-300 leading-relaxed font-light">
                    {post.content}
                </p>
            )}
        </div>

        {(post.hashtags || isEditing) && (
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-2 text-slate-400 mb-2">
              <Hash className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Hashtags</span>
            </div>
            
            {isEditing ? (
                <input 
                    type="text" 
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-indigo-400 text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                    placeholder="#tag1 #tag2"
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                {post.hashtags?.map((tag, i) => (
                    <span key={i} className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                ))}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
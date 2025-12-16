import React, { useState } from 'react';
import { Key, X, AlertCircle, Check, ChevronRight, Lock } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialError?: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialError }) => {
  const [key, setKey] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-semibold text-white">API Key Required</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">
            To generate content, SocialFlow AI needs a valid Google Gemini API Key. Your key is stored locally in your browser session.
          </p>

          {initialError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start space-x-2 text-rose-200 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {initialError === 'API_KEY_MISSING' 
                  ? 'No API key found. Please enter your key to continue.' 
                  : 'The provided API key is invalid or expired. Please check your key and try again.'}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Enter your API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col space-y-3">
              <button
                type="submit"
                disabled={!key.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
              >
                <span>Save API Key</span>
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </button>
              
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-center text-slate-500 hover:text-indigo-400 transition-colors flex items-center justify-center"
              >
                Get a free API key from Google AI Studio
                <ArrowUpRightIcon className="w-3 h-3 ml-1" />
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper icon component since we are using lucide-react via CDN/ImportMap and might miss some specific exports depending on version if not careful, 
// but ArrowUpRight is standard. I'll just inline a simple SVG if needed, but ArrowUpRight is usually available.
const ArrowUpRightIcon = ({ className }: { className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
);
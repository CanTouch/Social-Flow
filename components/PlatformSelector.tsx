import React from 'react';
import { Twitter, Instagram, Facebook, Youtube, Linkedin, Check, Music } from 'lucide-react';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
}

const platforms = [
  { id: 'X', label: 'X (Twitter)', icon: Twitter, color: 'text-sky-400' },
  { id: 'Instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { id: 'Facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-500' },
  { id: 'YouTube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { id: 'LinkedIn', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400' },
  { id: 'TikTok', label: 'TikTok', icon: Music, color: 'text-pink-400' },
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatforms, onChange }) => {
  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      onChange(selectedPlatforms.filter(p => p !== id));
    } else {
      onChange([...selectedPlatforms, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-400">Select Platforms</label>
      <div className="grid grid-cols-2 gap-2">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const Icon = platform.icon;
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-700 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-800 border-slate-700 opacity-70 hover:opacity-100 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${platform.color}`} />
                <span className={`text-sm ${isSelected ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
                  {platform.label}
                </span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
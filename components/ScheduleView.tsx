import React from 'react';
import { ScheduledCampaign } from '../types';
import { Calendar, Trash2, ChevronDown, ChevronUp, Twitter, Instagram, Facebook, Youtube, Linkedin, Copy, Music } from 'lucide-react';
import { PlatformCard } from './PlatformCard';

interface ScheduleViewProps {
  campaigns: ScheduledCampaign[];
  onDelete: (id: string) => void;
  onCopy: (campaign: ScheduledCampaign) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ campaigns, onDelete, onCopy }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'X': return <Twitter className="w-4 h-4 text-sky-400" />;
      case 'Instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'Facebook': return <Facebook className="w-4 h-4 text-blue-500" />;
      case 'YouTube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'LinkedIn': return <Linkedin className="w-4 h-4 text-blue-400" />;
      case 'TikTok': return <Music className="w-4 h-4 text-pink-400" />;
      default: return null;
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
          <Calendar className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-300">No Scheduled Posts</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            Generate content and select a date to add posts to your schedule.
          </p>
        </div>
      </div>
    );
  }

  // Sort campaigns by date
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const dateA = a.brandInfo.scheduleDate ? new Date(a.brandInfo.scheduleDate).getTime() : 0;
    const dateB = b.brandInfo.scheduleDate ? new Date(b.brandInfo.scheduleDate).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Calendar className="w-6 h-6 mr-3 text-indigo-400" />
        Scheduled Campaigns
      </h2>

      <div className="space-y-4">
        {sortedCampaigns.map((campaign) => {
            const date = campaign.brandInfo.scheduleDate ? new Date(campaign.brandInfo.scheduleDate) : null;
            const isExpanded = expandedId === campaign.id;

            return (
                <div key={campaign.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
                    {/* Header Row */}
                    <div 
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
                        onClick={() => toggleExpand(campaign.id)}
                    >
                        <div className="flex items-center space-x-6">
                            <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-900 rounded-lg border border-slate-700 text-center">
                                {date ? (
                                    <>
                                        <span className="text-xs text-rose-400 font-bold uppercase">{date.toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-2xl font-bold text-white leading-none my-0.5">{date.getDate()}</span>
                                        <span className="text-xs text-slate-500">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-slate-500">No Date</span>
                                )}
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-lg text-slate-200">{campaign.brandInfo.topic}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-sm text-slate-400 font-medium">{campaign.brandInfo.brandName}</span>
                                    <span className="text-slate-600">•</span>
                                    <div className="flex items-center space-x-1">
                                        {campaign.generatedContent.map(post => (
                                            <div key={post.platform} title={post.platform}>
                                                {getPlatformIcon(post.platform)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopy(campaign);
                                }}
                                className="p-2 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 rounded-full transition-colors"
                                title="Duplicate Campaign"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(campaign.id);
                                }}
                                className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-full transition-colors"
                                title="Delete Campaign"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <div className="p-6 bg-slate-900/30 border-t border-slate-700/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {campaign.generatedContent.map((post) => (
                                    <PlatformCard key={post.platform} post={post} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
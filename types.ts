
export interface BrandInfo {
  brandName: string;
  industry: string;
  brandVoice: string;
  targetAudience: string;
  audiencePainPoints: string;
  campaignGoal: string;
  cta: string;
  topic: string;
  keyBenefits: string;
  hookStyle: string;
  platforms: string[];
  scheduleDate?: string;
}

export interface SocialPost {
  platform: 'X' | 'Instagram' | 'Facebook' | 'YouTube' | 'LinkedIn' | 'TikTok';
  content: string;
  hashtags?: string[];
  imageUrl?: string;
  youtubeMetadata?: {
    title: string;
    videoHook: string;
  };
}

export type GeneratedContent = SocialPost[];

export interface ScheduledCampaign {
  id: string;
  brandInfo: BrandInfo;
  generatedContent: GeneratedContent;
  createdAt: number;
}

export const INITIAL_BRAND_INFO: BrandInfo = {
  brandName: '',
  industry: '',
  brandVoice: 'Professional yet approachable',
  targetAudience: '',
  audiencePainPoints: '',
  campaignGoal: 'Brand Awareness',
  cta: 'Learn More',
  topic: '',
  keyBenefits: '',
  hookStyle: 'Curiosity/Question',
  platforms: ['X', 'Instagram', 'LinkedIn'],
  scheduleDate: ''
};
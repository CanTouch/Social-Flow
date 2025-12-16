import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { BrandInfo, GeneratedContent } from "../types";

// Define the response schema using the Type enum from the SDK
const socialPostSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      platform: {
        type: Type.STRING,
        enum: ["X", "Instagram", "Facebook", "YouTube", "LinkedIn", "TikTok"],
        description: "The social media platform for this post."
      },
      content: {
        type: Type.STRING,
        description: "The main body text of the post. For X, this must be a multi-tweet thread. For TikTok, this must be a script."
      },
      hashtags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Relevant hashtags for the post. Do not include generic ones like #marketing."
      },
      youtubeMetadata: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Click-worthy video title (max 70 chars)" },
          videoHook: { type: Type.STRING, description: "A visually descriptive hook for the first 5 seconds of the video" }
        },
        nullable: true,
        description: "Specific metadata for YouTube content only."
      }
    },
    required: ["platform", "content"]
  }
};

export const generateSocialContent = async (info: BrandInfo, customApiKey?: string): Promise<GeneratedContent> => {
  // Prioritize the custom key (from UI) over the environment variable
  const apiKey = customApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Advanced Platform Instructions
  const platformInstructions: Record<string, string> = {
    'X': `
      PLATFORM: X (Twitter)
      FORMAT: Thread (5-7 tweets) separated by double newlines.
      STYLE: Punchy, line-by-line writing. No fluff. 
      HOOK: Start with a strong claim, data point, or contrarian take based on the Hook Style.
      STRUCTURE:
      - Tweet 1: Hook + curiosity gap.
      - Tweet 2-N: Value delivery, actionable steps, or story beats.
      - Last Tweet: CTA or summary.
    `,
    'Instagram': `
      PLATFORM: Instagram
      FORMAT: High-engagement caption (max 150 words).
      STYLE: Aesthetic, relatable, emotive. Use line breaks for readability.
      HOOK: First sentence must stop the scroll.
      CTA: Ask a question or prompt a save/share.
      HASHTAGS: Mix of niche (10k-50k posts) and broad tags.
    `,
    'Facebook': `
      PLATFORM: Facebook
      FORMAT: Story-driven or community-focused post.
      STYLE: Conversational, warm, "friend-to-friend" tone.
      LENGTH: Medium (100-200 words).
      GOAL: Spark comments and discussion.
    `,
    'YouTube': `
      PLATFORM: YouTube (Long form)
      OUTPUT: 
      1. SEO Optimized Title (High CTR).
      2. Visual Hook Description: What exactly happens in the first 5 seconds to grab attention?
      3. Description: Key takeaways and timestamps (simulated).
    `,
    'LinkedIn': `
      PLATFORM: LinkedIn
      FORMAT: Broetry or professional insight.
      STYLE: Authoritative yet accessible. Low jargon.
      STRUCTURE:
      - 1-line strong hook.
      - White space (one sentence per paragraph).
      - "The meat" (insight/story).
      - "The takeaway" (lesson).
      - CTA: "Thoughts?" or "Repost if this resonated."
    `,
    'TikTok': `
      PLATFORM: TikTok
      FORMAT: Director's Script or Photo Mode Carousel.
      STYLE: Fast-paced, visually driven, trend-aware.
      IMPORTANT:
      1. Output a TABLE-like structure using markdown for the script (Time | Visual | Audio).
      2. Suggest an 'Audio Mood' (e.g., 'Upbeat Phonk', 'Sad Piano') instead of specific copyrighted songs.
      3. If Photo Mode: List 3-5 slide concepts.
      4. Include a Caption with 3-5 hashtags suitable for the FYP (For You Page).
    `
  };

  const selectedInstructions = info.platforms
    .map(p => platformInstructions[p])
    .filter(Boolean)
    .join('\n    --------------------\n    ');

  if (!selectedInstructions) {
      throw new Error("Please select at least one platform.");
  }

  // Constructing the "Expert Persona" System Prompt
  const prompt = `
    ROLE: You are an elite Social Media Strategist and Copywriter. You work for high-growth brands and understand platform-native nuances perfectly.
    
    TASK: Generate high-performing content for the following campaign.
    
    === BRAND INTELLIGENCE ===
    BRAND: ${info.brandName} (${info.industry})
    VOICE: ${info.brandVoice}
    AUDIENCE: ${info.targetAudience}
    AUDIENCE PAIN POINTS: ${info.audiencePainPoints || "General industry frustrations"}
    
    === CAMPAIGN STRATEGY ===
    TOPIC: ${info.topic}
    KEY BENEFITS: ${info.keyBenefits}
    GOAL: ${info.campaignGoal}
    CTA: ${info.cta}
    HOOK STRATEGY: ${info.hookStyle || "Curiosity"}
    
    === EXECUTION RULES ===
    1. NO GENERIC AI FLUFF. Avoid words like "unleash", "unlock", "elevate", "game-changer", "delve".
    2. BE SPECIFIC. Use the "Audience Pain Points" to agitate the problem before offering the solution.
    3. ADAPT TO PLATFORM. Do not copy-paste. An X thread is totally different from a LinkedIn post.
    4. HOOKS MATTER. The first sentence must be impossible to ignore, aligned with the '${info.hookStyle}' strategy.
    
    === PLATFORM SPECIFIC INSTRUCTIONS ===
    ${selectedInstructions}
    
    Generate the output in strict JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: socialPostSchema,
        temperature: 0.75, // Slightly higher for creativity in hooks
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
      },
    });

    if (!response.text) {
        // If text is missing, check if it was blocked
        const candidate = response.candidates?.[0];
        if (candidate?.finishReason) {
             console.error("Generation failed. Finish reason:", candidate.finishReason);
             throw new Error(`Generation blocked: ${candidate.finishReason}`);
        }
        throw new Error("No response generated");
    }

    const data = JSON.parse(response.text);
    return data as GeneratedContent;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('API key')) {
        throw new Error("API_KEY_INVALID");
    }
    // Re-throw specific errors
    throw error;
  }
};

export const refineContent = async (
    content: string, 
    platform: string, 
    instruction: string, 
    customApiKey?: string
): Promise<string> => {
    const apiKey = customApiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
        You are a social media editor.
        
        TASK: Rewrite the following ${platform} post content.
        INSTRUCTION: ${instruction}
        
        ORIGINAL CONTENT:
        ${content}
        
        RULES:
        1. Return ONLY the new content text. No explanations.
        2. Keep the formatting (line breaks, etc.) appropriate for ${platform}.
        3. Do not add quotes around the output.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
              ],
            }
        });

        return response.text || content;
    } catch (error: any) {
        console.error("Refine Error:", error);
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('API key')) {
            throw new Error("API_KEY_INVALID");
        }
        throw error;
    }
};

export const generateImage = async (prompt: string, customApiKey?: string): Promise<string> => {
  const apiKey = customApiKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
       }
    }
    
    throw new Error("No image data found in response");

  } catch (error: any) {
    console.error("Gemini Image API Error:", error);
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('API key')) {
        throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
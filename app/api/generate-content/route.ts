import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize the official client with the environment key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const contentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    campaign_topic: { type: Type.STRING },
    mva_maneuver_focus: { type: Type.STRING },
    teen_anxiety_trigger: { type: Type.STRING },
    tiktok: {
      type: Type.OBJECT,
      properties: {
        hook_first_3_seconds: { type: Type.STRING },
        visual_storyboard: { type: Type.STRING },
        audio_suggestion: { type: Type.STRING },
        script_with_timestamps: { type: Type.STRING },
        caption: { type: Type.STRING },
        recommended_hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["hook_first_3_seconds", "visual_storyboard", "script_with_timestamps", "caption", "recommended_hashtags"]
    },
    instagram_reels: {
      type: Type.OBJECT,
      properties: {
        hook_text_overlay: { type: Type.STRING },
        caption: { type: Type.STRING },
        manychat_trigger_keyword: { type: Type.STRING },
        audio_vibe: { type: Type.STRING },
        location_tag: { type: Type.STRING }
      },
      required: ["hook_text_overlay", "caption", "manychat_trigger_keyword", "location_tag"]
    },
    facebook: {
      type: Type.OBJECT,
      properties: {
        parent_targeted_copy: { type: Type.STRING },
        safety_feature_spotlight: { type: Type.STRING },
        call_to_action_url: { type: Type.STRING }
      },
      required: ["parent_targeted_copy", "safety_feature_spotlight", "call_to_action_url"]
    },
    youtube_shorts: {
      type: Type.OBJECT,
      properties: {
        video_title: { type: Type.STRING },
        seo_description: { type: Type.STRING },
        pinned_comment: { type: Type.STRING },
        search_tags: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["video_title", "seo_description", "pinned_comment", "search_tags"]
    }
  },
  required: [
    "campaign_topic",
    "mva_maneuver_focus",
    "teen_anxiety_trigger",
    "tiktok",
    "instagram_reels",
    "facebook",
    "youtube_shorts"
  ]
};

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { topicPrompt, language = "English" } = await req.json();

    const systemInstruction = `You are the Chief Social Media Strategist and Lead Content Architect for "Sam's Driving School" (samdrivingschool.org), located at 751 Rockville Pike, Rockville, MD 20852.
BRAND IDENTITY & VALUE PROPOSITION:
 * Leadership: Women-owned business led by Sam, who holds an academic degree in Psychology.
 * Core Differentiator: Driving anxiety relief, psychological calming techniques for nervous drivers, zero-yelling environment, and building deep road confidence.
 * Certified Fleet: Modern dual-control vehicles (dual-brake equipped).
 * Diverse Instructors: Certified female instructors, multilingual (English, Spanish, Farsi).
 * Honors: Voted "Best of 2025" in Rockville, MD.
 * Official Services:
   * 36-hour Drivers Ed: 30-hour interactive Zoom classes (10-day PM course) + 6 hours BTW ($378 discounted / $420 regular).
   * Behind-the-Wheel (BTW) lessons: 2 to 60-hour packages ($120 discounted / $130 regular per 2-hour session).
   * MVA Road Test Car Rental with 45-min pre-test warm-up ($140 discounted / $170 regular).
   * 3-hour Alcohol & Drug Education program ($90 discounted / $100 regular).
   * Free pickup and drop-off from Rockville Metro Station.
TARGET AUDIENCES:
 * Teenagers (Gen Z, ages 15y 9m to 18): High school students in Montgomery County. Tone: Energetic, humorous, validating, trend-conscious, concise.
 * Parents (Gen X/Millennials): Decision-makers and payers. Tone: Reassuring, professional, authoritative, trustworthy.
 * Hispanic Community: Emphasize Spanish-speaking instructors and welcoming atmosphere.
OPERATIONAL INSTRUCTION:
Generate platform-native content for TikTok, Instagram Reels, Facebook, and YouTube Shorts from a single input concept. 
CRITICAL: You MUST generate all text, captions, hooks, and scripts in the following language: ${language.toUpperCase()}. Do not use English unless the requested language is English.
You must strictly output valid JSON according to the provided schema. No introductory or concluding conversational prose.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: topicPrompt || "Parallel parking fail vs pass with psychology breathing trick in Rockville MVA test course",
      config: {
        temperature: 0.2,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: contentSchema,
        systemInstruction: systemInstruction
      }
    });

    if (!response.text) {
      throw new Error("No response text returned from model");
    }

    const parsedData = JSON.parse(response.text.trim());
    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown error" }, { status: 500 });
  }
}

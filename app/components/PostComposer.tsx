"use client";

import { useState } from "react";
import { Smartphone, Facebook, Instagram, Youtube, Send, FileVideo, Calendar, Loader2 } from "lucide-react";
import { PreviewPane } from "./PreviewPane";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function PostComposer({ language, initialContent }: { language: "en" | "es", initialContent: any }) {
  const [activePlatform, setActivePlatform] = useState<"tiktok" | "instagram" | "facebook" | "youtube">("tiktok");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const getPlatformContent = () => {
    if (!initialContent) return null;
    switch(activePlatform) {
      case "tiktok": return initialContent.tiktok;
      case "instagram": return initialContent.instagram_reels;
      case "facebook": return initialContent.facebook;
      case "youtube": return initialContent.youtube_shorts;
    }
  };

  const content = getPlatformContent();

  const handleSaveToCalendar = async () => {
    if (!user || !content || !scheduledDate || !scheduledTime) {
      alert(language === "en" ? "Please fill out date and time" : "Por favor, seleccione fecha y hora");
      return;
    }

    setSaving(true);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        platform: activePlatform,
        content: content,
        status: "scheduled",
        scheduledTime: scheduledDateTime,
        createdAt: serverTimestamp()
      });

      alert(language === "en" ? "Scheduled successfully!" : "¡Programado con éxito!");
      setScheduledDate("");
      setScheduledTime("");
    } catch (e) {
      console.error(e);
      alert("Error scheduling post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Editor Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col overflow-hidden">
        
        {/* Platform Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 overflow-x-auto shrink-0">
          {(["tiktok", "instagram", "facebook", "youtube"] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                activePlatform === platform
                  ? "border-neutral-900 text-neutral-900 bg-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {platform === "tiktok" && "TikTok"}
              {platform === "instagram" && <Instagram className="w-4 h-4" />}
              {platform === "facebook" && <Facebook className="w-4 h-4" />}
              {platform === "youtube" && <Youtube className="w-4 h-4" />}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!initialContent ? (
            <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
              {language === "en" ? "Generate a campaign first in the AI Studio." : "Genera una campaña primero en el Estudio IA."}
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {activePlatform === "tiktok" && (
                <>
                  <Field label="Video Hook (First 3s)" value={content?.hook_first_3_seconds} />
                  <Field label="Script & Timestamps" value={content?.script_with_timestamps} type="textarea" />
                  <Field label="Caption" value={content?.caption} type="textarea" />
                  <Field label="Hashtags" value={content?.recommended_hashtags?.join(" ")} />
                  
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">TikTok Disclosure Settings</h4>
                    <label className="flex items-center gap-2 text-sm text-blue-800">
                      <input type="checkbox" defaultChecked className="rounded border-blue-300 text-blue-600 focus:ring-blue-500" />
                      Commercial Content (brand_organic_toggle: true)
                    </label>
                  </div>
                </>
              )}

              {activePlatform === "instagram" && (
                <>
                  <Field label="Text Overlay" value={content?.hook_text_overlay} />
                  <Field label="Caption" value={content?.caption} type="textarea" />
                  <Field label="ManyChat Keyword" value={content?.manychat_trigger_keyword} />
                  <Field label="Location Tag" value={content?.location_tag} />
                </>
              )}

              {activePlatform === "facebook" && (
                <>
                  <Field label="Post Copy" value={content?.parent_targeted_copy} type="textarea" />
                  <Field label="Safety Feature Highlight" value={content?.safety_feature_spotlight} />
                  <Field label="Action URL" value={content?.call_to_action_url} />
                </>
              )}

              {activePlatform === "youtube" && (
                <>
                  <Field label="Short Title" value={content?.video_title} />
                  <Field label="SEO Description" value={content?.seo_description} type="textarea" />
                  <Field label="Pinned Comment" value={content?.pinned_comment} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-neutral-300 rounded-lg flex-1">
               <Calendar className="w-4 h-4 text-neutral-500" />
               <input 
                 type="date" 
                 value={scheduledDate}
                 onChange={(e) => setScheduledDate(e.target.value)}
                 className="bg-transparent border-none focus:outline-none text-sm w-full"
               />
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-neutral-300 rounded-lg flex-1">
               <input 
                 type="time" 
                 value={scheduledTime}
                 onChange={(e) => setScheduledTime(e.target.value)}
                 className="bg-transparent border-none focus:outline-none text-sm w-full"
               />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 shrink-0">
            <button className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
              {language === "en" ? "Save Draft" : "Guardar Borrador"}
            </button>
            <button 
              onClick={handleSaveToCalendar}
              disabled={saving || !initialContent}
              className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {language === "en" ? "Schedule Post" : "Programar Post"}
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel (Phone Mockup) */}
      <div className="hidden lg:flex w-[350px] shrink-0 bg-neutral-100 rounded-3xl p-4 border border-neutral-200 items-center justify-center">
        <PreviewPane platform={activePlatform} content={content} language={language} />
      </div>

    </div>
  );
}

function Field({ label, value, type = "text" }: { label: string, value?: string, type?: "text" | "textarea" }) {
  return (
    <div>
      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{label}</label>
      {type === "textarea" ? (
        <textarea 
          className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
          defaultValue={value || ""}
          placeholder="Content will appear here..."
        />
      ) : (
        <input 
          type="text"
          className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
          defaultValue={value || ""}
          placeholder="Content will appear here..."
        />
      )}
    </div>
  );
}

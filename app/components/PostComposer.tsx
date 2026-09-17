"use client";

import { useState, useEffect } from "react";
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Send, 
  Calendar, 
  Loader2, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Globe
} from "lucide-react";
import { PreviewPane } from "./PreviewPane";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

type Platform = "tiktok" | "instagram" | "facebook" | "youtube" | "linkedin" | "x";

export function PostComposer({ language, initialContent }: { language: "en" | "es", initialContent: any }) {
  const [activePlatform, setActivePlatform] = useState<Platform>("tiktok");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [customText, setCustomText] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishingNow, setPublishingNow] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Postiz engine selection
  const [usePostizEngine, setUsePostizEngine] = useState(true);
  const [postizOnline, setPostizOnline] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    // Quick probe to check if Postiz is active
    fetch("/api/postiz/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.online) setPostizOnline(true);
      })
      .catch(() => setPostizOnline(false));
  }, []);

  const getPlatformContent = () => {
    if (!initialContent) return null;
    switch(activePlatform) {
      case "tiktok": return initialContent.tiktok;
      case "instagram": return initialContent.instagram_reels;
      case "facebook": return initialContent.facebook;
      case "youtube": return initialContent.youtube_shorts;
      case "linkedin": return {
        title: initialContent.facebook?.safety_feature_spotlight || "Professional Driver Training",
        post_copy: initialContent.facebook?.parent_targeted_copy || "",
      };
      case "x": return {
        tweet: (initialContent.tiktok?.hook_first_3_seconds || initialContent.facebook?.parent_targeted_copy || "").substring(0, 260),
      };
    }
  };

  const content = getPlatformContent();

  const getExtractedText = () => {
    if (customText) return customText;
    if (!content) return "";
    return (
      content.parent_targeted_copy ||
      content.caption ||
      content.hook_first_3_seconds ||
      content.tweet ||
      content.post_copy ||
      content.video_title ||
      ""
    );
  };

  const handleSaveToCalendar = async () => {
    if (!user || !content || !scheduledDate || !scheduledTime) {
      alert(language === "en" ? "Please fill out date and time" : "Por favor, seleccione fecha y hora");
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const textToPublish = getExtractedText();

      if (usePostizEngine && postizOnline) {
        // Send to Postiz Orchestrator via API
        const response = await fetch("/api/postiz/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: textToPublish,
            platforms: [activePlatform],
            mediaUrls: mediaUrl ? [mediaUrl] : [],
            scheduledAt: scheduledDateTime.toISOString(),
            preferEngine: "POSTIZ",
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to schedule via Postiz");
      }

      // Record in local Firestore calendar
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        platform: activePlatform,
        content: content,
        mediaUrl: mediaUrl || null,
        status: "scheduled",
        scheduledTime: scheduledDateTime,
        publishEngine: usePostizEngine ? "POSTIZ" : "DIRECT",
        createdAt: serverTimestamp(),
      });

      setFeedback({
        type: "success",
        message: language === "en" 
          ? `Successfully scheduled for ${scheduledDate} ${scheduledTime}!`
          : `¡Programado con éxito para ${scheduledDate} ${scheduledTime}!`,
      });
      setScheduledDate("");
      setScheduledTime("");
    } catch (e: any) {
      console.error(e);
      setFeedback({
        type: "error",
        message: e.message || "Error scheduling post",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInstantPublish = async () => {
    const textToPublish = getExtractedText();
    if (!textToPublish) {
      alert(language === "en" ? "No post content to publish" : "No hay contenido para publicar");
      return;
    }

    if (!window.confirm(language === "en" ? `Publish immediately to ${activePlatform.toUpperCase()}?` : `¿Publicar inmediatamente en ${activePlatform.toUpperCase()}?`)) {
      return;
    }

    setPublishingNow(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/postiz/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToPublish,
          platforms: [activePlatform],
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          preferEngine: usePostizEngine ? "POSTIZ" : "DIRECT",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publishing failed");

      setFeedback({
        type: "success",
        message: language === "en" 
          ? `Dispatched successfully to ${activePlatform.toUpperCase()}!`
          : `¡Enviado con éxito a ${activePlatform.toUpperCase()}!`,
      });
    } catch (err: any) {
      console.error("Instant publish error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to publish post",
      });
    } finally {
      setPublishingNow(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Editor Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col overflow-hidden">
        
        {/* Platform Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 overflow-x-auto shrink-0">
          {(["tiktok", "instagram", "facebook", "youtube", "linkedin", "x"] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => {
                setActivePlatform(platform);
                setFeedback(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activePlatform === platform
                  ? "border-neutral-900 text-neutral-900 bg-white shadow-xs font-bold"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {platform === "tiktok" && "TikTok"}
              {platform === "instagram" && <Instagram className="w-4 h-4 text-pink-600" />}
              {platform === "facebook" && <Facebook className="w-4 h-4 text-blue-600" />}
              {platform === "youtube" && <Youtube className="w-4 h-4 text-red-600" />}
              {platform === "linkedin" && <Share2 className="w-4 h-4 text-sky-700" />}
              {platform === "x" && <span className="font-mono font-bold">X</span>}
            </button>
          ))}
        </div>

        {/* Engine Toggle Bar */}
        <div className="px-6 py-2.5 bg-neutral-100/80 border-b border-neutral-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">
              {language === "en" ? "Publishing Engine:" : "Motor de Publicación:"}
            </span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={usePostizEngine}
                onChange={(e) => setUsePostizEngine(e.target.checked)}
                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-neutral-800 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Postiz Orchestrator
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${postizOnline ? "bg-emerald-500" : "bg-neutral-400"}`} />
            <span className="text-neutral-500 text-[11px]">
              {postizOnline 
                ? (language === "en" ? "Postiz Active" : "Postiz Activo")
                : (language === "en" ? "Postiz Standby" : "Postiz en espera")}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

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
                  <Field label="Public HTTPS Video URL" value={mediaUrl} onChange={setMediaUrl} />
                  <Field label="Video Hook (First 3s)" value={content?.hook_first_3_seconds} onChange={setCustomText} />
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
                  <Field label="Public HTTPS Video URL" value={mediaUrl} onChange={setMediaUrl} />
                  <Field label="Text Overlay" value={content?.hook_text_overlay} />
                  <Field label="Caption" value={content?.caption} type="textarea" onChange={setCustomText} />
                  <Field label="ManyChat Keyword" value={content?.manychat_trigger_keyword} />
                  <Field label="Location Tag" value={content?.location_tag} />
                </>
              )}

              {activePlatform === "facebook" && (
                <>
                  <Field label="Post Copy" value={content?.parent_targeted_copy} type="textarea" onChange={setCustomText} />
                  <Field label="Safety Feature Highlight" value={content?.safety_feature_spotlight} />
                  <Field label="Action URL" value={content?.call_to_action_url} />
                </>
              )}

              {activePlatform === "youtube" && (
                <>
                  <Field label="Short Title" value={content?.video_title} onChange={setCustomText} />
                  <Field label="SEO Description" value={content?.seo_description} type="textarea" />
                  <Field label="Pinned Comment" value={content?.pinned_comment} />
                </>
              )}

              {activePlatform === "linkedin" && (
                <>
                  <Field label="Professional Headline" value={content?.title} />
                  <Field label="Post Copy & Insights" value={content?.post_copy} type="textarea" onChange={setCustomText} />
                  <Field label="Media Attachment URL" value={mediaUrl} onChange={setMediaUrl} />
                </>
              )}

              {activePlatform === "x" && (
                <>
                  <Field label="Tweet / Post (280 chars)" value={content?.tweet} type="textarea" onChange={setCustomText} />
                  <Field label="Media Attachment URL" value={mediaUrl} onChange={setMediaUrl} />
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
          
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button 
              onClick={handleInstantPublish}
              disabled={publishingNow || !initialContent}
              className="px-3.5 py-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {publishingNow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
              {language === "en" ? "Publish Now" : "Publicar Ahora"}
            </button>

            <button 
              onClick={handleSaveToCalendar}
              disabled={saving || !initialContent}
              className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {language === "en" ? "Schedule Post" : "Programar Post"}
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel (Phone Mockup) */}
      <div className="hidden lg:flex w-[350px] shrink-0 bg-neutral-100 rounded-3xl p-4 border border-neutral-200 items-center justify-center">
        <PreviewPane platform={activePlatform === "linkedin" || activePlatform === "x" ? "facebook" : activePlatform} content={content} language={language} />
      </div>

    </div>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string, value?: string, type?: "text" | "textarea", onChange?: (value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{label}</label>
      {type === "textarea" ? (
        <textarea 
          className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
          defaultValue={value || ""}
          placeholder="Content will appear here..."
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <input 
          type="text"
          className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all"
          defaultValue={value || ""}
          placeholder="Content will appear here..."
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </div>
  );
}

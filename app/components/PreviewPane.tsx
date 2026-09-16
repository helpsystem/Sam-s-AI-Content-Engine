"use client";

import { Heart, MessageCircle, Bookmark, Share2, Music, MoreHorizontal, User } from "lucide-react";

export interface PreviewPaneProps {
  platform: "tiktok" | "instagram" | "facebook" | "youtube";
  content: any;
  language: "en" | "es";
}

export function PreviewPane({ platform, content, language }: PreviewPaneProps) {
  if (platform === "facebook" || platform === "youtube") {
    // Basic fallback for non-vertical-video platforms
    return (
      <div className="w-[300px] h-[600px] bg-white rounded-[2.5rem] p-2 relative shadow-xl overflow-hidden border-[6px] border-neutral-800 flex flex-col">
        <div className="h-14 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between px-5 text-sm font-medium border-b border-neutral-100">
          <span className="capitalize">{platform} Preview</span>
        </div>
        <div className="flex-1 bg-neutral-100 flex flex-col">
           <div className="h-48 bg-neutral-200 flex items-center justify-center text-neutral-400">
             Image/Video Placeholder
           </div>
           <div className="p-4 bg-white space-y-2 flex-1 overflow-y-auto">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">S</div>
               <div className="font-bold text-sm">Sam&apos;s Driving School</div>
             </div>
             <p className="text-sm text-neutral-800 whitespace-pre-wrap">
               {platform === "facebook" && content?.parent_targeted_copy}
               {platform === "youtube" && content?.video_title}
             </p>
           </div>
        </div>
      </div>
    );
  }

  // TikTok & Instagram (Vertical Video) Layouts
  const isTiktok = platform === "tiktok";
  const caption = content?.caption || "";
  const overlayText = isTiktok ? content?.hook_first_3_seconds : content?.hook_text_overlay;

  return (
    <div className="w-[300px] h-[600px] bg-neutral-900 rounded-[2.5rem] relative shadow-xl overflow-hidden border-[6px] border-neutral-800 text-white font-sans">
      {/* Phone Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-neutral-800 rounded-b-3xl w-40 mx-auto z-50"></div>
      
      {/* Video Background Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900 z-0"></div>

      {/* Top UI Elements */}
      <div className="absolute top-8 inset-x-0 px-4 flex justify-between items-center z-20">
        <div className="text-sm font-semibold opacity-90">{isTiktok ? "Following | For You" : "Reels"}</div>
      </div>

      {/* Text Overlay (Hook) */}
      {overlayText && (
        <div className="absolute top-1/3 inset-x-4 z-20 transform -translate-y-1/2 flex justify-center">
          <div className={`
            px-4 py-2 font-bold text-center leading-tight
            ${isTiktok 
              ? "bg-red-500 text-white text-xl rounded-md shadow-lg shadow-black/20 max-w-[85%]" 
              : "bg-black/60 text-white text-lg rounded-xl backdrop-blur-sm max-w-[90%]"}
          `}>
            {overlayText}
          </div>
        </div>
      )}

      {/* Right Side Interactions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-30">
        {/* Profile Pic */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-white border border-white flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">S</div>
          </div>
          {isTiktok && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-neutral-900 text-lg leading-none">
              <span className="-mt-0.5">+</span>
            </div>
          )}
        </div>

        <InteractionIcon icon={<Heart className="w-6 h-6" />} label="12.4K" />
        <InteractionIcon icon={<MessageCircle className="w-6 h-6" />} label="342" />
        <InteractionIcon icon={<Bookmark className="w-6 h-6" />} label="1.2K" />
        <InteractionIcon icon={<Share2 className="w-6 h-6" />} label="54" />
        
        {isTiktok ? (
          <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
             <Music className="w-4 h-4 text-white" />
          </div>
        ) : (
          <MoreHorizontal className="w-6 h-6 opacity-90 mt-2" />
        )}
      </div>

      {/* Bottom Information Area */}
      <div className="absolute bottom-0 inset-x-0 p-4 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none">
        
        {/* Username */}
        <div className="font-semibold text-[15px] mb-1 flex items-center gap-1.5 shadow-sm">
          samsdrivingschool
          {!isTiktok && <div className="px-2 py-0.5 border border-white/40 rounded-full text-[10px] ml-1">Follow</div>}
        </div>
        
        {/* Caption */}
        <div className="text-sm opacity-90 mb-3 w-4/5 line-clamp-2">
          {caption || "Generate content to see the caption preview here..."}
        </div>
        
        {/* Music Ticker */}
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Music className="w-3 h-3" />
          <span className="marquee whitespace-nowrap overflow-hidden">
            Original Audio - Sam&apos;s Driving School {isTiktok ? "• Original creator" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function InteractionIcon({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 opacity-90">
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

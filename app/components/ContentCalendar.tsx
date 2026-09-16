"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface Post {
  id: string;
  title: string;
  platform: string;
  time: string;
  date: Date;
  status: string;
}

export function ContentCalendar({ language }: { language: "en" | "es" }) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  useEffect(() => {
    if (!user) return;
    
    // Listen to posts in real-time
    const q = query(
      collection(db, "posts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: Post[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.scheduledTime) {
          const dateObj = data.scheduledTime.toDate();
          
          let title = "Post";
          if (data.platform === "tiktok") title = data.content?.hook_first_3_seconds || "TikTok Video";
          if (data.platform === "instagram") title = data.content?.hook_text_overlay || "Instagram Reel";
          if (data.platform === "facebook") title = "Facebook Post";
          if (data.platform === "youtube") title = data.content?.video_title || "YouTube Short";
          
          fetchedPosts.push({
            id: doc.id,
            title: title,
            platform: data.platform.charAt(0).toUpperCase() + data.platform.slice(1),
            date: dateObj,
            time: format(dateObj, 'HH:mm'),
            status: data.status
          });
        }
      });
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
          {language === "en" ? "Weekly Schedule" : "Horario Semanal"}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevWeek} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium px-2">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={handleNextWeek} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
           <div className="h-full flex items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
           </div>
        ) : (
          <div className="grid grid-cols-7 gap-4 min-w-[800px]">
            {days.map((day, i) => {
              const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
              
              return (
              <div key={i} className="flex flex-col gap-3">
                <div className={`text-center p-2 rounded-xl border ${
                  isToday
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-neutral-50 text-neutral-600 border-neutral-200"
                }`}>
                  <div className="text-xs font-bold uppercase">{format(day, 'EEE')}</div>
                  <div className="text-xl font-light">{format(day, 'd')}</div>
                </div>
                
                <div className="flex-1 space-y-2 min-h-[400px] bg-neutral-50/50 rounded-xl border border-neutral-100 p-2">
                  {posts
                    .filter(post => post.date.getDate() === day.getDate() && post.date.getMonth() === day.getMonth())
                    .map((post) => (
                    <div key={post.id} className="p-3 bg-white border border-neutral-200 rounded-lg shadow-sm cursor-grab hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          post.platform === 'Tiktok' ? 'bg-black text-white' :
                          post.platform === 'Instagram' ? 'bg-pink-100 text-pink-700' :
                          post.platform === 'Youtube' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {post.platform}
                        </span>
                        <span className="text-xs text-neutral-400 font-medium">{post.time}</span>
                      </div>
                      <div className="text-sm font-medium text-neutral-800 leading-tight line-clamp-2">
                        {post.title}
                      </div>
                      <div className="mt-2 text-[10px] text-neutral-400 uppercase font-bold flex items-center justify-end">
                        {post.status === "published" ? (
                          <span className="text-emerald-500">Published</span>
                        ) : (
                          <span className="text-amber-500">Scheduled</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}

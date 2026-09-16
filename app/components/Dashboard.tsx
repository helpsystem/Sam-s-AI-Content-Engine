import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { TrendingUp, Users, Calendar, Activity, CheckCircle2 } from "lucide-react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface DashboardProps {
  language: "en" | "es";
}

export function Dashboard({ language }: DashboardProps) {
  const { user } = useAuth();
  
  const [scheduledCount, setScheduledCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [connectedAccounts, setConnectedAccounts] = useState(0);
  
  const [platformData, setPlatformData] = useState([
    { name: "Instagram", posts: 0, color: "#E1306C" },
    { name: "TikTok", posts: 0, color: "#000000" },
    { name: "Facebook", posts: 0, color: "#1877F2" },
    { name: "YouTube", posts: 0, color: "#FF0000" },
  ]);

  useEffect(() => {
    if (!user) return;

    // Listen to posts
    const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      let scheduled = 0;
      let published = 0;
      let total = snapshot.size;
      
      let platformCounts = { instagram: 0, tiktok: 0, facebook: 0, youtube: 0 };

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "scheduled") scheduled++;
        if (data.status === "published") published++;
        
        if (data.platform === "instagram") platformCounts.instagram++;
        if (data.platform === "tiktok") platformCounts.tiktok++;
        if (data.platform === "facebook") platformCounts.facebook++;
        if (data.platform === "youtube") platformCounts.youtube++;
      });

      setScheduledCount(scheduled);
      setPublishedCount(published);
      setTotalPostsCount(total);
      
      setPlatformData([
        { name: "Instagram", posts: platformCounts.instagram, color: "#E1306C" },
        { name: "TikTok", posts: platformCounts.tiktok, color: "#000000" },
        { name: "Facebook", posts: platformCounts.facebook, color: "#1877F2" },
        { name: "YouTube", posts: platformCounts.youtube, color: "#FF0000" },
      ]);
    });

    // Listen to social accounts
    const accountsQuery = query(collection(db, "social_accounts"), where("userId", "==", user.uid));
    const unsubscribeAccounts = onSnapshot(accountsQuery, (snapshot) => {
      setConnectedAccounts(snapshot.size);
    });

    return () => {
      unsubscribePosts();
      unsubscribeAccounts();
    };
  }, [user]);

  const t = {
    en: {
      metrics: {
        scheduled: "Posts Scheduled",
        published: "Posts Published",
        total: "Total Generated",
        accounts: "Connected Accounts"
      },
      charts: {
        platformTitle: "Posts by Platform"
      }
    },
    es: {
      metrics: {
        scheduled: "Publicaciones Programadas",
        published: "Publicaciones Publicadas",
        total: "Total Generado",
        accounts: "Cuentas Conectadas"
      },
      charts: {
        platformTitle: "Publicaciones por Plataforma"
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title={t[language].metrics.scheduled} 
          value={scheduledCount.toString()} 
          icon={<Calendar className="w-5 h-5 text-blue-500" />} 
          trend={`${scheduledCount} waiting`} 
        />
        <MetricCard 
          title={t[language].metrics.published} 
          value={publishedCount.toString()} 
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} 
          trend="Successfully posted" 
        />
        <MetricCard 
          title={t[language].metrics.total} 
          value={totalPostsCount.toString()} 
          icon={<Activity className="w-5 h-5 text-purple-500" />} 
          trend="Since inception" 
        />
        <MetricCard 
          title={t[language].metrics.accounts} 
          value={connectedAccounts.toString()} 
          icon={<Users className="w-5 h-5 text-amber-500" />} 
          trend="Social profiles" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        {/* Platform Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-800 mb-6">{t[language].charts.platformTitle}</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="posts" radius={[4, 4, 0, 0]}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-neutral-900">{value}</h4>
        </div>
        <div className="p-2 bg-neutral-50 rounded-xl">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs font-medium text-neutral-500">
        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mr-2">{trend.split(' ')[0]}</span>
        {trend.split(' ').slice(1).join(' ')}
      </div>
    </div>
  );
}

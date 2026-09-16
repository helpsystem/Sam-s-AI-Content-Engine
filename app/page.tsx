"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  PenTool, 
  Wand2, 
  Settings, 
  Languages,
  Video,
  Menu,
  Car,
  MessageSquare,
  BarChart3,
  LogOut
} from "lucide-react";
import { Link2 } from "lucide-react";
import { AICampaignGenerator } from "./components/AICampaignGenerator";
import { PostComposer } from "./components/PostComposer";
import { ContentCalendar } from "./components/ContentCalendar";
import { Dashboard } from "./components/Dashboard";
import { Integrations } from "./components/Integrations";
import { MediaLibrary } from "./components/MediaLibrary";
import { AuthProvider, useAuth } from "../lib/AuthContext";

export const dynamic = "force-dynamic";

type ViewState = "dashboard" | "calendar" | "composer" | "ai-studio" | "media" | "integrations";

function MainDashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<ViewState>("ai-studio");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // State to hold AI generated content to pass to composer
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const t = {
    en: {
      brand: "Sam's Driving School",
      dashboard: "Dashboard",
      calendar: "Content Calendar",
      composer: "Post Composer",
      aiStudio: "AI Campaign Studio",
      media: "Media & Render",
      integrations: "Integrations",
      settings: "Settings",
      switchLang: "Español",
    },
    es: {
      brand: "Escuela de Manejo Sam",
      dashboard: "Panel de Control",
      calendar: "Calendario de Contenido",
      composer: "Editor de Posts",
      aiStudio: "Estudio de Campañas IA",
      media: "Multimedia y Render",
      integrations: "Integraciones",
      settings: "Configuración",
      switchLang: "English",
    }
  };

  const navigateToComposerWithContent = (content: any) => {
    setGeneratedContent(content);
    setActiveView("composer");
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex overflow-hidden font-sans text-neutral-900">
      
      {/* Sidebar */}
      <aside className={`bg-neutral-900 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight truncate">
              <Car className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <span className="truncate">{t[language].brand}</span>
            </div>
          ) : (
            <Car className="w-6 h-6 text-blue-500 mx-auto" />
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-neutral-400 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutDashboard />} label={t[language].dashboard} active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} open={sidebarOpen} />
          <NavItem icon={<CalendarIcon />} label={t[language].calendar} active={activeView === "calendar"} onClick={() => setActiveView("calendar")} open={sidebarOpen} />
          <NavItem icon={<PenTool />} label={t[language].composer} active={activeView === "composer"} onClick={() => setActiveView("composer")} open={sidebarOpen} />
          <NavItem icon={<Wand2 />} label={t[language].aiStudio} active={activeView === "ai-studio"} onClick={() => setActiveView("ai-studio")} open={sidebarOpen} />
          <NavItem icon={<Video />} label={t[language].media} active={activeView === "media"} onClick={() => setActiveView("media")} open={sidebarOpen} />
          <NavItem icon={<Link2 />} label={t[language].integrations} active={activeView === "integrations"} onClick={() => setActiveView("integrations")} open={sidebarOpen} />
        </nav>

        <div className="p-4 border-t border-neutral-800">
           <NavItem icon={<Settings />} label={t[language].settings} active={false} onClick={() => {}} open={sidebarOpen} />
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-xl font-semibold text-neutral-800">
            {activeView === "ai-studio" && t[language].aiStudio}
            {activeView === "composer" && t[language].composer}
            {activeView === "calendar" && t[language].calendar}
            {activeView === "dashboard" && t[language].dashboard}
            {activeView === "media" && t[language].media}
            {activeView === "integrations" && t[language].integrations}
          </h1>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLanguage(language === "en" ? "es" : "en")}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
            >
              <Languages className="w-4 h-4" />
              {t[language].switchLang}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
              <div className="flex items-center gap-2">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="w-8 h-8 rounded-full border border-neutral-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "S"}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-800 leading-none">
                      {user?.displayName || "User"}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded leading-none">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400 truncate max-w-[170px] leading-tight mt-0.5">
                    {user?.email}
                  </span>
                </div>
              </div>
              <button onClick={signOut} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-neutral-50 p-6">
          {activeView === "ai-studio" && (
             <AICampaignGenerator 
                language={language} 
                onGenerateSuccess={navigateToComposerWithContent} 
             />
          )}
          {activeView === "composer" && (
             <PostComposer 
                language={language} 
                initialContent={generatedContent} 
             />
          )}
          {activeView === "calendar" && (
             <ContentCalendar language={language} />
          )}
          {activeView === "dashboard" && (
             <Dashboard language={language} />
          )}
           {activeView === "media" && (
             <MediaLibrary language={language} />
          )}
          {activeView === "integrations" && (
             <Integrations language={language} />
          )}
        </div>
        <footer className="h-8 shrink-0 border-t border-neutral-200 bg-white px-6 flex items-center justify-end">
          <span className="text-[10px] font-medium tracking-wide text-neutral-400">v0.2.0 · build 5dcca12</span>
        </footer>
      </main>
    </div>
  );
}

export default function AppDashboard() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}

function NavItem({ icon, label, active, onClick, open }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, open: boolean }) {
  return (
    <button
      onClick={onClick}
      title={!open ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        active 
          ? "bg-blue-600 text-white" 
          : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
      }`}
    >
      <div className="flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>
      {open && <span className="text-sm font-medium truncate">{label}</span>}
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  ExternalLink, 
  Loader2, 
  Link2, 
  Link2Off, 
  Server, 
  Cpu, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles, 
  Radio, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

interface IntegrationsProps {
  language: "en" | "es";
}

interface PostizChannel {
  id: string;
  name: string;
  identifier: string;
  providerIdentifier: string;
  picture?: string;
}

export function Integrations({ language }: IntegrationsProps) {
  const { user } = useAuth();

  const [metaConnecting, setMetaConnecting] = useState(false);
  const [tiktokConnecting, setTiktokConnecting] = useState(false);
  
  const [metaConnected, setMetaConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Postiz Orchestrator state
  const [postizUrl, setPostizUrl] = useState("http://localhost:5000");
  const [postizApiKey, setPostizApiKey] = useState("");
  const [postizStatus, setPostizStatus] = useState<"checking" | "online" | "offline">("checking");
  const [postizMessage, setPostizMessage] = useState("");
  const [postizChannels, setPostizChannels] = useState<PostizChannel[]>([]);
  const [testingPostiz, setTestingPostiz] = useState(false);
  const [copiedDockerCmd, setCopiedDockerCmd] = useState(false);
  const [showDockerGuide, setShowDockerGuide] = useState(false);

  const readApiResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    if (!contentType.includes("application/json")) {
      throw new Error(`API returned ${response.status} ${response.statusText} instead of JSON. Redeploy the latest Vercel commit.`);
    }
    try {
      return JSON.parse(body);
    } catch {
      throw new Error(`API returned invalid JSON (HTTP ${response.status}).`);
    }
  };

  // Load saved Postiz settings from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("postiz_api_url") || "http://localhost:5000";
    const savedKey = localStorage.getItem("postiz_api_key") || "";
    setPostizUrl(savedUrl);
    setPostizApiKey(savedKey);
    checkPostizStatus(savedUrl, savedKey);
  }, []);

  const checkPostizStatus = async (url: string, apiKey: string) => {
    setPostizStatus("checking");
    try {
      const res = await fetch(`/api/postiz/status?url=${encodeURIComponent(url)}&apiKey=${encodeURIComponent(apiKey)}`);
      const data = await readApiResponse(res);
      if (data.online) {
        setPostizStatus("online");
        setPostizMessage(data.message || "Connected to Postiz Orchestrator");
        setPostizChannels(data.channels || []);
      } else {
        setPostizStatus("offline");
        setPostizMessage(data.message || "Postiz service is not reachable");
        setPostizChannels([]);
      }
    } catch {
      setPostizStatus("offline");
      setPostizMessage("Failed to reach status endpoint");
      setPostizChannels([]);
    }
  };

  const handleTestPostizConnection = async () => {
    setTestingPostiz(true);
    localStorage.setItem("postiz_api_url", postizUrl);
    localStorage.setItem("postiz_api_key", postizApiKey);
    await checkPostizStatus(postizUrl, postizApiKey);
    setTestingPostiz(false);
  };

  const copyDockerCommand = () => {
    navigator.clipboard.writeText("docker compose -f docker-compose.postiz.yml up -d");
    setCopiedDockerCmd(true);
    setTimeout(() => setCopiedDockerCmd(false), 2000);
  };

  // Load connected accounts from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/integrations", { headers: { Authorization: `Bearer ${idToken}` } });
        if (!response.ok) throw new Error("Could not load integrations");
        const data = await readApiResponse(response);
        let hasMeta = false;
        let hasTiktok = false;
        data.accounts.forEach((account: { platform: string }) => {
          if (account.platform === "meta") hasMeta = true;
          if (account.platform === "tiktok") hasTiktok = true;
        });

        setMetaConnected(hasMeta);
        setTiktokConnected(hasTiktok);
      } catch (error) {
        console.error("Error fetching social accounts", error);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [user]);

  const t = {
    en: {
      title: "Social Platforms & Orchestration",
      description: "Connect your accounts directly or link Postiz Orchestrator for multi-channel scheduling.",
      postizCard: {
        badge: "Recommended Engine",
        title: "Postiz Universal Social Engine",
        description: "Hardened microservice running Temporal & Redis for automated, resilient publishing to 10+ social platforms (LinkedIn, X, YouTube, Instagram, Facebook, TikTok, Pinterest, Threads).",
        statusOnline: "Postiz Online & Synced",
        statusOffline: "Postiz Offline / Standalone",
        statusChecking: "Checking status...",
        apiUrlLabel: "Postiz Service URL",
        apiKeyLabel: "API Key (from Postiz Settings)",
        testBtn: "Test & Save Connection",
        dockerGuideBtn: "Docker Deployment Guide",
        connectedChannels: "Synced Channels via Postiz",
        noChannels: "No channels connected in Postiz yet. Visit your Postiz dashboard to authenticate accounts.",
      },
      directHeader: "Direct Platform Connectors",
      directSub: "Fallback direct connections managed by this Next.js app.",
      meta: {
        name: "Meta (Facebook & Instagram)",
        description: "Publish to Facebook Pages and Instagram Business accounts directly.",
        connect: "Connect Meta",
        connecting: "Connecting...",
        connected: "Connected",
        disconnect: "Disconnect"
      },
      tiktok: {
        name: "TikTok Direct",
        description: "Publish short-form videos directly to your TikTok profile.",
        connect: "Connect TikTok",
        connecting: "Connecting...",
        connected: "Connected",
        disconnect: "Disconnect"
      }
    },
    es: {
      title: "Plataformas Sociales y Orquestación",
      description: "Conecta tus cuentas directamente o vincula Postiz Orchestrator para programación multicanal.",
      postizCard: {
        badge: "Motor Recomendado",
        title: "Motor Social Universal Postiz",
        description: "Microservicio reforzado con Temporal y Redis para publicación resiliente y automatizada en más de 10 plataformas (LinkedIn, X, YouTube, Instagram, Facebook, TikTok, Pinterest).",
        statusOnline: "Postiz En línea y Sincronizado",
        statusOffline: "Postiz Desconectado / Independiente",
        statusChecking: "Comprobando estado...",
        apiUrlLabel: "URL del Servicio Postiz",
        apiKeyLabel: "Clave API (desde ajustes de Postiz)",
        testBtn: "Probar y Guardar Conexión",
        dockerGuideBtn: "Guía de Despliegue Docker",
        connectedChannels: "Canales Sincronizados vía Postiz",
        noChannels: "Aún no hay canales conectados en Postiz. Visita tu panel de Postiz para autenticar cuentas.",
      },
      directHeader: "Conectores Directos",
      directSub: "Conexiones directas de respaldo administradas por esta aplicación.",
      meta: {
        name: "Meta (Facebook e Instagram)",
        description: "Publica en páginas de Facebook y cuentas comerciales de Instagram.",
        connect: "Conectar Meta",
        connecting: "Conectando...",
        connected: "Conectado",
        disconnect: "Desconectar"
      },
      tiktok: {
        name: "TikTok Directo",
        description: "Publica videos cortos directamente en tu perfil de TikTok.",
        connect: "Conectar TikTok",
        connecting: "Conectando...",
        connected: "Conectado",
        disconnect: "Desconectar"
      }
    }
  };

  const content = t[language];

  const handleConnectMeta = async () => {
    setMetaConnecting(true);
    try {
      if (!user) throw new Error("You must be signed in");
      const idToken = await user.getIdToken();
      const response = await fetch("/api/meta/auth", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || "Could not start Meta connection");
      window.location.href = data.url;
    } catch (error: any) {
      console.error(error);
      window.alert(error.message || "Could not connect Meta");
      setMetaConnecting(false);
    }
  };

  const handleConnectTikTok = async () => {
    setTiktokConnecting(true);
    try {
      if (!user) throw new Error("You must be signed in");
      const idToken = await user.getIdToken();
      const response = await fetch("/api/tiktok/auth", { method: "POST", headers: { Authorization: `Bearer ${idToken}` } });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || "Could not start TikTok connection");
      window.location.href = data.url;
    } catch (error: any) {
      console.error(error);
      window.alert(error.message || "Could not connect TikTok");
      setTiktokConnecting(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/integrations?platform=meta", { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } });
      setMetaConnected(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnectTikTok = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/integrations?platform=tiktok", { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } });
      setTiktokConnected(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">{content.title}</h2>
        <p className="text-neutral-500 mt-2">{content.description}</p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Postiz Universal Orchestration Card (Featured)                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Cpu className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3" />
                  {content.postizCard.badge}
                </span>
                <span className="text-xs text-neutral-400">v2.22.2 Hardened</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{content.postizCard.title}</h3>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {postizStatus === "online" ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                {content.postizCard.statusOnline}
              </span>
            ) : postizStatus === "checking" ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                {content.postizCard.statusChecking}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                {content.postizCard.statusOffline}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-neutral-300 mt-4 leading-relaxed">
          {content.postizCard.description}
        </p>

        {/* Configuration inputs */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              {content.postizCard.apiUrlLabel}
            </label>
            <input
              type="text"
              value={postizUrl}
              onChange={(e) => setPostizUrl(e.target.value)}
              placeholder="http://localhost:5000"
              className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              {content.postizCard.apiKeyLabel}
            </label>
            <input
              type="password"
              value={postizApiKey}
              onChange={(e) => setPostizApiKey(e.target.value)}
              placeholder="postiz_api_key_..."
              className="w-full bg-neutral-800/80 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestPostizConnection}
              disabled={testingPostiz}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {testingPostiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {content.postizCard.testBtn}
            </button>
            <button
              onClick={() => setShowDockerGuide(!showDockerGuide)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700"
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              {content.postizCard.dockerGuideBtn}
            </button>
          </div>

          <span className="text-xs text-neutral-400 italic">
            {postizMessage}
          </span>
        </div>

        {/* Docker Deployment Guide Drawer */}
        {showDockerGuide && (
          <div className="mt-6 bg-neutral-950/90 border border-neutral-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-indigo-400 font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4" /> 1-Click Hardened Docker Command:
              </span>
              <button
                onClick={copyDockerCommand}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {copiedDockerCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedDockerCmd ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
              docker compose -f docker-compose.postiz.yml up -d
            </pre>
            <p className="text-xs text-neutral-400">
              Starts PostgreSQL, Redis, Temporal Workflow Engine and Postiz Backend on port 5000 in complete isolation.
            </p>
          </div>
        )}

        {/* Synced channels display */}
        {postizStatus === "online" && (
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              {content.postizCard.connectedChannels} ({postizChannels.length})
            </h4>
            {postizChannels.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {postizChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center gap-2.5 bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-2.5">
                    {channel.picture ? (
                      <img src={channel.picture} alt={channel.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold uppercase">
                        {channel.providerIdentifier.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{channel.name}</p>
                      <p className="text-[10px] text-indigo-300 uppercase">{channel.providerIdentifier}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">
                {content.postizCard.noChannels}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Direct Social Connectors (Fallback)                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">{content.directHeader}</h3>
          <p className="text-sm text-neutral-500">{content.directSub}</p>
        </div>

        {/* Meta Integration */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                {content.meta.name}
                {metaConnected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">{content.meta.description}</p>
            </div>
          </div>
          
          <div className="shrink-0">
            {metaConnected ? (
              <button 
                onClick={handleDisconnectMeta}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Link2Off className="w-4 h-4" />
                {content.meta.disconnect}
              </button>
            ) : (
              <button 
                onClick={handleConnectMeta}
                disabled={metaConnecting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
              >
                {metaConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {metaConnecting ? content.meta.connecting : content.meta.connect}
              </button>
            )}
          </div>
        </div>

        {/* TikTok Integration */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                {content.tiktok.name}
                {tiktokConnected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </h3>
              <p className="text-sm text-neutral-500 mt-1">{content.tiktok.description}</p>
            </div>
          </div>
          
          <div className="shrink-0">
            {tiktokConnected ? (
              <button 
                onClick={handleDisconnectTikTok}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Link2Off className="w-4 h-4" />
                {content.tiktok.disconnect}
              </button>
            ) : (
              <button 
                onClick={handleConnectTikTok}
                disabled={tiktokConnecting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-black hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
              >
                {tiktokConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {tiktokConnecting ? content.tiktok.connecting : content.tiktok.connect}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

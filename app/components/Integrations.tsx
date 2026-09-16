import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, ExternalLink, Loader2, Link2, Link2Off } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";

interface IntegrationsProps {
  language: "en" | "es";
}

export function Integrations({ language }: IntegrationsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [metaConnecting, setMetaConnecting] = useState(false);
  const [tiktokConnecting, setTiktokConnecting] = useState(false);
  
  const [metaConnected, setMetaConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Load connected accounts from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchAccounts = async () => {
      try {
        const q = query(collection(db, "social_accounts"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        let hasMeta = false;
        let hasTiktok = false;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.platform === "meta") hasMeta = true;
          if (data.platform === "tiktok") hasTiktok = true;
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

  // Handle successful redirects
  useEffect(() => {
    if (!user || loadingAccounts) return;

    const saveConnection = async () => {
      const isMetaConnectedParams = searchParams?.get("meta_connected") === "true";
      const isTiktokConnectedParams = searchParams?.get("tiktok_connected") === "true";

      if (isMetaConnectedParams && !metaConnected) {
        await setDoc(doc(db, "social_accounts", `${user.uid}_meta`), {
          userId: user.uid,
          platform: "meta",
          connectedAt: serverTimestamp(),
          mockToken: "meta_mock_token_123"
        });
        setMetaConnected(true);
      }

      if (isTiktokConnectedParams && !tiktokConnected) {
        await setDoc(doc(db, "social_accounts", `${user.uid}_tiktok`), {
          userId: user.uid,
          platform: "tiktok",
          connectedAt: serverTimestamp(),
          mockToken: "tiktok_mock_token_123"
        });
        setTiktokConnected(true);
      }

      if (isMetaConnectedParams || isTiktokConnectedParams) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("meta_connected");
        newUrl.searchParams.delete("tiktok_connected");
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    saveConnection();
  }, [searchParams, user, loadingAccounts, metaConnected, tiktokConnected]);

  const t = {
    en: {
      title: "Platform Integrations",
      description: "Connect your social media accounts to schedule and publish posts directly.",
      meta: {
        name: "Meta (Facebook & Instagram)",
        description: "Publish to Facebook Pages and Instagram Business accounts.",
        connect: "Connect Meta",
        connecting: "Connecting...",
        connected: "Connected",
        disconnect: "Disconnect"
      },
      tiktok: {
        name: "TikTok",
        description: "Publish short-form videos directly to your TikTok profile.",
        connect: "Connect TikTok",
        connecting: "Connecting...",
        connected: "Connected",
        disconnect: "Disconnect"
      }
    },
    es: {
      title: "Integraciones de Plataforma",
      description: "Conecta tus cuentas de redes sociales para programar y publicar posts directamente.",
      meta: {
        name: "Meta (Facebook e Instagram)",
        description: "Publica en páginas de Facebook y cuentas comerciales de Instagram.",
        connect: "Conectar Meta",
        connecting: "Conectando...",
        connected: "Conectado",
        disconnect: "Desconectar"
      },
      tiktok: {
        name: "TikTok",
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
      // In a real app, this would redirect to the OAuth URL
      // For this preview, we'll simulate the redirect to our API route
      window.location.href = '/api/meta/auth';
    } catch (error) {
      console.error(error);
      setMetaConnecting(false);
    }
  };

  const handleConnectTikTok = async () => {
    setTiktokConnecting(true);
    try {
      // In a real app, this would redirect to the OAuth URL
      window.location.href = '/api/tiktok/auth';
    } catch (error) {
      console.error(error);
      setTiktokConnecting(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "social_accounts", `${user.uid}_meta`));
      setMetaConnected(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnectTikTok = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "social_accounts", `${user.uid}_tiktok`));
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

      <div className="space-y-4">
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

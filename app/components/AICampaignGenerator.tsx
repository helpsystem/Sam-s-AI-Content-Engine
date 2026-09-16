"use client";

import { useState } from "react";
import { Loader2, Wand2, Sparkles, CheckCircle2 } from "lucide-react";

export function AICampaignGenerator({ language, onGenerateSuccess }: { language: "en" | "es", onGenerateSuccess: (data: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const presets = [
    {
      id: "mva-tips",
      title: language === "en" ? "MVA Test Tips & 5 Fatal Mistakes" : "Consejos MVA y 5 Errores Fatales",
      prompt: "MVA Test Tips & 5 Fatal Mistakes to avoid in Rockville, highlighting patience and no-yelling policy."
    },
    {
      id: "anxiety",
      title: language === "en" ? "Conquer Driving Anxiety with Sam" : "Vence la Ansiedad al Volante con Sam",
      prompt: "How to Conquer Driving Anxiety with Sam (Psychology-backed techniques and breathing)."
    },
    {
      id: "parking",
      title: language === "en" ? "4-Step Parallel Parking Formula" : "Fórmula de 4 Pasos: Estacionamiento Paralelo",
      prompt: "4-Step Parallel Parking Formula for Rockville MVA test, using the visual cone method."
    },
    {
      id: "hispanic",
      title: language === "en" ? "Hispanic Community License Roadmap" : "Guía de Licencia para la Comunidad Hispana",
      prompt: "Bilingual Hispanic Community Driver's License Roadmap, emphasizing Spanish-speaking instructors."
    },
    {
      id: "dual-control",
      title: language === "en" ? "Dual-Control Safety Car Tour" : "Tour del Auto de Seguridad con Doble Control",
      prompt: "Dual-Control Safety Car Tour & Free Metro Rockville Pickup offer."
    }
  ];

  const handleGenerate = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topicPrompt: prompt,
          language: language === "en" ? "English" : "Spanish" 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");
      
      onGenerateSuccess(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-neutral-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded-xl">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {language === "en" ? "1-Click Campaign Generator" : "Generador de Campañas en 1-Clic"}
            </h2>
            <p className="text-sm text-neutral-500">
              {language === "en" 
                ? "Select a preset tailored to Sam's Driving School or write your own concept." 
                : "Selecciona un preset adaptado a la Escuela Sam o escribe tu propio concepto."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleGenerate(preset.prompt)}
              disabled={loading}
              className="flex items-center justify-between p-4 text-left bg-neutral-50 hover:bg-blue-50 hover:border-blue-200 border border-neutral-200 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium text-sm text-neutral-800 group-hover:text-blue-800">
                {preset.title}
              </span>
              <Sparkles className="w-4 h-4 text-neutral-400 group-hover:text-blue-500" />
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm font-medium text-neutral-500">
              {language === "en" ? "Or write a custom prompt" : "O escribe un prompt personalizado"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={language === "en" ? "Enter campaign idea..." : "Ingresa idea de campaña..."}
            className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && customPrompt.trim() && handleGenerate(customPrompt)}
          />
          <button
            onClick={() => handleGenerate(customPrompt)}
            disabled={loading || !customPrompt.trim()}
            className="px-6 py-3 bg-neutral-900 text-white font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {language === "en" ? "Generate" : "Generar"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

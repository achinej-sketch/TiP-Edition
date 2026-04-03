/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Layout, 
  ArrowRight,
  Upload,
  ExternalLink,
  ShoppingBag,
  Image as ImageIcon,
  Search,
  Plus,
  Settings,
  Key,
  X,
  ChevronLeft,
  Copy,
  Sparkles,
  Loader2,
  Globe,
  Zap,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { GoogleGenAI } from "@google/genai";
import { ANALYSIS_PROMPT, WRITING_PROMPT } from './constants';

// Types
interface ArticleStat {
  title: string;
  views: number;
  engagement: number;
  revenue?: number;
  rpmFrance?: number;
  rpmPremium?: number;
  country?: string;
  signal?: string;
}

interface AnalysisResult {
  status: {
    lastArticle: string;
    pillar: string;
    daysAgo: string;
    status: 'ok' | 'retard';
  };
  alerts: ArticleStat[];
  topArticles: ArticleStat[];
  priorities: {
    pillar: string;
    title: string;
    angle: string;
    why: string;
    amazon: string;
    pinSearch: string;
  }[];
  bonus: {
    title: string;
    content: string;
  }[];
  recyclage?: {
    original: string;
    englishAngle: string;
  }[];
}

export default function App() {
  const [step, setStep] = useState<'welcome' | 'export_reminder' | 'dashboard' | 'writing' | 'article'>('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!sessionStorage.getItem('app_authenticated'));
  const [passwordInput, setPasswordInput] = useState('');
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [files, setFiles] = useState<{ analytics?: File, adsense?: File, pinMetrics?: File }>({});
  const [pinMetricsData, setPinMetricsData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<any>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string>('');
  const [writingProgress, setWritingProgress] = useState(0);

  const analyticsInputRef = useRef<HTMLInputElement>(null);
  const adsenseInputRef = useRef<HTMLInputElement>(null);
  const pinMetricsInputRef = useRef<HTMLInputElement>(null);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowConfig(false);
  };

  const handleFileChange = async (type: 'analytics' | 'adsense' | 'pinMetrics', file: File | undefined) => {
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      if (type === 'pinMetrics') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string);
            setPinMetricsData(Array.isArray(json) ? json : [json]);
          } catch (err) {
            alert("Erreur lors de la lecture du JSON PinMetrics.");
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: () => resolve([])
      });
    });
  };

  const runAnalysis = async () => {
    if (!apiKey) {
      setShowConfig(true);
      return;
    }

    setLoading(true);
    try {
      let analyticsData: any[] = [];
      let adsenseData: any[] = [];

      if (files.analytics) analyticsData = await parseCSV(files.analytics);
      if (files.adsense) adsenseData = await parseCSV(files.adsense);

      const genAI = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const prompt = ANALYSIS_PROMPT(
        JSON.stringify(analyticsData.slice(0, 50)),
        JSON.stringify(adsenseData.slice(0, 50))
      );

      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          tools: [{ urlContext: {} }]
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAnalysis(result);
      setStep('dashboard');
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("L'analyse a échoué. Vérifie ta clé API et le format de tes fichiers.");
    } finally {
      setLoading(false);
    }
  };

  const startWriting = async (priority: any) => {
    if (!apiKey) {
      setShowConfig(true);
      return;
    }

    setSelectedPriority(priority);
    setStep('writing');
    setWritingProgress(10);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview"; 
      
      setWritingProgress(30);
      let prompt = WRITING_PROMPT(priority);

      if (pinMetricsData) {
        prompt += `\n\nVOICI LES IMAGES DISPONIBLES (JSON PinMetrics) :\n${JSON.stringify(pinMetricsData.slice(0, 20))}\n
        IMPORTANT : Utilise les URLs 'imageUrl' de ce JSON pour les balises <figure>. Choisis les images les plus esthétiques et pertinentes pour chaque section.`;
      } else {
        prompt += `\n\nNOTE : Aucun JSON PinMetrics fourni. Utilise l'outil Google Search pour trouver des URLs d'images Pinterest (i.pinimg.com) ou de visuels aesthetics pertinents si possible, sinon utilise des placeholders descriptifs.`;
      }

      setWritingProgress(60);
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      if (!response.text) {
        throw new Error("L'IA a retourné une réponse vide.");
      }

      setGeneratedArticle(response.text);
      setWritingProgress(100);
      setTimeout(() => setStep('article'), 500);
    } catch (error: any) {
      console.error("Writing failed:", error);
      let message = error.message || "Erreur inconnue";
      
      // Gestion spécifique de l'erreur de quota 429
      if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
        message = "Quota dépassé (Erreur 429). Ton compte gratuit est limité. Attends 1 minute avant de relancer ou passe à un plan payant sur Google AI Studio.";
      }
      
      alert(`La rédaction a échoué : ${message}`);
      setStep('dashboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papier !");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_APP_PASSWORD;
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('app_authenticated', 'true');
    } else {
      alert("Mot de passe incorrect.");
    }
  };

  if (!isAuthenticated && import.meta.env.VITE_APP_PASSWORD) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center"
        >
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg">T</div>
          <h2 className="text-2xl font-bold mb-2">Accès restreint</h2>
          <p className="text-slate-500 mb-8 text-sm">Cette application est protégée. Entre le mot de passe pour continuer.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Mot de passe" 
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all font-medium"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
            >
              Déverrouiller
            </button>
          </form>
          
          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">tutoriel-iphone.fr © 2026</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep('welcome')}>
            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="font-bold text-lg tracking-tight">tutoriel-iphone.fr <span className="text-slate-400 font-normal hidden sm:inline">Assistant</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowConfig(true)}
              className={`p-2 rounded-full transition-colors ${apiKey ? 'text-slate-400 hover:text-slate-600' : 'text-pink-500 bg-pink-50 animate-pulse'}`}
            >
              <Settings size={20} />
            </button>
            <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase tracking-wider">Avril 2026</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto text-center py-12">
              <div className="mb-6 inline-flex p-4 bg-pink-50 rounded-full text-pink-500">
                <BarChart3 size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Prêt pour le briefing éditorial ?</h2>
              <p className="text-slate-600 mb-8 text-lg">Analyse tes stats pour booster ton CPC et tes revenus Amazon.</p>
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => setStep('export_reminder')}
                  className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg w-full sm:w-auto justify-center"
                >
                  Fais le point <ArrowRight size={20} />
                </button>
                {!apiKey && <p className="text-xs text-pink-600 font-medium flex items-center gap-1"><AlertCircle size={12} /> Configure ta clé API Gemini en haut à droite.</p>}
              </div>
            </motion.div>
          )}

          {step === 'export_reminder' && (
            <motion.div key="reminder" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Clock className="text-pink-500" /> Avant de continuer, exporte tes stats :</h2>
                
                <div className="space-y-4 mb-8 text-sm text-slate-600">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-bold text-blue-700 mb-2 flex items-center gap-2"><BarChart3 size={16} /> 📊 Google Analytics :</p>
                    <p>analytics.google.com → sélectionne la propriété <span className="font-bold">tutoriel-iphone.fr</span> → Rapports → Engagement → Pages et écrans → 28 derniers jours → Exporter → CSV</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="font-bold text-green-700 mb-2 flex items-center gap-2"><TrendingUp size={16} /> 📈 Google AdSense — Rapport Claude :</p>
                    <p>adsense.google.com → Rapports → Créer un rapport → Dimensions : <span className="font-bold">URL de la page + Date + Pays</span> → Métriques : <span className="font-bold">Revenus estimés, Pages vues, RPM pages, Impressions, RPM impressions, Visibles avec Active View, Clics</span> → 28 derniers jours → Exporter → CSV</p>
                    <p className="mt-2 text-xs font-bold text-orange-600">⚠️ Appelle ce fichier "rapport Claude" avant de le glisser ici.</p>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => analyticsInputRef.current?.click()} className={`py-4 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${files.analytics ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                      {files.analytics ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                      <span className="text-xs font-bold">{files.analytics ? files.analytics.name : "Glisse Analytics.csv"}</span>
                    </button>
                    <button onClick={() => adsenseInputRef.current?.click()} className={`py-4 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${files.adsense ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:border-green-300'}`}>
                      {files.adsense ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                      <span className="text-xs font-bold">{files.adsense ? files.adsense.name : "Glisse rapport-claude.csv"}</span>
                    </button>
                  </div>
                  <input type="file" ref={analyticsInputRef} className="hidden" accept=".csv" onChange={(e) => handleFileChange('analytics', e.target.files?.[0])} />
                  <input type="file" ref={adsenseInputRef} className="hidden" accept=".csv" onChange={(e) => handleFileChange('adsense', e.target.files?.[0])} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <button 
                    onClick={runAnalysis}
                    disabled={loading}
                    className={`px-8 py-4 rounded-xl font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2 ${loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}`}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    Analyser les fichiers
                  </button>
                  <button onClick={() => setStep('dashboard')} className="text-slate-400 text-sm font-medium hover:text-slate-600 underline underline-offset-4">Continuer sans stats (skip)</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Status Cards */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest">État du blog</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{(analysis?.status.status || 'ok') === 'ok' ? '✅ OK' : '⚠️ RETARD'}</p>
                      <p className="text-sm text-slate-500">{analysis?.status.daysAgo || 'Cadence respectée'}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(analysis?.status.status || 'ok') === 'ok' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}><CheckCircle2 /></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest">Dernier article</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold truncate max-w-[180px]">{analysis?.status.lastArticle || 'Coques iPhone 16'}</p>
                      <p className="text-sm text-slate-500">{analysis?.status.pillar || 'Pilier 2'}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500"><FileText /></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest">CPC Moyen</h3>
                  <div className="flex items-center justify-between">
                    <div><p className="text-2xl font-bold">€0,09</p><p className="text-sm text-slate-500">Objectif: €0,15</p></div>
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500"><TrendingUp /></div>
                  </div>
                </div>
              </section>

              {/* Top Articles & Alerts - Only show if analysis exists */}
              {analysis ? (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
                      <TrendingUp size={14} className="text-green-500" /> Top Articles (28j)
                    </h3>
                    <div className="space-y-4">
                      {analysis.topArticles.map((art, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-bold truncate">{art.title}</p>
                            <p className="text-xs text-slate-500">RPM FR: €{art.rpmFrance} | RPM Prem: €{art.rpmPremium}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-green-600">€{art.revenue}</span>
                            <span className="text-lg">{art.signal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
                      <AlertCircle size={14} className="text-pink-500" /> Alertes Analytics
                    </h3>
                    <div className="space-y-4">
                      {analysis.alerts.map((art, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm font-bold truncate">{art.title}</p>
                            <p className="text-xs text-slate-500">{art.views} vues | {art.engagement}s engagement</p>
                          </div>
                          <span className="text-lg">{art.signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl text-center">
                  <p className="text-blue-700 font-medium">Analyse tes fichiers CSV pour voir tes revenus et tes alertes réelles ici.</p>
                </div>
              )}

              {/* Priorities */}
              <section>
                <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-2">🎯 {analysis ? 'Priorités du jour' : 'Exemples de thèmes (Piliers)'}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(analysis?.priorities || [
                    { pillar: '1', title: "[Sujet Pilier 1 : Aesthetic Home Screen]", angle: "Exemple : 30 idées d'écran d'accueil pour la saison actuelle.", why: "Analyse tes stats pour voir les tendances réelles.", amazon: "", pinSearch: "iPhone Home Screen Aesthetic" },
                    { pillar: '2', title: "[Sujet Pilier 2 : Coques & Accessoires]", angle: "Exemple : Les plus belles coques tendance du moment.", why: "Analyse tes stats pour voir les modèles les plus rentables.", amazon: "Coques aesthetic", pinSearch: "iPhone Case Aesthetic Trend" }
                  ]).map((p, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col">
                      <div className="p-6 flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">Pilier {p.pillar}</span>
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            <Search size={12} /> {p.pinSearch}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                        <p className="text-slate-600 text-sm mb-4">{p.angle}</p>
                        
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Étape 1 : Copie ce mot-clé sur Pinterest</p>
                          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                            <code className="text-pink-600 font-bold">{p.pinSearch}</code>
                            <button onClick={() => copyToClipboard(p.pinSearch)} className="text-slate-400 hover:text-pink-500 transition-colors"><Copy size={16} /></button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm"><Zap size={16} className="text-pink-500 mt-0.5 shrink-0" /><p><span className="font-bold">Pourquoi :</span> {p.why}</p></div>
                          {p.amazon && <div className="flex items-start gap-2 text-sm"><ShoppingBag size={16} className="text-blue-500 mt-0.5 shrink-0" /><p><span className="font-bold">Amazon :</span> {p.amazon}</p></div>}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                        <button 
                          onClick={() => pinMetricsInputRef.current?.click()}
                          className={`flex-1 mr-4 py-3 rounded-xl border-2 border-dashed font-bold text-sm transition-all flex items-center justify-center gap-2 ${pinMetricsData ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:border-pink-300 hover:text-pink-600'}`}
                        >
                          {pinMetricsData ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                          {pinMetricsData ? 'JSON PinMetrics chargé ✓' : 'Étape 2 : Glisse le JSON PinMetrics ici'}
                        </button>
                        <input type="file" ref={pinMetricsInputRef} className="hidden" accept=".json" onChange={(e) => handleFileChange('pinMetrics', e.target.files?.[0])} />
                        
                        <button 
                          onClick={() => startWriting(p)} 
                          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${pinMetricsData ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          <Sparkles size={18} /> Rédiger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bonus & Recyclage - Only show if analysis exists */}
              {analysis && (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
                      <Sparkles size={14} className="text-pink-500" /> Suggestions Bonus
                    </h3>
                    <div className="space-y-4">
                      {analysis.bonus.map((b, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl">
                          <p className="font-bold text-sm mb-1">{b.title}</p>
                          <p className="text-xs text-slate-600">{b.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
                      <Repeat size={14} className="text-blue-500" /> Recyclage en.astucieusement.com
                    </h3>
                    <div className="space-y-4">
                      {analysis.recyclage?.map((r, i) => (
                        <div key={i} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-500 font-bold mb-1">Original: {r.original}</p>
                          <p className="text-sm font-bold text-slate-800">Angle EN: {r.englishAngle}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {step === 'writing' && (
            <motion.div key="writing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-20 text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-pink-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-pink-500">{writingProgress}%</div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Rédaction en cours...</h2>
              <p className="text-slate-500 italic">"Génération du contenu SEO et optimisation RankMath..."</p>
            </motion.div>
          )}

          {step === 'article' && (
            <motion.div key="article" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setStep('dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium"><ChevronLeft size={20} /> Dashboard</button>
                <button onClick={() => copyToClipboard(generatedArticle)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg"><Copy size={18} /> Copier le code HTML</button>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 bg-slate-50 border-b border-slate-100"><h2 className="text-3xl font-bold tracking-tight mb-2">{selectedPriority?.title}</h2><p className="text-slate-500">Prêt pour WordPress</p></div>
                <div className="p-8"><pre className="whitespace-pre-wrap font-mono text-sm bg-slate-900 text-slate-300 p-6 rounded-xl overflow-x-auto">{generatedArticle}</pre></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfig(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2"><Key className="text-pink-500" size={20} /> Configuration API</h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-600 mb-4">Entre ta clé API Gemini pour activer l'analyse.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Clé API Gemini</label>
                    <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all font-mono text-sm" />
                  </div>
                  <button onClick={() => saveApiKey(apiKey)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

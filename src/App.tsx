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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { GoogleGenAI } from "@google/genai";

// Types
interface ArticleStat {
  title: string;
  views: number;
  engagement: number;
  revenue?: number;
  rpm?: number;
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
}

export default function App() {
  const [step, setStep] = useState<'welcome' | 'export_reminder' | 'dashboard' | 'writing' | 'article'>('welcome');
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [files, setFiles] = useState<{ analytics?: File, adsense?: File }>({});
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<any>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string>('');
  const [writingProgress, setWritingProgress] = useState(0);

  const analyticsInputRef = useRef<HTMLInputElement>(null);
  const adsenseInputRef = useRef<HTMLInputElement>(null);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowConfig(false);
  };

  const handleFileChange = (type: 'analytics' | 'adsense', file: File | undefined) => {
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
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
      
      const prompt = `
        Tu es l'assistant expert pour tutoriel-iphone.fr (blog iPhone Aesthetic & Lifestyle).
        Analyse ces données (Analytics et AdSense) et génère un briefing structuré en JSON STRICT.
        
        Données Analytics (extraits) : ${JSON.stringify(analyticsData.slice(0, 30))}
        Données AdSense (extraits) : ${JSON.stringify(adsenseData.slice(0, 30))}
        
        Règles d'analyse :
        1. Identifie le dernier article publié.
        2. Repère les articles à fort RPM ou fort trafic premium (US/CA/BE).
        3. Propose 2 priorités de rédaction basées sur les 6 piliers (1: Home Screen, 2: Coques, 3: Wallpapers, 4: Tips, 5: Gift Guides, 6: Photography).
        
        Format JSON attendu :
        {
          "status": { "lastArticle": "Titre", "pillar": "Nom du pilier", "daysAgo": "X jours", "status": "ok" },
          "alerts": [{ "title": "Titre", "views": 1234, "engagement": 45, "signal": "⏱️" }],
          "topArticles": [{ "title": "Titre", "revenue": 12.5, "rpm": 4.2, "signal": "🌍" }],
          "priorities": [
            { "pillar": "1", "title": "Titre suggéré", "angle": "Angle éditorial", "why": "Raison stratégique", "amazon": "Produits Amazon", "pinSearch": "Recherche Pinterest" }
          ],
          "bonus": [{ "title": "Tendance", "content": "Détails" }]
        }
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
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
      const model = "gemini-3.1-pro-preview";
      
      setWritingProgress(30);
      const prompt = `
        Rédige un article complet de 1500 mots minimum pour tutoriel-iphone.fr.
        Sujet : ${priority.title}
        Pilier : ${priority.pillar}
        Angle : ${priority.angle}
        
        Règles de rédaction :
        - HTML propre (H2, H3, P, UL, LI).
        - Ton chaleureux, féminin, direct.
        - Optimisation RankMath (mot-clé principal, densité 1-2%).
        - Tag Amazon : tutorieiphone-21.
        - Utilise des placeholders d'images Pinterest avec le style : <figure style="margin: 1.5em auto; text-align: center;"><img src="https://i.pinimg.com/736x/..." alt="Description" width="736" style="display:block; margin: 0 auto; max-width:100%; border-radius:12px;" /></figure>
        
        Structure de réponse :
        📊 RANK MATH CONFIG
        Mot-clé : ...
        Titre SEO : ...
        Meta : ...
        
        📝 Article WordPress
        [Le code HTML complet]
      `;

      setWritingProgress(60);
      const response = await genAI.models.generateContent({
        model,
        contents: prompt
      });

      setGeneratedArticle(response.text || '');
      setWritingProgress(100);
      setTimeout(() => setStep('article'), 500);
    } catch (error) {
      console.error("Writing failed:", error);
      alert("La rédaction a échoué.");
      setStep('dashboard');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papier !");
  };

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
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Clock className="text-pink-500" /> Importe tes fichiers CSV :</h2>
                
                <div className="space-y-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><BarChart3 size={18} className="text-blue-500" /> Google Analytics :</h3>
                    <button onClick={() => analyticsInputRef.current?.click()} className={`w-full py-4 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${files.analytics ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                      {files.analytics ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                      <span className="text-sm font-bold">{files.analytics ? files.analytics.name : "Sélectionner Analytics.csv"}</span>
                    </button>
                    <input type="file" ref={analyticsInputRef} className="hidden" accept=".csv" onChange={(e) => handleFileChange('analytics', e.target.files?.[0])} />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-green-500" /> AdSense — Rapport Claude :</h3>
                    <button onClick={() => adsenseInputRef.current?.click()} className={`w-full py-4 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${files.adsense ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:border-green-300'}`}>
                      {files.adsense ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                      <span className="text-sm font-bold">{files.adsense ? files.adsense.name : "Sélectionner rapport-claude.csv"}</span>
                    </button>
                    <input type="file" ref={adsenseInputRef} className="hidden" accept=".csv" onChange={(e) => handleFileChange('adsense', e.target.files?.[0])} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <button 
                    onClick={runAnalysis}
                    disabled={loading || (!files.analytics && !files.adsense)}
                    className={`px-8 py-4 rounded-xl font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2 ${loading || (!files.analytics && !files.adsense) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'}`}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <BarChart3 size={20} />}
                    Lancer l'analyse
                  </button>
                  <button onClick={() => setStep('dashboard')} className="text-slate-500 text-sm font-medium hover:text-slate-900">Skip (démo)</button>
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
                      <p className="text-2xl font-bold">{analysis?.status.status === 'ok' ? '✅ OK' : '⚠️ RETARD'}</p>
                      <p className="text-sm text-slate-500">{analysis?.status.daysAgo || 'Cadence respectée'}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${analysis?.status.status === 'ok' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}><CheckCircle2 /></div>
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

              {/* Priorities */}
              <section>
                <h2 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-2">🎯 Priorités du jour</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(analysis?.priorities || [
                    { pillar: '1', title: "30 idées d'écran d'accueil iPhone aesthetic printemps 2026", angle: "Couleurs pastel, widgets floraux et icônes minimalistes.", why: "Fort volume Pinterest détecté sur les trends 'Spring Home Screen'.", amazon: "Packs d'icônes, supports iPhone aesthetic.", pinSearch: "Spring iPhone Home Screen Aesthetic" },
                    { pillar: '2', title: "Les 15 plus belles coques iPhone 16 tendance 2026", angle: "Sélection premium de coques MagSafe et crossbody.", why: "Niche à fort CPC et intention d'achat élevée.", amazon: "Coques Elago, Spigen, et marques indépendantes.", pinSearch: "iPhone 16 Case Aesthetic Trend" }
                  ]).map((p, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col">
                      <div className="p-6 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">Pilier {p.pillar}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                        <p className="text-slate-600 text-sm mb-4">{p.angle}</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 text-sm"><AlertCircle size={16} className="text-pink-500 mt-0.5 shrink-0" /><p><span className="font-bold">Pourquoi :</span> {p.why}</p></div>
                          <div className="flex items-start gap-2 text-sm"><ShoppingBag size={16} className="text-blue-500 mt-0.5 shrink-0" /><p><span className="font-bold">Amazon :</span> {p.amazon}</p></div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Search size={14} /> {p.pinSearch}</div>
                        <button onClick={() => startWriting(p)} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                          <Sparkles size={16} /> Rédiger l'article
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
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

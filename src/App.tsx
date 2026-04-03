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
  Search,
  Plus,
  Settings,
  Key,
  X,
  ChevronLeft,
  Copy,
  Sparkles,
  Loader2,
  RefreshCw,
  Globe,
  Zap,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Database,
  Cpu,
  Layers,
  Terminal,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  DollarSign,
  MousePointer2,
  PieChart,
  Activity,
  Menu,
  User,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { GoogleGenAI } from "@google/genai";

// --- Constants & Prompts ---
const ANALYSIS_PROMPT = `Tu es un expert SEO et analyste de revenus publicitaires (AdSense). Analyse ces données CSV.
Identifie les 5 opportunités prioritaires pour maximiser les revenus et le trafic.
Considère :
1. Les pages avec beaucoup d'impressions mais peu de clics (SEO).
2. Les pages avec beaucoup de trafic mais peu de revenus (Optimisation AdSense).
3. Les mots-clés émergents.

Pour chaque opportunité, fournis :
1. Un titre d'article stratégique.
2. La raison (basée sur les chiffres fournis).
3. Une stratégie de contenu (ce qu'il faut écrire).
4. Le mot-clé principal.
5. Le type de donnée analysée (SEO ou AdSense).

Réponds UNIQUEMENT au format JSON :
[
  { "title": "...", "reason": "...", "strategy": "...", "keyword": "...", "priority": "High/Medium", "type": "SEO/AdSense" }
]`;

const WRITING_PROMPT = (title: string, keyword: string) => `Tu es un rédacteur SEO expert pour tutoriel-iphone.fr.
Rédige un article ultra-complet, structuré et optimisé pour le mot-clé : "${keyword}".
Le titre est : "${title}".

Instructions strictes :
1. Ton : Expert, professionnel, pédagogique.
2. Structure : Introduction, Sommaire, H2, H3, Conclusion.
3. Optimisation RankMath : Mot-clé dans le premier paragraphe, les titres, et naturellement dans le texte.
4. Format : HTML pur (prêt pour WordPress).
5. Ajoute des astuces exclusives.
6. Longueur : Minimum 1200 mots.

Réponds UNIQUEMENT avec le code HTML.`;

// --- Types ---
interface DataRow {
  query?: string;
  page?: string;
  clicks?: number;
  impressions?: number;
  ctr?: string;
  position?: number;
  revenue?: number;
  adRequests?: number;
  rpm?: number;
}

interface Opportunity {
  title: string;
  reason: string;
  strategy: string;
  keyword: string;
  priority: 'High' | 'Medium';
  type: 'SEO' | 'AdSense';
}

export default function App() {
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!sessionStorage.getItem('app_authenticated'));
  const [isProtected, setIsProtected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [showConfig, setShowConfig] = useState(false);
  
  const [csvData, setCsvData] = useState<DataRow[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string>('');
  const [isWriting, setIsWriting] = useState(false);
  const [step, setStep] = useState<'dashboard' | 'analysis' | 'writing' | 'article'>('dashboard');
  const [dataType, setDataType] = useState<'SEO' | 'AdSense' | 'Mixed'>('Mixed');

  // --- Auth Logic ---
  const checkAuthStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/auth-status');
      const data = await res.json();
      setIsProtected(data.isProtected);
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('app_authenticated', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || "Accès refusé");
      }
    } catch (error) {
      setLoginError("Erreur de connexion au serveur");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- AI Logic ---
  const saveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowConfig(false);
  };

  const analyzeData = async (data: DataRow[]) => {
    if (!apiKey) {
      setShowConfig(true);
      return;
    }
    setIsAnalyzing(true);
    setStep('analysis');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: ANALYSIS_PROMPT + "\n\nDonnées CSV :\n" + JSON.stringify(data.slice(0, 50)),
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '[]');
      setOpportunities(result);
      setStep('dashboard');
    } catch (error) {
      console.error("Analysis failed", error);
      alert("L'analyse a échoué. Vérifie ta clé API.");
      setStep('dashboard');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const writeArticle = async (opp: Opportunity) => {
    if (!apiKey) {
      setShowConfig(true);
      return;
    }
    setIsWriting(true);
    setStep('writing');
    setSelectedOpportunity(opp);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: WRITING_PROMPT(opp.title, opp.keyword),
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setGeneratedArticle(response.text || '');
      setStep('article');
    } catch (error) {
      console.error("Writing failed", error);
      alert("La rédaction a échoué. Vérifie ta clé API.");
      setStep('dashboard');
    } finally {
      setIsWriting(false);
    }
  };

  // --- File Handling ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mappedData = results.data.map((row: any) => {
          // Détection AdSense
          const isAdSense = row['Page'] || row['Estimated earnings'] || row['Revenue'];
          if (isAdSense) {
            setDataType('AdSense');
            return {
              page: row['Page'] || row['URL'],
              revenue: row['Estimated earnings'] || row['Revenue'] || row['Revenus'],
              adRequests: row['Ad requests'] || row['Requêtes d\'annonce'],
              rpm: row['Ad request RPM'] || row['RPM des requêtes d\'annonce'],
              clicks: row['Clicks'] || row['Clics']
            };
          }
          // Détection Search Console
          setDataType('SEO');
          return {
            query: row['Query'] || row['Requête'] || row['keyword'],
            clicks: row['Clicks'] || row['Clics'] || 0,
            impressions: row['Impressions'] || 0,
            ctr: row['CTR'] || '0%',
            position: row['Position'] || 0
          };
        }).filter(item => (item as any).query || (item as any).page);
        
        setCsvData(mappedData as DataRow[]);
        analyzeData(mappedData as DataRow[]);
      }
    });
  };

  // --- Render Helpers ---
  if (isProtected && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-violet-100/40 via-transparent to-transparent pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="modern-card w-full max-w-md p-10 relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
              <Lock className="text-white" size={32} />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">Editorial SaaS</h1>
          <p className="text-slate-500 text-center mb-10">Connectez-vous pour accéder à votre espace expert.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mot de passe système</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-4 rounded-2xl border border-red-100"
              >
                <AlertCircle size={18} />
                {loginError}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="btn-primary w-full py-4 text-lg"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : "Accéder au Dashboard"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 flex justify-center items-center gap-2 text-xs text-slate-400 font-medium">
            <Shield size={14} className="text-indigo-500" />
            Connexion sécurisée SSL 256-bit
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Zap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight gradient-text">Editorial SaaS</h1>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Expert Edition</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span>v3.0.0</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 mr-6">
              <button className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Dashboard</button>
              <button className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Analyses</button>
              <button className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Articles</button>
            </div>
            <button 
              onClick={() => setShowConfig(true)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
            >
              <Settings size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold border border-slate-200">
              AD
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 modern-card p-10 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:bg-indigo-100 transition-colors" />
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full mb-6">
                      <Sparkles size={14} />
                      IA Générative & Analyse de Données
                    </div>
                    <h2 className="text-5xl font-extrabold mb-6 tracking-tight leading-[1.1]">
                      Boostez vos revenus <br />
                      <span className="gradient-text">AdSense & SEO</span>
                    </h2>
                    <p className="text-lg text-slate-500 max-w-xl mb-10 leading-relaxed">
                      Importez vos exports **Search Console** ou **AdSense** pour identifier les pages à fort potentiel et générer des articles experts en un clic.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 relative z-10">
                    <label className="btn-primary cursor-pointer shadow-indigo-100">
                      <Upload size={20} />
                      Importer un CSV
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button className="btn-secondary">
                      <ExternalLink size={20} />
                      Voir la documentation
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="modern-card p-8 flex-1">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity size={16} className="text-indigo-500" />
                      Statut Système
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Moteur IA</span>
                        <span className="text-sm font-bold text-slate-900">Gemini 3.1 Pro</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Mode Analyse</span>
                        <span className="px-2 py-1 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-lg uppercase">{dataType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Clé API</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="text-sm font-bold">{apiKey ? 'Active' : 'Manquante'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="modern-card p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-indigo-200">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                      <DollarSign size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Optimisation AdSense</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                      L'IA détecte les pages avec un fort RPM mais peu de trafic pour maximiser vos gains.
                    </p>
                  </div>
                </div>
              </div>

              {/* Opportunities Grid */}
              {opportunities.length > 0 && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight">Opportunités détectées</h3>
                      <p className="text-slate-500 mt-1">Basé sur votre dernier import {dataType}.</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
                        {opportunities.length} Résultats
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {opportunities.map((opp, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="modern-card p-8 hover:translate-y-[-4px] group"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            opp.type === 'AdSense' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}>
                            {opp.type} Opportunity
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                            {opp.type === 'AdSense' ? <DollarSign size={20} /> : <TrendingUp size={20} />}
                          </div>
                        </div>
                        
                        <h4 className="text-xl font-bold mb-3 group-hover:text-indigo-600 transition-colors leading-snug">{opp.title}</h4>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">{opp.reason}</p>
                        
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                              <MousePointer2 size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Mot-clé cible</p>
                              <p className="text-sm font-bold text-slate-700">{opp.keyword}</p>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => writeArticle(opp)}
                          className="w-full btn-primary py-3.5"
                        >
                          Rédiger l'article
                          <ArrowRight size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="relative mb-10">
                <div className="w-32 h-32 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin shadow-xl shadow-indigo-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PieChart className="text-indigo-600" size={40} />
                </div>
              </div>
              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Analyse des données...</h2>
              <p className="text-slate-500 text-lg max-w-md text-center">
                Notre IA examine vos statistiques pour dénicher les meilleures opportunités de revenus.
              </p>
            </motion.div>
          )}

          {step === 'writing' && (
            <motion.div 
              key="writing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="relative mb-10">
                <div className="w-32 h-32 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin shadow-xl shadow-violet-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-violet-600" size={40} />
                </div>
              </div>
              <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Rédaction en cours</h2>
              <p className="text-slate-500 text-lg text-center max-w-lg leading-relaxed">
                Génération d'un article expert optimisé SEO pour <br />
                <span className="font-bold text-violet-600">"{selectedOpportunity?.keyword}"</span>
              </p>
            </motion.div>
          )}

          {step === 'article' && (
            <motion.div 
              key="article"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setStep('dashboard')}
                  className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
                >
                  <ChevronLeft size={22} />
                  Retour au Dashboard
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const blob = new Blob([generatedArticle], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `article-${selectedOpportunity?.keyword}.html`;
                      a.click();
                    }}
                    className="btn-secondary"
                  >
                    <Download size={20} />
                    Exporter HTML
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedArticle);
                      alert("Code HTML copié !");
                    }}
                    className="btn-primary"
                  >
                    <Copy size={20} />
                    Copier le code
                  </button>
                </div>
              </div>

              <div className="modern-card overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100 uppercase">SEO Optimized</span>
                    <span className="px-3 py-1 bg-violet-50 text-violet-600 text-xs font-bold rounded-full border border-violet-100 uppercase">Expert Draft</span>
                  </div>
                  <h2 className="text-5xl font-extrabold tracking-tight leading-tight text-slate-900">{selectedOpportunity?.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4">
                  <div className="lg:col-span-3 p-10 lg:p-14 border-r border-slate-100">
                    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: generatedArticle }} />
                  </div>
                  <div className="p-10 space-y-10 bg-slate-50/30">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Checklist RankMath</h4>
                      <div className="space-y-4">
                        {[
                          "Mot-clé dans le titre H1",
                          "Mot-clé dans l'intro",
                          "Densité optimale",
                          "Structure H2/H3",
                          "Longueur > 1200 mots",
                          "Sémantique riche"
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 size={12} />
                            </div>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 shadow-sm">
                      <h4 className="text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2">
                        <Sparkles size={16} />
                        Conseil Expert
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Ajoutez des captures d'écran réelles pour augmenter le temps passé sur la page et booster votre SEO.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowConfig(false)} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative modern-card w-full max-w-md overflow-hidden p-0"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-xl flex items-center gap-3">
                  <Settings className="text-indigo-600" size={24} /> 
                  Paramètres
                </h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sécurité</p>
                    <button 
                      onClick={checkAuthStatus}
                      className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      disabled={isChecking}
                    >
                      {isChecking ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Synchroniser
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isProtected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}></div>
                    <p className="text-sm font-bold text-slate-700">
                      {isProtected 
                        ? 'Protection par mot de passe ACTIVE' 
                        : 'Protection INACTIVE'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Clé API Gemini Pro</label>
                    <div className="relative">
                      <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        placeholder="AIzaSy..." 
                        className="input-field pl-14 font-mono text-sm" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => saveApiKey(apiKey)} 
                    className="btn-primary w-full py-4"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-10 border-t border-slate-200/60 text-center bg-white">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em]">
          © 2026 Editorial SaaS • Neural Content Engine
        </p>
      </footer>
    </div>
  );
}

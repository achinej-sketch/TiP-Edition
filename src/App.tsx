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
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { GoogleGenAI } from "@google/genai";

// --- Constants & Prompts ---
const ANALYSIS_PROMPT = `Tu es un expert SEO et analyste de données. Analyse ce fichier CSV de statistiques Search Console.
Identifie les 5 opportunités prioritaires pour un site de tutoriels iPhone.
Pour chaque opportunité, fournis :
1. Un titre accrocheur.
2. La raison (basée sur les clics, impressions, CTR ou position).
3. Une stratégie de contenu (ce qu'il faut écrire).
4. Le mot-clé principal à cibler.

Réponds UNIQUEMENT au format JSON :
[
  { "title": "...", "reason": "...", "strategy": "...", "keyword": "...", "priority": "High/Medium" }
]`;

const WRITING_PROMPT = (title: string, keyword: string) => `Tu es un rédacteur SEO expert pour tutoriel-iphone.fr.
Rédige un article ultra-complet et optimisé pour le mot-clé : "${keyword}".
Le titre de l'article est : "${title}".

Instructions strictes :
1. Utilise un ton professionnel, expert mais accessible.
2. Structure : Introduction captivante, Sommaire, H2, H3, Conclusion.
3. Optimisation RankMath : Inclure le mot-clé dans le premier paragraphe, les titres, et naturellement dans le texte.
4. Format : HTML pur (sans balises <html> ou <body>), prêt à être collé dans WordPress.
5. Ajoute des conseils d'expert exclusifs.
6. Longueur : Minimum 1200 mots.

Réponds UNIQUEMENT avec le code HTML.`;

// --- Types ---
interface ArticleStat {
  query: string;
  clicks: number;
  impressions: number;
  ctr: string;
  position: number;
}

interface Opportunity {
  title: string;
  reason: string;
  strategy: string;
  keyword: string;
  priority: 'High' | 'Medium';
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
  
  const [csvData, setCsvData] = useState<ArticleStat[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<string>('');
  const [isWriting, setIsWriting] = useState(false);
  const [step, setStep] = useState<'auth' | 'dashboard' | 'analysis' | 'writing' | 'article'>('dashboard');

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

  const analyzeData = async (data: ArticleStat[]) => {
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
      complete: (results) => {
        const mappedData = results.data.map((row: any) => ({
          query: row.Query || row.Requête || row.keyword,
          clicks: row.Clicks || row.Clics || 0,
          impressions: row.Impressions || 0,
          ctr: row.CTR || '0%',
          position: row.Position || 0
        })).filter(item => item.query);
        setCsvData(mappedData as ArticleStat[]);
        analyzeData(mappedData as ArticleStat[]);
      }
    });
  };

  // --- Render Helpers ---
  if (isProtected && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
              <Shield className="text-emerald-500" size={32} />
            </div>
          </div>

          <h1 className="text-3xl font-display font-bold text-center mb-2">Editorial Pro</h1>
          <p className="text-slate-400 text-center mb-8">Accès restreint aux experts éditoriaux</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Mot de passe système"
                className="pro-input pl-12 pr-12"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20"
              >
                <AlertCircle size={16} />
                {loginError}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="pro-button-primary w-full"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : "Déverrouiller le terminal"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            <span>v2.4.0-PRO</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              SYSTEM ONLINE
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-x-0 border-t-0 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Cpu className="text-slate-950" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">Editorial Pro</h1>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
                <span className="text-emerald-500">Expert Mode</span>
                <span className="opacity-30">|</span>
                <span>Search Console Integrated</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowConfig(true)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all"
            >
              <Settings size={20} />
            </button>
            <div className="h-8 w-px bg-slate-800 mx-2" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200">Admin Expert</p>
                <p className="text-[10px] text-slate-500">mt.duweb@gmail.com</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 p-0.5">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-bold">
                  AD
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero / Upload Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Database size={120} />
                  </div>
                  <div className="relative z-10">
                    <h2 className="text-4xl font-display font-bold mb-4 leading-tight">
                      Analysez vos données <br />
                      <span className="text-emerald-500">Search Console</span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-xl mb-8">
                      Importez vos statistiques d'exportation pour identifier les opportunités de croissance SEO et générer du contenu expert.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 relative z-10">
                    <label className="pro-button-primary cursor-pointer">
                      <Upload size={20} />
                      Importer un CSV
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button className="pro-button-secondary">
                      <Globe size={20} />
                      Analyse en direct
                    </button>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-3xl flex flex-col gap-6">
                  <h3 className="text-lg font-display font-bold flex items-center gap-2">
                    <Zap className="text-emerald-500" size={20} />
                    Stats Système
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Moteur IA</p>
                      <p className="text-sm font-bold text-emerald-500">Gemini 3.1 Pro</p>
                    </div>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Analyse SEO</p>
                      <p className="text-sm font-bold text-blue-400">Grounding Google Search</p>
                    </div>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Statut Clé API</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <p className="text-sm font-bold">{apiKey ? 'Connectée' : 'Manquante'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opportunities Grid */}
              {opportunities.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-display font-bold">Opportunités Prioritaires</h3>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                      {opportunities.length} Détectées
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {opportunities.map((opp, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card p-6 rounded-3xl hover:border-emerald-500/50 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            opp.priority === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {opp.priority} Priority
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                            <TrendingUp size={18} />
                          </div>
                        </div>
                        
                        <h4 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors">{opp.title}</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{opp.reason}</p>
                        
                        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 mb-6">
                          <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Mot-clé cible</p>
                          <p className="text-sm font-bold text-slate-300">{opp.keyword}</p>
                        </div>

                        <button 
                          onClick={() => writeArticle(opp)}
                          className="w-full pro-button-primary py-2.5 text-sm"
                        >
                          Rédiger l'article expert
                          <ArrowRight size={16} />
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
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Terminal className="text-emerald-500" size={32} />
                </div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">Analyse Neuronale en cours</h2>
              <p className="text-slate-500 font-mono animate-pulse">Extraction des patterns SEO... [0x44F2]</p>
            </motion.div>
          )}

          {step === 'writing' && (
            <motion.div 
              key="writing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-blue-500" size={32} />
                </div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4">Rédaction Expert</h2>
              <p className="text-slate-500 text-center max-w-md">
                Génération d'un contenu de 1200+ mots optimisé RankMath pour <br />
                <span className="text-blue-400 font-bold">"{selectedOpportunity?.keyword}"</span>
              </p>
            </motion.div>
          )}

          {step === 'article' && (
            <motion.div 
              key="article"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setStep('dashboard')}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-200 font-medium transition-colors"
                >
                  <ChevronLeft size={20} />
                  Retour au Dashboard
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const blob = new Blob([generatedArticle], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `article-${selectedOpportunity?.keyword}.html`;
                      a.click();
                    }}
                    className="pro-button-secondary py-2 px-4 text-sm"
                  >
                    <Download size={18} />
                    Exporter .html
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedArticle);
                      alert("Code HTML copié !");
                    }}
                    className="pro-button-primary py-2 px-4 text-sm"
                  >
                    <Copy size={18} />
                    Copier le code
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-slate-800 bg-slate-900/30">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded border border-emerald-500/20 uppercase">SEO Optimized</span>
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20 uppercase">Expert Draft</span>
                  </div>
                  <h2 className="text-4xl font-display font-bold">{selectedOpportunity?.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3">
                  <div className="lg:col-span-2 p-8 border-r border-slate-800">
                    <div className="prose prose-invert max-w-none markdown-body" dangerouslySetInnerHTML={{ __html: generatedArticle }} />
                  </div>
                  <div className="p-8 space-y-8 bg-slate-950/30">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Checklist RankMath</h4>
                      <div className="space-y-3">
                        {[
                          "Mot-clé dans le titre H1",
                          "Mot-clé dans le premier paragraphe",
                          "Densité de mot-clé optimale",
                          "Structure H2/H3 respectée",
                          "Longueur de contenu (>1200 mots)",
                          "Optimisation pour la recherche sémantique"
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <h4 className="text-sm font-bold text-emerald-500 mb-2">Conseil Pro</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        N'oubliez pas d'ajouter des liens internes vers vos articles iPhone existants pour renforcer le maillage interne.
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
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative glass-card rounded-3xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Settings className="text-emerald-500" size={20} /> 
                  Configuration Système
                </h3>
                <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sécurité</p>
                    <button 
                      onClick={checkAuthStatus}
                      className="text-[10px] text-emerald-500 font-bold hover:underline flex items-center gap-1"
                      disabled={isChecking}
                    >
                      {isChecking ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                      Sync
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isProtected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                    <p className="text-xs font-medium">
                      {isProtected 
                        ? 'Protection Mot de Passe ACTIVE' 
                        : 'Protection INACTIVE (VITE_APP_PASSWORD)'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Clé API Gemini Pro</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        placeholder="AIzaSy..." 
                        className="pro-input pl-12 text-sm font-mono" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => saveApiKey(apiKey)} 
                    className="pro-button-primary w-full"
                  >
                    Mettre à jour les paramètres
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-6 border-t border-slate-900 text-center">
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em]">
          © 2026 Editorial Pro • Advanced Neural Editorial Interface
        </p>
      </footer>
    </div>
  );
}

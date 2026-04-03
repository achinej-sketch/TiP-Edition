/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types for the dashboard
interface ArticleStat {
  title: string;
  views: number;
  engagement: number;
  revenue?: number;
  rpm?: number;
  country?: string;
  signal?: string;
}

interface Pillar {
  id: number;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PILLARS: Pillar[] = [
  { id: 1, name: 'Aesthetic Home Screen', icon: <Layout className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700' },
  { id: 2, name: 'Coques & Accessoires', icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700' },
  { id: 3, name: 'Wallpapers', icon: <ImageIcon className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  { id: 4, name: 'iPhone Tips Lifestyle', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-green-100 text-green-700' },
  { id: 5, name: 'Gift Guides & Shopping', icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
  { id: 6, name: 'iPhone Photography', icon: <ImageIcon className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700' },
];

export default function App() {
  const [step, setStep] = useState<'welcome' | 'export_reminder' | 'upload' | 'dashboard'>('welcome');
  const [loading, setLoading] = useState(false);

  const startProcess = () => {
    setStep('export_reminder');
  };

  const skipStats = () => {
    setLoading(true);
    setTimeout(() => {
      setStep('dashboard');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="font-bold text-lg tracking-tight">tutoriel-iphone.fr <span className="text-slate-400 font-normal">Assistant</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase tracking-wider">Avril 2026</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center py-12"
            >
              <div className="mb-6 inline-flex p-4 bg-pink-50 rounded-full text-pink-500">
                <BarChart3 size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Prêt pour le briefing éditorial ?</h2>
              <p className="text-slate-600 mb-8 text-lg">
                Je vais analyser vos stats AdSense et Analytics pour identifier les meilleures opportunités de croissance.
              </p>
              <button 
                onClick={startProcess}
                className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-slate-200"
              >
                Fais le point <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'export_reminder' && (
            <motion.div 
              key="reminder"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="text-pink-500" /> Avant de continuer, exporte tes stats en 5 minutes :
                </h2>
                
                <div className="space-y-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                      <BarChart3 size={18} className="text-blue-500" /> 📊 Google Analytics :
                    </h3>
                    <p className="text-sm text-slate-600">
                      analytics.google.com → sélectionne la propriété tutoriel-iphone.fr → Rapports → Engagement → Pages et écrans → 28 derniers jours → Exporter → CSV
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                      <TrendingUp size={18} className="text-green-500" /> 📈 Google AdSense — Rapport Claude :
                    </h3>
                    <p className="text-sm text-slate-600">
                      adsense.google.com → Rapports → Créer un rapport → Dimensions : URL de la page + Date + Pays → Métriques : Revenus estimés, Pages vues, RPM pages, Impressions, RPM impressions, Visibles avec Active View, Clics → 28 derniers jours → Exporter → CSV
                    </p>
                    <p className="text-xs mt-2 text-pink-600 font-medium">⚠️ Appelle ce fichier "rapport Claude" avant de le glisser ici.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-pink-300 hover:bg-pink-50 transition-all cursor-pointer group">
                    <Upload className="mb-2 group-hover:text-pink-500" />
                    <span className="text-sm font-medium">Glisse les 2 fichiers ici</span>
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    <button 
                      onClick={() => setStep('dashboard')}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                      J'ai fini l'upload
                    </button>
                    <button 
                      onClick={skipStats}
                      className="text-slate-500 text-sm font-medium hover:text-slate-900"
                    >
                      Skip (continuer sans stats)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Status Section */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">État du blog</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">✅ OK</p>
                      <p className="text-sm text-slate-500">Cadence respectée</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                      <CheckCircle2 />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Dernier article</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold truncate max-w-[180px]">Coques iPhone 16</p>
                      <p className="text-sm text-slate-500">Il y a 2 jours</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                      <FileText />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">CPC Moyen</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">€0,09</p>
                      <p className="text-sm text-slate-500">Objectif: €0,15</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                      <TrendingUp />
                    </div>
                  </div>
                </div>
              </section>

              {/* Priorities Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">🎯 Priorités du jour</h2>
                  <button className="text-pink-500 text-sm font-bold flex items-center gap-1 hover:underline">
                    Voir tout le sitemap <ExternalLink size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Priority 1 */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col">
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <Layout size={12} /> Pilier 1
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          Haute priorité
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-3">30 idées d'écran d'accueil iPhone aesthetic printemps 2026</h3>
                      <p className="text-slate-600 text-sm mb-4">
                        Angle : Couleurs pastel, widgets floraux et icônes minimalistes. Parfait pour capter la tendance saisonnière Pinterest.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <AlertCircle size={16} className="text-pink-500 mt-0.5 shrink-0" />
                          <p><span className="font-bold">Pourquoi :</span> Fort volume Pinterest détecté sur les trends "Spring Home Screen".</p>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <ShoppingBag size={16} className="text-blue-500 mt-0.5 shrink-0" />
                          <p><span className="font-bold">Amazon :</span> Packs d'icônes, supports iPhone aesthetic.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <ImageIcon size={14} /> 📎 PinMetrics JSON requis
                      </div>
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">
                        Rédiger l'article
                      </button>
                    </div>
                  </div>

                  {/* Priority 2 */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col">
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <ShoppingBag size={12} /> Pilier 2
                        </span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          Amazon Associates ✅
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-3">Les 15 plus belles coques iPhone 16 tendance 2026</h3>
                      <p className="text-slate-600 text-sm mb-4">
                        Angle : Sélection premium de coques MagSafe et crossbody. Focus sur le design "Aesthetic" et la protection.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <AlertCircle size={16} className="text-pink-500 mt-0.5 shrink-0" />
                          <p><span className="font-bold">Pourquoi :</span> Niche à fort CPC et intention d'achat élevée.</p>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <ShoppingBag size={16} className="text-blue-500 mt-0.5 shrink-0" />
                          <p><span className="font-bold">Amazon :</span> Coques Elago, Spigen, et marques indépendantes.</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <ImageIcon size={14} /> 📎 PinMetrics JSON requis
                      </div>
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">
                        Rédiger l'article
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bonus Suggestions */}
              <section className="bg-pink-50 rounded-3xl p-8 border border-pink-100">
                <h3 className="text-pink-900 font-bold text-xl mb-4 flex items-center gap-2">
                  <TrendingUp /> Suggestions Bonus
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <p className="font-bold text-pink-900 mb-1">🌍 Signal pays premium</p>
                    <p className="text-sm text-slate-600">L'article "Wallpapers iOS 26" cartonne au Canada. Dupliquez le format pour les "Dynamic Island Wallpapers".</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <p className="font-bold text-pink-900 mb-1">♻️ Recyclage vers en.astucieusement.com</p>
                    <p className="text-sm text-slate-600">L'article "iPhone Photography Tips" est prêt pour une adaptation US avec un RPM x4 estimé.</p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Quick Actions */}
      <footer className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button className="w-14 h-14 bg-pink-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-pink-600 transition-all group relative">
          <Plus />
          <span className="absolute right-16 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Nouvel article</span>
        </button>
        <button className="w-14 h-14 bg-white text-slate-900 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all border border-slate-200 group relative">
          <Search />
          <span className="absolute right-16 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Recherche Pinterest</span>
        </button>
      </footer>
    </div>
  );
}

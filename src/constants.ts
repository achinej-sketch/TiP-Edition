/**
 * Editorial Guidelines and Prompts for tutoriel-iphone.fr
 */

export const EDITORIAL_GUIDELINES = `
🎯 Identité du projet — tutoriel-iphone.fr
Blog iPhone Aesthetic & Lifestyle — français (avec épingles Pinterest 50% FR / 50% EN).
Positionnement : "L'iPhone aesthetic, les coques tendance et les wallpapers que tu vas adorer"
Public cible : femmes 18-35 ans, audience Pinterest premium.

🏗️ Les 6 piliers éditoriaux :
1. 🎨 Aesthetic Home Screen : Setups, widgets, icônes, Widgetsmith, Color Widgets.
2. 📱 Coques & Accessoires Tendance : Sélections de coques (MagSafe, crossbody, Y2K), accessoires stylés. (Amazon Associates ✅)
3. 🖼️ Wallpapers : Collections thématiques (saisonniers, Dynamic Island, iOS Liquid Glass).
4. ⚡ iPhone Tips Lifestyle : Astuces pour rendre l'iPhone plus beau/organisé/zen. (PAS de dépannage technique)
5. 🛍️ Gift Guides & Shopping iPhone : Guides cadeaux saisonniers, tops produits. (Amazon Associates ✅)
6. 📸 iPhone Photography & Aesthetic : Presets, compositions, apps d'édition.

💰 Niches à fort CPC : Accessoires tech, Coques tendance, Photography apps, Productivity apps, Gift guides tech.

✍️ Règles de rédaction & optimisation RankMath :
- 1500 mots minimum.
- 4-6 H2 avec variations du mot-clé principal.
- Ton chaleureux, féminin et direct.
- Tag Amazon : tutorieiphone-21.
- Liens internes : https://tutoriel-iphone.fr/?q=[mot-clé]
- Optimisation RankMath : Mot-clé dans titre SEO, intro, H2, meta, slug. Densité 1-2%.
- Images Pinterest : <figure style="margin: 1.5em auto; text-align: center;"><img src="https://i.pinimg.com/736x/..." alt="[alt]" width="736" style="display:block; margin: 0 auto; max-width:100%; border-radius:12px;" /></figure>
`;

export const ANALYSIS_PROMPT = (analyticsData: string, adsenseData: string) => `
Tu es l'assistant expert pour tutoriel-iphone.fr. 
Analyse ces données et génère un briefing structuré en JSON STRICT.

CONTEXTE :
${EDITORIAL_GUIDELINES}

DONNÉES :
Analytics : ${analyticsData}
AdSense (Rapport Claude) : ${adsenseData}

RÈGLES D'ANALYSE :
1. Calcule le RPM moyen par pays. Signale si RPM US/CA/BE > 2x France.
2. Identifie les articles à fort engagement (>45s) à dupliquer.
3. Propose 3-4 priorités de rédaction basées STRICTEMENT sur les 6 piliers.
4. Pour chaque priorité, évalue le potentiel Amazon Associates.

FORMAT JSON ATTENDU :
{
  "status": { "lastArticle": "Titre", "pillar": "Nom", "daysAgo": "X jours", "status": "ok" | "retard" },
  "alerts": [{ "title": "Titre", "views": 123, "engagement": 45, "signal": "⏱️" | "⚡" | "🚫" }],
  "topArticles": [{ "title": "Titre", "revenue": 10, "rpmFrance": 5, "rpmPremium": 15, "signal": "🌍" | "💰" | "🇺🇸" }],
  "priorities": [
    { "pillar": "1-6", "title": "Titre", "angle": "Angle", "why": "Raison", "amazon": "Produits", "pinSearch": "Recherche" }
  ],
  "bonus": [{ "title": "Tendance", "content": "Détails" }],
  "recyclage": [{ "original": "Titre", "englishAngle": "Angle" }]
}
`;

export const WRITING_PROMPT = (priority: any) => `
Rédige un article complet de 1500 mots minimum pour tutoriel-iphone.fr.

SUJET : ${priority.title}
PILIER : ${priority.pillar}
ANGLE : ${priority.angle}

${EDITORIAL_GUIDELINES}

FORMAT DE RÉPONSE ATTENDU :
📊 RANK MATH CONFIG
Mot-clé principal : [mot-clé]
Titre SEO (60-65 car) : [titre]
Meta description (140-155 car) : [description]
Slug : [slug]
Balise alt image à la une : [alt text]

📝 Article WordPress
html
<!-- SLUG: ... -->
<!-- META: ... -->
<!-- Image à la une : [nom fichier WP] | alt="[alt text]" -->
[Article complet en HTML propre avec H2, H3, P, UL, LI, strong, em, hr]

### 🛒 Produits Amazon à valider
| # | Produit suggéré | Recherche Amazon suggérée | ASIN à confirmer |
|---|---|---|---|
| 1 | [produit] | [recherche] | ⏳ à valider |

### 📌 Ligne CSV Pinterest
"[Titre pin FR]","[URL image]","Tutoriel iPhone","[Description]","[URL_A_REMPLACER]"
"[Titre pin EN]","[URL image]","Tutoriel iPhone","[Description EN]","[URL_A_REMPLACER]"

🖼️ Prompt image à la une
Génère une image au format Pinterest vertical (ratio 2:3, 1000x1500px)... [Prompt détaillé comme demandé]
`;

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API de vérification du mot de passe
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    const correctPassword = process.env.VITE_APP_PASSWORD;

    if (!correctPassword) {
      // Si aucun mot de passe n'est configuré, on laisse passer (pour éviter de bloquer l'utilisateur)
      return res.json({ success: true, message: "No password protection configured" });
    }

    if (password === correctPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Mot de passe incorrect" });
    }
  });

  // API pour vérifier si le mot de passe est configuré
  app.get("/api/auth-status", (req, res) => {
    const pass = process.env.VITE_APP_PASSWORD;
    console.log("Vérification du mot de passe dans l'environnement...");
    console.log("Variable VITE_APP_PASSWORD trouvée ?", !!pass);
    
    res.json({ 
      isProtected: !!pass,
      debug: process.env.NODE_ENV === 'development' ? {
        hasPass: !!pass,
        envKeys: Object.keys(process.env).filter(k => k.startsWith('VITE_'))
      } : {}
    });
  });

  // API: Fetch Sitemap
  app.post("/api/fetch-sitemap", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL manquante" });

    try {
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (EditorialSaaS/1.0)' }
      });
      const parser = new XMLParser();
      const jsonObj = parser.parse(response.data);
      
      let urls: string[] = [];
      
      // Handle sitemapindex
      if (jsonObj.sitemapindex && jsonObj.sitemapindex.sitemap) {
        const sitemaps = Array.isArray(jsonObj.sitemapindex.sitemap) 
          ? jsonObj.sitemapindex.sitemap 
          : [jsonObj.sitemapindex.sitemap];
        
        // Just return the list of sitemaps for now, or we could fetch them all
        // For simplicity, let's return the locations
        urls = sitemaps.map((s: any) => s.loc);
        return res.json({ success: true, type: 'index', urls: urls.slice(0, 500) });
      }

      // Handle urlset
      if (jsonObj.urlset && jsonObj.urlset.url) {
        const entries = Array.isArray(jsonObj.urlset.url) 
          ? jsonObj.urlset.url 
          : [jsonObj.urlset.url];
        urls = entries.map((e: any) => e.loc);
        return res.json({ success: true, type: 'urlset', urls: urls.slice(0, 1000) });
      }

      res.json({ success: true, urls: [] });
    } catch (error) {
      console.error("Sitemap fetch error:", error);
      res.status(500).json({ error: "Impossible de lire le sitemap. Vérifiez l'URL." });
    }
  });

  // Vite middleware pour le développement
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

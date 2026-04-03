import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

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
    res.json({ isProtected: !!process.env.VITE_APP_PASSWORD });
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

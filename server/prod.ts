import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
import { registerRoutes } from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes first
const server = await registerRoutes(app);

// Serve static files from the Vite build output directory
app.use(express.static(path.join(__dirname, '../dist/public'), {
  index: false
}));

// Handle SPA fallback - return index.html for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

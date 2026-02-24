
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

// Storage path
const DATA_DIR = path.join(process.cwd(), "data");
const OPS_FILE = path.join(DATA_DIR, "operatives.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CATALOGS_FILE = path.join(DATA_DIR, "catalogs.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper to read/write data
const readData = (file: string, defaultVal: any) => {
  if (!fs.existsSync(file)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    return defaultVal;
  }
};

const writeData = (file: string, data: any) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // API Routes
  app.get("/api/operatives", (req, res) => {
    const ops = readData(OPS_FILE, []);
    res.json(ops);
  });

  app.post("/api/operatives", (req, res) => {
    const op = req.body;
    const ops = readData(OPS_FILE, []);
    const newOps = [op, ...ops];
    writeData(OPS_FILE, newOps);
    
    // Broadcast update
    io.emit("operative:created", op);
    res.json({ success: true });
  });

  app.put("/api/operatives/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const ops = readData(OPS_FILE, []);
    const newOps = ops.map((op: any) => op.id === id ? { ...op, ...updates } : op);
    writeData(OPS_FILE, newOps);
    
    // Broadcast update
    io.emit("operative:updated", { id, updates });
    res.json({ success: true });
  });

  app.delete("/api/operatives/:id", (req, res) => {
    const { id } = req.params;
    const ops = readData(OPS_FILE, []);
    const newOps = ops.filter((op: any) => op.id !== id);
    writeData(OPS_FILE, newOps);
    
    // Broadcast update
    io.emit("operative:deleted", id);
    res.json({ success: true });
  });

  app.get("/api/users", (req, res) => {
    const users = readData(USERS_FILE, []);
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const users = req.body;
    writeData(USERS_FILE, users);
    res.json({ success: true });
  });

  app.get("/api/catalog/:key", (req, res) => {
    const { key } = req.params;
    const catalogs = readData(CATALOGS_FILE, {});
    res.json(catalogs[key] || null);
  });

  app.post("/api/catalog/:key", (req, res) => {
    const { key } = req.params;
    const data = req.body;
    const catalogs = readData(CATALOGS_FILE, {});
    catalogs[key] = data;
    writeData(CATALOGS_FILE, catalogs);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

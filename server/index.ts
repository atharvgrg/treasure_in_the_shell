import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleSubmitPassword,
  getTeamProgress,
  resetProgress,
} from "./routes/submit-password";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/submit-password", handleSubmitPassword);
  app.get("/api/team-progress", getTeamProgress);
  app.post("/api/reset-progress", resetProgress);

  return app;
}

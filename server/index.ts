import "dotenv/config";
import express, { Response, NextFunction } from 'express';
import type { Request } from 'express';
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "node:http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Проверка API ключей при старте
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;

if (!hasAnthropic && !hasOpenRouter) {
  console.error("");
  console.error("╔══════════════════════════════════════════════════════════════╗");
  console.error("║  ОШИБКА: API ключи не найдены. Сервер не запущен.           ║");
  console.error("╚══════════════════════════════════════════════════════════════╝");
  console.error("");
  console.error("  Задайте хотя бы один ключ в файле .env:");
  console.error("");
  console.error("  OPENROUTER_API_KEY=sk-or-v1-...  (рекомендуется, работает из РФ)");
  console.error("  → Получить: https://openrouter.ai/keys");
  console.error("");
  console.error("  ANTHROPIC_API_KEY=sk-ant-...      (Claude Sonnet/Haiku)");
  console.error("  → Получить: https://console.anthropic.com/settings/keys");
  console.error("");
  process.exit(1);
}

// Показываем какие модели доступны
const available: string[] = [];
if (hasAnthropic) available.push("Claude Sonnet 4.6, Claude Opus 4.1, Claude 3.5 Haiku");
if (hasOpenRouter) available.push("DeepSeek V3, DeepSeek R1, GPT-4o mini");
log(`Доступные модели: ${available.join(" | ")}`);

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions: Parameters<typeof httpServer.listen>[0] = {
    port,
    host: "0.0.0.0",
  };

  // Windows does not support SO_REUSEPORT for this listener mode.
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  httpServer.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();

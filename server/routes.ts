import type { Express } from "express";
import type { Server } from "http";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";

const APP_VERSION = process.env.npm_package_version || "dev";
const DEPLOYED_AT = process.env.DEPLOYED_AT || new Date().toISOString();
const LLM_TIMEOUT_MS = 90000;

const MODELS: Record<string, { provider: "anthropic" | "openrouter"; model: string; label: string }> = {
  claude_sonnet_4_6: { provider: "anthropic",   model: "claude-sonnet-4-5",             label: "Claude Sonnet 4.6" },
  claude_opus_4_1:   { provider: "anthropic",   model: "claude-opus-4-5",               label: "Claude Opus 4.1" },
  claude_3_5_haiku:  { provider: "anthropic",   model: "claude-haiku-4-5",              label: "Claude 3.5 Haiku" },
  deepseek_v3:       { provider: "openrouter",  model: "deepseek/deepseek-chat",        label: "DeepSeek V3" },
  deepseek_r1:       { provider: "openrouter",  model: "deepseek/deepseek-r1",          label: "DeepSeek R1" },
  gpt_4o_mini:       { provider: "openrouter",  model: "openai/gpt-4o-mini",            label: "GPT-4o mini" },
};

const DEFAULT_MODEL = "claude_sonnet_4_6";

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callLLM(
  modelCfg: { provider: "anthropic" | "openrouter"; model: string },
  system: string,
  userContent: string,
): Promise<string> {
  if (modelCfg.provider === "openrouter") {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vba-generator.app",
        "X-Title": "VBA Generator",
      },
      body: JSON.stringify({
        model: modelCfg.model,
        max_tokens: 2048,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`${resp.status}: ${text.slice(0, 200)}`);
    }
    const data = await resp.json() as any;
    return data.choices[0].message.content;
  }
  // Anthropic native
  const message = await anthropicClient.messages.create(
    {
      model: modelCfg.model,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: userContent }],
    },
    { timeout: LLM_TIMEOUT_MS },
  );
  return (message.content[0] as any).text;
}

const SYSTEM_PROMPT = `Ты — эксперт по VBA (Visual Basic for Applications) для Microsoft Excel. 
Пользователь описывает задачу на русском языке, а ты генерируешь готовый, рабочий VBA-макрос.

Правила:
1. Всегда возвращай ТОЛЬКО JSON (без markdown-блоков, без пояснений снаружи JSON)
2. Структура JSON: { "code": "...", "explanation": "...", "category": "...", "steps": [...] }
3. В "code" — только чистый VBA код, без ''' или Sub/End Sub обёрток (они должны быть внутри кода)
4. В "explanation" — краткое описание что делает макрос (1-2 предложения), на русском
5. В "category" — одна из: "суммирование", "фильтрация", "форматирование", "поиск", "сортировка", "копирование", "диаграммы", "прочее"
6. В "steps" — массив строк с инструкцией по вставке (3-5 шагов), на русском
7. Код должен быть production-ready: с обработкой ошибок, комментариями на русском, понятными именами переменных
8. Используй On Error GoTo для обработки ошибок
9. Всегда завершай Sub корректно
10. КРИТИЧНО: Никогда не используй символ переноса строки _ (underscore continuation) в коде. Все параметры функций пиши в одну строку. Например ПРАВИЛЬНО: ws.ChartObjects.Add(Left:=100, Top:=100, Width:=400, Height:=300) — всё на одной строке. Многострочные вызовы с _ часто вызывают Syntax error в VBA.
11. Весь код должен быть рабочим — каждая строка синтаксически корректна сама по себе

Пример ответа:
{
  "code": "Sub СуммаПоУсловию()\\n    ' Суммирует колонку A если B > 10\\n    Dim ws As Worksheet\\n    Dim lastRow As Long\\n    Dim total As Double\\n    Dim i As Long\\n    \\n    On Error GoTo ErrorHandler\\n    \\n    Set ws = ActiveSheet\\n    lastRow = ws.Cells(ws.Rows.Count, \\"A\\").End(xlUp).Row\\n    total = 0\\n    \\n    For i = 2 To lastRow\\n        If ws.Cells(i, 2).Value > 10 Then\\n            total = total + ws.Cells(i, 1).Value\\n        End If\\n    Next i\\n    \\n    MsgBox \\"Итого: \\" & total, vbInformation\\n    Exit Sub\\n    \\nErrorHandler:\\n    MsgBox \\"Ошибка: \\" & Err.Description, vbCritical\\nEnd Sub",
  "explanation": "Макрос перебирает все строки и суммирует значения в колонке A только если в колонке B значение больше 10.",
  "category": "суммирование",
  "steps": ["Откройте Excel и нажмите Alt+F11", "В меню выберите Insert → Module", "Вставьте код в открывшееся окно", "Закройте редактор (Alt+Q)", "Запустите макрос через Alt+F8 → выберите имя → Run"]
}`;

export function registerRoutes(httpServer: Server, app: Express) {
  app.get("/api/meta", (_req, res) => {
    res.json({
      version: APP_VERSION,
      deployedAt: DEPLOYED_AT,
    });
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { task, model } = req.body;
      if (!task || typeof task !== "string" || task.trim().length < 3) {
        return res.status(400).json({ error: "Опишите задачу подробнее" });
      }

      const modelId = typeof model === "string" && MODELS[model] ? model : DEFAULT_MODEL;
      const modelCfg = MODELS[modelId];

      const rawText = await callLLM(modelCfg, SYSTEM_PROMPT, `Задача: ${task.trim()}`);
      
      // Strip markdown code blocks if present
      const jsonText = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const result = JSON.parse(jsonText);

      const saved = storage.saveGeneration({
        task: task.trim(),
        code: result.code,
        explanation: result.explanation,
        category: result.category || "прочее",
      });

      res.json({
        id: saved.id,
        code: result.code,
        explanation: result.explanation,
        category: result.category,
        steps: result.steps || [],
        model: modelId,
        modelLabel: modelCfg.label,
      });
    } catch (err: any) {
      console.error("Generate error:", err);
      if (err?.name === "APIConnectionTimeoutError") {
        return res.status(504).json({
          error:
            "Claude не ответил вовремя. Попробуйте модель Claude 3.5 Haiku или повторите запрос чуть позже.",
        });
      }

      res.status(500).json({ error: "Ошибка генерации: " + err.message });
    }
  });

  app.get("/api/models", (_req, res) => {
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const list = Object.entries(MODELS).map(([id, cfg]) => ({
      id,
      label: cfg.label,
      provider: cfg.provider,
      available: cfg.provider === "anthropic" ? hasAnthropic : hasOpenRouter,
    }));
    res.json(list);
  });

  app.get("/api/history", (_req, res) => {
    try {
      const history = storage.getHistory();
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/examples", (_req, res) => {
    res.json([
      {
        id: "ex1",
        title: "Условная сумма",
        task: "Суммировать колонку A если значение в B больше 10",
        category: "суммирование",
      },
      {
        id: "ex2",
        title: "Выделить дубликаты",
        task: "Найти и выделить красным цветом все дублирующиеся значения в колонке A",
        category: "форматирование",
      },
      {
        id: "ex3",
        title: "Автофильтр по дате",
        task: "Отфильтровать строки где дата в колонке C за последние 30 дней",
        category: "фильтрация",
      },
      {
        id: "ex4",
        title: "Сохранить листы в PDF",
        task: "Сохранить каждый лист книги как отдельный PDF файл в папку на рабочем столе",
        category: "копирование",
      },
      {
        id: "ex5",
        title: "Создать сводную диаграмму",
        task: "Создать столбчатую диаграмму по данным из A1:B20 с заголовком и легендой",
        category: "диаграммы",
      },
      {
        id: "ex6",
        title: "Массовое переименование листов",
        task: "Переименовать все листы в книге добавив текущую дату в начало названия",
        category: "прочее",
      },
    ]);
  });
}

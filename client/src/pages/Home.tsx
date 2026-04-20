import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Code2,
  Copy,
  CheckCheck,
  Zap,
  BookOpen,
  Clock,
  ChevronRight,
  Play,
  Terminal,
  AlertCircle,
  Loader2,
  Braces,
  FileCode,
  ListChecks,
} from "lucide-react";

interface GenerationResult {
  id: number;
  code: string;
  explanation: string;
  category: string;
  steps: string[];
}

interface Example {
  id: string;
  title: string;
  task: string;
  category: string;
}

interface HistoryItem {
  id: number;
  task: string;
  code: string;
  explanation: string;
  category: string;
}

// VBA keyword highlighter (runs in browser)
// Processes line by line to avoid regex cross-contamination between tokens
function highlightVBA(code: string): string {
  const keywords = [
    "Sub", "End Sub", "Function", "End Function", "Dim", "As", "Set",
    "If", "Then", "Else", "ElseIf", "End If", "For", "To", "Next",
    "Do", "While", "Loop", "Until", "With", "End With", "Select Case",
    "Case", "End Select", "Exit", "Return", "Call", "New", "Nothing",
    "True", "False", "And", "Or", "Not", "On Error", "GoTo", "Resume",
    "MsgBox", "InputBox", "Range", "Cells", "Rows", "Columns", "Sheets",
    "ActiveSheet", "ActiveWorkbook", "ThisWorkbook", "Workbooks", "Worksheets",
    "Long", "Integer", "Double", "String", "Boolean", "Variant", "Object",
    "Public", "Private", "Static", "ByVal", "ByRef",
  ];

  function escapeHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Process line by line so comment detection stops at end-of-line
  // and string/keyword replacements don't touch comment spans
  const lines = code.split("\n").map((rawLine) => {
    // Find comment start: apostrophe not inside a string
    let commentStart = -1;
    let inString = false;
    for (let i = 0; i < rawLine.length; i++) {
      const ch = rawLine[i];
      if (ch === '"') { inString = !inString; continue; }
      if (!inString && ch === "'") { commentStart = i; break; }
    }

    let codePart = commentStart === -1 ? rawLine : rawLine.slice(0, commentStart);
    const commentPart = commentStart === -1 ? null : rawLine.slice(commentStart);

    // Escape HTML in code part
    let html = escapeHtml(codePart);

    // Highlight strings (only in code part, before comment)
    html = html.replace(/&quot;[^&]*&quot;|"[^"]*"/g, '<span class="vba-string">$&</span>');

    // Highlight keywords (only in code part)
    keywords.forEach((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(
        new RegExp(`(?<![\\w>])(${escaped})(?![\\w<])`, "g"),
        '<span class="vba-keyword">$1</span>'
      );
    });

    // Numbers (only in code part)
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="vba-number">$1</span>');

    // Append comment part (escaped, styled separately)
    if (commentPart !== null) {
      html += `<span class="vba-comment">${escapeHtml(commentPart)}</span>`;
    }

    return html;
  });

  return lines.join("\n");
}

const CATEGORY_COLORS: Record<string, string> = {
  суммирование: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  фильтрация: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  форматирование: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  поиск: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  сортировка: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  копирование: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  диаграммы: "bg-red-500/15 text-red-400 border-red-500/30",
  прочее: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

function CategoryBadge({ cat }: { cat: string }) {
  const cls = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["прочее"];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${cls}`}
    >
      {cat}
    </span>
  );
}

// Simple VBA sandbox runner in browser (simulated)
function VBATestPanel({ code }: { code: string }) {
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function runSimulation() {
    setRunning(true);
    setOutput(null);
    setTimeout(() => {
      // Parse basic structure and give feedback
      const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
      const hasSub = lines.some((l) => l.startsWith("Sub "));
      const hasEndSub = lines.some((l) => l === "End Sub");
      const hasError = lines.some((l) => l.includes("On Error GoTo"));
      const varLines = lines.filter((l) => l.startsWith("Dim "));
      const msgLines = lines.filter((l) => l.includes("MsgBox"));

      let result = "✅ Синтаксический анализ кода:\n\n";
      result += hasSub ? "  ✓ Sub-процедура определена\n" : "  ✗ Sub-процедура не найдена\n";
      result += hasEndSub ? "  ✓ End Sub присутствует\n" : "  ✗ End Sub отсутствует\n";
      result += hasError ? "  ✓ Обработка ошибок (On Error GoTo)\n" : "  ⚠ Обработка ошибок не найдена\n";
      result += `  ✓ Объявлено переменных: ${varLines.length}\n`;
      if (msgLines.length) result += `  ✓ Вывод пользователю: MsgBox (${msgLines.length} вызов)\n`;

      result += "\n📋 Структура кода:\n";
      lines.slice(0, 3).forEach((l) => {
        if (l.startsWith("Sub ") || l.startsWith("Dim ")) {
          result += `  ${l}\n`;
        }
      });

      result += "\n⚠ Примечание: Для реального выполнения вставьте код в редактор VBA (Alt+F11)";
      setOutput(result);
      setRunning(false);
    }, 1200);
  }

  return (
    <div className="mt-4 border border-[var(--color-text-faint)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-[var(--color-text-faint)]">
        <div className="flex items-center gap-2 text-sm text-muted-custom">
          <Terminal size={14} />
          <span className="font-mono">Тест в браузере</span>
        </div>
        <Button
          data-testid="button-run-test"
          size="sm"
          variant="ghost"
          className="h-7 text-xs font-mono text-green gap-1.5 hover:bg-green-dim hover:text-green border border-green rounded"
          onClick={runSimulation}
          disabled={running}
        >
          {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          {running ? "Анализ..." : "Запустить анализ"}
        </Button>
      </div>
      {output && (
        <pre className="p-4 text-xs font-mono text-[#a8c0d6] leading-relaxed bg-code whitespace-pre-wrap">
          {output}
        </pre>
      )}
      {!output && !running && (
        <div className="px-4 py-3 text-xs text-faint font-mono">
          Нажмите "Запустить анализ" для проверки структуры кода
        </div>
      )}
    </div>
  );
}

function StepsPanel({ steps }: { steps: string[] }) {
  return (
    <div className="mt-4 bg-surface-2 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks size={14} className="text-green" />
        <span className="text-sm font-semibold">Как вставить в Excel</span>
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-dim border border-green text-green text-xs font-mono font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-[hsl(var(--foreground))] leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [task, setTask] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const { data: examples = [], isLoading: examplesLoading } = useQuery<Example[]>({
    queryKey: ["/api/examples"],
  });

  const { data: history = [] } = useQuery<HistoryItem[]>({
    queryKey: ["/api/history"],
  });

  const mutation = useMutation({
    mutationFn: async (taskText: string) => {
      const res = await apiRequest("POST", "/api/generate", { task: taskText });
      return res.json() as Promise<GenerationResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
    onError: (err: any) => {
      toast({
        title: "Ошибка генерации",
        description: err.message || "Попробуйте ещё раз",
        variant: "destructive",
      });
    },
  });

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    toast({ title: "Скопировано!", description: "Код скопирован в буфер обмена" });
    setTimeout(() => setCopied(false), 2500);
  }

  function handleExampleClick(ex: Example) {
    setTask(ex.task);
    setResult(null);
  }

  function handleSubmit() {
    if (!task.trim() || task.trim().length < 5) {
      toast({ title: "Опишите задачу", description: "Минимум 5 символов", variant: "destructive" });
      return;
    }
    mutation.mutate(task.trim());
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="border-b border-[var(--color-text-faint)] bg-surface sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-dim border border-green flex items-center justify-center">
              <svg aria-label="VBA Generator Logo" viewBox="0 0 28 28" width="20" height="20" fill="none">
                <rect x="2" y="2" width="24" height="24" rx="4" stroke="var(--color-green)" strokeWidth="1.5"/>
                <path d="M7 9l4 10 3-6 3 6 4-10" stroke="var(--color-green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="21" cy="9" r="1.5" fill="var(--color-green)"/>
              </svg>
            </div>
            <div>
              <span className="font-mono font-bold text-sm text-green">VBA</span>
              <span className="font-mono font-bold text-sm text-[hsl(var(--foreground))]"> Generator</span>
              <span className="ml-2 text-xs text-faint font-mono hidden sm:inline">AI-макросы для Excel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-green)] animate-pulse" />
            <span className="text-xs text-muted-custom font-mono hidden sm:inline">Claude Sonnet</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-dim border border-green text-xs font-mono text-green mb-4">
            <Zap size={10} />
            Powered by Claude AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono mb-3">
            <span className="text-[hsl(var(--foreground))]">Опишите задачу —</span>{" "}
            <span className="text-green">получите VBA макрос</span>
          </h1>
          <p className="text-muted-custom text-sm max-w-lg mx-auto">
            Пишите на русском языке. ИИ генерирует готовый код с комментариями, инструкцией по установке и проверкой синтаксиса.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input + Examples */}
          <div className="lg:col-span-1 space-y-5">
            {/* Input Card */}
            <div className="bg-surface rounded-xl border border-[var(--color-text-faint)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Braces size={14} className="text-green" />
                <span className="text-sm font-semibold">Ваша задача</span>
              </div>
              <Textarea
                data-testid="input-task"
                value={task}
                onChange={(e) => { setTask(e.target.value); if (result) setResult(null); }}
                placeholder="Например: суммировать колонку A если значение в B больше 10..."
                className="min-h-[120px] resize-none bg-code border-[var(--color-text-faint)] text-sm font-mono placeholder:text-faint focus:border-green focus:ring-green/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
                }}
              />
              <div className="flex items-center justify-between mt-1 mb-3">
                <span className="text-xs text-faint font-mono">Ctrl+Enter для генерации</span>
                <span className={`text-xs font-mono ${task.length > 5 ? "text-green" : "text-faint"}`}>
                  {task.length} симв.
                </span>
              </div>
              <Button
                data-testid="button-generate"
                className="w-full bg-[var(--color-green)] text-[hsl(var(--background))] hover:bg-[#00b872] font-mono font-semibold transition-all"
                onClick={handleSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin mr-2" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Code2 size={15} className="mr-2" />
                    Сгенерировать макрос
                  </>
                )}
              </Button>
            </div>

            {/* Examples */}
            <div className="bg-surface rounded-xl border border-[var(--color-text-faint)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-green" />
                <span className="text-sm font-semibold">Готовые примеры</span>
              </div>
              {examplesLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 bg-surface-2" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {examples.map((ex) => (
                    <button
                      key={ex.id}
                      data-testid={`button-example-${ex.id}`}
                      onClick={() => handleExampleClick(ex)}
                      className="w-full text-left p-3 rounded-lg bg-surface-2 hover:bg-[var(--color-text-faint)]/10 border border-transparent hover:border-[var(--color-text-faint)] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium leading-tight">{ex.title}</div>
                          <div className="text-xs text-muted-custom mt-0.5 line-clamp-1">{ex.task}</div>
                        </div>
                        <ChevronRight size={14} className="text-faint group-hover:text-green flex-shrink-0 mt-0.5 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-surface rounded-xl border border-[var(--color-text-faint)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-green" />
                  <span className="text-sm font-semibold">История</span>
                  <span className="ml-auto text-xs text-faint font-mono">{history.length} запросов</span>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {history.slice(0, 8).map((h) => (
                    <button
                      key={h.id}
                      data-testid={`button-history-${h.id}`}
                      onClick={() => { setTask(h.task); setResult(null); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-custom hover:text-[hsl(var(--foreground))] hover:bg-surface-2 transition-all truncate"
                    >
                      <span className="text-faint font-mono mr-2">#{h.id}</span>
                      {h.task}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div className="lg:col-span-2" ref={resultRef}>
            {mutation.isPending && (
              <div className="bg-surface rounded-xl border border-[var(--color-text-faint)] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 size={18} className="animate-spin text-green" />
                  <span className="font-mono text-sm text-green">Генерация макроса...</span>
                </div>
                <Skeleton className="h-4 w-3/4 mb-2 bg-surface-2" />
                <Skeleton className="h-4 w-1/2 mb-6 bg-surface-2" />
                <Skeleton className="h-48 bg-surface-2 rounded-lg" />
              </div>
            )}

            {!mutation.isPending && result && (
              <div className="bg-surface rounded-xl border border-green/30 overflow-hidden" data-testid="result-panel">
                {/* Result header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-green-dim border-b border-green/20">
                  <div className="flex items-center gap-3">
                    <FileCode size={16} className="text-green" />
                    <div>
                      <span className="text-sm font-mono font-semibold text-green">Макрос готов</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CategoryBadge cat={result.category} />
                      </div>
                    </div>
                  </div>
                  <Button
                    data-testid="button-copy"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs font-mono gap-1.5 text-green hover:bg-green/10 hover:text-green border border-green/40 rounded-lg"
                    onClick={handleCopy}
                  >
                    {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                    {copied ? "Скопировано" : "Копировать"}
                  </Button>
                </div>

                {/* Explanation */}
                <div className="px-5 py-4 border-b border-[var(--color-text-faint)]">
                  <div className="flex gap-2 text-sm text-[hsl(var(--foreground))] leading-relaxed">
                    <AlertCircle size={15} className="text-green flex-shrink-0 mt-0.5" />
                    <span>{result.explanation}</span>
                  </div>
                </div>

                {/* Code block */}
                <div className="relative">
                  <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-[var(--color-text-faint)]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs font-mono text-faint">Module1.bas</span>
                  </div>
                  <div className="bg-code overflow-x-auto">
                    <style>{`
                      .vba-keyword { color: #c792ea; font-weight: 500; }
                      .vba-comment { color: #546e7a; font-style: italic; }
                      .vba-string { color: #c3e88d; }
                      .vba-number { color: #f78c6c; }
                    `}</style>
                    <pre
                      className="p-5 text-xs font-mono text-[#cdd6f4] leading-relaxed min-h-[200px]"
                      data-testid="code-output"
                      dangerouslySetInnerHTML={{ __html: highlightVBA(result.code) }}
                    />
                  </div>
                </div>

                {/* Steps + Test */}
                <div className="px-5 py-4">
                  {result.steps?.length > 0 && <StepsPanel steps={result.steps} />}
                  <VBATestPanel code={result.code} />
                </div>
              </div>
            )}

            {!mutation.isPending && !result && (
              <div className="bg-surface rounded-xl border border-[var(--color-text-faint)] p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-green-dim border border-green flex items-center justify-center mb-4">
                  <Code2 size={28} className="text-green" />
                </div>
                <h2 className="text-lg font-mono font-semibold mb-2">Готов к генерации</h2>
                <p className="text-sm text-muted-custom max-w-sm">
                  Опишите задачу слева или выберите пример. ИИ создаст VBA макрос с комментариями и пошаговой инструкцией.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-sm">
                  {["Суммирование", "Фильтрация", "Форматирование"].map((cat) => (
                    <div key={cat} className="p-3 rounded-lg bg-surface-2 text-center">
                      <div className="text-xs text-muted-custom font-mono">{cat}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--color-text-faint)] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <span className="text-xs text-faint font-mono">VBA Generator © 2026</span>
          <span className="text-xs text-faint font-mono">Alt+F11 для открытия редактора VBA</span>
        </div>
      </footer>
    </div>
  );
}

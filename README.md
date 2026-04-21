# VBA Generator — AI макросы для Excel

Веб-приложение для генерации VBA макросов по описанию задачи на русском языке.

## Возможности

- 🤖 Генерация VBA кода через несколько LLM (Claude, DeepSeek, GPT-4o mini)
- 🔀 Выбор модели прямо в интерфейсе
- 🇷🇺 Описание задачи на русском языке
- 🎨 Подсветка синтаксиса VBA в браузере
- 📋 Копирование кода одной кнопкой
- 📖 Пошаговая инструкция по вставке в Excel (Alt+F11)
- 🧪 Анализ структуры кода прямо в браузере
- 📚 6 готовых примеров (суммирование, фильтрация, диаграммы и др.)
- 🕓 История последних 20 запросов (SQLite)

## Стек

- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend:** Express.js, Drizzle ORM, SQLite (better-sqlite3)
- **AI:** Anthropic Claude (Sonnet/Haiku) + OpenRouter (DeepSeek V3/R1, GPT-4o mini)
- **Build:** Vite

## Быстрый старт

**macOS / Linux / Git Bash:**
```bash
git clone https://github.com/artemyyartsev-pixel/vba-generator
cd vba-generator
./setup.sh
```

**Windows (cmd / PowerShell):**
```bat
git clone https://github.com/artemyyartsev-pixel/vba-generator
cd vba-generator
setup.bat
```

Скрипт создаст `.env`, предложит ввести API ключи и установит зависимости.

> **Из России** рекомендуется OpenRouter — работает без VPN: [openrouter.ai/keys](https://openrouter.ai/keys)
> Anthropic заблокирован в РФ без VPN: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

Затем запустите:

```bash
npm run dev
```

Откройте [http://localhost:5000](http://localhost:5000)

## Команды

| Команда | Описание |
|---------|----------|
| `make setup` | Первый запуск: `.env` + `npm install` |
| `make dev` | Запуск в режиме разработки |
| `make build` | Сборка production-бандла |

## Ручная установка

```bash
npm install
cp .env.example .env
# Вставьте один или оба ключа в .env:
#   OPENROUTER_API_KEY=sk-or-v1-...  (DeepSeek, GPT-4o mini — работает из РФ)
#   ANTHROPIC_API_KEY=sk-ant-...     (Claude Sonnet/Haiku — нужен VPN из РФ)
npm run dev
```

## Структура проекта

```
client/          # React фронтенд
  src/
    pages/       # Страницы (Home.tsx — основной UI)
    components/  # shadcn/ui компоненты
server/          # Express бэкенд
  routes.ts      # API эндпоинты + системный промпт для Claude
  storage.ts     # Drizzle ORM + SQLite
shared/
  schema.ts      # Drizzle схема БД
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/generate` | Генерация макроса (task + modelId) |
| GET | `/api/models` | Список доступных LLM моделей |
| GET | `/api/history` | История последних 20 запросов |
| GET | `/api/examples` | Готовые примеры |

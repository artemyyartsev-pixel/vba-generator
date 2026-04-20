# VBA Generator — AI макросы для Excel

Веб-приложение для генерации VBA макросов по описанию задачи на русском языке.

## Возможности

- 🤖 Генерация VBA кода через Claude AI (Anthropic)
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
- **AI:** Anthropic Claude Sonnet
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

Скрипт создаст `.env`, попросит вставить `ANTHROPIC_API_KEY` и установит зависимости.
Получить ключ: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

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
# Вставьте ANTHROPIC_API_KEY в .env
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
| POST | `/api/generate` | Генерация макроса по описанию |
| GET | `/api/history` | История последних 20 запросов |
| GET | `/api/examples` | Готовые примеры |

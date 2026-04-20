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

## Запуск

```bash
npm install
```

Создайте файл `.env` и добавьте ключ Anthropic:

```
ANTHROPIC_API_KEY=your_key_here
```

```bash
npm run dev
```

Откройте [http://localhost:5000](http://localhost:5000)

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

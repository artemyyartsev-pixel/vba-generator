#!/bin/bash
set -e

echo ""
echo "=== VBA Generator — Setup ==="
echo ""

# Создаём .env если нет
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Файл .env создан"
else
  echo "⚠️  Файл .env уже существует, пропускаю"
fi

# Проверяем наличие ключей
NEEDS_KEY=0
if grep -q "your_anthropic_key_here\|your_openrouter_key_here" .env 2>/dev/null; then
  NEEDS_KEY=1
fi

if [ "$NEEDS_KEY" = "1" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║              Настройка API ключей                        ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "Нужен хотя бы один ключ для работы генератора."
  echo ""
  echo "Вариант 1: OpenRouter (рекомендуется для России)"
  echo "  ✅ Работает без VPN"
  echo "  🔗 https://openrouter.ai/keys"
  echo "  📦 Модели: DeepSeek V3, DeepSeek R1, GPT-4o mini"
  echo ""
  read -p "  Вставьте OPENROUTER_API_KEY (или Enter чтобы пропустить): " OR_KEY
  if [ -n "$OR_KEY" ]; then
    sed -i "s|your_openrouter_key_here|$OR_KEY|g" .env
    echo "  ✅ OPENROUTER_API_KEY сохранён"
  fi

  echo ""
  echo "Вариант 2: Anthropic (Claude Sonnet / Haiku)"
  echo "  ⚠️  Заблокирован в России без VPN"
  echo "  🔗 https://console.anthropic.com/settings/keys"
  echo ""
  read -p "  Вставьте ANTHROPIC_API_KEY (или Enter чтобы пропустить): " AN_KEY
  if [ -n "$AN_KEY" ]; then
    sed -i "s|your_anthropic_key_here|$AN_KEY|g" .env
    echo "  ✅ ANTHROPIC_API_KEY сохранён"
  fi

  if [ -z "$OR_KEY" ] && [ -z "$AN_KEY" ]; then
    echo ""
    echo "  ⚠️  Ключи не введены. Добавьте их в .env вручную перед запуском."
  fi
fi

# Устанавливаем зависимости
echo ""
echo "📦 Устанавливаю зависимости..."
npm install

echo ""
echo "✅ Готово! Запустите приложение:"
echo ""
echo "   npm run dev"
echo "   или"
echo "   make dev"
echo ""
echo "   Откройте http://localhost:5000"
echo ""

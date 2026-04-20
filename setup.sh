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

# Проверяем наличие ключа
if grep -q "your_key_here" .env 2>/dev/null; then
  echo ""
  echo "👉 Вставьте ANTHROPIC_API_KEY в файл .env"
  echo "   Получить ключ: https://console.anthropic.com/settings/keys"
  echo ""
  read -p "   Вставьте ключ сейчас (или Enter чтобы пропустить): " KEY
  if [ -n "$KEY" ]; then
    sed -i "s|your_key_here|$KEY|g" .env
    echo "✅ Ключ сохранён в .env"
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

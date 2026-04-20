.PHONY: setup install dev build help

help:
	@echo ""
	@echo "  make setup   — первый запуск: создаёт .env и устанавливает зависимости"
	@echo "  make install — только установка зависимостей"
	@echo "  make dev     — запуск в режиме разработки (http://localhost:5000)"
	@echo "  make build   — сборка production-бандла"
	@echo ""

setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ""; \
		echo "✅ Файл .env создан из .env.example"; \
		echo ""; \
		echo "👉 Откройте .env и вставьте ваш ANTHROPIC_API_KEY:"; \
		echo "   https://console.anthropic.com/settings/keys"; \
		echo ""; \
	else \
		echo "⚠️  Файл .env уже существует, пропускаю"; \
	fi
	@$(MAKE) install

install:
	npm install

dev:
	@if [ ! -f .env ]; then \
		echo "❌ Файл .env не найден. Сначала выполните: make setup"; \
		exit 1; \
	fi
	@if grep -q "your_key_here" .env 2>/dev/null; then \
		echo "❌ Замените ANTHROPIC_API_KEY в файле .env на реальный ключ"; \
		echo "   Получить ключ: https://console.anthropic.com/settings/keys"; \
		exit 1; \
	fi
	npm run dev

build:
	npm run build

@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
echo.
echo === VBA Generator - Setup ===
echo.

:: Проверяем наличие Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Node.js не найден.
    echo Скачайте и установите Node.js 20 LTS: https://nodejs.org
    pause
    exit /b 1
)

:: Проверяем наличие npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] npm не найден. Переустановите Node.js: https://nodejs.org
    pause
    exit /b 1
)

:: Создаём .env если нет
if not exist .env (
    copy .env.example .env >nul
    echo [OK] Файл .env создан
) else (
    echo [--] Файл .env уже существует, пропускаю
)

:: Проверяем наличие незаполненных ключей
findstr /c:"your_anthropic_key_here" /c:"your_openrouter_key_here" .env >nul 2>&1
if not errorlevel 1 (
    echo.
    echo ============================================
    echo  Настройка API ключей
    echo  Нужен хотя бы один ключ для работы.
    echo ============================================
    echo.
    echo Вариант 1: OpenRouter (рекомендуется для России)
    echo   Работает без VPN
    echo   Получить ключ: https://openrouter.ai/keys
    echo   Модели: DeepSeek V3, DeepSeek R1, GPT-4o mini
    echo.
    set /p OR_KEY="  Вставьте OPENROUTER_API_KEY (или Enter чтобы пропустить): "
    if not "!OR_KEY!"=="" (
        powershell -Command "(Get-Content .env) -replace 'your_openrouter_key_here', '!OR_KEY!' | Set-Content .env"
        echo   [OK] OPENROUTER_API_KEY сохранён
    )

    echo.
    echo Вариант 2: Anthropic (Claude Sonnet / Haiku)
    echo   Заблокирован в России без VPN
    echo   Получить ключ: https://console.anthropic.com/settings/keys
    echo.
    set /p AN_KEY="  Вставьте ANTHROPIC_API_KEY (или Enter чтобы пропустить): "
    if not "!AN_KEY!"=="" (
        powershell -Command "(Get-Content .env) -replace 'your_anthropic_key_here', '!AN_KEY!' | Set-Content .env"
        echo   [OK] ANTHROPIC_API_KEY сохранён
    )

    if "!OR_KEY!"=="" if "!AN_KEY!"=="" (
        echo.
        echo   [!] Ключи не введены. Добавьте их в .env вручную перед запуском.
    )
)

:: Устанавливаем зависимости
echo.
echo Устанавливаю зависимости (npm install)...
npm install
if errorlevel 1 (
    echo [ОШИБКА] npm install завершился с ошибкой
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Готово! Запустите приложение командой:
echo.
echo    npm run dev
echo.
echo  Затем откройте: http://localhost:5000
echo ============================================
echo.
pause

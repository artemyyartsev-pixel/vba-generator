@echo off
chcp 65001 >nul
echo.
echo === VBA Generator - Setup ===
echo.

:: Проверяем наличие Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Node.js не найден.
    echo Скачайте и установите: https://nodejs.org
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

:: Проверяем наличие ключа
findstr /c:"your_key_here" .env >nul 2>&1
if not errorlevel 1 (
    echo.
    echo Вставьте ваш ANTHROPIC_API_KEY:
    echo Получить ключ: https://console.anthropic.com/settings/keys
    echo.
    set /p APIKEY="  Ключ: "
    if not "!APIKEY!"=="" (
        powershell -Command "(Get-Content .env) -replace 'your_key_here', '!APIKEY!' | Set-Content .env"
        echo [OK] Ключ сохранён в .env
    ) else (
        echo [!] Ключ не введён. Вставьте его вручную в файл .env перед запуском.
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

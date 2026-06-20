@echo off
chcp 65001 >nul
title Avukat App — Başlatma

echo ============================================
echo   AVUKAT APP — Başlatılıyor
echo ============================================
echo.

:: pnpm kontrol
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm bulunamadı, yükleniyor...
    npm install -g pnpm
)

:: Env dosyalarını kontrol et
if not exist "apps\web\.env.local" (
    echo [UYARI] apps\web\.env.local bulunamadı!
    echo Örnek dosyadan oluşturuluyor...
    copy "apps\web\.env.local.example" "apps\web\.env.local"
    echo Lütfen apps\web\.env.local dosyasını düzenleyin ve gerçek API anahtarlarını girin.
    echo.
)

if not exist "apps\api\.env" (
    copy "apps\api\.env.example" "apps\api\.env"
    echo [UYARI] apps\api\.env dosyası oluşturuldu. Düzenlemeniz gerekebilir.
    echo.
)

:: Bağımlılıkları yükle
echo Bağımlılıklar yükleniyor...
call pnpm install
echo.

echo ============================================
echo   Servisler başlatılıyor...
echo ============================================
echo.
echo   Web     : http://localhost:3000
echo   API     : http://localhost:3001
echo   Mobile  : expo start (ayrı terminal)
echo.

:: Web ve API'yi paralel başlat
start "Avukat Web" cmd /k "cd apps\web && pnpm dev"
timeout /t 2 >nul
start "Avukat API" cmd /k "cd apps\api && pnpm dev"

echo Servisler başlatıldı!
echo Web için tarayıcınızda http://localhost:3000 adresini açın.
echo Mobile için: cd apps\mobile ^&^& pnpm dev
echo.
pause

@echo off
chcp 65001 >nul
title Avukat App — Mobile

echo ============================================
echo   AVUKAT APP — Mobile Başlatma
echo ============================================
echo.
echo Expo Go uygulamasını telefonunuza indirin:
echo   iOS    : App Store'da "Expo Go" arayın
echo   Android: Play Store'da "Expo Go" arayın
echo.

if not exist "apps\mobile\.env" (
    copy "apps\mobile\.env.example" "apps\mobile\.env"
    echo [UYARI] apps\mobile\.env dosyası oluşturuldu.
    echo Supabase URL ve Anon Key değerlerini girin.
    echo.
)

cd apps\mobile
pnpm dev

pause

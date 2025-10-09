@echo off
REM LPlate Project Diagnostic Script (Windows)
REM Run this script to quickly check project status

echo 🚗 LPlate Project Diagnostic
echo ==========================
echo.

echo 📋 Git Status:
git status --short
echo.

echo 📝 Recent Commits:
git log --oneline -5
echo.

echo 📦 Package Status:
if exist "package.json" (
    echo ✅ package.json exists
) else (
    echo ❌ package.json not found
)
echo.

echo 🔧 Development Server:
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo ✅ Node.js processes running
) else (
    echo ❌ No Node.js processes found (run 'pnpm dev')
)
echo.

echo 📁 Key Files Check:
if exist "README.md" (echo ✅ README.md exists) else (echo ❌ README.md missing)
if exist "src\app\page.tsx" (echo ✅ src\app\page.tsx exists) else (echo ❌ src\app\page.tsx missing)
if exist "src\components\ui\SocialProofCarousel.tsx" (echo ✅ SocialProofCarousel.tsx exists) else (echo ❌ SocialProofCarousel.tsx missing)
if exist "src\lib\supabase.ts" (echo ✅ supabase.ts exists) else (echo ❌ supabase.ts missing)
echo.

echo 🐛 Known Issues:
if exist "BUG-SOCIAL-PROOF-LEARNER-NAMES.md" (
    echo ⚠️  Social proof learner names issue documented
) else (
    echo ✅ No documented bugs found
)
echo.

echo 🗄️  Database Files:
for /f %%i in ('dir /b *.sql 2^>nul ^| find /c /v ""') do set sql_count=%%i
echo Found %sql_count% SQL files
echo.

echo 🌐 Environment:
if exist ".env.local" (
    echo ✅ .env.local exists
) else (
    echo ❌ .env.local missing (Supabase config needed)
)
echo.

echo 📊 Project Summary:
echo - Tech Stack: Next.js 15, TypeScript, TailwindCSS, Supabase
echo - Core Features: Instructor search, booking system, social proof
echo - Current Focus: Social proof carousel and certificate uploads
echo.

echo 🎯 Next Steps:
echo 1. Check browser console for runtime errors
echo 2. Test social proof carousel functionality
echo 3. Verify certificate upload system
echo 4. Check Supabase connection and data
echo.

echo Diagnostic complete! 🚀
pause

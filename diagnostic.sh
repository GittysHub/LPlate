#!/bin/bash
# LPlate Project Diagnostic Script
# Run this script to quickly check project status

echo "🚗 LPlate Project Diagnostic"
echo "=========================="
echo ""

echo "📋 Git Status:"
git status --short
echo ""

echo "📝 Recent Commits:"
git log --oneline -5
echo ""

echo "📦 Package Status:"
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    echo "Dependencies: $(grep -c '"dependencies"' package.json) dependency groups"
else
    echo "❌ package.json not found"
fi
echo ""

echo "🔧 Development Server:"
if pgrep -f "next dev" > /dev/null; then
    echo "✅ Next.js dev server is running"
else
    echo "❌ Next.js dev server not running (run 'pnpm dev')"
fi
echo ""

echo "📁 Key Files Check:"
files=("README.md" "src/app/page.tsx" "src/components/ui/SocialProofCarousel.tsx" "src/lib/supabase.ts")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done
echo ""

echo "🐛 Known Issues:"
if [ -f "BUG-SOCIAL-PROOF-LEARNER-NAMES.md" ]; then
    echo "⚠️  Social proof learner names issue documented"
else
    echo "✅ No documented bugs found"
fi
echo ""

echo "🗄️  Database Files:"
sql_files=$(find . -name "*.sql" -type f | wc -l)
echo "Found $sql_files SQL files"
echo ""

echo "🌐 Environment:"
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
else
    echo "❌ .env.local missing (Supabase config needed)"
fi
echo ""

echo "📊 Project Summary:"
echo "- Tech Stack: Next.js 15, TypeScript, TailwindCSS, Supabase"
echo "- Core Features: Instructor search, booking system, social proof"
echo "- Current Focus: Social proof carousel and certificate uploads"
echo ""

echo "🎯 Next Steps:"
echo "1. Check browser console for runtime errors"
echo "2. Test social proof carousel functionality"
echo "3. Verify certificate upload system"
echo "4. Check Supabase connection and data"
echo ""

echo "Diagnostic complete! 🚀"

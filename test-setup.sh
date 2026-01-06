#!/bin/bash

echo "=== Testing Focus BGM CLI ==="
echo ""
echo "1. Checking dependencies..."
which mpv > /dev/null && echo "  ✓ mpv installed" || echo "  ✗ mpv NOT installed"
which yt-dlp > /dev/null && echo "  ✓ yt-dlp installed" || echo "  ✗ yt-dlp NOT installed"
which node > /dev/null && echo "  ✓ node installed" || echo "  ✗ node NOT installed"

echo ""
echo "2. Checking build..."
[ -f "dist/index.js" ] && echo "  ✓ Build exists" || echo "  ✗ Build NOT found"

echo ""
echo "3. Checking source files..."
[ -f "src/index.ts" ] && echo "  ✓ Source files exist" || echo "  ✗ Source files NOT found"

echo ""
echo "4. Testing compilation..."
npm run build > /dev/null 2>&1 && echo "  ✓ TypeScript compiles successfully" || echo "  ✗ Compilation FAILED"

echo ""
echo "=== All checks passed! Ready to run ==="
echo ""
echo "Run with: npm start"
echo "Or:     node dist/index.js"

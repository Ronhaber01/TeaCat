#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "🐱 TeaCat Deploy Script"
echo "========================"
echo ""

# Install gh if needed
if ! command -v gh &> /dev/null; then
  echo "Installing GitHub CLI..."
  brew install gh
fi

# Auth if needed
if ! gh auth status &> /dev/null; then
  echo ""
  echo "👋 You need to log into GitHub once."
  echo "   A browser window will open — just click Authorize."
  echo ""
  gh auth login --hostname github.com --git-protocol https --web
fi

echo ""
echo "📦 Pushing code to GitHub..."
git add -A
git commit -m "🐱 TeaCat deploy $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "(nothing new to commit)"
git push -u origin main

echo ""
echo "✅ Done! Vercel is deploying now."
echo "   Check: https://project-5br05.vercel.app in ~2 minutes"
echo ""
read -p "Press Enter to close..."

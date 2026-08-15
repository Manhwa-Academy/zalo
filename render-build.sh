#!/usr/bin/env bash
# Render build script

echo "📦 Installing all dependencies (including devDependencies)..."
npm install

echo "🔨 Building Next.js app..."
npm run build

echo "✅ Build complete!"

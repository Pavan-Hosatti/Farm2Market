#!/bin/bash
# 🚨 EMERGENCY DEPLOYMENT FIX SCRIPT
# Run this to fix all issues before judges arrive!

echo "================================"
echo "🚑 EMERGENCY FIX DEPLOYMENT"
echo "================================"
echo ""

# Step 1: Install missing dependencies locally (test first)
echo "📦 Step 1: Installing missing dependencies..."
cd backend
npm install algosdk@^2.7.0 pdfkit@^0.15.0
echo "✅ Dependencies installed!"
echo ""

# Step 2: Test backend locally
echo "🧪 Step 2: Testing backend locally..."
echo "Starting backend on http://localhost:5000"
echo "Press Ctrl+C when ready to deploy to Render"
npm start

# (User will Ctrl+C here to stop and continue)

# Step 3: Commit and push to GitHub
echo ""
echo "📤 Step 3: Deploying to GitHub (Render will auto-deploy)..."
cd ..
git add .
git commit -m "🚑 URGENT FIX: Add algosdk + pdfkit dependencies, fix bid controller"
git push origin main

echo ""
echo "✅ Pushed to GitHub!"
echo ""
echo "⏳ Now wait 2-3 minutes for Render to deploy..."
echo ""
echo "🔍 Check deployment status:"
echo "   https://dashboard.render.com"
echo ""
echo "================================"
echo "✅ DEPLOYMENT SCRIPT COMPLETE!"
echo "================================"

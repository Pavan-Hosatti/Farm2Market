# 🚨 EMERGENCY FIX DEPLOYMENT (Windows PowerShell)
# Run this to fix all issues before judges arrive!

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚑 EMERGENCY FIX DEPLOYMENT" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install missing dependencies
Write-Host "📦 Step 1: Installing missing dependencies..." -ForegroundColor Green
Set-Location backend
npm install algosdk@^2.7.0 pdfkit@^0.15.0
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 2: Commit and push
Write-Host "📤 Step 2: Deploying to GitHub..." -ForegroundColor Green
Set-Location ..
git add .
git commit -m "🚑 URGENT FIX: Add algosdk + pdfkit dependencies, fix bid controller"
git push origin main

Write-Host ""
Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Now wait 2-3 minutes for Render to deploy..." -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Check deployment status:" -ForegroundColor Cyan
Write-Host "   https://dashboard.render.com" -ForegroundColor White
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

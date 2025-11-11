#!/bin/bash

# Supabase Edge Functions Deployment Script
# Deploys all 8 demo system API endpoints

echo "🚀 Deploying Supabase Edge Functions for Demo System"
echo "=================================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# List of functions to deploy
functions=(
    "demo-initialize"
    "demo-vendor"
    "demo-order"
    "demo-inventory"
    "demo-pricing"
    "demo-progress"
    "demo-extend"
    "demo-cleanup"
)

# Counter for success/failure
success=0
failed=0

# Deploy each function
for func in "${functions[@]}"; do
    echo "📦 Deploying $func..."

    if supabase functions deploy "$func" --no-verify-jwt; then
        echo "   ✅ $func deployed successfully"
        ((success++))
    else
        echo "   ❌ $func deployment failed"
        ((failed++))
    fi
    echo ""
done

# Summary
echo "=================================================="
echo "📊 Deployment Summary"
echo "=================================================="
echo "✅ Successfully deployed: $success/$((success + failed))"
echo "❌ Failed: $failed/$((success + failed))"
echo ""

if [ $failed -eq 0 ]; then
    echo "🎉 All functions deployed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test endpoints with: curl or Postman"
    echo "2. Update frontend to use API endpoints"
    echo "3. Add data-demo attributes to UI"
    echo ""
    echo "See supabase/functions/README.md for testing instructions"
else
    echo "⚠️  Some functions failed to deploy. Check errors above."
    exit 1
fi

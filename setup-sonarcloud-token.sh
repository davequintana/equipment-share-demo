#!/bin/bash

# SonarCloud Token Setup Script
# This script helps you set up the SONAR_TOKEN for GitHub Actions

echo "🚀 SonarCloud Token Setup for GitHub Actions"
echo "============================================="
echo ""

# Check if GitHub CLI is available
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI detected!"
    echo ""
    echo "To add the SONAR_TOKEN secret using GitHub CLI:"
    echo "1. First, get your SonarCloud token (see instructions below)"
    echo "2. Then run: gh secret set SONAR_TOKEN"
    echo "3. Paste your token when prompted"
    echo ""
else
    echo "ℹ️  GitHub CLI not found. You'll need to add the secret manually."
    echo ""
fi

echo "📋 Step-by-Step Instructions:"
echo ""
echo "1. 🌐 Go to SonarCloud:"
echo "   https://sonarcloud.io"
echo ""
echo "2. 🔐 Sign in with your GitHub account"
echo ""
echo "3. ➕ Import your repository:"
echo "   - Click '+' → 'Analyze new project'"
echo "   - Select 'davequintana/equipment-share-demo'"
echo "   - Choose 'With GitHub Actions'"
echo ""
echo "4. 🔑 Generate a token:"
echo "   - Go to My Account → Security"
echo "   - Click 'Generate Tokens'"
echo "   - Name: 'GitHub Actions - equipment-share-demo'"
echo "   - Type: 'Project Analysis Token'"
echo "   - Project: 'davequintana_equipment-share-demo'"
echo "   - Expires: 'No expiration' (recommended)"
echo "   - Click 'Generate'"
echo "   - 📋 COPY THE TOKEN (you won't see it again!)"
echo ""
echo "5. 🔒 Add to GitHub repository:"
echo "   - Go to: https://github.com/davequintana/equipment-share-demo/settings/secrets/actions"
echo "   - Click 'New repository secret'"
echo "   - Name: SONAR_TOKEN"
echo "   - Value: [paste your token here]"
echo "   - Click 'Add secret'"
echo ""
echo "6. ✅ Test the setup:"
echo "   - Go to Actions tab: https://github.com/davequintana/equipment-share-demo/actions"
echo "   - Re-run the failed workflow or push a new commit"
echo "   - Watch the 'sonarcloud' job complete successfully"
echo ""

echo "🎯 Current Project Configuration:"
echo "  Project Key: davequintana_equipment-share-demo"
echo "  Organization: davequintana"
echo "  Repository: equipment-share-demo"
echo ""

echo "Need help? Check SONAR-SETUP-GUIDE.md for detailed instructions!"

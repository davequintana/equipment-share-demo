#!/bin/bash

# GitHub Pages Troubleshooting Script
# This script helps debug issues with GitHub Pages deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 GitHub Pages Troubleshooting${NC}"
echo "================================="
echo ""

# Get repository information
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Error: This is not a git repository${NC}"
    exit 1
fi

REPO_NAME=$(basename "$REPO_URL" .git)
GITHUB_USER=$(echo "$REPO_URL" | sed -n 's/.*github\.com[:/]\([^/]*\)\/.*/\1/p')

echo -e "${GREEN}✅ Repository:${NC} $GITHUB_USER/$REPO_NAME"
echo -e "${GREEN}✅ Expected URL:${NC} https://$GITHUB_USER.github.io/$REPO_NAME/"
echo ""

# Check if build exists
echo -e "${BLUE}📁 Checking build output...${NC}"
if [ -d "dist/apps/web-app-pages" ]; then
    echo -e "${GREEN}✅ Build directory exists${NC}"

    # Check for key files
    if [ -f "dist/apps/web-app-pages/index.pages.html" ]; then
        echo -e "${GREEN}✅ index.pages.html exists${NC}"
    else
        echo -e "${RED}❌ index.pages.html missing${NC}"
    fi

    if [ -f "dist/apps/web-app-pages/index.html" ]; then
        echo -e "${GREEN}✅ index.html exists${NC}"
    else
        echo -e "${YELLOW}⚠️  index.html missing (will be created in workflow)${NC}"
    fi

    if [ -f "dist/apps/web-app-pages/404.html" ]; then
        echo -e "${GREEN}✅ 404.html exists${NC}"
    else
        echo -e "${RED}❌ 404.html missing${NC}"
    fi

    if [ -f "dist/apps/web-app-pages/.nojekyll" ]; then
        echo -e "${GREEN}✅ .nojekyll exists${NC}"
    else
        echo -e "${YELLOW}⚠️  .nojekyll missing${NC}"
    fi

    echo ""
    echo -e "${BLUE}📋 Build contents:${NC}"
    ls -la dist/apps/web-app-pages/

else
    echo -e "${RED}❌ Build directory missing. Run: pnpm exec nx build-pages web-app${NC}"
    exit 1
fi

echo ""

# Check configuration files
echo -e "${BLUE}🔧 Checking configuration files...${NC}"

# Check Vite config
if [ -f "apps/web-app/vite.config.pages.ts" ]; then
    echo -e "${GREEN}✅ vite.config.pages.ts exists${NC}"
    BASE_PATH=$(grep -o "base: '[^']*'" apps/web-app/vite.config.pages.ts || echo "")
    if [[ $BASE_PATH == *"$REPO_NAME"* ]]; then
        echo -e "${GREEN}✅ Base path configured correctly: $BASE_PATH${NC}"
    else
        echo -e "${RED}❌ Base path incorrect: $BASE_PATH${NC}"
        echo -e "${YELLOW}   Should be: base: '/$REPO_NAME/'${NC}"
    fi
else
    echo -e "${RED}❌ vite.config.pages.ts missing${NC}"
fi

# Check HTML base href
if [ -f "apps/web-app/index.pages.html" ]; then
    echo -e "${GREEN}✅ index.pages.html exists${NC}"
    BASE_HREF=$(grep -o 'base href="[^"]*"' apps/web-app/index.pages.html || echo "")
    if [[ $BASE_HREF == *"$REPO_NAME"* ]]; then
        echo -e "${GREEN}✅ Base href configured correctly: $BASE_HREF${NC}"
    else
        echo -e "${RED}❌ Base href incorrect: $BASE_HREF${NC}"
        echo -e "${YELLOW}   Should be: base href=\"/$REPO_NAME/\"${NC}"
    fi
else
    echo -e "${RED}❌ index.pages.html missing${NC}"
fi

echo ""

# Check GitHub Actions workflow
echo -e "${BLUE}🤖 Checking GitHub Actions workflow...${NC}"
if [ -f ".github/workflows/deploy-pages.yml" ]; then
    echo -e "${GREEN}✅ deploy-pages.yml exists${NC}"

    # Check if workflow has the rename step
    if grep -q "mv.*index.pages.html.*index.html" .github/workflows/deploy-pages.yml; then
        echo -e "${GREEN}✅ File rename step configured${NC}"
    else
        echo -e "${RED}❌ File rename step missing${NC}"
    fi
else
    echo -e "${RED}❌ deploy-pages.yml missing${NC}"
fi

echo ""

# Check GitHub Pages status via API (if curl is available)
echo -e "${BLUE}🌐 Checking GitHub Pages status...${NC}"
if command -v curl >/dev/null 2>&1; then
    PAGES_STATUS=$(curl -s -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$GITHUB_USER/$REPO_NAME/pages" 2>/dev/null || echo "error")

    if [[ $PAGES_STATUS == *"\"status\":\"built\""* ]]; then
        echo -e "${GREEN}✅ GitHub Pages is enabled and built${NC}"
    elif [[ $PAGES_STATUS == *"\"status\""* ]]; then
        echo -e "${YELLOW}⚠️  GitHub Pages status: $(echo $PAGES_STATUS | grep -o '"status":"[^"]*"')${NC}"
    elif [[ $PAGES_STATUS == *"Not Found"* ]]; then
        echo -e "${RED}❌ GitHub Pages not enabled${NC}"
        echo -e "${YELLOW}   Enable at: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not check GitHub Pages status${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available, cannot check GitHub Pages status${NC}"
fi

echo ""

# Provide troubleshooting steps
echo -e "${BLUE}🔧 Troubleshooting Steps:${NC}"
echo "========================="
echo ""
echo -e "${YELLOW}1. Ensure GitHub Pages is enabled:${NC}"
echo "   • Go to: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
echo "   • Set Source to 'GitHub Actions'"
echo "   • Save settings"
echo ""
echo -e "${YELLOW}2. Check recent workflow runs:${NC}"
echo "   • Go to: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo "   • Look for 'Deploy to GitHub Pages' workflow"
echo "   • Check for any error messages"
echo ""
echo -e "${YELLOW}3. Force rebuild and deploy:${NC}"
echo "   git add ."
echo "   git commit -m \"fix: force GitHub Pages rebuild\""
echo "   git push origin main"
echo ""
echo -e "${YELLOW}4. Test locally:${NC}"
echo "   pnpm run build:pages"
echo "   pnpm run preview:pages"
echo "   # Then visit: http://localhost:4302/equipment-share-demo/"
echo ""
echo -e "${YELLOW}5. Common issues:${NC}"
echo "   • Check browser console for JavaScript errors"
echo "   • Verify all asset paths are correct"
echo "   • Ensure .nojekyll file is present"
echo "   • Check that build artifacts include index.html"
echo ""

echo -e "${GREEN}🎯 If all checks pass but site still shows 404:${NC}"
echo "   • Wait 5-10 minutes for GitHub Pages to update"
echo "   • Try visiting in incognito/private browsing mode"
echo "   • Clear browser cache and cookies"
echo "   • Check browser developer tools Network tab"

echo ""
echo -e "${BLUE}📚 Documentation:${NC} docs/github-pages.md"
echo -e "${BLUE}🆘 SPA Routing Fix:${NC} docs/spa-routing-fix.md"

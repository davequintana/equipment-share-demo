#!/bin/bash

# GitHub Pages Setup Script
# This script helps configure the repository for GitHub Pages deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 GitHub Pages Setup for Enterprise NX Monorepo${NC}"
echo "=================================================="
echo ""

# Get repository information
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Error: This is not a git repository or has no remote origin${NC}"
    echo "Please initialize git and add a remote origin first:"
    echo "  git init"
    echo "  git remote add origin https://github.com/username/repository.git"
    exit 1
fi

# Extract repository name from URL
REPO_NAME=$(basename "$REPO_URL" .git)
GITHUB_USER=$(echo "$REPO_URL" | sed -n 's/.*github\.com[:/]\([^/]*\)\/.*/\1/p')

echo -e "${GREEN}✅ Repository detected:${NC} $GITHUB_USER/$REPO_NAME"
echo ""

# Function to update file with repository name
update_repo_name() {
    local file="$1"
    local old_name="equipment-share-demo"

    if [ -f "$file" ]; then
        if grep -q "$old_name" "$file"; then
            echo -e "${YELLOW}📝 Updating $file...${NC}"
            sed -i.bak "s/$old_name/$REPO_NAME/g" "$file" 2>/dev/null || \
            sed -i "s/$old_name/$REPO_NAME/g" "$file"
            rm -f "$file.bak" 2>/dev/null || true
            echo -e "${GREEN}✅ Updated repository name in $file${NC}"
        else
            echo -e "${BLUE}ℹ️  $file doesn't need updates${NC}"
        fi
    else
        echo -e "${RED}⚠️  $file not found${NC}"
    fi
}

# Update repository name in configuration files
echo -e "${BLUE}🔧 Updating configuration files...${NC}"
echo ""

update_repo_name "apps/web-app/vite.config.pages.ts"
update_repo_name "apps/web-app/index.pages.html"
update_repo_name "apps/web-app/public/404.html"
update_repo_name "docs/github-pages.md"
update_repo_name "README.md"

echo ""

# Test the build
echo -e "${BLUE}🧪 Testing GitHub Pages build...${NC}"
if pnpm exec nx build-pages web-app; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Please check the errors above.${NC}"
    exit 1
fi

echo ""

# Instructions
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "=============="
echo ""
echo "1. ${YELLOW}Commit and push your changes:${NC}"
echo "   git add ."
echo "   git commit -m \"feat: setup GitHub Pages deployment\""
echo "   git push origin main"
echo ""
echo "2. ${YELLOW}Enable GitHub Pages (Choose ONE method):${NC}"
echo ""
echo "   ${BLUE}Method A: Manual Setup (Recommended)${NC}"
echo "   • Go to: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
echo "   • Set Source to 'GitHub Actions'"
echo "   • Save the settings"
echo ""
echo "   ${BLUE}Method B: Automated Setup${NC}"
echo "   • Go to: https://github.com/$GITHUB_USER/$REPO_NAME/actions/workflows/enable-pages.yml"
echo "   • Click 'Run workflow'"
echo "   • Enter repository name: $REPO_NAME"
echo "   • Click 'Run workflow'"
echo ""
echo "3. ${YELLOW}Trigger deployment:${NC}"
echo "   • Push to main branch triggers automatic deployment"
echo "   • Or manually run the 'Deploy to GitHub Pages' workflow"
echo ""
echo "4. ${YELLOW}View your deployed app:${NC}"
echo "   🌐 https://$GITHUB_USER.github.io/$REPO_NAME/"
echo ""
echo "4. ${YELLOW}Optional - Set up custom domain:${NC}"
echo "   • Add a CNAME record in your DNS settings"
echo "   • Add your domain in repository settings"
echo ""

# Preview option
echo -e "${BLUE}🚀 Want to preview locally?${NC}"
echo "Run: ${YELLOW}pnpm run preview:pages${NC}"
echo ""

echo -e "${GREEN}🎉 GitHub Pages setup complete!${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC} docs/github-pages.md"
echo -e "${BLUE}🆘 Need help?${NC} Check the troubleshooting section in the docs"

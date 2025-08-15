# 🚀 SonarCloud Setup Guide

## ⚡ Quick Setup (5 minutes)

### 1. Create SonarCloud Account & Project

1. Go to [SonarCloud.io](https://sonarcloud.io) and sign in with GitHub
2. Click "+" → "Analyze new project"
3. Select your `equipment-share-demo` repository
4. Choose "With GitHub Actions" as the analysis method

### 2. Get Your SonarCloud Token

1. In SonarCloud, go to **My Account** → **Security**
2. Generate a new token:
   - **Name**: `GitHub Actions - equipment-share-demo`
   - **Type**: `Project Analysis Token`
   - **Project**: `davequintana_equipment-share-demo`
   - **Expires**: `No expiration` (or 90 days)
3. **Copy the token** (you won't see it again!)

### 3. Add Token to GitHub Repository

1. Go to your GitHub repo: `https://github.com/davequintana/equipment-share-demo`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   - **Name**: `SONAR_TOKEN`
   - **Value**: `[paste your SonarCloud token here]`
5. Click **"Add secret"**

### 4. Test the Setup

1. Push any commit to trigger the CI pipeline
2. Go to **Actions** tab in GitHub
3. Watch the `sonarcloud` job complete successfully
4. Check your SonarCloud dashboard for analysis results

## 🎯 Current Configuration

Your project is already configured with:

- ✅ **Project Key**: `davequintana_equipment-share-demo`
- ✅ **Organization**: `davequintana`  
- ✅ **Coverage**: Integrated with test results
- ✅ **Quality Gate**: Enabled with waiting
- ✅ **TypeScript**: Configured for monorepo structure

## 🔍 What SonarCloud Will Analyze

**Included:**

- `apps/` - Your React app and Fastify API
- `libs/` - Shared libraries and utilities

**Excluded:**

- Test files (`*.test.ts`, `*.spec.tsx`, etc.)
- Configuration files (`*.config.ts`, etc.)
- Build outputs (`dist/`, `coverage/`)
- Infrastructure code (`infrastructure/`)

## 🚨 Troubleshooting

**Token Issues:**

- Make sure the token name in GitHub matches: `SONAR_TOKEN`
- Verify the token has project analysis permissions
- Check token hasn't expired

**Analysis Issues:**

- Ensure coverage files are generated before SonarCloud step
- Check that source paths (`apps`, `libs`) exist in your repo
- Verify no syntax errors in TypeScript files

## 📊 Next Steps

Once setup is complete:

1. **Quality Gate**: Configure custom rules in SonarCloud dashboard
2. **Pull Request Analysis**: Automatic analysis on every PR
3. **Coverage Goals**: Set minimum coverage thresholds
4. **Security Hotspots**: Review and resolve security issues

---

**Need help?** Check the full documentation in `docs/SONARCLOUD_SETUP.md`

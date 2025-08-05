# GitHub Pages Deployment Guide

This guide explains how to deploy your Enterprise NX Monorepo application to GitHub Pages.

## 🌐 Live Demo

Your application is automatically deployed to GitHub Pages at:

<https://davequintana.github.io/equipment-share-demo/>

## 📋 Setup Instructions

### 1. Repository Settings

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Set **Source** to "GitHub Actions"
4. Save the settings

### 2. Update Repository Name

Update the base path in the following files to match your repository name:

**`apps/web-app/vite.config.pages.ts`**:
```typescript
base: '/your-repository-name/', // Update this
```

**`apps/web-app/index.pages.html`**:
```html
<base href="/your-repository-name/" />
```

**`.github/workflows/deploy-pages.yml`**:
```yaml
# Update the repository name references
```

### 3. Configure API Endpoint (Optional)

If your application needs to connect to a backend API, update the API URL:

**`.github/workflows/deploy-pages.yml`**:

```yaml
env:
  VITE_API_URL: https://your-api-domain.com
```

**📋 Note**: By default, the app runs in Demo Mode with mock API responses. See [API Configuration Guide](github-pages-api.md) for details on connecting a real backend.

## 🚀 Deployment Process

### First-Time Setup

**Method 1: Manual Setup (Recommended)**

1. Go to your repository **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. Save the settings

**Method 2: Automated Setup**

1. Go to **Actions** tab in your repository
2. Find **Enable GitHub Pages** workflow
3. Click **Run workflow**
4. Enter your repository name
5. Click **Run workflow**

### Automatic Deployment

The application automatically deploys when:

- Code is pushed to `main` branch
- Pull requests are opened (build only)
- Manual workflow dispatch is triggered

### Manual Deployment

1. Go to **Actions** tab in your repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## 🏗️ Build Configuration

### GitHub Pages Build Target

A special build target `build-pages` is configured for GitHub Pages:

```bash
# Build for GitHub Pages
pnpm exec nx build-pages web-app

# Development build
pnpm exec nx build web-app
```

### Key Differences

| Feature | Standard Build | GitHub Pages Build |
|---------|----------------|-------------------|
| **SSR** | ✅ Enabled | ❌ Static only |
| **Base Path** | `/` | `/repository-name/` |
| **Entry Points** | Multiple | Single (client) |
| **Output** | `dist/apps/web-app` | `dist/apps/web-app-pages` |
| **Configuration** | `vite.config.ts` | `vite.config.pages.ts` |

## 📁 File Structure

```
apps/web-app/
├── index.html              # SSR index file
├── index.pages.html        # GitHub Pages index file
├── vite.config.ts          # Standard Vite config
├── vite.config.pages.ts    # GitHub Pages Vite config
└── src/
    ├── client/main.tsx     # Client entry point
    └── server/             # SSR server (not used in Pages)
```

## 🔧 Troubleshooting

### Build Fails

1. Check that all dependencies are installed
2. Verify the build target exists: `pnpm exec nx show project web-app`
3. Run the build locally: `pnpm exec nx build-pages web-app`

### Pages Not Loading

1. Verify repository name matches the base path configuration
2. Check GitHub Pages settings are correct
3. Ensure the workflow completed successfully

### Assets Not Loading

1. Check that the base path is correctly set
2. Verify asset paths in the built files are relative
3. Check browser console for 404 errors

### API Calls Failing

1. Update `VITE_API_URL` in the workflow
2. Ensure CORS is configured on your API
3. Check that API endpoints support HTTPS

## 🎯 Performance Optimization

The GitHub Pages build includes several optimizations:

- **Bundle Splitting**: Automatic code splitting for better caching
- **Asset Optimization**: Images and assets are optimized
- **Minification**: JavaScript and CSS are minified
- **Tree Shaking**: Unused code is removed
- **Compression**: Files are compressed for faster loading

## 🔒 Security

- Console logs are removed in production
- Source maps are disabled for security
- Environment variables are properly configured
- Assets are served over HTTPS

## 📊 Monitoring

Check deployment status:
- **Actions Tab**: View workflow runs and logs
- **Environment Tab**: See deployment history
- **Pages Settings**: Monitor domain and HTTPS status

## 🚀 Advanced Configuration

### Custom Domain

1. Add a `CNAME` file to the `public` directory:
   ```
   your-domain.com
   ```

2. Update the base path to `/` in configuration files

3. Configure DNS records with your domain provider

### Environment Variables

Add secrets in GitHub repository settings:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add environment-specific variables
3. Reference them in the workflow file

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Static Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [NX Deploy Documentation](https://nx.dev/concepts/deployments)

---

*This deployment guide is part of the Enterprise NX Monorepo template featuring React 19, TypeScript, and modern DevOps practices.*

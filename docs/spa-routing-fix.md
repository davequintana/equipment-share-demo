# GitHub Pages SPA Routing Fix

## 🔧 Issue: 404 Page Appearing Instead of React App

**Problem**: When accessing GitHub Pages, users were seeing the 404 page instead of the React application.

**Root Cause**: React Router's `BrowserRouter` wasn't configured with the correct `basename` for GitHub Pages subdirectory hosting.

## ✅ Solution Implemented

### 1. **Fixed React Router Configuration**

**File**: `apps/web-app/src/client/main.tsx`

```tsx
// Added automatic basename detection
const getBasename = () => {
  const baseElement = document.querySelector('base');
  if (baseElement && baseElement.href) {
    const url = new URL(baseElement.href);
    return url.pathname;
  }
  return '/';
};

// Updated BrowserRouter with basename
<BrowserRouter basename={getBasename()}>
  <App />
</BrowserRouter>
```

### 2. **Enhanced 404.html for SPA Routing**

**File**: `apps/web-app/public/404.html`

```javascript
// Smart redirection logic
const currentPath = window.location.pathname;
const basePath = '/equipment-share-demo/';

if (currentPath !== basePath && currentPath.startsWith(basePath)) {
  const route = currentPath.substring(basePath.length);
  if (route) {
    sessionStorage.setItem('github-pages-route', '/' + route);
  }
  window.location.replace(basePath);
}
```

### 3. **Route Recovery System**

**Feature**: Automatic route restoration after GitHub Pages redirect

```tsx
// Handle stored routes from 404 redirect
const handleStoredRoute = () => {
  const storedRoute = sessionStorage.getItem('github-pages-route');
  if (storedRoute) {
    sessionStorage.removeItem('github-pages-route');
    window.history.replaceState(null, '', getBasename() + storedRoute.substring(1));
  }
};
```

## 🎯 How It Works

### GitHub Pages Subdirectory Hosting
- **Repository**: `davequintana/equipment-share-demo`
- **Base URL**: `https://davequintana.github.io/equipment-share-demo/`
- **Challenge**: React Router expects `/` but GitHub serves from `/equipment-share-demo/`

### Smart Routing Flow
1. **User visits**: `https://davequintana.github.io/equipment-share-demo/profile`
2. **GitHub Pages**: Serves `404.html` (no physical file exists)
3. **404.html Script**: Detects route `/profile`, stores it, redirects to base
4. **React App Loads**: At base path with correct basename
5. **Route Recovery**: Restores original route `/profile` using `window.history`
6. **React Router**: Handles routing normally within the app

## 🚀 Testing the Fix

### Local Testing
```bash
# Build and preview locally
pnpm run build:pages
pnpm run preview:pages

# Test different routes
# http://localhost:4302/equipment-share-demo/
# http://localhost:4302/equipment-share-demo/profile
# http://localhost:4302/equipment-share-demo/dashboard
```

### Production Testing
```bash
# After deployment, test these URLs:
# https://davequintana.github.io/equipment-share-demo/
# https://davequintana.github.io/equipment-share-demo/profile  
# https://davequintana.github.io/equipment-share-demo/dashboard
```

## 🔍 Debugging

### Common Issues
1. **Still seeing 404?** 
   - Check that GitHub Pages is enabled
   - Verify base href in `index.pages.html`
   - Ensure deployment completed successfully

2. **Routes not working?**
   - Check browser console for JavaScript errors
   - Verify React Router routes are defined correctly
   - Test with browser dev tools network tab

3. **Assets not loading?**
   - Verify base path in `vite.config.pages.ts`
   - Check asset paths in browser dev tools

### Debug Commands
```bash
# Check current configuration
grep -r "equipment-share-demo" apps/web-app/
grep -r "basename" apps/web-app/src/

# Verify build output
ls -la dist/apps/web-app-pages/
cat dist/apps/web-app-pages/index.pages.html | grep base
```

## 📋 Configuration Files Updated

| File | Purpose | Changes |
|------|---------|---------|
| `src/client/main.tsx` | React Router setup | Added basename detection and route recovery |
| `index.pages.html` | HTML template | Correct base href for GitHub Pages |
| `public/404.html` | SPA fallback | Smart routing and redirect logic |
| `vite.config.pages.ts` | Build config | Base path for asset resolution |

## ✅ Benefits

- **🚀 Fast Navigation**: Client-side routing works properly
- **📱 Direct Links**: Deep links work from anywhere
- **🔄 Refresh Safe**: Page refreshes maintain current route
- **🎯 SEO Ready**: Proper URL structure for search engines
- **⚡ Performance**: No unnecessary redirects in normal operation

## 🔧 Maintenance

### When Adding New Routes
1. Add route to React Router in `app.tsx`
2. No additional configuration needed
3. 404.html automatically handles new routes

### When Changing Repository Name
1. Run the setup script: `./scripts/setup-github-pages.sh`
2. Script automatically updates all references
3. Redeploy to apply changes

---

*This fix ensures your React SPA works seamlessly with GitHub Pages subdirectory hosting while maintaining all modern routing capabilities.*

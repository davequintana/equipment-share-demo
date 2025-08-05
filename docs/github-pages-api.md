# GitHub Pages API Configuration

## 🎭 Demo Mode (Current Setup)

The GitHub Pages deployment is currently configured to run in **Demo Mode** with mock API responses. This allows the full application to work without requiring a real backend server.

### How Demo Mode Works

1. **Detection**: Automatically detects GitHub Pages hosting (`github.io` domain)
2. **Mock API**: Replaces all fetch requests to `/api/*` with mock responses
3. **Visual Indicator**: Shows a demo banner at the top of the app
4. **Realistic Experience**: Simulates network delays and authentication flows

### Demo Credentials

- **Email**: `demo@example.com` (or any email)
- **Password**: Any password
- **Registration**: Works with any email/password combination

## 🔗 Connecting a Real API

To connect your GitHub Pages app to a real backend API:

### Option 1: Update Environment Variable

1. **Edit `.github/workflows/deploy-pages.yml`**:
   ```yaml
   env:
     VITE_API_URL: https://your-api-domain.com  # Replace with your API URL
   ```

2. **Deploy**: Push changes to trigger redeployment

### Option 2: Use GitHub Secrets

1. **Add Secret**: Go to repository Settings → Secrets → Actions
   - Name: `PRODUCTION_API_URL`
   - Value: `https://your-api-domain.com`

2. **Update Workflow**:
   ```yaml
   env:
     VITE_API_URL: ${{ secrets.PRODUCTION_API_URL }}
   ```

### API Requirements

Your API must support:

- **CORS**: Allow requests from `https://davequintana.github.io`
- **HTTPS**: GitHub Pages requires secure connections
- **Endpoints**: Match the expected API structure

#### Required Endpoints

```
POST /api/auth/login
POST /api/auth/register
GET  /api/users/profile
PUT  /api/users/profile
```

#### Example CORS Configuration

```javascript
// Express.js example
app.use(cors({
  origin: ['https://davequintana.github.io', 'http://localhost:4201'],
  credentials: true
}));
```

## 🏗️ API Hosting Options

### Recommended Platforms

1. **Railway**: Easy deployment, automatic HTTPS
2. **Render**: Free tier with managed databases
3. **Fly.io**: Global deployment, Docker support
4. **Vercel**: Serverless functions
5. **AWS/GCP/Azure**: Enterprise solutions

### Quick Deploy with Railway

1. **Fork the API**: Create a copy of the Fastify API
2. **Connect Railway**: Link your GitHub repository
3. **Deploy**: Railway automatically builds and deploys
4. **Get URL**: Copy the provided domain
5. **Update Workflow**: Use the Railway URL in GitHub Actions

## 🔧 Development vs Production

| Environment | API URL | Mode |
|-------------|---------|------|
| **Local Development** | `http://localhost:3334` | Real API |
| **GitHub Pages (Demo)** | `https://api.your-domain.com` | Demo Mode |
| **GitHub Pages (Real)** | Your deployed API URL | Real API |

## 🎯 Current Status

- ✅ **Demo Mode Active**: App works with mock data
- ✅ **Authentication**: Login/register with any credentials
- ✅ **Routing**: All pages and navigation work
- ✅ **UI**: Full React application functionality
- ⏳ **Real API**: Connect your deployed backend

## 🚀 Next Steps

1. **Deploy API**: Choose a hosting platform and deploy your Fastify API
2. **Update Config**: Replace `https://api.your-domain.com` with your API URL
3. **Test**: Verify all functionality works with real backend
4. **Monitor**: Set up logging and error tracking

---

*The demo mode provides a complete application experience while you set up your production API infrastructure.*

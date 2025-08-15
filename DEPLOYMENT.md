# 🚀 Release-Based Automatic Deployment Guide

## Overview

This project uses **release-based automatic deployment** triggered by version tags. When you create a version tag, the system automatically:

1. ✅ Builds and tests the application
2. ✅ Creates a GitHub release with changelog
3. ✅ Builds and pushes Docker images with version tags
4. ✅ Generates production-ready deployment files
5. ✅ Provides deployment artifacts for your server

## 🏷️ Creating a Release

### 1. Create and Push a Version Tag

```bash

# Create a version tag (e.g., v1.0.0, v1.0.1, v2.0.0)

git tag v1.0.0

# Push the tag to trigger the release workflow

git push origin v1.0.0
```

### 2. What Happens Automatically

The release workflow will:

- **Build & Test**: Run all tests to ensure quality
- **Create Release**: Generate a GitHub release with automatic changelog
- **Build Docker Images**: Create versioned images:
  - `ghcr.io/davequintana/equipment-share-demo/web-app:1.0.0`
  - `ghcr.io/davequintana/equipment-share-demo/fastify-api:1.0.0`
  - `ghcr.io/davequintana/equipment-share-demo/web-app:latest`
  - `ghcr.io/davequintana/equipment-share-demo/fastify-api:latest`

## 📦 Deployment Process

### Option 1: Download Deployment Artifacts (Recommended)

1. **Go to the GitHub Actions run** for your release
2. **Download the deployment artifacts** (e.g., `deployment-1.0.0.zip`)
3. **Extract on your production server**:

   ```bash
   unzip deployment-1.0.0.zip
   cd deployment/
   ```

4. **Set up secrets** (create `.env` file):

   ```bash
   # Copy and edit the environment variables
   nano .env
   ```

5. **Run the deployment**:
  
   ```bash
   ./deploy.sh
   ```

### Option 2: Manual Docker Commands

```bash

# Pull the specific version

docker pull ghcr.io/davequintana/equipment-share-demo/web-app:1.0.0
docker pull ghcr.io/davequintana/equipment-share-demo/fastify-api:1.0.0

# Use with your existing docker-compose.yml

docker-compose up -d
```

## 🔒 Required Secrets

**⚠️ SECURITY NOTICE**: As of the latest release, all production deployments require properly configured secrets. No default or fallback values are used for security-sensitive configuration.

Add these secrets to your GitHub repository for production deployment:

1. **Go to GitHub Repository → Settings → Secrets and Variables → Actions**
2. **Add the following secrets**:

| Secret Name         | Description                  | Security Requirements                        | Example                                   |
| ------------------- | ---------------------------- | -------------------------------------------- | ----------------------------------------- |
| `POSTGRES_PASSWORD` | PostgreSQL database password | Strong password (12+ chars, mixed case, numbers, symbols) | `MyStr0ngP@ssw0rd123!`                 |
| `JWT_SECRET`        | JWT signing secret           | Cryptographically secure random string (32+ chars) | `a1b2c3d4e5f6789012345678901234567890abcdef` |

### Security Validation

The deployment process now includes automatic security validation:

- ✅ **Secret Validation**: Deployment fails if required secrets are not set
- ✅ **No Fallback Values**: No default/weak values used in production
- ✅ **Runtime Checks**: Deployment script validates secrets before starting services
- ⚠️ **Manual Server Setup**: If deploying manually, ensure environment variables are set:

```bash

# Required environment variables on your production server

export POSTGRES_PASSWORD="your-secure-db-password"
export JWT_SECRET="your-cryptographically-secure-jwt-secret"
```

## 🌍 Environment Setup

### Production Server Requirements

- **Docker** and **Docker Compose** installed
- **Ports** 80, 3334, 5432, 6379 available
- **Minimum 2GB RAM** recommended

### Environment Variables

The deployment automatically sets up:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://enterprise:${POSTGRES_PASSWORD}@postgres:5432/enterprise_db
REDIS_URL=redis://redis:6379
JWT_SECRET=${JWT_SECRET}
API_URL=http://fastify-api:3334
PORT=3334
```

## 📊 Monitoring Deployment

After deployment, your services will be available at:

- **🌐 Web Application**: [http://your-server](http://your-server)
- **🔌 API**: <http://your-server:3334>
- **📊 Health Checks**: [http://your-server:3334/health](http://your-server:3334/health)

### Check Service Status

```bash

# View running services

docker-compose -f docker-compose.prod.yml ps

# View logs

docker-compose -f docker-compose.prod.yml logs -f

# Check health

curl http://localhost:3334/health
```

## 🔄 Rollback Process

To rollback to a previous version:

```bash

# Pull the previous version

docker pull ghcr.io/davequintana/equipment-share-demo/web-app:1.0.0
docker pull ghcr.io/davequintana/equipment-share-demo/fastify-api:1.0.0

# Update docker-compose.prod.yml with the previous version tags


# Then restart services

docker-compose -f docker-compose.prod.yml up -d
```

## 🚨 Troubleshooting

### Common Issues

1. **Images not found**: Ensure the release workflow completed successfully
2. **Port conflicts**: Check that ports 80, 3334, 5432, 6379 are available
3. **Database connection issues**: Verify POSTGRES_PASSWORD secret is set
4. **JWT errors**: Ensure JWT_SECRET is properly configured

### Logs and Debugging

```bash

# View all logs

docker-compose -f docker-compose.prod.yml logs

# View specific service logs

docker-compose -f docker-compose.prod.yml logs web-app
docker-compose -f docker-compose.prod.yml logs fastify-api

# Check service health

docker-compose -f docker-compose.prod.yml exec web-app wget -qO- http://localhost:3000
docker-compose -f docker-compose.prod.yml exec fastify-api wget -qO- http://localhost:3334/health
```

## 📈 Release Workflow Features

- ✅ **Automated Testing**: Runs full test suite before release
- ✅ **Semantic Versioning**: Supports v1.0.0, v1.0.1, v2.0.0 format
- ✅ **Automatic Changelog**: Generates release notes from git commits
- ✅ **Multi-platform**: Builds for linux/amd64
- ✅ **Docker Layer Caching**: Optimized build times
- ✅ **Health Checks**: Built-in service monitoring
- ✅ **Zero-downtime**: Rolling deployment with health checks
- ✅ **Rollback Ready**: Version-tagged images for easy rollback

## 🎯 Best Practices

1. **Use semantic versioning**: v1.0.0, v1.1.0, v2.0.0
2. **Test before tagging**: Ensure main branch is stable
3. **Write meaningful commit messages**: Used in automatic changelog
4. **Monitor deployments**: Check logs after each release
5. **Keep secrets secure**: Never commit secrets to git
6. **Regular backups**: Backup database before major releases

---

🎉 **Happy Deploying!** Your release-based deployment is now ready to use.

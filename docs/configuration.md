# Configuration

## Environment Configuration

### Environment Variables

The application uses environment variables for configuration across different environments. Create appropriate `.env` files for each environment.

#### Development (.env)

```bash

# Application

NODE_ENV=development
PORT=3334

# Database

DATABASE_URL=postgresql://enterprise:password@localhost:5432/enterprise_db
DATABASE_LOGGING=true
DATABASE_POOL_SIZE=10

# Redis

REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Authentication

JWT_SECRET=your-development-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# API URLs

REACT_APP_FASTIFY_API_URL=http://localhost:3334
REACT_APP_FASTIFY_API_URL=http://localhost:3334

# Kafka

KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=enterprise-app-dev

# Security

CORS_ORIGINS=http://localhost:4200
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
BCRYPT_SALT_ROUNDS=10

# Logging

LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

#### Production (.env.production)

```bash

# Application

NODE_ENV=production
PORT=3334

# Database (use AWS RDS)

DATABASE_URL=postgresql://enterprise:secure-password@your-rds-endpoint.amazonaws.com:5432/enterprise_db
DATABASE_SSL=true
DATABASE_POOL_SIZE=20
DATABASE_POOL_IDLE_TIMEOUT=30000

# Redis (use AWS ElastiCache)

REDIS_URL=redis://your-elasticache-endpoint.cache.amazonaws.com:6379
REDIS_TTL=7200

# Authentication

JWT_SECRET=your-super-secure-256-bit-production-secret-key
JWT_EXPIRES_IN=24h

# API URLs

REACT_APP_FASTIFY_API_URL=https://api.yourdomain.com
REACT_APP_FASTIFY_API_URL=https://api-v2.yourdomain.com

# Kafka (use AWS MSK)

KAFKA_BROKERS=your-msk-cluster.amazonaws.com:9092
KAFKA_CLIENT_ID=enterprise-app-prod

# Security

CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=3
BCRYPT_SALT_ROUNDS=12

# AWS

AWS_REGION=us-east-1
S3_BUCKET=your-app-assets-bucket

# Logging

LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=false
ENABLE_METRICS=true

# SSL/TLS

FORCE_HTTPS=true
HSTS_MAX_AGE=31536000
```

#### Testing (.env.test)

```bash

# Application

NODE_ENV=test
PORT=3334

# Database (use test database)

DATABASE_URL=postgresql://test:test@localhost:5433/test_db
DATABASE_LOGGING=false
DATABASE_POOL_SIZE=5

# Redis

REDIS_URL=redis://localhost:6380
REDIS_TTL=300

# Authentication

JWT_SECRET=test-jwt-secret-key
JWT_EXPIRES_IN=1h

# Disable external services in tests

KAFKA_ENABLED=false
METRICS_ENABLED=false
```

## NX Configuration

### Workspace Configuration (nx.json)

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "npmScope": "enterprise",
  "affected": {
    "defaultBase": "origin/main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test", "e2e"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
    },
    "e2e": {
      "inputs": ["default", "^production"]
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)", "!{projectRoot}/tsconfig.spec.json", "!{projectRoot}/jest.config.[jt]s", "!{projectRoot}/.eslintrc.json", "!{projectRoot}/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
    "sharedGlobals": []
  },
  "generators": {
    "@nx/react": {
      "application": {
        "style": "none",
        "linter": "eslint",
        "bundler": "vite"
      },
      "component": {
        "style": "none"
      },
      "library": {
        "style": "none",
        "linter": "eslint"
      }
    }
  }
}
```

### Project Configuration Examples

#### React App (apps/web-app/project.json)

```json
{
  "name": "web-app",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/web-app/src",
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "outputPath": "dist/apps/web-app"
      },
      "configurations": {
        "development": {
          "mode": "development"
        },
        "production": {
          "mode": "production"
        }
      }
    },
    "serve": {
      "executor": "@nx/vite:dev-server",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "web-app:build"
      },
      "configurations": {
        "development": {
          "buildTarget": "web-app:build:development",
          "hmr": true
        },
        "production": {
          "buildTarget": "web-app:build:production",
          "hmr": false
        }
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{options.reportsDirectory}"],
      "options": {
        "passWithNoTests": true,
        "reportsDirectory": "../../coverage/apps/web-app"
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/web-app/**/*.{ts,tsx,js,jsx}"]
      }
    },
    "storybook": {
      "executor": "@nx/storybook:storybook",
      "options": {
        "port": 4400,
        "configDir": "apps/web-app/.storybook"
      },
      "configurations": {
        "ci": {
          "quiet": true
        }
      }
    }
  },
  "tags": ["scope:web-app", "type:app"]
}
```

#### API Project (apps/fastify-api/project.json)

```json
{
  "name": "fastify-api",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/fastify-api/src",
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "outputs": ["{options.outputPath}"],
      "defaultConfiguration": "production",
      "options": {
        "target": "node",
        "compiler": "tsc",
        "outputPath": "dist/apps/fastify-api",
        "main": "apps/fastify-api/src/main.ts",
        "tsConfig": "apps/fastify-api/tsconfig.app.json",
        "assets": ["apps/fastify-api/src/assets"]
      },
      "configurations": {
        "development": {},
        "production": {
          "optimization": true,
          "extractLicenses": true,
          "inspect": false,
          "fileReplacements": [
            {
              "replace": "apps/fastify-api/src/environments/environment.ts",
              "with": "apps/fastify-api/src/environments/environment.prod.ts"
            }
          ]
        }
      }
    },
    "serve": {
      "executor": "@nx/js:node",
      "defaultConfiguration": "development",
      "options": {
        "buildTarget": "fastify-api:build"
      },
      "configurations": {
        "development": {
          "buildTarget": "fastify-api:build:development"
        },
        "production": {
          "buildTarget": "fastify-api:build:production"
        }
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/fastify-api/jest.config.ts",
        "passWithNoTests": true
      },
      "configurations": {
        "ci": {
          "ci": true,
          "coverage": true
        }
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/fastify-api/**/*.ts"]
      }
    }
  },
  "tags": ["scope:fastify-api", "type:api"]
}
```

## Build Configuration

### Vite Configuration (apps/web-app/vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web-app',

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [react(), nxViteTsPaths(), vanillaExtractPlugin()],

  build: {
    outDir: '../../dist/apps/web-app',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@vanilla-extract/css'],
        },
      },
    },
  },

  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/web-app',
      provider: 'v8',
    },
  },
});
```

### TypeScript Configuration

#### Root TypeScript Config (tsconfig.base.json)

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "es2015",
    "module": "esnext",
    "lib": ["es2020", "dom"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@enterprise/shared-types": ["libs/shared-types/src/index.ts"],
      "@enterprise/utils": ["libs/utils/src/index.ts"],
      "@enterprise/ui-components": ["libs/ui-components/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp"]
}
```

#### App-specific TypeScript Config (apps/web-app/tsconfig.json)

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "allowJs": false,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["vite/client", "vitest"]
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ],
  "extends": "../../tsconfig.base.json"
}
```

## Docker Configuration

### Development Docker Compose

```yaml

# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: enterprise_db
      POSTGRES_USER: enterprise
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/database/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - '9092:9092'
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - '2181:2181'

volumes:
  postgres_data:
  redis_data:
```

### Production Docker Compose

```yaml

# docker-compose.prod.yml

version: '3.8'

services:
  web-app:
    build:
      context: .
      dockerfile: infrastructure/docker/web-app.Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  fastify-api:
    build:
      context: .
      dockerfile: infrastructure/docker/fastify-api.Dockerfile
    ports:
      - "3334:3334"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    depends_on:
      - postgres
      - redis

  fastify-api:
    build:
      context: .
      dockerfile: infrastructure/docker/fastify-api.Dockerfile
    ports:
      - "3334:3334"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
```

## Kubernetes Configuration

### ConfigMap

```yaml

# k8s/configmap.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: enterprise-app
data:
  NODE_ENV: 'production'
  LOG_LEVEL: 'info'
  CORS_ORIGINS: 'https://yourdomain.com'
  RATE_LIMIT_WINDOW_MS: '900000'
  RATE_LIMIT_MAX_ATTEMPTS: '3'
  BCRYPT_SALT_ROUNDS: '12'
  JWT_EXPIRES_IN: '24h'
```

### Secrets

```yaml

# k8s/secrets.yaml

apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: enterprise-app
type: Opaque
stringData:
  database-url: 'postgresql://enterprise:password@postgres:5432/enterprise_db'
  redis-url: 'redis://redis:6379'
  jwt-secret: 'your-production-jwt-secret'
```

## Linting Configuration

### ESLint Configuration (.eslintrc.json)

```json
{
  "root": true,
  "ignorePatterns": ["**/*"],
  "plugins": ["@nx"],
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        "@nx/enforce-module-boundaries": [
          "error",
          {
            "enforceBuildableLibDependency": true,
            "allow": [],
            "depConstraints": [
              {
                "sourceTag": "*",
                "onlyDependOnLibsWithTags": ["*"]
              }
            ]
          }
        ]
      }
    },
    {
      "files": ["*.ts", "*.tsx"],
      "extends": ["@nx/typescript"],
      "rules": {
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "error"
      }
    },
    {
      "files": ["*.js", "*.jsx"],
      "extends": ["@nx/javascript"],
      "rules": {}
    }
  ]
}
```

## Security Configuration

### CORS Configuration

```typescript
// CORS settings for development
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4200'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// CORS settings for production
const productionCorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
```

### Security Headers

```typescript
// Fastify security middleware
import helmet from 'helmet';
import rateLimit from '@fastify/rate-limit';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

app.use(limiter);
```

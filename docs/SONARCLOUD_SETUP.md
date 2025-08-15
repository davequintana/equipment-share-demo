# SonarCloud Setup Guide

This project uses SonarCloud for continuous code quality and security analysis.

## 🔧 Configuration

### Project Setup

- **Project Key**: `davequintana_equipment-share-demo`
- **Organization**: `davequintana`
- **Configuration File**: `sonar-project.properties`

### Analysis Scope

- **Source Code**: `apps/`, `libs/`
- **Tests**: `**/*.test.ts`, `**/*.spec.ts`, `**/*.test.tsx`, `**/*.spec.tsx`
- **Coverage Reports**: LCOV format from all test runs
- **Quality Gate**: Enabled with wait for results

## 🚀 GitHub Integration

### Automatic Analysis

SonarCloud analysis runs automatically on:

- ✅ Pull requests to `main` and `develop` branches
- ✅ Pushes to `main` and `develop` branches
- ✅ After test completion (uses coverage data)

### Required Secrets

Add the following secrets to your GitHub repository:

1. **`SONAR_TOKEN`**
   - Go to [SonarCloud.io](https://sonarcloud.io)
   - Navigate to **My Account** → **Security**
   - Generate a new token
   - Add as GitHub repository secret

## 📊 Coverage Integration

The CI workflow automatically:

1. Runs tests with coverage enabled
2. Consolidates coverage reports from all projects
3. Provides LCOV reports to SonarCloud
4. Analyzes code quality and coverage metrics

## 🎯 Quality Standards

### Code Quality Metrics

- **Maintainability Rating**: A grade
- **Reliability Rating**: A grade  
- **Security Rating**: A grade
- **Coverage**: Target 80%+
- **Duplicated Lines**: <3%

### Quality Gate Conditions

- New code coverage: ≥80%
- New code duplicated lines: ≤3%
- Maintainability rating: A
- Reliability rating: A
- Security rating: A

## 🔍 Local Analysis

To run SonarCloud analysis locally:

```bash

# Install SonarCloud CLI (requires Java)

npm install -g sonarqube-scanner

# Run tests with coverage

pnpm run test:coverage

# Run SonarCloud analysis

pnpm run sonar
```

### Environment Variables for Local Analysis

```bash
export SONAR_TOKEN=your_sonar_token_here
export SONAR_HOST_URL=https://sonarcloud.io
```

## 📋 Project Configuration

The analysis includes:

### Source Files

- TypeScript/JavaScript files in `apps/` and `libs/`
- React components and hooks
- Server-side APIs and utilities

### Excluded from Analysis

- Node modules
- Build outputs (`dist/`, `coverage/`)
- Test files (analyzed separately)
- Configuration files
- Infrastructure code
- End-to-end tests

### Test Files

- Unit tests (`*.test.ts`, `*.spec.ts`)
- Component tests (`*.test.tsx`, `*.spec.tsx`)
- Test coverage reports

## 🛠️ Troubleshooting

### Common Issues

1. **Analysis Fails**

   ```bash
   # Check if SONAR_TOKEN is set correctly
   echo $SONAR_TOKEN
   
   # Verify sonar-project.properties exists
   cat sonar-project.properties
   ```

2. **Coverage Not Detected**

   ```bash
   # Ensure coverage reports exist
   find . -name "lcov.info" -path "*/coverage/*"
   
   # Check coverage consolidation
   ls -la coverage/
   ```

3. **Quality Gate Fails**
   - Review SonarCloud dashboard for specific issues
   - Check code smells, bugs, and security hotspots
   - Ensure new code meets coverage requirements

## 📚 Resources

- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [TypeScript Analysis](https://docs.sonarcloud.io/enriching/languages/typescript/)
- [Quality Gates](https://docs.sonarcloud.io/improving/quality-gates/)
- [GitHub Integration](https://docs.sonarcloud.io/getting-started/github/)

## 🔗 Dashboard Access

View the project analysis at:
**<https://sonarcloud.io/project/overview?id=davequintana_equipment-share-demo>**

# Security Setup & GitHub Advanced Security

This document explains how to set up and use the comprehensive security scanning system for this repository.

## 🛡️ Security Overview

Our security setup includes:
- **Trivy Vulnerability Scanner** for filesystem and Docker image scanning
- **CodeQL Static Analysis** for JavaScript/TypeScript security analysis
- **Dependency Security Auditing** with pnpm
- **License Compliance Checking**
- **Automated Security Reporting**

## 🚀 Quick Start

### 1. Check Security Status
```bash
./scripts/security.sh status
```

### 2. Run Local Security Audit
```bash
./scripts/security.sh audit
```

### 3. Run Full Security Check
```bash
./scripts/security.sh full
```

## 🔧 Setup Instructions

### GitHub Repository Settings

1. **Enable Security Features**:
   - Go to Settings > Security & analysis
   - Enable "Vulnerability alerts"
   - Enable "Dependabot alerts" 
   - Enable "Dependabot security updates"

2. **For Private Repositories with GitHub Advanced Security**:
   - Enable "Code scanning alerts"
   - Enable "Secret scanning alerts"
   - Configure custom CodeQL queries if needed

3. **Branch Protection Rules**:
   - Require status checks to pass before merging
   - Include security workflow checks
   - Require up-to-date branches before merging

### Environment Variables

Ensure these secrets are properly configured in GitHub:
- `NX_CLOUD_ACCESS_TOKEN` (if using NX Cloud)
- Any custom security scanning tokens

### Local Development Setup

1. **Install Security Tools** (optional for local scanning):
```bash
./scripts/security.sh install
```

2. **Configure IDE Security Extensions**:
   - Install ESLint with security plugins
   - Enable CodeQL extension (VS Code)
   - Configure Trivy extension if available

## 📊 Security Workflows

### Automatic Triggers

Security scans run automatically on:
- **Pull Requests**: All security checks
- **Push to main/develop**: Full security verification  
- **Daily Schedule**: Complete audit at 2 AM UTC
- **Manual Trigger**: Via GitHub Actions UI

### Workflow Jobs

1. **trivy-filesystem-scan**: Scans project files for vulnerabilities
2. **trivy-docker-scan**: Scans all Docker base images
3. **codeql-analysis**: Static analysis for JavaScript/TypeScript
4. **dependency-security**: Dependency and license auditing
5. **security-summary**: Consolidated reporting

## 🔍 Using Trivy

### Configuration File

Trivy behavior is configured in `.trivy.yaml`:
- Severity levels: CRITICAL, HIGH, MEDIUM
- Skip directories: node_modules, .git, dist
- Performance optimizations
- Custom vulnerability policies

### Local Trivy Usage

If you install Trivy locally:
```bash
# Scan filesystem
trivy fs .

# Scan specific Docker image
trivy image postgres:16.2

# Use custom config
trivy fs --config .trivy.yaml .
```

### Trivy Reports

Reports are available in multiple formats:
- **SARIF**: Uploaded to GitHub Security tab
- **Table**: Human-readable format in artifacts
- **JSON**: Machine-readable format for automation

## 📋 Security Reports & Artifacts

### GitHub Security Tab

Access detailed security reports:
1. Go to repository → Security tab
2. View "Code scanning alerts" for CodeQL findings
3. View "Dependabot alerts" for dependency issues
4. Check "Security advisories" for published vulnerabilities

### Workflow Artifacts

Download detailed reports from GitHub Actions:
1. Go to Actions → Security Scan workflow
2. Click on a completed run
3. Download artifacts:
   - `trivy-filesystem-report`
   - `trivy-docker-report-*`
   - `dependency-audit-report`
   - `license-compliance-report`

### Local Reports

Generate reports locally:
```bash
# Dependency audit report
pnpm audit > audit-report.txt

# License report  
pnpm licenses list > licenses-report.txt

# Security lint report
pnpm run lint:security
```

## 🔒 Security Best Practices

### Development Workflow

1. **Before Committing**:
   ```bash
   ./scripts/security.sh full
   ```

2. **Before Creating PR**:
   - Run local security checks
   - Review any new dependencies
   - Check for hardcoded secrets

3. **PR Review Process**:
   - Wait for all security checks to pass
   - Review security scan results
   - Address any identified vulnerabilities

### Dependency Management

1. **Regular Updates**:
   - Enable Dependabot for automated updates
   - Review security advisories monthly
   - Update dependencies with known vulnerabilities

2. **New Dependencies**:
   - Research security track record
   - Check for recent security updates
   - Verify license compatibility
   - Run security scan after adding

### Secret Management

1. **Environment Variables**:
   - Use `.env` for local development
   - Store production secrets in secure vaults
   - Never commit secrets to git

2. **Secret Scanning**:
   - GitHub will scan for exposed secrets
   - Rotate any exposed credentials immediately
   - Use secret scanning prevention hooks

## 🚨 Incident Response

### High/Critical Vulnerabilities

1. **Immediate Actions**:
   - Stop deployments if vulnerability affects production
   - Assess impact and exposure
   - Plan mitigation strategy

2. **Resolution Process**:
   - Update vulnerable dependencies
   - Apply security patches
   - Test fixes thoroughly
   - Deploy with security verification

3. **Communication**:
   - Notify security team
   - Update incident documentation
   - Conduct post-incident review

### Security Alerts

1. **Dependabot Alerts**:
   - Review impact assessment
   - Schedule updates based on severity
   - Test updates in development first

2. **Code Scanning Alerts**:
   - Review CodeQL findings
   - Assess false positive probability
   - Implement fixes or document exceptions

## 🛠️ Troubleshooting

### Common Issues

1. **Security Workflow Failures**:
   ```bash
   # Check workflow logs in GitHub Actions
   # Verify all required secrets are set
   # Ensure branch protection rules allow workflow execution
   ```

2. **Trivy Scan Failures**:
   ```bash
   # Update Trivy database
   # Check .trivy.yaml configuration
   # Verify Docker image accessibility
   ```

3. **Dependency Audit Issues**:
   ```bash
   # Clear pnpm cache
   pnpm store prune
   
   # Reinstall dependencies
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Getting Help

- **Security Issues**: See SECURITY.md for reporting procedures
- **Workflow Issues**: Check GitHub Actions logs and status
- **Tool Issues**: Consult official documentation:
  - [Trivy Documentation](https://aquasecurity.github.io/trivy/)
  - [CodeQL Documentation](https://codeql.github.com/docs/)
  - [GitHub Security Features](https://docs.github.com/en/code-security)

## 📈 Monitoring & Metrics

### Security Metrics

Track these security indicators:
- Vulnerability detection time
- Mean time to remediation
- Security scan success rate
- Dependency update frequency

### Regular Reviews

- **Weekly**: Review security dashboard
- **Monthly**: Analyze security trends
- **Quarterly**: Update security policies
- **Annually**: Comprehensive security audit

---

For questions about security setup, consult the team security documentation or create an issue with the `security` label.

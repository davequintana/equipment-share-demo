#!/bin/bash

# SonarCloud Quality Gate Troubleshooting Script
echo "🔍 SonarCloud Quality Gate Troubleshooting"
echo "=========================================="
echo ""

echo "📊 Current Analysis Status:"
echo "Pull Request: #32"
echo "Dashboard: https://sonarcloud.io/dashboard?id=davequintana_equipment-share-demo&pullRequest=32"
echo ""

echo "🔍 Common Quality Gate Failures and Solutions:"
echo ""

echo "1. 📈 Code Coverage Issues:"
echo "   - Problem: Coverage below minimum threshold (usually 80%)"
echo "   - Solution: Run 'pnpm run test:coverage' to generate coverage"
echo "   - Check: Ensure lcov.info files are generated in coverage/"
echo ""

echo "2. 🐛 Code Smells:"
echo "   - Problem: Minor code quality issues"
echo "   - Examples: Unused variables, complex functions, TODO comments"
echo "   - Solution: Review and fix issues shown in SonarCloud dashboard"
echo ""

echo "3. 🔒 Security Hotspots:"
echo "   - Problem: Potential security vulnerabilities"
echo "   - Examples: Regex DoS, hardcoded secrets, weak cryptography"
echo "   - Status: ✅ ReDoS vulnerability already fixed in auth.ts"
echo ""

echo "4. 📋 Duplicated Code:"
echo "   - Problem: Code blocks repeated across files"
echo "   - Solution: Extract common code into shared utilities"
echo ""

echo "5. 🚨 Bugs and Vulnerabilities:"
echo "   - Problem: Potential runtime errors or security issues"
echo "   - Solution: Fix issues identified by static analysis"
echo ""

echo "🛠️  Debugging Steps:"
echo ""
echo "1. Check Coverage Generation:"
echo "   pnpm run test:coverage"
echo "   ls -la coverage/"
echo "   ls -la apps/*/coverage/"
echo ""

echo "2. Run Local SonarCloud Analysis:"
echo "   pnpm run sonar:local"
echo ""

echo "3. Check SonarCloud Project Settings:"
echo "   - Go to: https://sonarcloud.io/project/overview?id=davequintana_equipment-share-demo"
echo "   - Check Quality Gate settings"
echo "   - Review Quality Profile configuration"
echo ""

echo "4. View Detailed Issues:"
echo "   - Issues: https://sonarcloud.io/project/issues?id=davequintana_equipment-share-demo"
echo "   - Security: https://sonarcloud.io/project/security_hotspots?id=davequintana_equipment-share-demo"
echo "   - Coverage: https://sonarcloud.io/component_measures?id=davequintana_equipment-share-demo&metric=coverage"
echo ""

echo "✅ Recent Fixes Applied:"
echo "   - ✅ ReDoS vulnerability in email validation (auth.ts)"
echo "   - ✅ Comprehensive unit tests (32 test cases)"
echo "   - ✅ 100% function and branch coverage for auth middleware"
echo "   - ✅ Updated Copilot instructions with security guidelines"
echo ""

echo "🎯 Next Steps:"
echo "1. Visit the SonarCloud dashboard link above"
echo "2. Review specific issues that need fixing"
echo "3. Fix any remaining code smells or coverage gaps"
echo "4. Re-run the CI pipeline to validate fixes"
echo ""

echo "💡 Pro Tip: Quality gates often fail on first run due to coverage"
echo "   thresholds. This is normal and helps maintain code quality!"

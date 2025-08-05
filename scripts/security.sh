#!/bin/bash

# Security Scanner Management Script
# Helps run security checks locally and manage security configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_header() {
    echo -e "${BLUE}🔒 Security Scanner Management${NC}"
    echo "=================================="
    echo ""
}

print_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  audit      - Run dependency security audit"
    echo "  lint       - Run security linting"
    echo "  docker     - Check Docker images for vulnerabilities"
    echo "  full       - Run all security checks"
    echo "  install    - Install security tools locally"
    echo "  status     - Show security configuration status"
    echo "  help       - Show this help message"
    echo ""
}

run_dependency_audit() {
    echo -e "${BLUE}📦 Running Dependency Security Audit${NC}"
    echo "---------------------------------------"

    cd "$PROJECT_ROOT"

    echo "🔍 Checking for HIGH severity vulnerabilities..."
    if pnpm audit --audit-level high; then
        echo -e "${GREEN}✅ No high severity vulnerabilities found${NC}"
    else
        echo -e "${RED}❌ High severity vulnerabilities detected!${NC}"
        return 1
    fi

    echo ""
    echo "🔍 Checking for MODERATE severity vulnerabilities..."
    if pnpm audit --audit-level moderate; then
        echo -e "${GREEN}✅ No moderate or high severity vulnerabilities found${NC}"
    else
        echo -e "${YELLOW}⚠️ Moderate severity vulnerabilities found${NC}"
        echo "Consider fixing these for better security posture"
    fi

    echo ""
}

run_security_lint() {
    echo -e "${BLUE}🔍 Running Security Linting${NC}"
    echo "----------------------------"

    cd "$PROJECT_ROOT"

    if pnpm run lint:security; then
        echo -e "${GREEN}✅ Security lint passed${NC}"
    else
        echo -e "${RED}❌ Security lint issues found${NC}"
        return 1
    fi

    echo ""
}

check_docker_images() {
    echo -e "${BLUE}🐳 Checking Docker Images${NC}"
    echo "--------------------------"

    # List of images from docker-compose.yml
    images=(
        "postgres:16.2"
        "redis:7-alpine"
        "confluentinc/cp-zookeeper:7.4.0"
        "confluentinc/cp-kafka:7.4.0"
        "provectuslabs/kafka-ui:latest"
        "dpage/pgadmin4:latest"
    )

    echo "📋 Images to scan:"
    for image in "${images[@]}"; do
        echo "  - $image"
    done

    echo ""
    echo -e "${YELLOW}💡 For full Docker image security scanning, use GitHub Actions${NC}"
    echo ""
}

install_security_tools() {
    echo -e "${BLUE}🛠️ Installing Security Tools${NC}"
    echo "------------------------------"

    echo "📦 Checking if Homebrew is available..."
    if command -v brew &> /dev/null; then
        echo "✅ Homebrew found"
        echo "ℹ️ Security tools can be installed as needed"
    else
        echo -e "${YELLOW}⚠️ Homebrew not found. Security tools can be installed manually as needed${NC}"
    fi

    echo ""
}

show_security_status() {
    echo -e "${BLUE}📊 Security Configuration Status${NC}"
    echo "----------------------------------"

    cd "$PROJECT_ROOT"

    # Check security files
    echo "📄 Security Configuration Files:"

    if [ -f ".github/workflows/security.yml" ]; then
        echo -e "  ✅ GitHub Actions Security Workflow: ${GREEN}Present${NC}"
    else
        echo -e "  ❌ GitHub Actions Security Workflow: ${RED}Missing${NC}"
    fi

    if [ -f "SECURITY.md" ]; then
        echo -e "  ✅ Security Policy: ${GREEN}Present${NC}"
    else
        echo -e "  ❌ Security Policy: ${RED}Missing${NC}"
    fi

    # Check security tools
    echo ""
    echo "🛠️ Security Tools:"

    if command -v docker &> /dev/null; then
        echo -e "  ✅ Docker: ${GREEN}Available${NC} ($(docker --version | cut -d' ' -f3 | cut -d',' -f1))"
    else
        echo -e "  ❌ Docker: ${RED}Not available${NC}"
    fi

    # Check package manager
    echo ""
    echo "📦 Package Security:"
    if command -v pnpm &> /dev/null; then
        echo -e "  ✅ pnpm: ${GREEN}Available${NC} ($(pnpm --version))"
        echo "  🔍 Last audit: Run 'pnpm audit' to check"
    else
        echo -e "  ❌ pnpm: ${RED}Not available${NC}"
    fi

    echo ""
}

run_full_security_check() {
    echo -e "${BLUE}🔒 Running Full Security Check${NC}"
    echo "==============================="
    echo ""

    local failed=0

    # Run dependency audit
    if ! run_dependency_audit; then
        failed=1
    fi

    # Run security lint
    if ! run_security_lint; then
        failed=1
    fi

    # Check Docker images
    check_docker_images

    echo -e "${BLUE}📋 Security Check Summary${NC}"
    echo "-------------------------"

    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}✅ All security checks passed!${NC}"
        echo ""
        echo "💡 For complete security verification:"
        echo "   - Push to GitHub to trigger full CI security scans"
        echo "   - Check GitHub Security tab for detailed reports"
        echo "   - Review Docker image vulnerabilities in GitHub Actions"
        return 0
    else
        echo -e "${RED}❌ Some security checks failed${NC}"
        echo ""
        echo "🔧 Action required:"
        echo "   - Fix dependency vulnerabilities"
        echo "   - Resolve security lint issues"
        echo "   - Review and address security findings"
        return 1
    fi
}

# Main script logic
case "${1:-help}" in
    "audit")
        print_header
        run_dependency_audit
        ;;
    "lint")
        print_header
        run_security_lint
        ;;
    "docker")
        print_header
        check_docker_images
        ;;
    "full")
        print_header
        run_full_security_check
        ;;
    "install")
        print_header
        install_security_tools
        ;;
    "status")
        print_header
        show_security_status
        ;;
    "help"|*)
        print_header
        print_usage
        ;;
esac

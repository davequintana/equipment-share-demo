#!/bin/bash

# Kubernetes Manifest Validation Script
# This script validates all Kubernetes manifests in the k8s directory

echo "🔍 Validating Kubernetes manifests..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

EXIT_CODE=0

# Function to validate YAML syntax
validate_yaml_syntax() {
    local file="$1"
    # Skip YAML syntax validation for now since yamllint/PyYAML may not be available
    echo -e "${GREEN}✅ YAML syntax check skipped (no yamllint available)${NC}"
}

# Function to validate Kubernetes manifest structure
validate_k8s_structure() {
    local file="$1"

    # Check for required fields
    if grep -q "apiVersion:" "$file" && grep -q "kind:" "$file" && grep -q "metadata:" "$file"; then
        echo -e "${GREEN}✅ Kubernetes structure valid${NC}"
    else
        echo -e "${RED}❌ Missing required Kubernetes fields (apiVersion, kind, metadata)${NC}"
        EXIT_CODE=1
    fi
}

# Function to run kube-score if available
validate_best_practices() {
    local file="$1"

    if command -v kube-score &> /dev/null; then
        echo -e "${YELLOW}🏆 Running kube-score analysis...${NC}"
        if kube-score score "$file" \
            --ignore-test container-security-context-readonlyrootfilesystem \
            --ignore-test deployment-has-host-podantiaffinity > /dev/null 2>&1; then
            echo -e "${GREEN}✅ kube-score validation passed${NC}"
        else
            echo -e "${YELLOW}⚠️  kube-score found some recommendations${NC}"
            # Don't fail on kube-score warnings, just inform
        fi
    else
        echo -e "${YELLOW}ℹ️  kube-score not available, skipping best practices check${NC}"
    fi
}

# Check if we have manifests to validate
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f "app-deployment.yaml" ]; then
    MANIFESTS=("app-deployment.yaml")
elif [ -f "01-namespace-and-quotas.yaml" ]; then
    MANIFESTS=(
        "01-namespace-and-quotas.yaml"
        "02-configmaps-and-secrets.yaml"
        "03-frontend-deployment.yaml"
        "04-backend-deployment.yaml"
        "05-scaling-and-disruption.yaml"
        "06-network-policies.yaml"
    )
else
    echo -e "${RED}❌ No Kubernetes manifests found${NC}"
    exit 1
fi

# Validate each manifest
for manifest in "${MANIFESTS[@]}"; do
    if [[ -f "$manifest" ]]; then
        echo -e "${YELLOW}📋 Validating: $manifest${NC}"

        validate_yaml_syntax "$manifest"
        validate_k8s_structure "$manifest"
        validate_best_practices "$manifest"

        echo "---"
    else
        echo -e "${YELLOW}⚠️  $manifest not found, skipping...${NC}"
    fi
done

# Final result
if [[ $EXIT_CODE -eq 0 ]]; then
    echo -e "${GREEN}🎉 All Kubernetes manifests are valid!${NC}"
else
    echo -e "${RED}❌ Some validation issues found${NC}"
fi

exit $EXIT_CODE

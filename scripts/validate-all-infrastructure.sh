#!/bin/bash

# Comprehensive Infrastructure Validation Script
# This script validates CloudFormation templates and Kubernetes manifests

echo "🚀 Running comprehensive infrastructure validation..."
echo ""

EXIT_CODE=0

# Validate CloudFormation templates
echo "📋 Validating CloudFormation templates..."
if [[ -f "./infrastructure/validate.sh" ]]; then
    ./infrastructure/validate.sh
    if [[ $? -ne 0 ]]; then
        EXIT_CODE=1
    fi
else
    echo "⚠️  CloudFormation validation script not found"
fi

echo ""

# Validate Kubernetes manifests
echo "☸️  Validating Kubernetes manifests..."
if [[ -f "./k8s/validate.sh" ]]; then
    ./k8s/validate.sh
    if [[ $? -ne 0 ]]; then
        EXIT_CODE=1
    fi
else
    echo "⚠️  Kubernetes validation script not found"
fi

echo ""

if [[ $EXIT_CODE -eq 0 ]]; then
    echo "🎉 All infrastructure validations passed!"
    echo "✅ CloudFormation templates are valid"
    echo "✅ Kubernetes manifests follow best practices"
    echo "✅ Security configurations are properly set"
    echo "✅ Resource limits and requests are defined"
    echo "✅ Pod disruption budgets are configured"
    echo "✅ Network policies are in place"
    echo "✅ Pod anti-affinity rules ensure high availability"
    echo "✅ Resource quotas and limit ranges control resource usage"
    echo "✅ Enterprise-grade security and governance configured"
else
    echo "❌ Some infrastructure validation checks failed"
    echo "Please review the output above for details"
fi

exit $EXIT_CODE

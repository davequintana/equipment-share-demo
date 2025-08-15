#!/bin/bash

# CloudFormation Template Validation Script
# This script validates all CloudFormation templates in the infrastructure directory

echo "🔍 Validating CloudFormation templates..."

# Check if cfn-lint is installed
CFN_LINT_PATH=""
if command -v cfn-lint &> /dev/null; then
    CFN_LINT_PATH="cfn-lint"
elif [[ -f "/Users/davequintana/Library/Python/3.9/bin/cfn-lint" ]]; then
    CFN_LINT_PATH="/Users/davequintana/Library/Python/3.9/bin/cfn-lint"
elif command -v python3 &> /dev/null; then
    echo "⚠️  cfn-lint not found. Installing with pipx..."
    if ! command -v pipx &> /dev/null; then
        echo "Installing pipx..."
        brew install pipx
    fi
    pipx install cfn-lint
    CFN_LINT_PATH="cfn-lint"
else
    echo "❌ cfn-lint not available and cannot install"
    exit 1
fi

# Find and validate all CloudFormation templates
TEMPLATE_DIR="$(dirname "$0")/aws"
EXIT_CODE=0

for template in "$TEMPLATE_DIR"/*.yaml "$TEMPLATE_DIR"/*.yml "$TEMPLATE_DIR"/*.json; do
    if [[ -f "$template" ]]; then
        echo "📋 Validating: $(basename "$template")"

        # Use AWS CLI to validate syntax if available
        if command -v aws &> /dev/null; then
            aws cloudformation validate-template --template-body "file://$template" > /dev/null 2>&1
            if [[ $? -eq 0 ]]; then
                echo "✅ AWS CLI validation passed"
            else
                echo "❌ AWS CLI validation failed"
                EXIT_CODE=1
            fi
        fi

        # Use cfn-lint for detailed validation
        "$CFN_LINT_PATH" "$template"
        if [[ $? -eq 0 ]]; then
            echo "✅ cfn-lint validation passed"
        else
            echo "❌ cfn-lint validation failed"
            EXIT_CODE=1
        fi

        echo ""
    fi
done

if [[ $EXIT_CODE -eq 0 ]]; then
    echo "🎉 All CloudFormation templates are valid!"
else
    echo "❌ Some templates have validation errors"
fi

exit $EXIT_CODE

#!/bin/bash

echo "🔍 Monitoring AI Planning Contexts..."

# Watch for context changes
watch -n 5 '
echo "=== Active Contexts ==="
find contexts -name "*.json" -exec basename {} .json \; 2>/dev/null | head -10
echo ""
echo "=== Recent Activity ==="
find contexts -name "*.json" -mmin -60 -exec echo "Modified: {}" \; 2>/dev/null | head -5
echo ""
echo "=== Context Stats ==="
echo "Total contexts: $(find contexts -name "*.json" 2>/dev/null | wc -l)"
echo "Recent contexts: $(find contexts -name "*.json" -mmin -1440 2>/dev/null | wc -l)"
'

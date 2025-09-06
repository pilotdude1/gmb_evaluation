#!/bin/bash

# VPS Configuration
VPS_USER="root"
VPS_IP="31.97.135.248"
VPS_PATH="/path/to/project"

# Files to compare
FILES=(
    "package.json"
    "tsconfig.json"
    "src/app.html"
    "src/routes/+page.svelte"
    "src/lib/supabaseClient.ts"
    "docker-compose.yml"
    "Dockerfile"
)

echo "Comparing local files with VPS..."

for file in "${FILES[@]}"; do
    echo "=== Comparing $file ==="
    if ssh $VPS_USER@$VPS_IP "test -f $VPS_PATH/$file"; then
        ssh $VPS_USER@$VPS_IP "cat $VPS_PATH/$file" | diff "$file" - || echo "Files differ"
    else
        echo "File $file not found on VPS"
    fi
    echo ""
done

echo "Comparison complete!" 
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TMP_OAS_DIR="${PROJECT_DIR}/tmp-oas"
BUNDLED_DIR="${PROJECT_DIR}/bundled-oas"

echo "=== Zoho Desk SDK: Pull & Generate ==="

# Step 1: Clone OAS specs
if [ -d "$TMP_OAS_DIR" ]; then
  echo "Cleaning existing tmp-oas directory..."
  rm -rf "$TMP_OAS_DIR"
fi

echo "Cloning zohodesk-oas specs..."
git clone --depth 1 https://github.com/zoho/zohodesk-oas.git "$TMP_OAS_DIR"

# Step 2: Bundle OAS files (per-spec self-contained bundles)
echo "Bundling OAS files..."
rm -rf "$BUNDLED_DIR"
npx tsx "${SCRIPT_DIR}/bundle-oas.ts" "${TMP_OAS_DIR}/v1.0" "$BUNDLED_DIR"

# Step 3: Generate per-module Kiota clients
echo "Generating Kiota TypeScript clients..."
bash "${SCRIPT_DIR}/generate-clients.sh"

# Step 4: Generate unified facade
echo "Generating facade client..."
npx tsx "${SCRIPT_DIR}/generate-facade.ts"

# Step 5: Cleanup
echo "Cleaning up temp files..."
rm -rf "$TMP_OAS_DIR"
rm -rf "$BUNDLED_DIR"

echo "=== Done! ==="

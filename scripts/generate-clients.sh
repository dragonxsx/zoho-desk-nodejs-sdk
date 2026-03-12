#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLED_DIR="${PROJECT_DIR}/bundled-oas"
MANIFEST="${BUNDLED_DIR}/manifest.json"
OUTPUT_DIR="${PROJECT_DIR}/src/generated"

KIOTA_IMAGE="mcr.microsoft.com/openapi/kiota"
PARALLEL="${KIOTA_PARALLEL:-8}"
TIMEOUT="${KIOTA_TIMEOUT:-120}"  # seconds per module

if [ ! -f "$MANIFEST" ]; then
  echo "Error: ${MANIFEST} not found. Run bundle-oas first."
  exit 1
fi

echo "Cleaning generated directory..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Parse manifest into "filename|moduleName|clientClassName" lines
SPEC_LINES=$(node --input-type=module -e "
import fs from 'node:fs';
const manifest = JSON.parse(fs.readFileSync('${MANIFEST}', 'utf-8'));
for (const spec of manifest.specs) {
  console.log(spec.filename + '|' + spec.moduleName + '|' + spec.clientClassName);
}
")

SPEC_COUNT=$(echo "$SPEC_LINES" | wc -l | tr -d ' ')
echo "Generating ${SPEC_COUNT} modules (${PARALLEL} parallel)..."

# Temp files for tracking results
SUCCESS_FILE=$(mktemp)
FAILURE_FILE=$(mktemp)
echo "0" > "$SUCCESS_FILE"
echo "0" > "$FAILURE_FILE"
FAILED_LOG=$(mktemp)

# Export variables needed by the worker function
export PROJECT_DIR KIOTA_IMAGE OUTPUT_DIR SUCCESS_FILE FAILURE_FILE FAILED_LOG TIMEOUT

generate_one() {
  local line="$1"
  local filename moduleName clientClassName
  IFS='|' read -r filename moduleName clientClassName <<< "$line"

  local outdir="${OUTPUT_DIR}/${moduleName}"
  mkdir -p "$outdir"

  echo "[START] ${moduleName}"

  local container_name="kiota-${moduleName}-$$"

  # Background watchdog: stop the container after TIMEOUT seconds
  ( sleep "$TIMEOUT" && docker stop "$container_name" 2>/dev/null ) &
  local watchdog_pid=$!

  if docker run --rm \
    --name "$container_name" \
    -u "$(id -u):$(id -g)" \
    -v "${PROJECT_DIR}:/workspace" \
    "$KIOTA_IMAGE" \
    generate \
    -l typescript \
    -d "/workspace/bundled-oas/${filename}" \
    -c "${clientClassName}" \
    -n "${moduleName}Client" \
    -o "/workspace/src/generated/${moduleName}/" \
    --co > "${outdir}/.kiota.log" 2>&1; then
    kill "$watchdog_pid" 2>/dev/null || true
    wait "$watchdog_pid" 2>/dev/null || true
    echo "[SUCCESS] ${moduleName}"
    echo "1" >> "$SUCCESS_FILE"
  else
    kill "$watchdog_pid" 2>/dev/null || true
    wait "$watchdog_pid" 2>/dev/null || true
    # Cleanup lingering container
    docker rm -f "$container_name" 2>/dev/null || true
    echo "[FAILURE] ${moduleName}"
    echo "1" >> "$FAILURE_FILE"
    echo "$moduleName" >> "$FAILED_LOG"
  fi
}
export -f generate_one

# Run with xargs for parallelism
echo "$SPEC_LINES" | xargs -P "$PARALLEL" -I {} bash -c 'generate_one "$@"' _ {}

# Count results (subtract the initial "0" line from each file)
SUCCESS_COUNT=$(( $(wc -l < "$SUCCESS_FILE") - 1 ))
FAILURE_COUNT=$(( $(wc -l < "$FAILURE_FILE") - 1 ))

echo ""
echo "=== Kiota Generation Summary ==="
echo "  Successes: ${SUCCESS_COUNT}"
echo "  Failures:  ${FAILURE_COUNT}"
if [ "$FAILURE_COUNT" -gt 0 ]; then
  echo "  Failed modules:"
  while IFS= read -r mod; do
    echo "    - ${mod}"
  done < "$FAILED_LOG"
fi
echo "================================="

# Cleanup temp files
rm -f "$SUCCESS_FILE" "$FAILURE_FILE" "$FAILED_LOG"

# Post-processing: fix Kiota-generated TypeScript issues
echo "Post-processing generated files..."

# 1. Add // @ts-nocheck to all generated .ts files (Kiota emits code with TS strict-mode issues)
find "$OUTPUT_DIR" -name '*.ts' -exec sh -c \
  'head -1 "$1" | grep -q "@ts-nocheck" || sed -i "" "1s/^/\/\/ @ts-nocheck\n/" "$1"' _ {} \;

# 2. Fix reserved word 'delete' used as parameter name (Kiota bug)
find "$OUTPUT_DIR" -name '*.ts' -exec grep -l 'function.*delete:' {} \; 2>/dev/null | while IFS= read -r tsfile; do
  sed -i '' \
    -e 's/(delete: /(_delete: /g' \
    -e 's/, delete: /, _delete: /g' \
    -e 's/{ delete\./{ _delete./g' \
    -e 's/(!delete/(!_delete/g' \
    -e 's/if (delete /if (_delete /g' \
    -e 's/if (typeof delete /if (typeof _delete /g' \
    -e 's/ delete as / _delete as /g' \
    -e 's/ delete\.\(error\)/ _delete.\1/g' \
    -e 's/ delete\.\(field\)/ _delete.\1/g' \
    -e 's/ delete\.\(additional\)/ _delete.\1/g' \
    "$tsfile"
done || true

echo "Kiota generation complete. Output: ${OUTPUT_DIR}"

if [ "$FAILURE_COUNT" -gt 0 ]; then
  echo "WARNING: ${FAILURE_COUNT} module(s) failed — check logs in src/generated/<module>/.kiota.log"
  exit 1
fi

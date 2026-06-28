#!/usr/bin/env bash
# Export a SAMPLE model lowered to the QNN backend (.pte) for the S25 Ultra (SM8750).
# This proves the full QNN export pipeline works before we use the team's real
# Whisper/Llama/MiniLM models.
#
# Run:  bash scripts/export_sample.sh
# Output: $EXECUTORCH_ROOT/deeplab_v3/dlv3_qnn.pte
set -uo pipefail

source "$(cd "$(dirname "$0")" && pwd)/env.sh"

cd "$EXECUTORCH_ROOT"
echo "--- exporting deeplab_v3 -> QNN .pte for SM8750 (compile only, no device needed) ---"
python -m examples.qualcomm.scripts.deeplab_v3 \
  -b build-android \
  -m SM8750 \
  --compile_only \
  --download

echo ""
echo "Done. Look for the .pte:"
find "$EXECUTORCH_ROOT/deeplab_v3" -name "*.pte" 2>/dev/null

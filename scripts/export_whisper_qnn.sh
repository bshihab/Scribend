#!/usr/bin/env bash
# Export Whisper -> QNN .pte for the S25 Ultra (SM8750), on the Codespace.
# Uses ExecuTorch's bundled Whisper QNN example (defaults to openai/whisper-tiny).
# This proves "Whisper on the NPU" with the easiest model; we swap to
# whisper-small.en afterward.
#
# Run on the CODESPACE:  bash scripts/export_whisper_qnn.sh
# Output: $EXECUTORCH_ROOT/whisper/*.pte
set -uo pipefail

source "$(cd "$(dirname "$0")" && pwd)/env.sh"

cd "$EXECUTORCH_ROOT"
echo "--- exporting Whisper -> QNN .pte for SM8750 (compile only, no device needed) ---"
python -m examples.qualcomm.oss_scripts.whisper.whisper \
  --build_folder build-android \
  --soc_model SM8750 \
  --compile_only

echo ""
echo "Done. Whisper .pte file(s):"
find "$EXECUTORCH_ROOT/whisper" -name "*.pte" 2>/dev/null

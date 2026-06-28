#!/usr/bin/env bash
# Robust QNN build for a small Codespace.
#   - frees disk (pip cache)
#   - limits parallel jobs so it doesn't exhaust RAM (the usual cause of
#     random "Interrupt"/kill on small machines)
#   - runs detached (nohup) so a dropped browser tab/connection won't kill it
#
# Usage:
#   bash scripts/build_qnn.sh
#   tail -f ~/qnnbuild.log          # watch progress (Ctrl+C stops watching, NOT the build)
set -uo pipefail

# Load env (NDK, QNN_SDK_ROOT, EXECUTORCH_ROOT, venv)
source "$(cd "$(dirname "$0")" && pwd)/env.sh"

# Free disk: the pip download cache can be several GB and isn't needed to build.
rm -rf "$HOME/.cache/pip" 2>/dev/null || true
echo "--- disk after cleanup ---"; df -h / | tail -1

# Throttle parallelism via build.sh's OWN flag (it defaults to -j16 and ignores
# CMAKE_BUILD_PARALLEL_LEVEL). 2 keeps RAM well under the 16 GB limit.
# --no_clean resumes the previous build instead of starting from scratch.
JOBS="${JOBS:-2}"

cd "$EXECUTORCH_ROOT"
echo "--- starting QNN build: --job_number $JOBS, resume (--no_clean), detached ---"
nohup ./backends/qualcomm/scripts/build.sh --job_number "$JOBS" --no_clean > "$HOME/qnnbuild.log" 2>&1 &
echo "Build running in background as PID $!"
echo "Watch it:        tail -f ~/qnnbuild.log"
echo "Check if done:   grep -c 'Built target' ~/qnnbuild.log   (and look for 'Error' near the end)"

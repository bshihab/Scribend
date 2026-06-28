# Load all the build env vars in one shot:   source scripts/env.sh
# Safe to run in any new terminal before building/exporting.
# Everything lives under /workspaces (survives Codespace rebuilds).
WORK=/workspaces

export ANDROID_NDK_ROOT="$WORK/android-ndk-r26c"
export EXECUTORCH_ROOT="$WORK/executorch"

# Auto-find the QNN SDK (wherever it got unzipped)
_qnn_envsetup="$(find "$WORK/qairt" -name envsetup.sh 2>/dev/null | head -1)"
if [ -n "$_qnn_envsetup" ]; then
  export QNN_SDK_ROOT="$(dirname "$(dirname "$_qnn_envsetup")")"
  # shellcheck disable=SC1090
  source "$QNN_SDK_ROOT/bin/envsetup.sh" >/dev/null 2>&1
  # The AOT export/lowering needs the QNN host (x86) libs on the library path.
  export LD_LIBRARY_PATH="$QNN_SDK_ROOT/lib/x86_64-linux-clang:${LD_LIBRARY_PATH:-}"
fi

export PYTHONPATH="$EXECUTORCH_ROOT/..:$PYTHONPATH"

# Activate the Python venv
# shellcheck disable=SC1091
[ -f "$WORK/et-venv/bin/activate" ] && source "$WORK/et-venv/bin/activate"

echo "NDK = $ANDROID_NDK_ROOT"
echo "QNN = ${QNN_SDK_ROOT:-NOT FOUND}"
echo "ET  = $EXECUTORCH_ROOT"

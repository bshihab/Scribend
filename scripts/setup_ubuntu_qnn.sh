#!/usr/bin/env bash
# FULL Codespace setup for the QNN build.
# Installs EVERYTHING under /workspaces, which SURVIVES Codespace rebuilds —
# the home folder ~/ does NOT (that's why a machine-type change wiped us).
#
# Run once:   bash scripts/setup_ubuntu_qnn.sh
# Resumable:  re-running skips anything already downloaded.
set -uo pipefail
WORK=/workspaces

echo "==> [1/5] System packages"
sudo apt-get update -qq
sudo apt-get install -y git build-essential gcc-13 g++-13 \
  python3 python3-venv python3-pip unzip wget curl cmake \
  libc++1 libc++abi1

echo "==> [2/5] Android NDK r26c -> $WORK/android-ndk-r26c"
cd "$WORK"
if [ ! -d "$WORK/android-ndk-r26c" ]; then
  wget -q https://dl.google.com/android/repository/android-ndk-r26c-linux.zip
  unzip -q android-ndk-r26c-linux.zip && rm -f android-ndk-r26c-linux.zip
fi

echo "==> [3/5] Qualcomm QNN SDK 2.37.0 -> $WORK/qairt"
cd "$WORK"
if [ ! -d "$WORK/qairt" ]; then
  url="https://softwarecenter.qualcomm.com/api/download/software/sdks/Qualcomm_AI_Runtime_Community/All/2.37.0.250724/v2.37.0.250724.zip"
  wget "$url" -O qnn.zip
  unzip -q qnn.zip -d qairt && rm -f qnn.zip
fi

echo "==> [4/5] ExecuTorch source -> $WORK/executorch"
cd "$WORK"
if [ ! -d "$WORK/executorch" ]; then
  git clone --recurse-submodules https://github.com/pytorch/executorch.git
fi

echo "==> [5/5] Python venv + ExecuTorch install (LONG: ~15-20 min)"
python3 -m venv "$WORK/et-venv"
# shellcheck disable=SC1091
source "$WORK/et-venv/bin/activate"
pip install --upgrade pip
cd "$WORK/executorch"
./install_executorch.sh

echo ""
echo "==================== SETUP DONE ✅ ===================="
echo "Everything is under /workspaces (survives rebuilds)."
echo "Next:"
echo "  source scripts/env.sh        # load build env"
echo "  bash scripts/build_qnn.sh    # build (defaults to 2 jobs)"
echo "======================================================"

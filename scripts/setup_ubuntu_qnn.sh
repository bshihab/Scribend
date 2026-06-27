#!/usr/bin/env bash
# =============================================================================
# Phase 3 setup — RUN THIS ON AN x86_64 Ubuntu 22.04 BOX (not your Mac).
#
# Automates the parts that can be automated:
#   - system packages
#   - Android NDK r26c
#   - ExecuTorch source clone + Python venv
# The Qualcomm QNN SDK needs a (free) Qualcomm login, so that step is manual —
# the script prints exactly what to do at the end.
#
# Usage:
#   chmod +x setup_ubuntu_qnn.sh
#   ./setup_ubuntu_qnn.sh
# =============================================================================
set -euo pipefail

echo "==> [1/4] System packages"
sudo apt-get update
sudo apt-get install -y \
  git build-essential gcc-13 g++-13 \
  python3.10 python3.10-venv python3-pip \
  unzip wget curl cmake

echo "==> [2/4] Android NDK r26c"
cd "$HOME"
if [ ! -d "android-ndk-r26c" ]; then
  wget -q https://dl.google.com/android/repository/android-ndk-r26c-linux.zip
  unzip -q android-ndk-r26c-linux.zip
  rm -f android-ndk-r26c-linux.zip
fi
NDK_ROOT="$HOME/android-ndk-r26c"
echo "    NDK at: $NDK_ROOT"

echo "==> [3/4] ExecuTorch source"
cd "$HOME"
if [ ! -d "executorch" ]; then
  git clone --recurse-submodules https://github.com/pytorch/executorch.git
fi
ET_ROOT="$HOME/executorch"

echo "==> [4/4] Python venv"
python3.10 -m venv "$HOME/et-venv"
# shellcheck disable=SC1091
source "$HOME/et-venv/bin/activate"
pip install --upgrade pip

# Persist the env vars for future shells
{
  echo "export ANDROID_NDK_ROOT=$NDK_ROOT"
  echo "export EXECUTORCH_ROOT=$ET_ROOT"
  echo "source \$HOME/et-venv/bin/activate"
} >> "$HOME/.bashrc"

cat <<EOF

==================== AUTOMATED PART DONE ✅ ====================
NDK:         $NDK_ROOT
ExecuTorch:  $ET_ROOT
venv:        $HOME/et-venv  (auto-activates in new shells)

==================== NOW DO THESE BY HAND ====================

A) Install ExecuTorch into the venv (follow the CURRENT getting-started, as the
   command name changes between versions — recent versions use):
       cd $ET_ROOT
       ./install_executorch.sh
   (older versions: ./install_requirements.sh)

B) Download Qualcomm QNN SDK 2.37.0 (needs a free Qualcomm account):
   https://softwarecenter.qualcomm.com/api/download/software/sdks/Qualcomm_AI_Runtime_Community/All/2.37.0.250724/v2.37.0.250724.zip
   Unzip it, then:
       export QNN_SDK_ROOT=\$HOME/qairt/2.37.0     # dir containing QNN_README.txt
       source \$QNN_SDK_ROOT/bin/envsetup.sh
       export PYTHONPATH=$ET_ROOT/..:\$PYTHONPATH

C) Build ExecuTorch with the QNN backend:
       cd $ET_ROOT
       ./backends/qualcomm/scripts/build.sh

D) Export a sample model for the S25 Ultra (SM8750) and run on the NPU:
   Follow docs/EXECUTORCH_QNN_SETUP.md  Stages 3-4 (already tailored to SM8750 / Hexagon V79).
==============================================================
EOF

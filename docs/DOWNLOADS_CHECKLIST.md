# Phase 3 — Everything to Download, Step by Step (with links)

Target: build + export models on **x86_64 Ubuntu 22.04**, run on the **S25 Ultra
(SM8750 / Hexagon V79)** NPU. Do these in order.

## 0. Downloads checklist (all the links in one place)
| # | What | Link | Needs account? |
|---|------|------|----------------|
| 1 | Ubuntu 22.04 (WSL) | https://apps.microsoft.com/detail/9PN20MSR04DW | no |
| 2 | Android NDK r26c (Linux) | https://dl.google.com/android/repository/android-ndk-r26c-linux.zip | no |
| 3 | Qualcomm QNN SDK 2.37.0 | https://softwarecenter.qualcomm.com/api/download/software/sdks/Qualcomm_AI_Runtime_Community/All/2.37.0.250724/v2.37.0.250724.zip | **yes (free)** |
| 4 | Qualcomm account (for #3) | https://myaccount.qualcomm.com/signup | — |
| 5 | ExecuTorch (via git, no manual dl) | https://github.com/pytorch/executorch | no |

Reference docs (no download): getting-started
https://docs.pytorch.org/executorch/main/getting-started.html · QNN backend
https://docs.pytorch.org/executorch/main/backends-qualcomm.html

---

## 1. Get an x86_64 Ubuntu 22.04 box
Pick ONE:

**Option A — WSL2 (free; if you have any Windows PC) — easiest**
1. Open PowerShell **as Administrator** and run:
   ```powershell
   wsl --install -d Ubuntu-22.04
   ```
   (or install "Ubuntu 22.04 LTS" from the Microsoft Store: link #1 above)
2. Reboot if asked, launch Ubuntu, set a username/password.

**Option B — Cloud VM**
- Any provider. Choose: **x86_64 / amd64**, **Ubuntu 22.04 LTS**, ~**8 vCPU,
  16–32 GB RAM, 100 GB disk**. SSH in. Stop it when idle to save money.

> ❌ Not Docker/UTM on a Mac — that's arm64; QNN host tools are x86_64.

---

## 2. Create a Qualcomm account (do early — it gates the QNN download)
Sign up: https://myaccount.qualcomm.com/signup
You need this to download the QNN SDK in step 5.

---

## 3. Run the automated setup script (on the Ubuntu box)
This installs system packages + **Android NDK r26c** (download #2) + clones
ExecuTorch + makes a Python venv:
```bash
# copy scripts/setup_ubuntu_qnn.sh from this repo onto the box, then:
chmod +x setup_ubuntu_qnn.sh
./setup_ubuntu_qnn.sh
```

If you prefer to do the NDK by hand instead of the script:
```bash
cd ~
wget https://dl.google.com/android/repository/android-ndk-r26c-linux.zip
unzip android-ndk-r26c-linux.zip
export ANDROID_NDK_ROOT=$HOME/android-ndk-r26c
```

---

## 4. Install ExecuTorch (on the Ubuntu box)
```bash
cd ~/executorch
source ~/et-venv/bin/activate
./install_executorch.sh        # recent versions; older: ./install_requirements.sh
```

---

## 5. Download + set up the Qualcomm QNN SDK 2.37.0
1. Log in with your Qualcomm account, then download (link #3):
   https://softwarecenter.qualcomm.com/api/download/software/sdks/Qualcomm_AI_Runtime_Community/All/2.37.0.250724/v2.37.0.250724.zip
2. Unzip and point env vars at it:
   ```bash
   mkdir -p ~/qairt && cd ~/qairt
   unzip ~/Downloads/v2.37.0.250724.zip      # adjust path to where it downloaded
   export QNN_SDK_ROOT=$HOME/qairt/2.37.0     # the dir containing QNN_README.txt
   source $QNN_SDK_ROOT/bin/envsetup.sh
   export PYTHONPATH=$HOME/executorch/..:$PYTHONPATH
   ```

---

## 6. Build ExecuTorch with QNN + export a model for SM8750
```bash
cd ~/executorch
./backends/qualcomm/scripts/build.sh

python -m examples.qualcomm.scripts.deeplab_v3 \
  -b build-android -m SM8750 --compile_only --download
# -> ./deeplab_v3/dlv3_qnn.pte
```

---

## 7. Run on the S25 NPU
Two ways to bridge "built on Linux, phone on Mac":
- **Simplest:** `scp` the outputs to your Mac and run the `adb push` / run commands
  (your Mac already has `adb`). See `EXECUTORCH_QNN_SETUP.md` Stage 4 (libs are the
  V79 / aarch64-android set).
- Or run adb directly from the Linux box if the phone is reachable there.

---

## Gotchas
- **Verify `QcomChipset.SM8750` exists** in your build before debugging load errors —
  the 8 Elite is new; if missing, use a newer ExecuTorch commit or fall back to CPU.
- QNN SDK is large (GBs) — download on a good connection.
- Versions move fast — cross-check the two reference doc links above before each step.

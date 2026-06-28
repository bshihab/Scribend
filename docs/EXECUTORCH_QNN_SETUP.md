# Priority 1 — ExecuTorch + Qualcomm QNN Setup Runbook (Dev 1)

Goal: de-risk the on-device AI pipeline **before** Dev 2's real `.pte` models arrive,
by proving `export → load .pte → run → return` works end-to-end on a Snapdragon phone.

> **Golden rule: CPU first, NPU second.**
> Get a model running on the CPU (XNNPACK) backend before touching QNN. If QNN
> fights you, you still have a working AI demo. Don't start with QNN.

---

## ⚠️ Two hard prerequisites (read before anything)

1. **You need a Linux environment for the toolchain.** ExecuTorch's QNN build +
   model export is verified on **Ubuntu 22.04 / Linux / WSL — NOT macOS.**
   Options from your Mac:
   - A cloud Linux VM (e.g. an Ubuntu 22.04 instance), **or**
   - A local Linux VM / Docker container running Ubuntu 22.04.
   Your Mac is fine for editing code + git; the *build/export* must happen on Linux.

2. **You need a real Qualcomm Snapdragon phone** with `adb` access for the NPU
   (HTP). Verified SoCs: **SM8550, SM8450** (also SM8650). An emulator can only do
   x86 HTP emulation (also Linux-only) — it won't prove real NPU performance.

   **>>> THIS PROJECT'S DEVICE: Samsung Galaxy S25 Ultra <<<**
   - SoC: **Snapdragon 8 Elite = `SM8750`** → use `-m SM8750` / `QcomChipset.SM8750`
   - Hexagon NPU version: **V79** → push the `...V79Stub.so` + `hexagon-v79` skel libs
   - ⚠️ The 8 Elite (SM8750) is very new — confirm `QcomChipset.SM8750` exists in your
     ExecuTorch + QNN 2.37.0 build. If it's missing, you may need a newer ExecuTorch
     commit / QNN SDK, or fall back to the CPU (XNNPACK) track for now.

If you don't have a Snapdragon device, do the **CPU (XNNPACK)** track — it still
proves the whole runtime + JNI + `.pte` pipeline, just without NPU acceleration.

---

## Verified versions (as of current ExecuTorch docs)
| Component | Version |
|---|---|
| Qualcomm AI Engine Direct (QNN) SDK | **2.37.0** (recommended) |
| Android NDK | **26c** |
| G++ / GCC | **13+** |
| Host OS | **Ubuntu 22.04 LTS** |
| Python | ExecuTorch-recommended version |

QNN 2.37.0 direct download:
https://softwarecenter.qualcomm.com/api/download/software/sdks/Qualcomm_AI_Runtime_Community/All/2.37.0.250724/v2.37.0.250724.zip

---

## Stage 0 — Environment (on Linux)
```bash
# 1. Clone ExecuTorch and install it (follow the current "Getting Started" for exact pip steps)
git clone https://github.com/pytorch/executorch.git
cd executorch
# ... run the documented install/setup for your ExecuTorch version ...

# 2. Set the three path variables
export EXECUTORCH_ROOT=$PWD
export ANDROID_NDK_ROOT=/path/to/android-ndk-r26c
export QNN_SDK_ROOT=/path/to/qairt/2.37.0   # dir containing QNN_README.txt

# 3. Source QNN + set Python path
source $QNN_SDK_ROOT/bin/envsetup.sh
export PYTHONPATH=$EXECUTORCH_ROOT/..:$PYTHONPATH
```

## Stage 1 — CPU track first (XNNPACK)  ✅ do this before QNN
Export and run ANY small model on the CPU backend to prove the pipeline.
Follow the ExecuTorch XNNPACK tutorial to export a sample model to `.pte` and run
it with `executor_runner`. Milestone: a real (small) model returns real output on
the phone via the runtime. **Only proceed to QNN once this works.**

## Stage 2 — Build ExecuTorch with QNN
```bash
cd $EXECUTORCH_ROOT
./backends/qualcomm/scripts/build.sh            # Android target
# ./backends/qualcomm/scripts/build.sh --release  # release build
```

## Stage 3 — Export a sample model to a QNN .pte
You don't need Dev 2's models — use the bundled example to prove QNN works:
```bash
cd $EXECUTORCH_ROOT
python -m examples.qualcomm.scripts.deeplab_v3 \
  -b build-android \
  -m SM8750 \           # <-- S25 Ultra (Snapdragon 8 Elite)
  --compile_only \
  --download
# Output: ./deeplab_v3/dlv3_qnn.pte
```

Custom-model export (Python API) — this is the pattern you'll reuse for Dev 2's models:
```python
import torch
from executorch.backends.qualcomm.utils.utils import (
    generate_qnn_executorch_compiler_spec,
    generate_htp_compiler_spec,
    QcomChipset,
    to_edge_transform_and_lower_to_qnn,
)

model = YourModelClass().eval()
example_inputs = (torch.randn(1, 3, 224, 224),)

backend_options = generate_htp_compiler_spec(use_fp16=True)
compile_spec = generate_qnn_executorch_compiler_spec(
    soc_model=QcomChipset.SM8750,        # <-- S25 Ultra (Snapdragon 8 Elite)
    backend_options=backend_options,
)
delegated = to_edge_transform_and_lower_to_qnn(model, example_inputs, compile_spec)
program = delegated.to_executorch()
open("custom_model_qnn.pte", "wb").write(program.buffer)
```

## Stage 4 — Run the QNN model on the device
```bash
DEVICE_DIR=/data/local/tmp/executorch_qualcomm_tutorial/
adb shell "mkdir -p ${DEVICE_DIR}"

# Push the QNN runtime libs (HTP stubs + hexagon skels for your device's Hexagon ver)
adb push ${QNN_SDK_ROOT}/lib/aarch64-android/libQnnHtp.so ${DEVICE_DIR}
adb push ${QNN_SDK_ROOT}/lib/aarch64-android/libQnnSystem.so ${DEVICE_DIR}
adb push ${QNN_SDK_ROOT}/lib/aarch64-android/libQnnHtpV79Stub.so ${DEVICE_DIR}   # S25 Ultra = Hexagon V79
adb push ${QNN_SDK_ROOT}/lib/hexagon-v79/unsigned/libQnnHtpV79Skel.so ${DEVICE_DIR} # S25 Ultra = Hexagon V79

# Push model + runner + backend
adb push ./deeplab_v3/dlv3_qnn.pte ${DEVICE_DIR}
adb push ${EXECUTORCH_ROOT}/build-android/examples/qualcomm/executor_runner/qnn_executor_runner ${DEVICE_DIR}
adb push ${EXECUTORCH_ROOT}/build-android/backends/qualcomm/libqnn_executorch_backend.so ${DEVICE_DIR}

# Run it
adb shell "cd ${DEVICE_DIR} \
  && export LD_LIBRARY_PATH=${DEVICE_DIR} \
  && export ADSP_LIBRARY_PATH=${DEVICE_DIR} \
  && ./qnn_executor_runner --model_path ./dlv3_qnn.pte"
```
> Pick the `...V69/V73/V75/V79...` stub + skel that matches your phone's Hexagon
> version. Wrong version = load failure.

## Stage 5 — Wire it into OUR app (the payoff)
1. Build the ExecuTorch Android AAR:
   ```bash
   cd $EXECUTORCH_ROOT
   export BUILD_AAR_DIR=$EXECUTORCH_ROOT/aar-out
   ./scripts/build_android_library.sh
   ```
2. Drop `executorch.aar` into the app's `app/libs/`.
3. In `native-lib.cpp`, replace the fake `return` strings with ExecuTorch runtime
   calls that load the `.pte` and run inference. **The JNI signatures don't change**,
   so Dev 4's frontend is untouched.

---

## Milestones (tick these off)
- [ ] Linux env + QNN SDK 2.37.0 + NDK 26c installed; env vars set
- [ ] **Stage 1:** a small model runs on CPU (XNNPACK) on the phone
- [ ] Stage 2: ExecuTorch builds with QNN
- [ ] Stage 3: sample model exported to a QNN `.pte`
- [ ] Stage 4: sample QNN model runs on the Snapdragon NPU via adb
- [ ] Stage 5: AAR integrated; `native-lib.cpp` swapped from stub → real (Dev 2's models)

## Source
ExecuTorch Qualcomm backend docs: https://docs.pytorch.org/executorch/main/backends-qualcomm.html
(Versions/commands move fast — re-check this page before each stage.)

# Dev 1 Setup From Zero — Step by Step (solo)

Three phases, easiest first. **Do Phase 1 before anything else** — it proves the
ExecuTorch pipeline on your Mac in ~1 hour with no cloud and no device.

| Phase | What it proves | Where | Hard? |
|---|---|---|---|
| 1. CPU on Mac | export `.pte` → run it → get real output | Your Mac | easy |
| 2. CPU on S25 | the model runs on the actual phone | Mac + S25 via adb | medium |
| 3. NPU (QNN) | runs on the Snapdragon 8 Elite NPU | Linux cloud + Mac + S25 | hard |

ExecuTorch supports macOS (Apple Silicon), Python 3.10–3.13.

---

## PHASE 1 — Prove the pipeline on your Mac (do this first)

### 1. Install prerequisites (Terminal on your Mac)
```bash
# Homebrew (skip if you already have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python + git
brew install python@3.12 git
```

### 2. Make an isolated Python environment
```bash
python3.12 -m venv ~/scribend-et-env
source ~/scribend-et-env/bin/activate    # run this every new terminal
```

### 3. Install ExecuTorch
```bash
pip install --upgrade pip
pip install executorch torch torchvision
```

### 4. Export a sample model to `.pte` (CPU / XNNPACK backend)
Save as `export_model.py`:
```python
import torch
import torchvision.models as models
from torchvision.models.mobilenetv2 import MobileNet_V2_Weights
from executorch.backends.xnnpack.partition.xnnpack_partitioner import XnnpackPartitioner
from executorch.exir import to_edge_transform_and_lower

model = models.mobilenetv2.mobilenet_v2(weights=MobileNet_V2_Weights.DEFAULT).eval()
sample_inputs = (torch.randn(1, 3, 224, 224),)

et_program = to_edge_transform_and_lower(
    torch.export.export(model, sample_inputs),
    partitioner=[XnnpackPartitioner()],
).to_executorch()

with open("model.pte", "wb") as f:
    f.write(et_program.buffer)
print("Wrote model.pte")
```
Run it:
```bash
python export_model.py        # produces model.pte
```

### 5. Run the `.pte` and confirm output
Save as `run_model.py`:
```python
import torch
from executorch.runtime import Runtime

runtime = Runtime.get()
program = runtime.load_program("model.pte")
method = program.load_method("forward")

output = method.execute([torch.randn(1, 3, 224, 224)])
print("Inference OK. Output shape:", output[0].shape)
```
Run it:
```bash
python run_model.py
```
✅ **Milestone 1:** You exported a model and ran it through the ExecuTorch runtime.
The pipeline works. (This is the exact pattern you'll reuse for Dev 2's real models.)

---

## PHASE 2 — Run on the S25 Ultra (device)

### 6. Install adb on your Mac + enable the phone
```bash
brew install android-platform-tools
```
On the S25: **Settings → About phone → Software information → tap "Build number" 7×**
to unlock Developer options, then **Settings → Developer options → enable USB debugging.**
Plug the phone in, accept the trust prompt, then:
```bash
adb devices        # should list your S25 serial
```

### 7. Build the ExecuTorch Android runtime + run the model on-device
This needs the Android NDK and the ExecuTorch Android build. Follow the XNNPACK
Android path in the ExecuTorch docs (build the AAR or `executor_runner` for
`arm64-v8a`, push `model.pte` with `adb push`, run it). See `EXECUTORCH_QNN_SETUP.md`
Stage 5 for the AAR build command.
✅ **Milestone 2:** the model runs on the S25's CPU.

---

## PHASE 3 — NPU acceleration via QNN (Linux required)

The QNN toolchain does NOT run on macOS. Build/export on Linux, then run on the
phone via adb from your Mac.

### 8. Stand up an x86_64 Ubuntu 22.04 environment
- A cloud VM is simplest (any provider; pick **x86_64 / amd64**, Ubuntu 22.04 LTS).
- Why not your Mac: QNN host tools are `x86_64-linux`. Why not Docker on Apple
  Silicon: it's arm64; x86 emulation is slow/fragile for this.

### 9. Install deps on the Linux box
```bash
sudo apt update && sudo apt install -y git build-essential g++-13 python3.10-venv unzip
```
- Android NDK **26c**
- Qualcomm QNN SDK **2.37.0** (download link in `EXECUTORCH_QNN_SETUP.md`)

### 10. Build ExecuTorch QNN + export an SM8750 model
Follow `EXECUTORCH_QNN_SETUP.md` Stages 0–3 (set env vars, `build.sh`, export the
`deeplab_v3` sample with `-m SM8750`).

### 11. Run on the S25 NPU
Two ways to bridge "build on Linux, phone on Mac":
- **(a) Simplest:** `scp` the build outputs (the `.pte`, `qnn_executor_runner`,
  `libqnn_executorch_backend.so`) and the needed QNN device libs (the
  `aarch64-android` + `hexagon-v79` `.so` files) from the Linux box to your Mac,
  then run the `adb push` / run commands (Stage 4) **from your Mac**.
- **(b) Advanced:** wireless adb / adb-over-network from the Linux box to the phone.
✅ **Milestone 3:** a model runs on the Snapdragon 8 Elite NPU.

---

## Order of attack
1. Phase 1 today (Mac, ~1 hr) — unblocks nothing else but proves you can ship.
2. Phase 2 (device) when you have a spare hour.
3. Phase 3 (QNN) is the real Dev 1 deliverable — start it once Phase 1 works.
4. When Dev 2 hands over real `.pte` models, you re-run the export pattern on them
   and swap the stub `return`s in `native-lib.cpp`. Frontend never changes.

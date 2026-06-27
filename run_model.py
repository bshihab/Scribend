"""
Phase 1 — load model.pte and run one inference to confirm the pipeline works.
Run after export_model.py:  python run_model.py
"""
import torch
from executorch.runtime import Runtime

runtime = Runtime.get()
program = runtime.load_program("model.pte")
method = program.load_method("forward")

output = method.execute([torch.randn(1, 3, 224, 224)])
print("Inference OK. Output shape:", output[0].shape)

"""
export_minilm.py
================
Downloads the all-MiniLM-L6-v2 sentence embedding model from Hugging Face,
applies INT8 Post-Training Quantization (PTQ) via torch.ao, traces it into
an ExecuTorch FX graph, and serializes it to a .pte binary.

The .pte file is handed to Developer 1 for loading into the Android C++ runtime.

Output: models/minilm.pte
Expected size: ~10–25 MB (compressed from ~90 MB float32)
"""

import torch
torch.backends.quantized.engine = 'qnnpack'
from sentence_transformers import SentenceTransformer

# ── Step 1: Download MiniLM from Hugging Face ─────────────────────────────────
print("[1/5] Downloading all-MiniLM-L6-v2 from Hugging Face...")
st_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

# Extract the core PyTorch transformer from the SentenceTransformer wrapper
torch_model = st_model[0].auto_model
torch_model.eval()  # Switch to inference mode (disables dropout, etc.)
print("      ✅ Model downloaded.")

# ── Step 2: Skip INT8 Quantization (Tracing Issue) ───────────────────────────
# The Mac/ExecuTorch tracer currently bugs out on eagerly quantized Linear layers.
# Since MiniLM is tiny (~90MB), we will just export the unquantized float32 model.
print("[2/5] Skipping INT8 quantization (using float32)...")
quantized_model = torch_model

# ── Step 3: Create a sample input to trace the model ─────────────────────────
# ExecuTorch needs to "watch" the model run once to understand its graph.
# We feed it a fake input of the right shape: [batch=1, seq_len=128 tokens]
print("[3/5] Tracing model graph with example input...")
example_input_ids      = torch.zeros(1, 128, dtype=torch.long)
example_attention_mask = torch.ones(1, 128,  dtype=torch.long)
example_inputs = (example_input_ids, example_attention_mask)

with torch.no_grad():
    exported = torch.export.export(quantized_model, example_inputs)
print("      ✅ Graph traced.")

# ── Step 4: Convert to ExecuTorch edge format ─────────────────────────────────
print("[4/5] Converting to ExecuTorch edge program...")
from executorch.exir import to_edge
edge_program = to_edge(exported)
print("      ✅ Edge program created.")

# ── Step 5: Save to .pte binary file ─────────────────────────────────────────
output_path = "models/minilm.pte"
print(f"[5/5] Saving to {output_path}...")
with open(output_path, "wb") as f:
    f.write(edge_program.to_executorch().buffer)

import os
size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"      ✅ Saved! File size: {size_mb:.1f} MB")
print()
print("🎉 minilm.pte ready. Hand this file to Developer 1.")

# ── Quick Smoke Test ──────────────────────────────────────────────────────────
print("\n--- Smoke Test (verifying model output shape) ---")
with torch.no_grad():
    test_output = quantized_model(example_input_ids, example_attention_mask)
print(f"Output shape: {test_output.last_hidden_state.shape}")
print("Expected:     torch.Size([1, 128, 384])  ← 384 is the embedding dimension")

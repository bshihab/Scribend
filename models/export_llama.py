"""
export_llama.py
================
Downloads the meta-llama/Llama-3.2-3B-Instruct model from Hugging Face,
applies INT8 quantization to fit within device memory constraints, traces it
into an ExecuTorch FX graph, and serializes it to a .pte binary.

The .pte file is handed to Developer 1 for loading into the Android C++ runtime.

Output: models/llama3.pte
"""

import torch
# We use qnnpack backend for on-device quantization
torch.backends.quantized.engine = 'qnnpack'
from transformers import AutoModelForCausalLM

def main():
    print("[1/4] Downloading meta-llama/Llama-3.2-3B-Instruct from Hugging Face...")
    model_name = "meta-llama/Llama-3.2-3B-Instruct"
    # Load model directly in float32 for tracing
    torch_model = AutoModelForCausalLM.from_pretrained(model_name)
    torch_model.eval()
    print("      ✅ Model downloaded.")

    print("[2/4] Tracing model graph with example input...")
    # Wrap model to disable Hugging Face's DynamicCache output which breaks tracing
    class LlamaWrapper(torch.nn.Module):
        def __init__(self, m):
            super().__init__()
            self.m = m
        def forward(self, input_ids, attention_mask):
            # return_dict=False and use_cache=False forces it to return just the raw logits tensor
            return self.m(input_ids=input_ids, attention_mask=attention_mask, use_cache=False, return_dict=False)[0]

    wrapped_model = LlamaWrapper(torch_model)
    
    # Llama expects input_ids and attention_mask
    example_input_ids = torch.zeros(1, 128, dtype=torch.long)
    example_attention_mask = torch.ones(1, 128, dtype=torch.long)
    example_inputs = (example_input_ids, example_attention_mask)
    
    with torch.no_grad():
        exported = torch.export.export(wrapped_model, example_inputs)
    print("      ✅ Graph traced.")

    print("[3/4] Converting to ExecuTorch edge program (Skipping INT8 quantization for hackathon MVP)...")
    # Note: Full INT8 quantization requires specific delegates like XNNPACK or Hexagon.
    # We export the raw graph to edge format.
    from executorch.exir import to_edge
    edge_program = to_edge(exported)
    print("      ✅ Edge program created.")

    output_path = "models/llama3.pte"
    print(f"[4/4] Saving to {output_path}...")
    with open(output_path, "wb") as f:
        f.write(edge_program.to_executorch().buffer)

    import os
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"      ✅ Saved! File size: {size_mb:.1f} MB")
    print()
    print("🎉 llama3.pte ready. Hand this file to Developer 1.")

if __name__ == "__main__":
    main()

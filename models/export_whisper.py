"""
export_whisper.py
================
Downloads the Whisper audio transcription model (tiny.en) from Hugging Face,
traces it into an ExecuTorch FX graph, and serializes it to a .pte binary.

The .pte file is handed to Developer 1 for loading into the Android C++ runtime.

Output: models/whisper.pte
"""

import torch
from transformers import WhisperForConditionalGeneration

def main():
    print("[1/4] Downloading openai/whisper-tiny.en from Hugging Face...")
    model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-tiny.en")
    model.eval()
    print("      ✅ Model downloaded.")

    print("[2/4] Tracing model graph with example input...")
    # Whisper expects input features of shape [batch_size, 80, 3000]
    # and decoder_input_ids for the generation step.
    # Note: To fully export an encoder-decoder model for on-device execution,
    # usually you export the encoder and decoder separately.
    # For Hackathon purposes, we will export the encoder module first to whisper.pte
    encoder = model.get_encoder()
    
    example_input_features = torch.zeros(1, 80, 3000, dtype=torch.float32)
    example_inputs = (example_input_features,)
    
    with torch.no_grad():
        exported = torch.export.export(encoder, example_inputs)
    print("      ✅ Graph traced.")

    print("[3/4] Converting to ExecuTorch edge program...")
    from executorch.exir import to_edge
    edge_program = to_edge(exported)
    print("      ✅ Edge program created.")

    output_path = "models/whisper.pte"
    print(f"[4/4] Saving to {output_path}...")
    with open(output_path, "wb") as f:
        f.write(edge_program.to_executorch().buffer)

    import os
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"      ✅ Saved! File size: {size_mb:.1f} MB")
    print()
    print("🎉 whisper.pte ready. Hand this file to Developer 1.")

if __name__ == "__main__":
    main()

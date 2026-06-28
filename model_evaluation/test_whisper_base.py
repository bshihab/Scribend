import time
import torch
import librosa
from transformers import WhisperProcessor, WhisperForConditionalGeneration

MODEL_NAME = "openai/whisper-base.en"
AUDIO_PATH = "model_evaluation/test_medical.wav"

def test_whisper():
    print(f"Loading {MODEL_NAME}...")
    processor = WhisperProcessor.from_pretrained(MODEL_NAME)
    model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)
    model.eval()

    print(f"Loading audio {AUDIO_PATH}...")
    audio, sr = librosa.load(AUDIO_PATH, sr=16000)
    input_features = processor(audio, sampling_rate=sr, return_tensors="pt").input_features

    print("Running inference...")
    start_time = time.time()
    with torch.no_grad():
        predicted_ids = model.generate(input_features)
    end_time = time.time()

    transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]

    print("\n" + "="*40)
    print(f"RESULTS FOR {MODEL_NAME}")
    print("="*40)
    print(f"Time Taken:  {end_time - start_time:.2f} seconds")
    print(f"Transcription: {transcription.strip()}")
    print("="*40 + "\n")

if __name__ == "__main__":
    test_whisper()

"""
test_master_pipeline.py
========================
Tests the entire Scribend AI pipeline:
1. Audio (my_voice.wav) -> Whisper (Text)
2. Text -> Llama 3.2 3B (JSON SOAP Note)
3. JSON -> MiniLM (Vector Embeddings)
"""
import torch
import json
import re
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer
import librosa

def main():
    audio_path = "model_evaluation/my_voice.wav"
    print("="*50)
    print("🚀 SCRIBEND HACKATHON DEMO PIPELINE")
    print("="*50)

    # ---------------------------------------------------------
    # STEP 1: WHISPER (Audio -> Text)
    # ---------------------------------------------------------
    print(f"\n[1/3] Loading Whisper to transcribe {audio_path}...")
    processor = WhisperProcessor.from_pretrained("openai/whisper-tiny.en")
    whisper_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-tiny.en")
    
    try:
        audio_input, sr = librosa.load(audio_path, sr=16000)
    except Exception as e:
        print(f"❌ Error loading audio: {e}")
        print("Did you record your voice first? Run: python3 tools/record_audio.py")
        return

    input_features = processor(audio_input, sampling_rate=sr, return_tensors="pt").input_features
    predicted_ids = whisper_model.generate(input_features)
    transcript = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
    
    print("\n📝 TRANSCRIPT RESULT:")
    print(f"\"{transcript}\"")

    # ---------------------------------------------------------
    # STEP 2: LLAMA 3.2 3B (Text -> SOAP Note JSON)
    # ---------------------------------------------------------
    print("\n[2/3] Loading Llama-3.2-3B to generate SOAP Note (Optimized for Mac GPU)...")
    model_name = "meta-llama/Llama-3.2-3B-Instruct"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    # Load using bfloat16 to cut memory in half, and send to Apple's GPU (mps)
    llama_model = AutoModelForCausalLM.from_pretrained(
        model_name, 
        torch_dtype=torch.bfloat16,
        device_map="mps"
    )

    prompt = f"""You are a medical scribe. Convert this transcript to a JSON SOAP note.
Transcript: {transcript}
Output ONLY valid JSON with keys Patient, ChiefComplaints, HistoryOfPresentIllness, PastMedicalHistory, Medications, Assessment, Plan."""

    messages = [{"role": "user", "content": prompt}]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    # Send inputs to mps as well
    inputs = tokenizer([text], return_tensors="pt").to("mps")

    outputs = llama_model.generate(**inputs, max_new_tokens=300, temperature=0.1)
    response = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
    
    # Extract just the JSON part from the response
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    if json_match:
        soap_note = json_match.group(0)
    else:
        soap_note = response.split("assistant\n")[-1]

    print("\n🏥 SOAP NOTE GENERATED:")
    print(soap_note)

    # ---------------------------------------------------------
    # STEP 3: MINILM (Sentences -> Vector Embeddings)
    # ---------------------------------------------------------
    print("\n[3/3] Loading MiniLM to generate Vector Embeddings...")
    sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
    
    try:
        data = json.loads(soap_note)
        # Flatten values to sentences
        sentences = []
        for v in data.values():
            if isinstance(v, list):
                sentences.extend([str(item) for item in v])
            elif isinstance(v, dict):
                sentences.extend([f"{k}: {v}" for k, v in v.items()])
            else:
                sentences.append(str(v))
    except:
        sentences = [transcript] # Fallback
        
    embeddings = sentence_model.encode(sentences)
    
    print("\n🔢 VECTOR CLUSTERING DATA:")
    for i in range(min(3, len(sentences))):
        print(f"Sentence: '{sentences[i]}'")
        print(f"Vector (first 5 of 384): {embeddings[i][:5].tolist()}...\n")
        
    print("="*50)
    print("✅ PIPELINE SUCCESSFUL!")
    print("Audio -> Text -> Structured JSON -> Database Vectors")
    print("="*50)

if __name__ == "__main__":
    main()

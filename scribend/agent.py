"""
agent.py
========
This is the main "Brain" of the Scribend application.
It ties all three AI models together into a single, cohesive workflow:
1. Audio in -> Whisper (Transcription)
2. Transcription -> Patient History DB Tool (Vector Search)
3. Transcription + History -> Llama 3.2 3B (SOAP Note Generation)
"""
import torch
import librosa
import re
from transformers import WhisperProcessor, WhisperForConditionalGeneration, AutoModelForSpeechSeq2Seq, AutoProcessor
from transformers import AutoModelForCausalLM, AutoTokenizer
import time
import logging
from scribend.system_prompt import SCRIBE_SYSTEM_PROMPT, MARKDOWN_SYSTEM_PROMPT
from scribend.tools.patient_history_tool import get_patient_history
from scribend.medical_vocabulary import MEDICAL_VOCABULARY_PROMPT

class ScribendAgent:
    def __init__(self):
        print("[SYSTEM] Loading Models into Memory...")
        
        # 1. Load Primary ASR (Distil-Whisper Small - Fast & highly accurate)
        self.primary_processor = AutoProcessor.from_pretrained("distil-whisper/distil-small.en")
        self.primary_whisper = AutoModelForSpeechSeq2Seq.from_pretrained("distil-whisper/distil-small.en")
        
        # 2. Load Fallback ASR (Whisper Tiny - Quantized fail-safe)
        self.fallback_processor = AutoProcessor.from_pretrained("openai/whisper-tiny.en")
        self.fallback_whisper = AutoModelForSpeechSeq2Seq.from_pretrained("openai/whisper-tiny.en")
        
        # Load Qwen (Optimized for Mac GPU)
        self.llm_model_name = "Qwen/Qwen2.5-1.5B-Instruct"
        self.llm_tokenizer = AutoTokenizer.from_pretrained(self.llm_model_name)
        self.llm_model = AutoModelForCausalLM.from_pretrained(
            self.llm_model_name, 
            torch_dtype=torch.bfloat16,
            device_map="mps"
        )
        print("Agent is fully loaded and ready!")

    def transcribe_audio(self, audio_file_path):
        print("\n[SYSTEM] Initializing primary transcription (Distil-Whisper Small)...")
        start_time = time.time()
        latency_threshold = 15.0  # Max allowable seconds before triggering fallback
        
        # Load audio once for both models
        audio_array, sr = librosa.load(audio_file_path, sr=16000)
        
        try:
            # --- PRIMARY EXECUTION ---
            input_features = self.primary_processor(
                audio_array, sampling_rate=sr, return_tensors="pt"
            ).input_features
            
            input_features = input_features.to(dtype=self.primary_whisper.dtype, device=self.primary_whisper.device)
            
            # Generating without prompt_ids to avoid 2D tensor boolean ambiguity errors in this transformers version
            predicted_ids = self.primary_whisper.generate(
                input_features,
                no_repeat_ngram_size=3
            )
            
            transcript = self.primary_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
            execution_time = time.time() - start_time
            
            # Validate Latency
            if execution_time > latency_threshold:
                raise TimeoutError(f"Primary model exceeded {latency_threshold}s limit.")
                
            print(f"[SYSTEM] Primary transcription successful ({execution_time:.2f}s).")
            return transcript
            
        except Exception as error:
            # --- THE CATCH / SCAFFOLDING LAYER ---
            logging.warning(f"Primary ASR failure detected: {error}")
            print("[SYSTEM] Circuit breaker triggered. Rerouting to Whisper Tiny fallback...")
            
            try:
                # --- FALLBACK EXECUTION ---
                input_features = self.fallback_processor(
                    audio_array, sampling_rate=sr, return_tensors="pt"
                ).input_features
                
                # Fallback runs without the complex hint to prevent the Tiny model from looping
                predicted_ids = self.fallback_whisper.generate(
                    input_features,
                    no_repeat_ngram_size=3
                )
                
                fallback_transcript = self.fallback_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
                print("[SYSTEM] Fallback transcription successful.")
                return fallback_transcript
                
            except Exception as critical_error:
                # Ultimate Failsafe (Prevents total application crash)
                logging.error(f"Critical System Failure: Both ASR models failed. {critical_error}")
                return "Error: Transcription services temporarily unavailable."

    def generate_soap_note(self, audio_path: str):
        """The main workflow: Audio -> Transcript -> History -> SOAP Note"""
        # 1. Get Transcript
        transcript = self.transcribe_audio(audio_path)
        
        # 2. Search Database for context
        print("\n[2/3] Checking patient history...")
        history_context = get_patient_history(transcript)
        
        # 3. Build the prompt
        print("\n[3/3] Generating final SOAP Note with Qwen-1.5B...")
        user_prompt = f"Transcript:\n{transcript}\n\nPast Patient History Context (if relevant):\n{history_context}"
        
        messages = [
            {"role": "system", "content": SCRIBE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        text = self.llm_tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.llm_tokenizer([text], return_tensors="pt").to("mps")
        
        # Generate the JSON output
        outputs = self.llm_model.generate(**inputs, max_new_tokens=600, do_sample=False, repetition_penalty=1.15)
        
        # Only decode the NEWly generated tokens (ignore the prompt)
        generated_ids = outputs[0][inputs.input_ids.shape[-1]:]
        response = self.llm_tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        
        # Extract the JSON block from the new response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            final_note = json_match.group(0)
        else:
            final_note = response
            
        return final_note, transcript

    def generate_markdown_note(self, json_note: str) -> str:
        """Step 4: Convert the JSON SOAP note into a rich, formatted Markdown document."""
        print("\n[4/4] Formatting SOAP note as Markdown...")
        
        messages = [
            {"role": "system", "content": MARKDOWN_SYSTEM_PROMPT},
            {"role": "user", "content": f"Convert this JSON SOAP note into a formatted Markdown document:\n\n{json_note}"}
        ]
        
        text = self.llm_tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.llm_tokenizer([text], return_tensors="pt").to("mps")
        outputs = self.llm_model.generate(**inputs, max_new_tokens=800, do_sample=False, repetition_penalty=1.15)
        
        generated_ids = outputs[0][inputs.input_ids.shape[-1]:]
        markdown = self.llm_tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        
        # Aggressively strip out HTML tags from the output
        markdown = re.sub(r'</?[a-zA-Z0-9_-]+[^>]*>', '', markdown)
        return markdown


if __name__ == "__main__":
    import os
    from datetime import datetime

    # Test the agent with the user's recorded voice
    agent = ScribendAgent()
    
    print("\n" + "="*50)
    print("🏥 RUNNING FINAL SCRIBEND AGENT")
    print("="*50)
    
    final_json, raw_transcript = agent.generate_soap_note("model_evaluation/my_voice.wav")
    
    # Aggressively correct the dialogue in the JSON before saving or passing to Markdown
    import json
    try:
        data = json.loads(final_json)
        # Override the hallucinated dialogue with the exact raw transcript
        data["DiarizedTranscript"] = [f"[Transcript]: {raw_transcript.strip()}"]
        final_json = json.dumps(data, indent=2)
    except json.JSONDecodeError:
        pass
    
    print("\n✨ FINAL GENERATED SOAP NOTE (JSON) ✨")
    print(final_json)
    print("="*50)

    # Generate the rich Markdown SOAP note
    markdown_note = agent.generate_markdown_note(final_json)

    # Save it to a timestamped .md file in soap_notes/
    os.makedirs("soap_notes", exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    output_path = f"soap_notes/soap_note_{timestamp}.md"
    with open(output_path, "w") as f:
        f.write(markdown_note)

    print(f"\n📄 MARKDOWN SOAP NOTE saved to: {output_path}")
    print("="*50)
    print(markdown_note)
    print("="*50)

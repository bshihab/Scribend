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
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from transformers import AutoModelForCausalLM, AutoTokenizer
from scribend.system_prompt import SCRIBE_SYSTEM_PROMPT, MARKDOWN_SYSTEM_PROMPT
from scribend.tools.patient_history_tool import get_patient_history
from scribend.medical_vocabulary import MEDICAL_VOCABULARY_PROMPT

class ScribendAgent:
    def __init__(self):
        print("Initializing Scribend Agent (Loading Models...)")
        
        # Load Whisper
        self.whisper_processor = WhisperProcessor.from_pretrained("openai/whisper-tiny.en")
        self.whisper_model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-tiny.en")
        
        # Load Llama (Optimized for Mac GPU)
        self.llama_model_name = "meta-llama/Llama-3.2-3B-Instruct"
        self.llama_tokenizer = AutoTokenizer.from_pretrained(self.llama_model_name)
        self.llama_model = AutoModelForCausalLM.from_pretrained(
            self.llama_model_name, 
            torch_dtype=torch.bfloat16,
            device_map="mps"
        )
        print("Agent is fully loaded and ready!")

    def transcribe_audio(self, audio_path: str) -> str:
        """Step 1: Convert doctor's voice to text"""
        print("\n[1/3] Transcribing audio with Whisper...")
        audio, sr = librosa.load(audio_path, sr=16000)
        input_features = self.whisper_processor(audio, sampling_rate=sr, return_tensors="pt").input_features
        
        predicted_ids = self.whisper_model.generate(input_features, no_repeat_ngram_size=3)
        transcript = self.whisper_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0].strip()
        print(f"Transcript: \"{transcript}\"")
        return transcript

    def generate_soap_note(self, audio_path: str):
        """The main workflow: Audio -> Transcript -> History -> SOAP Note"""
        # 1. Get Transcript
        transcript = self.transcribe_audio(audio_path)
        
        # 2. Search Database for context
        print("\n[2/3] Checking patient history...")
        history_context = get_patient_history(transcript)
        
        # 3. Build the prompt
        print("\n[3/3] Generating final SOAP Note with Llama-3.2-3B...")
        user_prompt = f"Transcript:\n{transcript}\n\nPast Patient History Context (if relevant):\n{history_context}"
        
        messages = [
            {"role": "system", "content": SCRIBE_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        text = self.llama_tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.llama_tokenizer([text], return_tensors="pt").to("mps")
        
        # Generate the JSON output
        outputs = self.llama_model.generate(**inputs, max_new_tokens=600, do_sample=False, repetition_penalty=1.15)
        
        # Only decode the NEWly generated tokens (ignore the prompt)
        generated_ids = outputs[0][inputs.input_ids.shape[-1]:]
        response = self.llama_tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        
        # Extract the JSON block from the new response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            final_note = json_match.group(0)
        else:
            final_note = response
            
        return final_note

    def generate_markdown_note(self, json_note: str) -> str:
        """Step 4: Convert the JSON SOAP note into a rich, formatted Markdown document."""
        print("\n[4/4] Formatting SOAP note as Markdown...")
        
        messages = [
            {"role": "system", "content": MARKDOWN_SYSTEM_PROMPT},
            {"role": "user", "content": f"Convert this JSON SOAP note into a formatted Markdown document:\n\n{json_note}"}
        ]
        
        text = self.llama_tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.llama_tokenizer([text], return_tensors="pt").to("mps")
        outputs = self.llama_model.generate(**inputs, max_new_tokens=800, do_sample=False, repetition_penalty=1.15)
        
        generated_ids = outputs[0][inputs.input_ids.shape[-1]:]
        markdown = self.llama_tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        return markdown


if __name__ == "__main__":
    import os
    from datetime import datetime

    # Test the agent with the user's recorded voice
    agent = ScribendAgent()
    
    print("\n" + "="*50)
    print("🏥 RUNNING FINAL SCRIBEND AGENT")
    print("="*50)
    
    final_json = agent.generate_soap_note("model_evaluation/my_voice.wav")
    
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

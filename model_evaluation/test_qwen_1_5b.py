import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"

PROMPT = """You are a medical scribe. Convert this transcript to a JSON SOAP note.
Transcript: Patient presents with a 3 day history of severe headaches. Blood pressure is 152 over 96. Will prescribe Lisinopril 10 milligrams once a day."""

def test_llm():
    print(f"Loading {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float32)

    messages = [{"role": "user", "content": PROMPT}]
    input_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(input_text, return_tensors="pt")

    print("Running inference...")
    start_time = time.time()
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=150)
    end_time = time.time()

    response = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)

    print("\n" + "="*60)
    print(f"RESULTS FOR {MODEL_NAME}")
    print("="*60)
    print(f"Time Taken:  {end_time - start_time:.2f} seconds")
    print(f"Output JSON:\n{response.strip()}")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_llm()

"""
patient_history_tool.py
=======================
This tool simulates fetching a patient's medical history from the database.
In the final app, this will run on-device and query the real SQLite vector DB.
For our Python "brain", we simulate this by querying our JSON test data.
"""
import json
import torch
from sentence_transformers import SentenceTransformer

# Load the model once when the module is imported
print("Loading MiniLM for Patient History Tool...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def get_patient_history(query: str) -> str:
    """
    Simulates a database search to find relevant patient history based on a symptom.
    """
    print(f"\n🔍 [DB SEARCH] Searching patient history for: '{query}'")
    
    # 1. Embed the query
    query_vector = embedder.encode(query, normalize_embeddings=True)
    
    # 2. Load our fake database (the JSON file we generated earlier)
    try:
        with open("dev3_final_test.json", "r") as f:
            data = json.load(f)
            notes = data["notes"]
    except FileNotFoundError:
        return "Error: Database file not found."
        
    # 3. Find the most similar note using cosine similarity
    best_score = -1.0
    best_match = "No relevant history found."
    
    query_tensor = torch.tensor(query_vector)
    
    for note in notes:
        note_tensor = torch.tensor(note["embedding"])
        # Calculate Cosine Similarity (dot product since they are L2 normalized)
        score = torch.dot(query_tensor, note_tensor).item()
        
        if score > best_score:
            best_score = score
            best_match = note["text"]
            
    # We only return the match if the similarity is high enough
    if best_score > 0.3:
        print(f"✅ [DB SEARCH] Found relevant history: '{best_match}' (Score: {best_score:.2f})")
        return best_match
    else:
        print("❌ [DB SEARCH] No relevant history found in DB.")
        return "No relevant history found."

if __name__ == "__main__":
    # Quick test
    result = get_patient_history("patient's blood sugar is too high")
    print(f"Result: {result}")

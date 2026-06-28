"""
patient_history_tool.py
=======================
This tool simulates fetching a patient's medical history from the database.
In the final app, this will run on-device and query the real SQLite vector DB.
For our Python "brain", we simulate this by querying our JSON test data.
"""
import json
import sqlean as sqlite3
import sqlite_vec
import struct
import torch
import os
from sentence_transformers import SentenceTransformer

# Load the model once when the module is imported
print("Loading MiniLM for Patient History Tool...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def blob(vec):
    return struct.pack(f"{len(vec)}f", *vec)

def get_patient_history(query: str) -> str:
    """
    Simulates a database search to find relevant patient history based on a symptom.
    This now uses Dev 3's ACTUAL SQLite Vector database engine!
    """
    print(f"\n🔍 [DB SEARCH] Searching SQLite database for: '{query}'")
    
    # 1. Embed the query
    query_vector = embedder.encode(query, normalize_embeddings=True)
    
    # 2. Boot up Dev 3's SQLite Database in memory
    db = sqlite3.connect(":memory:")
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    
    # 3. Load the database schema
    schema = os.path.join(os.path.dirname(__file__), "..", "..", "local-storage", "schema", "schema.sql")
    with open(schema, encoding="utf-8") as f:
        db.executescript(f.read())
        
    # 4. Insert our fake patient data into the SQL database
    db.execute("INSERT INTO patients(patient_id, full_name) VALUES (1,'Test Patient')")
    try:
        with open("dev3_final_test.json", "r") as f:
            data = json.load(f)
            notes = data["notes"]
            for i, note in enumerate(notes):
                db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,1)", (i,))
                db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                           " VALUES (1,?,?,?)", (i, blob(note["embedding"]), note["text"]))
            db.commit()
    except FileNotFoundError:
        return "Error: Database JSON file not found."
        
    # 5. Run Dev 3's ACTUAL SQL VECTOR SEARCH QUERY!
    rows = db.execute(
        "SELECT chunk_text, distance FROM patient_vectors "
        "WHERE patient_id = 1 AND embedding MATCH ? ORDER BY distance LIMIT 1",
        (blob(query_vector),)
    ).fetchall()
    
    db.close()
    
    if len(rows) > 0 and rows[0][1] < 0.8: # In sqlite-vec, lower distance is better!
        best_match = rows[0][0]
        score = rows[0][1]
        print(f"✅ [DB SEARCH] Found relevant history: '{best_match}' (Distance: {score:.2f})")
        return best_match
    else:
        print("❌ [DB SEARCH] No relevant history found in DB.")
        return "No relevant history found."

if __name__ == "__main__":
    # Quick test
    result = get_patient_history("patient's blood sugar is too high")
    print(f"Result: {result}")

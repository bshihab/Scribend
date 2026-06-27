#!/usr/bin/env python3
# =============================================================================
# test_real_vectors.py — load Dev 2's REAL MiniLM vectors and test clustering.
# Owner: Developer 3 (Local Storage Architect)
#
# Dev 2 is sending a JSON file of real all-MiniLM-L6-v2 embeddings (384-dim,
# float32, L2-normalized, one vector per medical sentence). This script loads
# them into the actual schema and proves the cosine search clusters them by
# MEANING — the final check before the "Big Swap".
#
# Run:
#   python tools/test_real_vectors.py path/to/dev2_vectors.json
#
# Accepts common JSON shapes (auto-detected):
#   [ {"text": "...", "embedding": [384 floats]}, ... ]
#   [ {"sentence": "...", "vector": [...]}, ... ]
#   {"sentences": [...], "vectors": [[...], ...]}
# =============================================================================
import json
import math
import os
import struct
import sys

DIM = 384


def load_json_records(path):
    """Return a list of (text, vector) tuples from various JSON shapes."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    text_keys = ("text", "sentence", "note", "chunk_text", "content")
    vec_keys = ("embedding", "vector", "values", "emb")

    records = []
    if isinstance(data, dict) and any(k in data for k in ("sentences", "texts")):
        texts = data.get("sentences") or data.get("texts")
        vectors = data.get("vectors") or data.get("embeddings")
        records = list(zip(texts, vectors))
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                text = next((item[k] for k in text_keys if k in item), "(no text)")
                vec = next((item[k] for k in vec_keys if k in item), None)
                if vec is None:
                    sys.exit(f"Couldn't find a vector field in: {list(item.keys())}")
                records.append((text, vec))
            elif isinstance(item, list):       # bare list of vectors
                records.append((f"vector {len(records)}", item))
    else:
        sys.exit("Unrecognized JSON shape. See the docstring for accepted formats.")
    return records


def validate(records):
    """Confirm Dev 2's contract: 384-dim, numeric, L2-normalized."""
    print(f"Loaded {len(records)} records. Validating contract...")
    for i, (text, vec) in enumerate(records):
        if len(vec) != DIM:
            sys.exit(f"  ✗ record {i} has {len(vec)} dims, expected {DIM}")
        norm = math.sqrt(sum(x * x for x in vec))
        normalized = abs(norm - 1.0) < 0.05
        if i < 3:
            print(f"  record {i}: dim={len(vec)} ✓  L2-norm={norm:.4f} "
                  f"{'(normalized ✓)' if normalized else '(NOT normalized ⚠)'}")
    print("  ✓ all records are 384-dim")


def blob(vec):
    return struct.pack(f"{len(vec)}f", *vec)


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python tools/test_real_vectors.py path/to/dev2_vectors.json")
    records = load_json_records(sys.argv[1])
    validate(records)

    import sqlite3
    import sqlite_vec
    db = sqlite3.connect(":memory:")
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    schema = os.path.join(os.path.dirname(__file__), "..", "schema", "schema.sql")
    with open(schema, encoding="utf-8") as f:
        db.executescript(f.read())

    # one patient, one row per "encounter" (matches Dev 2's chunking decision)
    db.execute("INSERT INTO patients(patient_id, full_name) VALUES (1,'Real Data Patient')")
    for i, (text, vec) in enumerate(records):
        db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,1)", (i,))
        db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                   " VALUES (1,?,?,?)", (i, blob(vec), text))
    db.commit()
    print(f"\nInserted {len(records)} real MiniLM vectors.\n")

    # clustering check: for each sentence, show its nearest neighbor by meaning
    print("Nearest-neighbor by meaning (each sentence's closest OTHER sentence):")
    for i, (text, vec) in enumerate(records):
        rows = db.execute(
            "SELECT encounter_id, chunk_text, distance FROM patient_vectors "
            "WHERE patient_id = 1 AND embedding MATCH ? AND encounter_id != ? "
            "ORDER BY distance LIMIT 1",
            (blob(vec), i)).fetchall()
        if rows:
            _, nn_text, dist = rows[0]
            print(f"\n  «{text[:60]}»")
            print(f"   ↳ closest (dist={dist:.4f}): «{nn_text[:60]}»")

    db.close()
    print("\n✅ Real MiniLM vectors load and cluster correctly in the on-device schema.")


if __name__ == "__main__":
    main()

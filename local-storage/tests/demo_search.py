#!/usr/bin/env python3
# =============================================================================
# demo_search.py — a watch-it-work demo of the Scribend vector store.
# Owner: Developer 3 (Local Storage Architect)
#
# This is the "see it actually work" script. Instead of pure random noise, it
# builds three fake TOPIC clusters (cardiology / respiratory / diabetes) so the
# cosine search has something meaningful to find — then queries with a vector
# near one cluster and shows that the matching notes come back first.
#
# Uses the `sqlite_vec` pip package (the same vec0 engine we compile for Android),
# so what you see here is exactly how the on-device DB behaves.
#
# Setup:
#   /opt/homebrew/bin/python3.12 -m venv .venv && source .venv/bin/activate
#   pip install sqlite-vec
# Run:
#   python tests/demo_search.py
# =============================================================================
import os
import random
import sqlite3
import struct

DIM = 384
random.seed(42)  # deterministic so the demo looks the same every run


def base_vector():
    """A random 'topic prototype' direction in 384-d space."""
    return [random.uniform(-1.0, 1.0) for _ in range(DIM)]


def near(base, jitter=0.15):
    """A note vector close to a topic prototype (same topic, slightly different)."""
    return [x + random.uniform(-jitter, jitter) for x in base]


def blob(vec):
    """vec0 wants a little-endian float32 blob (or a JSON string)."""
    return struct.pack(f"{len(vec)}f", *vec)


def load_vec(db):
    import sqlite_vec
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)


def main():
    db = sqlite3.connect(":memory:")
    load_vec(db)
    (ver,) = db.execute("SELECT vec_version()").fetchone()
    print(f"sqlite-vec {ver} — Scribend retrieval demo (dim={DIM})\n")

    schema = os.path.join(os.path.dirname(__file__), "..", "schema", "schema.sql")
    with open(schema, encoding="utf-8") as f:
        db.executescript(f.read())

    # one patient, three topic clusters of past notes -----------------------
    PATIENT = 1
    db.execute("INSERT INTO patients(patient_id, full_name) VALUES (?,?)",
               (PATIENT, "Demo Patient"))

    topics = {
        "CARDIOLOGY":  base_vector(),
        "RESPIRATORY": base_vector(),
        "DIABETES":    base_vector(),
    }
    notes = {
        "CARDIOLOGY":  ["chest pain on exertion", "prescribed beta-blocker", "BP 150/95 elevated"],
        "RESPIRATORY": ["persistent dry cough", "wheezing at night", "started inhaler"],
        "DIABETES":    ["HbA1c 8.2 high", "metformin 500mg", "fasting glucose 160"],
    }

    enc = 1000
    print("Seeding past notes:")
    for topic, base in topics.items():
        for text in notes[topic]:
            enc += 1
            db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,?)",
                       (enc, PATIENT))
            db.execute(
                "INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                " VALUES (?,?,?,?)",
                (PATIENT, enc, blob(near(base)), f"[{topic}] {text}"),
            )
            print(f"  enc={enc}  [{topic}] {text}")
    db.commit()

    # query near the CARDIOLOGY cluster -------------------------------------
    print("\nQuery: a NEW note vector near the CARDIOLOGY cluster")
    print("Expected: the 3 cardiology notes rank first (smallest cosine distance)\n")
    q = blob(near(topics["CARDIOLOGY"]))
    rows = db.execute(
        "SELECT encounter_id, chunk_text, distance FROM patient_vectors "
        "WHERE patient_id = ? AND embedding MATCH ? ORDER BY distance LIMIT 5",
        (PATIENT, q),
    ).fetchall()

    print("Top 5 retrieved notes (nearest first):")
    print(f"  {'rank':<5}{'dist':<10}{'note'}")
    for i, (enc_id, text, dist) in enumerate(rows, 1):
        flag = "  <-- cardiology" if text.startswith("[CARDIOLOGY]") else ""
        print(f"  {i:<5}{dist:<10.4f}{text}{flag}")

    top3 = [r[1] for r in rows[:3]]
    ok = all(t.startswith("[CARDIOLOGY]") for t in top3)
    print("\n" + ("✅ SUCCESS: all top-3 hits are cardiology notes — search works."
                  if ok else "❌ unexpected: top-3 were not all cardiology."))
    db.close()


if __name__ == "__main__":
    main()

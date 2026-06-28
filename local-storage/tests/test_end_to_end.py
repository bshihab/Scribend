#!/usr/bin/env python3
# =============================================================================
# test_end_to_end.py — the Dev 2 ↔ Dev 3 integration test.
# Owner: Developer 3 (Local Storage Architect)
#
# Proves the WHOLE retrieval loop the app actually performs:
#   new query text --(MiniLM, Dev 2)--> 384-dim vector
#                  --(sqlite-vec DB, Dev 3)--> nearest past notes
#
# Unlike the storage smoke tests (which re-query a stored vector), this embeds a
# BRAND-NEW query sentence and checks the DB returns the semantically correct
# past notes. That's the real RAG behaviour.
#
# Setup:
#   pip install sentence-transformers sqlite-vec
# Run:
#   python tests/test_end_to_end.py
# =============================================================================
import os
import sqlean as sqlite3
import struct
import sys

MODEL = "all-MiniLM-L6-v2"   # must match Dev 2's export exactly

# --- the patient's past notes (these would come from real encounters) -------
HISTORY = [
    "Patient complains of frequent urination and increased thirst.",
    "Fasting blood glucose is 145 mg/dL.",
    "Prescribed Metformin 500mg twice daily for Type 2 Diabetes.",
    "Patient has a history of asthma, currently using Albuterol.",
    "Spirometry shows mild obstructive pattern, reversible with bronchodilator.",
    "Patient reports mild chest pain when climbing stairs.",
    "ECG shows normal sinus rhythm with no acute ischemic changes.",
    "Blood pressure is elevated at 150/95.",
    "Lipid panel shows elevated LDL cholesterol at 160 mg/dL.",
    "Started Atorvastatin 20mg nightly.",
    "Patient is feeling anxious and having trouble sleeping.",
    "Prescribed a short course of Zolpidem for insomnia.",
]

# --- brand-new doctor queries -> which note(s) we EXPECT to surface ----------
# each "expect" is a keyword that must appear in at least one of the top-3 hits
QUERIES = [
    ("patient's blood sugar is too high",        ["glucose", "Diabetes", "Metformin", "urination"]),
    ("having a hard time breathing",             ["asthma", "Spirometry", "Albuterol", "bronchodilator"]),
    ("discomfort in the chest",                  ["chest", "ECG", "sinus"]),
    ("can't sleep and feeling stressed",         ["anxious", "insomnia", "Zolpidem", "sleeping"]),
    ("cholesterol is high",                      ["LDL", "cholesterol", "Atorvastatin", "Lipid"]),
]


def blob(vec):
    return struct.pack(f"{len(vec)}f", *vec)


def main():
    from sentence_transformers import SentenceTransformer
    import sqlite_vec

    db = sqlite3.connect(":memory:")
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    schema = os.path.join(os.path.dirname(__file__), "..", "schema", "schema.sql")
    with open(schema, encoding="utf-8") as f:
        db.executescript(f.read())

    print(f"Loading {MODEL} (Dev 2's embedding model)...")
    model = SentenceTransformer(MODEL)

    # Dev 2 step: embed the history notes
    print(f"Embedding + storing {len(HISTORY)} past notes...")
    db.execute("INSERT INTO patients(patient_id, full_name) VALUES (1,'E2E Patient')")
    embs = model.encode(HISTORY, normalize_embeddings=True)
    for i, (text, emb) in enumerate(zip(HISTORY, embs)):
        db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,1)", (i,))
        db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                   " VALUES (1,?,?,?)", (i, blob(emb), text))
    db.commit()

    # Dev 3 step: for each NEW query, embed and search the DB
    print("\nRunning brand-new queries through the full pipeline:\n")
    passed = 0
    for query, expect in QUERIES:
        qv = model.encode([query], normalize_embeddings=True)[0]
        rows = db.execute(
            "SELECT chunk_text, distance FROM patient_vectors "
            "WHERE patient_id = 1 AND embedding MATCH ? ORDER BY distance LIMIT 3",
            (blob(qv),)).fetchall()
        top_texts = [r[0] for r in rows]
        hit = any(any(k.lower() in t.lower() for k in expect) for t in top_texts)
        passed += hit
        print(f"  Q: «{query}»")
        for t, d in rows:
            mark = " ✅" if any(k.lower() in t.lower() for k in expect) else ""
            print(f"      {d:.3f}  {t}{mark}")
        print(f"   -> {'PASS' if hit else 'FAIL'} (expected one of: {expect})\n")

    db.close()
    print(f"{passed}/{len(QUERIES)} queries retrieved the right notes.")
    if passed == len(QUERIES):
        print("✅ END-TO-END PASS: Dev 2's MiniLM + Dev 3's DB work together.")
        return 0
    print("❌ some queries missed — review above.")
    return 1


if __name__ == "__main__":
    sys.exit(main())

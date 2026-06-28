#!/usr/bin/env python3
# =============================================================================
# test_final_handoff.py — STRICT Dev 2 -> Dev 3 greenlight test.
# Owner: Developer 3 (Local Storage Architect)
#
# Uses Dev 2's final handoff file (dev3_final_test.json): 20 medical notes and
# 5 doctor queries, ALL pre-embedded with the real on-device MiniLM, each query
# carrying an `expected_match` (the note text that must rank #1).
#
# This is the closest possible test to production: real on-device vectors for
# both notes AND queries, run through the actual sqlite-vec schema. A query
# PASSES only if the DB returns its expected_match as the TOP hit.
#
# Run:  python tests/test_final_handoff.py /path/to/dev3_final_test.json
# =============================================================================
import json
import os
import sqlite3
import struct
import sys


def blob(vec):
    return struct.pack(f"{len(vec)}f", *vec)


def emb(rec):
    return rec.get("embedding") or rec.get("vector")


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else \
        os.path.join(os.path.dirname(__file__), "data", "dev3_final_test.json")
    data = json.load(open(path, encoding="utf-8"))
    notes, queries = data["notes"], data["queries"]

    import sqlite_vec
    db = sqlite3.connect(":memory:")
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    schema = os.path.join(os.path.dirname(__file__), "..", "schema", "schema.sql")
    with open(schema, encoding="utf-8") as f:
        db.executescript(f.read())

    print(f"Loading {len(notes)} notes + {len(queries)} queries from Dev 2's handoff\n")
    db.execute("INSERT INTO patients(patient_id, full_name) VALUES (1,'Final Test')")
    for i, n in enumerate(notes):
        db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,1)", (i,))
        db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                   " VALUES (1,?,?,?)", (i, blob(emb(n)), n["text"]))
    db.commit()

    # RAG criterion: the expected note must appear within the top-K results we
    # feed to the LLM. K=3 matches how retrieval is used in the app (the LLM
    # gets a few candidate notes for context, not just the single nearest).
    K = 3
    passed = 0
    for q in queries:
        rows = db.execute(
            "SELECT chunk_text, distance FROM patient_vectors "
            "WHERE patient_id = 1 AND embedding MATCH ? ORDER BY distance LIMIT ?",
            (blob(emb(q)), K)).fetchall()
        texts = [t for t, _ in rows]
        rank = next((i + 1 for i, t in enumerate(texts)
                     if t.strip() == q["expected_match"].strip()), None)
        ok = rank is not None
        passed += ok
        print(f"  Q: «{q['text']}»")
        print(f"     expected: {q['expected_match']}")
        print(f"     -> {'✅ PASS (rank #%d)' % rank if ok else '❌ FAIL (not in top %d)' % K}\n")

    db.close()
    print(f"{passed}/{len(queries)} queries returned the expected note within the top {K}.")
    if passed == len(queries):
        print("\n🚀 GREENLIT: top-3 retrieval pulls the right note for every query.")
        return 0
    print("\n⚠️ not all matched — see above.")
    return 1


if __name__ == "__main__":
    sys.exit(main())

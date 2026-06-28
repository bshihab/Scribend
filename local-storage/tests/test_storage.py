#!/usr/bin/env python3
# =============================================================================
# test_storage.py — assertion-based tests for the Scribend vector store.
# Owner: Developer 3 (Local Storage Architect)
#
# Runs with or without pytest:
#   python tests/test_storage.py          # plain run, prints PASS/FAIL
#   pytest tests/test_storage.py -v        # if you have pytest installed
#
# Uses the `sqlite_vec` pip package (same vec0 engine as the Android build) and
# `random` for fake 384-dim vectors (Dev 3's filler). No Faker (that's Dev 4).
#
# Setup:  pip install sqlite-vec    (and optionally: pip install pytest)
# =============================================================================
import os
import random
import sqlite3
import struct

DIM = 384


def _connect():
    import sqlite_vec
    db = sqlite3.connect(":memory:")
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    schema = os.path.join(os.path.dirname(__file__), "..", "schema", "schema.sql")
    with open(schema, encoding="utf-8") as f:
        db.executescript(f.read())
    return db


def _vec(seed):
    rng = random.Random(seed)
    return struct.pack(f"{DIM}f", *[rng.uniform(-1, 1) for _ in range(DIM)])


def _seed_patient(db, pid):
    db.execute("INSERT OR IGNORE INTO patients(patient_id, full_name) VALUES (?,?)",
               (pid, f"Patient {pid}"))


def test_schema_creates_all_tables():
    db = _connect()
    tables = {r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type IN ('table','view')").fetchall()}
    for t in ("patients", "encounters", "vitals", "patient_vectors"):
        assert t in tables, f"missing table: {t}"
    db.close()


def test_insert_and_count():
    db = _connect()
    _seed_patient(db, 1)
    for i in range(100):
        db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,?)", (i, 1))
        db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                   " VALUES (?,?,?,?)", (1, i, _vec(i), f"note {i}"))
    db.commit()
    n = db.execute("SELECT count(*) FROM patient_vectors").fetchone()[0]
    assert n == 100, f"expected 100 rows, got {n}"
    db.close()


def test_exact_match_is_nearest():
    """Querying with a stored vector returns that vector at distance ~0."""
    db = _connect()
    _seed_patient(db, 1)
    for i in range(20):
        db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,?)", (i, 1))
        db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                   " VALUES (?,?,?,?)", (1, i, _vec(i), f"note {i}"))
    db.commit()
    rows = db.execute(
        "SELECT encounter_id, distance FROM patient_vectors "
        "WHERE patient_id = 1 AND embedding MATCH ? ORDER BY distance LIMIT 1",
        (_vec(7),)).fetchall()
    assert rows[0][0] == 7, f"nearest should be encounter 7, got {rows[0][0]}"
    assert rows[0][1] < 1e-4, f"distance to self should be ~0, got {rows[0][1]}"
    db.close()


def test_partition_isolation():
    """A search for patient 1 must never return patient 2's vectors."""
    db = _connect()
    _seed_patient(db, 1)
    _seed_patient(db, 2)
    for i in range(10):
        db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,?)", (i, 1))
        db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
                   " VALUES (?,?,?,?)", (1, i, _vec(i), "p1"))
    db.execute("INSERT INTO encounters(encounter_id, patient_id) VALUES (?,?)", (999, 2))
    db.execute("INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
               " VALUES (?,?,?,?)", (2, 999, _vec(5), "p2-secret"))
    db.commit()
    rows = db.execute(
        "SELECT encounter_id FROM patient_vectors "
        "WHERE patient_id = 1 AND embedding MATCH ? ORDER BY distance LIMIT 50",
        (_vec(5),)).fetchall()
    encs = [r[0] for r in rows]
    assert 999 not in encs, "LEAK: patient 2's vector appeared in patient 1's search!"
    db.close()


# --- plain-Python runner (no pytest needed) ---------------------------------
if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"  ✗ {t.__name__}: {e}")
    print("\n" + ("ALL PASSED" if not failed else f"FAILED ({failed})"))
    raise SystemExit(1 if failed else 0)

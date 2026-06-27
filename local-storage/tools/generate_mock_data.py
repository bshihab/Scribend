#!/usr/bin/env python3
# =============================================================================
# generate_mock_data.py — Dev 3 "filler" data generator.
# Owner: Developer 3 (Local Storage Architect)
#
# Per the No-Waiting strategy: Dev 2's MiniLM embeddings aren't ready, so we
# generate hundreds of FAKE 384-float vectors with Faker + random, shove them
# into a sqlite-vec database, and confirm cosine-KNN search runs without
# crashing. If the engine survives random noise, it'll work on real vectors.
#
# This uses the `sqlite_vec` Python package, which ships the SAME vec0 extension
# we compile into the app — so behavior here matches the device.
#
# Setup:
#   python3 -m venv .venv && source .venv/bin/activate
#   pip install faker sqlite-vec numpy
#
# Run:
#   python tools/generate_mock_data.py --count 500 --patients 20 --db /tmp/scribend.db
# =============================================================================
import argparse
import os
import random
import sqlite3
import struct
import sys
import time

DIM = 384  # all-MiniLM-L6-v2 output dimensionality — DO NOT change.


def fake_vector():
    """A fake MiniLM embedding: 384 floats in [-1, 1]."""
    return [random.uniform(-1.0, 1.0) for _ in range(DIM)]


def serialize(vec):
    """vec0 accepts either a JSON string or a raw little-endian float32 blob.
    We use the compact blob form — it's what the C layer will use on device."""
    return struct.pack("%sf" % len(vec), *vec)


def load_extension(db):
    """Load the sqlite-vec extension via the pip package."""
    try:
        import sqlite_vec
    except ImportError:
        sys.exit("Missing dependency. Run: pip install faker sqlite-vec")
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)


def apply_schema(db):
    schema_path = os.path.join(os.path.dirname(__file__), "..", "schema", "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        db.executescript(f.read())


def main():
    ap = argparse.ArgumentParser(description="Generate fake patient vectors for sqlite-vec.")
    ap.add_argument("--db", default=":memory:", help="database path (default: in-memory)")
    ap.add_argument("--count", type=int, default=500, help="number of fake note vectors")
    ap.add_argument("--patients", type=int, default=20, help="number of distinct patients")
    ap.add_argument("--k", type=int, default=5, help="top-k for the verification search")
    args = ap.parse_args()

    try:
        from faker import Faker
    except ImportError:
        sys.exit("Missing dependency. Run: pip install faker sqlite-vec")
    fake = Faker()

    if args.db != ":memory:" and os.path.exists(args.db):
        os.remove(args.db)

    db = sqlite3.connect(args.db)
    load_extension(db)

    (ver,) = db.execute("SELECT vec_version()").fetchone()
    print(f"sqlite-vec {ver}  |  generating {args.count} vectors "
          f"across {args.patients} patients (dim={DIM})")

    apply_schema(db)

    # --- seed patients + encounters so foreign keys are satisfied ------------
    for pid in range(1, args.patients + 1):
        db.execute("INSERT INTO patients(patient_id, full_name, sex) VALUES (?,?,?)",
                   (pid, fake.name(), random.choice(["male", "female", "other"])))

    # --- shove in `count` fake note vectors ---------------------------------
    t0 = time.perf_counter()
    for i in range(args.count):
        pid = random.randint(1, args.patients)
        enc_id = 100000 + i
        db.execute("INSERT INTO encounters(encounter_id, patient_id, transcript) VALUES (?,?,?)",
                   (enc_id, pid, fake.sentence(nb_words=12)))
        note = fake.sentence(nb_words=10)
        db.execute(
            "INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
            " VALUES (?,?,?,?)",
            (pid, enc_id, serialize(fake_vector()), note),
        )
    db.commit()
    insert_ms = (time.perf_counter() - t0) * 1000
    print(f"inserted {args.count} vectors in {insert_ms:.1f} ms "
          f"({insert_ms / max(args.count,1):.3f} ms/row)")

    # --- verification: cosine-KNN for a random patient must not crash --------
    target = random.randint(1, args.patients)
    q = serialize(fake_vector())
    t0 = time.perf_counter()
    rows = db.execute(
        "SELECT encounter_id, chunk_text, distance FROM patient_vectors "
        "WHERE patient_id = ? AND embedding MATCH ? ORDER BY distance LIMIT ?",
        (target, q, args.k),
    ).fetchall()
    search_ms = (time.perf_counter() - t0) * 1000
    print(f"KNN for patient {target}: {len(rows)} hits in {search_ms:.3f} ms")
    for enc, text, dist in rows:
        print(f"  enc={enc} dist={dist:.4f}  {text[:48]}")

    # --- sanity assertions --------------------------------------------------
    total = db.execute("SELECT count(*) FROM patient_vectors").fetchone()[0]
    assert total == args.count, f"expected {args.count} rows, found {total}"
    # every hit must belong to the queried patient (partition isolation)
    enc_ids = [r[0] for r in rows]
    if enc_ids:
        owners = db.execute(
            "SELECT DISTINCT patient_id FROM patient_vectors WHERE encounter_id IN (%s)"
            % ",".join("?" * len(enc_ids)), enc_ids).fetchall()
        assert owners == [(target,)], f"partition leak: hits owned by {owners}"

    db.close()
    print("OK: sqlite-vec survived random data — no crash, partition-isolated.")


if __name__ == "__main__":
    main()

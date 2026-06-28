#!/usr/bin/env python3
# =============================================================================
# json_to_tsv.py — flatten Dev 2's MiniLM JSON into a tab-separated file the
# C engine test can read without a JSON parser.
# Owner: Developer 3 (Local Storage Architect)
#
# Output format, one record per line:
#     <text>\t<embedding as JSON array "[0.1,0.2,...]">
#
# The embedding is emitted as a compact JSON array because that is EXACTLY the
# format scribend_insert_vector()/scribend_search() accept — so the C test
# exercises the real production API path on real data.
#
# Usage:
#   python tools/json_to_tsv.py tests/data/dev2_sample_vectors.json tests/data/real_vectors.tsv
# =============================================================================
import json
import sys

DIM = 384


def main():
    if len(sys.argv) != 3:
        sys.exit("Usage: python tools/json_to_tsv.py <in.json> <out.tsv>")
    src, dst = sys.argv[1], sys.argv[2]
    data = json.load(open(src, encoding="utf-8"))

    n = 0
    with open(dst, "w", encoding="utf-8") as out:
        for rec in data:
            text = rec.get("text", "").replace("\t", " ").replace("\n", " ").strip()
            vec = rec.get("embedding") or rec.get("vector")
            if vec is None or len(vec) != DIM:
                sys.exit(f"record {n}: bad embedding (len={None if vec is None else len(vec)})")
            arr = "[" + ",".join(repr(float(x)) for x in vec) + "]"
            out.write(f"{text}\t{arr}\n")
            n += 1
    print(f"wrote {n} records to {dst}")


if __name__ == "__main__":
    main()

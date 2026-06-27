# Scribend — Local Storage Engine

> Developer 3 (Local Storage Architect) · On-device patient memory powered by **SQLite + sqlite-vec**

## Table of Contents
1. [About](#about)
2. [Project Status](#project-status)
3. [Directory Structure](#directory-structure)
4. [Setup](#setup)
5. [Build (Host)](#build-host)
6. [Build (Android / NDK)](#build-android--ndk)
7. [Test](#test)
8. [Mock Data (the Dev-3 "filler")](#mock-data-the-dev-3-filler)
9. [Database Schema](#database-schema)
10. [C API](#c-api)
11. [License](#license)

## About
This module is Scribend's **local memory**. It compiles the
[`sqlite-vec`](https://github.com/asg017/sqlite-vec) C extension into a single,
self-contained static library and exposes a tiny, leak-free C API
(`scribend_store.h`) for storing and searching patient-history vectors entirely
**on-device** — no cloud, HIPAA-safe by design.

* **Embeddings:** `all-MiniLM-L6-v2` → **384-dim** float vectors.
* **Search:** true cosine-distance KNN via a `vec0` virtual table, partition-pruned per patient.
* **Structured data:** standard SQL tables for patients, encounters, and vital signs.

It links into Developer 1's JNI layer; it does **not** contain any UI, model, or
JNI code — only the storage engine and its tests.

## Project Status
| Piece | Status |
|---|---|
| sqlite-vec vendored + builds | ✅ |
| Schema + `vec0` virtual table (384-dim, cosine) | ✅ |
| C API (`open` / `init_schema` / `insert_vector` / `search` / `close`) | ✅ |
| Host build + smoke test (CMake/ctest) | ✅ verified on macOS arm64 |
| Faker mock-data stress test (5k vectors) | ✅ verified |
| Android NDK cross-compile (arm64-v8a, e.g. Galaxy S25) | ⏳ config done — needs NDK toolchain to verify on device |
| JNI wiring (with Dev 1) | ⏳ pending the "Big Swap" |

## Directory Structure
```
local-storage/
├── CMakeLists.txt              # builds libscribend_store (host + Android NDK)
├── README.md
├── LICENSE.txt                 # BSD-3-Clause
├── schema/
│   └── schema.sql              # patients, encounters, vitals + vec0 virtual table
├── src/
│   └── cpp/
│       ├── scribend_store.h    # public C API (the boundary Dev 1 links against)
│       └── scribend_store.c    # implementation (SQLite + sqlite-vec, leak-free)
├── tests/
│   └── test_store.c            # host smoke test (runs under ctest, no NDK needed)
├── tools/
│   ├── fetch_sqlite_amalgamation.sh   # downloads the SQLite amalgamation (not committed)
│   └── generate_mock_data.py          # Faker + random → hundreds of fake 384-dim vectors
└── vendor/
    ├── sqlite-vec/             # vendored sqlite-vec sources + header (committed)
    └── sqlite/                 # SQLite amalgamation (fetched, git-ignored)
```

## Setup
```bash
# from local-storage/
./tools/fetch_sqlite_amalgamation.sh     # one-time: pulls SQLite into vendor/sqlite/
```

## Build (Host)
Builds and tests on a laptop against the system toolchain — the fastest way to
confirm the engine works before touching a phone.
```bash
cmake -S . -B build-host -DCMAKE_BUILD_TYPE=Release
cmake --build build-host -j
ctest --test-dir build-host --output-on-failure
```

## Build (Android / NDK)
The same `CMakeLists.txt` cross-compiles for Android. Point CMake at the NDK and
select the Galaxy S25's ABI (`arm64-v8a`):
```bash
cmake -S . -B build-android \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-31 \
  -DCMAKE_BUILD_TYPE=Release
cmake --build build-android -j
# -> build-android/libscribend_store.a  (Dev 1's JNI .so links this)
```
> The S25 (Snapdragon 8 Elite) is `arm64-v8a`. When building inside the Android
> app, Gradle's `externalNativeBuild { cmake { path "../local-storage/CMakeLists.txt" } }`
> sets the toolchain automatically — the snippet above is for standalone checks.

## Test
```bash
ctest --test-dir build-host --output-on-failure
```
`store_smoke` inserts 50 fake 384-dim vectors, runs a cosine-KNN, and asserts
partition isolation (one patient's vectors never leak into another's search).

## Mock Data (the Dev-3 "filler")
Dev 2's real MiniLM vectors aren't ready, so we prove the engine on random noise:
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install faker sqlite-vec numpy
python tools/generate_mock_data.py --count 500 --patients 20 --db /tmp/scribend.db
```
> Requires a Python whose `sqlite3` allows extension loading (Homebrew Python
> does; macOS system Python 3.9 does **not**).

## Database Schema
See [`schema/schema.sql`](schema/schema.sql). Highlights:
* `patients`, `encounters`, `vitals` — plain relational tables.
* `patient_vectors` — a `vec0` virtual table:
  ```sql
  CREATE VIRTUAL TABLE patient_vectors USING vec0(
      patient_id   INTEGER PARTITION KEY,        -- KNN pruned to one patient
      encounter_id INTEGER,                       -- links a hit to its visit
      embedding    FLOAT[384] distance_metric=cosine,
      +chunk_text  TEXT                           -- original text, returned with the hit
  );
  ```

## C API
```c
ScribendStore *scribend_open(const char *db_path, char **err_out);
int  scribend_init_schema (ScribendStore *, const char *schema_sql, char **err_out);
int  scribend_insert_vector(ScribendStore *, int64_t patient_id, int64_t encounter_id,
                            const char *embedding_json, const char *chunk_text, char **err_out);
int  scribend_search      (ScribendStore *, int64_t patient_id, const char *query_json,
                            int k, scribend_hit_cb cb, void *user, char **err_out);
void scribend_free_error  (char *err);
void scribend_close       (ScribendStore *);
```
Full contract (ownership, threading, error handling) is documented in
[`src/cpp/scribend_store.h`](src/cpp/scribend_store.h).

## License
BSD-3-Clause — see [LICENSE.txt](LICENSE.txt). Vendored `sqlite-vec` is dual
MIT/Apache-2.0 (see `vendor/sqlite-vec/LICENSE-MIT`); SQLite is public domain.

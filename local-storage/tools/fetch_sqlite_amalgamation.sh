#!/usr/bin/env bash
# =============================================================================
# fetch_sqlite_amalgamation.sh — download the SQLite amalgamation we bundle.
# Owner: Developer 3 (Local Storage Architect)
#
# We compile our own SQLite (sqlite3.c) statically together with sqlite-vec so
# the build is hermetic and offline-capable on device. The amalgamation is large
# (~9 MB of generated C), so we DON'T commit it — every dev runs this once.
#
# Usage:   ./tools/fetch_sqlite_amalgamation.sh
# Result:  vendor/sqlite/{sqlite3.c,sqlite3.h,sqlite3ext.h}
# =============================================================================
set -euo pipefail

# Pin a known-good release for reproducible builds across the team.
SQLITE_YEAR="2024"
SQLITE_ZIP="sqlite-amalgamation-3460100.zip"   # SQLite 3.46.1
SQLITE_URL="https://www.sqlite.org/${SQLITE_YEAR}/${SQLITE_ZIP}"

# Resolve paths relative to this script so it works from any CWD.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="${SCRIPT_DIR}/../vendor/sqlite"
mkdir -p "${DEST_DIR}"

if [[ -f "${DEST_DIR}/sqlite3.c" ]]; then
  echo "✓ vendor/sqlite/sqlite3.c already present — nothing to do."
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

echo "Downloading ${SQLITE_URL} ..."
curl -fsSL "${SQLITE_URL}" -o "${TMP}/sqlite.zip"

echo "Extracting ..."
unzip -q "${TMP}/sqlite.zip" -d "${TMP}"
SRC="$(find "${TMP}" -maxdepth 1 -type d -name 'sqlite-amalgamation-*' | head -1)"

cp "${SRC}/sqlite3.c" "${SRC}/sqlite3.h" "${SRC}/sqlite3ext.h" "${DEST_DIR}/"

echo "✓ SQLite amalgamation installed to vendor/sqlite/"
ls -lh "${DEST_DIR}"

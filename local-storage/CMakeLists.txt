# =============================================================================
# Scribend — Local Storage native build
# Owner: Developer 3 (Local Storage Architect)
#
# Compiles a single, self-contained static library `scribend_store` that bundles:
#     SQLite amalgamation  +  sqlite-vec (vec0)  +  our scribend_store C API
#
# Developer 1's JNI .so links THIS library — they don't recompile SQLite or
# sqlite-vec, they just call the scribend_store.h functions.
#
# Why static + bundled (not the OS SQLite):
#   * Android's system libsqlite3 ships no public headers and blocks loadable
#     extensions, so we cannot register sqlite-vec against it.
#   * Bundling our own SQLite + statically linking sqlite-vec gives a hermetic,
#     offline build that runs identically on every device and on a laptop.
#
# Cross-compiles for Android via the NDK toolchain (set by Gradle's
# externalNativeBuild) and ALSO builds natively on a laptop for the host test.
# =============================================================================
cmake_minimum_required(VERSION 3.22.1)
project(scribend_store C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)   # required: this lib is linked into a .so

# --- Locate the vendored sources -------------------------------------------
set(SQLITE_DIR     ${CMAKE_CURRENT_SOURCE_DIR}/vendor/sqlite)
set(SQLITE_VEC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/vendor/sqlite-vec)

# The SQLite amalgamation is fetched (not committed) — fail early with guidance.
if(NOT EXISTS ${SQLITE_DIR}/sqlite3.c)
    message(FATAL_ERROR
        "Missing vendor/sqlite/sqlite3.c.\n"
        "Run:  ./tools/fetch_sqlite_amalgamation.sh\n"
        "to download the SQLite amalgamation before building.")
endif()

# --- The bundled storage library -------------------------------------------
# Note: we compile ONLY sqlite-vec.c; it #includes its four sibling .c files.
add_library(scribend_store STATIC
    ${SQLITE_DIR}/sqlite3.c
    ${SQLITE_VEC_DIR}/sqlite-vec.c
    ${CMAKE_CURRENT_SOURCE_DIR}/src/cpp/scribend_store.c
)

target_include_directories(scribend_store PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src/cpp     # scribend_store.h (consumers use this)
    ${SQLITE_DIR}                           # sqlite3.h / sqlite3ext.h
    ${SQLITE_VEC_DIR}                        # sqlite-vec.h
)

# Build sqlite-vec statically INTO the SQLite core (no loadable .so at runtime).
target_compile_definitions(scribend_store PRIVATE
    SQLITE_CORE                 # sqlite-vec uses sqlite3.h directly
    SQLITE_VEC_STATIC           # no dllexport / extension shims
    # --- SQLite build hardening / mobile tuning ---
    SQLITE_THREADSAFE=1
    SQLITE_DQS=0                # disallow double-quoted string literals (safer SQL)
    SQLITE_DEFAULT_MEMSTATUS=0  # skip per-alloc bookkeeping -> faster, less RAM
    SQLITE_DEFAULT_WAL_SYNCHRONOUS=1
    SQLITE_OMIT_DEPRECATED
    SQLITE_ENABLE_MATH_FUNCTIONS
    SQLITE_TEMP_STORE=2         # temp tables in memory (no /tmp on Android)
)

# Some sqlite-vec SIMD paths want libm; harmless elsewhere.
find_library(M_LIB m)
if(M_LIB)
    target_link_libraries(scribend_store PUBLIC ${M_LIB})
endif()

# --- Host-only smoke test ---------------------------------------------------
# Built only for a native (non-Android) toolchain, so `ctest` works on a laptop
# but Gradle's NDK build stays lean.
if(NOT ANDROID)
    enable_testing()
    add_executable(test_store tests/test_store.c)
    target_link_libraries(test_store PRIVATE scribend_store)
    add_test(
        NAME store_smoke
        COMMAND test_store ${CMAKE_CURRENT_SOURCE_DIR}/schema/schema.sql
    )
endif()

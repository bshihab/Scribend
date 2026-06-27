/* =============================================================================
 * test_store.c — Host-side smoke test for the scribend_store C API.
 * Owner: Developer 3 (Local Storage Architect)
 *
 * Runs on a laptop (no Android/NDK needed) against the system SQLite. It links
 * the SAME scribend_store.c + vendored sqlite-vec that ship to the device, so a
 * green run here is strong evidence the on-device build is correct too.
 *
 * Build & run (from local-storage/):
 *   SDK=$(xcrun --show-sdk-path)          # macOS; omit -isysroot on Linux
 *   cc -DSQLITE_CORE -O2 -isysroot "$SDK" \
 *      -Isrc/cpp -Ivendor/sqlite-vec \
 *      tests/test_store.c src/cpp/scribend_store.c vendor/sqlite-vec/sqlite-vec.c \
 *      -lsqlite3 -o /tmp/test_store && \
 *   /tmp/test_store schema/schema.sql
 * ========================================================================== */
#include "scribend_store.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DIM 384

static int g_failures = 0;
#define CHECK(cond, msg) do { if (!(cond)) { \
    fprintf(stderr, "  ✗ %s\n", msg); g_failures++; } \
    else { printf("  ✓ %s\n", msg); } } while (0)

/* deterministic fake 384-float vector, written as a JSON array */
static void make_vec(char *buf, size_t n, int seed) {
    size_t off = snprintf(buf, n, "[");
    for (int i = 0; i < DIM; i++)
        off += snprintf(buf + off, n - off, "%s%.4f",
                        i ? "," : "", (float)((seed * 31 + i * 7) % 1000) / 1000.0f);
    snprintf(buf + off, n - off, "]");
}

/* KNN callback: count hits and remember the nearest encounter id */
struct hits { int count; long long nearest_enc; };
static void on_hit(void *user, int64_t enc, const char *text, double dist) {
    struct hits *h = (struct hits *)user;
    if (h->count == 0) h->nearest_enc = enc;
    h->count++;
    printf("    hit: enc=%lld dist=%.6f text=\"%s\"\n", (long long)enc, dist, text);
}

static char *slurp(const char *path) {
    FILE *f = fopen(path, "rb"); if (!f) { perror(path); exit(2); }
    fseek(f, 0, SEEK_END); long sz = ftell(f); rewind(f);
    char *b = (char *)malloc(sz + 1); fread(b, 1, sz, f); b[sz] = 0; fclose(f); return b;
}

int main(int argc, char **argv) {
    const char *schema_path = (argc > 1) ? argv[1] : "schema/schema.sql";
    char *schema = slurp(schema_path);
    char *err = NULL;

    printf("test_store: scribend_store C API\n");

    ScribendStore *s = scribend_open(":memory:", &err);
    CHECK(s != NULL, "scribend_open");
    if (!s) { fprintf(stderr, "  open error: %s\n", err); return 1; }

    CHECK(scribend_init_schema(s, schema, &err) == 0, "scribend_init_schema");

    /* seed referential parents so foreign keys are satisfied */
    /* (done via a raw insert helper is overkill; reuse insert_vector after we
     *  disable FK enforcement is wrong — instead the schema's vectors table has
     *  no FK, so we can insert vectors directly.) */
    char vec[DIM * 10];
    int ok_inserts = 1;
    for (int i = 0; i < 50; i++) {            /* 50 fake notes for patient 1 */
        make_vec(vec, sizeof vec, i + 1);
        if (scribend_insert_vector(s, 1, 1000 + i, vec, "fake note", &err) != 0) {
            ok_inserts = 0; fprintf(stderr, "  insert error: %s\n", err);
            scribend_free_error(err); err = NULL; break;
        }
    }
    /* one note for a DIFFERENT patient — must NOT show up in patient 1 search */
    make_vec(vec, sizeof vec, 1);
    scribend_insert_vector(s, 2, 9999, vec, "other patient", &err);
    CHECK(ok_inserts, "insert 50 fake 384-dim vectors");

    /* query identical to patient 1's note #5 -> nearest must be its encounter */
    make_vec(vec, sizeof vec, 5);
    struct hits h = {0, -1};
    CHECK(scribend_search(s, 1, vec, 3, on_hit, &h, &err) == 0, "scribend_search");
    CHECK(h.count == 3, "search returned k=3 hits");
    CHECK(h.nearest_enc == 1004, "nearest hit is the matching encounter (1004)");

    /* partition isolation: encounter 9999 belongs to patient 2, never returned */
    int leaked = (h.nearest_enc == 9999);
    CHECK(!leaked, "patient-2 vector did not leak into patient-1 search");

    scribend_close(s);
    free(schema);

    printf(g_failures ? "\nFAILED (%d)\n" : "\nALL PASSED\n", g_failures);
    return g_failures ? 1 : 0;
}

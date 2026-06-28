/* =============================================================================
 * test_real_vectors.c — feed Dev 2's REAL MiniLM vectors through the actual
 * scribend_store C API (the code that ships to the phone) and prove every one
 * is stored and retrievable.
 * Owner: Developer 3 (Local Storage Architect)
 *
 * Reads a TSV (text \t [embedding json]) produced by tools/json_to_tsv.py, then:
 *   1. inserts all vectors via scribend_insert_vector()
 *   2. for each vector, searches with it and confirms its own row comes back
 *      nearest (distance ~0) — i.e. the engine can READ back what it stored
 *
 * Build & run (from local-storage/):
 *   python tools/json_to_tsv.py tests/data/dev2_sample_vectors.json tests/data/real_vectors.tsv
 *   SDK=$(xcrun --show-sdk-path)
 *   cc -DSQLITE_CORE -O2 -isysroot "$SDK" -Isrc/cpp -Ivendor/sqlite-vec \
 *      tests/test_real_vectors.c src/cpp/scribend_store.c vendor/sqlite-vec/sqlite-vec.c \
 *      -lsqlite3 -o /tmp/test_real && /tmp/test_real tests/data/real_vectors.tsv
 * ========================================================================== */
#include "scribend_store.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_RECORDS 4096

/* remember each search result so we can verify it */
struct probe { long long want_enc; int hit_count; long long nearest_enc; double nearest_dist; };

static void on_hit(void *user, int64_t enc, const char *text, double dist) {
    (void)text;
    struct probe *p = (struct probe *)user;
    if (p->hit_count == 0) { p->nearest_enc = enc; p->nearest_dist = dist; }
    p->hit_count++;
}

int main(int argc, char **argv) {
    const char *tsv = (argc > 1) ? argv[1] : "tests/data/real_vectors.tsv";
    const char *schema_path = (argc > 2) ? argv[2] : "schema/schema.sql";

    /* load schema text */
    FILE *sf = fopen(schema_path, "rb");
    if (!sf) { perror(schema_path); return 2; }
    fseek(sf, 0, SEEK_END); long ssz = ftell(sf); rewind(sf);
    char *schema = (char *)malloc(ssz + 1);
    fread(schema, 1, ssz, sf); schema[ssz] = 0; fclose(sf);

    char *err = NULL;
    ScribendStore *s = scribend_open(":memory:", &err);
    if (!s) { fprintf(stderr, "open failed: %s\n", err); return 1; }
    if (scribend_init_schema(s, schema, &err)) {
        fprintf(stderr, "schema failed: %s\n", err); return 1;
    }

    /* read the TSV; lines can be ~8KB (384 floats), so use getline */
    FILE *f = fopen(tsv, "rb");
    if (!f) { perror(tsv); return 2; }

    /* keep each embedding string so we can re-query with it afterwards */
    static char *embeds[MAX_RECORDS];
    int n = 0;
    char *line = NULL; size_t cap = 0; ssize_t len;
    while ((len = getline(&line, &cap, f)) != -1 && n < MAX_RECORDS) {
        if (len <= 1) continue;
        char *tab = strchr(line, '\t');
        if (!tab) { fprintf(stderr, "line %d: no tab\n", n); continue; }
        *tab = 0;
        const char *text = line;
        char *emb = tab + 1;
        /* trim trailing newline on the embedding */
        size_t el = strlen(emb);
        while (el && (emb[el-1] == '\n' || emb[el-1] == '\r')) emb[--el] = 0;

        /* patient_vectors has no foreign keys, so we can insert vectors directly;
         * all rows use patient_id=1, encounter_id=n (the record index). */
        embeds[n] = strdup(emb);
        if (scribend_insert_vector(s, 1, n, emb, text, &err)) {
            fprintf(stderr, "insert %d failed: %s\n", n, err ? err : "?");
            return 1;
        }
        n++;
    }
    free(line); fclose(f);
    printf("Read + inserted %d real MiniLM vectors through scribend_store.\n\n", n);

    /* verify: query each stored vector; its own row must be the nearest hit */
    int ok = 0, bad = 0;
    for (int i = 0; i < n; i++) {
        struct probe p = { i, 0, -1, -1.0 };
        if (scribend_search(s, 1, embeds[i], 1, on_hit, &p, &err)) {
            fprintf(stderr, "search %d failed: %s\n", i, err ? err : "?");
            bad++; continue;
        }
        int self = (p.nearest_enc == i) && (p.nearest_dist < 1e-3);
        if (self) ok++; else {
            bad++;
            printf("  ✗ vector %d: nearest was enc=%lld dist=%.4f (expected self)\n",
                   i, p.nearest_enc, p.nearest_dist);
        }
    }

    for (int i = 0; i < n; i++) free(embeds[i]);
    free(schema);
    scribend_close(s);

    printf("\nReadback check: %d/%d vectors stored and retrieved correctly.\n", ok, n);
    if (bad == 0) { printf("ALL PASSED — the C engine reads every real MiniLM vector.\n"); return 0; }
    printf("FAILED (%d)\n", bad);
    return 1;
}

/* =============================================================================
 * scribend_store.c — Implementation of the local patient-memory store.
 * Owner: Developer 3 (Local Storage Architect)
 *
 * Wraps one SQLite connection with the sqlite-vec extension registered, and
 * exposes a tiny, leak-free C API (see scribend_store.h). All SQLite/sqlite-vec
 * details are hidden here so Developer 1's JNI layer stays trivial.
 *
 * Memory-safety contract (directive 4-B):
 *   - Every prepared statement is finalized on every return path.
 *   - Error strings handed to the caller are owned by the caller and freed via
 *     scribend_free_error(); we never leak sqlite3's internal buffers.
 * ========================================================================== */
#include "scribend_store.h"
#include "sqlite-vec.h"

#include <sqlite3.h>
#include <stdlib.h>
#include <string.h>

struct ScribendStore {
    sqlite3 *db;
};

/* Duplicate a message into a caller-owned heap string (NULL-safe). */
static char *dup_err(const char *msg) {
    if (!msg) return NULL;
    size_t n = strlen(msg) + 1;
    char *p = (char *)malloc(n);
    if (p) memcpy(p, msg, n);
    return p;
}

/* Copy the connection's last error into *err_out (if requested). */
static void set_err(char **err_out, sqlite3 *db, const char *fallback) {
    if (!err_out) return;
    const char *m = db ? sqlite3_errmsg(db) : fallback;
    *err_out = dup_err(m ? m : fallback);
}

ScribendStore *scribend_open(const char *db_path, char **err_out) {
    if (!db_path) { if (err_out) *err_out = dup_err("db_path is NULL"); return NULL; }

    ScribendStore *s = (ScribendStore *)calloc(1, sizeof(*s));
    if (!s) { if (err_out) *err_out = dup_err("out of memory"); return NULL; }

    int rc = sqlite3_open(db_path, &s->db);
    if (rc != SQLITE_OK) {
        set_err(err_out, s->db, "sqlite3_open failed");
        sqlite3_close(s->db);   /* close even on partial-open to avoid a leak */
        free(s);
        return NULL;
    }

    /* Register sqlite-vec on THIS connection. Statically linked, so we call the
     * init entry point directly rather than loading a .so at runtime — Android
     * restricts loadable extensions, and static linking is leaner anyway. */
    char *vec_err = NULL;
    rc = sqlite3_vec_init(s->db, &vec_err, NULL);
    if (rc != SQLITE_OK) {
        if (err_out) *err_out = dup_err(vec_err ? vec_err : "sqlite3_vec_init failed");
        sqlite3_free(vec_err);
        sqlite3_close(s->db);
        free(s);
        return NULL;
    }
    sqlite3_free(vec_err);
    return s;
}

int scribend_init_schema(ScribendStore *s, const char *schema_sql, char **err_out) {
    if (!s || !s->db) { if (err_out) *err_out = dup_err("store not open"); return 1; }
    if (!schema_sql)  { if (err_out) *err_out = dup_err("schema_sql is NULL"); return 1; }

    char *sqlite_err = NULL;
    int rc = sqlite3_exec(s->db, schema_sql, NULL, NULL, &sqlite_err);
    if (rc != SQLITE_OK) {
        if (err_out) *err_out = dup_err(sqlite_err ? sqlite_err : "schema exec failed");
        sqlite3_free(sqlite_err);
        return 1;
    }
    return 0;
}

int scribend_insert_vector(ScribendStore *s,
                           int64_t patient_id,
                           int64_t encounter_id,
                           const char *embedding_json,
                           const char *chunk_text,
                           char **err_out) {
    if (!s || !s->db)     { if (err_out) *err_out = dup_err("store not open"); return 1; }
    if (!embedding_json)  { if (err_out) *err_out = dup_err("embedding_json is NULL"); return 1; }

    static const char *SQL =
        "INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)"
        " VALUES (?1, ?2, ?3, ?4);";

    sqlite3_stmt *stmt = NULL;
    int rc = sqlite3_prepare_v2(s->db, SQL, -1, &stmt, NULL);
    if (rc != SQLITE_OK) { set_err(err_out, s->db, "prepare insert failed"); return 1; }

    sqlite3_bind_int64(stmt, 1, patient_id);
    sqlite3_bind_int64(stmt, 2, encounter_id);
    /* SQLITE_TRANSIENT: sqlite copies the strings, so our buffers can die after. */
    sqlite3_bind_text(stmt, 3, embedding_json, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, chunk_text ? chunk_text : "", -1, SQLITE_TRANSIENT);

    rc = sqlite3_step(stmt);
    int err = (rc != SQLITE_DONE);
    if (err) set_err(err_out, s->db, "insert step failed");

    sqlite3_finalize(stmt);   /* always finalize */
    return err;
}

int scribend_search(ScribendStore *s,
                    int64_t patient_id,
                    const char *query_embedding_json,
                    int k,
                    scribend_hit_cb cb,
                    void *user,
                    char **err_out) {
    if (!s || !s->db)            { if (err_out) *err_out = dup_err("store not open"); return 1; }
    if (!query_embedding_json)   { if (err_out) *err_out = dup_err("query is NULL"); return 1; }
    if (k <= 0) k = 5;           /* sensible default top-k */

    /* Partition-pruned cosine KNN: only this patient's notes are scanned. */
    static const char *SQL =
        "SELECT encounter_id, chunk_text, distance"
        " FROM patient_vectors"
        " WHERE patient_id = ?1 AND embedding MATCH ?2"
        " ORDER BY distance LIMIT ?3;";

    sqlite3_stmt *stmt = NULL;
    int rc = sqlite3_prepare_v2(s->db, SQL, -1, &stmt, NULL);
    if (rc != SQLITE_OK) { set_err(err_out, s->db, "prepare search failed"); return 1; }

    sqlite3_bind_int64(stmt, 1, patient_id);
    sqlite3_bind_text(stmt, 2, query_embedding_json, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, k);

    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        if (cb) {
            int64_t enc = sqlite3_column_int64(stmt, 0);
            const char *txt = (const char *)sqlite3_column_text(stmt, 1);
            double dist = sqlite3_column_double(stmt, 2);
            cb(user, enc, txt ? txt : "", dist);
        }
    }

    int err = (rc != SQLITE_DONE);
    if (err) set_err(err_out, s->db, "search step failed");

    sqlite3_finalize(stmt);
    return err;
}

void scribend_free_error(char *err) {
    free(err);   /* matches malloc in dup_err */
}

void scribend_close(ScribendStore *s) {
    if (!s) return;
    if (s->db) sqlite3_close(s->db);
    free(s);
}

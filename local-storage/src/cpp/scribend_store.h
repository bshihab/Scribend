/* =============================================================================
 * scribend_store.h — Public C API for Scribend's local patient memory.
 * Owner: Developer 3 (Local Storage Architect)
 *
 * This is the stable boundary the rest of the app builds against. Developer 1's
 * JNI bridge (jni_bridge.c) calls ONLY these functions; it never touches SQLite
 * or sqlite-vec directly. That keeps the storage engine swappable and lets the
 * UI be developed against this header before the NPU models are ready.
 *
 * Error handling: functions that can fail take a `char **err_out`. On failure
 * they return non-zero and, if err_out != NULL, set *err_out to a heap string
 * describing the error. The CALLER OWNS that string and must release it with
 * scribend_free_error(). On success *err_out is left untouched.
 *
 * Threading: a ScribendStore wraps one sqlite3 connection and is NOT
 * thread-safe. Use one store per thread, or serialize access externally.
 * ========================================================================== */
#ifndef SCRIBEND_STORE_H
#define SCRIBEND_STORE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct ScribendStore ScribendStore;

/* Open (creating if needed) the on-device database file and register the
 * sqlite-vec extension on the connection. Returns NULL on failure. */
ScribendStore *scribend_open(const char *db_path, char **err_out);

/* Apply the DDL in schema/schema.sql. Idempotent — safe to call on every start.
 * Pass the schema file's text (read from Android assets / disk by the caller).
 * Returns 0 on success. */
int scribend_init_schema(ScribendStore *s, const char *schema_sql, char **err_out);

/* Insert one embedded note chunk into the patient_vectors virtual table.
 * embedding_json must be a JSON array of exactly 384 floats, e.g. "[0.01,...]".
 * Returns 0 on success. */
int scribend_insert_vector(ScribendStore *s,
                           int64_t patient_id,
                           int64_t encounter_id,
                           const char *embedding_json,
                           const char *chunk_text,
                           char **err_out);

/* Callback invoked once per KNN hit, nearest first. `user` is passed through
 * untouched. The chunk_text pointer is valid only for the duration of the call;
 * copy it if you need to keep it. */
typedef void (*scribend_hit_cb)(void *user,
                                int64_t encounter_id,
                                const char *chunk_text,
                                double distance);

/* Cosine-KNN over a single patient's past notes (partition-pruned).
 * query_embedding_json is a 384-float JSON array; k is the max hits to return.
 * Invokes cb for each hit. Returns 0 on success. */
int scribend_search(ScribendStore *s,
                    int64_t patient_id,
                    const char *query_embedding_json,
                    int k,
                    scribend_hit_cb cb,
                    void *user,
                    char **err_out);

/* Release an error string previously returned via an err_out parameter. */
void scribend_free_error(char *err);

/* Close the connection and free the store. Safe to call with NULL. */
void scribend_close(ScribendStore *s);

#ifdef __cplusplus
} /* extern "C" */
#endif

#endif /* SCRIBEND_STORE_H */

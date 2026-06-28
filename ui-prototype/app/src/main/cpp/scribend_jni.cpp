/* =============================================================================
 * scribend_jni.cpp — JNI bridge: Kotlin <-> Developer 3's scribend_store C API.
 *
 * This is the "help Dev 1 wire the JNI layer" piece, scoped to the storage
 * engine. The Compose app calls these functions to run the REAL on-device
 * sqlite-vec database (open, insert vectors, cosine KNN search).
 * ========================================================================== */
#include <jni.h>
#include <string>
#include <vector>
#include <cstdio>
#include <android/log.h>
#include "scribend_store.h"

#define LOG(...) __android_log_print(ANDROID_LOG_INFO, "ScribendJNI", __VA_ARGS__)

static const char *cstr(JNIEnv *e, jstring s) { return s ? e->GetStringUTFChars(s, nullptr) : nullptr; }

extern "C" {

JNIEXPORT jlong JNICALL
Java_com_scribend_uiprototype_ScribendStore_nativeOpen(JNIEnv *env, jobject, jstring dbPath, jstring schemaSql) {
    const char *path = cstr(env, dbPath);
    const char *schema = cstr(env, schemaSql);
    char *err = nullptr;
    ScribendStore *s = scribend_open(path, &err);
    if (!s) { LOG("open failed: %s", err ? err : "?"); scribend_free_error(err);
              if (path) env->ReleaseStringUTFChars(dbPath, path);
              if (schema) env->ReleaseStringUTFChars(schemaSql, schema); return 0; }
    if (scribend_init_schema(s, schema, &err) != 0) { LOG("schema failed: %s", err ? err : "?");
        scribend_free_error(err); }
    if (path) env->ReleaseStringUTFChars(dbPath, path);
    if (schema) env->ReleaseStringUTFChars(schemaSql, schema);
    return reinterpret_cast<jlong>(s);
}

JNIEXPORT jboolean JNICALL
Java_com_scribend_uiprototype_ScribendStore_nativeInsert(JNIEnv *env, jobject, jlong handle,
        jlong patientId, jlong encounterId, jstring embeddingJson, jstring text) {
    auto *s = reinterpret_cast<ScribendStore *>(handle);
    if (!s) return JNI_FALSE;
    const char *emb = cstr(env, embeddingJson);
    const char *txt = cstr(env, text);
    char *err = nullptr;
    int rc = scribend_insert_vector(s, patientId, encounterId, emb, txt, &err);
    if (rc != 0) { LOG("insert failed: %s", err ? err : "?"); scribend_free_error(err); }
    if (emb) env->ReleaseStringUTFChars(embeddingJson, emb);
    if (txt) env->ReleaseStringUTFChars(text, txt);
    return rc == 0 ? JNI_TRUE : JNI_FALSE;
}

// search results collected here, one "distance\ttext" string per hit
struct Hits { std::vector<std::string> rows; };
static void hitCb(void *user, int64_t enc, const char *text, double dist) {
    (void)enc;
    auto *h = static_cast<Hits *>(user);
    char buf[48]; snprintf(buf, sizeof buf, "%.4f\t", dist);
    h->rows.emplace_back(std::string(buf) + (text ? text : ""));
}

JNIEXPORT jobjectArray JNICALL
Java_com_scribend_uiprototype_ScribendStore_nativeSearch(JNIEnv *env, jobject, jlong handle,
        jlong patientId, jstring queryJson, jint k) {
    auto *s = reinterpret_cast<ScribendStore *>(handle);
    Hits h;
    if (s) {
        const char *q = cstr(env, queryJson);
        char *err = nullptr;
        if (scribend_search(s, patientId, q, k, hitCb, &h, &err) != 0) {
            LOG("search failed: %s", err ? err : "?"); scribend_free_error(err);
        }
        if (q) env->ReleaseStringUTFChars(queryJson, q);
    }
    jclass strCls = env->FindClass("java/lang/String");
    jobjectArray out = env->NewObjectArray((jsize)h.rows.size(), strCls, nullptr);
    for (jsize i = 0; i < (jsize)h.rows.size(); i++)
        env->SetObjectArrayElement(out, i, env->NewStringUTF(h.rows[i].c_str()));
    return out;
}

JNIEXPORT void JNICALL
Java_com_scribend_uiprototype_ScribendStore_nativeClose(JNIEnv *, jobject, jlong handle) {
    scribend_close(reinterpret_cast<ScribendStore *>(handle));
}

} // extern "C"

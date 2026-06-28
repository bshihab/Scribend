package com.scribend.uiprototype

import android.content.Context
import org.json.JSONObject
import java.io.File

/** JNI surface to Developer 3's native sqlite-vec engine (scribend_store). */
object ScribendStore {
    init { System.loadLibrary("scribendjni") }
    external fun nativeOpen(dbPath: String, schemaSql: String): Long
    external fun nativeInsert(handle: Long, patientId: Long, encounterId: Long, embeddingJson: String, text: String): Boolean
    external fun nativeSearch(handle: Long, patientId: Long, queryJson: String, k: Int): Array<String>
    external fun nativeClose(handle: Long)
}

/** High-level helper: seeds the on-device DB from bundled real MiniLM vectors. */
object ScribendDb {
    private var handle = 0L
    var noteCount = 0; private set
    var ready = false; private set

    /** Open a fresh DB and load the 20 real notes from dev3_final_test.json. */
    fun init(context: Context) {
        if (ready) return
        val dbPath = File(context.filesDir, "scribend.db").absolutePath
        File(dbPath).delete()  // fresh each launch for a clean demo
        val schema = context.assets.open("schema.sql").bufferedReader().use { it.readText() }
        handle = ScribendStore.nativeOpen(dbPath, schema)
        val root = JSONObject(context.assets.open("dev3_final_test.json").bufferedReader().use { it.readText() })
        val notes = root.getJSONArray("notes")
        for (i in 0 until notes.length()) {
            val n = notes.getJSONObject(i)
            val emb = n.getJSONArray("embedding").toString()   // "[...]" — exactly what the C API wants
            ScribendStore.nativeInsert(handle, 1L, i.toLong(), emb, n.getString("text"))
        }
        noteCount = notes.length()
        ready = true
    }

    /** The 5 real pre-embedded doctor queries (text + embedding JSON). */
    fun queries(context: Context): List<Pair<String, String>> {
        val root = JSONObject(context.assets.open("dev3_final_test.json").bufferedReader().use { it.readText() })
        val qs = root.getJSONArray("queries")
        return (0 until qs.length()).map {
            val q = qs.getJSONObject(it)
            q.getString("text") to q.getJSONArray("embedding").toString()
        }
    }

    /** Real cosine-KNN over the on-device DB. Returns (distance, noteText) top-k. */
    fun search(queryJson: String, k: Int = 3): List<Pair<Double, String>> =
        ScribendStore.nativeSearch(handle, 1L, queryJson, k).map { row ->
            val parts = row.split("\t", limit = 2)
            (parts[0].toDoubleOrNull() ?: 0.0) to parts.getOrElse(1) { "" }
        }
}

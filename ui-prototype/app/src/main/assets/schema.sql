-- =============================================================================
-- Scribend — Local Patient Memory Schema
-- Owner: Developer 3 (Local Storage Architect)
-- Engine: SQLite + sqlite-vec (vec0 virtual tables)
--
-- WHY this design:
--   * Scribend is strictly offline / on-device (no cloud). All patient history
--     lives in a single SQLite file on the handset.
--   * Standard relational tables hold structured facts (patients, encounters,
--     vital signs). A vec0 VIRTUAL TABLE holds the 384-dim note embeddings so we
--     can do true cosine-distance similarity search over past notes.
--   * 384 = output dimensionality of all-MiniLM-L6-v2 (Section 3-B). Do not
--     change this number without re-embedding every stored note.
--
-- This file is idempotent: safe to run on every app start.
-- =============================================================================

PRAGMA foreign_keys = ON;          -- enforce referential integrity
PRAGMA journal_mode = WAL;         -- better concurrency for read-during-write
PRAGMA synchronous = NORMAL;       -- safe + fast enough for a single handset

-- -----------------------------------------------------------------------------
-- 1. PATIENTS — one row per person seen by the healthcare worker.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    patient_id   INTEGER PRIMARY KEY,         -- internal stable id
    mrn          TEXT UNIQUE,                 -- medical record number (may be NULL offline)
    full_name    TEXT NOT NULL,
    date_of_birth TEXT,                        -- ISO-8601 'YYYY-MM-DD'
    sex          TEXT CHECK (sex IN ('male','female','other','unknown')),
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- 2. ENCOUNTERS — one row per doctor-patient visit. Holds the transcript and
--    the structured JSON SOAP note produced by the on-device LLM (Llama-3.2-1B).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encounters (
    encounter_id INTEGER PRIMARY KEY,
    patient_id   INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    started_at   TEXT NOT NULL DEFAULT (datetime('now')),
    transcript   TEXT,                         -- raw Whisper transcription
    soap_json    TEXT,                         -- structured SOAP note (JSON)
    summary      TEXT                          -- short human-readable summary
);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id, started_at);

-- -----------------------------------------------------------------------------
-- 3. VITALS — structured vital signs, queried with plain SQL (no vectors).
--    Kept separate so numeric trends can be charted without touching the LLM.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vitals (
    vital_id     INTEGER PRIMARY KEY,
    encounter_id INTEGER NOT NULL REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    recorded_at  TEXT NOT NULL DEFAULT (datetime('now')),
    heart_rate   INTEGER,                      -- bpm
    systolic_bp  INTEGER,                      -- mmHg
    diastolic_bp INTEGER,                      -- mmHg
    temp_c       REAL,                         -- degrees Celsius
    spo2         INTEGER,                      -- % oxygen saturation
    resp_rate    INTEGER                       -- breaths per minute
);
CREATE INDEX IF NOT EXISTS idx_vitals_encounter ON vitals(encounter_id, recorded_at);

-- -----------------------------------------------------------------------------
-- 4. PATIENT_VECTORS — the vec0 virtual table that powers RAG retrieval.
--    Each row is one embedded "chunk" of a past note for a patient.
--
--    Column roles in vec0:
--      * patient_id  PARTITION KEY  -> KNN is pruned to a single patient's notes,
--                                      which is both correct (don't mix patients)
--                                      and fast.
--      * encounter_id  (metadata)  -> filterable; links the hit back to its visit.
--      * embedding float[384] distance_metric=cosine -> the MiniLM vector.
--      * +chunk_text  (auxiliary)  -> the original text, returned with the hit so
--                                      the LLM can read it without a second query.
-- -----------------------------------------------------------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS patient_vectors USING vec0(
    patient_id   INTEGER PARTITION KEY,
    encounter_id INTEGER,
    embedding    FLOAT[384] distance_metric=cosine,
    +chunk_text  TEXT
);

-- -----------------------------------------------------------------------------
-- Reference queries (used by the JNI layer — see scribend_store.c)
-- -----------------------------------------------------------------------------
-- Insert one embedded chunk:
--   INSERT INTO patient_vectors(patient_id, encounter_id, embedding, chunk_text)
--   VALUES (:patient_id, :encounter_id, :embedding /* '[...384 floats...]' */, :chunk_text);
--
-- KNN retrieval of a patient's most relevant past notes:
--   SELECT encounter_id, chunk_text, distance
--   FROM patient_vectors
--   WHERE patient_id = :patient_id
--     AND embedding MATCH :query_embedding
--   ORDER BY distance
--   LIMIT :k;

package com.scribend.app

/**
 * Scribend native backend — the ONLY entry point the UI uses to reach C++.
 *
 * Developer 4: call these from your ViewModel / Compose code. They already
 * work — right now they return hardcoded stub data, so you can build and test
 * the full UI flow today. The signatures are FINAL and will not change when
 * Dev 1 swaps the stubs for the real ExecuTorch + QNN models.
 *
 * Example usage (off the main thread):
 *
 *     val transcript = ScribendNative.runWhisper("/path/to/recording.wav")
 *     val soapJson   = ScribendNative.generateSoapNote(transcript)
 *     // parse soapJson -> { Subjective, Objective, Assessment, Plan }
 */
object ScribendNative {

    init {
        // Loads libscribend.so (built from app/src/main/cpp/CMakeLists.txt).
        System.loadLibrary("scribend")
    }

    /**
     * Transcribe an audio recording.
     * @param audioPath absolute path to the audio file on device.
     * @return the transcript text. (Stub: blocks ~2s, returns a sample transcript.)
     */
    external fun runWhisper(audioPath: String): String

    /**
     * Turn a transcript into a SOAP note.
     * @param transcript the text from [runWhisper].
     * @return a JSON string: {"Subjective","Objective","Assessment","Plan"}.
     *         (Stub: returns a sample note instantly.)
     */
    external fun generateSoapNote(transcript: String): String
}

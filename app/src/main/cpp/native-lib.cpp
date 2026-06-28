#include <jni.h>
#include <string>
#include <unistd.h>  // sleep()

// ============================================================================
// Scribend Native Backend  —  Developer 1 (Execution & NDK Lead)
//
// STUB PHASE:
//   Every function below returns hardcoded data immediately so Developer 4
//   can build the entire Kotlin/Compose UI right now, without waiting on the
//   real AI models (Dev 2) or the vector database (Dev 3).
//
// WHEN THE REAL PIECES ARRIVE:
//   - Dev 2 hands over the .pte models  -> replace run_whisper / SOAP logic
//     with the ExecuTorch + Qualcomm QNN runtime calls.
//   - Dev 3 hands over the sqlite-vec DB -> wire retrieval into generateSoapNote.
//
//   !!! DO NOT change the JNI function names or signatures below. !!!
//   Dev 4's UI is compiled against them — change them and the frontend breaks.
//
// NOTE ON NAMING:
//   JNI symbol names embed the Kotlin package + class:
//       Java_<package_with_underscores>_<Class>_<method>
//   These assume package "com.scribend.app" and class "ScribendNative".
//   If the team picks a different package, update BOTH this file and
//   ScribendNative.kt to match, or the app will crash with UnsatisfiedLinkError.
// ============================================================================

extern "C" {

// ---- FAKE Whisper transcription -------------------------------------------
// Real version: load whisper.pte via ExecuTorch, run inference on audioPath.
JNIEXPORT jstring JNICALL
Java_com_scribend_app_ScribendNative_runWhisper(
        JNIEnv* env, jobject /* thiz */, jstring /* audioPath */) {

    // Simulate ~2s of on-device inference so the UI loading state is realistic.
    sleep(2);

    std::string transcript =
        "Patient is a 45-year-old male presenting with a dry cough and "
        "mild fever. Currently taking Lisinopril.";

    return env->NewStringUTF(transcript.c_str());
}

// ---- FAKE LLM + DB retrieval -> SOAP note (JSON) --------------------------
// Real version: embed transcript (MiniLM.pte), retrieve history from
// sqlite-vec, then run Llama 3.2 (.pte) to produce the SOAP note.
JNIEXPORT jstring JNICALL
Java_com_scribend_app_ScribendNative_generateSoapNote(
        JNIEnv* env, jobject /* thiz */, jstring /* transcript */) {

    // Perfectly-formatted JSON so Dev 4 can build + test the UI parser now.
    std::string soapJson =
        "{"
        "\"Subjective\":\"Dry cough, fever\","
        "\"Objective\":\"N/A\","
        "\"Assessment\":\"Upper respiratory infection\","
        "\"Plan\":\"Rest, fluids, continue Lisinopril\""
        "}";

    return env->NewStringUTF(soapJson.c_str());
}

}  // extern "C"

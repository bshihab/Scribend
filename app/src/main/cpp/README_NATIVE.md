# Scribend Native Layer (Dev 1 — Execution & NDK Lead)

This is the C++ / JNI backend. The UI never touches C++ directly — it goes
through `ScribendNative.kt`.

## Files
| File | Purpose |
|------|---------|
| `native-lib.cpp` | JNI functions. Currently **stubs** returning fake data. |
| `CMakeLists.txt` | Builds `libscribend.so`. |
| `../java/com/scribend/app/ScribendNative.kt` | Kotlin contract Dev 4 calls. |

## Hooking CMake into the app (do this once the base Android project is on `main`)
Add to `app/build.gradle(.kts)` inside `android { ... }`:

```kotlin
android {
    // ...
    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }
    defaultConfig {
        // 8 Gen / Snapdragon devices are arm64 — keep the build lean for the demo.
        ndk { abiFilters += listOf("arm64-v8a") }
    }
}
```

Then `Sync` + `Run`. If you call `ScribendNative.runWhisper(...)` you should
get the sample transcript back after ~2s.

## The contract for Dev 4 (this will NOT change)
```kotlin
ScribendNative.runWhisper(audioPath: String): String        // -> transcript text
ScribendNative.generateSoapNote(transcript: String): String // -> SOAP note JSON
```
SOAP JSON shape:
```json
{ "Subjective": "...", "Objective": "...", "Assessment": "...", "Plan": "..." }
```
Call both **off the main thread** (`Dispatchers.IO`) — `runWhisper` blocks while "processing".

## ⚠️ Package-name dependency
The JNI symbol names in `native-lib.cpp` hardcode `com.scribend.app`.
If the team's package differs, update **both** `native-lib.cpp` (the
`Java_com_scribend_app_...` names) and the `package` line in `ScribendNative.kt`,
or the app crashes with `UnsatisfiedLinkError`.

## Later: swapping stubs for real models
1. Dev 2 delivers `whisper.pte`, `minilm.pte`, `llama-3.2.pte`.
2. Add ExecuTorch + QNN to `CMakeLists.txt` (see comment in that file).
3. Replace the hardcoded `return` strings in `native-lib.cpp` with runtime calls.
4. Kotlin + UI stay byte-for-byte the same.

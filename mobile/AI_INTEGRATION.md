# On-device AI integration (react-native-executorch)

Wires **on-device Whisper → Llama** into the RN app so the visit flow produces real
SOAP notes (CPU/XNNPACK, fully offline). Built on Bhasky's RN frontend.

## Status
- ✅ Toolchain installed (JDK 17, Android SDK 35, NDK 28.0.13004108, cmake 3.22.1)
- ✅ Deps installed: `react-native-executorch@0.5.15`, `react-native-audio-api@0.6.5`
- ✅ `src/ai/` code **type-checks cleanly** against the installed library (`yarn typecheck`)
- ⬜ Hook not yet wired into a screen (the app still uses its mock bridge)
- ⬜ Not yet built/run on the device

## What's here
- `src/ai/systemPrompt.ts` — SOAP prompt (4-field, anti-hallucination rules)
- `src/ai/audio.ts` — loads an audio file → 16 kHz waveform (`react-native-audio-api`)
- `src/ai/useScribendAI.ts` — the hook: `generateSoapFromAudio(uri) -> { transcript, soap }`

## Models used (built into react-native-executorch 0.5.15 — auto-downloaded on first run)
- **Whisper:** `WHISPER_SMALL_EN` (the team's chosen model)
- **Llama:** `LLAMA3_2_3B_QLORA` (4-bit; switch to `LLAMA3_2_1B_QLORA` if 3B is too heavy)

## Requirements (already satisfied here)
- New RN Architecture (RN 0.76 default ✅), Android 13+ (S25 is 15 ✅)

## Step 1 — wire the hook into the visit flow
The app currently produces the note via its mock bridge / `utils/soapFallback.ts`.
Replace that where the recording finishes (`VisitInProgressScreen.tsx`):

```tsx
import { useScribendAI } from '../ai/useScribendAI';

const ai = useScribendAI();
// while !ai.isReady -> show a loader (first run downloads the models;
//   use ai.downloadProgress.{whisper,llama} for a progress bar)
const { transcript, soap } = await ai.generateSoapFromAudio(recordedAudioUri);
// navigate to SoapNoteScreen with `soap` (already {subjective,objective,assessment,plan})
```
`soap` matches the app's `SoapNote` shape, so `SoapNoteScreen` renders it unchanged.
Keep `normalizeSoapNote` as the fallback if generation fails.

## Step 2 — build onto the S25
```bash
cd mobile
yarn install          # already done
yarn android          # builds + installs on the connected phone (env must be set, see ANDROID setup)
```

## Notes
- This path is **CPU (XNNPACK)**, on-device, offline. The separate **QNN/NPU Whisper
  export** (`scripts/export_whisper_qnn.sh`) remains a future "run on the NPU for speed" upgrade.
- Patient-history retrieval (sqlite-vec) is **not** wired here — the SOAP note is generated
  from the transcript alone. To add history later, prepend retrieved context to the user
  message in `useScribendAI`.
- First launch downloads ~1–2 GB of models to the device (needs Wi-Fi once), then fully offline.
- RN app authored by Bhasky (copied from the `Bhasky` branch).

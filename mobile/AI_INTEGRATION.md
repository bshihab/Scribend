# On-device AI integration (react-native-executorch)

This wires **on-device Whisper → Llama** into the RN app so the visit flow produces
real SOAP notes (CPU/XNNPACK, fully offline). Based on Bhasky's RN frontend.

> Status: **scaffold**. The code in `src/ai/` follows the documented
> `react-native-executorch` API, but it has **not been built/run on a device yet**.
> Verify the marked spots (model constant name, library version) when you build.

## What was added
- `src/ai/systemPrompt.ts` — SOAP prompt (4-field, with anti-hallucination rules)
- `src/ai/audio.ts` — loads an audio file into a 16 kHz waveform for Whisper
- `src/ai/useScribendAI.ts` — the hook: `generateSoapFromAudio(uri) -> { transcript, soap }`
- `package.json` — added `react-native-executorch` + `react-native-audio-api`

## Requirements (check these first)
- **New React Native Architecture** must be ON (RN 0.76 defaults to it ✅)
- **Android 13+** (your S25 is Android 15 ✅)
- The Llama models were exported with executorch **v0.6.0+** — use a recent
  `react-native-executorch`; if hooks differ from this scaffold, follow the
  installed version's docs (the API moved between 0.4 → 0.9).

## Step 1 — install
```bash
cd mobile
yarn add react-native-executorch@latest react-native-audio-api@latest
# bare RN: rebuild native after adding native modules
yarn android        # (or build in Android Studio)
```

## Step 2 — pick the model constant (VERIFY)
In `src/ai/useScribendAI.ts`, `LLM_MODEL = models.llm.llama3_2_3B_qlora` is a
**best-guess constant name**. Open `models.llm.` in your editor's autocomplete and
pick the real one. software-mansion publishes Llama 3.2 **1B and 3B** (QLoRA /
SpinQuant / original). **Recommended: 3B QLoRA**; if it's too heavy on-device,
drop to **1B**.
Whisper uses `modelName: 'whisper'` (whisper-tiny) — fine for English.

## Step 3 — wire it into the visit flow
The app currently stubs the note via `utils/soapFallback.ts`. Replace that with the
real hook:

```tsx
// in VisitInProgressScreen.tsx (or wherever the recording finishes)
import { useScribendAI } from '../ai/useScribendAI';

const ai = useScribendAI();
// show a loader while !ai.isReady (first run downloads the models)
const { transcript, soap } = await ai.generateSoapFromAudio(recordedAudioUri);
// navigate to SoapNoteScreen with `soap` (already in {subjective,objective,assessment,plan})
```
`soap` already matches the app's `SoapNote` shape, so `SoapNoteScreen` renders it as-is.
Keep `normalizeSoapNote` as the fallback if generation fails.

## Step 4 — first-run model download
On first launch the hook downloads the `.pte` models to the device (Llama 3B is
~1–2 GB quantized). Show `ai.downloadProgress` so the user sees it. After that
it's fully offline.

## Notes / decisions
- This path is **CPU (XNNPACK)**, not the Hexagon NPU. It's the fast-to-ship route.
  The separate **QNN/NPU Whisper export** (`scripts/export_whisper_qnn.sh`, on the
  Codespace) stays as a future "run it on the NPU for speed" upgrade.
- Patient-history retrieval (sqlite-vec) is **not** wired here — for the demo the
  SOAP note is generated from the transcript alone. Adding history later means
  prepending retrieved context to the user message in `useScribendAI`.
- Credit: RN app authored by Bhasky (copied from the `Bhasky` branch).

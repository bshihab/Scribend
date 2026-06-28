// On-device AI pipeline for Scribend: audio -> Whisper transcript -> Llama SOAP note.
// Runs entirely on-device (CPU/XNNPACK) via react-native-executorch.
//
// Usage in a screen:
//   const ai = useScribendAI();
//   if (!ai.isReady) // show "loading models..."
//   const { transcript, soap } = await ai.generateSoapFromAudio(audioUri);
import { useLLM, useSpeechToText, models, type Message } from 'react-native-executorch';
import { SOAP_SYSTEM_PROMPT } from './systemPrompt';
import { loadWaveform } from './audio';
import { fallbackSoapNote, type SoapNote } from '../models/SoapNote';

// ⚠️ VERIFY the exact model constant name against `models.llm.` autocomplete.
// software-mansion publishes Llama 3.2 1B/3B (QLoRA recommended for speed).
// If 3B is too heavy on the device, switch to the 1B constant.
const LLM_MODEL = models.llm.llama3_2_3B_qlora; // e.g. ...llama3_2_1B_qlora for the smaller one

export interface ScribendResult {
  transcript: string;
  soap: SoapNote;
}

export function useScribendAI() {
  const stt = useSpeechToText({ modelName: 'whisper' }); // whisper-tiny (English ok)
  const llm = useLLM({ model: LLM_MODEL() });

  const isReady = stt.isReady && llm.isReady;
  const isBusy = stt.isGenerating || llm.isGenerating;

  async function generateSoapFromAudio(audioUri: string): Promise<ScribendResult> {
    // 1. Audio -> waveform -> transcript (Whisper)
    const waveform = await loadWaveform(audioUri);
    const transcript = await stt.transcribe(waveform);

    // 2. Transcript -> SOAP JSON (Llama)
    const chat: Message[] = [
      { role: 'system', content: SOAP_SYSTEM_PROMPT },
      { role: 'user', content: transcript },
    ];
    await llm.generate(chat);

    // 3. Parse the model output into the app's SoapNote shape
    const soap = parseSoap(llm.response, transcript);
    return { transcript, soap };
  }

  return {
    isReady,
    isBusy,
    error: stt.error ?? llm.error,
    downloadProgress: { stt: stt.downloadProgress, llm: llm.downloadProgress },
    generateSoapFromAudio,
  };
}

// Pull the JSON object out of the model's response and map to SoapNote.
// Falls back to a readable note if parsing fails.
function parseSoap(response: string, transcript: string): SoapNote {
  try {
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) return fallbackSoapNote(transcript);
    const obj = JSON.parse(match[0]);
    return {
      subjective: String(obj.subjective ?? '').trim(),
      objective: String(obj.objective ?? '').trim(),
      assessment: String(obj.assessment ?? '').trim(),
      plan: String(obj.plan ?? '').trim(),
    };
  } catch {
    return fallbackSoapNote(transcript);
  }
}

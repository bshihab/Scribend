// On-device AI pipeline for Scribend: audio -> Whisper transcript -> Llama SOAP note.
// Runs entirely on-device (CPU/XNNPACK) via react-native-executorch (v0.5.x API).
//
// Usage in a screen:
//   const ai = useScribendAI();
//   if (!ai.isReady) // show "loading models..." (first run downloads them)
//   const { transcript, soap } = await ai.generateSoapFromAudio(audioUri);
import {
  useLLM,
  useSpeechToText,
  LLAMA3_2_3B_QLORA,
  WHISPER_SMALL_EN,
  type Message,
} from 'react-native-executorch';
import { SOAP_SYSTEM_PROMPT } from './systemPrompt';
import { loadWaveform } from './audio';
import { fallbackSoapNote, type SoapNote } from '../models/SoapNote';

export interface ScribendResult {
  transcript: string;
  soap: SoapNote;
}

export function useScribendAI() {
  // Whisper small (English) — the model the team chose. Swap to WHISPER_TINY_EN
  // for a smaller/faster download if needed.
  const stt = useSpeechToText({ model: WHISPER_SMALL_EN });

  // Llama 3.2 3B, QLoRA 4-bit (recommended by software-mansion for speed).
  // The constant already bundles modelSource + tokenizerSource + tokenizerConfigSource.
  // Drop to LLAMA3_2_1B_QLORA if 3B is too heavy on-device.
  const llm = useLLM({ model: LLAMA3_2_3B_QLORA });

  const isReady = stt.isReady && llm.isReady;
  const isBusy = stt.isGenerating || llm.isGenerating;

  async function generateSoapFromAudio(audioUri: string): Promise<ScribendResult> {
    // 1. Audio file -> 16 kHz waveform -> transcript (Whisper)
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
    downloadProgress: {
      whisper: stt.downloadProgress,
      llama: llm.downloadProgress,
    },
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

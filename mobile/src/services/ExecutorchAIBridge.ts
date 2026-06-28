// Real on-device AI bridge using react-native-executorch.
// - transcribeAudio() runs Whisper ON THE DEVICE (XNNPACK) on the captured mic waveform.
// - generateSoapNote() runs Llama 3.2 ON THE DEVICE (CPU/XNNPACK).
// - retrievePatientContext is a stub (sqlite-vec not wired into RN yet).
import {
  LLMModule,
  // 1B Llama (cached, no download). Reliable at the 4-field SOAP structure when
  // the transcript is SHORT — long transcripts make 1B ramble everything into
  // "subjective". Keep visit recordings concise. Swap to LLAMA3_2_3B_QLORA for
  // better accuracy + structure at any length (costs a ~2.5GB download).
  LLAMA3_2_1B_QLORA,
  SpeechToTextModule,
  WHISPER_TINY_EN,
  type Message,
} from 'react-native-executorch';
import {SOAP_SYSTEM_PROMPT} from '../ai/systemPrompt';
import {fallbackSoapNote, type SoapNote} from '../models/SoapNote';
import type {AudioWaveform, ScribendAIBridge} from './ScribendAIBridge';

// Used only when no real speech was captured (e.g. running the flow without
// talking) so the end-to-end demo still produces a note.
const SAMPLE_TRANSCRIPT =
  'Patient presents with a three-day history of severe headaches. ' +
  'Blood pressure is 152 over 96. Will prescribe lisinopril 10 milligrams once a day.';

// Below ~1s of audio there's nothing worth transcribing.
const MIN_SAMPLES = 16000;

export class ExecutorchAIBridge implements ScribendAIBridge {
  private llm = new LLMModule();
  private loadPromise: Promise<void> | null = null;

  // Constructed lazily: SpeechToTextModule touches TextDecoder at construction,
  // so we only build it once transcription actually runs.
  private stt: SpeechToTextModule | null = null;
  private sttLoadPromise: Promise<void> | null = null;

  // Load (and download on first run) the Llama model exactly once.
  private ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.llm.load(LLAMA3_2_1B_QLORA, p =>
        console.log(`[Scribend] Llama download: ${Math.round(p * 100)}%`),
      );
    }
    return this.loadPromise;
  }

  // Load (and download on first run) the Whisper model exactly once.
  private ensureSttLoaded(): Promise<void> {
    if (!this.sttLoadPromise) {
      this.stt = new SpeechToTextModule();
      this.sttLoadPromise = this.stt.load(WHISPER_TINY_EN, p =>
        console.log(`[Scribend] Whisper download: ${Math.round(p * 100)}%`),
      );
    }
    return this.sttLoadPromise;
  }

  async transcribeAudio(waveform: AudioWaveform): Promise<string> {
    if (!waveform || waveform.length < MIN_SAMPLES) {
      // No real speech captured — fall back so the demo still completes.
      console.log('[Scribend] No audio captured; using sample transcript');
      return SAMPLE_TRANSCRIPT;
    }
    await this.ensureSttLoaded();
    const raw = (await this.stt!.transcribe(waveform)).trim();
    console.log(`[Scribend] Whisper transcript (${waveform.length} samples): ${raw}`);
    // Drop the Whisper module so its memory is reclaimed before Llama loads —
    // holding Whisper + Llama at once intermittently OOMs the JS heap on-device.
    (this.stt as unknown as {delete?: () => void})?.delete?.();
    this.stt = null;
    this.sttLoadPromise = null;
    // Whisper emits non-speech markers for silence/noise, e.g. [BLANK_AUDIO],
    // [ Pause ], (music). Strip them; if nothing real is left, use the sample.
    const cleaned = raw
      .replace(/[\[(][^\])]*[\])]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || SAMPLE_TRANSCRIPT;
  }

  async retrievePatientContext(_patientId: string, _transcript: string): Promise<string> {
    // sqlite-vec retrieval not wired into RN yet.
    return '';
  }

  async generateSoapNote(
    _patientId: string,
    transcript: string,
    context: string,
  ): Promise<SoapNote> {
    await this.ensureLoaded();
    const userContent = context
      ? `Past patient history:\n${context}\n\nVisit transcript:\n${transcript}`
      : transcript;
    const messages: Message[] = [
      {role: 'system', content: SOAP_SYSTEM_PROMPT},
      {role: 'user', content: userContent},
    ];
    const response = await this.llm.generate(messages);
    console.log(`[Scribend] Llama raw SOAP response: ${response}`);
    return parseSoap(response, transcript);
  }
}

// Coerce any JSON value (string / array / nested object) to readable text.
// Fixes the "[object Object]" bug when the model returns a nested plan/section.
function coerce(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(coerce).filter(Boolean).join('; ');
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(coerce)
      .filter(Boolean)
      .join('; ');
  }
  return '';
}

// Find the first balanced {...} block (brace/string aware). Returns a partial
// fragment (first "{" to end) if the model truncated before closing — so we can
// still salvage it below.
function extractObjectText(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start); // truncated — salvage the fragment
}

// Pull a single field's string value straight out of the raw text, tolerating
// malformed JSON (this is what saves us when JSON.parse fails on 1B output).
function extractField(text: string, key: string): string {
  const re = new RegExp(`"${key}[a-z]*"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'i');
  const m = text.match(re);
  return m ? coerce(m[1].replace(/\\"/g, '"').replace(/\\n/g, ' ')) : '';
}

// Get a key from a parsed object case-insensitively (subjective/Subjective/subj…).
function pick(obj: Record<string, unknown>, prefix: string): string {
  const k = Object.keys(obj).find(kk => kk.toLowerCase().startsWith(prefix));
  return k ? coerce(obj[k]) : '';
}

// --- Deterministic safety net -------------------------------------------------
// The 1B model often leaves "subjective"/"objective" blank even when the
// transcript clearly contains them (it fills assessment/plan and drops the
// rest). When that happens we reconstruct those fields straight from the
// transcript so the SOAP note is never half-empty.

function vitalsFromTranscript(t: string): string {
  const out: string[] = [];
  const bp = t.match(/blood pressure[^.]*?(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})/i);
  if (bp) out.push(`Blood pressure ${bp[1]}/${bp[2]} mmHg`);
  const hr = t.match(/heart rate[^.]*?(\d{2,3})/i);
  if (hr) out.push(`Heart rate ${hr[1]} bpm`);
  const temp = t.match(/temperature[^.]*?(\d{2,3}(?:\.\d)?)/i);
  if (temp) out.push(`Temperature ${temp[1]}`);
  const spo2 = t.match(/(?:spo2|oxygen|o2 sat|saturation)[^.]*?(\d{2,3})\s*%?/i);
  if (spo2) out.push(`SpO2 ${spo2[1]}%`);
  const wt = t.match(/weight[^.]*?(\d{1,3}(?:\.\d)?)\s*(kg|kilograms?|pounds?|lbs)/i);
  if (wt) out.push(`Weight ${wt[1]} ${wt[2]}`);
  return out.join('. ');
}

function symptomsFromTranscript(t: string): string {
  const sentences = t
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  const symptom = /(report|complain|feel|pain|headache|dizz|naus|cough|fever|tired|fatigue|symptom|ache|sore|breath|history|swelling|weeks?|days?)/i;
  const isVital = /(blood pressure|heart rate|temperature|spo2|oxygen|saturation|weight|on exam|exam[, ])/i;
  const isPlan = /(plan|start|restart|prescrib|follow.?up|order|increase|reduce|return in|schedule)/i;
  const picked = sentences.filter(s => symptom.test(s) && !isVital.test(s) && !isPlan.test(s));
  return picked.join(' ');
}

function parseSoap(response: string, transcript: string): SoapNote {
  // Strip markdown fences / leading prose the small model sometimes adds.
  const cleaned = String(response ?? '').replace(/```(?:json)?/gi, '').trim();
  const block = extractObjectText(cleaned);

  // 1) Try strict JSON parse — including a salvage pass for truncated output.
  let obj: Record<string, unknown> | null = null;
  if (block) {
    for (const candidate of [block, block + '"}', block + '"}}', block + '}', block + '}}']) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === 'object') {
          obj = parsed as Record<string, unknown>;
          break;
        }
      } catch {
        // try next salvage candidate
      }
    }
  }

  let note: SoapNote;
  if (obj) {
    note = {
      subjective: pick(obj, 'subj'),
      objective: pick(obj, 'obj'),
      assessment: pick(obj, 'assess'),
      plan: pick(obj, 'plan'),
    };
  } else {
    // 2) JSON failed entirely — regex each field out of the raw text.
    const src = block ?? cleaned;
    note = {
      subjective: extractField(src, 'subj'),
      objective: extractField(src, 'obj'),
      assessment: extractField(src, 'assess'),
      plan: extractField(src, 'plan'),
    };
  }

  // Safety net: backfill blank subjective/objective from the transcript so the
  // note is never half-empty when the small model drops those fields.
  if (!note.subjective.trim()) {
    note.subjective = symptomsFromTranscript(transcript);
  }
  if (!note.objective.trim()) {
    note.objective = vitalsFromTranscript(transcript);
  }

  // If we recovered nothing usable at all, fall back to the transcript.
  if (![note.subjective, note.objective, note.assessment, note.plan].some(v => v.trim())) {
    return fallbackSoapNote(transcript);
  }
  return note;
}

// Live microphone capture for on-device Whisper.
//
// Whisper (react-native-executorch SpeechToTextModule) wants a mono 16 kHz
// Float32 PCM waveform. react-native-audio-api's AudioRecorder streams buffers
// via onAudioReady; we copy each chunk's channel-0 data and concatenate on stop.
import {AudioRecorder} from 'react-native-audio-api';

const SAMPLE_RATE = 16000; // Whisper's expected input rate
const BUFFER_LENGTH = 16000; // ~1s per callback

class AudioCapture {
  private recorder: AudioRecorder | null = null;
  private chunks: Float32Array[] = [];
  private recording = false;

  private ensureRecorder(): AudioRecorder {
    if (!this.recorder) {
      this.recorder = new AudioRecorder({
        sampleRate: SAMPLE_RATE,
        bufferLengthInSamples: BUFFER_LENGTH,
      });
      this.recorder.onAudioReady(event => {
        if (!this.recording) {
          return;
        }
        // Copy: the underlying buffer may be reused by the native side.
        this.chunks.push(Float32Array.from(event.buffer.getChannelData(0)));
      });
    }
    return this.recorder;
  }

  start(): void {
    const recorder = this.ensureRecorder();
    this.chunks = [];
    this.recording = true;
    recorder.start();
  }

  // Stop and return the full captured waveform (empty if nothing was recorded).
  stop(): Float32Array {
    if (this.recorder && this.recording) {
      this.recorder.stop();
    }
    this.recording = false;
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const waveform = new Float32Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      waveform.set(chunk, offset);
      offset += chunk.length;
    }
    return waveform;
  }
}

export const audioCapture = new AudioCapture();

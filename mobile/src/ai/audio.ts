// Loads an audio file into a 16 kHz mono waveform (Float array) for Whisper.
// react-native-executorch's speech-to-text expects a 16 kHz waveform.
import { AudioContext } from 'react-native-audio-api';

/**
 * Decode an on-device audio file URI into a 16 kHz mono Float32 waveform.
 * @param uri local file URI of the recorded audio (e.g. from the recorder)
 */
export async function loadWaveform(uri: string): Promise<number[]> {
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await audioContext.decodeAudioDataSource(uri);
  // channel 0 = mono
  return Array.from(audioBuffer.getChannelData(0));
}

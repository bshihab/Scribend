import sounddevice as sd
import soundfile as sf
import queue
import sys

def record_audio(filename="model_evaluation/my_voice.wav", fs=16000):
    q = queue.Queue()

    def callback(indata, frames, time, status):
        """This is called for each audio block by sounddevice."""
        if status:
            print(status, file=sys.stderr)
        q.put(indata.copy())

    print("\n" + "="*50)
    print("🎙️  SCRIBEND AUDIO RECORDER")
    print("="*50)
    print("Press ENTER to START recording...")
    input()  # Wait for user to press Enter to start
    
    print("🔴 RECORDING NOW! (Max 10 minutes)")
    print("Press ENTER again to STOP recording...")
    print("="*50 + "\n")

    try:
        # Start the recording stream
        with sf.SoundFile(filename, mode='x', samplerate=fs, channels=1, subtype='PCM_16') as file:
            with sd.InputStream(samplerate=fs, channels=1, callback=callback):
                # Wait for user to press Enter to stop (we simulate a max of 10 minutes by waiting on input)
                # If they don't press anything, it just keeps recording. 
                input()
                
    except KeyboardInterrupt:
        print("\nRecording stopped by user (Ctrl+C)")
    except FileExistsError:
        # If file exists, we just overwrite it
        import os
        os.remove(filename)
        with sf.SoundFile(filename, mode='x', samplerate=fs, channels=1, subtype='PCM_16') as file:
            with sd.InputStream(samplerate=fs, channels=1, callback=callback):
                input()
                
    # We have to write the data from the queue to the file.
    # Actually, the file writing needs to happen concurrently.
    pass

# Wait, a better way to do continuous recording and writing is a loop:
def record_continuous(filename="model_evaluation/my_voice.wav", fs=16000):
    import os
    if os.path.exists(filename):
        os.remove(filename)
        
    q = queue.Queue()

    def callback(indata, frames, time, status):
        q.put(indata.copy())

    print("\n" + "="*50)
    print("🎙️  SCRIBEND AUDIO RECORDER")
    print("="*50)
    print("Press ENTER to START recording...")
    input()
    
    print("🔴 RECORDING NOW! (Press Ctrl+C to STOP)")
    print("="*50 + "\n")

    try:
        with sf.SoundFile(filename, mode='x', samplerate=fs, channels=1, subtype='PCM_16') as file:
            with sd.InputStream(samplerate=fs, channels=1, callback=callback):
                while True:
                    file.write(q.get())
    except KeyboardInterrupt:
        print("\n✅ Recording complete!")
        print(f"💾 Saved your voice to {filename}")

if __name__ == "__main__":
    record_continuous()

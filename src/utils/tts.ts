
// Text-to-speech using Piper TTS
let piperModel: any = null;

export async function initializePiper() {
  if (piperModel) return piperModel;
  
  try {
    // Dynamically import piper-tts
    const { loadModel } = await import('piper-tts');
    piperModel = await loadModel('/wasm/amy.onnx');
    console.log('Piper TTS model loaded successfully');
    return piperModel;
  } catch (error) {
    console.warn('Failed to load Piper TTS, using fallback:', error);
    return null;
  }
}

export async function synthesize(text: string) {
  try {
    const model = await initializePiper();
    if (!model) {
      throw new Error('Piper model not available');
    }
    
    const { speak } = await import('piper-tts');
    const { audioBuffer, phonemeJson } = await speak(model, text, {
      phonemeTimes: true
    });
    
    return { audioBuffer, phonemeJson };
  } catch (error) {
    console.warn('Piper TTS failed, using Web Audio fallback:', error);
    
    // Fallback to synthetic audio generation
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = Math.max(2, text.length * 0.08);
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    
    // Generate synthetic speech-like audio
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      const frequency = 150;
      const harmonics = Math.sin(2 * Math.PI * frequency * i / audioContext.sampleRate) * 0.3;
      channelData[i] = harmonics * (0.1 + Math.random() * 0.05);
    }
    
    // Generate synthetic phoneme data
    const phonemeJson = generateSyntheticPhonemes(text, duration);
    
    return { audioBuffer: buffer, phonemeJson };
  }
}

function generateSyntheticPhonemes(text: string, duration: number) {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const phonemes: any[] = [];
  const timePerWord = duration / words.length;
  
  words.forEach((word, index) => {
    const startTime = index * timePerWord;
    const chars = word.toLowerCase().split('');
    const timePerChar = (timePerWord * 0.8) / chars.length;
    
    chars.forEach((char, charIndex) => {
      phonemes.push({
        phoneme: getPhonemeForChar(char),
        start: startTime + (charIndex * timePerChar),
        end: startTime + ((charIndex + 1) * timePerChar)
      });
    });
  });
  
  return phonemes;
}

function getPhonemeForChar(char: string): string {
  const phoneMap: { [key: string]: string } = {
    'a': 'AA', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
    'p': 'MBP', 'b': 'MBP', 'm': 'MBP',
    'f': 'FV', 'v': 'FV',
    'l': 'L', 'r': 'L'
  };
  return phoneMap[char] || 'AA';
}

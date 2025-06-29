
// Local speech synthesis utility for 3D avatar
export interface SpeechSynthesisResult {
  audioBuffer: AudioBuffer;
  phonemes: Phoneme[];
  duration: number;
}

export interface Phoneme {
  phoneme: string;
  start: number;
  end: number;
}

export class LocalSpeechSynthesis {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async initialize() {
    console.log('Local TTS initialized (using Web Speech API)');
    return true;
  }

  async synthesize(text: string, voiceModel: string = 'default'): Promise<SpeechSynthesisResult> {
    try {
      console.log('Synthesizing text:', text);
      
      // Generate mock audio buffer for now
      const sampleRate = 22050;
      const duration = Math.max(2, text.length * 0.08); // Rough estimation
      const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      
      // Generate white noise as placeholder audio
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * 0.1; // Low volume white noise
      }
      
      // Generate phonemes based on text analysis
      const phonemes: Phoneme[] = this.generatePhonemesFromText(text, duration);
      
      return {
        audioBuffer: buffer,
        phonemes,
        duration
      };
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      throw error;
    }
  }

  private generatePhonemesFromText(text: string, duration: number): Phoneme[] {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const phonemes: Phoneme[] = [];
    const timePerWord = duration / words.length;
    
    words.forEach((word, index) => {
      const startTime = index * timePerWord;
      let currentTime = startTime;
      const wordDuration = timePerWord * 0.8; // Leave some pause between words
      
      // Simple phoneme generation based on word characters
      const chars = word.toLowerCase().split('');
      const phonemeCount = Math.max(1, Math.floor(chars.length / 2));
      const timePerPhoneme = wordDuration / phonemeCount;
      
      for (let i = 0; i < phonemeCount; i++) {
        const charIndex = Math.floor((i / phonemeCount) * chars.length);
        const char = chars[charIndex] || 'a';
        const viseme = this.getVisemeForChar(char);
        
        phonemes.push({
          phoneme: viseme,
          start: currentTime,
          end: currentTime + timePerPhoneme
        });
        
        currentTime += timePerPhoneme;
      }
    });
    
    return phonemes;
  }

  private getVisemeForChar(char: string): string {
    const visemeMap: { [key: string]: string } = {
      'a': 'AA', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
      'p': 'P', 'b': 'P', 'm': 'P',
      'f': 'F', 'v': 'F',
      't': 'T', 'd': 'T', 'n': 'T', 'l': 'T',
      's': 'S', 'z': 'S', 'c': 'S', 'k': 'S'
    };
    return visemeMap[char] || 'AA';
  }

  playAudio(audioBuffer: AudioBuffer): AudioBufferSourceNode {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();
    return source;
  }
}

export const localSpeech = new LocalSpeechSynthesis();

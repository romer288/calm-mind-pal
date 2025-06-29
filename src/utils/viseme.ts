
import { Phoneme } from './speech';

export interface VisemeFrame {
  time: number;
  viseme: string;
  weight: number;
}

export interface VisemeTimeline {
  frames: VisemeFrame[];
  duration: number;
}

export class VisemeProcessor {
  private rhubarbWasm: any = null;

  // Standard viseme mapping for facial animation
  private static readonly VISEME_MAP = {
    'AA': { mouth: [0.8, 0.1, 0.0], jaw: 0.7 }, // "car"
    'E': { mouth: [0.4, 0.6, 0.0], jaw: 0.3 },  // "bed"
    'I': { mouth: [0.1, 0.8, 0.0], jaw: 0.1 },  // "bit"
    'O': { mouth: [0.9, 0.0, 0.8], jaw: 0.4 },  // "hot"
    'U': { mouth: [0.2, 0.0, 0.9], jaw: 0.2 },  // "book"
    'P': { mouth: [0.0, 0.0, 0.0], jaw: 0.0 },  // "put"
    'F': { mouth: [0.3, 0.4, 0.0], jaw: 0.1 },  // "far"
    'T': { mouth: [0.2, 0.3, 0.0], jaw: 0.2 },  // "talk"
    'S': { mouth: [0.1, 0.7, 0.0], jaw: 0.1 },  // "sit"
    'REST': { mouth: [0.0, 0.0, 0.0], jaw: 0.0 }
  };

  async initialize() {
    try {
      console.log('Initializing Rhubarb lip-sync...');
      // TODO: Load actual Rhubarb WASM from /public/wasm/rhubarb.wasm
      this.rhubarbWasm = { initialized: true };
      return true;
    } catch (error) {
      console.error('Failed to initialize Rhubarb:', error);
      return false;
    }
  }

  async processPhonemes(phonemes: Phoneme[]): Promise<VisemeTimeline> {
    if (!this.rhubarbWasm) {
      await this.initialize();
    }

    try {
      // Convert phonemes to viseme timeline
      const frames: VisemeFrame[] = [];
      
      phonemes.forEach(phoneme => {
        const visemeData = VisemeProcessor.VISEME_MAP[phoneme.phoneme as keyof typeof VisemeProcessor.VISEME_MAP] 
          || VisemeProcessor.VISEME_MAP.REST;
        
        frames.push({
          time: phoneme.start,
          viseme: phoneme.phoneme,
          weight: 1.0
        });
        
        frames.push({
          time: phoneme.end,
          viseme: 'REST',
          weight: 0.0
        });
      });

      // Sort by time and smooth transitions
      frames.sort((a, b) => a.time - b.time);
      
      const duration = phonemes.length > 0 ? Math.max(...phonemes.map(p => p.end)) : 0;
      
      return {
        frames,
        duration
      };
    } catch (error) {
      console.error('Viseme processing failed:', error);
      throw error;
    }
  }

  getVisemeWeights(viseme: string): { mouth: number[], jaw: number } {
    const visemeData = VisemeProcessor.VISEME_MAP[viseme as keyof typeof VisemeProcessor.VISEME_MAP] 
      || VisemeProcessor.VISEME_MAP.REST;
    return visemeData;
  }

  // Interpolate between visemes for smooth animation
  interpolateVisemes(currentTime: number, timeline: VisemeTimeline): { mouth: number[], jaw: number } {
    if (timeline.frames.length === 0) {
      return VisemeProcessor.VISEME_MAP.REST;
    }

    // Find the current frame
    let currentFrame = timeline.frames[0];
    let nextFrame = timeline.frames[0];
    
    for (let i = 0; i < timeline.frames.length - 1; i++) {
      if (timeline.frames[i].time <= currentTime && timeline.frames[i + 1].time > currentTime) {
        currentFrame = timeline.frames[i];
        nextFrame = timeline.frames[i + 1];
        break;
      }
    }

    // Calculate interpolation factor
    const timeDiff = nextFrame.time - currentFrame.time;
    const progress = timeDiff > 0 ? (currentTime - currentFrame.time) / timeDiff : 0;
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // Get viseme weights
    const currentWeights = this.getVisemeWeights(currentFrame.viseme);
    const nextWeights = this.getVisemeWeights(nextFrame.viseme);

    // Interpolate
    const interpolatedMouth = currentWeights.mouth.map((current, index) => {
      const next = nextWeights.mouth[index];
      return current + (next - current) * clampedProgress;
    });

    const interpolatedJaw = currentWeights.jaw + (nextWeights.jaw - currentWeights.jaw) * clampedProgress;

    return {
      mouth: interpolatedMouth,
      jaw: interpolatedJaw
    };
  }
}

export const visemeProcessor = new VisemeProcessor();

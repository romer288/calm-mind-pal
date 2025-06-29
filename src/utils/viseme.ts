
// Phoneme to viseme conversion using Rhubarb Lip-Sync
let rhubarbWasm: any = null;

const VISEME_MAP: Record<string, string> = {
  'A': 'AA', 'E': 'E', 'I': 'I', 'O': 'O', 'U': 'U',
  'MBP': 'MBP', 'FV': 'FV', 'L': 'L'
};

async function initializeRhubarb() {
  if (rhubarbWasm) return rhubarbWasm;
  
  try {
    // Try to load Rhubarb WASM
    const response = await fetch('/wasm/rhubarb.wasm');
    if (!response.ok) throw new Error('WASM not found');
    
    const wasmBytes = await response.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBytes);
    rhubarbWasm = wasmModule;
    console.log('Rhubarb WASM loaded successfully');
    return rhubarbWasm;
  } catch (error) {
    console.warn('Failed to load Rhubarb WASM, using fallback:', error);
    return null;
  }
}

export async function toVisemes(phonemeJson: any[]) {
  try {
    const wasmModule = await initializeRhubarb();
    if (!wasmModule) {
      throw new Error('Rhubarb WASM not available');
    }
    
    // Process with Rhubarb WASM (simplified - actual implementation would need more WASM bindings)
    const mouthCues = await processWithRhubarb(phonemeJson);
    
    return mouthCues.map((cue: any) => ({
      time: cue.start,
      viseme: VISEME_MAP[cue.mouth] ?? 'rest'
    }));
  } catch (error) {
    console.warn('Rhubarb processing failed, using fallback:', error);
    
    // Fallback: direct phoneme to viseme mapping
    return phonemeJson.map((phoneme: any) => ({
      time: phoneme.start,
      viseme: VISEME_MAP[phoneme.phoneme] || 'AA'
    }));
  }
}

async function processWithRhubarb(phonemes: any[]) {
  // Simplified fallback implementation
  // In a real implementation, this would call the WASM module
  return phonemes.map(p => ({
    start: p.start,
    mouth: p.phoneme
  }));
}

export interface VisemeFrame {
  time: number;
  viseme: string;
}

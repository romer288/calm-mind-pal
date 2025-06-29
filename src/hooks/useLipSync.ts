
import { useFrame } from '@react-three/fiber';
import { MutableRefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VisemeFrame } from '@/utils/viseme';

export default function useLipSync(
  mesh: MutableRefObject<THREE.Mesh | undefined>,
  timeline: VisemeFrame[] | null,
  audio: AudioBuffer | null
) {
  const clock = useRef(new THREE.Clock(false));
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!timeline || !audio || !mesh.current) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      source.buffer = audio;
      source.connect(audioContext.destination);
      source.start();
      audioSourceRef.current = source;
      clock.current.start();
      
      source.onended = () => {
        clock.current.stop();
        audioSourceRef.current = null;
      };
    } catch (error) {
      console.error('Failed to play audio:', error);
    }

    return () => {
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          // Audio might already be stopped
        }
        audioSourceRef.current = null;
      }
      clock.current.stop();
    };
  }, [timeline, audio]);

  useFrame(() => {
    if (!timeline || !mesh.current || !clock.current.running) return;
    
    const currentTime = clock.current.getElapsedTime();
    
    // Reset all morph targets
    if (mesh.current.morphTargetInfluences) {
      mesh.current.morphTargetInfluences.forEach((_, index) => {
        if (mesh.current?.morphTargetInfluences) {
          mesh.current.morphTargetInfluences[index] *= 0.9; // Smooth decay
        }
      });
    }
    
    // Apply current viseme
    for (const frame of timeline) {
      if (!mesh.current.morphTargetDictionary) continue;
      
      const targetIndex = mesh.current.morphTargetDictionary[frame.viseme];
      if (targetIndex === undefined) continue;
      
      // Calculate weight based on time proximity
      const timeDiff = Math.abs(currentTime - frame.time);
      const weight = Math.max(0, 1 - timeDiff * 12); // Adjust sharpness factor
      
      if (mesh.current.morphTargetInfluences && weight > 0) {
        mesh.current.morphTargetInfluences[targetIndex] = Math.max(
          mesh.current.morphTargetInfluences[targetIndex],
          weight
        );
      }
    }
  });
}

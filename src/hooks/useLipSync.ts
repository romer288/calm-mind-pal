
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisemeTimeline, visemeProcessor } from '@/utils/viseme';

interface UseLipSyncProps {
  mesh: THREE.Mesh | null;
  timeline: VisemeTimeline | null;
  isPlaying: boolean;
  startTime: number;
}

interface LipSyncState {
  currentViseme: string;
  mouthWeights: number[];
  jawWeight: number;
}

export const useLipSync = ({ mesh, timeline, isPlaying, startTime }: UseLipSyncProps) => {
  const [lipSyncState, setLipSyncState] = useState<LipSyncState>({
    currentViseme: 'REST',
    mouthWeights: [0, 0, 0],
    jawWeight: 0
  });

  const animationTimeRef = useRef(0);

  useFrame((state, delta) => {
    if (!mesh || !timeline || !isPlaying) {
      // Reset to neutral position when not playing
      if (mesh && mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences.forEach((_, index) => {
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
              mesh.morphTargetInfluences[index],
              0,
              delta * 5 // Smooth return to neutral
            );
          }
        });
      }
      return;
    }

    // Update animation time
    animationTimeRef.current += delta;
    const currentTime = animationTimeRef.current;

    // Get interpolated viseme weights
    const { mouth, jaw } = visemeProcessor.interpolateVisemes(currentTime, timeline);

    // Apply to mesh morph targets
    if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
      // Map common morph target names to our viseme system
      const morphTargetMapping = {
        // Mouth open/close
        'mouthOpen': mouth[0],
        'jawOpen': jaw,
        
        // Mouth shapes
        'mouthSmile': mouth[1] * 0.3,
        'mouthFunnel': mouth[2],
        
        // Additional viseme targets if available
        'viseme_aa': mouth[0],
        'viseme_E': mouth[1],
        'viseme_I': mouth[1] * 0.8,
        'viseme_O': mouth[2],
        'viseme_U': mouth[2] * 0.8,
      };

      Object.entries(morphTargetMapping).forEach(([targetName, weight]) => {
        const index = mesh.morphTargetDictionary![targetName];
        if (index !== undefined && mesh.morphTargetInfluences) {
          const targetWeight = Math.max(0, Math.min(1, weight));
          mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            mesh.morphTargetInfluences[index],
            targetWeight,
            delta * 10 // Smooth interpolation
          );
        }
      });
    }

    // Update state for debugging/monitoring
    setLipSyncState({
      currentViseme: timeline.frames.find(f => f.time <= currentTime)?.viseme || 'REST',
      mouthWeights: mouth,
      jawWeight: jaw
    });
  });

  // Reset animation time when starting new playback
  useEffect(() => {
    if (isPlaying) {
      animationTimeRef.current = 0;
    }
  }, [isPlaying, startTime]);

  return {
    lipSyncState,
    resetAnimation: () => {
      animationTimeRef.current = 0;
    }
  };
};

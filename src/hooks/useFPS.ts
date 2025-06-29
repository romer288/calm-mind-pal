import { useState, useEffect, useRef } from 'react';

export const useFPS = () => {
  const [fps, setFps] = useState(60);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const rafRef = useRef<number>();

  useEffect(() => {
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      if (delta > 0) {
        const currentFPS = Math.round(1000 / delta);
        setFps(currentFPS);
        
        // Keep history of last 60 frames (roughly 1 second at 60fps)
        fpsHistoryRef.current.push(currentFPS);
        if (fpsHistoryRef.current.length > 60) {
          fpsHistoryRef.current.shift();
        }
        
        // Check if average FPS over last second is below 25
        if (fpsHistoryRef.current.length >= 30) {
          const avgFPS = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
          if (avgFPS < 25 && !isLowPerformance) {
            console.log('Low performance detected, average FPS:', avgFPS);
            setIsLowPerformance(true);
          }
        }
      }
      
      rafRef.current = requestAnimationFrame(measureFPS);
    };

    rafRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isLowPerformance]);

  return { fps, isLowPerformance };
};

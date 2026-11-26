import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { SkeletonConfig, SkeletonAnimation, SkeletonSpeed } from './types';

interface SkeletonContextValue extends SkeletonConfig {
  setEnabled: (enabled: boolean) => void;
  setAnimation: (animation: SkeletonAnimation) => void;
  setSpeed: (speed: SkeletonSpeed) => void;
}

const STORAGE_KEY = 'souq_skeleton_config_v1';

const defaultContext: SkeletonContextValue = {
  enabled: true,
  animation: 'shimmer',
  speed: 'normal',
  reducedMotion: false,
  setEnabled: () => {},
  setAnimation: () => {},
  setSpeed: () => {},
};

export const SkeletonContext = createContext<SkeletonContextValue>(defaultContext);

export const SkeletonProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: Partial<SkeletonConfig>;
}> = ({ children, initialConfig }) => {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (initialConfig?.enabled !== undefined) return initialConfig.enabled;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.enabled === 'boolean') return parsed.enabled;
      }
    } catch {
      /* ignore */
    }
    return true;
  });

  const [animation, setAnimationState] = useState<SkeletonAnimation>(() => {
    if (initialConfig?.animation) return initialConfig.animation;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.animation) return parsed.animation;
      }
    } catch {
      /* ignore */
    }
    return 'shimmer';
  });

  const [speed, setSpeedState] = useState<SkeletonSpeed>(() => {
    if (initialConfig?.speed) return initialConfig.speed;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.speed) return parsed.speed;
      }
    } catch {
      /* ignore */
    }
    return 'normal';
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener?.('change', listener);
    return () => media.removeEventListener?.('change', listener);
  }, []);

  const setEnabled = (val: boolean) => {
    setEnabledState(val);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: val, animation, speed }));
    } catch {
      /* ignore */
    }
  };

  const setAnimation = (val: SkeletonAnimation) => {
    setAnimationState(val);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, animation: val, speed }));
    } catch {
      /* ignore */
    }
  };

  const setSpeed = (val: SkeletonSpeed) => {
    setSpeedState(val);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, animation, speed: val }));
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(
    () => ({
      enabled,
      animation,
      speed,
      reducedMotion,
      setEnabled,
      setAnimation,
      setSpeed,
    }),
    [enabled, animation, speed, reducedMotion],
  );

  return <SkeletonContext.Provider value={value}>{children}</SkeletonContext.Provider>;
};

export function useSkeletonConfig(): SkeletonContextValue {
  return useContext(SkeletonContext);
}

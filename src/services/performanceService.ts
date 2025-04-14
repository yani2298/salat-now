import { useState, useEffect } from 'react';

// Types de niveaux de performance
export enum PerformanceLevel {
  LOW = 'low',       // Moins d'animations, économise le CPU
  MEDIUM = 'medium', // Équilibre entre performances et esthétique
  HIGH = 'high'      // Toutes les animations, meilleur rendu visuel
}

// Clé pour le stockage local
const PERFORMANCE_LEVEL_KEY = 'salat-now-performance-level';

// Stocke le niveau de performance actuel
export const setPerformanceLevel = (level: PerformanceLevel): void => {
  try {
    localStorage.setItem(PERFORMANCE_LEVEL_KEY, level);
    window.dispatchEvent(new Event('performance-level-changed'));
  } catch (error) {
    console.error('Erreur lors du stockage du niveau de performance:', error);
  }
};

// Récupère le niveau de performance actuel
export const getPerformanceLevel = (): PerformanceLevel => {
  try {
    const level = localStorage.getItem(PERFORMANCE_LEVEL_KEY) as PerformanceLevel;
    return level || getDefaultPerformanceLevel();
  } catch (error) {
    return getDefaultPerformanceLevel();
  }
};

// Déterminer le niveau de performance par défaut
export const getDefaultPerformanceLevel = (): PerformanceLevel => {
  // Détection si l'appareil est à faible puissance
  if (
    typeof window !== 'undefined' && 
    'deviceMemory' in navigator && 
    (navigator as any).deviceMemory < 4
  ) {
    return PerformanceLevel.LOW;
  }
  
  // Détection des préférences de réduction de mouvement
  if (
    typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return PerformanceLevel.LOW;
  }
  
  // Détecter les appareils mobiles qui pourraient avoir des ressources limitées
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  );
  
  return isMobile ? PerformanceLevel.MEDIUM : PerformanceLevel.HIGH;
};

// Hook React pour utiliser et écouter les changements de niveau de performance
export const usePerformanceLevel = (): [PerformanceLevel, (level: PerformanceLevel) => void] => {
  const [level, setLevel] = useState<PerformanceLevel>(() => getPerformanceLevel());
  
  useEffect(() => {
    const handleChange = () => {
      setLevel(getPerformanceLevel());
    };
    
    window.addEventListener('performance-level-changed', handleChange);
    return () => {
      window.removeEventListener('performance-level-changed', handleChange);
    };
  }, []);
  
  const updateLevel = (newLevel: PerformanceLevel) => {
    setPerformanceLevel(newLevel);
    setLevel(newLevel);
  };
  
  return [level, updateLevel];
};

// Utilitaire pour déterminer si les animations complexes doivent être activées
export const shouldUseReducedMotion = (): boolean => {
  const performanceLevel = getPerformanceLevel();
  return performanceLevel === PerformanceLevel.LOW;
};

// Utilitaire pour déterminer la fréquence de rafraîchissement des animations
export const getAnimationUpdateInterval = (): number => {
  const performanceLevel = getPerformanceLevel();
  switch (performanceLevel) {
    case PerformanceLevel.LOW:
      return 500; // Mettre à jour toutes les 500ms (2 FPS)
    case PerformanceLevel.MEDIUM:
      return 100; // Mettre à jour toutes les 100ms (10 FPS)
    case PerformanceLevel.HIGH:
      return 16.67; // Environ 60 FPS
    default:
      return 100;
  }
};

// Utilitaire pour optimiser le nombre d'éléments animés
export const getOptimizedElementCount = (defaultCount: number): number => {
  const performanceLevel = getPerformanceLevel();
  switch (performanceLevel) {
    case PerformanceLevel.LOW:
      return Math.max(1, Math.floor(defaultCount * 0.3)); // Réduire à 30%
    case PerformanceLevel.MEDIUM:
      return Math.max(1, Math.floor(defaultCount * 0.7)); // Réduire à 70%
    case PerformanceLevel.HIGH:
      return defaultCount;
    default:
      return defaultCount;
  }
}; 
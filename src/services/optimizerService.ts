import { getPerformanceLevel, PerformanceLevel } from './performanceService';
import { PrayerTimes } from '../types/prayer';

// Délai minimum entre deux requêtes au même service en millisecondes
const MIN_API_REQUEST_INTERVAL = 60000; // 1 minute

// Stockage pour suivre le moment de la dernière requête par service
const lastRequestTimestamps: Record<string, number> = {
  weather: 0,
  prayerTimes: 0,
  hijri: 0
};

/**
 * Vérifie si une nouvelle requête API peut être faite pour un service donné
 * @param serviceName Nom du service à vérifier
 * @returns true si une nouvelle requête est autorisée, false sinon
 */
export const canMakeApiRequest = (serviceName: string): boolean => {
  const now = Date.now();
  const lastRequest = lastRequestTimestamps[serviceName] || 0;
  const performanceLevel = getPerformanceLevel();
  
  // Ajuste l'intervalle en fonction du niveau de performance
  let interval = MIN_API_REQUEST_INTERVAL;
  if (performanceLevel === PerformanceLevel.LOW) {
    interval *= 3; // 3 minutes pour le mode économique
  } else if (performanceLevel === PerformanceLevel.MEDIUM) {
    interval *= 2; // 2 minutes pour le mode équilibré
  }
  
  return (now - lastRequest) >= interval;
};

/**
 * Enregistre une requête API comme effectuée pour un service
 * @param serviceName Nom du service pour lequel une requête a été faite
 */
export const markApiRequestMade = (serviceName: string): void => {
  lastRequestTimestamps[serviceName] = Date.now();
};

/**
 * Optimise les horaires de prière pour éviter les calculs inutiles
 * @param prayerTimes Horaires de prière à optimiser
 * @returns Horaires optimisés
 */
export const optimizePrayerTimes = (prayerTimes: PrayerTimes): PrayerTimes => {
  // Par défaut, renvoyer les horaires tels quels
  return prayerTimes;
};

/**
 * Optimise la mise en cache et le stockage local
 * Supprime les données obsolètes pour économiser de l'espace
 */
export const optimizeStorage = (): void => {
  try {
    // Liste des clés concernant notre application
    const appKeys = [
      'cached_prayer_times',
      'prayer_cache_expiry',
      'cached_location',
      'calculation_method',
      'cached_hijri_date',
      'hijri_cache_date',
      'adhanConfig',
      'salat-now-performance-level'
    ];
    
    // Supprimer les clés qui ne correspondent pas à notre application
    // pour éviter d'encombrer le stockage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !appKeys.includes(key) && key.startsWith('salat-now-')) {
        localStorage.removeItem(key);
      }
    }
    
    // Nettoyer les données expirées
    const now = Date.now();
    const cacheExpiry = localStorage.getItem('prayer_cache_expiry');
    
    if (cacheExpiry && parseInt(cacheExpiry) < now) {
      localStorage.removeItem('cached_prayer_times');
      localStorage.removeItem('prayer_cache_expiry');
    }
  } catch (error) {
    console.error('Erreur lors de l\'optimisation du stockage:', error);
  }
};

/**
 * Optimise la planification des adhans pour réduire l'utilisation CPU
 */
export const optimizeAdhanScheduling = (): void => {
  // Limiter le nombre d'adhans planifiés simultanément
  // C'est une fonction fictive qui montre comment on pourrait optimiser
  // la planification des adhans
};

/**
 * Optimise la géolocalisation pour réduire l'utilisation de la batterie
 * @param options Options de géolocalisation à optimiser
 * @returns Options optimisées
 */
export const optimizeGeolocation = (options: PositionOptions): PositionOptions => {
  const performanceLevel = getPerformanceLevel();
  
  // Ajuster les options en fonction du niveau de performance
  switch (performanceLevel) {
    case PerformanceLevel.LOW:
      return {
        ...options,
        enableHighAccuracy: false,
        timeout: 10000,     // 10 secondes
        maximumAge: 600000  // 10 minutes
      };
    case PerformanceLevel.MEDIUM:
      return {
        ...options,
        enableHighAccuracy: false,
        timeout: 5000,      // 5 secondes
        maximumAge: 300000  // 5 minutes
      };
    case PerformanceLevel.HIGH:
    default:
      return {
        ...options,
        enableHighAccuracy: true,
        timeout: 3000,      // 3 secondes
        maximumAge: 60000   // 1 minute
      };
  }
};

/**
 * Active ou désactive le service d'optimisation automatique
 * @param enabled true pour activer, false pour désactiver
 */
export const enableAutomaticOptimization = (enabled: boolean): void => {
  try {
    localStorage.setItem('auto-optimization-enabled', enabled.toString());
    
    if (enabled) {
      // Exécuter une optimisation initiale
      optimizeStorage();
      
      // Planifier des optimisations périodiques
      setInterval(() => {
        // Déterminer l'intervalle en fonction du niveau de performance
        // (cette ligne est uniquement pour le log)
        const performanceLevel = getPerformanceLevel();
        console.log(`Exécution de l'optimisation automatique (niveau: ${performanceLevel})`);
        
        optimizeStorage();
      }, 3600000); // Exécuter une fois par heure
    }
  } catch (error) {
    console.error('Erreur lors de la configuration de l\'optimisation automatique:', error);
  }
};

/**
 * Initialise le service d'optimisation
 * À appeler au démarrage de l'application
 */
export const initOptimizerService = (): void => {
  try {
    const autoOptimizationEnabled = localStorage.getItem('auto-optimization-enabled') === 'true';
    
    if (autoOptimizationEnabled) {
      enableAutomaticOptimization(true);
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du service d\'optimisation:', error);
  }
}; 
// Service pour la gestion de l'adhan (appel à la prière)
import { PrayerTimes } from '../types/prayer';

// Types d'adhan disponibles
export type AdhanType = 'makkah' | 'madinah' | 'alaqsa' | 'custom' | 'none' | 'mishary' | 'nasser' | 'adame' | 'haj';

// Type pour les noms de prière
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

// Ordre des prières pour déterminer la suivante
export const prayerOrder: Record<PrayerName, number> = {
  Fajr: 0,
  Dhuhr: 1,
  Asr: 2,
  Maghrib: 3,
  Isha: 4
};

// Liste des prières pour lesquelles on peut planifier un adhan
export const schedulableAdhanEvents: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Array to store scheduled timers
export let scheduledAdhanTimers: ReturnType<typeof setTimeout>[] = [];

// Configuration pour l'adhan
export interface AdhanConfig {
  enabled: boolean;
  type: AdhanType;
  volume: number;
  notificationTime: number; // minutes avant la prière
  notificationsEnabled: boolean; // Activation/désactivation des notifications
  duaEnabled: boolean; // Activation/désactivation du dua après l'adhan
  prayerSettings: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
  customAudioPath?: string;
}

// Audio element pour jouer l'adhan
let adhanAudio: HTMLAudioElement | null = null;
// Audio element pour jouer le dua
let duaAudio: HTMLAudioElement | null = null;

// Variable pour suivre l'état de l'audio
let isAdhanPlaying = false;
let isAdhanPaused = false;
let audioLock = false;

// Configuration par défaut
const defaultConfig: AdhanConfig = {
  enabled: true,
  type: 'makkah',
  volume: 70,
  notificationTime: 15,
  notificationsEnabled: false, // Notifications désactivées par défaut
  duaEnabled: false, // Dua désactivé par défaut
  prayerSettings: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

// Configuration actuelle
let currentConfig: AdhanConfig = { ...defaultConfig };

/**
 * Charge la configuration d'adhan depuis le stockage local
 */
export const loadAdhanConfig = (): AdhanConfig => {
  try {
    const savedConfig = localStorage.getItem('adhanConfig');
    if (savedConfig) {
      currentConfig = JSON.parse(savedConfig);
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration adhan:', error);
  }
  return currentConfig;
};

/**
 * Sauvegarde la configuration d'adhan
 */
export const saveAdhanConfig = (config: AdhanConfig): void => {
  try {
    localStorage.setItem('adhanConfig', JSON.stringify(config));
    currentConfig = config;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la configuration adhan:', error);
  }
};

/**
 * Initialise le service adhan
 */
export const initAdhanService = (): void => {
  // Charger la configuration
  loadAdhanConfig();
  
  // Précharger l'audio pour une lecture instantanée
  if (currentConfig.type !== 'none' && currentConfig.type !== 'custom') {
    preloadAdhanAudio(currentConfig);
    if (currentConfig.duaEnabled) {
      preloadDuaAudio(currentConfig);
    }
  } else if (currentConfig.type === 'custom' && currentConfig.customAudioPath) {
    preloadAdhanAudio(currentConfig);
    if (currentConfig.duaEnabled) {
      preloadDuaAudio(currentConfig);
    }
  }
  
  // Écouter l'événement stop-adhan venant du processus principal via preload
  window.addEventListener('stop-adhan', () => {
    console.log('Événement stop-adhan reçu, arrêt de l\'adhan en cours');
    stopAdhan();
    stopDua();
  });
};

/**
 * Précharge les fichiers audio pour l'adhan
 */
export const preloadAdhanAudio = (config: AdhanConfig) => {
  // Vérifier si un verrouillage est actif pour éviter des opérations simultanées
  if (audioLock) {
    console.log('Audio operation in progress, skipping preload');
    return;
  }
  
  audioLock = true;
  
  try {
    // Nettoyage des précédentes instances
    if (adhanAudio) {
      adhanAudio.pause();
      adhanAudio.src = '';
      adhanAudio.load();
      adhanAudio = null;
    }

    if (config.type === 'none') {
      audioLock = false;
      return;
    }

    adhanAudio = new Audio();
    adhanAudio.volume = config.volume / 100;

    // Sélection du fichier audio en fonction du type d'adhan
    let audioPath = '';
    switch (config.type) {
      case 'makkah':
        audioPath = 'audio/Ali Ibn Ahmed Mala.mp3';
        break;
      case 'madinah':
        audioPath = 'audio/Ibrahim Jabar.mp3';
        break;
      case 'mishary':
        audioPath = 'audio/Mishary Rashid Alafasy.mp3';
        break;
      case 'nasser':
        audioPath = 'audio/Nasser Al Qatami.mp3';
        break;
      case 'adame':
        audioPath = 'audio/Adame Abou Sakhra.mp3';
        break;
      case 'haj':
        audioPath = 'audio/Haj Soulaimane Moukhtar.mp3';
        break;
      case 'custom':
        if (config.customAudioPath) {
          audioPath = config.customAudioPath;
        }
        break;
      default:
        audioPath = 'audio/Mishary Rashid Alafasy.mp3';
    }

    // Si un chemin audio est défini, on précharge le fichier
    if (audioPath) {
      console.log(`Préchargement du fichier audio: ${audioPath}`);
      adhanAudio.src = audioPath;
      adhanAudio.load();
    }
  } finally {
    audioLock = false;
  }
};

/**
 * Précharge le fichier audio pour le dua
 */
export const preloadDuaAudio = (config: AdhanConfig) => {
  // Vérifier si un verrouillage est actif pour éviter des opérations simultanées
  if (audioLock) {
    console.log('Audio operation in progress, skipping dua preload');
    return;
  }
  
  try {
    // Nettoyage des précédentes instances
    if (duaAudio) {
      duaAudio.pause();
      duaAudio.src = '';
      duaAudio.load();
      duaAudio = null;
    }

    if (!config.duaEnabled) {
      return;
    }

    duaAudio = new Audio();
    duaAudio.volume = config.volume / 100;
    duaAudio.src = 'audio/Dua.mp3';
    duaAudio.load();
    console.log('Préchargement du fichier dua terminé');
  } catch (error) {
    console.error('Erreur lors du préchargement du dua:', error);
  }
};

/**
 * Joue l'adhan
 */
export const playAdhan = (): void => {
  if (!currentConfig.enabled) return;
  
  console.log('Tentative de lecture de l\'adhan...');
  
  // Vérifier si l'audio est déjà en cours de lecture ou si un verrouillage est actif
  if (isAdhanPlaying || audioLock) {
    console.log('Adhan already playing or audio operation in progress, ignoring play request');
    return;
  }
  
  audioLock = true;
  
  try {
    if (!adhanAudio) {
      console.log('Aucun fichier audio préchargé, préchargement...');
      preloadAdhanAudio(currentConfig);
    }
    
    if (adhanAudio) {
      console.log('Lecture de l\'adhan...');
      adhanAudio.play().then(() => {
        console.log('Lecture de l\'adhan démarrée');
        isAdhanPlaying = true;
        isAdhanPaused = false;
        
        // Ajouter un événement pour jouer le dua après l'adhan
        if (currentConfig.duaEnabled) {
          adhanAudio?.addEventListener('ended', playDua);
        }
      }).catch(error => {
        console.error('Erreur lors de la lecture de l\'adhan:', error);
        isAdhanPlaying = false;
      });
    } else {
      console.warn('Aucun fichier audio disponible pour l\'adhan');
    }
  } catch (error) {
    console.error('Erreur lors de la lecture de l\'adhan:', error);
  } finally {
    audioLock = false;
  }
};

/**
 * Joue le dua après l'adhan
 */
export const playDua = (): void => {
  if (!currentConfig.duaEnabled) return;
  
  console.log('Tentative de lecture du dua après l\'adhan...');
  
  // Supprimer l'écouteur d'événement pour éviter des lectures multiples
  adhanAudio?.removeEventListener('ended', playDua);
  
  try {
    if (!duaAudio) {
      console.log('Aucun fichier dua préchargé, préchargement...');
      preloadDuaAudio(currentConfig);
    }
    
    if (duaAudio) {
      console.log('Lecture du dua...');
      duaAudio.play().then(() => {
        console.log('Lecture du dua démarrée');
      }).catch(error => {
        console.error('Erreur lors de la lecture du dua:', error);
      });
    } else {
      console.warn('Aucun fichier audio disponible pour le dua');
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du dua:', error);
  }
};

/**
 * Arrêter la lecture du dua
 */
export const stopDua = (): void => {
  try {
    if (duaAudio) {
      duaAudio.pause();
      duaAudio.currentTime = 0;
      console.log('Dua arrêté');
    }
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du dua:', error);
  }
};

/**
 * Arrête la lecture de l'adhan
 */
export const stopAdhan = (): void => {
  try {
    if (adhanAudio) {
      // Supprimer l'écouteur pour éviter de jouer le dua
      adhanAudio.removeEventListener('ended', playDua);
      
      adhanAudio.pause();
      adhanAudio.currentTime = 0;
      console.log('Adhan arrêté');
    }
    
    // Arrêter également le dua s'il est en cours de lecture
    stopDua();
    
    isAdhanPlaying = false;
    isAdhanPaused = false;
  } catch (error) {
    console.error('Erreur lors de l\'arrêt de l\'adhan:', error);
  }
};

/**
 * Ajuste le volume de l'adhan
 */
export const setAdhanVolume = (volume: number): void => {
  // S'assurer que le volume est dans une plage valide
  const safeVolume = Math.max(0, Math.min(100, volume));
  
  // Mise à jour de la configuration
  currentConfig.volume = safeVolume;
  saveAdhanConfig(currentConfig);
  
  console.log(`Volume adhan ajusté à: ${safeVolume}%`);
  
  // Appliquer le volume à l'élément audio en cours si disponible
  if (adhanAudio) {
    const newVolume = safeVolume / 100;
    adhanAudio.volume = newVolume;
    console.log(`Volume appliqué à l'audio en cours: ${newVolume}`);
  }
};

/**
 * Définit le type d'adhan à utiliser
 */
export const setAdhanType = (type: AdhanType, customPath?: string): void => {
  console.log(`Changing adhan type to: ${type}`);
  
  // Arrêter l'adhan actuel si en cours de lecture
  if (adhanAudio && isAdhanPlaying) {
    stopAdhan();
  }
  
  // Mettre à jour la configuration
  currentConfig.type = type;
  
  if (type === 'custom' && customPath) {
    currentConfig.customAudioPath = customPath;
  }
  
  // Sauvegarder la configuration
  saveAdhanConfig(currentConfig);
  
  // Réinitialiser le verrou pour s'assurer que le préchargement fonctionne
  audioLock = false;
  
  // Précharger immédiatement le nouveau fichier audio
  if (type !== 'none') {
    console.log(`Préchargement du fichier audio pour: ${type}`);
    preloadAdhanAudio(currentConfig);
  }
  
  console.log(`Adhan type changed to: ${type}`);
};

/**
 * Configure les notifications pour les prières
 */
export const scheduleAdhanNotifications = async (prayerTimes: PrayerTimes) => {
  // On efface tous les calendriers précédents
  cancelAllScheduledAdhans();

  console.log("Planification des notifications d'adhan pour:", prayerTimes);

  // Si les notifications sont désactivées, on ne planifie rien
  if (!currentConfig.notificationsEnabled) {
    console.log("Les notifications sont désactivées, aucune planification ne sera effectuée");
    return;
  }

  // Temps de notification en minutes avant la prière (sauvegardé dans les paramètres)
  const notificationMinutes = currentConfig.notificationTime || 15;
  console.log(`Notifications programmées ${notificationMinutes} minutes avant chaque prière`);

  // Trouver le prochain temps de prière
  const now = new Date();
  
  // Demander l'autorisation pour les notifications si nécessaire
  if ("Notification" in window && Notification.permission !== "granted") {
    try {
      const permission = await Notification.requestPermission();
      console.log(`Permission de notification: ${permission}`);
    } catch (error) {
      console.error("Erreur lors de la demande de permission de notification:", error);
    }
  }
  
  console.log(`Vérification des prières actives:`, currentConfig.prayerSettings);

  // Planifier les notifications pour chaque prière
  for (const prayer of Object.keys(prayerTimes) as PrayerName[]) {
    const prayerTimeStr = prayerTimes[prayer];
    if (!prayerTimeStr || !schedulableAdhanEvents.includes(prayer)) continue;

    // Vérifier si cette prière est activée dans les paramètres
    if (!currentConfig.prayerSettings[prayer]) {
      console.log(`La prière ${prayer} est désactivée dans les paramètres, pas de notification`);
      continue;
    }

    // Formater l'heure
    const [hours, minutes] = prayerTimeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      console.error(`Format d'heure invalide pour ${prayer}: ${prayerTimeStr}`);
      continue;
    }

    // Créer la date pour aujourd'hui
    const prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);

    // Créer la date de notification (X minutes avant la prière)
    const notificationDate = new Date(prayerDate.getTime() - (notificationMinutes * 60 * 1000));
    
    // Si l'heure de notification est déjà passée, on passe
    if (notificationDate <= now) {
      console.log(`L'heure de notification pour ${prayer} est déjà passée pour aujourd'hui`);
      continue;
    }

    // Calculer le délai pour la notification
    const notificationDelay = notificationDate.getTime() - now.getTime();
    console.log(`Planification de la notification pour ${prayer} dans ${Math.round(notificationDelay / 1000 / 60)} minutes (${notificationMinutes} minutes avant la prière)`);

    // Planifier la notification
    const notificationTimerId = setTimeout(() => {
      console.log(`Déclenchement de la notification pour ${prayer}`);
      showAdhanNotification(prayer);
    }, notificationDelay);
    
    // Stocker l'ID du timer pour pouvoir l'annuler plus tard
    scheduledAdhanTimers.push(notificationTimerId);

    // Planifier également l'adhan pour l'heure exacte de la prière
    const prayerDelay = prayerDate.getTime() - now.getTime();
    console.log(`Planification de l'adhan pour ${prayer} dans ${Math.round(prayerDelay / 1000 / 60)} minutes`);
    
    // Planifier l'adhan à l'heure exacte
    const adhanTimerId = setTimeout(() => {
      console.log(`Déclenchement de l'adhan pour ${prayer}`);
      playAdhan();
    }, prayerDelay);
    
    // Stocker l'ID du timer pour pouvoir l'annuler plus tard
    scheduledAdhanTimers.push(adhanTimerId);
  }
};

/**
 * Active ou désactive les notifications
 */
export const setNotificationsEnabled = (enabled: boolean): void => {
  currentConfig.notificationsEnabled = enabled;
  saveAdhanConfig(currentConfig);
  console.log(`Notifications ${enabled ? 'activées' : 'désactivées'}`);
  
  // Si on active les notifications, on programme les prochaines
  if (enabled) {
    // Cette fonction devrait être appelée avec les temps de prière actuels
    // mais pour l'instant, on ne fait rien car les données ne sont pas disponibles ici
    console.log('Les notifications seront planifiées au prochain chargement des horaires de prière');
  } else {
    // Si on désactive les notifications, on annule les notifications planifiées
    cancelAllScheduledAdhans();
  }
};

/**
 * Affiche une notification système pour l'adhan
 */
const showAdhanNotification = (prayerName: string, isTest: boolean = false): void => {
  // Si les notifications sont désactivées et ce n'est pas un test, on ne fait rien
  if (!currentConfig.notificationsEnabled && !isTest) {
    console.log('Notifications désactivées, notification ignorée');
    return;
  }

  // Convertir le nom de la prière au format présentable
  const prayerDisplay = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
  
  // Notifier via Electron (plus fiable que les notifications web)
  try {
    // Utilisation de l'API exposée par preload au lieu de require
    const notificationOptions = {
      title: `Rappel: Prière ${prayerDisplay}`,
      body: `La prière ${prayerDisplay} sera dans ${currentConfig.notificationTime} minutes.`,
    };
    
    window.electronAPI.send('show-notification', notificationOptions);
    console.log(`Notification envoyée pour ${prayerDisplay}`);
    
    // Jouer l'adhan uniquement en mode test
    if (isTest) {
      console.log("Mode test: lecture de l'adhan après 2 secondes");
      setTimeout(() => playAdhan(), 2000);
    }
  } catch (error) {
    console.error('Erreur lors de l\'affichage de la notification:', error);
    
    // Fallback pour les notifications web
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Rappel: Prière ${prayerDisplay}`, {
          body: `La prière sera dans ${currentConfig.notificationTime} minutes.`,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }
};

/**
 * Définit le temps de notification avant la prière
 */
export const setNotificationTime = (minutes: number): void => {
  currentConfig.notificationTime = Math.max(1, Math.min(60, minutes));
  saveAdhanConfig(currentConfig);
  console.log(`Temps de notification défini à ${currentConfig.notificationTime} minutes`);
};

// Tester l'adhan
export const testAdhan = (): void => {
  console.log("Test de l'adhan et des notifications...");
  showAdhanNotification('test', true);
};

/**
 * Annule tous les adhans planifiés
 */
export const cancelAllScheduledAdhans = (): void => {
  console.log('Annulation de tous les adhans planifiés');
  
  // Annuler tous les timers stockés
  scheduledAdhanTimers.forEach(timerId => {
    clearTimeout(timerId);
  });
  
  // Réinitialiser le tableau
  scheduledAdhanTimers = [];
};

/**
 * Test de la notification et de l'adhan en simulant un événement planifié
 * Cette fonction permet de simuler l'envoi d'une notification
 * comme si le temps configuré avant la prière était déjà écoulé
 */
export const testNotificationFunction = (prayerName: PrayerName = 'Fajr'): void => {
  console.log(`=== TEST: Simulation de notification pour ${prayerName} ===`);
  
  // Afficher les paramètres actuels pour aider au débogage
  console.log(`Configuration actuelle de l'adhan:`, currentConfig);
  
  // 1. Simuler d'abord la notification qui se produit X minutes avant la prière
  console.log(`TEST: Envoi de la notification ${currentConfig.notificationTime} minutes avant ${prayerName}`);
  showAdhanNotification(prayerName);
  
  // 2. Simuler l'adhan qui se produirait à l'heure exacte de la prière après un court délai
  // On utilise un délai court pour la démo, mais dans le système réel ce serait après currentConfig.notificationTime minutes
  console.log(`TEST: Dans un système réel, l'adhan serait joué ${currentConfig.notificationTime} minutes après cette notification`);
  console.log(`TEST: (Pour la démo, nous le jouerons après 5 secondes)`);
  
  // Jouer l'adhan seulement si activé pour cette prière
  if (currentConfig.prayerSettings[prayerName]) {
    setTimeout(() => {
      console.log(`TEST: Déclenchement de l'adhan pour ${prayerName}`);
      playAdhan();
    }, 5000); // 5 secondes pour la démonstration
  } else {
    console.log(`TEST: L'adhan ne sera pas joué car ${prayerName} est désactivé dans les paramètres`);
  }
  
  console.log(`=== FIN DU TEST ===`);
};

/**
 * Active ou désactive une prière spécifique dans les paramètres
 */
export const setPrayerEnabled = (prayer: PrayerName, enabled: boolean): void => {
  if (!currentConfig.prayerSettings[prayer] === enabled) {
    // Si l'état est déjà celui demandé, ne rien faire
    return;
  }
  
  // Mettre à jour la configuration
  currentConfig.prayerSettings[prayer] = enabled;
  
  // Sauvegarder la configuration
  saveAdhanConfig(currentConfig);
  
  console.log(`La prière ${prayer} a été ${enabled ? 'activée' : 'désactivée'}`);
  
  // Si les notifications sont activées, reprogrammer les notifications
  if (currentConfig.notificationsEnabled) {
    console.log(`Les notifications seront mises à jour au prochain chargement des horaires`);
  }
};

/**
 * Active ou désactive le dua après l'adhan
 */
export const setDuaEnabled = (enabled: boolean): void => {
  try {
    // Mettre à jour la configuration
    const config = loadAdhanConfig();
    config.duaEnabled = enabled;
    
    // Précharger ou vider le dua selon l'état
    if (enabled) {
      preloadDuaAudio(config);
    } else if (duaAudio) {
      duaAudio.pause();
      duaAudio.src = '';
      duaAudio.load();
      duaAudio = null;
    }
    
    // Sauvegarder la configuration
    saveAdhanConfig(config);
    console.log(`Dua après adhan ${enabled ? 'activé' : 'désactivé'}`);
  } catch (error) {
    console.error('Erreur lors de la configuration du dua:', error);
  }
};

/**
 * Met en pause l'adhan
 */
export const pauseAdhan = (): void => {
  if (!adhanAudio || !isAdhanPlaying || isAdhanPaused) return;
  
  try {
    adhanAudio.pause();
    isAdhanPaused = true;
    console.log('Adhan mis en pause');
  } catch (error) {
    console.error('Erreur lors de la mise en pause de l\'adhan:', error);
  }
};

/**
 * Reprend la lecture de l'adhan
 */
export const resumeAdhan = (): void => {
  if (!adhanAudio || !isAdhanPlaying || !isAdhanPaused) return;
  
  try {
    adhanAudio.play();
    isAdhanPaused = false;
    console.log('Reprise de la lecture de l\'adhan');
  } catch (error) {
    console.error('Erreur lors de la reprise de l\'adhan:', error);
  }
};
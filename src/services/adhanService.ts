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

// Garder les états de suivi
let isAdhanPlaying = false;
let audioLock = false;
let currentAdhanInstance: HTMLAudioElement | null = null; // Pour pouvoir arrêter l'instance en cours
let currentDuaInstance: HTMLAudioElement | null = null;

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

// Ajouter une fonction de log préfixée
const log = (message: string, ...args: any[]) => {
  console.log(`[AdhanService] ${message}`, ...args);
};

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
  log("Initialisation...");
  // Charger la configuration
  loadAdhanConfig();
  log("Configuration chargée:", JSON.stringify(currentConfig, null, 2));
  
  // Précharger l'audio
  if (currentConfig.type !== 'none' && currentConfig.type !== 'custom') {
    log("Préchargement Adhan standard et potentiellement Dua...");
    preloadAdhanAudio(currentConfig);
    if (currentConfig.duaEnabled) {
      preloadDuaAudio(currentConfig);
    }
  } else if (currentConfig.type === 'custom' && currentConfig.customAudioPath) {
    log("Préchargement Adhan custom et potentiellement Dua...");
    preloadAdhanAudio(currentConfig);
    if (currentConfig.duaEnabled) {
      preloadDuaAudio(currentConfig);
    }
  }
  
  // Écouter l'événement stop-adhan venant du processus principal via preload
  window.addEventListener('stop-adhan', () => {
    log('Événement stop-adhan reçu (via window event), arrêt de l\'adhan/dua en cours');
    stopAdhan();
    stopDua();
  });

  // AJOUT: Écouter l'événement de clic sur la notification depuis le processus principal
  if (window.electronAPI && typeof window.electronAPI.on === 'function') {
    window.electronAPI.on('notification-clicked-stop-adhan', () => {
      log('[IPC] Notification click reçu, arrêt Adhan.');
      stopAdhan();
    });
    log('Écouteur IPC pour notification-clicked-stop-adhan configuré.');
  } else {
    log('Erreur: window.electronAPI.on n\'est pas disponible pour configurer l\'écouteur IPC.');
  }
};

/**
 * Précharge les fichiers audio pour l'adhan
 */
export const preloadAdhanAudio = (config: AdhanConfig) => {
  if (audioLock) {
    log('Verrou audio actif, préchargement Adhan ignoré.');
    return;
  }
  audioLock = true;
  log(`Préchargement Adhan pour type: ${config.type}, volume: ${config.volume}`);
  
  try {
    // Nettoyage des précédentes instances
    if (currentAdhanInstance) {
      currentAdhanInstance.pause();
      currentAdhanInstance.src = '';
      currentAdhanInstance.load();
      currentAdhanInstance = null;
    }

    if (config.type === 'none') {
      audioLock = false;
      return;
    }

    currentAdhanInstance = new Audio();
    currentAdhanInstance.volume = config.volume / 100;

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
      log(`Chemin audio Adhan: ${audioPath}`);
      currentAdhanInstance.src = audioPath;
      currentAdhanInstance.load();
      log('Préchargement Adhan initié.');
    } else {
      log('Aucun chemin audio Adhan à précharger.');
    }

    if (!audioPath) {
      log(`Aucun chemin audio trouvé pour le type d'adhan sélectionné.`);
      isAdhanPlaying = false;
      audioLock = false;
      return;
    }

    log(`Création nouvelle instance Audio pour Adhan: ${audioPath}`);
    const localAdhanAudio = new Audio(audioPath);
    currentAdhanInstance = localAdhanAudio; // Garder une référence pour stopAdhan
    localAdhanAudio.volume = config.volume / 100;

    log(`Préchargement Adhan initié pour: ${localAdhanAudio.src}, Volume: ${localAdhanAudio.volume * 100}%`);
    localAdhanAudio.load(); // Just load, don't play

    // Remove the play() call and associated handlers from preload
    /*
    localAdhanAudio.play().catch(e => { 
      log('Erreur lecture Adhan lors du préchargement: ', e);
      // Ne pas modifier les états ici, car on ne joue pas réellement
      // isAdhanPlaying = false; 
      // audioLock = false; 
      // currentAdhanInstance = null; 
    });

    localAdhanAudio.onended = () => {
      log('Fin lecture Adhan (instance locale de préchargement) - NE DEVRAIT PAS ARRIVER.');
      // isAdhanPlaying = false; // Ne pas toucher
      // currentAdhanInstance = null; // Ne pas toucher
      // if (currentConfig.duaEnabled) {
      //   log('Dua activé, tentative de lecture Dua depuis préchargement - ERREUR.');
      //   // playDua(); // Ne pas appeler playDua ici
      // } else {
      //   // audioLock = false; // Ne pas toucher
      // }
    };

    localAdhanAudio.onerror = (e) => {
      log('Erreur pendant la lecture Adhan (instance locale de préchargement): ', e);
      // isAdhanPlaying = false; // Ne pas toucher
      // audioLock = false; // Ne pas toucher
      // currentAdhanInstance = null; // Ne pas toucher
    };
    */
    
  } finally {
    audioLock = false;
  }
};

/**
 * Précharge le fichier audio pour le dua
 */
export const preloadDuaAudio = (config: AdhanConfig) => {
  if (audioLock) {
    log('Verrou audio actif, préchargement Dua ignoré.');
    return;
  }
  
  try {
    // Nettoyage des précédentes instances
    if (currentDuaInstance) {
      currentDuaInstance.pause();
      currentDuaInstance.src = '';
      currentDuaInstance.load();
      currentDuaInstance = null;
    }

    if (!config.duaEnabled) {
      log('Dua désactivé, préchargement Dua ignoré.');
      return;
    }

    currentDuaInstance = new Audio();
    currentDuaInstance.volume = config.volume / 100;
    currentDuaInstance.src = 'audio/Dua.mp3';
    currentDuaInstance.load();
    log('Préchargement Dua initié.');
  } catch (error) {
    console.error('Erreur lors du préchargement du dua:', error);
  }
};

/**
 * Joue l'adhan en créant une nouvelle instance audio
 */
export const playAdhan = (): void => {
  log('playAdhan appelé.');
  if (!currentConfig.enabled) {
    log('Adhan désactivé globalement, lecture ignorée.');
    return;
  }
  
  log(`Vérification des verrous: isAdhanPlaying=${isAdhanPlaying}, audioLock=${audioLock}`);
  if (isAdhanPlaying || audioLock) {
    log('Adhan déjà en cours ou verrou actif, lecture ignorée.');
    return;
  }
  
  audioLock = true; // Verrouiller pendant la tentative de lecture
  isAdhanPlaying = true; // Marquer comme jouant

  try {
    // Sélection du fichier audio
    let audioPath = '';
    switch (currentConfig.type) {
      case 'makkah': audioPath = 'audio/Ali Ibn Ahmed Mala.mp3'; break;
      case 'madinah': audioPath = 'audio/Ibrahim Jabar.mp3'; break;
      case 'mishary': audioPath = 'audio/Mishary Rashid Alafasy.mp3'; break;
      case 'nasser': audioPath = 'audio/Nasser Al Qatami.mp3'; break;
      case 'adame': audioPath = 'audio/Adame Abou Sakhra.mp3'; break;
      case 'haj': audioPath = 'audio/Haj Soulaimane Moukhtar.mp3'; break;
      case 'custom': audioPath = currentConfig.customAudioPath || ''; break;
      default: audioPath = 'audio/Mishary Rashid Alafasy.mp3';
    }

    if (!audioPath) {
      log(`Aucun chemin audio trouvé pour le type d'adhan sélectionné.`);
      isAdhanPlaying = false;
      audioLock = false;
      return;
    }

    log(`Création nouvelle instance Audio pour Adhan: ${audioPath}`);
    const localAdhanAudio = new Audio(audioPath);
    currentAdhanInstance = localAdhanAudio; // Garder une référence pour stopAdhan
    localAdhanAudio.volume = currentConfig.volume / 100;

    log(`Lecture Adhan: ${localAdhanAudio.src}, Volume: ${localAdhanAudio.volume * 100}%`);
    
    localAdhanAudio.play().catch(e => {
      log('Erreur lecture Adhan: ', e);
        isAdhanPlaying = false;
      audioLock = false;
      currentAdhanInstance = null;
    });

    localAdhanAudio.onended = () => {
      log('Fin lecture Adhan (instance locale).');
      isAdhanPlaying = false;
      currentAdhanInstance = null;

      // ---> LOG AJOUTÉ <---
      log(`[onended Adhan] Vérification pour Dua: currentConfig.duaEnabled = ${currentConfig.duaEnabled}`);

      // Le verrou sera libéré par playDua ou ici si pas de Dua
      if (currentConfig.duaEnabled) {
        log('[onended Adhan] Dua activé, appel de playDua().'); // ---> LOG AJOUTÉ <---
        playDua(); 
    } else {
        log('[onended Adhan] Dua désactivé, libération du verrou audio.'); // ---> LOG AJOUTÉ <---
        audioLock = false; 
      }
    };

    localAdhanAudio.onerror = (e) => {
      log('Erreur pendant la lecture Adhan (instance locale): ', e);
      isAdhanPlaying = false;
      audioLock = false;
      currentAdhanInstance = null;
    };
    
  } catch (error) {
      log('Erreur inattendue dans playAdhan: ', error);
      isAdhanPlaying = false;
    audioLock = false;
      currentAdhanInstance = null;
  }
};

/**
 * Joue le dua après l'adhan en créant une nouvelle instance audio
 */
export const playDua = (): void => {
  log('playDua appelé.');

  // ---> LOG AJOUTÉ <---
  log(`[playDua début] Vérification: currentConfig.duaEnabled = ${currentConfig.duaEnabled}`);

  // Note: playDua est appelé APRES que playAdhan ait marqué isAdhanPlaying = false
  // mais AVANT que audioLock ne soit libéré si Dua est activé.

  if (!currentConfig.duaEnabled) {
      log('[playDua début] Dua désactivé dans la config, arrêt et libération verrou.'); // ---> LOG AJOUTÉ <---
      audioLock = false; // Libérer le verrou car playAdhan attendait
      return;
  }
  
  // On ne vérifie pas audioLock ici car playAdhan le détient
  // mais on le libèrera à la fin du Dua

  try {
    const duaPath = 'audio/Dua.mp3';
    log(`Création nouvelle instance Audio pour Dua: ${duaPath}`);
    const localDuaAudio = new Audio(duaPath);
    currentDuaInstance = localDuaAudio; // Garder référence
    localDuaAudio.volume = currentConfig.volume / 100;

    log(`Lecture Dua: ${localDuaAudio.src}, Volume: ${localDuaAudio.volume * 100}%`);
    localDuaAudio.play().catch(e => {
        log('Erreur lecture Dua:', e);
        log('Erreur lecture Dua, libération du verrou audio.');
        audioLock = false; // Libérer le verrou ici en cas d'erreur
        currentDuaInstance = null;
    });
    
    localDuaAudio.onended = () => {
      log('Fin lecture Dua (instance locale).');
      log('Fin Dua, libération du verrou audio.');
      audioLock = false; // Libérer le verrou après le Dua
      currentDuaInstance = null;
    };
    localDuaAudio.onerror = (e) => {
      log('Erreur pendant la lecture Dua (instance locale): ', e);
      log('Erreur Dua, libération du verrou audio.');
      audioLock = false; // Libérer le verrou en cas d'erreur
      currentDuaInstance = null;
    };
    
  } catch(error) {
      log('Erreur inattendue dans playDua: ', error);
      log('Erreur inattendue Dua, libération du verrou audio.');
      audioLock = false;
      currentDuaInstance = null;
  }
};

/**
 * Arrêter la lecture du dua
 */
export const stopDua = (): void => {
  log('stopDua appelé.');
  try {
    if (currentDuaInstance) {
      log('Arrêt de l\'instance Dua en cours...');
      currentDuaInstance.pause();
      currentDuaInstance.currentTime = 0;
      currentDuaInstance = null; // Retirer la référence
    }
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du dua:', error);
  }
  // S'assurer que le verrou est libéré si on arrête le dua manuellement
  // et que l'adhan n'est pas en train de jouer (ce qui aurait appelé playDua)
  if (!isAdhanPlaying) {
      log('Libération du verrou après arrêt manuel du Dua (car Adhan non actif).');
      audioLock = false;
  }
};

/**
 * Arrête la lecture de l'adhan
 */
export const stopAdhan = (): void => {
  log('stopAdhan appelé.');
  try {
    if (currentAdhanInstance) {
      log('Arrêt de l\'instance Adhan en cours...');
      currentAdhanInstance.pause();
      currentAdhanInstance.currentTime = 0;
      currentAdhanInstance = null; // Retirer la référence
    }
    // Arrêter également le dua au cas où il aurait été lancé
    stopDua();
    
    isAdhanPlaying = false;
    // Libérer le verrou immédiatement car on arrête tout
    log('Libération du verrou après arrêt manuel Adhan/Dua.');
    audioLock = false;
  } catch (error) {
    console.error('Erreur lors de l\'arrêt de l\'adhan:', error);
    // Essayer de libérer le verrou même en cas d'erreur
    audioLock = false;
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
  if (currentAdhanInstance) {
    const newVolume = safeVolume / 100;
    currentAdhanInstance.volume = newVolume;
    console.log(`Volume appliqué à l'audio en cours: ${newVolume}`);
  }
};

/**
 * Définit le type d'adhan à utiliser
 */
export const setAdhanType = (type: AdhanType, customPath?: string): void => {
  console.log(`Changing adhan type to: ${type}`);
  
  // Arrêter l'adhan actuel si en cours de lecture
  if (currentAdhanInstance && isAdhanPlaying) {
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
  log("Planification des Adhans/Notifications...");
  cancelAllScheduledAdhans(); // Annuler les anciens timers

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const prayerName of schedulableAdhanEvents) {
    const prayerTimeStr = prayerTimes[prayerName];
    if (!prayerTimeStr) continue;

    const prayerDateTime = new Date(`${todayStr}T${prayerTimeStr}:00`);
    
    // Si l'heure est déjà passée aujourd'hui, planifier pour demain
    if (prayerDateTime <= now) {
      prayerDateTime.setDate(prayerDateTime.getDate() + 1);
    }

    const timeUntilPrayer = prayerDateTime.getTime() - now.getTime();
    log(`Prière: ${prayerName}, Heure planifiée: ${prayerDateTime.toLocaleString()}, Délai: ${timeUntilPrayer}ms`);

    if (timeUntilPrayer > 0) {
      // 1. Planifier la notification de rappel (si activée)
      const reminderOffset = (currentConfig.notificationTime || 15) * 60 * 1000;
      const timeUntilReminder = timeUntilPrayer - reminderOffset;
      
      if (currentConfig.notificationsEnabled && timeUntilReminder > 0) {
        log(` -> Planification du rappel pour ${prayerName} dans ${timeUntilReminder}ms`);
        const reminderTimer = setTimeout(() => {
          log(`** Déclenchement du RAPPEL pour ${prayerName} **`);
          showAdhanNotification(prayerName, true);
        }, timeUntilReminder);
        scheduledAdhanTimers.push(reminderTimer);
      } else {
        log(` -> Rappel pour ${prayerName} non planifié (Notifications: ${currentConfig.notificationsEnabled}, Délai: ${timeUntilReminder}ms)`);
      }

      // 2. Planifier l'Adhan sonore et/ou la notification à l'heure exacte (si activé pour cette prière)
      if (currentConfig.enabled && currentConfig.prayerSettings[prayerName]) {
        log(` -> Planification de l'ACTION (Adhan/Notif) pour ${prayerName} dans ${timeUntilPrayer}ms`);
        const prayerTimer = setTimeout(() => {
          log(`** Déclenchement de l'ACTION pour ${prayerName} **`);
          
          // LOG AJOUTÉ: Vérifier la valeur de currentConfig.type au moment du déclenchement
          log(` -> Vérification du type d'Adhan au déclenchement: currentConfig.type = "${currentConfig.type}"`);
          
          // Jouer l'Adhan sonore si le type n'est pas 'none'
          if (currentConfig.type !== 'none') { 
            log(` -> Appel de playAdhan pour ${prayerName}`);
            playAdhan();
          } else {
            log(` -> Adhan sonore ignoré car type est 'none'.`);
          }
          
          // Afficher la notification même si l'adhan est 'none' si les notifs sont activées
          if (currentConfig.notificationsEnabled) { 
            log(` -> Appel de showAdhanNotification (heure exacte) pour ${prayerName}`);
            showAdhanNotification(prayerName, false); // Notification pour l'heure exacte
          } else {
            log(` -> Notification (heure exacte) ignorée car notificationsEnabled est faux.`);
          }
        }, timeUntilPrayer);
        scheduledAdhanTimers.push(prayerTimer);
      } else {
        log(` -> Action pour ${prayerName} non planifiée (Adhan global: ${currentConfig.enabled}, ${prayerName} activé: ${currentConfig.prayerSettings[prayerName]})`);
      }
    }
  }
  log("Fin de la planification.");
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
const showAdhanNotification = (prayerName: string, isReminder: boolean = false): void => {
  log(`showAdhanNotification appelée pour ${prayerName}, isReminder: ${isReminder}`);
  // Toujours vérifier si les notifications sont activées globalement juste avant d'envoyer
  if (!currentConfig.notificationsEnabled) { 
      log('Notifications désactivées globalement, notification ignorée.');
    return;
  }

  const title = isReminder ? `Rappel: ${prayerName} dans ${currentConfig.notificationTime} min` : `C'est l'heure de ${prayerName}`;
  const body = isReminder
    ? `Préparez-vous pour la prière de ${prayerName}.`
    : `Il est temps pour la prière de ${prayerName}.`;

  log(`Envoi de la notification: Title="${title}", Body="${body}"`);
  try {
    window.electronAPI.send('show-notification', { title, body });
    log('Notification envoyée via electronAPI.');
  } catch (error) {
    log('Erreur lors de l\'envoi de la notification via electronAPI:', error);
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
  showAdhanNotification(prayerName, true);

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
    } else if (currentDuaInstance) {
      currentDuaInstance.pause();
      currentDuaInstance.src = '';
      currentDuaInstance.load();
      currentDuaInstance = null;
    }
    
    // Sauvegarder la configuration
    saveAdhanConfig(config);
    console.log(`Dua après adhan ${enabled ? 'activé' : 'désactivé'}`);
  } catch (error) {
    console.error('Erreur lors de la configuration du dua:', error);
  }
};

// Les fonctions pauseAdhan/resumeAdhan deviennent complexes avec des instances locales
// Il est plus simple de juste les supprimer ou de les laisser vides pour l'instant.
export const pauseAdhan = (): void => {
  log('pauseAdhan non supporté avec la nouvelle logique d\'instance.');
};
export const resumeAdhan = (): void => {
  log('resumeAdhan non supporté avec la nouvelle logique d\'instance.');
};
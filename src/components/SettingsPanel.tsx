import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZap, FiMoon, FiSun, FiMapPin, FiRefreshCw, FiEdit2, FiPause, FiPlay, FiBell, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import clsx from 'clsx';
import {
  playAdhan,
  pauseAdhan,
  resumeAdhan,
  stopAdhan,
  setAdhanVolume,
  setAdhanType,
  AdhanType,
  loadAdhanConfig,
  testNotificationFunction,
  setNotificationsEnabled,
  setPrayerEnabled,
  setDuaEnabled
} from "../services/adhanService";
import {
  saveLocation,
  saveCalculationMethod,
  getCachedLocation,
  getCachedCalculationMethod,
  getPrayerTimes,
  saveAdjustments,
  getAdjustments,
  getCurrentPosition
} from "../services/prayerService";
import {
  PerformanceLevel,
  usePerformanceLevel
} from "../services/performanceService";
import { getCurrentLocationWithPermissions, LocationSuggestion } from '../services/locationService';
import PermissionGuide from './PermissionGuide';
import LocationSearchInput from './LocationSearchInput';
import UpdateNotification from './UpdateNotification';

// Constantes par défaut
const DEFAULT_CITY = 'Paris';
const DEFAULT_USERNAME = 'Utilisateur';

const prayerCalculationMethods = [
  { id: 0, name: 'Shia Ithna-Ashari' },
  { id: 1, name: 'University of Islamic Sciences, Karachi' },
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 3, name: 'Muslim World League' },
  { id: 4, name: 'Umm al-Qura University, Makkah' },
  { id: 5, name: 'Egyptian General Authority of Survey' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran' },
  { id: 8, name: 'Gulf Region' },
  { id: 9, name: 'Kuwait' },
  { id: 10, name: 'Qatar' },
  { id: 11, name: 'Majlis Ugama Islam Singapore, Singapore' },
  { id: 12, name: 'Union Organization Islamic de France' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey' },
  { id: 14, name: 'Spiritual Administration of Muslims of Russia' },
];

const adhanTypes = [
  {
    id: 'mishary',
    name: 'Mishary Rashid Alafasy',
    location: 'Koweït',
    description: 'Récitation mélodieuse et apaisante, très populaire dans le monde entier',
    fileName: 'Mishary Rashid Alafasy.mp3'
  },
  {
    id: 'makkah',
    name: 'Ali Ibn Ahmed Mala',
    location: 'Makkah, Arabie Saoudite',
    description: 'Voix officielle de la Mosquée Sacrée de la Mecque',
    fileName: 'Ali Ibn Ahmed Mala.mp3'
  },
  {
    id: 'madinah',
    name: 'Ibrahim Jabar',
    location: 'Madinah, Arabie Saoudite',
    description: 'Récitation traditionnelle de la Mosquée du Prophète',
    fileName: 'Ibrahim Jabar.mp3'
  },
  {
    id: 'nasser',
    name: 'Nasser Al Qatami',
    location: 'Riyadh, Arabie Saoudite',
    description: 'Style contemporain avec une voix puissante et claire',
    fileName: 'Nasser Al Qatami.mp3'
  },
  {
    id: 'adame',
    name: 'Adame Abou Sakhra',
    location: 'Maroc',
    description: 'Style traditionnel maghrébin, doux et mélodieux',
    fileName: 'Adame Abou Sakhra.mp3'
  },
  {
    id: 'haj',
    name: 'Haj Soulaimane Moukhtar',
    location: 'Algérie',
    description: 'Adhan traditionnel algérien avec une voix harmonieuse',
    fileName: 'Haj Soulaimane Moukhtar.mp3'
  },
  {
    id: 'none',
    name: 'Aucun adhan',
    location: 'Silencieux',
    description: 'Désactiver l\'adhan sonore et recevoir uniquement des notifications',
    fileName: ''
  },
];

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState('prayers');
  const [calculationMethod, setCalculationMethod] = useState<number>(getCachedCalculationMethod());
  const [volume, setVolume] = useState(70);
  const [notificationTime, setNotificationTime] = useState(15);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState('fr');
  const [startupLaunch, setStartupLaunch] = useState(false);
  // Nouvelles options pour la barre de menu
  const [showSeconds, setShowSeconds] = useState(() => {
    return localStorage.getItem('menu_show_seconds') !== 'false'; // true par défaut
  });
  const [showMenuIcon, setShowMenuIcon] = useState(() => {
    return localStorage.getItem('menu_show_icon') !== 'false'; // true par défaut
  });
  // Option pour le Dua après l'adhan
  const [duaEnabled, setDuaEnabledState] = useState(() => {
    return loadAdhanConfig().duaEnabled;
  });

  // Information utilisateur
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('user_name') || DEFAULT_USERNAME;
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Localisation
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [_updateSuccess, setUpdateSuccess] = useState(false);
  const [isPermissionGuideOpen, setIsPermissionGuideOpen] = useState(false);

  // Initialiser les ajustements à partir du stockage local
  const [adjustments, setAdjustments] = useState(() => {
    return getAdjustments();
  });
  
  // Initialiser la configuration d'adhan depuis le service
  const [adhanConfig, setAdhanConfig] = useState(() => {
    return loadAdhanConfig();
  });
  
  // Initialiser le volume et le récitateur sélectionné à partir de la configuration
  const [selectedReciter, setSelectedReciter] = useState<AdhanType>(() => {
    return (adhanConfig.type || 'mishary') as AdhanType;
  });
  const [isAdhanActionInProgress, setIsAdhanActionInProgress] = useState(false);
  const [isAdhanPaused, setIsAdhanPaused] = useState(false);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [isDuaPlaying, setIsDuaPlaying] = useState(false);
  const [duaAudioRef, setDuaAudioRef] = useState<HTMLAudioElement | null>(null);
  const [performanceLevel, setPerformanceLevel] = usePerformanceLevel();

  // État pour l'activation des notifications (désactivé par défaut si non configuré)
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => {
    return adhanConfig.notificationsEnabled !== undefined ? adhanConfig.notificationsEnabled : false; // Default to false
  });

  // État pour les mises à jour
  const [appVersion, setAppVersion] = useState<string>('');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isUpdateDownloading, setIsUpdateDownloading] = useState(false);
  const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Charger les configurations au montage
  useEffect(() => {
    // Mettre à jour le volume à partir de la configuration d'adhan
    setVolume(adhanConfig.volume);
    
    // Mettre à jour le temps de notification
    setNotificationTime(adhanConfig.notificationTime);
    
    // S'assurer que le récitateur est bien défini
    if (adhanConfig.type && adhanConfig.type !== selectedReciter) {
      setSelectedReciter(adhanConfig.type);
    }
  }, []);

  // Animation variants simplifiées
  const panelVariants = {
    hidden: { opacity: 0, x: "100%" },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: "100%" }
  };

  // Rediriger vers l'onglet "prayers" si l'utilisateur était sur "appearance"
  useEffect(() => {
    if (activeTab === 'appearance') {
      setActiveTab('prayers');
    }
  }, [activeTab]);

  // Fonction pour arrêter tout audio en cours
  const handleStopAdhan = () => {
    stopAdhan();
    setIsAdhanPlaying(false);
    setIsAdhanPaused(false);
  };

  // Fonction pour gérer les changements d'ajustements
  const handleAdjustmentChange = (prayer: keyof typeof adjustments, value: number) => {
    // Limiter les ajustements entre -30 et +30 minutes
    const limitedValue = Math.max(-30, Math.min(30, value));

    const newAdjustments = {
      ...adjustments,
      [prayer]: limitedValue
    };

    setAdjustments(newAdjustments);

    // Sauvegarder les ajustements immédiatement
    saveAdjustments(newAdjustments);
  };

  // Function to handle reciter selection
  const handleReciterSelection = (reciter: string) => {
    // Mettre à jour l'état local
    setSelectedReciter(reciter as AdhanType);

    // Mettre à jour le type d'adhan dans le service
    console.log(`Sélection du récitateur: ${reciter}`);
    
    // Empêcher les actions multiples
    if (isAdhanActionInProgress) return;
    setIsAdhanActionInProgress(true);
    
    // Si un adhan est en cours, l'arrêter
    if (isAdhanPlaying) {
      stopAdhan();
      setIsAdhanPlaying(false);
      setIsAdhanPaused(false);
    }
    
    // Définir le type d'adhan et le sauvegarder immédiatement dans le service
    // Cela préservera la sélection même si on clique sur Annuler
    setAdhanType(reciter as AdhanType);
    
    // Libérer le verrou après un délai
    setTimeout(() => {
      setIsAdhanActionInProgress(false);
    }, 500);
  };

  // Function to test adhan playback
  const handleTestAdhan = () => {
    // Si l'adhan est déjà en train de jouer, on le met en pause ou on le reprend
    if (isAdhanPlaying) {
      if (isAdhanPaused) {
        // Reprendre la lecture
        resumeAdhan();
        setIsAdhanPaused(false);
      } else {
        // Mettre en pause
        pauseAdhan();
        setIsAdhanPaused(true);
      }
      return;
    }
    
    // Empêcher les actions multiples
    if (isAdhanActionInProgress) return;
    setIsAdhanActionInProgress(true);

    // Log de débogage
    console.log(`Test du récitateur: ${selectedReciter}`);

    // S'assurer que le type d'adhan est correctement défini
    setAdhanType(selectedReciter as AdhanType);

    // Définir le volume
    setAdhanVolume(volume);

    // Attendre que les configurations soient appliquées avant de jouer l'adhan
    setTimeout(() => {
      console.log("Lecture du test d'adhan...");
      playAdhan();
      setIsAdhanPlaying(true);
      setIsAdhanPaused(false);
      // Libérer le verrou après l'appel à playAdhan
      setTimeout(() => setIsAdhanActionInProgress(false), 1000);
    }, 500);
  };

  // Charger les valeurs de localisation au montage du composant
  useEffect(() => {
    const loadCachedSettings = () => {
      const cachedLocation = getCachedLocation();
      setCity(cachedLocation.city);
      setCountry(cachedLocation.country);
      setCalculationMethod(getCachedCalculationMethod());
    };

    loadCachedSettings();
  }, []);

  // Gérer la fermeture du panneau de paramètres et revenir aux paramètres précédents
  const handleClose = () => {
    // Arrêter tout audio en cours avant de fermer
    if (isAdhanPlaying) {
      stopAdhan();
      setIsAdhanPlaying(false);
      setIsAdhanPaused(false);
    }
    
    // Revenir aux paramètres précédents chargés depuis le service
    // Note: La sélection du récitateur est déjà sauvegardée immédiatement, donc on ne la réinitialise pas
    
    // Recharger les anciennes valeurs en cas d'annulation, sauf pour le récitateur qui est sauvegardé immédiatement
    const oldConfig = loadAdhanConfig();
    setVolume(oldConfig.volume);
    setNotificationTime(oldConfig.notificationTime);
    
    // Réinitialiser l'état de la localisation
    const cachedLocation = getCachedLocation();
    setCity(cachedLocation.city);
    setCountry(cachedLocation.country);
    
    // Réinitialiser la méthode de calcul
    setCalculationMethod(getCachedCalculationMethod());
    
    // Réinitialiser les ajustements
    setAdjustments(getAdjustments());
    
    // Appeler la fonction onClose fournie par le parent
    onClose();
  };

  const handleSaveSettings = async () => {
    try {
      // Arrêter tout audio en cours avant de sauvegarder et fermer
      if (isAdhanPlaying) {
        stopAdhan();
        setIsAdhanPlaying(false);
        setIsAdhanPaused(false);
      }

      // Sauvegarder la méthode de calcul
      saveCalculationMethod(calculationMethod);

      // Sauvegarder les ajustements
      saveAdjustments(adjustments);

      // Sauvegarder la configuration d'Adhan
      const updatedConfig = {
        ...adhanConfig,
        type: selectedReciter,
        volume: volume,
        notificationTime: notificationTime
      };
      
      // Mettre à jour l'état local
      setAdhanConfig(updatedConfig);
      
      // Sauvegarder la configuration
      setAdhanVolume(volume);
      setNotificationTime(notificationTime);
      // Le récitateur est déjà sauvegardé en temps réel, pas besoin de le faire ici

      // Sauvegarder la localisation
      if (useGeolocation) {
        // Utiliser la géolocalisation pour obtenir les coordonnées
        setIsGeolocating(true);
        setGeolocationError(null);

        try {
          const locationData = await getCurrentLocationWithPermissions();
          
          // Utiliser les données de ville et pays obtenues directement
          const detectedCity = locationData.city;
          const detectedCountry = locationData.country;
          
          // Mettre à jour les champs de formulaire avec les valeurs détectées
          setCity(detectedCity);
          setCountry(detectedCountry);

          // Sauvegarder la localisation détectée
          saveLocation(detectedCity, detectedCountry);

          // Rafraîchir les horaires de prière avec les ajustements
          const today = new Date().toLocaleDateString('fr-FR').split('/').reverse().join('-');
          await getPrayerTimes(detectedCity, today, true, detectedCountry, calculationMethod);

          setUpdateSuccess(true);
          setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (error) {
          console.error('Erreur de géolocalisation:', error);
          setGeolocationError(error instanceof Error ? error.message : 'Erreur inconnue');
        } finally {
          setIsGeolocating(false);
        }
      } else if (city) {
        // Utiliser la ville/pays saisis manuellement
        const safeCity = city || DEFAULT_CITY;
        const safeCountry = country || 'France';

        // Sauvegarder la localisation
        saveLocation(safeCity, safeCountry);

        // Rafraîchir les horaires de prière avec les ajustements
        const today = new Date().toLocaleDateString('fr-FR').split('/').reverse().join('-');
        await getPrayerTimes(city, today, true, country, calculationMethod);

        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
    }
  };

  // Géolocalisation
  const handleDetectLocation = async () => {
    if (isGeolocating) return;
    
    setIsGeolocating(true);
    setGeolocationError(null);
    
    try {
      // Essayer d'obtenir la position
      const position = await getCurrentPosition();
      console.log('Position détectée:', position);
      
      // Si on arrive ici, c'est que la permission a été accordée
      setUseGeolocation(true);
      setGeolocationError(null);
      setUpdateSuccess(true);
      
      // Afficher un message de succès temporaire
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erreur de géolocalisation:', error);
      
      // Si le message d'erreur contient "denied" ou "refusé", c'est un problème de permission
      if (error.message && (
          error.message.includes('denied') || 
          error.message.includes('refusé') || 
          error.message.includes('permission'))) {
        // Ouvrir le guide de permission
        setIsPermissionGuideOpen(true);
      } else {
        // Autre type d'erreur
        setGeolocationError(error.message || 'Erreur inconnue');
      }
      
      setUseGeolocation(false);
    } finally {
      setIsGeolocating(false);
    }
  };
  
  // Demande explicite de permission de géolocalisation via le guide
  const requestLocationPermission = () => {
    try {
      // Vérifier si une demande a déjà été faite récemment
      const lastPermissionRequest = localStorage.getItem('last_permission_request');
      const now = Date.now();
      
      if (lastPermissionRequest && (now - parseInt(lastPermissionRequest)) < 60000) {
        // Si une demande a été faite il y a moins d'une minute, ne pas la répéter
        console.log('Demande déjà effectuée récemment, attente...');
        return;
      }
      
      // Enregistrer le moment de cette demande
      localStorage.setItem('last_permission_request', now.toString());
      
      navigator.geolocation.getCurrentPosition(
        () => {
          console.log('Permission de géolocalisation accordée');
          handleDetectLocation(); // Réessayer la détection
        },
        (error) => {
          console.error('Erreur lors de la demande de permission:', error);
          
          // Si l'utilisateur a refusé, lui proposer d'ouvrir les préférences système
          if (error.code === error.PERMISSION_DENIED && window.electronAPI) {
            // Dans ce cas, on garde le guide ouvert pour les instructions suivantes
            console.log('Ouverture des préférences système via le guide...');
          }
        },
        { timeout: 5000 } // Timeout plus court pour éviter de bloquer trop longtemps
      );
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  };

  // Sauvegarder le nom de l'utilisateur dans localStorage
  useEffect(() => {
    localStorage.setItem('user_name', userName);
  }, [userName]);

  // Démarrer le mode édition de nom
  const startEditingName = () => {
    setIsEditingName(true);
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);
  };

  // Terminer le mode édition de nom
  const finishEditingName = () => {
    setIsEditingName(false);
  };

  // Gérer le changement du nom
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  // Gérer la sauvegarde du nom quand on appuie sur entrée
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      finishEditingName();
    }
  };

  const handleLocationSelect = async (location: LocationSuggestion | null) => {
    if (location) {
      setCity(location.name);
      setCountry(location.country);
      
      // Mettre à jour le succès de mise à jour pour l'animation
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      
      try {
        // Sauvegarder la nouvelle localisation
        saveLocation(location.name, location.country);
        
        // Récupérer les nouveaux horaires de prière avec les nouveaux paramètres
        const date = new Date();
        const dateString = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        
        // Forcer le rafraîchissement des horaires avec la nouvelle localisation
        await getPrayerTimes(
          location.name,
          dateString,
          true, // forceRefresh
          location.country,
          calculationMethod
        );
        
        console.log('Horaires de prière mis à jour avec la nouvelle localisation');
      } catch (error) {
        console.error('Erreur lors de la mise à jour des horaires:', error);
      }
    }
  };

  // Récupérer l'état actuel du lancement au démarrage (Electron uniquement)
  useEffect(() => {
    const checkStartupLaunchStatus = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getStartupLaunchStatus) {
          const status = await window.electronAPI.getStartupLaunchStatus();
          setStartupLaunch(status);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'état du lancement au démarrage:", error);
      }
    };

    checkStartupLaunchStatus();
  }, []);

  // Fonction pour gérer le changement de l'état du lancement au démarrage
  const handleStartupLaunchChange = (enabled: boolean) => {
    setStartupLaunch(enabled);
    
    if (window.electronAPI && window.electronAPI.setStartupLaunch) {
      window.electronAPI.setStartupLaunch(enabled);
    }
  };

  // Fonction pour tester la notification avant la prière
  const handleTestNotification = () => {
    console.log("Test de la notification avant prière...");
    testNotificationFunction('Fajr'); // On utilise Fajr comme exemple
  };

  // Fonction pour activer/désactiver les notifications
  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    setNotificationsEnabled(enabled);
  };

  // Fonction pour gérer l'affichage des secondes dans la barre de menu
  const handleShowSecondsToggle = (enabled: boolean) => {
    setShowSeconds(enabled);
    localStorage.setItem('menu_show_seconds', enabled.toString());
    window.electronAPI.send('set-menu-display-seconds', enabled);
  };

  // Fonction pour gérer l'affichage de l'icône dans la barre de menu
  const handleShowMenuIconToggle = (enabled: boolean) => {
    setShowMenuIcon(enabled);
    localStorage.setItem('menu_show_icon', enabled.toString());
    window.electronAPI.send('set-menu-display-icon', enabled);
  };

  // Fonction pour activer/désactiver le Dua après l'adhan
  const handleDuaToggle = (enabled: boolean) => {
    setDuaEnabledState(enabled);
    setDuaEnabled(enabled);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'prayers':
        return (
          <div className="space-y-4">
            {/* Démarrage automatique */}
            {window.electronAPI && (
              <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/5">
                  <h3 className="text-base font-medium text-white">Démarrage automatique</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-white font-medium">Lancer au démarrage de l'ordinateur</p>
                      <p className="text-xs text-white/50 mt-1">
                        L'application démarrera automatiquement et sera disponible dans la barre de menu
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 flex-shrink-0 self-center">
                      <input
                        type="checkbox"
                        id="startupLaunch"
                        className="peer sr-only"
                        checked={startupLaunch}
                        onChange={(e) => handleStartupLaunchChange(e.target.checked)}
                      />
                      <label
                        htmlFor="startupLaunch"
                        className="absolute cursor-pointer inset-0 rounded-full bg-[#2c2c2e] peer-checked:bg-blue-600 
                          peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                          after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                      >
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Méthode de calcul */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Méthode de calcul</h3>
              </div>
              <div className="p-4">
                <select
                  className="w-full bg-[#2c2c2e] text-white rounded-xl py-3.5 px-4 border border-white/10 focus:border-blue-500 focus:outline-none appearance-none"
                  value={calculationMethod}
                  onChange={(e) => setCalculationMethod(Number(e.target.value))}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem 1.25rem',
                    paddingRight: '2.5rem'
                  }}
                >
                  {prayerCalculationMethods.map(method => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-white/50">
                  La méthode de calcul détermine les horaires en fonction de votre région géographique.
                </p>
              </div>
            </div>

            {/* Paramètres de la barre de menu (macOS) */}
            {window.electronAPI && window.electronAPI.platform === 'darwin' && (
              <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/5">
                  <h3 className="text-base font-medium text-white">Barre de menu</h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* Option pour afficher les secondes dans la barre de menu */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-white font-medium">Afficher les secondes</p>
                      <p className="text-xs text-white/50 mt-1">
                        Ajouter les secondes au compte à rebours dans la barre de menu
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 flex-shrink-0 self-center">
                      <input
                        type="checkbox"
                        id="showSeconds"
                        className="peer sr-only"
                        checked={showSeconds}
                        onChange={(e) => handleShowSecondsToggle(e.target.checked)}
                      />
                      <label
                        htmlFor="showSeconds"
                        className="absolute cursor-pointer inset-0 rounded-full bg-[#2c2c2e] peer-checked:bg-blue-600 
                          peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                          after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                      >
                      </label>
                    </div>
                  </div>

                  {/* Option pour afficher l'icône dans la barre de menu */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex-1 pr-4">
                      <p className="text-white font-medium">Afficher l'icône</p>
                      <p className="text-xs text-white/50 mt-1">
                        Afficher l'icône à côté du texte dans la barre de menu
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 flex-shrink-0 self-center">
                      <input
                        type="checkbox"
                        id="showMenuIcon"
                        className="peer sr-only"
                        checked={showMenuIcon}
                        onChange={(e) => handleShowMenuIconToggle(e.target.checked)}
                      />
                      <label
                        htmlFor="showMenuIcon"
                        className="absolute cursor-pointer inset-0 rounded-full bg-[#2c2c2e] peer-checked:bg-blue-600 
                          peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                          after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                      >
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Localisation */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-base font-medium text-white">Localisation</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  useGeolocation 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                    : "bg-[#2c2c2e] text-white/60"
                }`}>
                  {useGeolocation ? "Automatique" : "Manuelle"}
                </span>
              </div>
              <div className="p-5">
                {/* Mode de localisation */}
                <div className="flex items-start mb-5">
                  <div className="flex items-center flex-1">
                    <div className="relative inline-block w-12 h-6 mr-3 flex-shrink-0">
                      <input
                        type="checkbox"
                        id="useGeolocation"
                        className="peer sr-only"
                        checked={useGeolocation}
                        onChange={(e) => setUseGeolocation(e.target.checked)}
                        disabled={isGeolocating}
                      />
                      <label
                        htmlFor="useGeolocation"
                        className="absolute cursor-pointer inset-0 rounded-full bg-[#2c2c2e] peer-checked:bg-blue-600 
                          peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                          after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                          after:transition-all duration-300 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
                      ></label>
                    </div>
                    <div>
                      <label htmlFor="useGeolocation" className="text-white text-sm font-medium cursor-pointer">
                        Détection automatique
                      </label>
                      <p className="text-xs text-white/60 mt-0.5">
                        Utilise votre position pour déterminer votre ville
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bouton pour configurer la localisation */}
                {!useGeolocation ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-white/70 text-sm mb-2">Ville</label>
                      <LocationSearchInput 
                        onSelectLocation={handleLocationSelect}
                        initialLocation={city && country ? { id: '0', name: city, country: country, countryCode: '' } : null}
                        placeholder="Rechercher une ville..."
                        className="city-search"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Pays</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full bg-[#2c2c2e] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-blue-500 focus:outline-none shadow-inner"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="France"
                          readOnly={city !== ''}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {!isGeolocating && !geolocationError && (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between p-3 bg-[#2c2c2e] rounded-xl">
                          <div className="flex items-center">
                            <div className="bg-blue-600 p-2 rounded-full mr-3">
                              <FiMapPin className="text-white" />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{city || "Ville non détectée"}</h4>
                              <p className="text-sm text-white/60">{country || "Localisation en cours..."}</p>
                            </div>
                          </div>
                          <button
                            onClick={handleDetectLocation}
                            className="px-3 py-1.5 rounded-lg bg-[#3c3c3e] text-white text-sm hover:bg-[#4c4c4e] transition-colors"
                          >
                            Actualiser
                          </button>
                        </div>
                        <p className="text-xs text-white/50">
                          Votre position approximative sera utilisée uniquement pour déterminer votre ville.
                          Aucune donnée de localisation n'est stockée sur nos serveurs.
                        </p>
                        <button
                          onClick={() => setIsPermissionGuideOpen(true)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-left"
                        >
                          Gérer les permissions de localisation
                        </button>
                      </div>
                    )}
                    
                    {/* État de géolocalisation */}
                    {isGeolocating && (
                      <div className="flex items-center justify-center p-3 bg-[#2c2c2e] rounded-xl mt-2">
                        <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-3"></div>
                        <span className="text-white/80 text-sm">Détection de votre position...</span>
                      </div>
                    )}
                    
                    {/* Erreur de géolocalisation */}
                    {geolocationError && (
                      <div className="p-3 bg-red-900/30 rounded-xl border border-red-500/30 mt-2">
                        <div className="flex items-start">
                          <FiAlertTriangle className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-red-300 text-sm">{geolocationError}</p>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => setIsPermissionGuideOpen(true)}
                                className="px-3 py-1.5 rounded-lg bg-[#3c3c3e] text-white text-xs"
                              >
                                Paramètres
                              </button>
                              <button
                                onClick={handleDetectLocation}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs"
                              >
                                Réessayer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message de succès */}
                {_updateSuccess && (
                  <div className="mt-3 p-2 rounded-xl bg-green-900/30 border border-green-500/30 flex items-center">
                    <FiCheck className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-green-300 text-sm">Localisation mise à jour avec succès</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ajustements */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-base font-medium text-white">Ajustements des horaires</h3>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                  Minutes
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {Object.keys(adjustments).map((prayer) => (
                  <div key={prayer} className="flex items-center justify-between p-4">
                    <div>
                      <h5 className="text-white font-medium">
                        {prayer === 'fajr' ? 'Fajr' :
                          prayer === 'dhuhr' ? 'Dhuhr' :
                            prayer === 'asr' ? 'Asr' :
                              prayer === 'maghrib' ? 'Maghrib' : 'Isha'}
                      </h5>
                      <p className="text-xs text-white/50 mt-0.5">
                        {adjustments[prayer as keyof typeof adjustments] > 0
                          ? `Retardé de ${adjustments[prayer as keyof typeof adjustments]} min`
                          : adjustments[prayer as keyof typeof adjustments] < 0
                            ? `Avancé de ${Math.abs(adjustments[prayer as keyof typeof adjustments])} min`
                            : "Aucun ajustement"}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        className="w-9 h-9 rounded-full bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white flex items-center justify-center transition-colors"
                        onClick={() => handleAdjustmentChange(prayer as keyof typeof adjustments, adjustments[prayer as keyof typeof adjustments] - 1)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="w-9 text-center font-medium text-white">
                        {adjustments[prayer as keyof typeof adjustments]}
                      </div>
                      <button
                        className="w-9 h-9 rounded-full bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white flex items-center justify-center transition-colors"
                        onClick={() => handleAdjustmentChange(prayer as keyof typeof adjustments, adjustments[prayer as keyof typeof adjustments] + 1)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/5">
                <button
                  className="w-full py-3 rounded-xl flex justify-center items-center text-white font-medium
                    bg-[#2c2c2e] hover:bg-[#3c3c3e] transition-all"
                  onClick={() => setAdjustments({
                    fajr: 0,
                    dhuhr: 0,
                    asr: 0,
                    maghrib: 0,
                    isha: 0
                  })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Réinitialiser
                </button>
                <p className="mt-2 text-xs text-center text-white/50">
                  Les ajustements permettent de corriger les horaires selon vos besoins locaux
                </p>
              </div>
            </div>
          </div>
        );

      case 'adhan':
        return (
          <div className="space-y-4">
            {/* Section des récitateurs */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Sélection du récitateur</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {adhanTypes.map(type => (
                    <div
                      key={type.id}
                      onClick={() => handleReciterSelection(type.id)}
                      className={clsx(
                        'relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden',
                        {
                          'border-blue-500 bg-blue-500/10': selectedReciter === type.id,
                          'border-white/10 bg-[#2c2c2e] hover:bg-[#3c3c3e]': selectedReciter !== type.id
                        }
                      )}
                    >
                      <div className="p-3.5 flex items-center">
                        {/* Cercle de sélection */}
                        <div className={clsx(
                          'w-5 h-5 rounded-full border flex-shrink-0 mr-3 flex items-center justify-center',
                          {
                            'border-blue-500 bg-blue-500': selectedReciter === type.id,
                            'border-white/20 bg-transparent': selectedReciter !== type.id
                          }
                        )}>
                          {selectedReciter === type.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white rounded-full"
                            />
                          )}
                        </div>

                        {/* Informations sur le récitateur */}
                        <div className="flex-grow mr-2">
                          <h5 className="font-medium text-white">{type.name}</h5>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-white/60">{type.location}</span>
                          </div>
                        </div>

                        {/* Bouton écoute */}
                        {type.id !== 'none' && (
                          <div className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Empêcher le déclenchement du onClick du parent

                                // S'assurer que le récitateur sélectionné est celui qu'on veut écouter
                                if (selectedReciter !== type.id) {
                                  // Si un autre adhan est en cours, l'arrêter
                                  if (isAdhanPlaying) {
                                    stopAdhan();
                                    setIsAdhanPlaying(false);
                                    setIsAdhanPaused(false);
                                  }
                                  
                                  // Sélectionner le récitateur sans jouer l'audio
                                  handleReciterSelection(type.id);
                                } else {
                                  // Le récitateur est déjà sélectionné, lancer ou gérer la lecture
                                  handleTestAdhan();
                                }
                              }}
                              className={clsx(
                                "ml-2 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                selectedReciter === type.id
                                  ? "bg-blue-500 text-white"
                                  : "bg-white/10 text-white"
                              )}
                              aria-label={`Écouter ${type.name}`}
                            >
                              {isAdhanPlaying && selectedReciter === type.id ? (
                                isAdhanPaused ? (
                                  <FiPlay className="h-4 w-4" />
                                ) : (
                                  <FiPause className="h-4 w-4" />
                                )
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            
                            {/* Bouton stop - affiché uniquement si l'adhan joue pour ce récitateur */}
                            {isAdhanPlaying && selectedReciter === type.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStopAdhan();
                                }}
                                className="ml-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500 text-white"
                                aria-label={`Arrêter ${type.name}`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section volume */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Volume</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <svg className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-7.071M2.758 18.364a9 9 0 012.828-12.728" />
                  </svg>
                  <span className="text-sm font-medium text-white/70">{volume}%</span>
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-7.071M2.758 18.364a9 9 0 012.828-12.728" />
                  </svg>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = Number(e.target.value);
                    setVolume(newVolume);
                    // Appliquer immédiatement le changement de volume si l'adhan est en cours de lecture
                    setAdhanVolume(newVolume);
                  }}
                  className="w-full h-1.5 appearance-none cursor-pointer rounded-lg"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) ${volume}%, rgb(50, 50, 54) ${volume}%)`,
                  }}
                />
              </div>
            </div>

            {/* Section Notification */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Notification</h3>
              </div>
              <div className="p-4">
                {/* Commutateur d'activation/désactivation des notifications */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FiBell className="text-white/70 mr-2" />
                    <span className="text-sm text-white/70">Activer les rappels avant prière</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationsEnabled}
                      onChange={(e) => handleNotificationsToggle(e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-[#2c2c2e] rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Contrôles de temps avant la prière - affichés seulement si les notifications sont activées */}
                {notificationsEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-white/70">
                        Temps avant la prière
                      </label>
                      <div className="flex items-center bg-[#2c2c2e] rounded-xl overflow-hidden border border-white/10">
                        <button
                          className="p-2 w-10 text-white bg-transparent hover:bg-white/5 transition-colors flex items-center justify-center"
                          onClick={() => setNotificationTime(Math.max(1, notificationTime - 1))}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="w-12 text-center text-white font-medium">
                          {notificationTime}
                        </span>
                        <button
                          className="p-2 w-10 text-white bg-transparent hover:bg-white/5 transition-colors flex items-center justify-center"
                          onClick={() => setNotificationTime(notificationTime + 1)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/50 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Recevez une notification {notificationTime} minutes avant chaque prière
                    </div>
                    
                    {/* Bouton de test de notification */}
                    <button 
                      className="mt-3 w-full py-2 rounded-lg flex justify-center items-center text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-500 transition-all"
                      onClick={handleTestNotification}
                    >
                      <FiBell className="mr-2" />
                      Tester la notification
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* NOUVELLE SECTION: Dua après l'adhan - Section mise en évidence */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 bg-gradient-to-r from-blue-800/30 to-indigo-900/20">
                <h3 className="text-base font-medium text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-1 0a7 7 0 11-14 0 7 7 0 0114 0zm-7-2a1 1 0 01-1 1H7a1 1 0 110-2h2a1 1 0 011 1zm3 5a1 1 0 01-1 1H7a1 1 0 110-2h6a1 1 0 011 1z" clipRule="evenodd" />
                  </svg>
                  Dua (Invocation) après l'adhan
                </h3>
              </div>
              <div className="p-4 bg-gradient-to-b from-indigo-900/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 pr-4">
                    <p className="text-white font-medium">Lecture automatique du Dua</p>
                    <p className="text-xs text-white/70 mt-1">
                      Lire automatiquement l'invocation après la fin de l'adhan
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 flex-shrink-0 self-center">
                    <input
                      type="checkbox"
                      id="duaEnabled"
                      className="peer sr-only"
                      checked={duaEnabled}
                      onChange={(e) => handleDuaToggle(e.target.checked)}
                    />
                    <label
                      htmlFor="duaEnabled"
                      className="absolute cursor-pointer inset-0 rounded-full bg-[#2c2c2e] peer-checked:bg-blue-600 
                        peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                        after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                    >
                    </label>
                  </div>
                </div>
                <div className="mt-2 text-xs text-indigo-300/70 bg-indigo-900/20 p-2 rounded-lg">
                  Cette option permet de lire automatiquement l'invocation (Dua) après la fin de l'adhan
                </div>
                
                {/* Bouton de test pour écouter le Dua - style Apple */}
                <motion.button
                  className="flex items-center gap-3 px-4 py-3 mt-4 w-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-md hover:shadow-lg text-white"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Si le Dua est déjà en cours de lecture
                    if (isDuaPlaying && duaAudioRef) {
                      // Mettre en pause ou reprendre
                      if (duaAudioRef.paused) {
                        // Reprendre la lecture
                        duaAudioRef.play();
                        
                        // Changer l'icône en pause
                        const playButton = document.getElementById('dua-play-button');
                        if (playButton) {
                          playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                        }
                      } else {
                        // Mettre en pause
                        duaAudioRef.pause();
                        
                        // Changer l'icône en lecture
                        const playButton = document.getElementById('dua-play-button');
                        if (playButton) {
                          playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                        }
                      }
                    } else {
                      // Première lecture
                      // Arrêter tout audio précédent s'il y en a un
                      if (duaAudioRef) {
                        duaAudioRef.pause();
                        duaAudioRef.currentTime = 0;
                      }
                      
                      // Créer un nouvel élément audio
                      const duaAudio = new Audio('audio/Dua.mp3');
                      duaAudio.volume = volume / 100;
                      
                      // Stocker la référence
                      setDuaAudioRef(duaAudio);
                      setIsDuaPlaying(true);
                      
                      // Changer l'icône en pause
                      const playButton = document.getElementById('dua-play-button');
                      if (playButton) {
                        playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                      }
                      
                      // Démarrer la lecture
                      duaAudio.play();
                      
                      // Remettre l'icône de lecture à la fin
                      duaAudio.onended = () => {
                        setIsDuaPlaying(false);
                        if (playButton) {
                          playButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                        }
                      };
                    }
                  }}
                >
                  <span id="dua-play-button" className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {isDuaPlaying && duaAudioRef && !duaAudioRef.paused 
                        ? "Mettre en pause" 
                        : isDuaPlaying && duaAudioRef && duaAudioRef.paused 
                          ? "Reprendre la lecture" 
                          : "Écouter le Dua"}
                    </span>
                    <span className="text-xs text-blue-100">Tester l'invocation après l'Adhan</span>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Paramètres des prières */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Prières actives</h3>
              </div>
              <div className="divide-y divide-white/5">
                {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(prayer => {
                  // Typecasting pour TypeScript
                  const prayerName = prayer as keyof typeof adhanConfig.prayerSettings;
                  const isEnabled = adhanConfig.prayerSettings[prayerName];
                  
                  return (
                    <div key={prayer} className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-white">{prayer}</span>
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isEnabled}
                          onChange={(e) => {
                            // Créer une copie pour éviter de modifier directement l'état
                            const newConfig = { ...adhanConfig };
                            newConfig.prayerSettings[prayerName] = e.target.checked;
                            
                            // Mettre à jour l'état local
                            setAdhanConfig(newConfig);
                            
                            // Appeler la fonction de service pour sauvegarder la configuration
                            setPrayerEnabled(prayerName, e.target.checked);
                            console.log(`Prière ${prayer} ${e.target.checked ? 'activée' : 'désactivée'}`);
                          }}
                        />
                        <div className="relative w-11 h-6 bg-[#2c2c2e] rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bouton de test */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden p-4">
              <div className="flex gap-3">
                <button
                  className={`flex-1 py-3.5 rounded-xl flex justify-center items-center text-white font-medium
                    ${isAdhanPlaying ? (isAdhanPaused ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500') : 'bg-blue-600 hover:bg-blue-500'} transition-all`}
                  onClick={handleTestAdhan}
                >
                  {isAdhanPlaying ? (
                    isAdhanPaused ? (
                      <>
                        <FiPlay className="h-5 w-5 mr-2" />
                        Reprendre l'adhan
                      </>
                    ) : (
                      <>
                        <FiPause className="h-5 w-5 mr-2" />
                        Mettre en pause
                      </>
                    )
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Tester l'adhan
                    </>
                  )}
                </button>
                
                {isAdhanPlaying && (
                  <button
                    className="py-3.5 px-4 rounded-xl flex justify-center items-center text-white font-medium bg-red-600 hover:bg-red-500 transition-all"
                    onClick={handleStopAdhan}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            {/* Mode sombre */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Mode d'affichage</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white">Mode sombre</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isDarkMode}
                      onChange={() => setIsDarkMode(!isDarkMode)}
                    />
                    <div className="relative w-11 h-6 bg-[#2c2c2e] rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-xl border ${isDarkMode ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-[#2c2c2e]'} flex flex-col items-center`}
                    onClick={() => setIsDarkMode(true)}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#323234] flex items-center justify-center mb-2">
                      <FiMoon className="text-white text-lg" />
                    </div>
                    <span className="text-sm text-white">Sombre</span>
                  </div>
                  <div
                    className={`p-4 rounded-xl border ${!isDarkMode ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-[#2c2c2e]'} flex flex-col items-center`}
                    onClick={() => setIsDarkMode(false)}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#f2f2f7] flex items-center justify-center mb-2">
                      <FiSun className="text-[#323234] text-lg" />
                    </div>
                    <span className="text-sm text-white">Clair</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Langue */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Langue</h3>
              </div>
              <div className="p-4">
                <select
                  className="w-full bg-[#2c2c2e] text-white rounded-xl py-3.5 px-4 border border-white/10 focus:border-blue-500 focus:outline-none appearance-none"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem 1.25rem',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
                <p className="mt-2 text-xs text-white/50">
                  Modifie la langue de l'interface utilisateur
                </p>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-4">
            {/* Introduction */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Niveau de performance</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-white/70 mb-4">
                  Ajustez les performances visuelles selon les capacités de votre appareil.
                </p>

                <div className="space-y-3">
                  <div
                    className={`p-4 rounded-xl border transition-all cursor-pointer
                      ${performanceLevel === PerformanceLevel.LOW
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-[#2c2c2e] hover:bg-[#3c3c3e]'}`}
                    onClick={() => setPerformanceLevel(PerformanceLevel.LOW)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#323254] flex items-center justify-center mr-3">
                        <FiZap className="text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Basse consommation</h4>
                        <p className="text-xs text-white/50 mt-1">Animations réduites, idéal pour économiser la batterie</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border transition-all cursor-pointer
                      ${performanceLevel === PerformanceLevel.MEDIUM
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-[#2c2c2e] hover:bg-[#3c3c3e]'}`}
                    onClick={() => setPerformanceLevel(PerformanceLevel.MEDIUM)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#3a2954] flex items-center justify-center mr-3">
                        <FiZap className="text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Équilibré</h4>
                        <p className="text-xs text-white/50 mt-1">Bon équilibre entre visuels et performances</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border transition-all cursor-pointer
                      ${performanceLevel === PerformanceLevel.HIGH
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-[#2c2c2e] hover:bg-[#3c3c3e]'}`}
                    onClick={() => setPerformanceLevel(PerformanceLevel.HIGH)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#4d2d24] flex items-center justify-center mr-3">
                        <FiZap className="text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Haute qualité</h4>
                        <p className="text-xs text-white/50 mt-1">Animations complètes, recommandé pour appareils puissants</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Informations</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-white/70 mb-3">
                  Ces réglages affectent les éléments suivants :
                </p>
                <ul className="space-y-2">
                  <li className="flex">
                    <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-white/70 text-sm">Animations météo</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-white/70 text-sm">Compteur à rebours</span>
                  </li>
                  <li className="flex">
                    <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-white/70 text-sm">Transitions visuelles</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <p className="text-xs text-blue-300">
                    <svg className="w-4 h-4 inline-block mr-1 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Les modifications prennent effet immédiatement et sont sauvegardées automatiquement
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            {/* Section Mise à jour et Version - maintenant au début */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-indigo-900/10">
                <h3 className="text-base font-medium text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="8 12 12 16 16 12" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                  </svg>
                  Mise à jour et Version
                </h3>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-white text-base font-medium">Version {appVersion || '1.0.0'}</span>
                    <p className="text-white/50 text-xs mt-1">
                      {isUpdateAvailable 
                        ? "Une nouvelle version est disponible" 
                        : "Vous utilisez la dernière version"}
                    </p>
                  </div>
                  <motion.button
                    className="px-3 py-2 rounded-lg flex items-center text-white text-sm bg-blue-600 hover:bg-blue-500 transition-colors shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Afficher un indicateur de chargement temporaire
                      setIsUpdateAvailable(false);
                      
                      // Vérifier les mises à jour
                      window.electron.checkForUpdates();
                      
                      // Après un court délai, afficher une notification si aucune mise à jour n'est disponible
                      setTimeout(() => {
                        if (!isUpdateAvailable && !updateError) {
                          // Afficher une notification temporaire
                          setUpdateInfo({version: appVersion});
                          setShowUpdateNotification(true);
                          
                          // Masquer après 3 secondes
                          setTimeout(() => {
                            setShowUpdateNotification(false);
                          }, 3000);
                        }
                      }, 2000);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                    Vérifier
                  </motion.button>
                </div>
                
                {isUpdateAvailable && (
                  <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                      </svg>
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Mise à jour {updateInfo?.version}</p>
                        <p className="text-blue-200/70 text-xs">Cliquez pour télécharger et installer</p>
                      </div>
                    </div>
                    <motion.button
                      className="ml-2 px-2.5 py-1.5 rounded-lg flex items-center text-white text-xs bg-blue-600 hover:bg-blue-500"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowUpdateNotification(true);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Installer
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Section à propos */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">À propos de l'application</h3>
              </div>
              <div className="p-5">
                <p className="text-white/80 text-sm leading-relaxed">
                  Cette application a été conçue avec foi, passion et attention au détail pour accompagner les musulmans dans leur quotidien spirituel.
                  Elle offre une expérience élégante et apaisante, alliant technologie moderne et tradition islamique, pour ne jamais manquer l'appel de la prière.
                </p>
              </div>
            </div>

            {/* Section concepteur */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Conception & développement</h3>
              </div>
              <div className="p-5">
                <p className="text-white/80 text-sm">Anis Mosbah</p>
              </div>
            </div>

            {/* Section design de l'icône */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Design de l'icône</h3>
              </div>
              <div className="p-5">
                <p className="text-white/80 text-sm">
                  Créée par Anis Mosbah, en s'inspirant des couleurs célestes et de la sérénité de la prière.
                </p>
              </div>
            </div>

            {/* Section copyright */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Droits d'auteur</h3>
              </div>
              <div className="p-5">
                <p className="text-white/80 text-sm">Copyright © 2025 Anis Mosbah</p>
                <p className="text-white/60 text-sm mt-1">Tous droits réservés.</p>
              </div>
            </div>

            {/* Bouton Quitter l'application - style Apple */}
            <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-base font-medium text-white">Quitter l'application</h3>
              </div>
              <div className="p-5">
                <motion.button
                  className="w-full py-3.5 rounded-xl bg-[#fd4f57] hover:bg-[#ea3d46] text-white font-medium flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (window.electron && window.electron.quitApp) {
                      window.electron.quitApp();
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                  Quitter Salat Now
                </motion.button>
                <p className="text-xs text-white/50 mt-2 text-center">
                  Ferme complètement l'application et la retire de la barre de menu
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Nettoyer l'adhan quand le composant est démonté
  useEffect(() => {
    return () => {
      stopAdhan();
    };
  }, []);

  // Nettoyer l'adhan et le dua quand le composant est démonté
  useEffect(() => {
    return () => {
      stopAdhan();
      // Nettoyer l'audio du Dua
      if (duaAudioRef) {
        duaAudioRef.pause();
        duaAudioRef.src = '';
      }
    };
  }, [duaAudioRef]);

  // Récupérer la version de l'application et configurer les listeners de mise à jour
  useEffect(() => {
    if (isOpen) {
      // Récupérer la version de l'application
      window.electron.getAppVersion();
      window.electron.onAppVersion((version) => {
        setAppVersion(version);
      });
      
      // Configurer les écouteurs d'événements pour les mises à jour
      window.electron.onUpdateAvailable((info) => {
        console.log('Mise à jour disponible:', info);
        setIsUpdateAvailable(true);
        setUpdateInfo(info);
        setShowUpdateNotification(true);
      });
      
      window.electron.onUpdateNotAvailable(() => {
        console.log('Aucune mise à jour disponible');
        setIsUpdateAvailable(false);
      });
      
      window.electron.onUpdateDownloadProgress((progressObj) => {
        console.log('Progression du téléchargement:', progressObj);
        setUpdateProgress(progressObj.percent || 0);
        setIsUpdateDownloading(true);
      });
      
      window.electron.onUpdateDownloaded((info) => {
        console.log('Mise à jour téléchargée:', info);
        setIsUpdateDownloaded(true);
        setIsUpdateDownloading(false);
      });
      
      window.electron.onUpdateError((err) => {
        console.error('Erreur de mise à jour:', err);
        setUpdateError(err?.message || 'Une erreur est survenue pendant la mise à jour');
      });
    }
  }, [isOpen]);

  // Rendu conditionnel du panel
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Fond semi-transparent qui ferme la fenêtre au clic */}
      <div
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />
      
      {/* Notification de mise à jour */}
      <UpdateNotification
        isVisible={showUpdateNotification}
        updateInfo={updateInfo}
        progress={updateProgress}
        isDownloading={isUpdateDownloading}
        isDownloaded={isUpdateDownloaded}
        error={updateError}
        onClose={() => setShowUpdateNotification(false)}
        onDownload={() => {
          window.electron.downloadUpdate();
        }}
        onInstall={() => {
          window.electron.installUpdate();
        }}
      />

      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-[#0a0a0a] bg-opacity-95 z-50 overflow-auto"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* En-tête principal - Style Apple plus minimaliste */}
          <div className="sticky top-0 z-10 backdrop-blur-lg bg-black/70 border-b border-white/10">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-medium text-white">Réglages</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Fermer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Tabs de navigation - style iOS 17 */}
            <div className="px-6 pb-2">
              <div className="flex space-x-1 bg-[#1c1c1e] p-1 rounded-xl">
                <button
                  className={clsx(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    activeTab === 'prayers'
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                  onClick={() => setActiveTab('prayers')}
                >
                  Prières
                </button>
                <button
                  className={clsx(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    activeTab === 'adhan'
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                  onClick={() => setActiveTab('adhan')}
                >
                  Adhan
                </button>
                {/* Onglet Apparence temporairement masqué */}
                {/*
                <button
                  className={clsx(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    activeTab === 'appearance'
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                  onClick={() => setActiveTab('appearance')}
                >
                  Apparence
                </button>
                */}
                <button
                  className={clsx(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    activeTab === 'performance'
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                  onClick={() => setActiveTab('performance')}
                >
                  Perf
                </button>
                <button
                  className={clsx(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    activeTab === 'about'
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-300"
                  )}
                  onClick={() => setActiveTab('about')}
                >
                  À propos
                </button>
              </div>
            </div>
          </div>

          {/* Section profil utilisateur repensée - style Apple */}
          <div className="px-6 py-5 mt-2">
            <div className="flex items-center bg-white/5 p-4 rounded-xl mb-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-white/5">
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(userName)}&backgroundColor=transparent&shapeColor=ffffff`}
                    alt="Avatar"
                    className="h-full w-full object-cover p-2"
                  />
                </div>
                <button
                  onClick={startEditingName}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#1c1c1e] border border-[#2c2c2e] text-white shadow-md"
                >
                  <FiEdit2 size={12} />
                </button>
              </div>

              <div className="ml-4 flex-grow">
                {isEditingName ? (
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={userName}
                    onChange={handleNameChange}
                    onBlur={finishEditingName}
                    onKeyDown={handleNameKeyDown}
                    className="bg-[#1c1c1e] text-white text-lg font-medium px-3 py-1.5 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={25}
                  />
                ) : (
                  <h2 className="text-lg font-medium text-white">
                    {userName}
                  </h2>
                )}
                <div className="mt-1 bg-white/5 px-2 py-0.5 inline-block rounded-md">
                  <span className="text-xs text-white/60">Compte personnel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu avec padding */}
          <div className="px-6 pb-28 mt-1">
            {renderTab()}
          </div>

          {/* Boutons d'action fixés en bas style iOS 17 */}
          <div className="fixed bottom-0 left-0 right-0 py-4 px-6 border-t border-white/5 bg-black/40 backdrop-blur-lg">
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3.5 px-4 bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white font-medium rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center"
                disabled={isGeolocating}
              >
                {isGeolocating ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" />
                    Localisation...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Guide des permissions de localisation */}
      <PermissionGuide 
        isOpen={isPermissionGuideOpen}
        onClose={() => setIsPermissionGuideOpen(false)}
        onRequestPermission={requestLocationPermission}
      />
    </div>
  );
};

export default SettingsPanel; 
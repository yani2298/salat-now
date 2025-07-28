import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import duration from 'dayjs/plugin/duration';
import { motion, AnimatePresence } from 'framer-motion';
import PrayerCard from './components/PrayerCard';
import PrayerList from './components/PrayerList';
import CityHeader from './components/CityHeader';
import SettingsPanel from './components/SettingsPanel';
import { getPrayerTimes, getCachedLocation, getCachedCalculationMethod } from './services/prayerService';
import { Prayer, PrayerTimes } from './types/prayer';
import { initAdhanService, scheduleAdhanNotifications } from './services/adhanService';
import { formatHijriDate, getHijriDate } from './services/hijriService';
import { initOptimizerService, enableAutomaticOptimization, optimizeStorage } from './services/optimizerService';
// import salatNowLogo from './assets/salat-now.png'; // Importer l'image
import { FiMapPin } from 'react-icons/fi';
import { FiMenu } from 'react-icons/fi'; // Importer l'icône de menu

// Activer les plugins Day.js
dayjs.extend(duration);
dayjs.locale('fr'); // Utiliser le français

function App() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showAllPrayers, setShowAllPrayers] = useState(false);
  const [hijriDate, setHijriDate] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null); // Variable utilisée dans le rendu conditionnel uniquement

  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Définir updateDataInBackground comme une fonction nommée pour pouvoir la référencer
  const updateDataInBackground = async (forceRefresh = false) => {
    console.log("Mise à jour des données en arrière-plan...");
    try {
      // Rafraîchir les données si nécessaire sans bloquer l'interface
      const today = dayjs().format('DD-MM-YYYY');

      // Récupérer la localisation
      const { city, country } = getCachedLocation();

      // Forcer le rafraîchissement depuis l'API si demandé
      try {
        const times = await getPrayerTimes(city, today, forceRefresh, country);
        setPrayerTimes(times);

        // Mettre à jour la prochaine prière
        const nextPrayerTime = determineNextPrayer(times);
        setNextPrayer(nextPrayerTime);

        // Planifier les notifications d'adhan
        scheduleAdhanNotifications(times);
        
        // Enregistrer l'heure de la dernière mise à jour
        localStorage.setItem('last_prayer_update', Date.now().toString());
      } catch (prayerError) {
        console.error("Erreur lors de la mise à jour des horaires de prière:", prayerError);
      }

      // Mettre à jour la date hijri
      try {
        const hijriDateData = await getHijriDate(today, forceRefresh);
        const formattedDate = formatHijriDate(hijriDateData, 'short', 'fr');
        setHijriDate(formattedDate);
      } catch (hijriError) {
        console.error("Erreur lors de la mise à jour de la date hijri:", hijriError);
      }

      console.log("Mise à jour en arrière-plan terminée");
    } catch (error) {
      console.error('Erreur lors de la mise à jour en arrière-plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue lors de la mise à jour.';
      setError(errorMessage);
    }
  };

  // Initialiser les services au démarrage
  useEffect(() => {
    console.log("Initialisation des services...");

    // Initialiser le service d'adhan
    initAdhanService();

    // Initialiser le service d'optimisation
    initOptimizerService();

    // Activer l'optimisation automatique
    enableAutomaticOptimization(true);

    // Nettoyer le stockage au démarrage
    optimizeStorage();

    // Demander les permissions de notification si disponibles
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log(`Permission de notification: ${permission}`);
      });
    }
    
    // Ajouter un écouteur pour les mises à jour après la sortie de veille
    const sleepUpdateListener = window.electronAPI.on('update-after-sleep', () => {
      console.log('Détection de sortie de veille, mise à jour des horaires...');
      // Forcer une mise à jour complète
      updateDataInBackground(true);
    });
    
    // Ajouter un écouteur pour les vérifications périodiques
    const periodicCheckListener = window.electronAPI.on('check-prayer-times', () => {
      console.log('Vérification périodique des horaires de prière');
      // Vérifier si nous avons besoin d'une mise à jour (par exemple, si l'heure a changé significativement)
      if (prayerTimes) {
        const now = dayjs();
        const lastUpdated = localStorage.getItem('last_prayer_update');
        
        if (!lastUpdated || (now.diff(dayjs(parseInt(lastUpdated)), 'minute') > 10)) {
          console.log('Mise à jour périodique des horaires de prière');
          updateDataInBackground(false);
        } else {
          console.log('Pas besoin de mise à jour, dernière mise à jour récente');
          // Mettre à jour la prochaine prière si nécessaire
          if (prayerTimes) {
            setNextPrayer(determineNextPrayer(prayerTimes));
          }
        }
      } else {
        // Si nous n'avons pas de données, forcer une mise à jour
        updateDataInBackground(true);
      }
    });

    // Nettoyage à la fermeture de l'application
    return () => {
      // Optimiser le stockage avant la fermeture
      optimizeStorage();
      
      // Nettoyer les écouteurs d'événements
      sleepUpdateListener();
      periodicCheckListener();
    };
  }, [prayerTimes]);
  
  // Effet pour le chargement initial rapide à partir du cache
  useEffect(() => {
    const quickInitialLoad = async () => {
      console.log("Chargement initial rapide depuis le cache...");
      try {
        // Charger les données depuis le cache sans bloquer l'interface
        const today = dayjs().format('DD-MM-YYYY');

        // Récupérer la localisation
        const { city, country } = getCachedLocation();

        // Essayer de récupérer les horaires de prière depuis le cache
        try {
          const times = await getPrayerTimes(city, today);
          console.log(`Horaires de prière initiaux chargés pour ${city}, ${country}`);
          setPrayerTimes(times);

          // Déterminer la prochaine prière
          const nextPrayerTime = determineNextPrayer(times);
          setNextPrayer(nextPrayerTime);

          // Planifier les notifications d'adhan
          scheduleAdhanNotifications(times);
          
          // Enregistrer l'heure de la dernière mise à jour
          localStorage.setItem('last_prayer_update', Date.now().toString());
        } catch (prayerError) {
          console.error("Erreur lors du chargement des horaires de prière:", prayerError);
        }

        // Essayer de récupérer la date hijri depuis le cache  
        try {
          const hijriDateData = await getHijriDate(today);
          const formattedDate = formatHijriDate(hijriDateData, 'short', 'fr');
          setHijriDate(formattedDate);
        } catch (hijriError) {
          console.error("Erreur lors du chargement de la date hijri:", hijriError);
        }
      } catch (err) {
        console.error("Erreur lors du chargement initial:", err);
        const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue lors du chargement initial.';
        setError(errorMessage);
      } finally {
        setIsInitialLoad(false);
        setLoading(false); // Indiquer que le chargement initial est terminé
      }
    };

    quickInitialLoad();
  }, []);

  // Effet pour la mise à jour des données en arrière-plan
  useEffect(() => {
    // On n'exécute pas cela au premier montage, car l'effet ci-dessus s'en charge
    if (isInitialLoad) return;

    // Mettre à jour les données en arrière-plan
    updateDataInBackground();

    // Mettre à jour les horaires chaque jour à minuit
    const updateTimesAtMidnight = () => {
      const now = new Date();
      const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // Lendemain
        0, 0, 0 // Minuit
      );

      const msToMidnight = night.getTime() - now.getTime();

      return setTimeout(() => {
        console.log("Minuit atteint, mise à jour des horaires de prière...");
        updateDataInBackground(true); // Forcer une mise à jour à minuit
        updateTimesAtMidnight(); // Replanifier pour le jour suivant
      }, msToMidnight);
    };

    const midnightTimeout = updateTimesAtMidnight();

    // Refresh every minute to update countdown IN THE UI
    const interval = setInterval(() => {
      if (prayerTimes) {
        setNextPrayer(determineNextPrayer(prayerTimes));
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, [isInitialLoad]);

  // --- NOUVEAU useEffect pour mettre à jour le titre du Tray ---
  useEffect(() => {
    const updateTray = () => {
      if (nextPrayer && prayerTimes) {
        const now = dayjs();
        let prayerTime = dayjs(`${now.format('YYYY-MM-DD')} ${nextPrayer.time}`, 'YYYY-MM-DD HH:mm');
        
        // Vérifier si l'affichage des secondes est activé
        const showSeconds = localStorage.getItem('menu_show_seconds') !== 'false';

        // Si l'heure de la prière calculée est passée, prendre celle du lendemain
        if (prayerTime.isBefore(now)) {
          const tomorrow = now.add(1, 'day').format('YYYY-MM-DD');
          if (nextPrayer.name === 'Fajr') {
            prayerTime = dayjs(`${tomorrow} ${nextPrayer.time}`, 'YYYY-MM-DD HH:mm');
          } else {
            const actualNextPrayer = determineNextPrayer(prayerTimes);
            let currentDayPrayerTime = dayjs(`${now.format('YYYY-MM-DD')} ${actualNextPrayer.time}`, 'YYYY-MM-DD HH:mm');
            if (currentDayPrayerTime.isBefore(now)) {
              prayerTime = dayjs(`${tomorrow} ${actualNextPrayer.time}`, 'YYYY-MM-DD HH:mm');
            } else {
              prayerTime = currentDayPrayerTime;
            }
            if (actualNextPrayer.name !== nextPrayer.name) {
              setNextPrayer(actualNextPrayer);
            }
          }
        }

        const diff = prayerTime.diff(now);
        let title = '';
        const prayerNamePart = `\u00A0\u00A0${nextPrayer.name}`; // Deux espaces insécables

        if (diff < 0) {
          // Format fixe pour 0s avec padding interne
          const timeString = showSeconds ? ' - 00s   ' : ' - 00m   ';
          title = `${prayerNamePart}${timeString}`;
          setNextPrayer(determineNextPrayer(prayerTimes));
        } else {
          const duration = dayjs.duration(diff);
          const hours = Math.floor(duration.asHours());
          const minutes = duration.minutes();
          const seconds = duration.seconds();
          let timeString = '';

          if (showSeconds) {
            // Formatter la partie temps avec padding interne pour largeur constante
            if (hours > 0) {
              timeString = ` -${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else if (minutes > 0) {
              // Ajouter des espaces pour simuler la largeur de H:
              timeString = `   -${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
              // Ajouter beaucoup d'espaces pour simuler H:MM:
              timeString = `     -${seconds.toString().padStart(2, '0')}s`;
            }
          } else {
            // Version sans secondes - plus compacte
            if (hours > 0) {
              timeString = ` -${hours}:${minutes.toString().padStart(2, '0')}`;
            } else {
              timeString = `   -${minutes.toString().padStart(2, '0')}m`;
            }
          }
          title = `${prayerNamePart}${timeString}`;
        }

        // Envoyer au processus principal via l'API exposée par le preload script
        window.electronAPI.send('update-tray-title', title);
      } else {
        // Envoyer au processus principal via l'API exposée par le preload script
        window.electronAPI.send('update-tray-title', '\u00A0\u00A0...'); // Ajouter espaces aussi
      }
    };

    updateTray();
    
    // Ajuster l'intervalle selon que les secondes sont affichées ou non
    const showSeconds = localStorage.getItem('menu_show_seconds') !== 'false';
    const updateInterval = showSeconds ? 1000 : 60000; // 1s ou 1min
    
    const trayInterval = setInterval(updateTray, updateInterval);

    return () => clearInterval(trayInterval);
  }, [nextPrayer, prayerTimes]);
  // --- Fin NOUVEAU useEffect ---

  const determineNextPrayer = (times: PrayerTimes): Prayer => {
    const now = dayjs();
    const prayers: Prayer[] = [
      { name: 'Fajr', time: times.Fajr, arabicName: 'الفجر', icon: 'dawn' as const },
      { name: 'Dhuhr', time: times.Dhuhr, arabicName: 'الظهر', icon: 'noon' as const },
      { name: 'Asr', time: times.Asr, arabicName: 'العصر', icon: 'afternoon' as const },
      { name: 'Maghrib', time: times.Maghrib, arabicName: 'المغرب', icon: 'sunset' as const },
      { name: 'Isha', time: times.Isha, arabicName: 'العشاء', icon: 'night' as const },
    ];

    // Rechercher la prochaine prière
    for (const prayer of prayers) {
      const prayerTime = dayjs(`${now.format('YYYY-MM-DD')} ${prayer.time}`, 'YYYY-MM-DD HH:mm');
      if (prayerTime.isAfter(now)) {
        return prayer;
      }
    }

    // Si toutes les prières d'aujourd'hui sont passées, retourner la première de demain
    return prayers[0];
  };

  const togglePrayerList = () => {
    setShowAllPrayers(!showAllPrayers);
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);

    // Recharger tous les services et paramètres modifiés
    const updateAllServices = async () => {
      try {
        // 1. Récupérer tous les paramètres mis à jour
        const { city, country } = getCachedLocation();
        const calculationMethod = getCachedCalculationMethod();
        const today = dayjs().format('DD-MM-YYYY');

        console.log("Mise à jour des services après modification des paramètres...");

        // 2. Recharger les horaires de prière avec les nouveaux ajustements
        const times = await getPrayerTimes(city, today, true, country, calculationMethod);
        setPrayerTimes(times);

        // 3. Mettre à jour la prochaine prière
        const nextPrayerTime = determineNextPrayer(times);
        setNextPrayer(nextPrayerTime);

        // 4. Planifier les notifications d'adhan avec les nouveaux horaires
        scheduleAdhanNotifications(times);

        // 5. Mettre à jour la date hijri si nécessaire
        try {
          const hijriDateData = await getHijriDate(today, true);
          const formattedDate = formatHijriDate(hijriDateData, 'short', 'fr');
          setHijriDate(formattedDate);
        } catch (hijriError) {
          console.error("Erreur lors de la mise à jour de la date hijri:", hijriError);
        }

        // 6. Actualiser également d'autres services selon les besoins
        // Exemple: optimisation
        optimizeStorage();

        console.log("Tous les services ont été mis à jour après fermeture des paramètres");
      } catch (error) {
        console.error("Erreur lors de la mise à jour des services:", error);
      }
    };

    updateAllServices();
  };

  const handleMouseLeaveApp = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    if (showAllPrayers) {
      leaveTimerRef.current = setTimeout(() => {
        setShowAllPrayers(false);
      }, 1500); // Délai augmenté à 1500ms
    }
  };

  const handleMouseEnterApp = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  // Afficher uniquement le message d'erreur si on a une erreur et pas de données
  if (!prayerTimes && error) {
    console.log("PrayerTimes est null et erreur, affichage message d'erreur.");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <p>{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-indigo-600 rounded"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Si nous sommes en chargement et n'avons pas de données, afficher le spinner
  if (loading && !prayerTimes) {
    console.log("Affichage de l'indicateur de chargement...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="prayer-card flex items-center justify-center p-2">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  console.log("Affichage du contenu principal...");
  return (
    <div
      className="app-container shaped-window flex flex-col items-center pt-10 px-2 pb-0 relative bg-gradient-to-b from-blue-950 to-[#0D0F1A]"
      onMouseLeave={handleMouseLeaveApp}
      onMouseEnter={handleMouseEnterApp}
    >
      {/* Top Arrow Pointer */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 \
          border-l-[10px] border-l-transparent \
          border-r-[10px] border-r-transparent \
          border-b-[10px] border-b-gray-900\"> {/* Match the top color of the gradient */}
        </div>
      </div>

      {/* Logo Salat Now supprimé et remplacé par un indicateur live */}
      <div className="absolute top-6 right-6 z-50">
        {!settingsOpen && (
          <span className="relative flex h-3 w-3">
            {!settingsOpen && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            )}
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>

      {/* Localisation - Positionné en haut */}
      <div className="text-gray-400 text-xs mb-2 flex items-center">
        <FiMapPin className="mr-1" />
        {getCachedLocation().city}, {getCachedLocation().country}
      </div>

      {/* Nouveau bouton Menu (icône) - positionné à gauche, masqué quand les réglages sont ouverts */}
      {!settingsOpen && (
        <div className="absolute top-6 left-6 w-auto z-[999]">
          <button 
            onClick={handleSettingsClick}
            className="p-2 rounded-full text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
            aria-label="Ouvrir les paramètres"
          >
            <FiMenu className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Panneau de réglages (Déplacé ici) */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel isOpen={settingsOpen} onClose={handleCloseSettings} />
        )}
      </AnimatePresence>

      {prayerTimes && (
        <div className="flex flex-col items-center flex-shrink-0 w-full max-w-xs mt-2">
          <CityHeader
            city={getCachedLocation().city}
            hijriDate={hijriDate}
            gregorianDate={dayjs().format('dddd DD MMMM YYYY')}
          />

          <motion.div
            className={`w-full max-w-xs mb-0 ${showAllPrayers ? 'mt-2' : 'mt-8'} flex-grow-0 overflow-auto`}
            layout={false}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            {nextPrayer && !showAllPrayers && (
              <PrayerCard prayer={nextPrayer} isNext={true} />
            )}

            {/* Bouton fléché avec positionnement révisé */}
            <motion.div className={`flex justify-center ${showAllPrayers ? 'mt-4' : 'mt-8'} mb-4`}>
              <motion.button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 bg-opacity-70 text-white shadow-lg"
                onClick={togglePrayerList}
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 0 15px rgba(79, 70, 229, 0.6)",
                  backgroundColor: "rgba(99, 102, 241, 0.85)"
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 0 }} // Garder l'animation initiale si souhaité
              >
                <motion.div
                  animate={{
                    rotate: showAllPrayers ? 180 : 0,
                  }}
                  transition={{
                    rotate: { duration: 0.3, type: "spring", stiffness: 200 }
                  }}
                  className="text-base font-bold"
                >
                  {showAllPrayers ? '↑' : '↓'} 
                </motion.div>
              </motion.button>
            </motion.div>

            {/* Footer conditionnel - Visible uniquement sur la façade */}
            {!showAllPrayers && (
              <div className="text-center text-[10px] text-gray-500 mt-6 pt-2 absolute bottom-4 left-0 right-0">
                <p>© Salat Now ° 2025</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {showAllPrayers && prayerTimes && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full"
                >
                  <PrayerList prayerTimes={prayerTimes} currentPrayer={nextPrayer?.name || ''} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;

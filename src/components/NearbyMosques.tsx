import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mosque, findMosquesNearby } from '../services/mosqueService';
import { getUserLocation } from '../services/locationService';
import { FiRefreshCw, FiStar, FiMapPin } from 'react-icons/fi';

interface NearbyMosquesProps {
  limit?: number;
}

const NearbyMosques: React.FC<NearbyMosquesProps> = ({ limit = 20 }) => {
  // --- États ---
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  
  // --- Références ---
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoScrollTimer = useRef<number | null>(null);
  const isPaused = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isUpdatingInBackground = useRef(false);
  
  // --- Constantes ---
  const AUTO_SCROLL_SPEED = 0.5; // pixels par frame
  const AUTO_SCROLL_INTERVAL = 16; // ~60fps
  
  // --- Fonctions pour le chargement des mosquées ---
  const fetchNearbyMosques = async (retry = false, inBackground = false) => {
    try {
      // Ne jamais montrer l'état de chargement, tout se fait en arrière-plan
      if (inBackground) isUpdatingInBackground.current = true;
      
      // Vider le cache des mosquées pour forcer une nouvelle recherche
      localStorage.removeItem('mosque_cache');
      
      // Utiliser le service de géolocalisation amélioré qui gère IP et fallbacks
      const location = await getUserLocation();
      console.log(`Position obtenue via ${location.source || 'unknown'}: [${location.latitude}, ${location.longitude}]`);
      
      // Rayon de recherche adaptatif - commençons directement avec un rayon plus grand
      // - Premier essai: utiliser un rayon plus grand dès le début
      // - Essais suivants: rayon progressivement augmenté
      const baseRadius = 5000; // Commencer directement à 5km au lieu de 1000m
      const searchRadius = baseRadius + (loadAttempts * 3000);
      
      console.log(`Recherche de mosquées dans un rayon de ${searchRadius}m autour de [${location.latitude}, ${location.longitude}]`);
      
      const newMosques = await findMosquesNearby(location.latitude, location.longitude, searchRadius);
      
      if (newMosques.length === 0 && loadAttempts < 3) {
        // Prevent excessive retry attempts by checking if we're already retrying
        if (!retry) {
          setLoadAttempts(prev => prev + 1);
          console.log(`Aucune mosquée trouvée, augmentation du rayon (tentative ${loadAttempts + 1}/4)`);
          setTimeout(() => fetchNearbyMosques(true, inBackground), 1500);
        } else {
          console.log('Déjà en cours de nouvelle tentative, ignorer');
        }
        return;
      }
      
      // Tri précis par distance
      const sortedMosques = [...newMosques].sort((a, b) => {
        const distA = a.distance || Number.MAX_VALUE;
        const distB = b.distance || Number.MAX_VALUE;
        return distA - distB;
      });
      
      console.log(`${sortedMosques.length} mosquées trouvées, affichage des ${limit} plus proches`);
      
      // Mise à jour des données - Appliquer la limite de 20 mosquées
      setMosques(sortedMosques.slice(0, limit));
      setLoading(false);
      setError(null);
      
      // Afficher la section uniquement si nous avons des mosquées à montrer
      if (sortedMosques.length > 0) {
        setShouldShow(true);
      } else {
        setShouldShow(false);
      }
      
      // Réinitialiser le drapeau de mise à jour en arrière-plan
      if (inBackground) isUpdatingInBackground.current = false;
      
    } catch (err) {
      console.error('Erreur lors de la récupération des mosquées:', err);
      setError("Impossible de charger les mosquées à proximité");
      setLoading(false);
      setShouldShow(false);
      
      // Réinitialiser le drapeau de mise à jour en arrière-plan
      if (inBackground) isUpdatingInBackground.current = false;
    }
  };
  
  // Initialisation: charger les mosquées
  useEffect(() => {
    // Only fetch on initial mount, not on every limit/error change
    fetchNearbyMosques();
    
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        // Si nous venons de retrouver la connexion, mettre à jour en arrière-plan
        if (error || mosques.length === 0) {
          fetchNearbyMosques(false, false); // Mise à jour complète avec indicateur de chargement
        } else {
          // Sinon, mettre à jour silencieusement en arrière-plan
          fetchNearbyMosques(false, true);
        }
      } else {
        // Si nous perdons la connexion et n'avons pas de données, cacher la section
        if (mosques.length === 0) {
          setShouldShow(false);
        }
      }
    };
    
    // Mise à jour périodique en arrière-plan - use reasonable update interval (daily not every ms)
    const backgroundUpdateInterval = setInterval(() => {
      if (navigator.onLine && !isUpdatingInBackground.current) {
        fetchNearbyMosques(false, true);
      }
    }, 24 * 60 * 60 * 1000); // Mise à jour en arrière-plan une fois par jour
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(backgroundUpdateInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, not on every error/mosques.length/limit change
  
  // Supprimer le cache des mosquées au démarrage pour forcer la mise à jour
  useEffect(() => {
    // Force à vider le cache pour récupérer les nouvelles adresses
    localStorage.removeItem('mosque_cache');
    console.log("Cache des mosquées vidé au démarrage pour forcer le rafraîchissement des adresses");
  }, []);
  
  // --- Fonctions de défilement ---
  
  // Obtenir les dimensions et limites de défilement
  const getScrollLimits = () => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    
    if (!scroller || !content) {
      return { min: 0, max: 0, viewportWidth: 0, contentWidth: 0 };
    }
    
    const viewportWidth = scroller.clientWidth;
    const contentWidth = content.scrollWidth;
    
    return {
      min: 0,
      max: Math.max(0, contentWidth - viewportWidth),
      viewportWidth,
      contentWidth
    };
  };
  
  // Démarrer le défilement automatique
  const startAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
    
    autoScrollTimer.current = window.setInterval(() => {
      if (isPaused.current || isDragging.current) return;
      
      const { min, max } = getScrollLimits();
      
      // Si pas de contenu à faire défiler
      if (max <= 0) return;
      
      const scroller = scrollerRef.current;
      if (!scroller) return;
      
      let newScrollLeft = scroller.scrollLeft + AUTO_SCROLL_SPEED;
      
      // Boucle infinie: revenir au début si on atteint la fin
      // Utiliser une meilleure logique pour la détection de la fin
      if (newScrollLeft >= max - 1) { // -1 pour gérer les arrondis
        // Animation douce pour revenir au début
        scroller.scrollTo({
          left: min,
          behavior: 'auto' // 'auto' au lieu de 'smooth' pour éviter les sauts visuels
        });
        return; // Sortir pour ce cycle et attendre le prochain
      }
      
      scroller.scrollLeft = newScrollLeft;
    }, AUTO_SCROLL_INTERVAL);
  };
  
  // Arrêter le défilement automatique
  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };
  
  // Initialiser/nettoyer le défilement automatique
  useEffect(() => {
    if (!loading && mosques.length > 0) {
      startAutoScroll();
    }
    
    return () => {
      stopAutoScroll();
    };
  }, [loading, mosques.length]);
  
  // --- Gestionnaires d'événements ---
  
  // Gestion du survol
  const handleMouseEnter = () => {
    isPaused.current = true;
  };
  
  const handleMouseLeave = () => {
    isPaused.current = false;
  };
  
  // Gestion du glissement (drag)
  const handleDragStart = (clientX: number) => {
    isDragging.current = true;
    startX.current = clientX;
    
    const scroller = scrollerRef.current;
    if (scroller) {
      scrollLeft.current = scroller.scrollLeft;
    }
  };
  
  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    
    const scroller = scrollerRef.current;
    if (!scroller) return;
    
    const dx = startX.current - clientX;
    scroller.scrollLeft = scrollLeft.current + dx;
  };
  
  const handleDragEnd = () => {
    isDragging.current = false;
  };
  
  // Gestion du mousewheel et trackpad
  const handleWheel = (e: WheelEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    
    // Empêcher le scroll vertical de la page
    if (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0) {
      e.preventDefault();
    }
    
    const { min, max } = getScrollLimits();
    
    // Déterminer le delta à utiliser (prioriser deltaX pour trackpad)
    const deltaToUse = Math.abs(e.deltaX) > 0 ? e.deltaX : e.deltaY;
    
    // Calculer la nouvelle position
    let newScrollLeft = scroller.scrollLeft + deltaToUse;
    
    // Gérer le bouclage
    if (newScrollLeft < min) {
      newScrollLeft = max; // Aller à la fin si on dépasse le début
    } else if (newScrollLeft > max) {
      newScrollLeft = min; // Aller au début si on dépasse la fin
    }
    
    // Appliquer le défilement
    scroller.scrollLeft = newScrollLeft;
  };
  
  // Gestionnaires pour les événements souris
  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
  
  // Gestionnaires pour les événements tactiles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleDragStart(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) handleDragMove(e.touches[0].clientX);
  };
  
  const handleTouchEnd = () => handleDragEnd();
  
  // Attacher les écouteurs d'événements
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    
    // Gestionnaire wheel pour trackpad
    const wheelHandler = (e: WheelEvent) => handleWheel(e);
    scroller.addEventListener('wheel', wheelHandler, { passive: false });
    
    // Gestionnaires pour le document entier pour capturer les événements même hors du conteneur
    const handleDocumentMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const handleDocumentMouseUp = () => handleDragEnd();
    
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    
    return () => {
      scroller.removeEventListener('wheel', wheelHandler);
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, []);
  
  // --- Fonctions d'affichage ---
  
  const formatDistance = (distance: number | undefined): string => {
    if (distance === undefined) return "Distance inconnue";
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(1)} km`;
  };
  
  const formatRating = (rating: number | undefined): string => {
    if (rating === undefined) return "";
    return rating.toFixed(1);
  };
  
  const formatAddress = (mosque: Mosque): string => {
    // Forcer l'affichage de l'adresse pour toutes les mosquées
    // Si l'adresse contient "Adresse non disponible", afficher l'adresse alternée
    if (mosque.address && !mosque.address.includes('Adresse non disponible') && mosque.address !== 'Adresse inconnue') {
      return mosque.address;
    }
    
    // Si l'adresse est manquante ou "non disponible" et que les coordonnées sont disponibles
    // Créer une adresse générique basée sur le nom de la mosquée
    if (mosque.latitude && mosque.longitude) {
      return `${mosque.name} (${mosque.latitude.toFixed(5)}, ${mosque.longitude.toFixed(5)})`;
    }
    
    return 'Adresse non disponible';
  };
  
  // --- Ouverture dans Google Maps ---
  const openInMaps = (mosque: Mosque, fromButton = false) => {
    // Si c'est un clic sur la carte entière, on vérifie qu'on n'est pas en train de glisser
    // Si c'est un clic sur le bouton, on ignore cette vérification
    if (!fromButton && isDragging.current) return;
    
    // Afficher un log pour le débogage
    console.log('Tentative d\'ouverture de la carte pour:', mosque.name, 'ID:', mosque.id);
    
    const lat = mosque.latitude || 0;
    const lng = mosque.longitude || 0;
    
    if (lat === 0 || lng === 0) {
      console.error('Coordonnées GPS manquantes pour:', mosque.name);
      return;
    }
    
    // Construire la requête de recherche pour le fallback
    let searchQuery = mosque.name;
    if (mosque.address && !mosque.address.includes('Adresse')) {
      searchQuery += ', ' + mosque.address;
    }
    
    // Déterminer le meilleur format d'URL
    let primaryUrl = '';
    const fallbackUrls: string[] = [];
    
    // Format 1 (Prioritaire): Utiliser le Place ID si disponible (probablement de Google)
    if (mosque.id && !mosque.id.startsWith('osm-') && !mosque.id.startsWith('mock-')) {
      console.log('Utilisation du Place ID pour l\'URL:', mosque.id);
      primaryUrl = `https://www.google.com/maps/place/?q=place_id:${mosque.id}`;
      // Fallbacks pour Place ID
      fallbackUrls.push(`https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@${lat},${lng},17z`);
      fallbackUrls.push(`https://www.google.com/maps?q=${lat},${lng}`);
    } else {
      // Format 2 (Prioritaire si pas de Place ID): Recherche avec nom/adresse + coordonnées
      console.log('Utilisation de la recherche Nom/Adresse + Coordonnées pour l\'URL');
      primaryUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@${lat},${lng},17z`;
      // Fallbacks pour recherche Nom/Adresse
      fallbackUrls.push(`https://www.google.com/maps?q=${lat},${lng}`);
    }
    
    const allUrlsToTry = [primaryUrl, ...fallbackUrls];
    
    console.log('URLs à essayer (par ordre de priorité):', allUrlsToTry);
    
    // Fonction pour essayer d'ouvrir une URL
    const tryOpenUrl = async (urlToOpen: string): Promise<boolean> => {
      try {
        if (window.electronAPI && window.electronAPI.openExternal) {
          console.log('Ouverture via Electron API avec:', urlToOpen);
          await window.electronAPI.openExternal(urlToOpen); 
        } else {
          console.log('Ouverture via window.open (navigateur) avec:', urlToOpen);
          window.open(urlToOpen, '_blank', 'noopener,noreferrer');
        }
        return true; // Succès
      } catch (error) {
        console.error(`Erreur lors de l\'ouverture de ${urlToOpen}:`, error);
        return false; // Échec
      }
    };
    
    // Essayer chaque URL jusqu'à ce que l'une fonctionne
    (async () => {
      let opened = false;
      for (let i = 0; i < allUrlsToTry.length; i++) {
        console.log(`Tentative avec URL #${i + 1}: ${allUrlsToTry[i]}`);
        opened = await tryOpenUrl(allUrlsToTry[i]);
        if (opened) {
          console.log(`Ouverture réussie avec URL #${i + 1}`);
          break; // Sortir de la boucle si succès
        }
      }
      
      if (!opened) {
        console.error('Toutes les tentatives d\'ouverture de Google Maps ont échoué.');
        alert(`Impossible d'ouvrir les cartes pour ${mosque.name}. Coordonnées: ${lat}, ${lng}`);
      }
      
      // S'assurer que le défilement reprendra après l'action, même en cas d'échec
      setTimeout(() => {
        isPaused.current = false;
      }, 150); // Léger délai supplémentaire
    })();
    
  };
  
  // --- Rafraîchir les données ---
  const handleRefresh = () => {
    // Réinitialiser les tentatives
    setLoadAttempts(0);
    // Effacer explicitement le cache des mosquées
    localStorage.removeItem('mosque_cache');
    // Forcer une nouvelle recherche
    fetchNearbyMosques(false, false);
  };
  
  // --- Rendu conditionnel ---
  
  if (!shouldShow && !loading) {
    return null;
  }
  
  if (loading) {
    return null; // Ne rien afficher pendant le chargement
  }
  
  if (mosques.length === 0 || error) {
    return (
      <div className="mt-4 relative">
        <div className="bg-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-300 mb-4">
            {error || "Aucune mosquée n'a été trouvée à proximité."}
          </p>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            Rechercher à nouveau
          </button>
        </div>
      </div>
    );
  }
  
  // --- Rendu principal ---
  
  return (
    <div 
      className="bg-[#1b1e36]/90 backdrop-blur-md select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative will-change-transform py-0.5">
        {/* Conteneur de défilement avec gestion native du scroll */}
        <div 
          ref={scrollerRef}
          className="overflow-x-auto scrollbar-hide pb-1 pt-0.5 px-7 will-change-transform cursor-grab"
          style={{ 
            height: '130px',
            scrollBehavior: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE/Edge
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Contenu défilable */}
          <div 
            ref={contentRef}
            className="flex space-x-2 min-w-max" // min-w-max important pour que le conteneur s'étende correctement
          >
            {mosques.map((mosque, index) => (
              <motion.div
                key={mosque.id}
                className="flex-shrink-0 bg-[#363B60]/90 backdrop-blur-sm rounded-xl p-2 min-w-[220px] max-w-[220px] border border-[#464c7d]/70 flex flex-col overflow-hidden"
                whileHover={{ 
                  backgroundColor: "#3c416c",
                  borderColor: "#5a5d97",
                  y: -1
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.25,
                  delay: index * 0.05, 
                  ease: "easeOut"
                }}
                onClick={() => openInMaps(mosque, false)}
              >
                {/* Affichage de l'image en haut */} 
                {mosque.imageUrl && (
                  <img 
                    src={mosque.imageUrl} 
                    alt={`Image de ${mosque.name}`}
                    className="w-full h-[40px] object-cover mb-1.5 rounded-t-md"
                    loading="lazy"
                  />
                )}
                
                {/* Contenu textuel */} 
                <div className="flex justify-between items-start px-1 flex-grow">
                  <div className="flex-grow mr-1 overflow-hidden">
                    <h4 className="font-semibold text-[12px] text-white truncate">
                      {mosque.name}
                    </h4>
                    
                    <p className="text-[9px] text-[#8d91b0] mt-0.5 truncate">
                      {formatAddress(mosque)}
                    </p>

                    <div className="flex items-center mt-1 space-x-1.5">
                      <span 
                        className="flex items-center text-[9px] font-medium text-[#9966cc]"
                      >
                        {formatDistance(mosque.distance)}
                      </span>
                      
                      {mosque.rating && (
                        <div className="flex items-center text-[#bb99dd]">
                          <FiStar className="mr-0.5" size={7} fill="currentColor" />
                          <span className="text-[8px] font-medium">{formatRating(mosque.rating)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <motion.div 
                    className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#363B60]/90 backdrop-blur-sm border border-[#464c7d]/70 mt-1"
                    whileHover={{ scale: 1.08, backgroundColor: "#3c416c" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation(); 
                      e.preventDefault();  
                      openInMaps(mosque, true);
                      
                      setTimeout(() => {
                        if (isDragging.current) {
                          isDragging.current = false;
                        }
                        isPaused.current = false;
                      }, 200);
                    }}
                  >
                    <FiMapPin size={9} className="text-[#007AFF]" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Ajouter cette classe utilitaire pour masquer la scrollbar
// mais garder la fonctionnalité de défilement
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Ajouter les styles au document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarHideStyles;
  document.head.appendChild(styleElement);
}

export default NearbyMosques; 
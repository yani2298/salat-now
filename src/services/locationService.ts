import { secureAxios } from './axios-config';
import { getCachedLocation } from './prayerService';

// Cache des résultats en mémoire
const LOCATION_SUGGESTIONS_CACHE: Record<string, any[]> = {};
const LOCATION_REVERSE_CACHE: Record<string, any> = {};

// Noms des stores IndexedDB
const DB_NAME = 'salat_now_location_db';
const DB_VERSION = 1;
const SUGGESTIONS_STORE = 'location_suggestions';
const SETTINGS_STORE = 'location_settings';
const REVERSE_STORE = 'location_reverse';

// Durées d'expiration en millisecondes
const SUGGESTIONS_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours
// Cette constante sera utilisée ultérieurement pour le cache de géocodage inverse
// @ts-ignore
const REVERSE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;      // 7 jours

// Clés pour le stockage local
const LOCATION_CACHE_KEY = 'user_location';
const LOCATION_CACHE_EXPIRY_KEY = 'location_cache_expiry';
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

// Interface pour les données de localisation
export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  source?: string; // 'gps', 'ip', 'cache', 'default'
}

/**
 * Initialise la base de données IndexedDB
 */
const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Erreur lors de l\'ouverture de la base de données:', event);
      reject(new Error('Erreur lors de l\'ouverture de la base de données'));
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store pour les suggestions de villes
      if (!db.objectStoreNames.contains(SUGGESTIONS_STORE)) {
        const suggestionsStore = db.createObjectStore(SUGGESTIONS_STORE, { keyPath: 'query' });
        suggestionsStore.createIndex('expiryTime', 'expiryTime', { unique: false });
      }
      
      // Store pour les paramètres de localisation
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
      
      // Store pour le cache de géocodage inverse
      if (!db.objectStoreNames.contains(REVERSE_STORE)) {
        const reverseStore = db.createObjectStore(REVERSE_STORE, { keyPath: 'coordinates' });
        reverseStore.createIndex('expiryTime', 'expiryTime', { unique: false });
      }
    };
  });
};

// Initialiser le cache depuis IndexedDB au démarrage
const loadSuggestionsCache = async () => {
  try {
    // Compatibilité pour les anciens navigateurs
    if (!window.indexedDB) {
      const cachedData = localStorage.getItem('location_suggestions_cache');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return {};
    }

    const db = await initDatabase();
    return new Promise<Record<string, any[]>>((resolve) => {
      const transaction = db.transaction(SUGGESTIONS_STORE, 'readonly');
      const store = transaction.objectStore(SUGGESTIONS_STORE);
      const now = Date.now();
      
      // Récupérer toutes les entrées non expirées
      const request = store.openCursor();
      const result: Record<string, any[]> = {};
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.expiryTime > now) {
            result[cursor.value.query] = cursor.value.suggestions;
          }
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      
      request.onerror = (event) => {
        console.error('Erreur lors du chargement du cache des suggestions:', event);
        resolve({});
      };
    });
  } catch (error) {
    console.error('Erreur lors du chargement du cache des suggestions:', error);
    return {};
  }
};

// Sauvegarde le cache des suggestions
export const saveSuggestionsCache = async (cache: Record<string, any[]>) => {
  try {
    // Compatibilité pour les anciens navigateurs
    if (!window.indexedDB) {
      localStorage.setItem('location_suggestions_cache', JSON.stringify(cache));
      return;
    }
    
    const db = await initDatabase();
    const transaction = db.transaction(SUGGESTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(SUGGESTIONS_STORE);
    const now = Date.now();
    const expiryTime = now + SUGGESTIONS_CACHE_DURATION;
    
    // Sauvegarder chaque entrée avec une date d'expiration
    for (const [query, suggestions] of Object.entries(cache)) {
      store.put({
        query,
        suggestions,
        expiryTime
      });
    }
    
    transaction.oncomplete = () => {
      console.log('Cache des suggestions sauvegardé dans IndexedDB');
    };
    
    transaction.onerror = (event) => {
      console.error('Erreur lors de la sauvegarde du cache des suggestions:', event);
      // Fallback vers localStorage
      localStorage.setItem('location_suggestions_cache', JSON.stringify(cache));
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du cache des suggestions:', error);
    // Fallback vers localStorage
    localStorage.setItem('location_suggestions_cache', JSON.stringify(cache));
  }
};

// Initialisation async des caches
(async () => {
  const suggestionsCache = await loadSuggestionsCache();
  Object.assign(LOCATION_SUGGESTIONS_CACHE, suggestionsCache);
})();

export interface LocationSuggestion {
  id: string;
  name: string;
  country: string;
  countryCode: string;
}

// Cache pour les résultats de recherche récents
const suggestionCache: Record<string, LocationSuggestion[]> = {};

/**
 * Récupère les suggestions de villes basées sur le terme de recherche
 * Utilise l'API Nominatim d'OpenStreetMap pour des résultats mondiaux
 */
export const getCitySuggestions = async (searchTerm: string): Promise<LocationSuggestion[]> => {
  // Si le terme de recherche est vide ou trop court, retourner quelques villes populaires
  if (!searchTerm || searchTerm.trim().length < 2) {
    return getPopularCities();
  }

  // Vérifier si les résultats sont dans le cache
  const cacheKey = searchTerm.toLowerCase().trim();
  if (suggestionCache[cacheKey]) {
    console.log(`Utilisation du cache pour "${cacheKey}"`);
    return suggestionCache[cacheKey];
  }

  try {
    // Utiliser l'API Nominatim d'OpenStreetMap pour une base de données mondiale
    const endpoint = `https://nominatim.openstreetmap.org/search`;
    const params = new URLSearchParams({
      q: searchTerm,
      format: 'json',
      addressdetails: '1',
      limit: '15',
      'accept-language': 'fr',
      featureType: 'city'
    });

    console.log(`Recherche de villes pour "${searchTerm}"...`);
    
    const response = await secureAxios.get(`${endpoint}?${params.toString()}`);
    
    if (response.data && Array.isArray(response.data)) {
      const suggestions: LocationSuggestion[] = response.data
        .filter(item => item.type === 'city' || item.type === 'administrative' || item.class === 'place')
        .map((item, index) => {
          const city = item.address?.city || item.address?.town || item.address?.village || item.name;
          const country = item.address?.country || '';
          const countryCode = item.address?.country_code?.toUpperCase() || '';
          
          return {
            id: `${index}-${item.place_id}`,
            name: city,
            country: country,
            countryCode: countryCode
          };
        })
        .filter(item => item.name && item.country); // Éliminer les résultats sans nom ou pays
      
      // Mettre en cache les résultats
      suggestionCache[cacheKey] = suggestions;
      
      // Sauvegarder dans le cache persistant
      saveSuggestionsToStorage(cacheKey, suggestions);
      
      console.log(`Trouvé ${suggestions.length} suggestions pour "${searchTerm}"`);
      return suggestions;
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions de villes:', error);
    
    // En cas d'erreur, utiliser le fallback avec les données mockées
    const fallbackResults = getMockCitySuggestions(searchTerm);
    
    // Mettre en cache même les résultats de fallback
    suggestionCache[cacheKey] = fallbackResults;
    
    return fallbackResults;
  }
};

/**
 * Sauvegarde les suggestions dans le stockage persistant (IndexedDB)
 */
const saveSuggestionsToStorage = async (query: string, suggestions: LocationSuggestion[]) => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction(SUGGESTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(SUGGESTIONS_STORE);
    const now = Date.now();
    const expiryTime = now + SUGGESTIONS_CACHE_DURATION;
    
    // Sauvegarder avec une date d'expiration
    store.put({
      query,
      suggestions,
      expiryTime
    });
    
    console.log(`Suggestions pour "${query}" sauvegardées dans le stockage persistant`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des suggestions:', error);
  }
};

/**
 * Retourne une liste de villes populaires à travers le monde
 */
const getPopularCities = (): LocationSuggestion[] => {
  return [
    // France
    { id: '1', name: 'Paris', country: 'France', countryCode: 'FR' },
    { id: '2', name: 'Lyon', country: 'France', countryCode: 'FR' },
    { id: '3', name: 'Marseille', country: 'France', countryCode: 'FR' },
    // Maghreb
    { id: '11', name: 'Rabat', country: 'Maroc', countryCode: 'MA' },
    { id: '12', name: 'Casablanca', country: 'Maroc', countryCode: 'MA' },
    { id: '20', name: 'Alger', country: 'Algérie', countryCode: 'DZ' },
    { id: '24', name: 'Tunis', country: 'Tunisie', countryCode: 'TN' },
    // Moyen-Orient et Asie
    { id: '38', name: 'La Mecque', country: 'Arabie Saoudite', countryCode: 'SA' },
    { id: '34', name: 'Le Caire', country: 'Égypte', countryCode: 'EG' },
    { id: '35', name: 'Istanbul', country: 'Turquie', countryCode: 'TR' },
    // Autres régions du monde
    { id: '42', name: 'Londres', country: 'Royaume-Uni', countryCode: 'GB' },
    { id: '43', name: 'Madrid', country: 'Espagne', countryCode: 'ES' },
    { id: '50', name: 'New York', country: 'États-Unis', countryCode: 'US' },
    { id: '51', name: 'Tokyo', country: 'Japon', countryCode: 'JP' },
    { id: '52', name: 'Sydney', country: 'Australie', countryCode: 'AU' },
  ];
};

/**
 * Génère des suggestions de villes simulées pour le fallback
 */
const getMockCitySuggestions = (searchTerm: string): LocationSuggestion[] => {
  console.log('Utilisation du fallback pour les suggestions avec le terme:', searchTerm);
  
  const mockCities = [
    // France
    { id: '1', name: 'Paris', country: 'France', countryCode: 'FR' },
    { id: '2', name: 'Lyon', country: 'France', countryCode: 'FR' },
    { id: '3', name: 'Marseille', country: 'France', countryCode: 'FR' },
    { id: '4', name: 'Bordeaux', country: 'France', countryCode: 'FR' },
    { id: '5', name: 'Toulouse', country: 'France', countryCode: 'FR' },
    { id: '6', name: 'Nice', country: 'France', countryCode: 'FR' },
    { id: '7', name: 'Nantes', country: 'France', countryCode: 'FR' },
    { id: '8', name: 'Strasbourg', country: 'France', countryCode: 'FR' },
    { id: '9', name: 'Montpellier', country: 'France', countryCode: 'FR' },
    { id: '10', name: 'Lille', country: 'France', countryCode: 'FR' },
    // Maroc
    { id: '11', name: 'Rabat', country: 'Maroc', countryCode: 'MA' },
    { id: '12', name: 'Casablanca', country: 'Maroc', countryCode: 'MA' },
    { id: '13', name: 'Fez', country: 'Maroc', countryCode: 'MA' },
    { id: '14', name: 'Marrakech', country: 'Maroc', countryCode: 'MA' },
    { id: '15', name: 'Tanger', country: 'Maroc', countryCode: 'MA' },
    { id: '16', name: 'Agadir', country: 'Maroc', countryCode: 'MA' },
    { id: '17', name: 'Meknès', country: 'Maroc', countryCode: 'MA' },
    { id: '18', name: 'Oujda', country: 'Maroc', countryCode: 'MA' },
    { id: '19', name: 'Tétouan', country: 'Maroc', countryCode: 'MA' },
    // Algérie
    { id: '20', name: 'Alger', country: 'Algérie', countryCode: 'DZ' },
    { id: '21', name: 'Oran', country: 'Algérie', countryCode: 'DZ' },
    { id: '22', name: 'Constantine', country: 'Algérie', countryCode: 'DZ' },
    { id: '23', name: 'Annaba', country: 'Algérie', countryCode: 'DZ' },
    // Tunisie
    { id: '24', name: 'Tunis', country: 'Tunisie', countryCode: 'TN' },
    { id: '25', name: 'Sfax', country: 'Tunisie', countryCode: 'TN' },
    { id: '26', name: 'Sousse', country: 'Tunisie', countryCode: 'TN' },
    { id: '27', name: 'Zarzis', country: 'Tunisie', countryCode: 'TN' },
    { id: '28', name: 'Monastir', country: 'Tunisie', countryCode: 'TN' },
    { id: '29', name: 'Djerba', country: 'Tunisie', countryCode: 'TN' },
    { id: '30', name: 'Hammamet', country: 'Tunisie', countryCode: 'TN' },
    // Moyen-Orient
    { id: '31', name: 'Doha', country: 'Qatar', countryCode: 'QA' },
    { id: '32', name: 'Dubai', country: 'Émirats Arabes Unis', countryCode: 'AE' },
    { id: '33', name: 'Abu Dhabi', country: 'Émirats Arabes Unis', countryCode: 'AE' },
    { id: '34', name: 'Le Caire', country: 'Égypte', countryCode: 'EG' },
    { id: '35', name: 'Istanbul', country: 'Turquie', countryCode: 'TR' },
    { id: '36', name: 'Ankara', country: 'Turquie', countryCode: 'TR' },
    { id: '37', name: 'Riyad', country: 'Arabie Saoudite', countryCode: 'SA' },
    { id: '38', name: 'Médine', country: 'Arabie Saoudite', countryCode: 'SA' },
    { id: '39', name: 'La Mecque', country: 'Arabie Saoudite', countryCode: 'SA' },
    // Asie
    { id: '40', name: 'Jakarta', country: 'Indonésie', countryCode: 'ID' },
    { id: '41', name: 'Kuala Lumpur', country: 'Malaisie', countryCode: 'MY' },
    // Europe
    { id: '42', name: 'Londres', country: 'Royaume-Uni', countryCode: 'GB' },
    { id: '43', name: 'Madrid', country: 'Espagne', countryCode: 'ES' },
    { id: '44', name: 'Rome', country: 'Italie', countryCode: 'IT' },
    { id: '45', name: 'Berlin', country: 'Allemagne', countryCode: 'DE' },
    { id: '46', name: 'Bruxelles', country: 'Belgique', countryCode: 'BE' },
    // Amérique du Nord
    { id: '50', name: 'New York', country: 'États-Unis', countryCode: 'US' },
    { id: '51', name: 'Los Angeles', country: 'États-Unis', countryCode: 'US' },
    { id: '52', name: 'Toronto', country: 'Canada', countryCode: 'CA' },
    { id: '53', name: 'Mexico', country: 'Mexique', countryCode: 'MX' },
    // Asie de l'Est
    { id: '60', name: 'Tokyo', country: 'Japon', countryCode: 'JP' },
    { id: '61', name: 'Séoul', country: 'Corée du Sud', countryCode: 'KR' },
    { id: '62', name: 'Pékin', country: 'Chine', countryCode: 'CN' },
    { id: '63', name: 'Shanghai', country: 'Chine', countryCode: 'CN' },
    // Océanie
    { id: '70', name: 'Sydney', country: 'Australie', countryCode: 'AU' },
    { id: '71', name: 'Melbourne', country: 'Australie', countryCode: 'AU' },
    { id: '72', name: 'Auckland', country: 'Nouvelle-Zélande', countryCode: 'NZ' },
  ];

  // Si le terme de recherche est vide, retourner quelques villes populaires
  if (!searchTerm || searchTerm.trim() === '') {
    return mockCities.slice(0, 15); // Retourne les 15 premières villes
  }

  // Filtrer les villes qui correspondent au terme de recherche
  const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
  
  // Premier filtre: recherche stricte au début des noms de ville
  const strictMatches = mockCities.filter(
    city => city.name.toLowerCase().startsWith(lowercaseSearchTerm)
  );
  
  // Deuxième filtre: recherche partielle dans les noms de ville ou pays
  const partialMatches = mockCities.filter(
    city => 
      !city.name.toLowerCase().startsWith(lowercaseSearchTerm) && (
        city.name.toLowerCase().includes(lowercaseSearchTerm) || 
        city.country.toLowerCase().includes(lowercaseSearchTerm)
      )
  );
  
  // Combiner les résultats en donnant la priorité aux correspondances strictes
  const combinedResults = [...strictMatches, ...partialMatches];
  
  console.log(`Trouvé ${combinedResults.length} suggestions mockées pour "${searchTerm}"`);
  
  // Limiter à 15 résultats maximum pour éviter une liste trop longue
  return combinedResults.slice(0, 15);
};

/**
 * Récupère les coordonnées d'une ville et d'un pays spécifiés
 */
export const getCoordinatesForCity = async (city: string, country: string): Promise<{ lat: number; lon: number } | null> => {
  if (!city) return null;
  
  // Créer une clé de cache pour cette recherche
  const cacheKey = `${city.toLowerCase()},${country.toLowerCase()}`;
  
  // Vérifier si les coordonnées sont en cache
  const cachedCoords = localStorage.getItem(`city_coords_${cacheKey}`);
  if (cachedCoords) {
    try {
      const coords = JSON.parse(cachedCoords);
      console.log(`Utilisation des coordonnées en cache pour ${city}, ${country}`);
      return coords;
    } catch (error) {
      console.error('Erreur lors de la lecture des coordonnées en cache:', error);
      // Continuer avec la recherche en ligne en cas d'erreur
    }
  }
  
  try {
    // Utiliser l'API Nominatim d'OpenStreetMap pour trouver les coordonnées
    const endpoint = `https://nominatim.openstreetmap.org/search`;
    const searchQuery = country ? `${city}, ${country}` : city;
    
    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      limit: '1',
      'accept-language': 'fr'
    });
    
    console.log(`Recherche de coordonnées pour ${searchQuery}...`);
    
    const response = await secureAxios.get(`${endpoint}?${params.toString()}`);
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const result = response.data[0];
      const coordinates = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
      
      // Sauvegarder les coordonnées en cache
      localStorage.setItem(`city_coords_${cacheKey}`, JSON.stringify(coordinates));
      
      console.log(`Coordonnées trouvées pour ${city}, ${country}:`, coordinates);
      return coordinates;
    }
    
    // Si aucun résultat n'est trouvé, utiliser les coordonnées mockées
    console.log(`Aucune coordonnée trouvée pour ${city}, ${country}. Utilisation des données mockées.`);
    const mockCoords = getMockCoordinates(city);
    
    // Sauvegarder même les coordonnées mockées en cache
    localStorage.setItem(`city_coords_${cacheKey}`, JSON.stringify(mockCoords));
    
    return mockCoords;
  } catch (error) {
    console.error('Erreur lors de la récupération des coordonnées:', error);
    
    // En cas d'erreur, utiliser les données mockées
    const mockCoords = getMockCoordinates(city);
    return mockCoords;
  }
};

/**
 * Génère des coordonnées simulées pour le développement (fallback)
 */
const getMockCoordinates = (city: string): { lat: number; lon: number } => {
  const mockCoordinates: Record<string, { lat: number; lon: number }> = {
    'Paris': { lat: 48.8566, lon: 2.3522 },
    'Lyon': { lat: 45.7578, lon: 4.8320 },
    'Marseille': { lat: 43.2965, lon: 5.3698 },
    'Rabat': { lat: 34.0209, lon: -6.8416 },
    'Casablanca': { lat: 33.5731, lon: -7.5898 },
    'Marrakech': { lat: 31.6295, lon: -7.9811 },
    'Alger': { lat: 36.7538, lon: 3.0588 },
    'Tunis': { lat: 36.8065, lon: 10.1815 },
    'Doha': { lat: 25.2854, lon: 51.5310 },
    'Dubai': { lat: 25.2048, lon: 55.2708 },
    'Le Caire': { lat: 30.0444, lon: 31.2357 },
    'Istanbul': { lat: 41.0082, lon: 28.9784 },
    'New York': { lat: 40.7128, lon: -74.0060 },
    'Los Angeles': { lat: 34.0522, lon: -118.2437 },
    'Londres': { lat: 51.5074, lon: -0.1278 },
    'Tokyo': { lat: 35.6762, lon: 139.6503 },
    'Sydney': { lat: -33.8688, lon: 151.2093 },
    'Rio de Janeiro': { lat: -22.9068, lon: -43.1729 },
    'Le Cap': { lat: -33.9249, lon: 18.4241 },
    'Moscou': { lat: 55.7558, lon: 37.6173 },
    'Berlin': { lat: 52.5200, lon: 13.4050 },
    'Madrid': { lat: 40.4168, lon: -3.7038 },
    'Rome': { lat: 41.9028, lon: 12.4964 },
    'Mexico': { lat: 19.4326, lon: -99.1332 },
    'Jakarta': { lat: -6.2088, lon: 106.8456 },
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Delhi': { lat: 28.7041, lon: 77.1025 },
    'La Mecque': { lat: 21.4225, lon: 39.8262 },
    'Médine': { lat: 24.5247, lon: 39.5692 },
  };

  // Retourner les coordonnées si disponibles, sinon utiliser Paris comme valeur par défaut
  return mockCoordinates[city] || { lat: 48.8566, lon: 2.3522 };
};

/**
 * Fonction pour convertir les coordonnées en adresse (géocodage inverse)
 * Utilise l'API Nominatim d'OpenStreetMap pour obtenir des données précises
 */
export const reverseGeocode = async (lat: number, lon: number): Promise<{ city: string; country: string } | null> => {
  if (!lat || !lon) return null;
  
  // Créer une clé de cache pour ces coordonnées
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  
  // Vérifier si les données sont en cache
  if (LOCATION_REVERSE_CACHE[cacheKey]) {
    console.log('Utilisation du cache pour la géolocalisation inverse:', cacheKey);
    return LOCATION_REVERSE_CACHE[cacheKey];
  }
  
  try {
    // Utiliser l'API Nominatim d'OpenStreetMap pour le géocodage inverse
    const endpoint = `https://nominatim.openstreetmap.org/reverse`;
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      'accept-language': 'fr',
      zoom: '10' // Niveau 10 correspond généralement aux villes
    });
    
    console.log(`Géocodage inverse pour les coordonnées ${lat}, ${lon}...`);
    
    const response = await secureAxios.get(`${endpoint}?${params.toString()}`);
    
    if (response.data && response.data.address) {
      const address = response.data.address;
      
      // Extraire la ville et le pays des résultats
      // Nominatim peut retourner différents niveaux administratifs
      const city = address.city || address.town || address.village || address.hamlet || address.municipality || '';
      const country = address.country || '';
      
      const result = { city, country };
      
      // Mettre en cache les résultats
      LOCATION_REVERSE_CACHE[cacheKey] = result;
      
      console.log(`Localisation trouvée: ${city}, ${country}`);
      return result;
    }
    
    // Si aucun résultat n'est trouvé, utiliser les données mockées
    console.log('Aucune localisation trouvée. Utilisation des données mockées.');
    return getFallbackLocation(lat, lon);
  } catch (error) {
    console.error('Erreur lors du géocodage inverse:', error);
    
    // En cas d'erreur, utiliser les données mockées
    return getFallbackLocation(lat, lon);
  }
};

/**
 * Obtenir une localisation de secours à partir des coordonnées
 */
const getFallbackLocation = (latitude: number, longitude: number): { city: string; country: string } => {
  // Trouver la ville la plus proche dans notre liste de coordonnées connues
  const mockCities: Record<string, { lat: number; lon: number; country: string }> = {
    'Paris': { lat: 48.8566, lon: 2.3522, country: 'France' },
    'Lyon': { lat: 45.7578, lon: 4.8320, country: 'France' },
    'Marseille': { lat: 43.2965, lon: 5.3698, country: 'France' },
    'Rabat': { lat: 34.0209, lon: -6.8416, country: 'Maroc' },
    'Casablanca': { lat: 33.5731, lon: -7.5898, country: 'Maroc' },
    'Marrakech': { lat: 31.6295, lon: -7.9811, country: 'Maroc' },
    'Alger': { lat: 36.7538, lon: 3.0588, country: 'Algérie' },
    'Tunis': { lat: 36.8065, lon: 10.1815, country: 'Tunisie' },
    'Doha': { lat: 25.2854, lon: 51.5310, country: 'Qatar' },
    'Dubai': { lat: 25.2048, lon: 55.2708, country: 'Émirats Arabes Unis' },
    'Le Caire': { lat: 30.0444, lon: 31.2357, country: 'Égypte' },
    'Istanbul': { lat: 41.0082, lon: 28.9784, country: 'Turquie' },
    'New York': { lat: 40.7128, lon: -74.0060, country: 'États-Unis' },
    'Londres': { lat: 51.5074, lon: -0.1278, country: 'Royaume-Uni' },
    'Tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japon' },
    'La Mecque': { lat: 21.4225, lon: 39.8262, country: 'Arabie Saoudite' },
  };
  
  let closestCity = 'Paris';
  let minDistance = Number.MAX_VALUE;
  
  for (const [city, coords] of Object.entries(mockCities)) {
    const distance = Math.sqrt(
      Math.pow(latitude - coords.lat, 2) + 
      Math.pow(longitude - coords.lon, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }
  
  // Obtenir le pays correspondant à la ville la plus proche
  const country = mockCities[closestCity].country;
  
  return { city: closestCity, country };
};

/**
 * Obtenir une localisation depuis des coordonnées GPS
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise avec la ville et le pays
 */
export const getLocationFromCoordinates = async (latitude: number, longitude: number): Promise<{city: string, country: string}> => {
  try {
    console.log('Récupération de la localisation depuis les coordonnées:', latitude, longitude);
    
    // Utiliser notre fonction reverseGeocode améliorée
    const result = await reverseGeocode(latitude, longitude);
    
    if (result && result.city && result.country) {
      return result;
    }
    
    // Si le géocodage inverse n'a pas fonctionné, utiliser les valeurs par défaut
    console.warn('Le géocodage inverse n\'a pas retourné de résultats complets');
    return { city: 'Paris', country: 'France' };
  } catch (error) {
    console.error('Erreur lors de la géolocalisation inverse:', error);
    // Valeurs par défaut en cas d'erreur
    return { city: 'Paris', country: 'France' };
  }
};

// Fonction pour gérer les erreurs de géolocalisation
const handleGeolocationError = (error: GeolocationPositionError) => {
  let errorMessage = 'Erreur inconnue de géolocalisation';
  let shouldOpenSettings = false;
  let detailedInstructions = '';
  
  // Déterminer le système d'exploitation
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const isWindows = /Win/.test(navigator.userAgent);
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      shouldOpenSettings = true;
      
      if (isMac) {
        detailedInstructions = 'Allez dans Réglages système > Confidentialité et sécurité > Service de localisation et activez l\'autorisation pour cette application.';
      } else if (isWindows) {
        detailedInstructions = 'Allez dans Paramètres > Confidentialité > Emplacement et activez l\'accès à l\'emplacement pour cette application.';
      } else {
        detailedInstructions = 'Accédez aux paramètres de confidentialité de votre système et activez l\'accès à la localisation pour cette application.';
      }
      
      errorMessage = `L'accès à votre position a été refusé. ${detailedInstructions}`;
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = "Votre position actuelle n'est pas disponible. Vérifiez que le Wi-Fi ou le GPS est activé sur votre appareil.";
      break;
    case error.TIMEOUT:
      errorMessage = "La demande de géolocalisation a expiré. Vérifiez votre connexion internet et réessayez.";
      break;
  }
  
  // Si on est sur Electron et qu'on a accès à window.electronAPI
  if (shouldOpenSettings && window.electronAPI && window.electronAPI.openSystemPreferences) {
    // Vérifier si on a déjà tenté d'ouvrir les préférences récemment
    const lastSettingsOpen = localStorage.getItem('last_settings_open');
    const now = Date.now();
    
    if (!lastSettingsOpen || (now - parseInt(lastSettingsOpen)) > 60000) {
      // Si on n'a pas ouvert les préférences depuis plus d'une minute
      
      // Enregistrer le moment de cette tentative
      localStorage.setItem('last_settings_open', now.toString());
      
    // Afficher une notification avec des instructions détaillées
    window.electronAPI.showNotification({
      title: 'Autorisation de localisation requise',
      body: errorMessage
    });
    
    // Ouvrir les préférences système pour la géolocalisation
    window.electronAPI.openSystemPreferences('location');
    } else {
      console.log('Évitement de la boucle d\'ouverture des préférences système');
    }
  }
  
  return new Error(errorMessage);
};

/**
 * Fonction avancée pour obtenir la position actuelle via l'API de géolocalisation du navigateur
 * avec gestion des erreurs, notifications système et mécanisme de réessai
 * @returns Promise avec la ville et le pays
 */
export const getCurrentLocationWithPermissions = async (): Promise<{city: string, country: string, latitude: number, longitude: number}> => {
  const MAX_RETRY = 3;
  const RETRY_DELAY = 1000; // 1 seconde entre les tentatives
  
  const attemptGeolocation = (attempt = 1): Promise<{city: string, country: string, latitude: number, longitude: number}> => {
  return new Promise((resolve, reject) => {
    // Vérifier si l'API de géolocalisation est disponible
    if (!navigator.geolocation) {
      // Si on est sur Electron et qu'on a accès à window.electronAPI
      if (window.electronAPI && window.electronAPI.openSystemPreferences) {
          // Vérifier si on a déjà affiché une notification récemment
          const lastNotification = localStorage.getItem('last_geolocation_notification');
          const now = Date.now();
          
          if (!lastNotification || (now - parseInt(lastNotification)) > 60000) {
            localStorage.setItem('last_geolocation_notification', now.toString());
            
        // Afficher une notification pour inviter l'utilisateur à activer la géolocalisation
        window.electronAPI.showNotification({
          title: 'Géolocalisation indisponible',
          body: 'Votre navigateur ne prend pas en charge la géolocalisation. Veuillez utiliser un navigateur moderne ou activer les services de localisation dans vos paramètres système.'
        });
        
        // Ouvrir les préférences système pour la géolocalisation
        window.electronAPI.openSystemPreferences('location');
          }
      }
      
      reject(new Error("La géolocalisation n'est pas supportée par ce navigateur."));
      return;
    }
    
    // Options de géolocalisation
    const options: PositionOptions = {
      enableHighAccuracy: true,  // Haute précision
      timeout: 10000,            // 10 secondes de timeout
      maximumAge: 0              // Toujours obtenir la position actuelle
    };
    
    // Demander la position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Obtenir la ville et le pays à partir des coordonnées
          const location = await getLocationFromCoordinates(latitude, longitude);
          
          resolve({
            ...location,
            latitude,
            longitude
          });
        } catch (error) {
            // En cas d'erreur de géocodage inverse, réessayer
            if (attempt < MAX_RETRY) {
              console.log(`Erreur lors du géocodage inverse (tentative ${attempt}/${MAX_RETRY}), nouvel essai dans ${RETRY_DELAY}ms...`);
              setTimeout(() => {
                attemptGeolocation(attempt + 1)
                  .then(resolve)
                  .catch(reject);
              }, RETRY_DELAY);
            } else {
          reject(error);
            }
          }
        },
        (error) => {
          // Gérer les erreurs de géolocalisation
          if (error.code === error.TIMEOUT && attempt < MAX_RETRY) {
            console.log(`Timeout lors de la géolocalisation (tentative ${attempt}/${MAX_RETRY}), nouvel essai dans ${RETRY_DELAY}ms...`);
            setTimeout(() => {
              attemptGeolocation(attempt + 1)
                .then(resolve)
                .catch(reject);
            }, RETRY_DELAY);
          } else {
            reject(handleGeolocationError(error));
          }
        },
      options
    );
  });
  };
  
  // Commencer le processus de géolocalisation
  return attemptGeolocation();
};

// Ajouter ces types à la fenêtre pour TypeScript
declare global {
  interface Window {
    electronAPI: any;
  }
} 

// Utiliser la géolocalisation HTML5 avec des options de haute précision
export const getCurrentPositionPromise = (): Promise<GeolocationPosition> => {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas supportée par ce navigateur"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true, // Demander la précision maximale (GPS si disponible)
        timeout: 10000,           // 10 secondes de timeout
        maximumAge: 30000         // Accepter une position récente (30 secondes max)
      }
    );
  });
};

// Obtenir la localisation via l'adresse IP en utilisant ipapi.co (gratuit, sans clé)
export const getLocationFromIp = async (): Promise<LocationData> => {
  try {
    console.log("Tentative de géolocalisation par IP...");
    
    // Configuration pour l'appel API
    const config = {
      timeout: 3000,
      headers: {
        'User-Agent': 'SalatNow/1.0',
        'Accept': 'application/json'
      }
    };
    
    const response = await secureAxios.get('https://ipapi.co/json/', config);
    
    if (response.data) {
      const { latitude, longitude, city, country_name } = response.data;
      
      const locationData: LocationData = {
        latitude,
        longitude,
        city,
        country: country_name,
        source: 'ip'
      };
      
      // Stocker dans le cache
      saveLocationToCache(locationData);
      
      return locationData;
    }
    
    throw new Error("Données de localisation IP incomplètes");
  } catch (error) {
    console.error("Erreur lors de la géolocalisation par IP:", error);
    throw error;
  }
};

// Sauvegarder la localisation dans le cache local
export const saveLocationToCache = (location: LocationData): void => {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
    localStorage.setItem(LOCATION_CACHE_EXPIRY_KEY, (Date.now() + LOCATION_CACHE_DURATION).toString());
  } catch (error) {
    console.warn("Impossible de sauvegarder la localisation dans le cache:", error);
  }
};

// Récupérer la localisation depuis le cache
export const getLocationFromCache = (): LocationData | null => {
  try {
    const expiryStr = localStorage.getItem(LOCATION_CACHE_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr) : 0;
    
    // Vérifier si le cache est encore valide
    if (expiry > Date.now()) {
      const cachedData = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedData) {
        const data = JSON.parse(cachedData) as LocationData;
        console.log("Utilisation de données de localisation en cache");
        return { ...data, source: 'cache' };
      }
    }
    
    return null;
  } catch (error) {
    console.warn("Erreur lors de la récupération du cache de localisation:", error);
    return null;
  }
};

// Valeurs par défaut pour Paris
export const DEFAULT_LOCATION: LocationData = {
  latitude: 48.8566,
  longitude: 2.3522,
  city: 'Paris',
  country: 'France',
  source: 'default'
};

// Fonction principale qui essaie toutes les méthodes de géolocalisation
export const getUserLocation = async (): Promise<LocationData> => {
  // 1. Essayer d'abord de récupérer depuis le cache
  const cachedLocation = getLocationFromCache();
  if (cachedLocation) {
    return cachedLocation;
  }
  
  try {
    // 2. Essayer la géolocalisation GPS/navigateur
    const position = await getCurrentPositionPromise();
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      source: 'gps'
    };
    
    // Tenter d'enrichir avec les données de ville/pays
    try {
      const extraData = await getLocationDetails(locationData.latitude, locationData.longitude);
      if (extraData.city) locationData.city = extraData.city;
      if (extraData.country) locationData.country = extraData.country;
    } catch (enrichError) {
      console.warn("Impossible d'enrichir les données de localisation:", enrichError);
    }
    
    // Sauvegarder dans le cache
    saveLocationToCache(locationData);
    return locationData;
  } catch (gpsError) {
    console.warn("Erreur de géolocalisation par GPS:", gpsError);
    
    try {
      // 3. Essayer la géolocalisation par IP
      return await getLocationFromIp();
    } catch (ipError) {
      console.warn("Erreur de géolocalisation par IP:", ipError);
      
      // 4. Essayer une dernière fois avec les données legacy
      try {
        const legacyLocation = getCachedLocation();
        if (legacyLocation && legacyLocation.latitude && legacyLocation.longitude) {
          return {
            latitude: legacyLocation.latitude,
            longitude: legacyLocation.longitude,
            city: legacyLocation.city,
            source: 'legacy'
          };
        }
      } catch (legacyError) {
        console.warn("Aucune donnée legacy disponible:", legacyError);
      }
      
      // 5. Si tout échoue, utiliser les valeurs par défaut
      console.warn("Utilisation des coordonnées par défaut (Paris)");
      return DEFAULT_LOCATION;
    }
  }
};

// Récupérer les détails de localisation (ville, pays) à partir des coordonnées
export const getLocationDetails = async (latitude: number, longitude: number): Promise<{ city?: string, country?: string }> => {
  try {
    // Utiliser reverse geocoding via Nominatim OpenStreetMap
    const response = await secureAxios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'User-Agent': 'SalatNow/1.0',
          'Accept': 'application/json'
        },
        timeout: 5000
      }
    );
    
    if (response.data && response.data.address) {
      return {
        city: response.data.address.city || response.data.address.town || response.data.address.village,
        country: response.data.address.country
      };
    }
    
    return {};
  } catch (error) {
    console.warn("Impossible d'obtenir les détails de localisation:", error);
    return {};
  }
}; 
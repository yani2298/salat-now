import { PrayerTimes } from '../types/prayer';
import dayjs from 'dayjs';
import { secureAxios } from './axios-config';

// Using the Aladhan API (free and reliable)
const API_BASE_URL = 'https://api.aladhan.com/v1/timingsByCity';
const PRAYER_CACHE_KEY = 'cached_prayer_times';
const CACHE_EXPIRY_KEY = 'prayer_cache_expiry';

// Constantes pour le stockage local
const LOCATION_CACHE_KEY = 'cached_location';
const CALCULATION_METHOD_KEY = 'calculation_method';
const DEFAULT_CITY = 'Paris';
const DEFAULT_COUNTRY = 'France';
const DEFAULT_CALCULATION_METHOD = 2; // ISNA par défaut
const PRAYER_ADJUSTMENTS_KEY = 'prayer_adjustments';

// Interface pour les ajustements d'horaires
export interface PrayerAdjustments {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

// Ajustements par défaut (0 minute pour chaque prière)
const DEFAULT_ADJUSTMENTS: PrayerAdjustments = {
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0
};

/**
 * Sauvegarde les horaires de prière dans le stockage local
 * @param times Horaires de prière
 * @param date Date de récupération
 */
const cachePrayerTimes = (times: PrayerTimes, date: string): void => {
  try {
    // Sauvegarder les horaires
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify(times));

    // Configurer l'expiration (fin de la journée courante)
    const today = dayjs(date, 'DD-MM-YYYY').endOf('day').valueOf();
    localStorage.setItem(CACHE_EXPIRY_KEY, today.toString());

    console.log('Horaires de prière mis en cache', date);
  } catch (error) {
    console.error('Erreur lors de la mise en cache des horaires:', error);
  }
};

/**
 * Récupère les horaires de prière du cache si disponibles et valides
 * @returns Les horaires en cache ou null si non disponibles/expirés
 */
const getCachedPrayerTimes = (): PrayerTimes | null => {
  try {
    const cachedData = localStorage.getItem(PRAYER_CACHE_KEY);
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);

    if (!cachedData || !cacheExpiry) return null;

    // Vérifier si le cache est encore valide
    const now = Date.now();
    if (now > parseInt(cacheExpiry)) {
      console.log('Cache des horaires expiré');
      return null;
    }

    console.log('Utilisation des horaires en cache');
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Erreur lors de la récupération du cache:', error);
    return null;
  }
};

/**
 * Récupère la localisation stockée en cache
 * @returns La ville et le pays stockés, ou les valeurs par défaut
 */
export const getCachedLocation = () => {
  try {
    const locationData = localStorage.getItem(LOCATION_CACHE_KEY);
    if (locationData) {
      return JSON.parse(locationData);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la localisation en cache:', error);
  }

  // Valeurs par défaut
  return { city: DEFAULT_CITY, country: DEFAULT_COUNTRY };
};

/**
 * Sauvegarde la localisation dans le stockage local
 * @param city La ville
 * @param country Le pays
 */
export const saveLocation = (city: string, country: string) => {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ city, country }));
    console.log(`Localisation sauvegardée: ${city}, ${country}`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la localisation:', error);
  }
};

/**
 * Récupère la méthode de calcul stockée
 * @returns Le numéro de la méthode de calcul
 */
export const getCachedCalculationMethod = (): number => {
  try {
    const method = localStorage.getItem(CALCULATION_METHOD_KEY);
    return method ? parseInt(method) : DEFAULT_CALCULATION_METHOD;
  } catch (error) {
    console.error('Erreur lors de la récupération de la méthode de calcul:', error);
    return DEFAULT_CALCULATION_METHOD;
  }
};

/**
 * Sauvegarde la méthode de calcul
 * @param method Le numéro de la méthode de calcul
 */
export const saveCalculationMethod = (method: number) => {
  try {
    localStorage.setItem(CALCULATION_METHOD_KEY, method.toString());
    console.log(`Méthode de calcul sauvegardée: ${method}`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la méthode de calcul:', error);
  }
};

/**
 * Obtient la position actuelle via l'API de géolocalisation
 * @returns Promise avec les coordonnées (latitude, longitude)
 */
export const getCurrentPosition = (): Promise<{ latitude: number, longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Erreur inconnue de géolocalisation';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'L\'utilisateur a refusé la demande de géolocalisation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Les informations de localisation sont indisponibles.';
            break;
          case error.TIMEOUT:
            errorMessage = 'La demande de géolocalisation a expiré.';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Récupère les ajustements d'horaires stockés
 * @returns Les ajustements d'horaires ou les valeurs par défaut
 */
export const getAdjustments = (): PrayerAdjustments => {
  try {
    const adjustmentsData = localStorage.getItem(PRAYER_ADJUSTMENTS_KEY);
    if (adjustmentsData) {
      return JSON.parse(adjustmentsData);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des ajustements:', error);
  }

  return { ...DEFAULT_ADJUSTMENTS };
};

/**
 * Sauvegarde les ajustements d'horaires
 * @param adjustments Les ajustements à sauvegarder
 */
export const saveAdjustments = (adjustments: PrayerAdjustments): void => {
  try {
    localStorage.setItem(PRAYER_ADJUSTMENTS_KEY, JSON.stringify(adjustments));
    console.log('Ajustements sauvegardés:', adjustments);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des ajustements:', error);
  }
};

/**
 * Applique les ajustements aux horaires de prière
 * @param times Horaires de prière originaux
 * @returns Horaires de prière ajustés
 */
export const applyAdjustments = (times: PrayerTimes): PrayerTimes => {
  const adjustments = getAdjustments();
  // Créer une copie profonde pour éviter de modifier l'original
  const adjustedTimes: PrayerTimes = JSON.parse(JSON.stringify(times));

  // Mapper les noms des prières entre les deux formats
  const prayerNameMap: Record<keyof PrayerAdjustments, keyof PrayerTimes> = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha'
  };

  // Appliquer les ajustements à chaque prière
  for (const prayer of Object.keys(adjustments) as Array<keyof PrayerAdjustments>) {
    const adjustment = adjustments[prayer];
    const prayerName = prayerNameMap[prayer];

    // S'assurer que nous avons un ajustement non-nul et une prière valide
    if (adjustment !== 0 && prayerName && adjustedTimes[prayerName]) {
      const timeStr = adjustedTimes[prayerName];

      // Vérifier que timeStr est une chaîne
      if (typeof timeStr === 'string') {
        // Obtenir l'heure actuelle
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);

          // Créer un objet Date pour faciliter les calculs
          const date = new Date();
          date.setHours(hours, minutes + adjustment, 0, 0);

          // Formater la nouvelle heure
          const newHours = date.getHours().toString().padStart(2, '0');
          const newMinutes = date.getMinutes().toString().padStart(2, '0');

          // Mettre à jour l'heure ajustée avec une assertion de type
          // Les horaires sont des chaînes dans l'interface PrayerTimes
          // mais TypeScript ne peut pas vérifier cela dans un objet indexé
          (adjustedTimes as any)[prayerName] = `${newHours}:${newMinutes}`;
        }
      }
    }
  }

  return adjustedTimes;
};

/**
 * Fetch prayer times for a specific city and date
 * @param city Name of the city
 * @param date Date in DD-MM-YYYY format
 * @param forceRefresh Force refresh from API ignoring cache
 * @returns Promise with prayer times data
 */
export const getPrayerTimes = async (
  city: string,
  date: string,
  forceRefresh = false,
  country = 'France',
  calculationMethod = 2
): Promise<PrayerTimes> => {
  // Essayer d'utiliser le cache d'abord si pas de forceRefresh
  if (!forceRefresh) {
    const cachedTimes = getCachedPrayerTimes();
    if (cachedTimes) {
      // Appliquer les ajustements aux horaires en cache
      return applyAdjustments(cachedTimes);
    }
  }

  try {
    console.log(`Récupération des horaires depuis l'API pour ${city}, ${date}`);
    const response = await secureAxios.get(API_BASE_URL, {
      params: {
        city,
        country, // Utiliser le pays fourni
        method: calculationMethod, // Utiliser la méthode de calcul fournie
        date,
      },
      timeout: 3000, // Timeout pour ne pas attendre trop longtemps
    });

    if (response.data && response.data.code === 200 && response.data.data) {
      const times = response.data.data.timings;
      // Mettre en cache pour une utilisation future
      cachePrayerTimes(times, date);
      // Appliquer les ajustements aux nouveaux horaires
      return applyAdjustments(times);
    } else {
      throw new Error('Invalid response from prayer times API');
    }
  } catch (error) {
    console.error('Error fetching prayer times:', error);

    // Essayer le cache même si expiré en cas d'erreur API
    const expiredCache = localStorage.getItem(PRAYER_CACHE_KEY);
    if (expiredCache) {
      console.log('Utilisation du cache expiré comme fallback');
      // Appliquer les ajustements aux horaires en cache expiré
      return applyAdjustments(JSON.parse(expiredCache));
    }

    // Retourner des données fictives avec les ajustements
    return applyAdjustments(getMockPrayerTimes());
  }
};

// Mock data in case the API fails
const getMockPrayerTimes = (): PrayerTimes => {
  return {
    Fajr: '05:30',
    Sunrise: '06:45',
    Dhuhr: '13:51',
    Asr: '17:25',
    Sunset: '20:30',
    Maghrib: '20:45',
    Isha: '22:15',
    Midnight: '00:30',
    Imsak: '05:15',
    date: {
      readable: '12 Apr 2025',
      timestamp: '1744914000',
      gregorian: {
        date: '12-04-2025',
        format: 'DD-MM-YYYY',
        day: '12',
        weekday: {
          en: 'Saturday',
        },
        month: {
          number: 4,
          en: 'April',
        },
        year: '2025',
      },
      hijri: {
        date: '13-10-1446',
        format: 'DD-MM-YYYY',
        day: '13',
        weekday: {
          en: 'Al Sabt',
          ar: 'السبت',
        },
        month: {
          number: 10,
          en: 'Shawwal',
          ar: 'شَوَّال',
        },
        year: '1446',
      },
    },
  };
}; 
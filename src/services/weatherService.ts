import { secureAxios } from './axios-config';
import { canMakeApiRequest, markApiRequestMade } from './optimizerService';

// Open-Meteo API (gratuite, sans clé API)
const BASE_URL = 'https://api.open-meteo.com/v1';

// Clés pour le stockage local
const WEATHER_CACHE_KEY = 'cached_weather';
const WEATHER_CACHE_EXPIRY_KEY = 'weather_cache_expiry';
const WEATHER_CACHE_CITY_KEY = 'weather_cache_city';

// Coordonnées par défaut pour quelques villes françaises
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'Marseille': { lat: 43.2965, lon: 5.3698 },
  'Lyon': { lat: 45.7640, lon: 4.8357 },
  'Toulouse': { lat: 43.6047, lon: 1.4442 },
  'Nice': { lat: 43.7102, lon: 7.2620 },
  'Nantes': { lat: 47.2184, lon: -1.5536 },
  'Strasbourg': { lat: 48.5734, lon: 7.7521 },
  'Montpellier': { lat: 43.6108, lon: 3.8767 },
  'Bordeaux': { lat: 44.8378, lon: -0.5792 },
  'Lille': { lat: 50.6292, lon: 3.0573 }
};

// Interface pour les données météo retournées
export interface WeatherData {
  city: string;
  temperature: number;
  wmoCode: number; // Weather code from WMO standard
  isDay: boolean;
  humidity: number;
  windSpeed: number;
}

/**
 * Met en cache les données météo
 * @param data Données météo à mettre en cache
 * @param city Nom de la ville
 */
const cacheWeatherData = (data: WeatherData, city: string): void => {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(WEATHER_CACHE_CITY_KEY, city);
    
    // Définir l'expiration à 30 minutes (ou plus selon la performance)
    const expiry = Date.now() + 30 * 60 * 1000; // 30 minutes
    localStorage.setItem(WEATHER_CACHE_EXPIRY_KEY, expiry.toString());
  } catch (error) {
    console.error('Erreur lors de la mise en cache des données météo:', error);
  }
};

/**
 * Récupère les données météo du cache si disponibles et valides
 * @param city Nom de la ville
 * @returns Données météo en cache ou null si non disponibles/expirées
 */
const getCachedWeatherData = (city: string): WeatherData | null => {
  try {
    const cachedCity = localStorage.getItem(WEATHER_CACHE_CITY_KEY);
    const cachedData = localStorage.getItem(WEATHER_CACHE_KEY);
    const cacheExpiry = localStorage.getItem(WEATHER_CACHE_EXPIRY_KEY);
    
    if (!cachedData || !cacheExpiry || cachedCity !== city) return null;
    
    // Vérifier si le cache est encore valide
    const now = Date.now();
    if (now > parseInt(cacheExpiry)) {
      console.log('Cache météo expiré');
      return null;
    }
    
    console.log('Utilisation des données météo en cache');
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Erreur lors de la récupération du cache météo:', error);
    return null;
  }
};

/**
 * Récupère les données météo actuelles pour la ville spécifiée
 * @param city Nom de la ville pour laquelle récupérer les données météo
 * @returns Promise qui se résout en données météo
 */
export const getCurrentWeather = async (city: string = 'Paris'): Promise<WeatherData> => {
  try {
    // Vérifier d'abord le cache
    const cachedData = getCachedWeatherData(city);
    if (cachedData) {
      return cachedData;
    }
    
    // Vérifier si on peut faire une nouvelle requête API
    if (!canMakeApiRequest('weather')) {
      console.log('Trop de requêtes météo récentes, utilisation des données par défaut');
      return getDefaultWeatherData(city);
    }
    
    // Marquer la requête comme effectuée
    markApiRequestMade('weather');
    
    // Récupérer les coordonnées de la ville
    const coordinates = CITY_COORDINATES[city] || CITY_COORDINATES['Paris'];
    
    // Récupérer les données météo actuelles depuis Open-Meteo
    const response = await secureAxios.get(`${BASE_URL}/forecast`, {
      params: {
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        current: 'temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m',
        timezone: 'Europe/Paris'
      }
    });

    const data = response.data;
    const current = data.current;
    
    // Créer l'objet WeatherData à partir des données de l'API
    const weatherData: WeatherData = {
      city: city,
      temperature: Math.round(current.temperature_2m),
      wmoCode: current.weather_code,
      isDay: current.is_day === 1,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m)
    };
    
    // Mettre en cache les données récupérées
    cacheWeatherData(weatherData, city);
    
    return weatherData;
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo réelles. Utilisation des données par défaut.', error);
    
    // En cas d'erreur, retourner des données par défaut
    return getDefaultWeatherData(city);
  }
};

/**
 * Crée des données météo par défaut
 * @param city Nom de la ville
 * @returns Données météo par défaut
 */
const getDefaultWeatherData = (city: string): WeatherData => {
    return {
      city: city,
      temperature: 20,
      wmoCode: 0, // Clear sky
      isDay: true,
      humidity: 70,
      windSpeed: 10
    };
}; 
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Prayer } from '../types/prayer';
import WeatherIcon from './WeatherIcon';
import CountdownTimer from './CountdownTimer';
import { WiHumidity, WiStrongWind, WiDaySunny, WiNightClear, WiDayCloudy, WiNightAltCloudy, WiCloudy, WiFog, WiDayShowers, WiNightShowers, WiDayRain, WiNightRain, WiDaySnow, WiNightSnow, WiDayThunderstorm, WiNightThunderstorm } from 'react-icons/wi';
import { getCurrentWeather, WeatherData } from '../services/weatherService';

interface PrayerCardProps {
  prayer: Prayer;
  isNext: boolean;
}

// Fonction pour mapper le code WMO à une icône React Icon (Wi...)
const getWeatherIcon = (wmoCode: number, isDay: boolean) => {
  switch (wmoCode) {
    case 0: return isDay ? WiDaySunny : WiNightClear; // Ciel dégagé
    case 1: return isDay ? WiDaySunny : WiNightClear; // Principalement dégagé
    case 2: return isDay ? WiDayCloudy : WiNightAltCloudy; // Partiellement nuageux
    case 3: return WiCloudy; // Nuageux
    case 45: case 48: return WiFog; // Brouillard, Brouillard givrant
    case 51: case 53: case 55: return isDay ? WiDayShowers : WiNightShowers; // Bruine
    case 56: case 57: return isDay ? WiDayShowers : WiNightShowers; // Bruine verglaçante
    case 61: case 63: case 65: return isDay ? WiDayRain : WiNightRain; // Pluie
    case 66: case 67: return isDay ? WiDayRain : WiNightRain; // Pluie verglaçante
    case 71: case 73: case 75: case 77: return isDay ? WiDaySnow : WiNightSnow; // Neige
    case 80: case 81: case 82: return isDay ? WiDayShowers : WiNightShowers; // Averses de pluie
    case 85: case 86: return isDay ? WiDaySnow : WiNightSnow; // Averses de neige
    case 95: case 96: case 99: return isDay ? WiDayThunderstorm : WiNightThunderstorm; // Orage
    default: return isDay ? WiDaySunny : WiNightClear;
  }
};

const PrayerCard: React.FC<PrayerCardProps> = ({ prayer, isNext }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (isNext) {
      const fetchWeather = async () => {
        try {
          const data = await getCurrentWeather('Paris'); // Utiliser la ville du client si disponible plus tard
          setWeather(data);
        } catch (err) {
          console.error('Failed to fetch weather data:', err);
        }
      };
      fetchWeather();
    }
  }, [isNext]);

  const getCardClass = () => {
    let className = "prayer-card w-full mb-3";

    // Ajouter plus d'espace en bas pour Isha
    if (prayer.name === 'Isha') {
      className += " mb-6";
    }

    if (isNext) {
      className += " prayer-card-active";
    }
    return className;
  };

  // Définir l'animation de fond ici
  const backgroundAnimation = {
    // Remplacer l'animation de dégradé par un dégradé statique
    background: "linear-gradient(135deg, #2a2a72, #4e4376)",
    // Supprimer la boxShadow d'ici pour utiliser celle de la classe CSS
    // boxShadow: "0 15px 30px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)" 
  };

  // Supprimer la transition d'animation de fond
  const backgroundTransition = {
    opacity: { duration: 0.5 },
    y: { duration: 0.5 }
  };

  const CurrentWeatherIcon = weather ? getWeatherIcon(weather.wmoCode, weather.isDay) : null;

  return (
    <motion.div
      className={getCardClass()}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        // Appliquer l'animation de fond seulement si c'est la prochaine prière
        ...(isNext ? backgroundAnimation : {})
      }}
      transition={{
        opacity: { duration: 0.5 },
        y: { duration: 0.5 },
        // Appliquer la transition de fond seulement si c'est la prochaine prière
        ...(isNext ? backgroundTransition : {})
      }}
      layout
      style={{
        padding: isNext ? "1.5rem 1.5rem 1rem 1.5rem" : "0.75rem 1.25rem",
        backdropFilter: isNext ? "blur(5px)" : "none",
      }}
    >
      <div className="relative z-10"> {/* z-10 pour que le contenu soit au-dessus du fond potentiellement animé */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{prayer.name}</h2>
            <h3 className="text-sm opacity-60 mb-2">{prayer.arabicName}</h3>
            {isNext && <div className="mt-1"><CountdownTimer prayerTime={prayer.time} /></div>}
          </div>

          {isNext && (
            <div className="px-3 py-1 bg-blue-600 rounded-full text-sm font-semibold inline-block">
              Prochaine prière
            </div>
          )}
        </div>

        <div className="flex justify-between items-center relative mt-2">
          <h3 className="prayer-time text-7xl">{prayer.time}</h3>

          <div className="absolute right-1 bottom-1 scale-150 origin-bottom-right">
            <WeatherIcon 
              type={
                prayer.name === 'Fajr' ? 'fajr_sun' : 
                prayer.name === 'Dhuhr' ? 'partly_cloudy' : 
                prayer.name === 'Asr' ? 'sunny' : 
                prayer.name === 'Maghrib' ? 'sunset_clouds' :
                prayer.name === 'Isha' ? 'night_moon_clouds' : 
                prayer.icon
              } 
            />
          </div>
        </div>

        {/* Section météo réelle intégrée */}
        {isNext && weather && CurrentWeatherIcon && (
          <motion.div
            className="mt-1 flex items-center space-x-3 text-xs text-blue-100 opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Icône météo transparente + Température */}
            <div className="flex items-center">
              <CurrentWeatherIcon className="text-lg mr-1" />
              <span className="font-medium">{weather.temperature}°C</span>
            </div>

            {/* Humidité */}
            <div className="flex items-center">
              <WiHumidity className="text-lg mr-0.5" />
              <span>{weather.humidity}%</span>
            </div>

            {/* Vent */}
            <div className="flex items-center">
              <WiStrongWind className="text-lg mr-0.5" />
              <span>{weather.windSpeed}km/h</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PrayerCard; 
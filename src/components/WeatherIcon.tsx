import { IconType } from '../types/prayer';
import './weatherIcon.css'; // Ajoutera ce fichier CSS pour les animations

const WeatherIcon: React.FC<{ type: IconType | 'partly_cloudy' | 'sunny' | 'night_moon_clouds' | 'fajr_sun' | 'sunset_clouds' }> = ({ type }) => {
  // Utilise un état système simple pour déterminer si on doit réduire les animations
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Classes CSS de base communes
  const baseClasses = "absolute rounded-full shadow-md";
  
  switch (type) {
    case 'dawn':
      return (
        <div className="weather-icon-container">
          {/* Soleil statique avec glow CSS */}
          <div 
            className={`${baseClasses} dawn-sun w-10 h-10 bg-gradient-to-b from-yellow-200 to-orange-400`}
            style={{ 
              left: '40%', 
              top: '70%',
              boxShadow: prefersReducedMotion ? 'none' : '0 0 10px 2px rgba(255, 196, 86, 0.5)'
            }}
          />
        </div>
      );

    case 'noon':
      return (
        <div className="weather-icon-container">
          {/* Soleil statique avec glow CSS */}
          <div 
            className={`${baseClasses} noon-sun w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-300`}
            style={{ 
              left: '40%', 
              top: '50%',
              boxShadow: prefersReducedMotion ? 'none' : '0 0 15px 5px rgba(253, 224, 71, 0.4)'
            }}
          />
        </div>
      );

    case 'afternoon':
      return (
        <div className="weather-icon-container">
          {/* Soleil statique avec glow CSS */}
          <div 
            className={`${baseClasses} afternoon-sun w-11 h-11 bg-gradient-to-br from-yellow-200 to-orange-400`}
            style={{ 
              left: '40%', 
              top: '40%',
              boxShadow: prefersReducedMotion ? 'none' : '0 0 12px 3px rgba(251, 191, 36, 0.3)'
            }}
          />
        </div>
      );

    case 'sunset':
      return (
        <div className="weather-icon-container">
          {/* Soleil statique avec glow CSS */}
          <div 
            className={`${baseClasses} sunset-sun w-10 h-10 bg-gradient-to-b from-orange-400 to-red-500`}
            style={{ 
              left: '40%', 
              top: '70%',
              boxShadow: prefersReducedMotion ? 'none' : '0 0 10px 2px rgba(239, 68, 68, 0.3)'
            }}
          />
          {/* Ligne d'horizon statique */}
          <div className="absolute bottom-5 left-0 right-0 h-px bg-black/20" />
        </div>
      );

    case 'night':
      return (
        <div className="weather-icon-container">
          {/* Lune statique avec glow CSS */}
          <div 
            className={`${baseClasses} night-moon w-10 h-10 bg-gradient-radial from-gray-100 to-gray-300`}
            style={{ 
              left: '40%', 
              top: '35%',
              boxShadow: prefersReducedMotion ? 'none' : '0 0 8px 2px rgba(229, 231, 235, 0.2)'
            }}
          >
            {/* Cratères statiques */}
            <div className="absolute w-2 h-2 bg-gray-400/30 rounded-full top-3 left-3 opacity-70"></div>
            <div className="absolute w-3 h-3 bg-gray-400/30 rounded-full bottom-2 left-4 opacity-70"></div>
          </div>
          
          {/* 2 étoiles statiques avec pulsation CSS légère - uniquement si animations autorisées */}
          {!prefersReducedMotion && (
            <>
              <div className="star-1 w-1 h-1 rounded-full bg-white/80 absolute" style={{ top: '25%', left: '20%' }} />
              <div className="star-2 w-1 h-1 rounded-full bg-white/80 absolute" style={{ top: '15%', left: '70%' }} />
            </>
          )}
        </div>
      );

    case 'night_moon_clouds':
      return (
        <div className="weather-icon-container">
          <div className="isha-container">
            <div id="cloud"></div>
            <div id="cloud"></div>
            <div id="star"></div>
            <div id="moon"></div>
            <div id="shadow"></div>
          </div>
        </div>
      );

    case 'fajr_sun':
      return (
        <div className="weather-icon-container fajr_sun"></div>
      );

    case 'sunny':
      return (
        <div className="weather-icon-container sunny"></div>
      );

    case 'partly_cloudy':
      return (
        <div className="weather-icon-container partly_cloudy">
          <div className="partly_cloudy__sun"></div>
          <div className="partly_cloudy__cloud"></div>
        </div>
      );

    case 'sunset_clouds':
      return (
        <div className="weather-icon-container sunset_clouds">
          {/* Clouds first (behind sun partially) */}
          <div className="sunset_clouds__cloud cloud1"></div> 
          {/* Optional second cloud 
          <div className="sunset_clouds__cloud cloud2"></div> 
          */}
          {/* Sun */}
          <div className="sunset_clouds__sun"></div>
          {/* Horizon line */}
          <div className="sunset_clouds__horizon"></div>
        </div>
      );

    default:
      return <div className="weather-icon-container"></div>;
  }
};

export default WeatherIcon; 
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface CountdownTimerProps {
  prayerTime: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ prayerTime }) => {
  const [countdownText, setCountdownText] = useState('--:--:--');

  useEffect(() => {
    const updateCountdown = () => {
      const now = dayjs();
      
      // Convertir prayerTime (qui est au format "HH:MM") en objet dayjs pour aujourd'hui
      const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
      let prayerTimeObj = dayjs().hour(prayerHours).minute(prayerMinutes).second(0);
      
      // Si l'heure de prière est déjà passée aujourd'hui, programmer pour demain
      if (prayerTimeObj.isBefore(now)) {
        prayerTimeObj = prayerTimeObj.add(1, 'day');
      }
      
      // Calculer la différence en secondes
      const diff = prayerTimeObj.diff(now, 'second');
      
      if (diff <= 0) {
        setCountdownText('00h00m00s');
        return;
      }
      
      // Convertir en heures, minutes, secondes
      const diffHours = Math.floor(diff / 3600);
      const diffMinutes = Math.floor((diff % 3600) / 60);
      const diffSeconds = diff % 60;
      
      // Formater le texte
      setCountdownText(
        `${diffHours.toString().padStart(2, '0')}h${diffMinutes.toString().padStart(2, '0')}m${diffSeconds.toString().padStart(2, '0')}s`
      );
    };
    
    // Mettre à jour immédiatement
    updateCountdown();
    
    // Mettre à jour toutes les secondes
    const interval = setInterval(updateCountdown, 1000);
    
    // Nettoyage
    return () => clearInterval(interval);
  }, [prayerTime]);

  return (
    <div className="inline-flex items-center text-gray-300 text-xs font-mono">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {countdownText}
    </div>
  );
};

export default CountdownTimer; 
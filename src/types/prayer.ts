export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Midnight: string;
  Imsak: string;
  date: {
    readable: string;
    timestamp: string;
    gregorian: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
      };
      month: {
        number: number;
        en: string;
      };
      year: string;
    };
    hijri: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
        ar: string;
      };
      month: {
        number: number;
        en: string;
        ar: string;
      };
      year: string;
    };
  };
}

export type IconType = 'dawn' | 'noon' | 'afternoon' | 'sunset' | 'night';

export interface Prayer {
  name: string;
  time: string;
  arabicName: string;
  icon: IconType;
  remainingTime?: number; // Temps restant en secondes
}

export interface PrayerCardProps {
  prayer: Prayer;
  isNext: boolean;
}

export interface PrayerListProps {
  prayerTimes: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
    Midnight: string;
    Imsak: string;
  };
  currentPrayer: string;
  nextPrayerIndex?: number | null; // Indice de la prochaine prière
}

export interface CityHeaderProps {
  city: string;
  gregorianDate: string;
  hijriDate: string;
} 
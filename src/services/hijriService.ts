// Service pour la gestion du calendrier hijri
import dayjs from 'dayjs';
import { secureAxios } from './axios-config';

// Interface pour les données du calendrier hijri
export interface HijriDate {
  day: string;
  month: {
    number: number;
    en: string; // Nom anglais du mois
    ar: string; // Nom arabe du mois
  };
  year: string;
  weekday: {
    en: string; // Jour de la semaine en anglais
    ar: string; // Jour de la semaine en arabe
  };
  designation: {
    abbreviated: string; // "AH" pour Anno Hegirae
    expanded: string; // "Anno Hegirae"
  };
  holidays: string[]; // Jours fériés ou événements spéciaux
}

// Clés pour le stockage en cache
const HIJRI_CACHE_KEY = 'cached_hijri_date';
const HIJRI_CACHE_DATE_KEY = 'hijri_cache_date';

/**
 * Met en cache une date hijri
 * @param hijriDate Date hijri à mettre en cache
 * @param gregorianDate Date grégorienne correspondante
 */
const cacheHijriDate = (hijriDate: HijriDate, gregorianDate: string): void => {
  try {
    localStorage.setItem(HIJRI_CACHE_KEY, JSON.stringify(hijriDate));
    localStorage.setItem(HIJRI_CACHE_DATE_KEY, gregorianDate);
    
    console.log('Date hijri mise en cache pour', gregorianDate);
  } catch (error) {
    console.error('Erreur lors de la mise en cache de la date hijri:', error);
  }
};

/**
 * Récupère une date hijri du cache si disponible pour la date donnée
 * @param gregorianDate Date grégorienne pour laquelle vérifier le cache
 * @returns Date hijri en cache ou null si non disponible
 */
const getCachedHijriDate = (gregorianDate: string): HijriDate | null => {
  try {
    const cachedDate = localStorage.getItem(HIJRI_CACHE_DATE_KEY);
    
    // Vérifier si le cache existe et correspond à la date demandée
    if (!cachedDate || cachedDate !== gregorianDate) return null;
    
    const cachedHijri = localStorage.getItem(HIJRI_CACHE_KEY);
    if (!cachedHijri) return null;
    
    console.log('Utilisation de la date hijri en cache pour', gregorianDate);
    return JSON.parse(cachedHijri);
  } catch (error) {
    console.error('Erreur lors de la récupération de la date hijri du cache:', error);
    return null;
  }
};

// Interface pour les événements islamiques importants
export interface IslamicEvent {
  name: {
    fr: string;
    ar: string;
    en: string;
  };
  date: {
    hijri: string; // Format: "DD-MM"
    gregorianYear?: number; // Année grégorienne si disponible
  };
  description: string;
  type: 'holiday' | 'commemoration' | 'fast';
  importance: 1 | 2 | 3; // 1 = haute, 2 = moyenne, 3 = basse
}

// Liste des mois hijri
export const HIJRI_MONTHS = [
  { number: 1, en: 'Muharram', ar: 'محرّم', fr: 'Mouharram' },
  { number: 2, en: 'Safar', ar: 'صفر', fr: 'Safar' },
  { number: 3, en: 'Rabi al-Awwal', ar: 'ربيع الأول', fr: 'Rabi al-Awal' },
  { number: 4, en: 'Rabi al-Thani', ar: 'ربيع الثاني', fr: 'Rabi al-Thani' },
  { number: 5, en: 'Jumada al-Awwal', ar: 'جمادى الأولى', fr: 'Joumada al-Oula' },
  { number: 6, en: 'Jumada al-Thani', ar: 'جمادى الثانية', fr: 'Joumada al-Thania' },
  { number: 7, en: 'Rajab', ar: 'رجب', fr: 'Rajab' },
  { number: 8, en: 'Shaban', ar: 'شعبان', fr: 'Chaabane' },
  { number: 9, en: 'Ramadan', ar: 'رمضان', fr: 'Ramadan' },
  { number: 10, en: 'Shawwal', ar: 'شوّال', fr: 'Chawwal' },
  { number: 11, en: 'Dhu al-Qadah', ar: 'ذو القعدة', fr: 'Dhou al-Qi`da' },
  { number: 12, en: 'Dhu al-Hijjah', ar: 'ذو الحجة', fr: 'Dhou al-Hijja' },
];

// Liste des événements islamiques importants (format: DD-MM pour la date hijri)
export const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    name: {
      fr: 'Nouvel An Hijri',
      ar: 'رأس السنة الهجرية',
      en: 'Islamic New Year'
    },
    date: { hijri: '01-01' },
    description: 'Premier jour de l\'année dans le calendrier islamique.',
    type: 'holiday',
    importance: 2
  },
  {
    name: {
      fr: 'Achoura',
      ar: 'عاشوراء',
      en: 'Ashura'
    },
    date: { hijri: '10-01' },
    description: 'Jour du martyre de l\'Imam Hussein à Karbala. Jour de jeûne recommandé.',
    type: 'commemoration',
    importance: 1
  },
  {
    name: {
      fr: 'Mawlid - Naissance du Prophète ﷺ',
      ar: 'المولد النبوي',
      en: 'Mawlid - Birth of Prophet Muhammad ﷺ'
    },
    date: { hijri: '12-03' },
    description: 'Commémoration de la naissance du Prophète Muhammad ﷺ.',
    type: 'holiday',
    importance: 1
  },
  {
    name: {
      fr: 'Début de Rajab',
      ar: 'بداية رجب',
      en: 'Beginning of Rajab'
    },
    date: { hijri: '01-07' },
    description: 'Début du mois sacré de Rajab, un des quatre mois sacrés.',
    type: 'commemoration',
    importance: 2
  },
  {
    name: {
      fr: 'Laylat al-Miraj',
      ar: 'ليلة المعراج',
      en: 'Laylat al-Miraj'
    },
    date: { hijri: '27-07' },
    description: 'Nuit du voyage nocturne et de l\'ascension du Prophète Muhammad ﷺ.',
    type: 'commemoration',
    importance: 2
  },
  {
    name: {
      fr: 'Mi-Chaabane',
      ar: 'ليلة النصف من شعبان',
      en: 'Mid-Shaban'
    },
    date: { hijri: '15-08' },
    description: 'Nuit de l\'absolution, considérée comme bénie pour les prières.',
    type: 'commemoration',
    importance: 2
  },
  {
    name: {
      fr: 'Début du Ramadan',
      ar: 'بداية رمضان',
      en: 'Beginning of Ramadan'
    },
    date: { hijri: '01-09' },
    description: 'Premier jour du mois béni de Ramadan, mois du jeûne.',
    type: 'fast',
    importance: 1
  },
  {
    name: {
      fr: 'Laylat al-Qadr',
      ar: 'ليلة القدر',
      en: 'Laylat al-Qadr'
    },
    date: { hijri: '27-09' },
    description: 'La Nuit du Destin, considérée comme la nuit la plus sacrée de l\'année.',
    type: 'commemoration',
    importance: 1
  },
  {
    name: {
      fr: 'Aïd al-Fitr',
      ar: 'عيد الفطر',
      en: 'Eid al-Fitr'
    },
    date: { hijri: '01-10' },
    description: 'Fête de la rupture du jeûne, marquant la fin du Ramadan.',
    type: 'holiday',
    importance: 1
  },
  {
    name: {
      fr: 'Jour d\'Arafat',
      ar: 'يوم عرفة',
      en: 'Day of Arafah'
    },
    date: { hijri: '09-12' },
    description: 'Jour de rassemblement des pèlerins sur le Mont Arafat pendant le Hajj.',
    type: 'commemoration',
    importance: 1
  },
  {
    name: {
      fr: 'Aïd al-Adha',
      ar: 'عيد الأضحى',
      en: 'Eid al-Adha'
    },
    date: { hijri: '10-12' },
    description: 'Fête du sacrifice, commémorant le sacrifice d\'Ibrahim.',
    type: 'holiday',
    importance: 1
  }
];

/**
 * Convertit une date grégorienne en date hijri
 * @param date Date au format grégorien (YYYY-MM-DD)
 * @param forceRefresh Force le rafraîchissement depuis l'API
 * @returns Promise contenant la date hijri
 */
export const getHijriDate = async (date: string, forceRefresh = false): Promise<HijriDate> => {
  // Vérifier d'abord le cache si on ne force pas le rafraîchissement
  if (!forceRefresh) {
    const cachedDate = getCachedHijriDate(date);
    if (cachedDate) {
      return cachedDate;
    }
  }
  
  try {
    console.log(`Récupération de la date hijri depuis l'API pour ${date}`);
    // Utiliser l'API Aladhan pour la conversion
    const response = await secureAxios.get('https://api.aladhan.com/v1/gToH', {
      params: {
        date,
      },
      timeout: 3000, // Timeout pour ne pas attendre trop longtemps
    });

    if (response.data && response.data.code === 200 && response.data.data) {
      const hijriData = response.data.data.hijri;

      // Vérifier s'il y a des événements spéciaux pour cette date
      const dayMonth = `${hijriData.day}-${hijriData.month.number.toString().padStart(2, '0')}`;
      const holidays = ISLAMIC_EVENTS
        .filter(event => event.date.hijri === dayMonth)
        .map(event => event.name.fr);

      const result = {
        ...hijriData,
        holidays,
      };
      
      // Mettre en cache le résultat
      cacheHijriDate(result, date);
      
      return result;
    } else {
      throw new Error('Invalid response from hijri date API');
    }
  } catch (error) {
    console.error('Error fetching hijri date:', error);
    
    // Essayer d'utiliser une date en cache, même si ce n'est pas pour la date exacte
    const anyCache = localStorage.getItem(HIJRI_CACHE_KEY);
    if (anyCache) {
      console.log('Utilisation de la dernière date hijri en cache comme fallback');
      return JSON.parse(anyCache);
    }
    
    // Si pas de cache, utiliser la méthode de secours
    return getMockHijriDate(date);
  }
};

/**
 * Création d'une date hijri de secours en cas d'échec de l'API
 * Cette méthode est approximative et ne devrait être utilisée qu'en secours
 */
const getMockHijriDate = (gregorianDate: string): HijriDate => {
  const date = dayjs(gregorianDate);
  // Approximation grossière - une vraie conversion nécessite des calculs complexes
  const year = date.year() - 622; // Approximation très basique
  const month = date.month();
  const day = date.date();
  
  return {
    day: day.toString(),
    month: {
      number: ((month + 2) % 12) + 1, // Décalage approximatif
      en: HIJRI_MONTHS[((month + 2) % 12)].en,
      ar: HIJRI_MONTHS[((month + 2) % 12)].ar,
    },
    year: year.toString(),
    weekday: {
      en: date.format('dddd'),
      ar: getArabicWeekday(date.day()),
    },
    designation: {
      abbreviated: 'AH',
      expanded: 'Anno Hegirae',
    },
    holidays: [],
  };
};

/**
 * Renvoie le nom du jour en arabe
 */
const getArabicWeekday = (day: number): string => {
  const arabicDays = [
    'الأحد', // Dimanche
    'الإثنين', // Lundi
    'الثلاثاء', // Mardi
    'الأربعاء', // Mercredi
    'الخميس', // Jeudi
    'الجمعة', // Vendredi
    'السبت', // Samedi
  ];
  return arabicDays[day];
};

/**
 * Obtient les événements islamiques pour un mois donné
 * @param month Numéro du mois hijri (1-12)
 * @returns Liste des événements pour ce mois
 */
export const getEventsForMonth = (month: number): IslamicEvent[] => {
  const monthString = month.toString().padStart(2, '0');
  return ISLAMIC_EVENTS.filter(event => {
    const eventMonth = event.date.hijri.split('-')[1];
    return eventMonth === monthString;
  });
};

/**
 * Formate une date hijri pour l'affichage
 * @param date Date hijri
 * @param format Format souhaité ('long' ou 'short')
 * @param lang Langue ('fr', 'en', ou 'ar')
 * @returns Chaîne formatée
 */
export const formatHijriDate = (date: HijriDate, format: 'long' | 'short' = 'long', lang: 'fr' | 'en' | 'ar' = 'fr'): string => {
  if (!date) return '';
  
  // Trouver le mois en français
  const month = HIJRI_MONTHS.find(m => m.number === date.month.number);
  const monthName = lang === 'fr' ? month?.fr : (lang === 'ar' ? month?.ar : month?.en);
  
  if (format === 'short') {
    return `${date.day} ${monthName} ${date.year}${lang === 'ar' ? ' هـ' : ' H'}`;
  } else {
    const weekday = lang === 'ar' ? date.weekday.ar : (lang === 'fr' ? getFrenchWeekday(date.weekday.en) : date.weekday.en);
    return `${weekday} ${date.day} ${monthName} ${date.year}${lang === 'ar' ? ' هـ' : ' H'}`;
  }
};

/**
 * Convertit le jour de la semaine en anglais en français
 */
const getFrenchWeekday = (englishWeekday: string): string => {
  const weekdays: Record<string, string> = {
    'Sunday': 'Dimanche',
    'Monday': 'Lundi',
    'Tuesday': 'Mardi',
    'Wednesday': 'Mercredi',
    'Thursday': 'Jeudi',
    'Friday': 'Vendredi',
    'Saturday': 'Samedi',
  };
  return weekdays[englishWeekday] || englishWeekday;
}; 
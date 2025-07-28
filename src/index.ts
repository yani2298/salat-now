import axios, { AxiosInstance } from 'axios';
import dayjs from 'dayjs';

/**
 * Islamic Prayer Times Interface
 */
export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Firstthird?: string;
  Lastthird?: string;
}

/**
 * Prayer Adjustments Interface
 */
export interface PrayerAdjustments {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

/**
 * Calculation Methods Enum
 */
export enum CalculationMethod {
  JAFARI = 0, // Ithna Ashari
  KARACHI = 1, // University of Islamic Sciences, Karachi
  ISNA = 2, // Islamic Society of North America (ISNA)
  MWL = 3, // Muslim World League (MWL)
  EGYPT = 5, // Egyptian General Authority of Survey
  CUSTOM = 99 // Custom
}

/**
 * Configuration Options for Prayer Times Calculator
 */
export interface PrayerTimesConfig {
  city: string;
  country?: string;
  calculationMethod?: CalculationMethod;
  adjustments?: Partial<PrayerAdjustments>;
  timeout?: number;
  cacheEnabled?: boolean;
}

/**
 * API Response Interface
 */
interface ApiResponse {
  code: number;
  status: string;
  data: {
    timings: PrayerTimes;
    date: {
      readable: string;
      timestamp: string;
      hijri: any;
      gregorian: any;
    };
  };
}

/**
 * Main Prayer Times Calculator Class
 */
export class SalatTimesCalculator {
  private axiosInstance: AxiosInstance;
  private readonly API_BASE_URL = 'https://api.aladhan.com/v1/timingsByCity';
  private cache: Map<string, { data: PrayerTimes; expiry: number }> = new Map();

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Get prayer times for a specific location and date
   */
  async getPrayerTimes(config: PrayerTimesConfig, date?: string): Promise<PrayerTimes> {
    const {
      city,
      country = 'France',
      calculationMethod = CalculationMethod.ISNA,
      adjustments,
      timeout = 10000,
      cacheEnabled = true
    } = config;

    const dateStr = date || dayjs().format('DD-MM-YYYY');
    const cacheKey = `${city}-${country}-${calculationMethod}-${dateStr}`;

    // Check cache first
    if (cacheEnabled && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() < cached.expiry) {
        return this.applyAdjustments(cached.data, adjustments);
      }
      this.cache.delete(cacheKey);
    }

    try {
      const response = await this.axiosInstance.get<ApiResponse>(this.API_BASE_URL, {
        params: {
          city,
          country,
          method: calculationMethod,
          date: dateStr,
        },
        timeout,
      });

      if (response.data?.code === 200 && response.data?.data?.timings) {
        const prayerTimes = response.data.data.timings;
        
        // Cache for 24 hours
        if (cacheEnabled) {
          const expiry = Date.now() + (24 * 60 * 60 * 1000);
          this.cache.set(cacheKey, { data: prayerTimes, expiry });
        }

        return this.applyAdjustments(prayerTimes, adjustments);
      } else {
        throw new Error('Invalid response from prayer times API');
      }
    } catch (error) {
      throw new Error(`Failed to fetch prayer times: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current prayer based on current time
   */
  getCurrentPrayer(prayerTimes: PrayerTimes): { name: string; time: string; next: { name: string; time: string } } | null {
    const now = dayjs();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.Fajr },
      { name: 'Sunrise', time: prayerTimes.Sunrise },
      { name: 'Dhuhr', time: prayerTimes.Dhuhr },
      { name: 'Asr', time: prayerTimes.Asr },
      { name: 'Maghrib', time: prayerTimes.Maghrib },
      { name: 'Isha', time: prayerTimes.Isha },
    ];

    for (let i = 0; i < prayers.length; i++) {
      const prayer = prayers[i];
      if (!prayer) continue;
      
      const prayerTime = dayjs(prayer.time, 'HH:mm');
      if (now.isBefore(prayerTime)) {
        const previousPrayer = i > 0 ? prayers[i - 1] : prayers[prayers.length - 1];
        if (!previousPrayer) continue;
        
        return {
          name: previousPrayer.name,
          time: previousPrayer.time,
          next: prayer
        };
      }
    }

    // If after Isha, current is Isha and next is Fajr
    return {
      name: 'Isha',
      time: prayerTimes.Isha,
      next: { name: 'Fajr', time: prayerTimes.Fajr }
    };
  }

  /**
   * Get time remaining until next prayer
   */
  getTimeUntilNextPrayer(prayerTimes: PrayerTimes): { minutes: number; seconds: number; nextPrayer: string } {
    const current = this.getCurrentPrayer(prayerTimes);
    if (!current) {
      return { minutes: 0, seconds: 0, nextPrayer: 'Fajr' };
    }

    const now = dayjs();
    const nextPrayerTime = dayjs(current.next.time, 'HH:mm');
    
    // If next prayer is tomorrow (after midnight)
    const timeUntil = nextPrayerTime.isBefore(now) 
      ? nextPrayerTime.add(1, 'day').diff(now, 'second')
      : nextPrayerTime.diff(now, 'second');

    return {
      minutes: Math.floor(timeUntil / 60),
      seconds: timeUntil % 60,
      nextPrayer: current.next.name
    };
  }

  /**
   * Apply time adjustments to prayer times
   */
  private applyAdjustments(times: PrayerTimes, adjustments?: Partial<PrayerAdjustments>): PrayerTimes {
    if (!adjustments) return times;

    const adjustedTimes = { ...times };
    const prayerMap: Record<keyof PrayerAdjustments, keyof PrayerTimes> = {
      fajr: 'Fajr',
      dhuhr: 'Dhuhr',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha'
    };

    Object.entries(adjustments).forEach(([prayer, adjustment]) => {
      if (adjustment && adjustment !== 0) {
        const prayerKey = prayerMap[prayer as keyof PrayerAdjustments];
        if (prayerKey && adjustedTimes[prayerKey]) {
          const time = dayjs(adjustedTimes[prayerKey], 'HH:mm').add(adjustment, 'minute');
          adjustedTimes[prayerKey] = time.format('HH:mm');
        }
      }
    });

    return adjustedTimes;
  }

  /**
   * Validate if prayer times are reasonable (basic sanity check)
   */
  validatePrayerTimes(times: PrayerTimes): boolean {
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
    
    for (let i = 0; i < prayers.length - 1; i++) {
      const currentPrayer = prayers[i];
      const nextPrayer = prayers[i + 1];
      
      if (!currentPrayer || !nextPrayer) continue;
      
      const current = dayjs(times[currentPrayer], 'HH:mm');
      const next = dayjs(times[nextPrayer], 'HH:mm');
      
      if (current.isAfter(next)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get supported calculation methods
   */
  static getCalculationMethods(): Array<{ id: CalculationMethod; name: string; description: string }> {
    return [
      { id: CalculationMethod.JAFARI, name: "Jafari", description: "Ithna Ashari" },
      { id: CalculationMethod.KARACHI, name: "Karachi", description: "University of Islamic Sciences, Karachi" },
      { id: CalculationMethod.ISNA, name: "ISNA", description: "Islamic Society of North America" },
      { id: CalculationMethod.MWL, name: "MWL", description: "Muslim World League" },
      { id: CalculationMethod.EGYPT, name: "Egypt", description: "Egyptian General Authority of Survey" },
    ];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Utility function for quick prayer times calculation
 */
export const calculatePrayerTimes = async (
  city: string,
  country = 'France',
  calculationMethod = CalculationMethod.ISNA
): Promise<PrayerTimes> => {
  const calculator = new SalatTimesCalculator();
  return calculator.getPrayerTimes({
    city,
    country,
    calculationMethod
  });
};

/**
 * Export default instance
 */
export default SalatTimesCalculator; 
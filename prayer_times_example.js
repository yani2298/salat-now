// 🕌 Example: Using salat-times-calculator npm package
// Install: npm install salat-times-calculator

import { SalatTimesCalculator, CalculationMethod } from 'salat-times-calculator';

const calculator = new SalatTimesCalculator();

// Get prayer times for any city
const prayerTimes = await calculator.getPrayerTimes({
  city: 'Paris',
  country: 'France', 
  calculationMethod: CalculationMethod.ISNA,
  adjustments: {
    fajr: -2,    // 2 minutes earlier
    maghrib: 1   // 1 minute later
  }
});

console.log('Prayer Times:', prayerTimes);

// Get current prayer and countdown
const current = calculator.getCurrentPrayer(prayerTimes);
const countdown = calculator.getTimeUntilNextPrayer(prayerTimes);

console.log(`Current: ${current.name} | Next: ${current.next.name}`);
console.log(`Time until next prayer: ${countdown.minutes}m ${countdown.seconds}s`);

// Perfect for Islamic apps, mosque websites, prayer reminders!
// ⭐ Star the repo: https://github.com/yani2298/salat-now

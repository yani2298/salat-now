// 🕌 Building Islamic Apps with React + TypeScript
// Example from Salat Now - open source prayer times app

import React, { useState, useEffect } from 'react';
import { SalatTimesCalculator, PrayerTimes } from 'salat-times-calculator';

const IslamicPrayerApp: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [currentCity, setCurrentCity] = useState('Paris');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const calculator = new SalatTimesCalculator();
        const times = await calculator.getPrayerTimes({
          city: currentCity,
          country: 'France'
        });
        setPrayers(times);
      } catch (error) {
        console.error('Error fetching prayer times:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [currentCity]);

  if (loading) return <div>Loading prayer times...</div>;

  return (
    <div className="islamic-app">
      <h1>🕌 Prayer Times for {currentCity}</h1>
      {prayers && (
        <div className="prayer-times">
          <div>Fajr: {prayers.Fajr}</div>
          <div>Dhuhr: {prayers.Dhuhr}</div>
          <div>Asr: {prayers.Asr}</div>
          <div>Maghrib: {prayers.Maghrib}</div>
          <div>Isha: {prayers.Isha}</div>
        </div>
      )}
    </div>
  );
};

// 🚀 This example is from Salat Now - fully open source
// ⭐ Check out the full app: https://github.com/yani2298/salat-now
// 📦 Use the npm package: npm install salat-times-calculator

export default IslamicPrayerApp;

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PrayerListProps, Prayer } from '../types/prayer';
import PrayerCard from './PrayerCard';

const PrayerList: React.FC<PrayerListProps> = ({ prayerTimes, currentPrayer, nextPrayerIndex }) => {
  const prayers: Prayer[] = [
    { name: 'Fajr', time: prayerTimes.Fajr, arabicName: 'الفجر', icon: 'dawn' },
    { name: 'Dhuhr', time: prayerTimes.Dhuhr, arabicName: 'الظهر', icon: 'noon' },
    { name: 'Asr', time: prayerTimes.Asr, arabicName: 'العصر', icon: 'afternoon' },
    { name: 'Maghrib', time: prayerTimes.Maghrib, arabicName: 'المغرب', icon: 'sunset' },
    { name: 'Isha', time: prayerTimes.Isha, arabicName: 'العشاء', icon: 'night' },
  ];

  // Filtrer pour n'afficher que les prières autres que la prière courante
  const filteredPrayers = prayers.filter(prayer => prayer.name !== currentPrayer);

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Mettre à jour le widget avec les informations de prière
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI && 
        nextPrayerIndex !== undefined && nextPrayerIndex !== null && 
        prayers.length > 0 && nextPrayerIndex < prayers.length) {
      const nextPrayer = prayers[nextPrayerIndex];
      
      // Formatter le temps restant
      let remainingTime = '';
      if (nextPrayer && nextPrayer.remainingTime) {
        const hours = Math.floor(nextPrayer.remainingTime / 3600);
        const minutes = Math.floor((nextPrayer.remainingTime % 3600) / 60);
        
        if (hours > 0) {
          remainingTime = `${hours}h ${minutes}m`;
        } else {
          remainingTime = `${minutes}m`;
        }
      }
      
      // Mettre à jour le widget dans la barre de menu
      if (nextPrayer) {
        window.electronAPI.updatePrayerWidget({
          prayerName: nextPrayer.name,
          prayerTime: nextPrayer.time,
          remainingTime: remainingTime
        });
      }
    }
  }, [prayers, nextPrayerIndex]);

  return (
    <motion.div
      className="mt-2 space-y-4"
      variants={staggerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, when: "beforeChildren" }}
    >
      {filteredPrayers.map((prayer, index) => (
        <motion.div
          key={prayer.name}
          variants={childVariants}
          className="prayer-item"
        >
          <PrayerCard
            prayer={prayer}
            isNext={index === nextPrayerIndex}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PrayerList; 
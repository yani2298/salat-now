import { motion } from 'framer-motion';
import { CityHeaderProps } from '../types/prayer';

const CityHeader: React.FC<CityHeaderProps> = ({ city, gregorianDate, hijriDate }) => {
  return (
    <motion.div 
      className="text-center mb-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="city-name">{city}</h1>
      <p className="date-gregorian">{gregorianDate}</p>
      <p className="date-hijri">{hijriDate}</p>
    </motion.div>
  );
};

export default CityHeader; 
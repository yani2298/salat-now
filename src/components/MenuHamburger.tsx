import { motion } from 'framer-motion'; // Importer motion

// import { RiMenuLine } from 'react-icons/ri'; // Retiré car non utilisé

interface MenuHamburgerProps {
  onSettingsClick: () => void;
}

/**
 * Composant de bouton d'accès aux réglages simplifié avec une icône de cercles radiants animée améliorée
 * Ouvre directement les réglages lors du clic
 */
const MenuHamburger = ({ onSettingsClick }: MenuHamburgerProps) => {
  return (
    <button
      // Style ajusté: fond un peu plus foncé pour le contraste
      className="menu-button bg-indigo-800/50 backdrop-blur-sm text-white rounded-full p-3 flex items-center justify-center shadow-lg border border-white/20 hover:bg-indigo-700/70 transition-colors"
      onClick={onSettingsClick}
      aria-label="Ouvrir les réglages"
    >
      {/* Icône SVG personnalisée : 4 couches radiantes animées */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        overflow="visible"
      >
        {/* Point central statique et plein */}
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"></circle>

        {/* Cercles radiants animés avec épaisseurs et opacités variées */}
        {/* Couche 1 */}
        <motion.circle
          cx="12"
          cy="12"
          r="4"
          strokeWidth="1.8"
          stroke="currentColor"
          fill="none"
          initial={{ strokeOpacity: 0.8 }}
          animate={{ strokeOpacity: [0.8, 0.3, 0.8] }}
          transition={{
            duration: 2.5, // Durée ajustée
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Couche 2 */}
        <motion.circle
          cx="12"
          cy="12"
          r="7"
          strokeWidth="1.2"
          stroke="currentColor"
          fill="none"
          initial={{ strokeOpacity: 0.6 }}
          animate={{ strokeOpacity: [0.6, 0.15, 0.6] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4, // Décalage ajusté
          }}
        />
        {/* Couche 3 */}
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          strokeWidth="0.8"
          stroke="currentColor"
          fill="none"
          initial={{ strokeOpacity: 0.4 }}
          animate={{ strokeOpacity: [0.4, 0.1, 0.4] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8, // Décalage ajusté
          }}
        />
        {/* Couche 4 - Plus large et lumineuse */}
        <motion.circle
          cx="12"
          cy="12"
          r="13"
          strokeWidth="0.5" // Plus fin
          stroke="currentColor"
          fill="none"
          initial={{ strokeOpacity: 0.3 }}
          animate={{ strokeOpacity: [0.3, 0.7, 0.3] }} // Pic lumineux
          transition={{
            duration: 3.0, // Durée plus longue
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2, 
          }}
        />
        {/* Couche 5 - Très large et subtile */}
        <motion.circle
          cx="12"
          cy="12"
          r="16"
          strokeWidth="0.3" // Très fin
          stroke="currentColor"
          fill="none"
          initial={{ strokeOpacity: 0.2 }}
          animate={{ strokeOpacity: [0.2, 0.5, 0.2] }} // Pic lumineux subtil
          transition={{
            duration: 3.5, // Durée encore plus longue
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.6, 
          }}
        />
      </svg>
    </button>
  );
};

export default MenuHamburger;
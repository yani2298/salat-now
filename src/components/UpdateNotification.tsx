import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiCheck, FiX, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

interface UpdateNotificationProps {
  isVisible: boolean;
  updateInfo: any;
  progress: number;
  isDownloading: boolean;
  isDownloaded: boolean;
  error: string | null;
  onClose: () => void;
  onDownload: () => void;
  onInstall: () => void;
}

const UpdateNotification = ({
  isVisible,
  updateInfo,
  progress,
  isDownloading,
  isDownloaded,
  error,
  onClose,
  onDownload,
  onInstall
}: UpdateNotificationProps) => {
  const [showDetails, setShowDetails] = useState(false);

  // Variantes d'animation pour Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2, ease: "easeIn" } }
  };

  const isUpdateAvailable = () => {
    return updateInfo && updateInfo.version && updateInfo.version !== 'N/A';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 w-80"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="bg-[#1c1c1e]/95 backdrop-blur-lg rounded-xl overflow-hidden shadow-2xl border border-white/10">
            {/* En-tête */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  isDownloaded 
                    ? 'bg-green-600' 
                    : error 
                      ? 'bg-red-600' 
                      : isDownloading 
                        ? 'bg-blue-600' 
                        : isUpdateAvailable() 
                          ? 'bg-blue-600' 
                          : 'bg-gray-600'
                }`}>
                  {isDownloaded ? (
                    <FiCheck className="text-white" />
                  ) : error ? (
                    <FiAlertTriangle className="text-white" />
                  ) : isUpdateAvailable() ? (
                    <FiRefreshCw className="text-white" />
                  ) : (
                    <FiCheck className="text-white" />
                  )}
                </div>
                <h4 className="text-white font-medium">
                  {error 
                    ? "Erreur" 
                    : isUpdateAvailable() 
                      ? "Mise à jour disponible" 
                      : "Système à jour"}
                </h4>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <FiX />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-5">
              {error ? (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              ) : isUpdateAvailable() ? (
                <>
                  <p className="text-white/80 text-sm mb-3">
                    Une nouvelle version ({updateInfo?.version || 'N/A'}) de l'application est disponible.
                  </p>
                  
                  {isDownloading && !isDownloaded && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Téléchargement en cours...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {showDetails && updateInfo?.releaseNotes && (
                    <div className="mb-3 p-3 max-h-32 overflow-y-auto text-xs text-white/70 bg-white/5 rounded-lg">
                      <p className="font-medium text-white/90 mb-1">Notes de version :</p>
                      <div className="whitespace-pre-line">
                        {updateInfo.releaseNotes}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-white/70 text-sm">
                  Vous utilisez déjà la dernière version de l'application.
                </p>
              )}

              {/* Boutons d'action */}
              <div className="flex flex-col space-y-2">
                {!isDownloading && !isDownloaded && !error && isUpdateAvailable() && (
                  <motion.button
                    className="w-full py-2.5 rounded-lg flex justify-center items-center text-white font-medium bg-blue-600 hover:bg-blue-500 transition-colors"
                    onClick={onDownload}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiDownload className="mr-2" />
                    Télécharger
                  </motion.button>
                )}

                {!isUpdateAvailable() && !error && !isDownloading && !isDownloaded && (
                  <p className="text-center text-white/70 text-sm">
                    Vous utilisez déjà la dernière version de l'application.
                  </p>
                )}

                {isDownloaded && (
                  <motion.button
                    className="w-full py-2.5 rounded-lg flex justify-center items-center text-white font-medium bg-green-600 hover:bg-green-500 transition-colors"
                    onClick={onInstall}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiCheck className="mr-2" />
                    Installer et redémarrer
                  </motion.button>
                )}

                {updateInfo?.releaseNotes && (
                  <button
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-center"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? "Masquer les détails" : "Afficher les détails"}
                  </button>
                )}
              </div>
            </div>

            {/* Pied */}
            <div className="px-5 py-3 bg-white/5 text-center">
              <p className="text-xs text-white/60">
                Vous pouvez continuer à utiliser l'application pendant le téléchargement
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification; 
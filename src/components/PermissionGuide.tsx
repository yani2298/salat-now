import React, { useState, useEffect } from 'react';
import { FiX, FiArrowRight, FiMapPin, FiSettings, FiCheck, FiAlertTriangle } from 'react-icons/fi';

// Interface ElectronAPI
/* interface ElectronAPI {
  send: (channel: string, data: any) => void;
  on: (channel: string, func: (...args: any[]) => void) => () => void;
  showNotification: (options: { title: string; body: string }) => void;
  openSystemPreferences: (section: string) => void;
  setStartupLaunch: (enabled: boolean) => void;
  getStartupLaunchStatus: () => Promise<boolean>;
} */

// Définir l'interface pour window.electron
// Cette interface est déjà définie dans src/types/electron.d.ts
// Suppression pour éviter la double déclaration
/* declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} */

interface PermissionGuideProps {
  onClose: () => void;
  isOpen: boolean;
  onRequestPermission?: () => void;
}

const PermissionGuide: React.FC<PermissionGuideProps> = ({ onClose, isOpen, onRequestPermission }) => {
  const [step, setStep] = useState(1);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [os, setOs] = useState<string | null>(null);

  useEffect(() => {
    // Détecter le système d'exploitation
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) {
      setOs('mac');
    } else if (platform.includes('win')) {
      setOs('windows');
    } else {
      setOs('other');
    }

    // Vérifier si la permission est déjà accordée
    checkPermissionStatus();
  }, []);

  // Vérifier périodiquement le statut de permission
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkPermissionStatus();
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const checkPermissionStatus = () => {
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        setIsPermissionGranted(result.state === 'granted');
      })
      .catch(() => {
        // Fallback pour les navigateurs qui ne supportent pas l'API Permissions
        navigator.geolocation.getCurrentPosition(
          () => setIsPermissionGranted(true),
          () => setIsPermissionGranted(false),
          { timeout: 5000 }
        );
      });
  };

  const openSystemPreferences = () => {
    if (window.electronAPI && window.electronAPI.openSystemPreferences) {
      window.electronAPI.openSystemPreferences('location');
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      checkPermissionStatus();
      onClose();
    }
  };

  const title = 
    step === 1 ? "Pourquoi avons-nous besoin de votre localisation ?" :
    step === 2 ? "Comment activer la localisation" :
    "Vérification des permissions";

  const description = 
    step === 1 ? "Pour calculer avec précision les horaires de prière, l'application a besoin de connaître votre ville." :
    step === 2 ? "Suivez ces étapes pour autoriser l'accès à votre position" :
    "Vérifiez que l'application dispose des autorisations nécessaires";

  return (
    isOpen ? (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c1e] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* En-tête */}
        <div className="p-5 border-b border-white/10 relative flex items-center justify-center">
            <button
              onClick={onClose}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-[#2c2c2e] text-white/70 hover:bg-[#3c3c3e] transition-colors"
            >
            <FiX />
            </button>
          <h2 className="text-white font-semibold text-xl">{title}</h2>
          </div>

        {/* Corps */}
        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-white/80 text-center mb-6">{description}</p>

          {/* Étape 1: Explication */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-[#2c2c2e] p-4 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 p-2 rounded-full flex-shrink-0">
                    <FiMapPin className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Calcul précis des horaires de prière</h3>
                    <p className="text-white/70 text-sm">
                      Pour déterminer avec précision les heures de prière, nous avons besoin de connaître votre position géographique.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#2c2c2e] p-4 rounded-xl">
                <div className="flex items-start space-x-3">
                  <div className="bg-[#3c3c3e] p-2 rounded-full flex-shrink-0">
                    <FiCheck className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Confidentialité respectée</h3>
                    <p className="text-white/70 text-sm">
                      Votre position est utilisée uniquement sur votre appareil pour déterminer votre ville. Aucune donnée n'est stockée sur nos serveurs.
                    </p>
                  </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
          {/* Étape 2: Guide d'activation */}
          {step === 2 && (
            <div>
              {os === 'mac' && (
                <div className="space-y-5">
                  <div className="bg-[#2c2c2e] p-4 rounded-xl">
                    <h3 className="text-white font-medium mb-3">Sur macOS</h3>
                    <ol className="space-y-3 text-sm text-white/80">
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                        <span>Cliquez sur le bouton "Ouvrir les Réglages" ci-dessous</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                        <span>Dans "Confidentialité & Sécurité", sélectionnez "Service de localisation"</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                        <span>Activez "Services de localisation" en haut</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">4</span>
                        <span>Descendez jusqu'à trouver cette application et cochez la case</span>
                      </li>
                    </ol>
                      </div>
                    </div>
                  )}
                  
              {os === 'windows' && (
                <div className="space-y-5">
                  <div className="bg-[#2c2c2e] p-4 rounded-xl">
                    <h3 className="text-white font-medium mb-3">Sur Windows</h3>
                    <ol className="space-y-3 text-sm text-white/80">
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                        <span>Cliquez sur le bouton "Ouvrir les Paramètres" ci-dessous</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                        <span>Sélectionnez "Confidentialité" puis "Localisation"</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                        <span>Activez "Autoriser les applications à accéder à votre position"</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">4</span>
                        <span>Trouvez cette application dans la liste et activez l'accès</span>
                      </li>
                    </ol>
                      </div>
                    </div>
                  )}
                  
              {os === 'other' && (
                <div className="bg-[#2c2c2e] p-4 rounded-xl">
                  <h3 className="text-white font-medium mb-3">Dans votre navigateur</h3>
                  <p className="text-white/70 text-sm mb-3">
                    Lorsque votre navigateur vous demande l'autorisation d'accéder à votre position, cliquez sur "Autoriser".
                  </p>
                  <div className="bg-[#1c1c1e] p-3 rounded-lg border border-white/10 text-sm text-white/80">
                    Si vous avez précédemment refusé l'accès, vous devrez réinitialiser cette permission dans les paramètres de votre navigateur.
                      </div>
                    </div>
                  )}
            </div>
          )}

          {/* Étape 3: Vérification */}
          {step === 3 && (
            <div className="space-y-5">
              <div className={`p-4 rounded-xl flex items-start ${isPermissionGranted ? 'bg-green-900/20 border border-green-500/30' : 'bg-[#2c2c2e]'}`}>
                <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${isPermissionGranted ? 'bg-green-600' : 'bg-[#3c3c3e]'}`}>
                  {isPermissionGranted ? <FiCheck className="text-white" /> : <FiAlertTriangle className="text-white" />}
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">
                    {isPermissionGranted ? 'Accès autorisé' : 'Accès non autorisé'}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {isPermissionGranted 
                      ? 'Votre navigateur a autorisé l\'accès à votre position. Vous pouvez maintenant utiliser la détection automatique.' 
                      : 'L\'accès à votre position n\'a pas encore été autorisé. Veuillez réessayer ou configurer manuellement votre ville.'}
                  </p>
                </div>
              </div>
              
              {!isPermissionGranted && (
                <div className="bg-[#2c2c2e] p-4 rounded-xl">
                  <h3 className="text-white font-medium mb-3">Que faire si ça ne fonctionne pas ?</h3>
                  <ul className="space-y-3 text-sm text-white/80">
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                      <span>Vérifiez que votre appareil a activé la fonction de localisation au niveau système</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                      <span>Assurez-vous que cette application a l'autorisation d'accéder à votre position</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                      <span>Si le problème persiste, vous pouvez toujours saisir manuellement votre ville</span>
                    </li>
                  </ul>
              </div>
            )}
            </div>
          )}
            </div>

        {/* Actions */}
        <div className="p-5 border-t border-white/10 flex items-center justify-between">
          {step > 1 && (
                <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg bg-[#2c2c2e] text-white hover:bg-[#3c3c3e] transition-colors text-sm"
                >
                  Retour
                </button>
              )}
          {step === 1 && (
                  <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#2c2c2e] text-white hover:bg-[#3c3c3e] transition-colors text-sm"
                  >
              Annuler
                  </button>
                )}

          <div className="flex space-x-3">
            {step >= 2 && (
                <button
                onClick={openSystemPreferences}
                className="px-4 py-2 rounded-lg bg-[#3c3c3e] text-white flex items-center hover:bg-[#4c4c4e] transition-colors text-sm"
              >
                <FiSettings className="mr-2" />
                <span>Ouvrir les {os === 'mac' ? 'Réglages' : 'Paramètres'}</span>
              </button>
            )}
            <button
              onClick={() => {
                if (step === 3) {
                  onClose();
                } else if (step === 2 && onRequestPermission) {
                  onRequestPermission();
                  // Ne pas passer à l'étape suivante immédiatement
                  // pour laisser le temps au système de demander la permission
                  setTimeout(() => nextStep(), 500);
                } else {
                  nextStep();
                }
              }}
              className={`px-5 py-2 rounded-lg flex items-center text-sm 
                ${step === 3 && isPermissionGranted 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
            >
              <span>{step === 3 ? (isPermissionGranted ? 'Terminer' : 'Continuer sans localisation') : 'Suivant'}</span>
              {step < 3 && <FiArrowRight className="ml-2" />}
                </button>
              </div>
            </div>
          </div>
      </div>
    ) : null
  );
};

export default PermissionGuide; 
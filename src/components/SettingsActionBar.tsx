import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import './SettingsPanel.css';

interface SettingsActionBarProps {
  onSave: () => void;
  onCancel: () => void;
  isGeolocating: boolean;
}

const SettingsActionBar: React.FC<SettingsActionBarProps> = ({ 
  onSave, 
  onCancel, 
  isGeolocating 
}) => {
  return (
    <div className="action-bar">
      <div className="action-buttons">
        <button
          onClick={onCancel}
          className="settings-button py-3.5 px-4 bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white font-medium rounded-xl"
        >
          Annuler
        </button>
        <button
          onClick={onSave}
          className="settings-button py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center justify-center"
          disabled={isGeolocating}
        >
          {isGeolocating ? (
            <>
              <FiRefreshCw className="animate-spin mr-2" />
              Localisation...
            </>
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsActionBar; 
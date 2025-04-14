import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiSearch, FiX } from 'react-icons/fi';
import { getCitySuggestions, LocationSuggestion } from '../services/locationService';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSearchInputProps {
  onSelectLocation: (location: LocationSuggestion | null) => void;
  initialLocation?: LocationSuggestion | null;
  placeholder?: string;
  className?: string;
}

// Fonction pour mettre en évidence les termes de recherche dans le texte
const highlightMatch = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) {
    return <>{text}</>;
  }
  
  const regex = new RegExp(`(${searchTerm.toLowerCase()})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part.toLowerCase()) 
          ? <span key={i} className="bg-blue-500/20 text-blue-300">{part}</span> 
          : <span key={i}>{part}</span>
      )}
    </>
  );
};

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  onSelectLocation,
  initialLocation = null,
  placeholder = 'Rechercher une ville...',
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(initialLocation);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialiser le terme de recherche quand la localisation change
  useEffect(() => {
    setSelectedLocation(initialLocation);
  }, [initialLocation]);

  // Charger les suggestions quand l'utilisateur tape
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 1) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        console.log('Recherche de suggestions pour:', searchTerm);
        const results = await getCitySuggestions(searchTerm);
        console.log('Suggestions reçues:', results);
        setSuggestions(results);
      } catch (error) {
        console.error('Erreur lors de la recherche de suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Gérer les clics à l'extérieur pour fermer les suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sélectionner une suggestion
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setSearchTerm('');
    setSuggestions([]);
    setIsFocused(false);
    onSelectLocation(suggestion);
  };

  // Effacer la sélection
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setSearchTerm('');
    onSelectLocation(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Gestion du changement de texte
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 0) {
      setIsFocused(true);
    }
  };

  console.log('Render state:', { searchTerm, suggestions: suggestions.length, isFocused, isLoading });

  return (
    <div className={`relative w-full ${className}`}>
      {/* Afficher la localisation sélectionnée */}
      {selectedLocation ? (
        <div className="flex items-center p-3 bg-[#2c2c2e] rounded-xl border border-white/10 mb-0">
          <FiMapPin className="text-blue-500 mr-2" />
          <div className="flex-1">
            <div className="font-medium text-white">{selectedLocation.name}</div>
            <div className="text-xs text-white/50">{selectedLocation.country}</div>
          </div>
          <button 
            onClick={handleClearLocation}
            className="p-1 rounded-full hover:bg-[#3c3c3e] transition-colors"
            aria-label="Effacer la localisation"
          >
            <FiX className="text-white/70" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-white/50" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="block w-full pl-10 pr-4 py-3 border border-white/10 rounded-xl bg-[#2c2c2e] text-white focus:border-blue-500 focus:outline-none shadow-inner"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {/* Afficher les suggestions */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-1 w-full bg-[#1c1c1e] shadow-lg rounded-xl border border-white/10 max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="p-3 hover:bg-[#2c2c2e] cursor-pointer flex items-start"
              >
                <FiMapPin className="text-blue-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium text-white">
                    {highlightMatch(suggestion.name, searchTerm)}
                  </div>
                  <div className="text-xs text-white/50">
                    {highlightMatch(suggestion.country, searchTerm)} {suggestion.countryCode ? `(${suggestion.countryCode})` : ''}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationSearchInput; 
// Toutes les API Node.js sont disponibles dans le processus de préchargement.
const { contextBridge, ipcRenderer, shell } = require('electron');

// Liste des canaux IPC autorisés pour la sécurité
const validSendChannels = [
  'show-notification', 
  'open-system-preferences', 
  'set-startup-launch',
  'get-startup-launch-status',
  'get-app-version',
  'open-external-url',
  'update-tray-title',
  'set-menu-display-seconds',
  'set-menu-display-icon',
  'update-prayer-info' // Nouveau canal pour le widget de prière
];

const validReceiveChannels = [
  'startup-launch-status',
  'app-version'
];

// Exposer ipcRenderer de manière sécurisée au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // Méthode sécurisée pour envoyer des messages IPC
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`Channel ${channel} not authorized for sending`);
    }
  },
  
  // Méthode sécurisée pour recevoir des messages IPC
  on: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      // Supprimer l'encapsulage pour conserver la fonction d'origine lors de la suppression de l'écouteur
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      // Retourner une fonction pour se désabonner
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    } else {
      console.warn(`Channel ${channel} not authorized for receiving`);
      return () => {}; // Fonction vide pour éviter les erreurs
    }
  },
  
  // Fonction pour afficher une notification avec Electron
  showNotification: (options) => {
    ipcRenderer.send('show-notification', options);
  },
  
  // Fonction pour ouvrir les préférences système selon l'OS
  openSystemPreferences: (section) => {
    ipcRenderer.send('open-system-preferences', { section });
  },
  
  // Fonction pour configurer le lancement au démarrage de l'OS
  setStartupLaunch: (enabled) => {
    ipcRenderer.send('set-startup-launch', { enabled });
  },
  
  // Fonction pour récupérer l'état du lancement au démarrage
  getStartupLaunchStatus: () => {
    return new Promise((resolve) => {
      ipcRenderer.once('startup-launch-status', (_, status) => {
        resolve(status);
      });
      ipcRenderer.send('get-startup-launch-status');
    });
  },
  
  // Fonction pour obtenir la version de l'application
  getAppVersion: () => {
    return new Promise((resolve) => {
      ipcRenderer.once('app-version', (_, version) => {
        resolve(version);
      });
      ipcRenderer.send('get-app-version');
    });
  },
  
  // Fonction pour ouvrir des URL externes de manière sécurisée
  openExternal: (url) => {
    // Validation de sécurité pour les URL
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      console.log('preload: openExternal called with URL:', url);
      ipcRenderer.send('open-external-url', url);
    } else {
      console.error('Invalid URL scheme rejected for security:', url);
    }
  },
  
  // Mise à jour du widget de prière dans la barre de menu
  updatePrayerWidget: (prayerInfo) => {
    if (prayerInfo && prayerInfo.prayerName && prayerInfo.prayerTime) {
      ipcRenderer.send('update-prayer-info', prayerInfo);
    }
  },
  
  // Exposer des informations sur la plateforme
  platform: process.platform
});

// Exposer process.platform directement
contextBridge.exposeInMainWorld('process', {
  platform: process.platform
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
  
  // Ajouter un style pour bloquer complètement le défilement de la fenêtre principale
  const style = document.createElement('style');
  style.textContent = `
    /* Désactiver complètement le défilement pour l'ensemble de la page */
    html, body {
      overflow: hidden !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      position: fixed !important;
      width: 100% !important;
    }
    
    /* Garantir que le conteneur principal remplit l'espace disponible sans débordement */
    .app-container {
      height: 100vh !important;
      width: 100% !important;
      overflow: hidden !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
    }
  `;
  document.head.appendChild(style);

  // Fonction pour observer les mutations du DOM et appliquer des styles dynamiquement
  // aux éléments spécifiques qui doivent défiler
  const observer = new MutationObserver((mutations) => {
    // Rechercher les éléments qui contiennent la liste des prières
    const prayerListContainer = document.querySelector('.mt-2.space-y-4');
    if (prayerListContainer) {
      prayerListContainer.style.overflowY = 'auto';
      prayerListContainer.style.maxHeight = '300px'; // Hauteur maximale pour permettre le défilement
      
      // S'assurer que le conteneur parent permet également le défilement
      if (prayerListContainer.parentElement) {
        prayerListContainer.parentElement.style.overflowY = 'visible';
      }
    }
    
    // Configurer le défilement horizontal pour les mosquées à proximité
    const mosquesContainer = document.querySelector('.scrollbar-hide');
    if (mosquesContainer) {
      mosquesContainer.style.overflowX = 'auto';
      mosquesContainer.style.overflowY = 'hidden';
    }
  });

  // Observer les changements dans le DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Méthodes sécurisées exposées au processus de rendu
contextBridge.exposeInMainWorld('electron', {
  // Navigation système
  openSystemPreferences: (options) => {
    ipcRenderer.send('open-system-preferences', options);
  },
  
  openExternalUrl: (url) => {
    ipcRenderer.send('open-external-url', url);
  },
  
  // Gestion de l'adhan
  stopAdhan: () => {
    ipcRenderer.send('stop-adhan');
  },
  
  // Méthodes pour la barre de menu
  updateTrayTitle: (title) => {
    ipcRenderer.send('update-tray-title', title);
  },
  
  // Configuration des préférences de démarrage
  setStartupLaunch: (options) => {
    ipcRenderer.send('set-startup-launch', options);
  },
  
  getStartupLaunchStatus: () => {
    ipcRenderer.send('get-startup-launch-status');
  },
  
  // Notifications
  showNotification: (options) => {
    ipcRenderer.send('show-notification', options);
  },
  
  // Méthodes de configuration
  setMenuDisplaySeconds: (enabled) => {
    ipcRenderer.send('set-menu-display-seconds', enabled);
  },
  
  setMenuDisplayIcon: (enabled) => {
    ipcRenderer.send('set-menu-display-icon', enabled);
  },
  
  // Écouteurs d'événements
  onStartupLaunchStatus: (callback) => {
    ipcRenderer.on('startup-launch-status', (_, status) => callback(status));
  },
  
  onNotificationClicked: (callback) => {
    ipcRenderer.on('notification-clicked', (_, data) => callback(data));
  },
  
  // Version de l'application
  getAppVersion: () => {
    ipcRenderer.send('get-app-version');
  },
  
  onAppVersion: (callback) => {
    ipcRenderer.on('app-version', (_, version) => callback(version));
  },
  
  // NOUVEAU: Système de mise à jour
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },
  
  downloadUpdate: () => {
    ipcRenderer.send('download-update');
  },
  
  installUpdate: () => {
    ipcRenderer.send('install-update');
  },
  
  // Écouteurs d'événements pour les mises à jour
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_, info) => callback(info));
  },
  
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', () => callback());
  },
  
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('update-download-progress', (_, progressObj) => callback(progressObj));
  },
  
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info));
  },
  
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (_, err) => callback(err));
  },
});
// Type definitions for Electron integration
interface ElectronAPI {
  // Navigation système
  openSystemPreferences: (options: { section: string }) => void;
  openExternalUrl: (url: string) => void;
  
  // Gestion de l'adhan
  stopAdhan: () => void;
  
  // Méthodes pour la barre de menu
  updateTrayTitle: (title: string) => void;
  
  // Configuration des préférences de démarrage
  setStartupLaunch: (options: { enabled: boolean }) => void;
  getStartupLaunchStatus: () => void;
  
  // Notifications
  showNotification: (options: {
    title: string;
    body: string;
    silent?: boolean;
    subtitle?: string;
    id?: string;
  }) => void;
  
  // Méthodes de configuration
  setMenuDisplaySeconds: (enabled: boolean) => void;
  setMenuDisplayIcon: (enabled: boolean) => void;
  
  // Écouteurs d'événements
  onStartupLaunchStatus: (callback: (status: boolean) => void) => void;
  onNotificationClicked: (callback: (data: { id: string }) => void) => void;
  
  // Version de l'application
  getAppVersion: () => void;
  onAppVersion: (callback: (version: string) => void) => void;
  
  // Système de mise à jour
  checkForUpdates: () => void;
  downloadUpdate: () => void;
  installUpdate: () => void;
  
  // Écouteurs d'événements pour les mises à jour
  onUpdateAvailable: (callback: (info: any) => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onUpdateDownloadProgress: (callback: (progressObj: { 
    percent: number;
    bytesPerSecond: number;
    total: number;
    transferred: number;
  }) => void) => void;
  onUpdateDownloaded: (callback: (info: any) => void) => void;
  onUpdateError: (callback: (err: Error) => void) => void;
  
  // Quitter l'application
  quitApp: () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    process: {
      platform: string;
    }
  }
}

export {}; 
export interface IElectronAPI {
  send: (channel: string, data?: any) => void;
  on: (channel: string, listener: (...args: any[]) => void) => () => void; 
  // Ajoutez d'autres méthodes si nécessaire
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 
const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

// Gardez une référence globale des objets, sinon ils seront fermés
// automatiquement lorsque l'objet JavaScript sera garbage collecté
let tray = null;
let window = null;

function createWindow() {
  console.log('Creating window...');
  
  try {
    // Créer la fenêtre du navigateur
    window = new BrowserWindow({
      width: 340,
      height: 550,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: false
      },
      resizable: false,
      transparent: true,
      frame: false,
      show: false,
      hasShadow: true,
      skipTaskbar: true
    });

    // Charger l'index.html de l'application
    window.loadFile(path.join(__dirname, '../dist/index.html'));

    // Ouvrir les outils de développement en mode développement
    if (process.env.NODE_ENV === 'development') {
      window.webContents.openDevTools({ mode: 'detach' });
    }

    // Cacher la fenêtre plutôt que la fermer quand l'utilisateur clique sur fermer
    window.on('close', function (event) {
      if (!app.isQuitting) {
        event.preventDefault();
        window.hide();
        return false;
      }
      return true;
    });

    // Créer l'icône de la barre des tâches
    console.log('Icon path:', path.join(__dirname, 'icons', 'iconTemplate.png'));
    tray = new Tray(path.join(__dirname, 'icons', 'iconTemplate.png'));
    tray.setToolTip('Muslim Prayer App');
    
    // Afficher ou cacher la fenêtre quand on clique sur l'icône
    tray.on('click', () => {
      if (window.isVisible()) {
        window.hide();
      } else {
        window.show();
      }
    });
    
    // Menu contextuel pour le tray
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Afficher l\'application', 
        click: () => { window.show(); } 
      },
      { 
        label: 'Quitter', 
        click: () => { 
          app.isQuitting = true;
          app.quit(); 
        } 
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    
    console.log('Tray and window created successfully');
  } catch (error) {
    console.error('Error creating window or tray:', error);
  }
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigation.
app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();
}).catch(error => {
  console.error('Error in whenReady:', error);
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Sur macOS, recréer une fenêtre dans l'application quand
// l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres ouvertes.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 
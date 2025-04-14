const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, shell, systemPreferences, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { autoUpdater } = require('electron-updater');

// Gardez une référence globale des objets, sinon ils seront fermés
// automatiquement lorsque l'objet JavaScript sera garbage collecté
let tray = null;
let window = null;

// Variables pour les préférences d'affichage du menu
let showMenuIcon = true;
let showSeconds = true;

// Configuration de l'autoupdater
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  console.log('Creating window...');

  try {
    // Vérifier les préférences de l'utilisateur pour l'affichage de la barre de menu
    let showMenuIconPref = true;
    let showSecondsPref = true;
    
    // Lire à partir du stockage local si disponible
    if (app.isReady() && window && window.webContents) {
      window.webContents.executeJavaScript(`localStorage.getItem('menu_show_icon') !== 'false'`)
        .then(result => {
          showMenuIcon = result;
        }).catch(err => console.error('Error getting menu_show_icon preference:', err));
      
      window.webContents.executeJavaScript(`localStorage.getItem('menu_show_seconds') !== 'false'`)
        .then(result => {
          showSeconds = result;
        }).catch(err => console.error('Error getting menu_show_seconds preference:', err));
    }
    
    // Créer d'abord l'icône de la barre des menus pour pouvoir positionner la fenêtre par rapport à elle
    let iconPath = path.join(__dirname, 'icons', 'mosqueTemplate.png');
    let icon = nativeImage.createFromPath(iconPath);

    if (process.platform === 'darwin') {
      // Créer une icône visible ou invisible selon la préférence
      if (showMenuIconPref) {
        // Redimensionner l'icône à une taille appropriée pour la barre de menu
        const resizedIcon = icon.resize({
          width: 18,
          height: 18,
          quality: 'best' // Utiliser la meilleure qualité de redimensionnement
        });

        // Utiliser l'icône redimensionnée comme template
        resizedIcon.setTemplateImage(true);
        tray = new Tray(resizedIcon); // Utiliser l'icône redimensionnée
      } else {
        // Utiliser une icône vide si l'utilisateur a désactivé l'affichage
        const emptyIcon = nativeImage.createEmpty();
        tray = new Tray(emptyIcon);
      }
    } else {
      // Pour les autres plateformes, utiliser l'icône telle quelle
      tray = new Tray(icon);
    }

    tray.setToolTip('Salat Now');
    tray.setIgnoreDoubleClickEvents(true);
    console.log('Tray icon created successfully');

    // --- NOUVEAU : Écouter les mises à jour du titre depuis le renderer ---
    ipcMain.on('update-tray-title', (event, title) => {
      if (tray && title) {
        tray.setTitle(title);
      }
    });
    // --- Fin NOUVEAU ---

    // --- NOUVEAU : Gérer l'affichage des secondes dans la barre de menu ---
    ipcMain.on('set-menu-display-seconds', (event, enabled) => {
      showSeconds = enabled;
      console.log(`Affichage des secondes dans la barre de menu: ${enabled}`);
    });
    // --- Fin NOUVEAU ---

    // --- NOUVEAU : Gérer l'affichage de l'icône dans la barre de menu ---
    ipcMain.on('set-menu-display-icon', (event, enabled) => {
      showMenuIcon = enabled;
      console.log(`Affichage de l'icône dans la barre de menu: ${enabled}`);
      
      if (tray) {
        if (process.platform === 'darwin') {
          // Sur macOS, nous pouvons gérer la visibilité de l'icône
          if (enabled) {
            // Restaurer l'icône si elle était masquée
            let iconPath = path.join(__dirname, 'icons', 'mosqueTemplate.png');
            let icon = nativeImage.createFromPath(iconPath);
            
            // Redimensionner l'icône à une taille appropriée pour la barre de menu
            const resizedIcon = icon.resize({
              width: 18,
              height: 18,
              quality: 'best'
            });
            
            // Utiliser l'icône redimensionnée comme template
            resizedIcon.setTemplateImage(true);
            tray.setImage(resizedIcon);
          } else {
            // Utiliser une icône transparente pour "masquer" l'icône
            // mais garder le titre et la fonctionnalité
            const emptyIcon = nativeImage.createEmpty();
            tray.setImage(emptyIcon);
          }
        }
      }
    });
    // --- Fin NOUVEAU ---

    // Obtenir la position du tray
    const trayBounds = tray.getBounds();

    // Calculer la position initiale pour la fenêtre
    let initialX = 0, initialY = 0;

    if (trayBounds && trayBounds.x && trayBounds.width) {
      initialX = Math.round(trayBounds.x + (trayBounds.width / 2) - 170); // 340/2
      initialY = Math.round(trayBounds.y + trayBounds.height + 2);
      console.log(`Calculated initial position: x:${initialX}, y:${initialY}`);
    } else {
      // Fallback si les coordonnées du tray ne sont pas disponibles
      const screenElectron = require('electron').screen;
      const primaryDisplay = screenElectron.getPrimaryDisplay();
      const { width } = primaryDisplay.workAreaSize;
      initialX = width - 340 - 10;
      initialY = 30;
      console.log(`Using fallback position: x:${initialX}, y:${initialY}`);
    }

    // Créer la fenêtre du navigateur à la position calculée
    window = new BrowserWindow({
      width: 360,
      height: 540, // Hauteur fixe pour éviter le défilement
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
        disableHardwareAcceleration: true,
        webSecurity: true
      },
      resizable: false,
      transparent: false,
      frame: false,
      show: false,
      hasShadow: true,
      skipTaskbar: true,
      backgroundColor: '#1b1e36',
      useContentSize: true,
      alwaysOnTop: false,
      movable: false,
      fullscreenable: false,
    });

    // Définir un Content Security Policy sécurisé
    window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://api.dicebear.com; font-src 'self'; connect-src 'self' https://api.aladhan.com https://api.open-meteo.com https://overpass-api.de https://overpass.openstreetmap.fr https://overpass.kumi.systems https://*.openstreetmap.org https://*.google.com https://maps.googleapis.com https://ipapi.co https://nominatim.openstreetmap.org"
          ]
        }
      });
    });

    // Charger l'index.html de l'application depuis le dossier dist
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading HTML from:', indexPath);
    window.loadFile(indexPath).then(() => {
      console.log('Successfully loaded the application from dist folder');
    }).catch(error => {
      console.error('Failed to load the application:', error);
      // Afficher une page d'erreur en cas d'échec
      window.webContents.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head>
          <title>Erreur de chargement</title>
          <style>
            body {
              background-color: #1b1e36;
              color: white;
              font-family: system-ui;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 0 20px;
              text-align: center;
            }
            h3 {
              margin-bottom: 10px;
            }
            p {
              margin-top: 0;
            }
          </style>
        </head>
        <body>
          <h3>Impossible de charger l'application</h3>
          <p>Erreur: ${error.message}</p>
          <p>Chemin: ${indexPath}</p>
        </body>
      </html>
      `);
    });

    // Afficher et positionner la fenêtre une fois le contenu chargé ET le tray prêt
    window.once('ready-to-show', () => {
      console.log('Window is ready, attempting initial positioning...');
      try {
        const trayBounds = tray.getBounds();
        const windowBounds = window.getBounds();

        if (trayBounds && trayBounds.x !== undefined && trayBounds.width !== undefined) {
          const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
          const y = Math.round(trayBounds.y + trayBounds.height + 2);

          console.log(`Positioning window at x:${x}, y:${y} from tray bounds:`, trayBounds);
          window.setPosition(x, y, false);
        } else {
          console.warn('Could not get tray bounds on ready-to-show, using fallback.');
          const screenElectron = require('electron').screen;
          const primaryDisplay = screenElectron.getPrimaryDisplay();
          const { width } = primaryDisplay.workAreaSize;
          window.setPosition(width - windowBounds.width - 10, 30);
        }

        window.show(); // Afficher la fenêtre seulement MAINTENANT
        console.log('Window shown.');
      } catch (error) {
        console.error('Error during initial positioning/showing:', error);
        window.show(); // Afficher même en cas d'erreur
      }
    });

    // Ne pas ouvrir les outils de développement en production
    if (process.env.NODE_ENV === 'development') {
      window.webContents.openDevTools({ mode: 'detach' });
    }

    // Afficher ou cacher la fenêtre quand on clique sur l'icône
    tray.on('click', (event, bounds) => {
      try {
        // Récupérer les nouvelles coordonnées du tray (qui peuvent avoir changé)
        const windowBounds = window.getBounds();
        const trayBounds = bounds || tray.getBounds();

        if (trayBounds && trayBounds.x !== undefined && trayBounds.width !== undefined) {
          const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
          const y = Math.round(trayBounds.y + trayBounds.height + 2);

          // Positionner la fenêtre avant de la montrer si elle est actuellement cachée
          if (!window.isVisible()) {
            console.log(`Repositioning hidden window to x:${x}, y:${y}`);
            window.setPosition(x, y, false);
          }

          // Basculer la visibilité de la fenêtre
          if (window.isVisible()) {
            window.hide();
          } else {
            window.show();
          }
        } else {
          console.warn('Could not get tray bounds on click, toggling visibility only.');
          // Si on ne peut pas obtenir la position du tray, simplement montrer/cacher
          if (window.isVisible()) {
            window.hide();
          } else {
            window.show();
          }
        }
      } catch (error) {
        console.error('Error toggling window visibility:', error);
        window.show(); // Montrer la fenêtre même en cas d'erreur
      }
    });

    // Menu contextuel pour le tray (clic-droit)
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Afficher l\'application',
        click: () => {
          window.show();
        }
      },
      { type: 'separator' },
      {
        label: 'Ouvrir les outils de développement',
        click: () => {
          window.webContents.openDevTools({ mode: 'detach' });
        }
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => { app.quit(); }
      }
    ]);

    tray.on('right-click', () => {
      tray.popUpContextMenu(contextMenu);
    });

    // Cacher l'application au lieu de la fermer quand on clique sur la croix
    window.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        window.hide();
        return false;
      }
      return true;
    });

    // Créer un menu minimaliste pour l'application
    const appMenu = Menu.buildFromTemplate([
      {
        label: 'Salat Now',
        submenu: [
          { role: 'about', label: 'À propos' },
          { type: 'separator' },
          { role: 'quit', label: 'Quitter' }
        ]
      }
    ]);
    Menu.setApplicationMenu(appMenu);

    // Définir dock icon sur macOS
    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    console.log('Window created successfully');
  } catch (error) {
    console.error('Error creating window:', error);
  }
}

// Fonction pour ouvrir les préférences système selon l'OS
function openSystemPreferences(section) {
  console.log(`Opening system preferences for: ${section}`);
  
  const os = process.platform;
  
  if (os === 'darwin') { // macOS
    // Commandes spécifiques pour les versions récentes de macOS
    if (section === 'location') {
      // Commande AppleScript plus précise pour ouvrir directement les services de localisation
      const script = `
      tell application "System Settings"
        activate
        delay 0.5
        tell application "System Events" to tell process "System Settings"
          click menu item "Confidentialité et sécurité" of menu "Apple" of menu bar 1
          delay 0.5
          click button "Service de localisation" of window 1
        end tell
      end tell`;
      
      exec(`osascript -e '${script}'`, (error) => {
        if (error) {
          console.error('Error opening location services:', error);
          
          // Fallback method - ouvrir la page de confidentialité directement avec l'URL
          shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices');
        }
      });
    } else if (section === 'notifications') {
      shell.openExternal('x-apple.systempreferences:com.apple.preference.notifications');
    } else {
      // Fallback: ouvrir les Préférences Système générales
      shell.openExternal('x-apple.systempreferences:');
    }
  } else if (os === 'win32') { // Windows
    // Ouvrir les paramètres de Windows selon la section
    const settingsMap = {
      'location': 'ms-settings:privacy-location',
      'notifications': 'ms-settings:notifications'
    };
    
    const settingsUrl = settingsMap[section] || 'ms-settings:privacy';
    shell.openExternal(settingsUrl);
  } else if (os === 'linux') { // Linux
    // Sur Linux, c'est plus compliqué car ça dépend de l'environnement de bureau
    // Pour GNOME (Ubuntu, etc.)
    exec('gnome-control-center privacy', (error) => {
      if (error) {
        // Pour KDE
        exec('systemsettings5', (error) => {
          if (error) {
            console.error('Could not open system settings on Linux');
          }
        });
      }
    });
  }
}

// Écouteur pour les demandes d'ouverture des préférences système
ipcMain.on('open-system-preferences', (event, { section }) => {
  try {
    if (process.platform === 'darwin') {
      if (section === 'location') {
        // Ouvrir les préférences de localisation sur macOS
        exec('open x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices');
      }
    } else if (process.platform === 'win32') {
      // Ouvrir les paramètres de localisation sur Windows
      exec('start ms-settings:privacy-location');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ouverture des préférences système:', error);
  }
});

// Écouteur pour les demandes de notification avec instructions spécifiques
ipcMain.on('show-notification', (event, options) => {
  try {
    console.log('Showing notification:', options);
    
    // Création des options de notification adaptées à la plateforme
    const notificationOptions = {
      title: options.title || 'Notification',
      body: options.body || '',
      silent: options.silent || false
    };
    
    // Sur macOS, ajouter des options spécifiques
    if (process.platform === 'darwin') {
      // Vérifier si notre app a le droit d'envoyer des notifications
      if (!Notification.isSupported()) {
        console.log('Les notifications ne sont pas supportées sur ce système');
        return;
      }
      
      // Options spécifiques pour macOS
      Object.assign(notificationOptions, {
        subtitle: options.subtitle || '',
        hasReply: false,
        timeoutType: 'default',
        urgency: 'normal',
        closeButtonText: 'Fermer',
        sound: true // Utilisez un son conforme aux directives Apple
      });
    }
    
    const notification = new Notification(notificationOptions);
    
    notification.show();
    
    // Gestion des clics sur la notification
    notification.on('click', () => {
      // Rendre la fenêtre visible si elle ne l'est pas déjà
      if (window && !window.isVisible()) {
        window.show();
      }
      
      // Informer le processus de rendu que la notification a été cliquée
      if (window) {
        window.webContents.send('notification-clicked', { id: options.id });
      }
    });
    
    // Gestion des fermetures de notification (uniquement pour le débogage)
    notification.on('close', () => {
      console.log('Notification fermée');
    });
  } catch (error) {
    console.error('Erreur lors de l\'affichage de la notification:', error);
  }
});

// Écouteur pour configurer le lancement au démarrage
ipcMain.on('set-startup-launch', (event, { enabled }) => {
  try {
    console.log(`Configuring startup launch: ${enabled}`);
    
    if (process.platform === 'darwin') {
      // Configuration pour macOS
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true, // L'application démarre cachée (seulement dans la barre de menu)
        path: app.getPath('exe'), // Chemin vers l'exécutable
        args: []
      });
    } else if (process.platform === 'win32') {
      // Configuration pour Windows
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath,
        args: []
      });
    }
    
    console.log(`Startup launch configured successfully: ${enabled}`);
  } catch (error) {
    console.error('Erreur lors de la configuration du lancement au démarrage:', error);
  }
});

// Écouteur pour récupérer l'état du lancement au démarrage
ipcMain.on('get-startup-launch-status', (event) => {
  try {
    const loginSettings = app.getLoginItemSettings();
    event.reply('startup-launch-status', loginSettings.openAtLogin);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état du lancement au démarrage:', error);
    event.reply('startup-launch-status', false);
  }
});

// Écouteur pour récupérer la version de l'application
ipcMain.on('get-app-version', (event) => {
  event.reply('app-version', app.getVersion());
});

// Écouteur pour gérer l'ouverture sécurisée d'URL externes
ipcMain.on('open-external-url', (event, url) => {
  console.log('Main process: Received request to open external URL:', url);
  
  // Validation de base de l'URL pour sécurité
  try {
    const parsedUrl = new URL(url);
    // Vérifier que c'est un protocole sécurisé et autorisé
    if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
      console.log('Opening external URL:', url);
      shell.openExternal(url).catch(err => {
        console.error('Failed to open external URL:', err);
      });
    } else {
      console.warn('Blocked attempt to open URL with unsafe protocol:', parsedUrl.protocol);
    }
  } catch (error) {
    console.error('Invalid URL format:', error);
  }
});

// Désactiver les erreurs du pilote graphique 
app.disableHardwareAcceleration();

// Add SSL configuration options to fix handshake errors
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost');
app.commandLine.appendSwitch('disable-http2');
app.commandLine.appendSwitch('no-proxy-server');

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigation.
app.whenReady().then(() => {
  // Masquer l'application du Dock sur macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  
  // Vérifier les mises à jour au démarrage
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000); // Attendre 3 secondes avant de vérifier les mises à jour
  }
  
  // Optimisations pour les polices sur macOS
  if (process.platform === 'darwin') {
    app.commandLine.appendSwitch('font-render-hinting', 'slight');
    app.commandLine.appendSwitch('disable-font-subpixel-positioning');
    
    // Amélioration pour le rendu des polices arabes
    app.commandLine.appendSwitch('use-system-font-for-language-fonts', 'true');
    app.commandLine.appendSwitch('force-color-profile', 'srgb');
    app.commandLine.appendSwitch('font-antialiasing', 'standard');
    
    // Correction spécifique pour les polices arabes sur macOS
    app.commandLine.appendSwitch('v8-compile-options', 'interpret_inner');
    app.commandLine.appendSwitch('ignore-gpu-blacklist');
  }
  
  console.log('App is ready');
  createWindow();

  // Créer un raccourci clavier global
  const { globalShortcut } = require('electron');
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    console.log('Shortcut triggered');
    if (window) {
      if (window.isVisible()) {
        window.hide();
      } else {
        window.show();
      }
    }
  });

  console.log('Raccourci clavier enregistré: CommandOrControl+Shift+M');
}).catch(error => {
  console.error('Error in whenReady:', error);
});

// Empêcher l'ouverture d'une nouvelle fenêtre au lancement
app.on('activate', () => {
  if (window) {
    window.show();
  }
});

// Configuration des événements de mise à jour
autoUpdater.on('update-available', (info) => {
  // Envoyer l'info au renderer
  if (window && window.webContents) {
    window.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', () => {
  if (window && window.webContents) {
    window.webContents.send('update-not-available');
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (window && window.webContents) {
    window.webContents.send('update-download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (window && window.webContents) {
    window.webContents.send('update-downloaded', info);
  }
});

autoUpdater.on('error', (err) => {
  if (window && window.webContents) {
    window.webContents.send('update-error', err);
  }
});

// Gérer les événements de mise à jour depuis le renderer
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates()
    .catch(err => console.error('Erreur lors de la vérification des mises à jour:', err));
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate()
    .catch(err => console.error('Erreur lors du téléchargement de la mise à jour:', err));
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall(true, true);
});

// Quitter proprement quand on ferme toutes les fenêtres (sauf sur macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Indiquer que l'app est en train de quitter
app.on('before-quit', () => {
  app.isQuitting = true;
});

// Optimisation du widget dans la barre de menu pour afficher les prières
ipcMain.on('update-prayer-info', (event, { prayerName, prayerTime, remainingTime }) => {
  if (!tray) return;
  
  // Style d'affichage selon le système
  if (process.platform === 'darwin') {
    // Pour macOS: afficher le nom de la prière et l'heure
    tray.setTitle(` ${prayerName} ${prayerTime}`);
    
    // Mettre à jour le tooltip pour plus d'informations
    tray.setToolTip(`Salat Now - Prochaine prière: ${prayerName} à ${prayerTime} (${remainingTime})`);
  } else {
    // Pour Windows/Linux: tooltip seulement
    tray.setToolTip(`Prochaine prière: ${prayerName} à ${prayerTime} (${remainingTime})`);
  }
}); 
#!/bin/bash

# S'assurer que tous les paquets sont installés
echo "Vérification des dépendances..."
npm install

# Construire l'application React
echo "Construction de l'application React..."
npm run build

# Créer une structure d'application macOS
echo "Création de la structure d'application macOS..."
APPDIR="release/PrayerApp.app"
mkdir -p "$APPDIR/Contents/"{MacOS,Resources}

# Copier les ressources
echo "Copie des ressources..."
cp -R dist/* "$APPDIR/Contents/Resources/"
cp -R electron/icons "$APPDIR/Contents/Resources/"

# Copier les fichiers Electron
echo "Copie des fichiers Electron..."
mkdir -p "$APPDIR/Contents/MacOS/electron"
cp -R electron/* "$APPDIR/Contents/MacOS/electron/"

# Création du fichier Info.plist
echo "Création du fichier Info.plist..."
cat > "$APPDIR/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Prayer App</string>
    <key>CFBundleExecutable</key>
    <string>run.sh</string>
    <key>CFBundleIconFile</key>
    <string>icon.png</string>
    <key>CFBundleIdentifier</key>
    <string>com.muslim.prayer.app</string>
    <key>CFBundleName</key>
    <string>PrayerApp</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15.0</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

# Création du script exécutable avec les chemins modifiés
echo "Création du script exécutable..."
cat > "$APPDIR/Contents/MacOS/run.sh" << EOF
#!/bin/bash
# Définir le chemin du projet en fonction de l'emplacement du script
SCRIPT_DIR="\$(cd "\$(dirname "\$0")" && pwd)"
APP_ROOT="\$(dirname "\$(dirname "\$SCRIPT_DIR")")"

# Définir l'emplacement de l'exécutable Electron
export PATH="\$APP_ROOT/node_modules/.bin:\$PATH"

# Lancer Electron avec les bons chemins
cd "\$APP_ROOT"
electron "\$SCRIPT_DIR/electron/main.cjs"
EOF

# Rendre le script exécutable
chmod +x "$APPDIR/Contents/MacOS/run.sh"

# Mise à jour du fichier main.cjs pour utiliser les bons chemins
echo "Création d'une version adaptée du fichier main.cjs..."
cat > "$APPDIR/Contents/MacOS/electron/main.cjs" << EOF
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

// Gardez une référence globale des objets
let tray = null;
let window = null;

function createWindow() {
  console.log('Creating window...');
  
  try {
    // Créer l'icône de la barre des menus
    let iconPath = path.join(__dirname, 'icons', 'moon.png');
    let icon = nativeImage.createFromPath(iconPath);
    
    if (process.platform === 'darwin') {
      icon = icon.resize({ width: 16, height: 16 });
      icon.setTemplateImage(true);
    }
    
    console.log('Creating tray icon...');
    tray = new Tray(icon);
    tray.setToolTip('Muslim Prayer App');
    tray.setIgnoreDoubleClickEvents(true);
    
    // Créer la fenêtre
    window = new BrowserWindow({
      width: 340,
      height: 430,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        disableHardwareAcceleration: true
      },
      resizable: false,
      frame: false,
      show: false,
      hasShadow: true,
      skipTaskbar: false,
      backgroundColor: '#1b1e36',
      alwaysOnTop: true,
    });

    // Charger l'index.html à partir du bon chemin
    const indexPath = path.join(path.dirname(path.dirname(__dirname)), 'Resources', 'index.html');
    console.log('Loading HTML from:', indexPath);
    window.loadURL(\`file://\${indexPath}\`);

    // Afficher la fenêtre
    window.once('ready-to-show', () => {
      const trayBounds = tray.getBounds();
      const windowBounds = window.getBounds();
      
      if (trayBounds && trayBounds.x !== undefined && trayBounds.width !== undefined) {
        const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
        const y = Math.round(trayBounds.y + trayBounds.height + 2);
        window.setPosition(x, y, false);
      }
      
      window.show();
    });

    // Gérer le clic sur l'icône du tray
    tray.on('click', () => {
      if (window.isVisible()) {
        window.hide();
      } else {
        window.show();
      }
    });
    
    // Menu contextuel pour le tray (clic-droit)
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Afficher l\'application', click: () => { window.show(); } },
      { type: 'separator' },
      { label: 'Quitter', click: () => { app.quit(); } }
    ]);
    
    tray.on('right-click', () => {
      tray.popUpContextMenu(contextMenu);
    });
    
    // Cacher l'application au lieu de la fermer
    window.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        window.hide();
        return false;
      }
      return true;
    });
  } catch (error) {
    console.error('Error creating window:', error);
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
EOF

# Copier electron.js dans le dossier node_modules
echo "Copie d'Electron dans l'application..."
mkdir -p "$APPDIR/node_modules/.bin"
cp ./node_modules/.bin/electron "$APPDIR/node_modules/.bin/"

echo "Construction terminée! L'application se trouve dans le dossier 'release'."
echo "Vous pouvez ouvrir l'application avec: open release/PrayerApp.app" 
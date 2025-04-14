# Muslim Prayer App

Application de rappel des heures de prière développée avec React, Vite et Electron.

## Fonctionnalités

- Affichage des heures de prière pour une ville donnée
- Interface utilisateur élégante avec des animations fluides
- Icône dans la barre de menu macOS
- Affichage détaillé de la prochaine prière
- Option pour afficher toutes les prières du jour
- Support multiplateforme (macOS, Windows, Linux)
- Mode sombre/clair automatique
- Notifications système pour les rappels de prière

## Prérequis

- Node.js (v18+)
- npm ou yarn
- macOS, Windows ou Linux pour le développement
- Pour la notarisation macOS: compte développeur Apple

## Installation

Clonez le dépôt et installez les dépendances :

```bash
git clone <repo-url>
cd muslim-prayer-app
npm install
```

## Développement

Pour lancer l'application en mode développement :

```bash
npm run electron:dev
```

Cela démarre :
- Le serveur de développement Vite pour le frontend
- L'application Electron qui se connecte au serveur de développement

## Construction de l'application

### Méthode professionnelle (recommandée)

Cette méthode utilise notre script de build professionnel qui gère tout le processus, y compris:
- Linting du code
- Transpilation TypeScript et build Vite
- Packaging de l'application
- Création d'un installateur DMG pour macOS
- Support pour la notarisation macOS

```bash
# Pour un build de production complet
./build_pro.sh

# Pour un build de développement rapide
./build_pro.sh dev
```

### Autres méthodes de build

#### Méthode 1 : Utiliser electron-packager

```bash
npm run package
# ou pour toutes les plateformes
npm run package:all
# ou pour créer un DMG
npm run package:dmg
```

#### Méthode 2 : Utiliser electron-builder

```bash
npm run electron:build
# ou pour toutes les plateformes
npm run release
```

#### Méthode 3 : Utiliser la méthode manuelle

```bash
./build_app.sh
```

## Notarisation (macOS)

Pour notariser votre application macOS (requis pour la distribution):

1. Définissez les variables d'environnement suivantes:
```bash
export APPLE_ID=your.apple.id@example.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
export APPLE_TEAM_ID=XXXXXXXXXX
```

2. Utilisez la méthode de build professionnelle:
```bash
./build_pro.sh
```

## Installation de l'application

### macOS

Utilisez le script d'installation:
```bash
./install_app.sh
```

Ou manuellement:
```bash
cp -r release-packager/PrayerApp-darwin-x64/PrayerApp.app /Applications/
```

Ou avec l'installateur DMG (méthode recommandée):
```bash
open release-packager/installers/PrayerApp.dmg
# Puis faites glisser l'application dans le dossier Applications
```

### Windows et Linux

Pour Windows, un installateur NSIS (.exe) est généré dans le dossier `release/win`.
Pour Linux, des packages AppImage et deb sont générés dans le dossier `release/linux`.

## Désinstallation

```bash
./uninstall_app.sh
```

## Structure du projet

- `src/` - Code source React
- `electron/` - Code source Electron
- `dist/` - Build de l'application React
- `release/` - Applications construites avec electron-builder
- `release-packager/` - Applications construites avec electron-packager
- `scripts/` - Scripts utilitaires (notarisation, etc.)
- `build/` - Ressources de build (entitlements, etc.)

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement Vite
- `npm run start` - Lance l'application Electron
- `npm run build` - Construit l'application React
- `npm run electron:dev` - Lance le développement Electron+React
- `npm run electron:build` - Construit l'application avec electron-builder pour macOS
- `npm run release` - Construit l'application avec electron-builder pour toutes les plateformes
- `npm run package` - Construit l'application avec electron-packager pour macOS
- `npm run package:all` - Construit l'application avec electron-packager pour toutes les plateformes
- `npm run package:dmg` - Crée un installateur DMG pour macOS

## Résolution des problèmes

### L'application ne s'ouvre pas

Vérifiez les permissions :

```bash
chmod +x release-packager/PrayerApp-darwin-x64/PrayerApp.app/Contents/MacOS/PrayerApp
```

### L'application s'ouvre mais n'affiche rien

Vérifiez les logs dans la console en lançant l'application depuis le terminal :

```bash
open -a Console
open release-packager/PrayerApp-darwin-x64/PrayerApp.app
```

### Problèmes de notarisation

Si vous rencontrez des problèmes de notarisation, assurez-vous que :
1. Vous avez un compte développeur Apple valide
2. Les variables d'environnement sont correctement définies
3. Votre application n'utilise pas de ressources non signées

## Licence

Ce projet est sous licence MIT.

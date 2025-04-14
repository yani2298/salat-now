#!/bin/bash

# Vérifier si l'application packagée existe
if [ -d "./release-packager/PrayerApp-darwin-x64/PrayerApp.app" ]; then
  echo "Installation de l'application depuis le dossier release-packager..."
  cp -r "./release-packager/PrayerApp-darwin-x64/PrayerApp.app" ~/Applications/
  echo "Application installée dans ~/Applications/"
  echo "Vous pouvez maintenant la lancer depuis le Launchpad ou en utilisant Spotlight (⌘+Space)"
  exit 0
fi

# Vérifier si l'application manuelle existe
if [ -d "./release/PrayerApp.app" ]; then
  echo "Installation de l'application depuis le dossier release..."
  cp -r "./release/PrayerApp.app" ~/Applications/
  echo "Application installée dans ~/Applications/"
  echo "Vous pouvez maintenant la lancer depuis le Launchpad ou en utilisant Spotlight (⌘+Space)"
  exit 0
fi

# Si aucune application n'est trouvée, construire l'application
echo "Aucune application construite n'a été trouvée."
echo "Construction de l'application avec electron-packager..."
./build_packager.sh

# Installer l'application nouvellement construite
if [ -d "./release-packager/PrayerApp-darwin-x64/PrayerApp.app" ]; then
  echo "Installation de l'application..."
  cp -r "./release-packager/PrayerApp-darwin-x64/PrayerApp.app" ~/Applications/
  echo "Application installée dans ~/Applications/"
  echo "Vous pouvez maintenant la lancer depuis le Launchpad ou en utilisant Spotlight (⌘+Space)"
else
  echo "Échec de l'installation. Veuillez vérifier les logs pour plus d'informations."
fi 
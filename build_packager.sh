#!/bin/bash

# S'assurer que tous les paquets sont installés
echo "Vérification des dépendances..."
npm install

# Nettoyer les anciens dossiers
echo "Nettoyage des anciens builds..."
rm -rf release-packager

# Packager l'application avec electron-packager
echo "Packaging de l'application avec electron-packager..."
npm run package

echo "Construction terminée! L'application se trouve dans le dossier 'release-packager'."
echo "Vous pouvez ouvrir l'application avec: open release-packager/PrayerApp-darwin-x64/PrayerApp.app" 
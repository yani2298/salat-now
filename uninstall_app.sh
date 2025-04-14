#!/bin/bash

# Vérifier si l'application est installée
if [ -d ~/Applications/PrayerApp.app ]; then
  echo "Désinstallation de l'application..."
  rm -rf ~/Applications/PrayerApp.app
  echo "Application désinstallée avec succès!"
else
  echo "L'application n'est pas installée dans ~/Applications/"
  
  # Vérifier si elle est dans Applications globale
  if [ -d /Applications/PrayerApp.app ]; then
    echo "L'application est installée dans /Applications/"
    echo "Pour la désinstaller, veuillez exécuter la commande suivante avec sudo:"
    echo "sudo rm -rf /Applications/PrayerApp.app"
  else
    echo "L'application n'est pas installée sur ce système."
  fi
fi 
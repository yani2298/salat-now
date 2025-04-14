#!/bin/bash

# Couleurs pour une sortie plus lisible
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message d'en-tête
print_header() {
  echo -e "\n${BLUE}===================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===================================================${NC}\n"
}

# Fonction pour afficher un message de succès
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher un message d'erreur
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Fonction pour afficher un message d'information
print_info() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Vérifier les dépendances requises
check_dependencies() {
  print_header "Vérification des dépendances"
  
  # Vérifier que Node.js est installé
  if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
  fi
  
  # Vérifier la version de Node.js
  NODE_VERSION=$(node -v | cut -d 'v' -f 2)
  print_info "Node.js version $NODE_VERSION détectée"
  
  # Installer les dépendances npm
  print_info "Installation des dépendances npm..."
  npm install
  
  # Vérifier si electron-builder est installé
  if ! command -v electron-builder &> /dev/null; then
    print_info "electron-builder n'est pas disponible globalement, mais ce n'est pas grave car nous l'utilisons localement"
  fi
  
  # Installer des dépendances supplémentaires
  print_info "Installation de @electron/notarize..."
  npm install --save-dev @electron/notarize
  
  print_info "Installation d'electron-installer-dmg..."
  npm install --save-dev electron-installer-dmg
  
  print_success "Toutes les dépendances sont installées"
}

# Nettoyer les anciens builds
clean_old_builds() {
  print_header "Nettoyage des anciens builds"
  
  if [ -d "./release" ]; then
    print_info "Suppression du dossier release..."
    rm -rf ./release
  fi
  
  if [ -d "./release-packager" ]; then
    print_info "Suppression du dossier release-packager..."
    rm -rf ./release-packager
  fi
  
  if [ -d "./dist" ]; then
    print_info "Suppression du dossier dist..."
    rm -rf ./dist
  fi
  
  print_success "Nettoyage terminé"
}

# Linter le code
lint_code() {
  print_header "Vérification de la qualité du code"
  
  print_info "Linting du code TypeScript/React..."
  npm run lint || {
    print_error "Des erreurs de linting ont été détectées. Veuillez les corriger avant de continuer."
    exit 1
  }
  
  print_success "Code validé sans erreurs"
}

# Construire l'application
build_app() {
  print_header "Construction de l'application"
  
  print_info "Transpilation TypeScript et build Vite..."
  npm run build || {
    print_error "Erreur lors de la construction de l'application."
    exit 1
  }
  
  print_success "Application construite avec succès"
}

# Packager l'application pour macOS
package_app_mac() {
  print_header "Packaging de l'application pour macOS"
  
  if [ ! -d "electron/icons" ]; then
    print_error "Dossier d'icônes manquant. Veuillez vérifier que le dossier electron/icons existe."
    exit 1
  fi
  
  # Vérifier si nous construisons en mode release ou développement
  if [ "$1" == "dev" ]; then
    print_info "Construction en mode développement..."
    npm run electron:build:dir || {
      print_error "Erreur lors du packaging de l'application."
      exit 1
    }
  else
    print_info "Construction en mode release..."
    # Utiliser electron-builder pour construire l'application
    npm run electron:build || {
      print_error "Erreur lors du packaging de l'application."
      exit 1
    }
  fi
  
  print_success "Application packagée avec succès"
}

# Créer un installateur DMG
create_dmg() {
  print_header "Création de l'installateur DMG"
  
  print_info "Génération du DMG..."
  npm run package:dmg || {
    print_error "Erreur lors de la création du DMG."
    return 1
  }
  
  print_success "DMG créé avec succès: release-packager/installers/PrayerApp.dmg"
}

# Fonction principale
main() {
  print_header "CONSTRUCTION DE L'APPLICATION PRAYER APP - VERSION PRO"
  
  # Vérifier les arguments de la ligne de commande
  BUILD_TYPE="release"
  if [ "$1" == "dev" ]; then
    BUILD_TYPE="dev"
    print_info "Mode développement activé"
  fi
  
  # Étapes du processus de build
  check_dependencies
  clean_old_builds
  lint_code
  build_app
  package_app_mac $BUILD_TYPE
  
  if [ "$BUILD_TYPE" == "release" ]; then
    create_dmg
  fi
  
  # Afficher un résumé
  print_header "CONSTRUCTION TERMINÉE"
  print_info "Type de build: $BUILD_TYPE"
  
  if [ "$BUILD_TYPE" == "release" ]; then
    print_info "L'application est disponible dans:"
    print_info "- release/mac/PrayerApp.app (Application)"
    print_info "- release-packager/installers/PrayerApp.dmg (Installateur)"
    print_info "Pour installer l'application, ouvrez le DMG et faites glisser l'application dans le dossier Applications"
  else
    print_info "L'application est disponible dans:"
    print_info "- release/mac/PrayerApp.app"
    print_info "Pour exécuter l'application: open release/mac/PrayerApp.app"
  fi
  
  print_success "Construction réussie!"
}

# Exécuter la fonction principale avec les arguments
main "$@" 
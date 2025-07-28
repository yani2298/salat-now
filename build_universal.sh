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
  
  print_success "Toutes les dépendances sont installées"
}

# Nettoyer les anciens builds
clean_old_builds() {
  print_header "Nettoyage des anciens builds"
  
  if [ -d "./release" ]; then
    print_info "Suppression du dossier release..."
    rm -rf ./release
  fi
  
  if [ -d "./dist" ]; then
    print_info "Suppression du dossier dist..."
    rm -rf ./dist
  fi
  
  print_success "Nettoyage terminé"
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
build_universal_mac() {
  print_header "Construction de l'application universelle pour macOS"
  
  # Créer le build pour x64 (Intel)
  print_info "Construction pour Intel (x64)..."
  NODE_ENV=production npx electron-builder --mac --x64 || {
    print_error "Erreur lors de la construction pour Intel (x64)."
    exit 1
  }
  
  # Créer le build pour arm64 (Apple Silicon)
  print_info "Construction pour Apple Silicon (arm64)..."
  NODE_ENV=production npx electron-builder --mac --arm64 || {
    print_error "Erreur lors de la construction pour Apple Silicon (arm64)."
    exit 1
  }
  
  # Créer le build universel
  print_info "Construction du package universel (x64 + arm64)..."
  NODE_ENV=production npx electron-builder --mac --universal || {
    print_error "Erreur lors de la construction du package universel."
    exit 1
  }
  
  print_success "Application universelle packagée avec succès"
}

# Vérifier les builds générés
verify_builds() {
  print_header "Vérification des builds générés"
  
  if [ -d "./release/mac" ]; then
    print_info "Build Intel (x64) trouvé:"
    ls -lh ./release/mac
  else
    print_error "Build Intel (x64) non trouvé."
  fi
  
  if [ -d "./release/mac-arm64" ]; then
    print_info "Build Apple Silicon (arm64) trouvé:"
    ls -lh ./release/mac-arm64
  else
    print_error "Build Apple Silicon (arm64) non trouvé."
  fi
  
  if [ -d "./release/mac-universal" ]; then
    print_info "Build universel trouvé:"
    ls -lh ./release/mac-universal
  else
    print_error "Build universel non trouvé."
  fi
  
  # Vérifier les DMG générés
  print_info "Installateurs DMG générés:"
  ls -lh ./release/*.dmg 2>/dev/null || print_info "Aucun DMG trouvé."
  
  print_success "Vérification terminée"
}

# Fonction principale
main() {
  print_header "CONSTRUCTION DE L'APPLICATION SALAT NOW - VERSION UNIVERSELLE"
  
  # Étapes du processus de build
  check_dependencies
  clean_old_builds
  build_app
  build_universal_mac
  verify_builds
  
  # Afficher un résumé
  print_header "CONSTRUCTION TERMINÉE"
  
  print_info "L'application est disponible dans:"
  print_info "- release/mac/Salat Now.app (Intel x64)"
  print_info "- release/mac-arm64/Salat Now.app (Apple Silicon arm64)"
  print_info "- release/mac-universal/Salat Now.app (Universel - recommandé)"
  print_info "- release/*.dmg (Installateurs)"
  
  print_success "Construction universelle réussie!"
}

# Exécuter la fonction principale
main 
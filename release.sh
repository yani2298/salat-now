#!/bin/bash
set -e

# Couleurs pour une meilleure lisibilité
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ${GREEN}Préparation de Salat Now pour distribution  ${BLUE}    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"

# Vérifier les variables d'environnement pour notarisation
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ]; then
  echo -e "${YELLOW}⚠️  Variables d'environnement manquantes pour la notarisation${NC}"
  echo -e "   Pour une distribution complète, définissez: "
  echo -e "   - APPLE_ID"
  echo -e "   - APPLE_APP_SPECIFIC_PASSWORD"
  echo -e "   - APPLE_TEAM_ID"
  echo ""
fi

# 1. Nettoyage de l'environnement
echo -e "\n${GREEN}1. 🧹 Nettoyage de l'environnement...${NC}"
rm -rf dist release node_modules/.cache 2>/dev/null || true
echo -e "   ✅ Nettoyage terminé"

# 2. Installation des dépendances en mode production
echo -e "\n${GREEN}2. 📦 Installation des dépendances...${NC}"
export NODE_ENV=production
npm ci --production
echo -e "   ✅ Dépendances installées"

# 3. Suppression des logs
echo -e "\n${GREEN}3. 🔍 Nettoyage des logs de développement...${NC}"
grep -l "console.log" src/**/*.ts* 2>/dev/null | xargs -I{} sed -i '' 's/console\.log/\/\/console.log/g' {} 2>/dev/null || echo -e "   ℹ️  Aucun log à nettoyer"
echo -e "   ✅ Logs nettoyés"

# 4. Construction de l'application
echo -e "\n${GREEN}4. 🔨 Construction de l'application optimisée...${NC}"
NODE_ENV=production npm run build
echo -e "   ✅ Construction terminée"

# 5. Vérification de la taille du bundle
echo -e "\n${GREEN}5. 📏 Vérification de la taille du bundle...${NC}"
BUNDLE_SIZE=$(du -sh dist | cut -f1)
echo -e "   📊 Taille du bundle: ${YELLOW}$BUNDLE_SIZE${NC}"

# 6. Empaquetage de l'application
echo -e "\n${GREEN}6. 📦 Création des packages...${NC}"

# macOS
echo -e "   🍎 Construction pour macOS..."
electron-builder --mac --publish never || {
    echo -e "${RED}❌ Échec de la construction pour macOS${NC}"
    exit 1
}

# Windows (si cross-build configuré)
if [ -z "$SKIP_WINDOWS" ]; then
    echo -e "   🪟 Construction pour Windows..."
    electron-builder --win --publish never || echo -e "${YELLOW}⚠️  Construction Windows ignorée ou échouée${NC}"
fi

# Linux (si cross-build configuré)
if [ -z "$SKIP_LINUX" ]; then
    echo -e "   🐧 Construction pour Linux..."
    electron-builder --linux --publish never || echo -e "${YELLOW}⚠️  Construction Linux ignorée ou échouée${NC}"
fi

# 7. Afficher les résultats
echo -e "\n${GREEN}7. 🔍 Vérification des packages générés...${NC}"
DMG_SIZE=$(du -sh release/*.dmg 2>/dev/null | cut -f1)
ZIP_SIZE=$(du -sh release/*.zip 2>/dev/null | cut -f1)

# Afficher un résumé des fichiers générés
echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ${GREEN}Récapitulatif de la génération                ${BLUE}║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} 📁 DMG: ${YELLOW}$DMG_SIZE${NC}                                  ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} 📁 ZIP: ${YELLOW}$ZIP_SIZE${NC}                                  ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} 📂 Emplacement: ${YELLOW}./release/${NC}                        ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}🎉 Application prête pour distribution!${NC}"

# Instructions finales
echo -e "\n${YELLOW}Instructions pour la livraison:${NC}"
echo -e "1. Testez l'application sur différentes versions de macOS"
echo -e "2. Vérifiez le bon fonctionnement des notifications"
echo -e "3. Vérifiez la présence de l'icône dans la barre de menu"
echo -e "4. Validez l'affichage des adresses des mosquées"
echo -e "\n${GREEN}Pour installer l'application:${NC}"
echo -e "open release/*.dmg" 
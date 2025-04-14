/**
 * Script pour construire l'application sans notarisation pour faciliter les tests
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Chemin vers package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Lire le package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Sauvegarder la configuration actuelle
const originalAfterSign = packageJson.build.afterSign;

try {
  // Supprimer temporairement la configuration de notarisation
  packageJson.build.afterSign = undefined;

  // Écrire les modifications dans package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log('Building application without notarization...');

  // Exécuter la commande de build avec npx pour utiliser l'electron-builder local
  execSync('npm run build && npx electron-builder --mac --universal', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('Build complete!');
} catch (error) {
  console.error('Build failed:', error);
} finally {
  // Restaurer la configuration originale
  packageJson.build.afterSign = originalAfterSign;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Restored original package.json configuration');
} 
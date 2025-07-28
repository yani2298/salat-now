/**
 * Script pour construire une version optimisée et légère de l'application
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Chemin vers package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

console.log('Building optimized light version...');

try {
  // Exécuter d'abord une construction optimisée
  console.log('Step 1: Building optimized frontend...');
  execSync('npm run build:optimized', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // Construire avec electron-builder en mode maximum de compression
  console.log('Step 2: Packaging with maximum compression...');
  execSync('npx electron-builder --mac --arm64 --x64 --universal --config.asar=true --config.compression=maximum --config.buildDependenciesFromSource=true --config.directories.app=.', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('Optimized build complete!');
} catch (error) {
  console.error('Build failed:', error);
} 
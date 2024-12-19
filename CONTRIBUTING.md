# Guide de contribution

Merci de votre intérêt pour contribuer à Muslim Prayer App ! Ce document fournit des lignes directrices pour contribuer au projet.

## Prérequis

- Node.js 18+
- npm ou yarn
- Git

## Configuration du projet

1. Fork le dépôt sur GitHub
2. Cloner votre fork localement
   ```bash
   git clone https://github.com/VOTRE-USERNAME/muslim-prayer-app.git
   cd muslim-prayer-app
   ```
3. Ajouter le dépôt upstream
   ```bash
   git remote add upstream https://github.com/anismosbah/muslim-prayer-app.git
   ```
4. Installer les dépendances
   ```bash
   npm install
   ```

## Branches de développement

- `main` - Branche principale, contient le code stable
- `develop` - Branche de développement, intégration des nouvelles fonctionnalités
- `feature/*` - Branches de fonctionnalités (ex: `feature/notifications`)
- `bugfix/*` - Branches de corrections de bugs (ex: `bugfix/prayer-times`)
- `release/*` - Branches de préparation de release (ex: `release/1.1.0`)

## Flux de travail

1. Créer une branche à partir de `develop`
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/ma-fonctionnalite
   ```

2. Développer votre fonctionnalité ou correction

3. Suivre les conventions de code
   - Utiliser ESLint et la configuration du projet
   - Suivre les conventions de nommage TypeScript/React
   - Ajouter des tests si nécessaire

4. Valider votre code
   ```bash
   npm run lint
   npm run build
   ```

5. Créer un commit suivant la convention [Conventional Commits](https://www.conventionalcommits.org/)
   ```bash
   git commit -m "feat: ajouter la fonctionnalité X"
   # ou
   git commit -m "fix: corriger le problème Y"
   ```

6. Pousser votre branche et créer une Pull Request
   ```bash
   git push origin feature/ma-fonctionnalite
   ```

7. Créer une Pull Request sur GitHub vers la branche `develop`

## Structure du projet

- `src/` - Code source React
  - `components/` - Composants React réutilisables
  - `services/` - Services (API, notifications, etc.)
  - `types/` - Définitions de types TypeScript
  - `assets/` - Ressources statiques (images, etc.)
- `electron/` - Code source Electron
- `scripts/` - Scripts utilitaires

## Tests

Pour exécuter les tests :
```bash
npm run test
```

## Construction

Pour construire l'application :
```bash
./build_pro.sh
```

## Style de code

Nous utilisons ESLint et Prettier pour maintenir un style de code cohérent. Les configurations sont dans les fichiers `.eslintrc.js` et `.prettierrc`.

Pour formater le code :
```bash
npm run format
```

## Versionnement

Nous suivons [Semantic Versioning](https://semver.org/) :
- MAJOR : changements incompatibles avec les versions précédentes
- MINOR : ajout de fonctionnalités compatibles
- PATCH : corrections de bugs compatibles

## Licence

En contribuant, vous acceptez que vos contributions soient sous la même licence que le projet (MIT). 
// Updated: 2025-07-29T19:15:43.452Z

// Updated: 2025-07-29T19:15:45.458Z

// Updated: 2025-07-29T19:15:48.265Z

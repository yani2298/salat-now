
# 🕌 Salat Now

<div align="center">
  <img src="src/assets/salat-now.png" alt="Salat Now Logo" width="128" height="128">
  
  <h3>Application de rappel des heures de prière pour musulmans</h3>
  
  [![GitHub release](https://img.shields.io/github/release/yani2298/salat-now.svg)](https://github.com/yani2298/salat-now/releases)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
  [![Electron](https://img.shields.io/badge/Electron-23+-green.svg)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
  ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
</div>

---

## 📖 À propos

**Salat Now** est une application de bureau moderne et élégante conçue pour aider les musulmans à suivre précisément les horaires de prière. Développée avec les dernières technologies web et intégrée dans une application Electron native, elle offre une expérience utilisateur fluide et professionnelle.

### 🌟 Fonctionnalités principales

- **🕰️ Horaires de prière précis** - Calculs basés sur votre géolocalisation exacte
- **🔔 Notifications intelligentes** - Rappels automatiques avec sons d'adhan personnalisables
- **🌍 Géolocalisation automatique** - Détection automatique de votre ville et pays
- **🌤️ Intégration météo** - Affichage des conditions météorologiques locales
- **🌙 Date Hijri** - Affichage du calendrier islamique
- **🎨 Interface moderne** - Design élégant avec support du mode sombre/clair
- **⚡ Performance optimisée** - Application rapide et réactive
- **🔧 Paramètres personnalisables** - Méthodes de calcul, sons d'adhan, préférences d'affichage
- **🖥️ Application native** - Intégration parfaite avec macOS, Windows et Linux

## 🚀 Installation rapide

### Téléchargement direct
Téléchargez la dernière version depuis les [Releases GitHub](https://github.com/yani2298/salat-now/releases).

### Installation depuis le code source

```bash
# Cloner le dépôt
git clone https://github.com/yani2298/salat-now.git
cd salat-now

# Installer les dépendances
npm install

# Lancer en mode développement
npm run electron:dev
```

## 🛠️ Développement

### Prérequis
- **Node.js** 18+ 
- **npm** 8+
- **Git**

### Scripts disponibles

```bash
# Développement
npm run dev                    # Interface web seule
npm run electron:dev          # Application Electron en développement

# Build
npm run build                 # Build de production
npm run build:optimized       # Build optimisé avec polices
npm run electron:build        # Build Electron pour distribution

# Packaging
npm run package              # Package pour macOS (x64)
npm run package:all          # Package pour toutes les plateformes

# Outils
npm run lint                 # Vérification du code
npm run preview              # Prévisualiser le build
```

### Architecture du projet

```
salat-now/
├── src/
│   ├── components/          # Composants React
│   │   ├── CityHeader.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── PrayerCard.tsx
│   │   ├── PrayerList.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── WeatherIcon.tsx
│   ├── services/           # Services et logique métier
│   │   ├── adhanService.ts
│   │   ├── locationService.ts
│   │   ├── prayerService.ts
│   │   └── weatherService.ts
│   ├── types/              # Définitions TypeScript
│   └── App.tsx            # Composant principal
├── electron/              # Configuration Electron
│   ├── main.cjs
│   └── preload.cjs
├── public/               # Assets statiques
│   └── audio/           # Sons d'adhan
└── scripts/             # Scripts de build
```

## 🔧 Technologies utilisées

<div align="center">

| Frontend | Backend | Desktop | Build Tools |
|----------|---------|---------|-------------|
| ![React](https://img.shields.io/badge/React-19-61dafb?logo=react) | ![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js) | ![Electron](https://img.shields.io/badge/Electron-23+-blue?logo=electron) | ![Vite](https://img.shields.io/badge/Vite-6+-purple?logo=vite) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript) | ![Axios](https://img.shields.io/badge/Axios-1.8-red?logo=axios) | ![Electron Builder](https://img.shields.io/badge/Electron_Builder-26+-orange) | ![ESLint](https://img.shields.io/badge/ESLint-9+-red?logo=eslint) |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan?logo=tailwindcss) | | | ![PostCSS](https://img.shields.io/badge/PostCSS-8+-orange?logo=postcss) |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12+-pink?logo=framer) | | | |

</div>

## 📱 Captures d'écran

<div align="center">
  <img src="docs/screenshots/main-interface.png" alt="Interface principale" width="45%">
  <img src="docs/screenshots/settings-panel.png" alt="Panneau paramètres" width="45%">
  
  <p><em>Interface principale et panneau de paramètres</em></p>
</div>

## ⚙️ Configuration

### Méthodes de calcul supportées
- **Université des Sciences Islamiques, Karachi**
- **Ligue Islamique Mondiale**
- **Université Umm Al-Qura, Makkah**
- **Institut Egyptien de Recherche Géographique**
- **Et plus encore...**

### Personnalisation
- Choix des muezzins pour l'adhan
- Réglage des notifications
- Préférences d'affichage
- Configuration de la géolocalisation

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [Guide de contribution](CONTRIBUTING.md).

### Processus de contribution
1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Anis Mosbah** - *Développeur Principal*
- GitHub: [@yani2298](https://github.com/yani2298)
- Email: contact@salatnow.app

## 🙏 Remerciements

- Communauté des développeurs musulmans
- Contributors OpenSource
- APIs de données islamiques utilisées
- Testeurs et utilisateurs de l'application

---

<div align="center">
  <p>Fait avec ❤️ pour la communauté musulmane</p>
  
  [![GitHub stars](https://img.shields.io/github/stars/yani2298/salat-now.svg?style=social&label=Star)](https://github.com/yani2298/salat-now)
  [![GitHub forks](https://img.shields.io/github/forks/yani2298/salat-now.svg?style=social&label=Fork)](https://github.com/yani2298/salat-now/fork)
</div>

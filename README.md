
# 🕌 Salat Now

<div align="center">
  <img width="640" height="640" alt="favicon" src="https://github.com/user-attachments/assets/02f7df8b-341e-435f-8997-a5f9afa74dbf" />

  <h3>Prayer times reminder application for Muslims</h3>
  
  [![GitHub release](https://img.shields.io/github/release/yani2298/salat-now.svg)](https://github.com/yani2298/salat-now/releases)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
  [![Electron](https://img.shields.io/badge/Electron-23+-green.svg)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
  ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
  [![Language](https://img.shields.io/badge/Language-French-blue.svg)](https://github.com/yani2298/salat-now)
  [![npm package](https://img.shields.io/badge/npm-salat--times--calculator-orange.svg)](https://www.npmjs.com/package/salat-times-calculator)
  [![GitHub Package Registry](https://img.shields.io/badge/GitHub-@yani2298/salat--times--calculator-blue.svg)](https://github.com/yani2298/salat-now/packages)
</div>

---

## 📦 NPM Package

**Salat Now** also provides a **professional npm package** for developers who want to integrate Islamic prayer times calculation into their own applications:

**📦 Public npm:**
```bash
npm install salat-times-calculator
```

**🐙 GitHub Packages:**
```bash
npm install @yani2298/salat-times-calculator
```

**Quick usage:**
```typescript
// Import from public npm OR GitHub packages
import { SalatTimesCalculator, CalculationMethod } from 'salat-times-calculator';
// OR: import { SalatTimesCalculator, CalculationMethod } from '@yani2298/salat-times-calculator';

const calculator = new SalatTimesCalculator();
const prayerTimes = await calculator.getPrayerTimes({
  city: 'Paris',
  country: 'France',
  calculationMethod: CalculationMethod.ISNA
});
```

**Perfect for:**
- 📱 Mobile apps development
- 🌐 Web applications
- 🔧 Backend API services  
- 🕌 Islamic community websites
- ⏰ Prayer reminder systems

👉 **[View npm package →](https://www.npmjs.com/package/salat-times-calculator)** | **[View GitHub package →](https://github.com/yani2298/salat-now/packages)**

---

## 📖 About

**Salat Now** is a modern, elegant desktop application designed to help Muslims accurately track prayer times. Built with the latest web technologies and integrated into a native Electron app, it provides a smooth and professional user experience.

> **🇫🇷 Language Note:** This application is currently available in **French**. We welcome contributions to add support for other languages! See the [Contributing](#-contributing) section below.

### 🌟 Key Features

- **🕰️ Accurate Prayer Times** - Calculations based on your exact geolocation
- **🔔 Smart Notifications** - Automatic reminders with customizable adhan sounds
- **🌍 Auto-Location Detection** - Automatic detection of your city and country
- **🌤️ Weather Integration** - Display local weather conditions
- **🌙 Hijri Calendar** - Islamic calendar display
- **🎨 Modern Interface** - Elegant design with dark/light mode support
- **⚡ Optimized Performance** - Fast and responsive application
- **🔧 Customizable Settings** - Calculation methods, adhan sounds, display preferences
- **🖥️ Native App** - Perfect integration with macOS, Windows, and Linux

## 🚀 Quick Start

### Direct Download
Download the latest version from [GitHub Releases](https://github.com/yani2298/salat-now/releases).

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yani2298/salat-now.git
cd salat-now

# Install dependencies
npm install

# Run in development mode
npm run electron:dev
```

## 🛠️ Development

### Prerequisites
- **Node.js** 18+ 
- **npm** 8+
- **Git**

### Available Scripts

```bash
# Development
npm run dev                    # Web interface only
npm run electron:dev          # Electron app in development mode

# Build
npm run build                 # Production build
npm run build:optimized       # Optimized build with fonts
npm run electron:build        # Build Electron app for distribution

# Packaging
npm run package              # Package for macOS (x64)
npm run package:all          # Package for all platforms

# Tools
npm run lint                 # Code verification
npm run preview              # Preview the build
```

### Project Architecture

```
salat-now/
├── src/
│   ├── components/          # React Components
│   │   ├── CityHeader.tsx
│   │   ├── CountdownTimer.tsx
│   │   ├── PrayerCard.tsx
│   │   ├── PrayerList.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── WeatherIcon.tsx
│   ├── services/           # Business Logic & Services
│   │   ├── adhanService.ts
│   │   ├── locationService.ts
│   │   ├── prayerService.ts
│   │   └── weatherService.ts
│   ├── types/              # TypeScript Definitions
│   └── App.tsx            # Main Component
├── electron/              # Electron Configuration
│   ├── main.cjs
│   └── preload.cjs
├── public/               # Static Assets
│   └── audio/           # Adhan Sounds
└── scripts/             # Build Scripts
```

## 🔧 Technologies Used

<div align="center">

| Frontend | Backend | Desktop | Build Tools |
|----------|---------|---------|-------------|
| ![React](https://img.shields.io/badge/React-19-61dafb?logo=react) | ![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js) | ![Electron](https://img.shields.io/badge/Electron-23+-blue?logo=electron) | ![Vite](https://img.shields.io/badge/Vite-6+-purple?logo=vite) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript) | ![Axios](https://img.shields.io/badge/Axios-1.8-red?logo=axios) | ![Electron Builder](https://img.shields.io/badge/Electron_Builder-26+-orange) | ![ESLint](https://img.shields.io/badge/ESLint-9+-red?logo=eslint) |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan?logo=tailwindcss) | | | ![PostCSS](https://img.shields.io/badge/PostCSS-8+-orange?logo=postcss) |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12+-pink?logo=framer) | | | |

</div>

## 📱 Screenshots

<div align="center">
  <img width="351" height="551" alt="3" src="https://github.com/user-attachments/assets/8bb4fd9b-7023-4ba7-8a95-1319525c67bc" />
<img width="351" height="577" alt="1" src="https://github.com/user-attachments/assets/67921412-0351-4e57-a8d6-4823b77290c0" />

  <img src="docs/screenshots/main-interface.png" alt="Main Interface" width="45%">
  <img src="docs/screenshots/settings-panel.png" alt="Settings Panel" width="45%">
  
  <p><em>Main interface and settings panel (in French)</em></p>
</div>

## ⚙️ Configuration

### Supported Calculation Methods
- **University of Islamic Sciences, Karachi**
- **Islamic World League**
- **Umm Al-Qura University, Makkah**
- **Egyptian General Authority of Survey**
- **And more...**

### Customization Options
- Choice of muezzins for adhan
- Notification settings
- Display preferences
- Geolocation configuration

## 🌐 Internationalization

**Current Language:** French 🇫🇷

**Want to help translate?** We welcome contributions to add support for more languages! Here's how you can help:

### 🤝 Adding New Languages

1. **Create language files** in `src/locales/[language-code].json`
2. **Translate interface strings** (prayer names, settings, etc.)
3. **Update the language selector** in `SettingsPanel.tsx`
4. **Submit a Pull Request** with your translation

### 🗣️ Languages We'd Love to Support
- 🇸🇦 Arabic (العربية)
- 🇬🇧 English
- 🇹🇷 Turkish (Türkçe)  
- 🇮🇩 Indonesian (Bahasa Indonesia)
- 🇵🇰 Urdu (اردو)
- 🇧🇩 Bengali (বাংলা)
- 🇲🇾 Malay (Bahasa Melayu)
- And more!

**Missing your language?** Open an issue and let's discuss adding it!

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

### How to Contribute

#### 🌐 Language Contributions (Most Needed!)
1. Fork the project
2. Create a language branch (`git checkout -b lang/arabic`)
3. Add translation files and update components
4. Test the new language integration
5. Submit a Pull Request

#### 🐛 Bug Fixes & Features
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 🛠️ Development Guidelines
- Follow TypeScript best practices
- Maintain Islamic prayer calculation accuracy
- Ensure cross-platform compatibility
- Write clear, commented code
- Test on multiple operating systems

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact & Support

**Developer:** Anis Mosbah
- GitHub: [@yani2298](https://github.com/yani2298)
- Email: contact@salatnow.app

### 🐛 Bug Reports
Found a bug? Please open an [issue](https://github.com/yani2298/salat-now/issues) with:
- Operating system and version
- App version
- Steps to reproduce
- Expected vs actual behavior

### 💡 Feature Requests
Have an idea? We'd love to hear it! Open a [feature request](https://github.com/yani2298/salat-now/issues/new?template=feature_request.md).

## 🙏 Acknowledgments

- Muslim developer community
- Open source contributors
- Islamic data APIs used
- Beta testers and users
- **Translation contributors** (we appreciate your help!)

## 🚀 Roadmap

### 🎯 Upcoming Features
- [ ] **Multi-language support** (Priority #1)
- [ ] Qibla direction compass
- [ ] Prayer statistics and tracking
- [ ] Mosque finder integration
- [ ] Custom themes and layouts
- [ ] Mobile companion app
- [ ] Community features

### 🌍 Localization Priority
1. **Arabic** - The language of Islam
2. **English** - International reach
3. **Turkish** - Large Muslim population
4. **Indonesian** - Largest Muslim country
5. **Urdu** - Pakistan/India region
6. **Bengali** - Bangladesh region

---

<div align="center">
  <p>Made with ❤️ for the global Muslim community</p>
  <p><strong>Currently in French 🇫🇷 | Help us add your language! 🌍</strong></p>
  
  [![GitHub stars](https://img.shields.io/github/stars/yani2298/salat-now.svg?style=social&label=Star)](https://github.com/yani2298/salat-now)
  [![GitHub forks](https://img.shields.io/github/forks/yani2298/salat-now.svg?style=social&label=Fork)](https://github.com/yani2298/salat-now/fork)
</div>

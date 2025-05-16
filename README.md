
# 🕌 Salat Now

> **Professional macOS menu bar application for Islamic prayer times**

<div align="center">

[![macOS](https://img.shields.io/badge/macOS-10.15%2B-blue.svg)](https://www.apple.com/macos)
[![Swift](https://img.shields.io/badge/Built%20with-Electron-47848f.svg)](https://www.electronjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Package](https://img.shields.io/npm/v/salat-times-calculator.svg)](https://www.npmjs.com/package/salat-times-calculator)
[![GitHub Package Registry](https://img.shields.io/badge/GitHub-@yani2298/salat--times--calculator-blue.svg)](https://github.com/yani2298/salat-now/packages)

<img width="200" height="200" alt="Salat Now Icon" src="https://github.com/user-attachments/assets/02f7df8b-341e-435f-8997-a5f9afa74dbf" />

**Discreet, accurate, and beautiful prayer times in your macOS menu bar**

[Download Latest Release](https://github.com/yani2298/salat-now/releases) • [View Documentation](#installation) • [Report Issue](https://github.com/yani2298/salat-now/issues)

</div>

---

## 📋 About

**Salat Now** is a professional macOS menu bar application designed for Muslim professionals who need quick, discreet access to accurate prayer times without leaving their workflow.

Built specifically for macOS, it integrates seamlessly into your menu bar, providing prayer times, weather information, and Hijri calendar data at a glance.

### 🎯 Key Features

- **🖥️ Native macOS Menu Bar Integration** - Quick access without interrupting your work
- **🕰️ Accurate Prayer Times** - Multiple calculation methods (ISNA, MWL, Karachi, etc.)
- **🌍 Global Location Support** - Automatic city detection or manual selection
- **🌤️ Weather Integration** - Current conditions alongside prayer times
- **🌙 Hijri Calendar** - Islamic date display with important events
- **🔔 Smart Notifications** - Customizable prayer reminders
- **⚙️ Professional Interface** - Clean, minimal design that respects your workflow
- **🔒 Privacy First** - No data collection, works offline
- **🆓 Completely Free** - No subscriptions, no ads, open source
- 
<img width="351" height="551" alt="3" src="https://github.com/user-attachments/assets/5055f9bc-4875-4300-a0f9-5fe21f586a7b" />
<img width="351" height="577" alt="1" src="https://github.com/user-attachments/assets/e7f98111-473b-41a8-92a0-6b2ed2b00568" />

---

## 🚀 Installation

### Download for macOS

1. **Download** the latest release from [GitHub Releases](https://github.com/yani2298/salat-now/releases)
2. **Unzip** the downloaded file
3. **Move** `Salat Now.app` to your `/Applications` folder
4. **Launch** the app - it will appear in your menu bar
5. **Grant location permission** for automatic prayer times (optional)

### System Requirements

- **macOS 10.15** (Catalina) or later
- **Location Services** (optional, for automatic city detection)

---

## 📦 NPM Package

The prayer calculation engine is also available as a standalone npm package for developers building Islamic applications.

### Installation

```bash
# Public npm registry
npm install salat-times-calculator

# GitHub Package Registry  
npm install @yani2298/salat-times-calculator
```

### Quick Usage

```typescript
import { SalatTimesCalculator, CalculationMethod } from 'salat-times-calculator';

const calculator = new SalatTimesCalculator();

// Get prayer times for any city
const prayerTimes = await calculator.getPrayerTimes({
  city: 'Paris',
  country: 'France',
  calculationMethod: CalculationMethod.ISNA
});

console.log('Next prayer:', calculator.getCurrentPrayer(prayerTimes));
```

📚 **Documentation**: [View npm package](https://www.npmjs.com/package/salat-times-calculator) • [View GitHub package](https://github.com/yani2298/salat-now/packages)

---

## 🛠️ Development

### Prerequisites

- **Node.js** 18.0+
- **macOS** development environment
- **Xcode Command Line Tools**

### Setup

```bash
# Clone the repository
git clone https://github.com/yani2298/salat-now.git
cd salat-now

# Install dependencies
npm install

# Start development server
npm run electron:dev

# Build for production
npm run electron:build
```

### Project Structure

```
salat-now/
├── src/                    # React application source
│   ├── components/         # UI components
│   ├── services/          # Prayer times, weather, location services
│   └── types/             # TypeScript definitions
├── electron/              # Electron main process
├── public/                # Static assets
└── build/                 # Production builds
```

---

## 🏗️ Architecture

**Salat Now** follows a clean, modular architecture optimized for menu bar applications:

- **Frontend**: React 19 with TypeScript for type safety and modern UI patterns
- **Backend**: Electron for native macOS integration and menu bar functionality  
- **API Integration**: Aladhan API for accurate prayer calculations
- **State Management**: React hooks with local storage persistence
- **Styling**: Tailwind CSS for consistent, maintainable design

---

## 🔧 Technologies

| Category | Technology |
|----------|------------|
| **Framework** | Electron + React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **APIs** | Aladhan Prayer Times API |
| **Build System** | Vite |
| **Testing** | Jest (planned) |

---

## 🌍 Internationalization

**Current Language**: French 🇫🇷

**Seeking Contributors** for translation to:
- **Arabic** 🇸🇦 (عربي)
- **English** 🇺🇸
- **Urdu** 🇵🇰 (اردو)
- **Indonesian** 🇮🇩 (Bahasa Indonesia)
- **Turkish** 🇹🇷 (Türkçe)
- **Malay** 🇲🇾 (Bahasa Melayu)

[**Request Translation**](https://github.com/yani2298/salat-now/issues/new?assignees=&labels=translation&template=translation_request.md) • [**Translation Guide**](.github/TRANSLATION_GUIDE.md)

---

## 🤝 Contributing

We welcome contributions from the global Muslim developer community!

### Ways to Contribute

- 🐛 **Report bugs** using our [issue templates](.github/ISSUE_TEMPLATE/)
- 💡 **Suggest features** for improving the user experience
- 🌍 **Add translations** to make the app accessible globally
- 📝 **Improve documentation** for better developer experience
- 🔧 **Submit pull requests** for bug fixes or enhancements

### Development Guidelines

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for detailed information.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Anis Mosbah** ([@yani2298](https://github.com/yani2298))
- Email: contact@salatnow.app
- Building Islamic software for the global ummah

---

## 🙏 Acknowledgments

- **Aladhan API** - Reliable Islamic prayer times calculations
- **Islamic Network** - Open source Islamic software inspiration  
- **macOS Developer Community** - Menu bar app best practices
- **Global Muslim Developers** - Feature requests and testing

---

## 🗺️ Roadmap

### 🎯 Short Term (Q1 2025)
- [ ] **English translation** completion
- [ ] **Arabic RTL support** implementation
- [ ] **Advanced notification** customization
- [ ] **Prayer time adjustments** UI enhancement

### 🚀 Medium Term (Q2-Q3 2025)
- [ ] **Multiple location** support for travelers
- [ ] **Qibla direction** indicator
- [ ] **Islamic calendar** events integration
- [ ] **Community prayer times** sharing

### 🌟 Long Term (Q4 2025+)
- [ ] **iOS companion app** for seamless sync
- [ ] **Widget support** for macOS Big Sur+
- [ ] **Apple Watch** complications
- [ ] **Mosque finder** integration

---

<div align="center">

**Made with ❤️ for the global Muslim community**

⭐ **Star this repository** if it helps you in your daily prayers

[Report Bug](https://github.com/yani2298/salat-now/issues) • [Request Feature](https://github.com/yani2298/salat-now/issues) • [Join Discussion](https://github.com/yani2298/salat-now/discussions)

</div>

// Updated: 2025-07-29T19:15:49.072Z

// Updated: 2025-07-29T19:15:51.545Z

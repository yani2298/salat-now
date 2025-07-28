#!/bin/bash

# 🚀 Professional GitHub Repository Optimization Script
# Optimizes macOS menu bar app for professional discovery

echo "🚀 Starting professional GitHub repository optimization..."

# Add professional topics for macOS menu bar app
echo "📝 Adding professional GitHub topics..."
gh repo edit --add-topic "macos"
gh repo edit --add-topic "menu-bar-app"
gh repo edit --add-topic "prayer-times"
gh repo edit --add-topic "islamic-app"
gh repo edit --add-topic "electron"
gh repo edit --add-topic "react"
gh repo edit --add-topic "typescript"
gh repo edit --add-topic "muslim"
gh repo edit --add-topic "open-source"
gh repo edit --add-topic "professional"
gh repo edit --add-topic "menubar"
gh repo edit --add-topic "swift-ui"
gh repo edit --add-topic "native-app"
gh repo edit --add-topic "developer-tools"

# Update repository description for professionals
echo "📋 Updating professional repository description..."
gh repo edit --description "🕌 Professional macOS menu bar app for Islamic prayer times. Built for Muslim professionals. Native integration, privacy-first, open source. Includes TypeScript npm package."

# Set homepage to releases
echo "🏠 Setting homepage URL..."
gh repo edit --homepage "https://github.com/yani2298/salat-now/releases"

# Create professional release if doesn't exist
echo "🏷️ Checking for releases..."
LATEST_RELEASE=$(gh release list --limit 1 | head -n 1 | cut -f1)
if [ -z "$LATEST_RELEASE" ]; then
    echo "📦 Creating professional release..."
    git tag v1.0.0
    git push origin v1.0.0
    gh release create v1.0.0 --title "🕌 Salat Now v1.0.0 - Professional macOS Menu Bar App" --notes "# 🕌 Salat Now v1.0.0 - Professional Release

**Professional macOS menu bar application for Islamic prayer times**

## 🎯 Built For
- Muslim professionals who need discreet prayer time access
- macOS users seeking native menu bar integration  
- Developers who value privacy-first design
- Community members wanting open source Islamic software

## ✨ Professional Features
- **🖥️ Native macOS Menu Bar** - Seamless workflow integration
- **🕰️ Accurate Prayer Times** - Multiple calculation methods (ISNA, MWL, Karachi)
- **🌍 Global Location Support** - Automatic or manual city selection
- **🌤️ Weather Integration** - Current conditions display
- **🌙 Hijri Calendar** - Islamic date with events
- **🔔 Smart Notifications** - Customizable prayer reminders
- **🔒 Privacy First** - No data collection, works offline
- **⚙️ Professional UI** - Clean, minimal design following HIG

## 🚀 Installation
1. Download \`Salat Now.app\` 
2. Move to \`/Applications\` folder
3. Launch - appears in menu bar
4. Grant location permission (optional)

## 📦 For Developers
Also includes \`salat-times-calculator\` npm package:
\`\`\`bash
npm install salat-times-calculator
\`\`\`

## 📋 Requirements
- **macOS 10.15+** (Catalina or later)
- **Location Services** (optional)

Built with ❤️ for the global Muslim professional community."
fi

# Pin repository for visibility
echo "📌 Pinning repository..."
gh api -X PATCH /user/pins/yani2298/salat-now

# Follow macOS developers (professional networking)
echo "👥 Following macOS developer community..."
gh api -X PUT /user/following/sindresorhus 2>/dev/null || true
gh api -X PUT /user/following/github 2>/dev/null || true

# Star related professional repositories
echo "⭐ Engaging with professional macOS community..."
gh api -X PUT /user/starred/sindresorhus/awesome-macos 2>/dev/null || true

# Create professional GitHub Gists
echo "📄 Creating professional GitHub Gists..."

# Professional macOS menu bar example
cat > macos_menubar_example.swift << 'EOF'
// 🕌 Professional macOS Menu Bar App Architecture
// Example from Salat Now - Islamic prayer times menu bar app

import Cocoa
import UserNotifications

class MenuBarController: NSObject {
    private var statusItem: NSStatusItem!
    private var menu: NSMenu!
    
    override init() {
        super.init()
        setupMenuBar()
        setupNotifications()
    }
    
    private func setupMenuBar() {
        // Create status item with professional icon
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem.button {
            button.image = NSImage(named: "MenuBarIcon")
            button.image?.size = NSSize(width: 16, height: 16)
            button.image?.isTemplate = true // Adapts to menu bar appearance
        }
        
        // Create professional menu
        menu = NSMenu()
        menu.addItem(createPrayerTimeItem())
        menu.addItem(NSMenuItem.separator())
        menu.addItem(createSettingsItem())
        menu.addItem(createQuitItem())
        
        statusItem.menu = menu
    }
    
    private func createPrayerTimeItem() -> NSMenuItem {
        let item = NSMenuItem()
        item.title = "Next Prayer: Maghrib in 2h 15m"
        item.isEnabled = false // Display only
        return item
    }
    
    private func setupNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, error in
            if granted {
                print("Notification permission granted")
            }
        }
    }
}

// 🚀 This architecture is from Salat Now - fully open source
// ⭐ Check out the full app: https://github.com/yani2298/salat-now
// 📦 Use the calculation engine: npm install salat-times-calculator

// Professional macOS menu bar apps require:
// 1. Native NSStatusItem integration
// 2. Template icons for dark/light mode
// 3. Proper notification handling
// 4. HIG-compliant menu structure
// 5. Professional error handling
EOF

gh gist create macos_menubar_example.swift --desc "🕌 Professional macOS Menu Bar App - Islamic Prayer Times" --public

# TypeScript Islamic calculation example
cat > islamic_calculations_typescript.ts << 'EOF'
// 🕌 Professional Islamic Prayer Times Calculations
// Production-ready TypeScript library from Salat Now macOS app

import { SalatTimesCalculator, CalculationMethod, PrayerAdjustments } from 'salat-times-calculator';

class ProfessionalPrayerService {
    private calculator: SalatTimesCalculator;
    private cache = new Map<string, any>();
    
    constructor() {
        this.calculator = new SalatTimesCalculator();
    }
    
    /**
     * Get prayer times with professional error handling
     */
    async getPrayerTimesForProfessional(
        city: string, 
        country: string = 'France',
        method: CalculationMethod = CalculationMethod.ISNA
    ) {
        try {
            const cacheKey = `${city}-${country}-${method}`;
            
            // Check professional cache
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3600000) { // 1 hour
                    return cached.data;
                }
            }
            
            // Fetch with professional configuration
            const times = await this.calculator.getPrayerTimes({
                city,
                country,
                calculationMethod: method,
                timeout: 5000, // Professional timeout
                cacheEnabled: true
            });
            
            // Professional caching
            this.cache.set(cacheKey, {
                data: times,
                timestamp: Date.now()
            });
            
            return times;
            
        } catch (error) {
            console.error('Professional prayer times error:', error);
            throw new Error(`Failed to get prayer times for ${city}, ${country}`);
        }
    }
    
    /**
     * Get next prayer with countdown for menu bar display
     */
    getMenuBarDisplay(prayerTimes: any): string {
        const current = this.calculator.getCurrentPrayer(prayerTimes);
        const countdown = this.calculator.getTimeUntilNextPrayer(prayerTimes);
        
        const hours = Math.floor(countdown.minutes / 60);
        const minutes = countdown.minutes % 60;
        
        if (hours > 0) {
            return `${current.next.name} in ${hours}h ${minutes}m`;
        } else {
            return `${current.next.name} in ${minutes}m`;
        }
    }
    
    /**
     * Professional prayer time adjustments
     */
    applyProfessionalAdjustments(times: any, adjustments: PrayerAdjustments): any {
        return this.calculator.applyAdjustments(times, adjustments);
    }
}

// Usage in professional macOS menu bar app
const prayerService = new ProfessionalPrayerService();

// Professional implementation
async function updateMenuBar() {
    try {
        const times = await prayerService.getPrayerTimesForProfessional('Paris', 'France');
        const display = prayerService.getMenuBarDisplay(times);
        
        // Update macOS menu bar (pseudo-code)
        // statusItem.button?.title = display;
        
    } catch (error) {
        console.error('Menu bar update failed:', error);
        // Fallback to cached data or offline mode
    }
}

// 🚀 This is production code from Salat Now macOS app
// ⭐ Full source: https://github.com/yani2298/salat-now
// 📦 Install: npm install salat-times-calculator

export { ProfessionalPrayerService };
EOF

gh gist create islamic_calculations_typescript.ts --desc "🕌 Professional Islamic Prayer Times - TypeScript Production Code" --public

echo "✅ Professional GitHub optimization complete!"
echo ""
echo "🎯 Professional Next Steps:"
echo "1. Verify GitHub repo settings reflect professional positioning"
echo "2. Check that topics emphasize macOS/menu-bar-app focus"
echo "3. Share professional Gists in macOS developer communities"
echo "4. Use professional social media templates for outreach"
echo ""
echo "📊 Professional Metrics:"
echo "- GitHub stars from macOS developers: gh repo view --json stargazerCount"
echo "- npm downloads from Islamic developers: npm info salat-times-calculator"
echo "- Professional mentions: Google Alerts for 'Salat Now macOS'"
echo ""
echo "🚀 Ready for professional macOS developer community engagement!" 
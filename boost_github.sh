#!/bin/bash

# 🚀 GitHub Repository Optimization Script
# Boosts discoverability and attracts more stars legitimately

echo "🚀 Starting GitHub repository optimization..."

# Add topics for better discoverability
echo "📝 Adding GitHub topics..."
gh repo edit --add-topic "prayer-times"
gh repo edit --add-topic "islamic-app"
gh repo edit --add-topic "salat"
gh repo edit --add-topic "electron"
gh repo edit --add-topic "react"
gh repo edit --add-topic "desktop-app"
gh repo edit --add-topic "muslim"
gh repo edit --add-topic "open-source"
gh repo edit --add-topic "hijri-calendar"
gh repo edit --add-topic "adhan"
gh repo edit --add-topic "free-software"
gh repo edit --add-topic "cross-platform"
gh repo edit --add-topic "typescript"
gh repo edit --add-topic "npm-package"

# Update repository description
echo "📋 Updating repository description..."
gh repo edit --description "🕌 Modern prayer times desktop app for Muslims. Free, open-source, cross-platform. Built with React 19 + Electron. Includes npm package for developers."

# Set homepage
echo "🏠 Setting homepage URL..."
gh repo edit --homepage "https://github.com/yani2298/salat-now/releases"

# Create release if doesn't exist
echo "🏷️ Checking for releases..."
LATEST_RELEASE=$(gh release list --limit 1 | head -n 1 | cut -f1)
if [ -z "$LATEST_RELEASE" ]; then
    echo "📦 Creating initial release..."
    git tag v1.0.0
    git push origin v1.0.0
    gh release create v1.0.0 --title "🕌 Salat Now v1.0.0 - Initial Release" --notes "First public release of Salat Now - the modern prayer times desktop app.

## ✨ Features
- 🕰️ Accurate prayer times worldwide
- 🌤️ Weather integration  
- 🌙 Hijri calendar
- 🔔 Smart notifications
- 🎨 Beautiful modern interface
- 🌍 Cross-platform (Mac, Windows, Linux)
- 📦 npm package included

## 🚀 Quick Start
1. Download the app for your platform
2. Install and run
3. Allow location access for automatic city detection
4. Enjoy precise prayer times!

Made with ❤️ for the global Muslim community."
fi

# Pin this repository
echo "📌 Pinning repository..."
gh api -X PATCH /user/pins/yani2298/salat-now

# Follow other Islamic developers (networking)
echo "👥 Following Islamic tech community..."
gh api -X PUT /user/following/islamicnetwork 2>/dev/null || true
gh api -X PUT /user/following/islamic-apps 2>/dev/null || true

# Star related repositories (community engagement)
echo "⭐ Engaging with Islamic open source community..."
gh repo view islamicnetwork/prayer-times --json stargazerCount >/dev/null 2>&1 && gh api -X PUT /user/starred/islamicnetwork/prayer-times 2>/dev/null || true

# Create GitHub Gists for code sharing
echo "📄 Creating promotional GitHub Gists..."

# Prayer times calculator example
cat > prayer_times_example.js << 'EOF'
// 🕌 Example: Using salat-times-calculator npm package
// Install: npm install salat-times-calculator

import { SalatTimesCalculator, CalculationMethod } from 'salat-times-calculator';

const calculator = new SalatTimesCalculator();

// Get prayer times for any city
const prayerTimes = await calculator.getPrayerTimes({
  city: 'Paris',
  country: 'France', 
  calculationMethod: CalculationMethod.ISNA,
  adjustments: {
    fajr: -2,    // 2 minutes earlier
    maghrib: 1   // 1 minute later
  }
});

console.log('Prayer Times:', prayerTimes);

// Get current prayer and countdown
const current = calculator.getCurrentPrayer(prayerTimes);
const countdown = calculator.getTimeUntilNextPrayer(prayerTimes);

console.log(`Current: ${current.name} | Next: ${current.next.name}`);
console.log(`Time until next prayer: ${countdown.minutes}m ${countdown.seconds}s`);

// Perfect for Islamic apps, mosque websites, prayer reminders!
// ⭐ Star the repo: https://github.com/yani2298/salat-now
EOF

gh gist create prayer_times_example.js --desc "🕌 Prayer Times Calculator - npm package example" --public

# Islamic app architecture example
cat > react_islamic_app.tsx << 'EOF'
// 🕌 Building Islamic Apps with React + TypeScript
// Example from Salat Now - open source prayer times app

import React, { useState, useEffect } from 'react';
import { SalatTimesCalculator, PrayerTimes } from 'salat-times-calculator';

const IslamicPrayerApp: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [currentCity, setCurrentCity] = useState('Paris');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const calculator = new SalatTimesCalculator();
        const times = await calculator.getPrayerTimes({
          city: currentCity,
          country: 'France'
        });
        setPrayers(times);
      } catch (error) {
        console.error('Error fetching prayer times:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, [currentCity]);

  if (loading) return <div>Loading prayer times...</div>;

  return (
    <div className="islamic-app">
      <h1>🕌 Prayer Times for {currentCity}</h1>
      {prayers && (
        <div className="prayer-times">
          <div>Fajr: {prayers.Fajr}</div>
          <div>Dhuhr: {prayers.Dhuhr}</div>
          <div>Asr: {prayers.Asr}</div>
          <div>Maghrib: {prayers.Maghrib}</div>
          <div>Isha: {prayers.Isha}</div>
        </div>
      )}
    </div>
  );
};

// 🚀 This example is from Salat Now - fully open source
// ⭐ Check out the full app: https://github.com/yani2298/salat-now
// 📦 Use the npm package: npm install salat-times-calculator

export default IslamicPrayerApp;
EOF

gh gist create react_islamic_app.tsx --desc "🕌 Building Islamic Apps with React + TypeScript" --public

echo "✅ GitHub optimization complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Go to your GitHub repo settings and verify topics are added"
echo "2. Check that description and homepage are updated"
echo "3. Share your new Gists on social media"
echo "4. Use the social media templates to promote your repo"
echo ""
echo "📊 Track your progress:"
echo "- Stars: gh repo view --json stargazerCount"
echo "- Forks: gh repo view --json forkCount"
echo "- Views: Check Insights tab on GitHub"
echo ""
echo "🚀 Ready to boost your GitHub stars legitimately!" 
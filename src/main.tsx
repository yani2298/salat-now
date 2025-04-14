import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importer notre CSS de polices optimisé au lieu des paquets complets
import './fonts.css'

// Initialisation de i18next
// import './i18n/i18n' - Module introuvable, sera importé dans App.tsx si nécessaire

// Fonction pour précharger les polices
const preloadFonts = () => {
  // Précharger les polices Noto Sans Arabic
  const fontFaces = [
    {
      fontFamily: 'Noto Sans Arabic',
      weights: [400, 700]  // Réduit aux poids réellement utilisés
    },
    {
      fontFamily: 'Noto Kufi Arabic',
      weights: [400, 700]
    }
  ];

  const style = document.createElement('style');
  let styleContent = '';

  // Générer des règles @font-face pour chaque police et poids
  fontFaces.forEach(font => {
    font.weights.forEach(weight => {
      styleContent += `
        @font-face {
          font-family: '${font.fontFamily}';
          font-style: normal;
          font-weight: ${weight};
          font-display: swap;
          src: local('${font.fontFamily}');
        }
      `;
    });
  });

  style.textContent = styleContent;
  document.head.appendChild(style);

  // Précharger avec des éléments DOM cachés
  const preloadDiv = document.createElement('div');
  preloadDiv.style.opacity = '0';
  preloadDiv.style.position = 'absolute';
  preloadDiv.style.pointerEvents = 'none';
  preloadDiv.style.width = '0';
  preloadDiv.style.height = '0';
  preloadDiv.style.overflow = 'hidden';
  preloadDiv.setAttribute('aria-hidden', 'true');

  // Créer des éléments pour chaque style de police
  fontFaces.forEach(font => {
    font.weights.forEach(weight => {
      const el = document.createElement('span');
      el.textContent = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي';
      el.style.fontFamily = font.fontFamily;
      el.style.fontWeight = weight.toString();
      preloadDiv.appendChild(el);
    });
  });

  document.body.appendChild(preloadDiv);

  // Nettoyer après préchargement
  setTimeout(() => {
    document.body.removeChild(preloadDiv);
  }, 5000);
};

// Précharger les polices
if (document.readyState === 'complete') {
  preloadFonts();
} else {
  window.addEventListener('load', preloadFonts);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

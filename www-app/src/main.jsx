import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { hasAnalyticsConsent } from './components/CookieBanner.jsx';

function initAnalytics() {
  if (!hasAnalyticsConsent()) return;
}

function disableAnalytics() {
}

initAnalytics();

window.addEventListener('foam:consent-changed', (e) => {
  if (e.detail.choice === 'accepted') {
    initAnalytics();
  } else {
    disableAnalytics();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

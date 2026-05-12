import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const CONSENT_KEY = 'cookieConsent';

export function getCookieConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  return getCookieConsent() === 'accepted';
}

function dispatchConsentEvent(choice) {
  window.dispatchEvent(new CustomEvent('foam:consent-changed', { detail: { choice } }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const saved = getCookieConsent();
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss(choice) {
    try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* storage unavailable */ }
    if (choice === 'accepted') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', 'G-Y6E3HE3N11');
    } else {
      window.gtag = function() {};
    }
    dispatchConsentEvent(choice);
    setHiding(true);
    setTimeout(() => setVisible(false), 320);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px 16px',
        transform: hiding ? 'translateY(110%)' : 'translateY(0)',
        transition: 'transform 320ms cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: '#0F2F3C',
          border: '1px solid rgba(51,157,199,0.25)',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
          padding: '18px 24px',
          maxWidth: 680,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
          pointerEvents: 'auto',
        }}
      >
        <span style={{ fontSize: 18 }} aria-hidden="true">🍪</span>

        <p style={{
          flex: 1,
          minWidth: 220,
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.75)',
          margin: 0,
        }}>
          We use cookies to improve your experience and analyse site traffic.
          See our{' '}
          <Link
            to="/privacy"
            style={{
              color: '#339DC7',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            Privacy Policy
          </Link>{' '}
          for details.
        </p>

        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => dismiss('declined')}
            style={{
              padding: '9px 20px',
              borderRadius: 9999,
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(255,255,255,0.55)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              transition: 'border-color 150ms, color 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            Decline
          </button>

          <button
            onClick={() => dismiss('accepted')}
            style={{
              padding: '9px 20px',
              borderRadius: 9999,
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: '#339DC7',
              color: '#fff',
              border: 'none',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2B85A9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#339DC7'; }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

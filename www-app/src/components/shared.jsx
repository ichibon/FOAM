import { useRef, useState, useEffect } from 'react';

export function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

export function AnimatedSection({ children, delay = 0, style, className }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(20px)',
      transition: `opacity 500ms ease-out ${delay}ms, transform 500ms ease-out ${delay}ms`,
      ...(style || {})
    }}>{children}</div>
  );
}

export function StatusChip({ label, color = 'gray', dark = false }) {
  const palettes = {
    green: {
      light: { bg: 'rgba(22,163,74,0.12)',  text: '#16A34A', border: 'rgba(22,163,74,0.25)' },
      dark:  { bg: 'rgba(34,197,94,0.18)',  text: '#22C55E', border: 'rgba(34,197,94,0.3)' },
    },
    blue: {
      light: { bg: 'rgba(51,157,199,0.12)', text: '#339DC7', border: 'rgba(51,157,199,0.25)' },
      dark:  { bg: 'rgba(51,157,199,0.18)', text: '#3DAFD6', border: 'rgba(51,157,199,0.35)' },
    },
    gray: {
      light: { bg: 'rgba(163,163,163,0.1)', text: '#737373', border: 'rgba(163,163,163,0.2)' },
      dark:  { bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.12)' },
    },
    amber: {
      light: { bg: 'rgba(217,119,6,0.1)',   text: '#D97706', border: 'rgba(217,119,6,0.2)' },
      dark:  { bg: 'rgba(245,158,11,0.18)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
    },
  };
  const c = (palettes[color] || palettes.gray)[dark ? 'dark' : 'light'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: '2px 9px', borderRadius: 9999,
      fontSize: 11, fontWeight: 500, fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap', lineHeight: '18px',
    }}>{label}</span>
  );
}

export function FeatureCheck({ children, dark = false }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #339DC7)"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 3 }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span style={{ fontSize: 14, lineHeight: 1.55, fontFamily: 'Inter, sans-serif',
        color: dark ? '#A3C4CF' : '#525252' }}>
        {children}
      </span>
    </div>
  );
}

export function SectionLabel({ children, dark = false, style: extraStyle }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: 9999,
      background: dark ? 'rgba(51,157,199,0.15)' : 'rgba(51,157,199,0.10)',
      border: `1px solid ${dark ? 'rgba(51,157,199,0.3)' : 'rgba(51,157,199,0.2)'}`,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.8px',
      textTransform: 'uppercase', color: 'var(--accent, #339DC7)',
      fontFamily: 'Inter, sans-serif',
      ...(extraStyle || {})
    }}>{children}</div>
  );
}

export function PillBtn({ children, variant = 'primary', onClick, size = 'md', style: extraStyle }) {
  const [hovered, setHovered] = useState(false);
  const sizes = {
    sm:  { padding: '7px 18px',  fontSize: 13 },
    md:  { padding: '11px 26px', fontSize: 15 },
    lg:  { padding: '14px 34px', fontSize: 16 },
  };
  const variants = {
    primary: {
      bg: 'var(--accent, #339DC7)', bg2: 'var(--accent-dark, #2B85A9)',
      text: '#fff', border: 'none',
    },
    secondary: {
      bg: '#fff', bg2: 'rgba(51,157,199,0.05)',
      text: 'var(--accent, #339DC7)', border: '1.5px solid var(--accent, #339DC7)',
    },
    'outline-white': {
      bg: 'transparent', bg2: 'rgba(255,255,255,0.1)',
      text: '#fff', border: '1.5px solid rgba(255,255,255,0.6)',
    },
  };
  const v = variants[variant] || variants.primary;
  const sz = sizes[size] || sizes.md;
  return (
    <button
      style={{
        ...sz, borderRadius: 9999, fontWeight: 600,
        fontFamily: 'Inter, sans-serif', cursor: 'pointer',
        border: v.border,
        background: hovered ? v.bg2 : v.bg,
        color: v.text,
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'all 200ms ease-out',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        ...(extraStyle || {})
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >{children}</button>
  );
}

export function HoverCard({ children, style: extraStyle, accent = false, accentColor = '#339DC7' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: '#fff',
        border: `${accent ? '2px solid ' + accentColor : '1px solid #E4E4E7'}`,
        borderRadius: 16,
        boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.13)' : '0 2px 8px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'box-shadow 200ms ease-out, transform 200ms ease-out',
        position: 'relative',
        ...(extraStyle || {})
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >{children}</div>
  );
}

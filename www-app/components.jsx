
// ── FOAM Marketing Site — Shared Components ────────────────
// Exports: Header, Footer, Button, Card, PhoneMockup, FAQ, 
//          ScrollReveal, Icon, Chip, ImagePlaceholder, SectionLabel

const { useState, useEffect, useRef } = React;

// ── Design Tokens ──────────────────────────────────────────
const T = {
  blue:        '#339DC7',
  blueBright:  '#3DAFD6',
  blueHover:   '#2B85A9',
  blueSubtle:  'rgba(51,157,199,0.10)',
  blueGlow:    'rgba(51,157,199,0.30)',
  dark:        '#0F2F3C',
  bg:          '#FAFAFA',
  bgSec:       '#F4F4F5',
  elevated:    '#FFFFFF',
  border:      '#E4E4E7',
  borderDef:   '#D4D4D8',
  text:        '#0A0A0A',
  textSec:     '#525252',
  textTer:     '#A3A3A3',
  tint:        '#E1F0F7',
  success:     '#16A34A',
  warning:     '#D97706',
  fontDisplay: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
  fontBody:    "'Inter', system-ui, -apple-system, sans-serif",
};

// ── SVG Icons ──────────────────────────────────────────────
const Icon = ({ name, size = 20, color = T.textSec, strokeWidth = 2 }) => {
  const paths = {
    'arrow-right':      <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    'chevron-right':    <polyline points="9 18 15 12 9 6"/>,
    'chevron-down':     <polyline points="6 9 12 15 18 9"/>,
    'chevron-up':       <polyline points="18 15 12 9 6 15"/>,
    'check':            <polyline points="20 6 9 17 4 12"/>,
    'x':                <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    'star':             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    'map-pin':          <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    'calendar':         <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    'credit-card':      <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    'users':            <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    'user':             <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    'shield':           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    'camera':           <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 0 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    'navigation':       <><polygon points="3 11 22 2 13 21 11 13 3 11"/></>,
    'dollar-sign':      <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    'trending-up':      <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    'bar-chart':        <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    'clock':            <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    'message-circle':   <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    'tool':             <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    'grid':             <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    'list':             <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    'repeat':           <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    'sun':              <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    'cloud-rain':       <><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></>,
    'check-circle':     <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    'instagram':        <><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>,
    'facebook':         <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
    'menu':             <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    'external-link':    <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    'minus':            <line x1="5" y1="12" x2="19" y2="12"/>,
    'plus':             <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    'tiktok':           <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>,
    'book-open':        <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    'award':            <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    'zap':              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    'flag':             <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline-block', flexShrink:0 }}>
      {paths[name] || null}
    </svg>
  );
};

// ── Button ─────────────────────────────────────────────────
const Button = ({ children, variant = 'primary', size = 'md', href, onClick, style: extraStyle }) => {
  const [hovered, setHovered] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: T.fontBody, fontWeight: 600, cursor: 'pointer',
    border: 'none', borderRadius: 9999, textDecoration: 'none',
    transition: 'all 200ms ease-out', whiteSpace: 'nowrap',
    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
  };
  const sizes = {
    sm: { padding: '8px 20px', fontSize: 13 },
    md: { padding: '12px 28px', fontSize: 15 },
    lg: { padding: '16px 36px', fontSize: 16 },
  };
  const variants = {
    primary: {
      background: hovered ? T.blueHover : T.blue,
      color: '#fff',
      boxShadow: hovered ? `0 8px 24px ${T.blueGlow}` : '0 4px 12px rgba(0,0,0,0.10)',
    },
    secondary: {
      background: 'transparent',
      color: T.blue,
      border: `2px solid ${T.blue}`,
      boxShadow: hovered ? `0 8px 24px ${T.blueGlow}` : 'none',
    },
    ghost: {
      background: hovered ? T.blueSubtle : 'transparent',
      color: T.blue, border: 'none', boxShadow: 'none',
    },
    dark: {
      background: 'transparent',
      color: '#fff',
      border: '2px solid rgba(255,255,255,0.7)',
      boxShadow: 'none',
    },
    'dark-primary': {
      background: hovered ? T.blueHover : T.blue,
      color: '#fff',
      boxShadow: hovered ? `0 8px 24px ${T.blueGlow}` : '0 4px 12px rgba(0,0,0,0.20)',
    },
  };
  const s = { ...base, ...sizes[size], ...variants[variant], ...extraStyle };
  if (href) return <a href={href} style={s} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>{children}</a>;
  return <button style={s} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>{children}</button>;
};

// ── Card ──────────────────────────────────────────────────
const Card = ({ children, style: extraStyle, onClick, glowOnHover = true }) => {
  const [hovered, setHovered] = useState(false);
  const s = {
    background: T.elevated, border: `1px solid ${hovered && glowOnHover ? T.blue : T.border}`,
    borderRadius: 16, padding: 24,
    boxShadow: hovered
      ? `0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px ${T.blueGlow}`
      : '0 4px 12px rgba(0,0,0,0.10)',
    transition: 'all 200ms ease-out',
    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
    cursor: onClick ? 'pointer' : 'default',
    ...extraStyle,
  };
  return <div style={s} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}>{children}</div>;
};

// ── ImagePlaceholder ───────────────────────────────────────
const ImagePlaceholder = ({ label, width, height, style: extraStyle }) => (
  <div style={{
    width: width || '100%', height: height || 200,
    background: '#F4F4F5', border: `1px dashed #D4D4D8`,
    borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 8, ...extraStyle,
  }}>
    <Icon name="camera" size={24} color="#A3A3A3" />
    <span style={{ fontFamily: T.fontBody, fontSize: 12, color: '#A3A3A3', textAlign: 'center', padding: '0 12px', lineHeight: 1.4 }}>{label}</span>
  </div>
);

// ── PhoneMockup ───────────────────────────────────────────
const PhoneMockup = ({ children, tint = T.dark }) => (
  <div style={{
    width: 180, height: 360, borderRadius: 32,
    background: tint, border: `6px solid #2a3a44`,
    boxShadow: '0 16px 48px rgba(0,0,0,0.25)', position: 'relative',
    overflow: 'hidden', flexShrink: 0,
  }}>
    {/* notch */}
    <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:60, height:20, background:'#1a2d37', borderRadius:'0 0 14px 14px', zIndex:10 }}></div>
    <div style={{ padding:'28px 8px 16px', height:'100%', overflow:'hidden' }}>{children}</div>
  </div>
);

// ── Chip / Tag ────────────────────────────────────────────
const Chip = ({ children, active, style: extraStyle }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
    background: active ? T.blue : T.blueSubtle,
    color: active ? '#fff' : T.blue,
    borderRadius: 9999, fontSize: 12, fontFamily: T.fontBody, fontWeight: 500,
    letterSpacing: '0.3px', ...extraStyle,
  }}>{children}</span>
);

// ── SectionLabel ──────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <span style={{
    fontFamily: T.fontBody, fontSize: 11, fontWeight: 500, letterSpacing: '0.8px',
    textTransform: 'uppercase', color: T.blue, display: 'block', marginBottom: 12,
  }}>{children}</span>
);

// ── ScrollReveal ──────────────────────────────────────────
const ScrollReveal = ({ children, delay = 0, style: extraStyle }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.55s ease-out ${delay}s, transform 0.55s ease-out ${delay}s`,
      ...extraStyle,
    }}>{children}</div>
  );
};

// ── FAQ Accordion ─────────────────────────────────────────
const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, color: T.text, textAlign: 'left', gap: 16,
      }}>
        {question}
        <span style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 250ms ease-out' }}>
          <Icon name="chevron-down" size={18} color={T.blue} />
        </span>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0, overflow: 'hidden',
        transition: 'max-height 250ms ease-out', 
      }}>
        <p style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSec, lineHeight: 1.7, paddingBottom: 20 }}>{answer}</p>
      </div>
    </div>
  );
};

const FAQ = ({ items, title = 'Frequently asked questions' }) => (
  <div style={{ maxWidth: 720, margin: '0 auto' }}>
    {title && <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, color: T.text, marginBottom: 40, textAlign: 'center' }}>{title}</h2>}
    {items.map((item, i) => <FAQItem key={i} {...item} />)}
  </div>
);

// ── Divider ───────────────────────────────────────────────
const Divider = () => <div style={{ height: 1, background: T.border, margin: '0' }} />;

// ── Section wrapper ────────────────────────────────────────
const Section = ({ children, background = T.bg, style: extraStyle }) => (
  <section style={{ background, padding: 'clamp(48px,8vw,96px) clamp(20px,6vw,80px)', ...extraStyle }}>
    {children}
  </section>
);

// ── Header ────────────────────────────────────────────────
const Header = ({ currentPage, navigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'For Customers', page: 'customers' },
    { label: 'For Detailers', page: 'detailers' },
    { label: 'For Shops', page: 'shops' },
    { label: 'Pricing', page: 'pricing' },
    { label: 'Resources', page: 'resources' },
  ];

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(250,250,250,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
      transition: 'all 300ms ease-out',
      borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,4vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        {/* Logo */}
        <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <img src="assets/logo-color-transparent.png" alt="FOAM" style={{ height: 32, display: 'block' }} />
        </button>
        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-nav">
          {navLinks.map(l => (
            <button key={l.page} onClick={() => navigate(l.page)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: T.fontBody, fontSize: 14, fontWeight: 500,
              color: currentPage === l.page ? T.blue : T.text,
              transition: 'color 150ms', padding: '4px 0',
              borderBottom: currentPage === l.page ? `2px solid ${T.blue}` : '2px solid transparent',
            }}>{l.label}</button>
          ))}
        </nav>
        {/* CTA + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button size="sm" onClick={() => navigate('detailers')}>Join FOAM</Button>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} className="hamburger">
            <Icon name={menuOpen ? 'x' : 'menu'} size={22} color={T.text} />
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: 'rgba(250,250,250,0.98)', borderTop: `1px solid ${T.border}`, padding: '16px 24px 24px' }}>
          {navLinks.map(l => (
            <button key={l.page} onClick={() => { navigate(l.page); setMenuOpen(false); }} style={{
              display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
              cursor: 'pointer', padding: '14px 0', fontFamily: T.fontBody, fontSize: 16, fontWeight: 500,
              color: T.text, borderBottom: `1px solid ${T.border}`,
            }}>{l.label}</button>
          ))}
          <div style={{ marginTop: 16 }}>
            <Button size="md" onClick={() => { navigate('detailers'); setMenuOpen(false); }} style={{ width: '100%', justifyContent: 'center' }}>Join FOAM</Button>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

// ── Footer ────────────────────────────────────────────────
const Footer = ({ navigate }) => {
  const cols = [
    { heading: 'Product', links: [{ l:'For Customers', p:'customers'}, {l:'For Detailers', p:'detailers'}, {l:'For Shops', p:'shops'}, {l:'Pricing', p:'pricing'}] },
    { heading: 'Company', links: [{l:'About', p:'about'}, {l:'Blog', p:'resources'}, {l:'Contact', p:'about'}, {l:'Press', p:'about'}] },
    { heading: 'Resources', links: [{l:'Mobile Detailing Guide', p:'resources'}, {l:'Shop Operator Guide', p:'resources'}, {l:'Atlanta Detailing', p:'atlanta'}, {l:'FAQs', p:'customers'}] },
    { heading: 'Legal', links: [{l:'Privacy', p:'home'}, {l:'Terms', p:'home'}] },
  ];
  return (
    <footer style={{ background: '#fff', borderTop: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(40px,6vw,64px) clamp(20px,4vw,48px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 40, marginBottom: 48 }}>
          <div>
            <img src="assets/logo-color-transparent.png" alt="FOAM" style={{ height: 28, marginBottom: 12, display: 'block' }} />
            <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>Your business. Your car. Clean.</p>
          </div>
          {cols.map(col => (
            <div key={col.heading}>
              <p style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.text, marginBottom: 16 }}>{col.heading}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  <button key={link.l} onClick={() => navigate(link.p)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: T.fontBody, fontSize: 13, color: T.textSec, padding: 0, transition: 'color 150ms' }}
                    onMouseEnter={e => e.target.style.color = T.text} onMouseLeave={e => e.target.style.color = T.textSec}>
                    {link.l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textTer }}>© 2026 FOAM Auto. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['instagram','facebook','tiktok'].map(s => (
              <button key={s} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSec, transition: 'color 150ms', padding: 4, display:'flex',alignItems:'center' }}
                onMouseEnter={e => { e.currentTarget.querySelector('svg').style.stroke = T.blue; }}
                onMouseLeave={e => { e.currentTarget.querySelector('svg').style.stroke = T.textSec; }}>
                <Icon name={s} size={18} color={T.textSec} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

// ── Stars ─────────────────────────────────────────────────
const Stars = ({ count = 5 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {Array.from({length: count}).map((_,i) => <Icon key={i} name="star" size={14} color="#F59E0B" />)}
  </div>
);

// Export everything to window
Object.assign(window, { T, Icon, Button, Card, ImagePlaceholder, PhoneMockup, Chip, SectionLabel, ScrollReveal, FAQ, FAQItem, Divider, Section, Header, Footer, Stars });

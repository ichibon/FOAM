import { Link } from 'react-router-dom';

const s = {
  h2: {
    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 17,
    color: '#0F2F3C', margin: '44px 0 10px', lineHeight: 1.3,
    paddingBottom: 8, borderBottom: '1px solid #F0F0F0',
  },
  h3: {
    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
    color: '#0F2F3C', margin: '28px 0 8px', lineHeight: 1.4,
  },
  p: {
    fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#374151',
    lineHeight: 1.8, margin: '0 0 14px',
  },
  ul: { paddingLeft: 22, margin: '6px 0 14px' },
  li: {
    fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#374151',
    lineHeight: 1.75, marginBottom: 6,
  },
  caps: {
    fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151',
    lineHeight: 1.75, margin: '0 0 14px', fontWeight: 600,
  },
};

export const H2 = ({ children }) => <h2 style={s.h2}>{children}</h2>;
export const H3 = ({ children }) => <h3 style={s.h3}>{children}</h3>;
export const P = ({ children }) => <p style={s.p}>{children}</p>;
export const UL = ({ children }) => <ul style={s.ul}>{children}</ul>;
export const LI = ({ children }) => <li style={s.li}>{children}</li>;
export const Caps = ({ children }) => <p style={s.caps}>{children}</p>;

export function PricingTable() {
  const rows = [
    { plan: 'Starter', monthly: '$29/month', annual: '$290/year', fee: '15% per booking' },
    { plan: 'Pro',     monthly: '$69/month', annual: '$690/year', fee: '12% per booking' },
    { plan: 'Crew',    monthly: '$149/month', annual: '$1,490/year', fee: '10% per booking' },
  ];
  const th = {
    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
    color: '#0F2F3C', textTransform: 'uppercase', letterSpacing: '0.5px',
    padding: '10px 16px', background: '#F4F4F5', textAlign: 'left',
  };
  const td = {
    fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#374151',
    padding: '10px 16px', borderBottom: '1px solid #F0F0F0',
  };
  return (
    <div style={{ overflowX: 'auto', margin: '12px 0 20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E4E4E7', borderRadius: 8 }}>
        <thead>
          <tr>
            {['Plan','Monthly','Annual','Platform Fee'].map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.plan}>
              <td style={{ ...td, fontWeight: 600, color: '#0F2F3C' }}>{r.plan}</td>
              <td style={td}>{r.monthly}</td>
              <td style={td}>{r.annual}</td>
              <td style={td}>{r.fee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalLayout({ title, effectiveDate, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E4E4E7',
        padding: '0 clamp(20px,5vw,64px)', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{
          fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
          color: '#525252', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'color 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#0A0A0A'}
          onMouseLeave={e => e.currentTarget.style.color = '#525252'}
        >
          ← Back to FOAM
        </Link>
        <img src="/foam_logo.png" alt="FOAM" style={{ height:28, width:'auto', display:'block' }} />
      </nav>

      <main style={{
        maxWidth: 740, margin: '0 auto',
        padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,32px) 80px',
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 800, fontSize: 'clamp(30px,4vw,44px)',
          color: '#0F2F3C', margin: '0 0 16px', letterSpacing: '-0.5px', lineHeight: 1.1,
        }}>{title}</h1>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#737373',
          display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8,
        }}>
          <span>Effective Date: {effectiveDate}</span>
          <span>FOAM, LLC · Atlanta, Georgia</span>
        </div>
        <div style={{ margin: '28px 0 0', borderTop: '2px solid #E4E4E7' }} />
        {children}
      </main>

      <footer style={{
        borderTop: '1px solid #E4E4E7', padding: '24px clamp(20px,5vw,64px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#A3A3A3' }}>
          © 2026 FOAM. All rights reserved.<br />FOAM is owned and operated by Vantage XO LLC.
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/privacy" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#A3A3A3', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#A3A3A3', textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/operator-agreement" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#A3A3A3', textDecoration: 'none' }}>Operator Agreement</Link>
        </div>
      </footer>
    </div>
  );
}

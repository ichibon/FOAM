import { useState, useEffect } from 'react';
import { AnimatedSection, StatusChip, PillBtn } from './shared.jsx';

/* ─── NAV ─── */
export function FoamNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const links = ['For Customers', 'For Detailers', 'For Shops', 'Pricing'];
  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        height: 64, padding: '0 clamp(20px,5vw,64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? '#E4E4E7' : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 200ms ease, border-color 200ms ease, backdrop-filter 200ms ease',
      }}>
        <img src="/foam_logo.png" alt="FOAM" style={{ height:30, width:'auto', display:'block', cursor:'pointer' }} />
        <div className="nav-desktop" style={{ display:'flex', gap:32, alignItems:'center' }}>
          {links.map(l => (
            <a key={l} href={`#${l.replace(/\s+/g,'-').toLowerCase()}`}
              style={{ fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:500, color:'#525252', textDecoration:'none', transition:'color 150ms' }}
              onMouseEnter={e=>e.target.style.color='#0A0A0A'}
              onMouseLeave={e=>e.target.style.color='#525252'}>{l}</a>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span className="nav-desktop"><PillBtn size="sm">Coming Soon</PillBtn></span>
          <button className="nav-mobile-btn" onClick={()=>setMobileOpen(!mobileOpen)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div style={{
          position:'fixed', inset:0, zIndex:999,
          background:'rgba(255,255,255,0.98)', backdropFilter:'blur(16px)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:32,
        }}>
          <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontWeight:800, fontSize:26, color:'var(--accent,#339DC7)' }}>FOAM</span>
          {links.map(l=>(
            <a key={l} href="#" style={{ fontFamily:'Inter,sans-serif', fontSize:22, fontWeight:600, color:'#0A0A0A', textDecoration:'none' }}
              onClick={()=>setMobileOpen(false)}>{l}</a>
          ))}
          <PillBtn size="lg" onClick={()=>setMobileOpen(false)}>Coming Soon</PillBtn>
        </div>
      )}
    </>
  );
}

/* ─── HERO CARDS ─── */
function TodaysJobsCard() {
  return (
    <div style={{ background:'#0F2F3C', border:'1px solid #1E5D72', borderRadius:14, padding:'16px 18px', boxShadow:'0 12px 40px rgba(0,0,0,0.4)', minWidth:280 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13, color:'#F5F5F5' }}>Today's Jobs</span>
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:700, color:'var(--accent,#339DC7)' }}>$680 today</span>
      </div>
      {[
        { time:'9:00 AM',  svc:'Full Detail',     status:'Completed',   color:'green' },
        { time:'11:30 AM', svc:'Ceramic Coat',    status:'In Progress', color:'blue' },
        { time:'2:00 PM',  svc:'Interior Detail', status:'Upcoming',    color:'gray' },
      ].map((j,i,arr)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i<arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#6A9BAA', width:58, flexShrink:0 }}>{j.time}</span>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#A3C4CF', flex:1 }}>{j.svc}</span>
          <StatusChip label={j.status} color={j.color} dark={true} />
        </div>
      ))}
    </div>
  );
}

function BayBoardCard() {
  return (
    <div style={{ background:'#164558', border:'1px solid #1E5D72', borderRadius:14, padding:'16px 18px', boxShadow:'0 12px 40px rgba(0,0,0,0.4)', minWidth:270 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <span style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13, color:'#F5F5F5' }}>Bay Board</span>
        <StatusChip label="● Live" color="green" dark={true} />
      </div>
      {[
        { bay:'Bay 1', vehicle:'Model S',  status:'In Progress',    color:'blue' },
        { bay:'Bay 2', vehicle:'F-150',    status:'Ready',          color:'green' },
        { bay:'Bay 3', vehicle:'Civic',    status:'Waiting Pickup', color:'amber' },
        { bay:'Bay 4', vehicle:'—',        status:'Empty',          color:'gray' },
      ].map((b,i,arr)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i<arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#6A9BAA', width:40, flexShrink:0 }}>{b.bay}</span>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#A3C4CF', flex:1 }}>{b.vehicle}</span>
          <StatusChip label={b.status} color={b.color} dark={true} />
        </div>
      ))}
    </div>
  );
}

function NearbyDetailersCard() {
  return (
    <div style={{ background:'#0F2F3C', border:'1px solid #1E5D72', borderRadius:14, padding:'16px 18px', boxShadow:'0 12px 40px rgba(0,0,0,0.4)', minWidth:275 }}>
      <div style={{ marginBottom:14 }}>
        <span style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13, color:'#F5F5F5' }}>Nearby Detailers</span>
      </div>
      {[
        { name:'Marcus D.',   rating:'4.9', svc:'Full Detail',  price:'From $89' },
        { name:'Jess Mobile', rating:'4.8', svc:'Ceramic Coat', price:'From $149' },
      ].map((d,i,arr)=>(
        <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i<arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <div style={{ width:34, height:34, borderRadius:9999, background:'rgba(51,157,199,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:700, color:'var(--accent,#339DC7)', fontFamily:'Inter,sans-serif' }}>{d.name[0]}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, color:'#F5F5F5', marginBottom:3 }}>{d.name}</div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#F59E0B' }}>★ {d.rating}</span>
              <StatusChip label={d.svc} color="blue" dark={true} />
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
            <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#6A9BAA', whiteSpace:'nowrap' }}>{d.price}</span>
            <button style={{ background:'var(--accent,#339DC7)', color:'#fff', border:'none', borderRadius:9999, padding:'3px 12px', fontSize:11, fontWeight:600, fontFamily:'Inter,sans-serif', cursor:'pointer' }}>Book</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── STORE BADGES ─── */
function AppleLogo() {
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" fill="none">
      <path d="M14.04 10.35c-.02-2.17 1.27-3.36 1.33-3.4-1.03-1.5-2.63-1.71-3.2-1.74-1.37-.13-2.68.8-3.37.8-.7 0-1.77-.77-2.9-.75C4.26 5.3 2.68 6.2 1.79 7.6.01 10.43 1.32 14.7 3.05 17.04c.88 1.26 1.93 2.67 3.28 2.62 1.32-.05 1.82-.85 3.42-.85s2.05.85 3.44.83c1.42-.02 2.33-1.28 3.2-2.55.99-1.44 1.4-2.83 1.42-2.9-.03-.01-2.73-1.05-2.77-4.84z" fill="white"/>
      <path d="M11.16 3.45c.73-.9 1.21-2.14 1.08-3.38-1.04.04-2.32.7-3.07 1.57-.67.78-1.26 2.04-1.1 3.24 1.16.09 2.36-.59 3.09-1.43z" fill="white"/>
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg width="17" height="19" viewBox="0 0 17 19" fill="none">
      <path d="M0.5 0.9L9.7 9.5L0.5 18.1V0.9Z" fill="#4FC3F7"/>
      <path d="M13.2 6.4L9.7 9.5L0.5 0.9L13.2 6.4Z" fill="#F48FB1"/>
      <path d="M13.2 12.6L0.5 18.1L9.7 9.5L13.2 12.6Z" fill="#A5D6A7"/>
      <path d="M16.5 9.5L13.2 12.6L9.7 9.5L13.2 6.4L16.5 9.5Z" fill="#FFCC80"/>
    </svg>
  );
}

function StoreBadge({ store }) {
  const [hov, setHov] = useState(false);
  const isApple = store === 'apple';
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: hov ? '#1a1a1a' : '#000',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 9, padding: '8px 16px 8px 12px',
        cursor: 'default', transition: 'background 200ms ease',
        minWidth: 145, position: 'relative',
      }}
    >
      {isApple ? <AppleLogo /> : <PlayLogo />}
      <div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:9, color:'rgba(255,255,255,0.7)', letterSpacing:'0.4px', lineHeight:1.3, textTransform: isApple ? 'none' : 'uppercase' }}>
          {isApple ? 'Download on the' : 'Get it on'}
        </div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:15, fontWeight:600, color:'#fff', letterSpacing:'-0.3px', lineHeight:1.25 }}>
          {isApple ? 'App Store' : 'Google Play'}
        </div>
      </div>
    </div>
  );
}

function StoreButtons() {
  return (
    <div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:12 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          background:'rgba(51,157,199,0.1)', border:'1px solid rgba(51,157,199,0.25)',
          borderRadius:9999, padding:'3px 10px',
        }}>
          <span style={{ width:6, height:6, borderRadius:9999, background:'var(--accent,#339DC7)', display:'inline-block' }}></span>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, fontWeight:600, color:'var(--accent,#339DC7)', letterSpacing:'0.5px' }}>Coming soon</span>
        </div>
      </div>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <StoreBadge store="apple" />
        <StoreBadge store="google" />
      </div>
      <p style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#A3A3A3', margin:'10px 0 0' }}>
        Free to book for customers
      </p>
    </div>
  );
}

/* ─── HERO ─── */
export function FoamHero({ city = 'Atlanta' }) {
  return (
    <section id="hero" style={{ background:'#FFFFFF', padding:'clamp(100px,12vw,140px) clamp(20px,5vw,64px) clamp(64px,8vw,100px)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'60fr 40fr', gap:'clamp(40px,5vw,80px)', alignItems:'center' }} className="hero-grid">
        <div>
          <div style={{ animation:'heroFadeUp 0.5s ease-out forwards', opacity:0 }}>
            <h1 style={{
              fontFamily:"'Playfair Display',Georgia,serif",
              fontWeight:800, fontSize:'clamp(36px,4.5vw,64px)',
              color:'#0F2F3C', lineHeight:1.1, letterSpacing:'-1.5px',
              margin:'0 0 24px',
            }}>No more running your detailing business on DMs and prayers.</h1>
            <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(16px,1.5vw,18px)', color:'#525252', lineHeight:1.65, margin:'0 0 36px', maxWidth:540 }}>
              FOAM is the operating system for auto detailing. Mobile detailers and shop owners manage bookings, payments, customers, and crews in one app. Customers book trusted detailers in two minutes.
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center', marginBottom:20 }}>
              <PillBtn variant="primary" size="md">Join as an Operator</PillBtn>
              <PillBtn variant="secondary" size="md">Book a Detail</PillBtn>
            </div>
            <StoreButtons />
          </div>
        </div>
        <div className="hero-cards" style={{ position:'relative', height:420 }}>
          <div style={{ position:'absolute', top:0, left:0, zIndex:3, animation:'cardFadeIn 0.5s ease-out 0.3s forwards', opacity:0 }}>
            <TodaysJobsCard />
          </div>
          <div style={{ position:'absolute', top:90, right:0, zIndex:2, animation:'cardFadeIn 0.5s ease-out 0.45s forwards', opacity:0 }}>
            <BayBoardCard />
          </div>
          <div style={{ position:'absolute', bottom:0, left:20, zIndex:1, animation:'cardFadeIn 0.5s ease-out 0.6s forwards', opacity:0 }}>
            <NearbyDetailersCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── STATS BAR ─── */
export function FoamStatsBar() {
  const stats = [
    { num: "Atlanta's first", label: 'detailing marketplace' },
    { num: '< 2 min',         label: 'average booking time' },
    { num: 'Mobile + Shop',   label: 'both operator types' },
    { num: '1 app',           label: 'to run everything' },
    { num: 'Zero',            label: 'whiteboards required' },
  ];
  return (
    <section style={{ background:'#0F2F3C', padding:'clamp(40px,5vw,60px) clamp(20px,5vw,64px)' }}>
      <AnimatedSection>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:0 }} className="stats-grid">
          {stats.map((s,i)=>(
            <div key={i} style={{
              display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
              padding:'0 24px',
              borderRight: i < stats.length-1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
            }}>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontWeight:800, fontSize:'clamp(22px,2.5vw,32px)', color:'#FFFFFF', marginBottom:6, letterSpacing:'-0.5px', lineHeight:1.1 }}>{s.num}</div>
              <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#E1F0F7', letterSpacing:'0.3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}

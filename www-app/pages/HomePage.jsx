// ── FOAM Homepage ──────────────────────────────────────────
// All 10 sections: Hero, Audience Router, How It Works, Dual Model,
// Product Preview, Founder Story, Founding Operator, Resources Preview, Final CTA, Footer

const { useState, useEffect, useRef } = React;

// ── 1. Hero ───────────────────────────────────────────────
const HeroSection = ({ navigate }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  // Mini phone screen content
  const screens = [
    { label: 'Customer — Discover', color: T.tint, content: (
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 9, fontFamily: T.fontBody, color: T.textSec, marginBottom: 6 }}>Near you</div>
        {[{name:'Elite Mobile Detail',rating:'4.9',type:'Mobile'},{name:'Clean Cuts ATL',rating:'4.8',type:'Shop'}].map((d,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:8, padding:'8px 10px', marginBottom:6, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:9, fontWeight:600, fontFamily:T.fontBody, color:T.text }}>{d.name}</div>
            <div style={{ display:'flex', gap:4, marginTop:2, alignItems:'center' }}>
              <Icon name="star" size={8} color="#F59E0B" />
              <span style={{ fontSize:8, color:T.textSec, fontFamily:T.fontBody }}>{d.rating} · {d.type}</span>
            </div>
          </div>
        ))}
      </div>
    )},
    { label: 'Operator — Today', color: T.dark, content: (
      <div style={{ padding: 8 }}>
        <div style={{ fontSize:9, fontFamily:T.fontBody, color:'#A3C4CF', marginBottom:6 }}>Today's jobs</div>
        {[{addr:'14 Oak St',time:'9:00 AM',status:'In Progress'},{addr:'88 Peach Blvd',time:'1:00 PM',status:'Upcoming'}].map((j,i)=>(
          <div key={i} style={{ background:'#164558', borderRadius:8, padding:'8px 10px', marginBottom:6, border:'1px solid #1E5D72' }}>
            <div style={{ fontSize:9, fontWeight:600, fontFamily:T.fontBody, color:'#F5F5F5' }}>{j.addr}</div>
            <div style={{ fontSize:8, color: i===0?T.blue:'#6A9BAA', fontFamily:T.fontBody, marginTop:2 }}>{j.time} · {j.status}</div>
          </div>
        ))}
      </div>
    )},
    { label: 'Shop — Bay Board', color: '#0D3A4A', content: (
      <div style={{ padding: 8 }}>
        <div style={{ fontSize:9, fontFamily:T.fontBody, color:'#A3C4CF', marginBottom:6 }}>Bay Status</div>
        {[{bay:'Bay 1',status:'In Progress',c:T.blue},{bay:'Bay 2',status:'Ready',c:'#16A34A'},{bay:'Bay 3',status:'Empty',c:'#6A9BAA'}].map((b,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#164558', borderRadius:8, padding:'6px 10px', marginBottom:5, border:'1px solid #1E5D72' }}>
            <span style={{ fontSize:9, fontFamily:T.fontBody, color:'#F5F5F5' }}>{b.bay}</span>
            <span style={{ fontSize:8, color:b.c, fontFamily:T.fontBody, fontWeight:600 }}>{b.status}</span>
          </div>
        ))}
      </div>
    )},
    { label: 'Booking Confirm', color: T.dark, content: (
      <div style={{ padding:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80%' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:T.blue, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
          <Icon name="check" size={16} color="#fff" />
        </div>
        <div style={{ fontSize:10, fontWeight:700, fontFamily:T.fontBody, color:'#F5F5F5', textAlign:'center', marginBottom:4 }}>You're on the books.</div>
        <div style={{ fontSize:8, color:'#A3C4CF', fontFamily:T.fontBody, textAlign:'center' }}>Full detail · Mon, May 11 · 10:00 AM</div>
      </div>
    )},
  ];

  return (
    <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(120px,12vw,160px) clamp(20px,6vw,80px) clamp(64px,8vw,96px)', minHeight: '90vh', display:'flex', alignItems:'center' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', width:'100%' }}>
        {/* Left */}
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:T.blueSubtle, border:`1px solid rgba(51,157,199,0.2)`, borderRadius:9999, padding:'6px 14px', marginBottom:24 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:T.blue }}></div>
            <span style={{ fontFamily:T.fontBody, fontSize:12, fontWeight:500, color:T.blue, letterSpacing:'0.5px' }}>Launching in Atlanta, 2026</span>
          </div>
          <h1 style={{
            fontFamily: T.fontDisplay, fontWeight: 800, lineHeight: 1.08,
            fontSize: 'clamp(40px,5.5vw,72px)', color: T.text, marginBottom: 24,
            letterSpacing: '-1.5px',
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}>
            The operating system for auto detailing.
          </h1>
          <p style={{
            fontFamily: T.fontBody, fontSize: 'clamp(15px,1.5vw,18px)', color: T.textSec, lineHeight: 1.7,
            maxWidth: 480, marginBottom: 36,
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s',
          }}>
            Customers book trusted mobile detailers and local shops. Operators run bookings, payments, customers, crews, routes, and bays from one place.
          </p>
          <div style={{
            display: 'flex', gap: 14, flexWrap: 'wrap',
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
          }}>
            <Button size="lg" onClick={() => navigate('detailers')}>Join as an Operator</Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('customers')}>Book a Detail</Button>
          </div>
          {/* Trust signal */}
          <div style={{
            display:'flex', alignItems:'center', gap:16, marginTop:40,
            opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease-out 0.4s',
          }}>
            <div style={{ display:'flex' }}>
              {['#339DC7','#2B85A9','#3DAFD6'].map((c,i) => (
                <div key={i} style={{ width:30, height:30, borderRadius:'50%', background:c, border:'2px solid #fff', marginLeft: i===0?0:-8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="user" size={14} color="#fff" />
                </div>
              ))}
            </div>
            <span style={{ fontFamily:T.fontBody, fontSize:13, color:T.textSec }}>Atlanta's first wave is forming. <span style={{ color:T.blue, fontWeight:600 }}>Join now.</span></span>
          </div>
        </div>
        {/* Right — phone mockups */}
        <div style={{ position:'relative', display:'flex', justifyContent:'center', alignItems:'center', height:400 }}>
          {screens.map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${[50, 68, 32, 14][i]}%`,
              top: `${[0, 18, 18, 36][i]}%`,
              transform: `translateX(-50%) rotate(${[-2,3,-4,2][i]}deg)`,
              zIndex: 4-i,
              opacity: mounted ? 1 : 0,
              transition: `opacity 0.6s ease-out ${0.2 + i*0.12}s, transform 0.6s ease-out ${0.2 + i*0.12}s`,
              filter: i > 1 ? 'blur(0.5px)' : 'none',
            }}>
              <PhoneMockup tint={s.color}>
                <div style={{ height:'100%', overflow:'hidden' }}>
                  <div style={{ fontSize:8, fontFamily:T.fontBody, color:'#6A9BAA', padding:'0 4px 4px', textAlign:'center' }}>{s.label}</div>
                  {s.content}
                </div>
              </PhoneMockup>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){ section > div { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
};

// ── 2. Audience Router ─────────────────────────────────────
const AudienceRouter = ({ navigate }) => {
  const cards = [
    { title:'For Customers', icon:'user', body:'Find trusted detailers nearby. Mobile or shop. Book in minutes.', cta:'Book a detail', page:'customers' },
    { title:'For Mobile Detailers', icon:'navigation', body:'Stop running your business from Instagram DMs, Venmo, and notes apps.', cta:'Run your mobile business', page:'detailers' },
    { title:'For Shops', icon:'grid', body:'Fill your bays, manage drop-offs, and keep customers coming back.', cta:'Run your shop', page:'shops' },
  ];
  return (
    <Section background={T.bg}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <ScrollReveal>
          <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:T.text, textAlign:'center', marginBottom:8, letterSpacing:'-0.5px' }}>Choose how you FOAM.</h2>
          <p style={{ fontFamily:T.fontBody, fontSize:15, color:T.textSec, textAlign:'center', marginBottom:48 }}>One platform. Three ways in.</p>
        </ScrollReveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {cards.map((c,i) => (
            <ScrollReveal key={c.page} delay={i*0.1}>
              <Card onClick={() => navigate(c.page)}>
                <div style={{ width:44, height:44, borderRadius:12, background:T.blueSubtle, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <Icon name={c.icon} size={22} color={T.blue} />
                </div>
                <h3 style={{ fontFamily:T.fontDisplay, fontSize:22, fontWeight:700, color:T.text, marginBottom:10 }}>{c.title}</h3>
                <p style={{ fontFamily:T.fontBody, fontSize:14, color:T.textSec, lineHeight:1.7, marginBottom:20 }}>{c.body}</p>
                <span style={{ fontFamily:T.fontBody, fontSize:14, fontWeight:600, color:T.blue, display:'flex', alignItems:'center', gap:6 }}>
                  {c.cta} <Icon name="arrow-right" size={14} color={T.blue} />
                </span>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ── 3. How It Works ────────────────────────────────────────
const HowItWorks = () => {
  const [tab, setTab] = useState('customers');
  const steps = {
    customers: [
      { n:1, title:'Search nearby', body:'Enter your location and find mobile detailers or shops within minutes.' },
      { n:2, title:'Choose mobile or drop-off', body:'Decide if you want the detailer to come to you, or if you prefer a fixed shop.' },
      { n:3, title:'Pick a service and time', body:'Browse service menus, pricing, and availability — then lock in a slot.' },
      { n:4, title:'Pay and rebook in the app', body:'Secure payment in-app. Rebook your favorite detailer in two taps.' },
    ],
    operators: [
      { n:1, title:'Build your profile', body:'Set your services, pricing, availability, and service area. Go live fast.' },
      { n:2, title:'Manage bookings and availability', body:'One calendar. Every booking. No more back-and-forth in DMs.' },
      { n:3, title:'Complete jobs and get paid', body:'Mark jobs complete. Payments hit automatically. No chasing.' },
      { n:4, title:'Grow with reviews and repeat customers', body:'Reviews build reputation. Repeat customers build revenue.' },
    ],
  };
  return (
    <Section background={T.bgSec}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <ScrollReveal>
          <SectionLabel>How It Works</SectionLabel>
          <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:T.text, marginBottom:32, letterSpacing:'-0.5px' }}>Clean cars. Clean business.</h2>
          {/* Tab toggle */}
          <div style={{ display:'inline-flex', background:T.border, borderRadius:9999, padding:4, marginBottom:48 }}>
            {[{k:'customers',l:'Customers'},{k:'operators',l:'Operators'}].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                padding:'8px 24px', borderRadius:9999, border:'none', cursor:'pointer',
                fontFamily:T.fontBody, fontSize:14, fontWeight:600, transition:'all 200ms ease-out',
                background: tab===t.k ? T.blue : 'transparent',
                color: tab===t.k ? '#fff' : T.textSec,
              }}>{t.l}</button>
            ))}
          </div>
        </ScrollReveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:24 }}>
          {steps[tab].map((s,i) => (
            <ScrollReveal key={`${tab}-${s.n}`} delay={i*0.08}>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:T.blue, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:T.fontBody, fontSize:15, fontWeight:700, color:'#fff' }}>{s.n}</span>
                </div>
                <h4 style={{ fontFamily:T.fontBody, fontSize:16, fontWeight:600, color:T.text }}>{s.title}</h4>
                <p style={{ fontFamily:T.fontBody, fontSize:14, color:T.textSec, lineHeight:1.7 }}>{s.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ── 4. Dual Model ─────────────────────────────────────────
const DualModel = () => {
  const [view, setView] = useState('Mobile');
  const views = ['Mobile','Shop','Hybrid'];

  const MobileView = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:11, fontFamily:T.fontBody, color:T.textSec, fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:4 }}>Today's Route</div>
      {[
        {addr:'14 Oak Street NW',time:'9:00 AM',type:'Full Detail',drive:'12 min drive',status:'In Progress'},
        {addr:'88 Peach Blvd',time:'1:00 PM',type:'Interior Detail',drive:'8 min drive',status:'Upcoming'},
        {addr:'220 Spring St',time:'3:30 PM',type:'Ceramic Coat',drive:'15 min drive',status:'Upcoming'},
      ].map((job,i) => (
        <div key={i} style={{ background:i===0?T.blueSubtle:'#fff', border:`1px solid ${i===0?T.blue:T.border}`, borderRadius:12, padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:T.fontBody, fontSize:14, fontWeight:600, color:T.text }}>{job.addr}</span>
            <span style={{ fontFamily:T.fontBody, fontSize:12, color:i===0?T.blue:T.textSec, fontWeight:600 }}>{job.status}</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontFamily:T.fontBody, fontSize:12, color:T.textSec }}>{job.time}</span>
            <span style={{ fontFamily:T.fontBody, fontSize:12, color:T.textSec }}>·</span>
            <span style={{ fontFamily:T.fontBody, fontSize:12, color:T.textSec }}>{job.type}</span>
          </div>
          {i===0 && <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
            <Icon name="navigation" size={12} color={T.blue} />
            <span style={{ fontFamily:T.fontBody, fontSize:11, color:T.blue }}>{job.drive}</span>
          </div>}
        </div>
      ))}
    </div>
  );

  const ShopView = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:11, fontFamily:T.fontBody, color:T.textSec, fontWeight:500, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:4 }}>Bay Board</div>
      {[
        {bay:'Bay 1',car:'2021 BMW M4',status:'In Progress',color:T.blue},
        {bay:'Bay 2',car:'2019 Tahoe',status:'Ready',color:T.success},
        {bay:'Bay 3',car:'—',status:'Empty',color:T.borderDef},
        {bay:'Bay 4',car:'2023 Tesla S',status:'Waiting for Pickup',color:T.warning},
      ].map((b,i) => (
        <div key={i} style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:T.fontBody, fontSize:13, fontWeight:600, color:T.text, marginBottom:2 }}>{b.bay}</div>
            <div style={{ fontFamily:T.fontBody, fontSize:12, color:T.textSec }}>{b.car}</div>
          </div>
          <span style={{ fontFamily:T.fontBody, fontSize:11, fontWeight:600, color:b.color, background:`${b.color}15`, padding:'4px 10px', borderRadius:9999 }}>{b.status}</span>
        </div>
      ))}
    </div>
  );

  const HybridView = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fontBody, color:T.textSec, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Mobile Route</div>
        {[{a:'14 Oak St',t:'9 AM',s:'In Progress'},{a:'88 Peach',t:'1 PM',s:'Upcoming'}].map((j,i)=>(
          <div key={i} style={{ background:i===0?T.blueSubtle:'#fff', border:`1px solid ${i===0?T.blue:T.border}`, borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
            <div style={{ fontFamily:T.fontBody, fontSize:12, fontWeight:600, color:T.text }}>{j.a}</div>
            <div style={{ fontFamily:T.fontBody, fontSize:11, color:i===0?T.blue:T.textSec }}>{j.t} · {j.s}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize:10, fontFamily:T.fontBody, color:T.textSec, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>Shop Bays</div>
        {[{b:'Bay 1',s:'In Progress',c:T.blue},{b:'Bay 2',s:'Ready',c:T.success}].map((b,i)=>(
          <div key={i} style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
            <div style={{ fontFamily:T.fontBody, fontSize:12, fontWeight:600, color:T.text }}>{b.b}</div>
            <div style={{ fontFamily:T.fontBody, fontSize:11, color:b.c, fontWeight:600 }}>{b.s}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Section background="#fff">
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
        <ScrollReveal>
          <SectionLabel>Dual Model</SectionLabel>
          <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:T.text, marginBottom:20, letterSpacing:'-0.5px' }}>Van or bay. FOAM handles both.</h2>
          <p style={{ fontFamily:T.fontBody, fontSize:15, color:T.textSec, lineHeight:1.8, marginBottom:32 }}>Mobile routes, shop bays, drop-offs, walk-ins, customer history, payments, and crew assignments. FOAM was built for how detailing actually works.</p>
          {/* Toggle */}
          <div style={{ display:'inline-flex', background:T.bgSec, borderRadius:9999, padding:4 }}>
            {views.map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:'8px 20px', borderRadius:9999, border:'none', cursor:'pointer',
                fontFamily:T.fontBody, fontSize:13, fontWeight:600, transition:'all 200ms ease-out',
                background: view===v ? T.blue : 'transparent',
                color: view===v ? '#fff' : T.textSec,
              }}>{v}</button>
            ))}
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:20, padding:24, boxShadow:'0 8px 24px rgba(0,0,0,0.08)' }}>
            {view==='Mobile' && <MobileView />}
            {view==='Shop' && <ShopView />}
            {view==='Hybrid' && <HybridView />}
          </div>
        </ScrollReveal>
      </div>
      <style>{`@media(max-width:768px){ div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </Section>
  );
};

// ── 5. Product Preview ────────────────────────────────────
const ProductPreview = () => {
  const roles = [
    { role:'Customer', icon:'user', desc:'Discover, book, pay, rebook', color:T.blue, items:['Find detailers nearby','Compare reviews and work','Book in 2 minutes','Pay and rebook in-app'] },
    { role:'Operator', icon:'tool', desc:'Today, bookings, customers, business', color:'#7C3AED', items:['Full business dashboard','Route and job management','Instant payments','Customer CRM'] },
    { role:'Manager', icon:'users', desc:'Assign jobs, manage crew, track performance', color:'#059669', items:['Crew scheduling','Job assignment','Performance reports','Commission rules'] },
    { role:'Crew', icon:'navigation', desc:'See jobs, navigate, complete, earn', color:T.warning, items:['Daily job list','Turn-by-turn nav','Complete jobs','Track earnings'] },
  ];
  return (
    <Section background={T.bgSec}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <ScrollReveal>
          <SectionLabel>Product</SectionLabel>
          <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:T.text, marginBottom:48, letterSpacing:'-0.5px' }}>One platform. Every role.</h2>
        </ScrollReveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:24 }}>
          {roles.map((r,i) => (
            <ScrollReveal key={r.role} delay={i*0.1}>
              <Card style={{ height:'100%' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${r.color}15`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <Icon name={r.icon} size={22} color={r.color} />
                </div>
                <h3 style={{ fontFamily:T.fontDisplay, fontSize:20, fontWeight:700, color:T.text, marginBottom:4 }}>{r.role}</h3>
                <p style={{ fontFamily:T.fontBody, fontSize:13, color:T.textSec, marginBottom:16 }}>{r.desc}</p>
                {/* Mini phone preview */}
                <div style={{ background:T.bgSec, borderRadius:12, padding:14, marginBottom:16 }}>
                  {r.items.map((item,j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom: j<r.items.length-1?`1px solid ${T.border}`:'none' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:r.color, flexShrink:0 }}></div>
                      <span style={{ fontFamily:T.fontBody, fontSize:12, color:T.textSec }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ── 6. Founder Story ──────────────────────────────────────
const FounderStory = ({ navigate }) => (
  <section style={{ background: T.dark, padding:'clamp(64px,8vw,96px) clamp(20px,6vw,80px)' }}>
    <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
      <ScrollReveal>
        <SectionLabel>Our Story</SectionLabel>
        <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:'#fff', marginBottom:24, letterSpacing:'-0.5px', lineHeight:1.15 }}>Built by someone who ran the van and the bay.</h2>
        <p style={{ fontFamily:T.fontBody, fontSize:15, color:T.tint, lineHeight:1.8, marginBottom:32 }}>FOAM started with a mobile van and three physical shops in Atlanta. The problem was never the work. It was the infrastructure around the work. So we built the platform the industry should have had from day one.</p>
        <Button variant="dark" onClick={() => navigate('about')}>Read the story</Button>
      </ScrollReveal>
      <ScrollReveal delay={0.15}>
        <ImagePlaceholder label="Founder photography — van, shop bay, detailing tools" height={360} style={{ background:'#164558', border:'1px solid #1E5D72', borderRadius:20 }} />
      </ScrollReveal>
    </div>
    <style>{`@media(max-width:768px){ section > div { grid-template-columns: 1fr !important; } }`}</style>
  </section>
);

// ── 7. Founding Operator ──────────────────────────────────
const FoundingOperator = ({ navigate }) => {
  const offers = [
    { icon:'dollar-sign', title:'3 months free on Pro', body:'Get full Pro access while you help us shape the product.' },
    { icon:'award', title:'Founding Operator badge', body:'A permanent mark on your profile. First wave operators carry it for life.' },
    { icon:'zap', title:'Zero booking fee — 60 days', body:'Keep 100% of every job for your first two months on the platform.' },
    { icon:'message-circle', title:'Direct product access', body:'A direct line to the team. Your feedback ships.' },
  ];
  return (
    <Section background={T.tint}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <ScrollReveal style={{ textAlign:'center', marginBottom:48 }}>
          <SectionLabel>Founding Operators</SectionLabel>
          <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:T.text, marginBottom:16, letterSpacing:'-0.5px' }}>Atlanta founding operators get in first.</h2>
          <p style={{ fontFamily:T.fontBody, fontSize:15, color:T.textSec, maxWidth:560, margin:'0 auto 0' }}>Join the first wave of FOAM operators and help shape the platform before public launch.</p>
        </ScrollReveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20, marginBottom:48 }}>
          {offers.map((o,i) => (
            <ScrollReveal key={o.title} delay={i*0.1}>
              <div style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:16, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:T.blueSubtle, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <Icon name={o.icon} size={20} color={T.blue} />
                </div>
                {o.icon==='award' ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <h4 style={{ fontFamily:T.fontBody, fontSize:15, fontWeight:700, color:T.text }}>{o.title}</h4>
                    <span className="badge-shine" style={{ fontSize:10, background:T.blue, color:'#fff', padding:'2px 8px', borderRadius:9999, fontWeight:600, overflow:'hidden', position:'relative' }}>
                      Founding
                    </span>
                  </div>
                ) : (
                  <h4 style={{ fontFamily:T.fontBody, fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>{o.title}</h4>
                )}
                <p style={{ fontFamily:T.fontBody, fontSize:13, color:T.textSec, lineHeight:1.6 }}>{o.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div style={{ textAlign:'center' }}>
          <Button size="lg" onClick={() => navigate('detailers')}>Apply to Become a Founding Operator</Button>
        </div>
      </div>
      <style>{`
        @keyframes badge-shine {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
        .badge-shine::after {
          content:'';
          position:absolute; top:0; left:0; width:30%; height:100%;
          background:rgba(255,255,255,0.4);
          animation: badge-shine 2s ease-in-out infinite;
        }
      `}</style>
    </Section>
  );
};

// ── 8. Resources Preview ──────────────────────────────────
const ResourcesPreview = ({ navigate }) => {
  const articles = [
    { cat:'Mobile Detailer Playbook', title:'How to price mobile detailing services', summary:'Most operators underprice and overcorrect. Here is a framework built around real market data from Atlanta operators.', time:'6 min read' },
    { cat:'Shop Operator Handbook', title:'How to fill dead bay time without discounting', summary:'Empty bays are dead inventory. Learn how top shops turn downtime into booked slots without touching their rates.', time:'5 min read' },
    { cat:'Customer Guides', title:'Mobile detailing vs. shop detailing: what customers actually want', summary:'The choice is not just about convenience. We break down what customers really care about when choosing where to book.', time:'4 min read' },
  ];
  return (
    <Section background={T.bg}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <ScrollReveal style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40, flexWrap:'wrap', gap:16 }}>
          <div>
            <SectionLabel>Resources</SectionLabel>
            <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(24px,3.5vw,40px)', fontWeight:700, color:T.text, maxWidth:560, letterSpacing:'-0.5px' }}>Built for operators who are building something real.</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('resources')} style={{ whiteSpace:'nowrap' }}>Explore Resources <Icon name="arrow-right" size={14} color={T.blue} /></Button>
        </ScrollReveal>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {articles.map((a,i) => (
            <ScrollReveal key={a.title} delay={i*0.1}>
              <Card style={{ cursor:'pointer' }} onClick={() => navigate('resources')}>
                <Chip style={{ marginBottom:14 }}>{a.cat}</Chip>
                <h3 style={{ fontFamily:T.fontDisplay, fontSize:20, fontWeight:700, color:T.text, marginBottom:10, lineHeight:1.3 }}>{a.title}</h3>
                <p style={{ fontFamily:T.fontBody, fontSize:13, color:T.textSec, lineHeight:1.7, marginBottom:16 }}>{a.summary}</p>
                <span style={{ fontFamily:T.fontBody, fontSize:12, color:T.textTer }}>{a.time}</span>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ── 9. Final CTA ──────────────────────────────────────────
const FinalCTA = ({ navigate }) => (
  <section style={{ background: T.dark, padding:'clamp(80px,10vw,120px) clamp(20px,6vw,80px)', textAlign:'center' }}>
    <ScrollReveal>
      <h2 style={{ fontFamily:T.fontDisplay, fontSize:'clamp(32px,5vw,64px)', fontWeight:800, color:'#fff', marginBottom:20, letterSpacing:'-1px', lineHeight:1.1 }}>The whiteboard days are over.</h2>
      <p style={{ fontFamily:T.fontBody, fontSize:'clamp(14px,1.5vw,18px)', color:T.tint, lineHeight:1.7, maxWidth:560, margin:'0 auto 40px', opacity:0.9 }}>Whether you run a van, a bay, or both, FOAM gives your detailing business the infrastructure it deserved from day one.</p>
      <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
        <Button size="lg" variant="dark-primary" onClick={() => navigate('detailers')}>Join FOAM</Button>
        <Button size="lg" variant="dark" onClick={() => navigate('pricing')}>See Pricing</Button>
      </div>
    </ScrollReveal>
  </section>
);

// ── HomePage assembly ─────────────────────────────────────
const HomePage = ({ navigate }) => (
  <div>
    <HeroSection navigate={navigate} />
    <AudienceRouter navigate={navigate} />
    <HowItWorks />
    <DualModel />
    <ProductPreview />
    <FounderStory navigate={navigate} />
    <FoundingOperator navigate={navigate} />
    <ResourcesPreview navigate={navigate} />
    <FinalCTA navigate={navigate} />
  </div>
);

Object.assign(window, { HomePage });

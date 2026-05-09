/* FOAM Landing — AudienceRouter, HowItWorks, ProductFeature */

/* ─── AUDIENCE ROUTER ─── */
const audienceCards = [
  {
    id: 'detailers', accentBar: 'var(--accent,#339DC7)', label: 'Mobile Detailers',
    headline: 'Run your business. Not your group chat.',
    body: 'The back office you never had. Bookings, payments, customers, and crew — all in one app.',
    features: ['Book clients 24/7 without DMs','Get paid when the job is done','Build a CRM that markets itself'],
    cta: 'See how detailers use FOAM →',
  },
  {
    id: 'shops', accentBar: '#16A34A', label: 'Shop Owners',
    headline: 'Fill your bays. Keep your customers coming back.',
    body: 'Bay management, drop-off booking, walk-ins, customer history, and ready notifications in one place.',
    features: ['See every bay status in real time','Customers book drop-offs in advance','Alert customers the moment their car is done'],
    cta: 'See how shops use FOAM →',
  },
  {
    id: 'customers', accentBar: '#D97706', label: 'Customers',
    headline: 'Book a detailer. Get a clean car. That\'s it.',
    body: 'Find trusted mobile detailers and local shops. Book in under two minutes. Pay in the app.',
    features: ['Mobile or drop-off — your choice','Verified operators with real reviews','Rebook in seconds — your info is saved'],
    cta: 'See how customers use FOAM →',
  },
];

const AudienceCard = ({ card, index }) => (
  <AnimatedSection delay={index * 100} style={{ height: '100%' }}>
    <HoverCard style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: 4, background: card.accentBar, borderRadius: '16px 16px 0 0' }} />
      <div style={{ padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 9999,
            background: 'rgba(51,157,199,0.08)', border: '1px solid rgba(51,157,199,0.18)',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
            color: 'var(--accent,#339DC7)', fontFamily: 'Inter,sans-serif',
          }}>{card.label}</span>
        </div>
        <h3 style={{
          fontFamily: "'Playfair Display',Georgia,serif",
          fontWeight: 700, fontSize: 'clamp(20px,1.8vw,23px)',
          color: '#0F2F3C', lineHeight: 1.2, margin: '0 0 14px', letterSpacing: '-0.3px',
        }}>{card.headline}</h3>
        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: '#525252', lineHeight: 1.6, margin: '0 0 20px' }}>
          {card.body}
        </p>
        <div style={{ flex: 1 }}>
          {card.features.map((f, i) => <FeatureCheck key={i}>{f}</FeatureCheck>)}
        </div>
        <a href="#" style={{
          fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
          color: 'var(--accent,#339DC7)', textDecoration: 'none',
          marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 4,
          transition: 'gap 150ms ease',
        }}
        onMouseEnter={e=>e.currentTarget.style.gap='8px'}
        onMouseLeave={e=>e.currentTarget.style.gap='4px'}
        >{card.cta}</a>
      </div>
    </HoverCard>
  </AnimatedSection>
);

const FoamAudienceRouter = () => (
  <section id="for-customers" style={{ background: '#F4F4F5', padding: 'clamp(72px,8vw,100px) clamp(20px,5vw,64px)' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <AnimatedSection style={{ textAlign: 'center', marginBottom: 56 }}>
        <h2 style={{
          fontFamily: "'Playfair Display',Georgia,serif",
          fontWeight: 800, fontSize: 'clamp(32px,3.5vw,52px)',
          color: '#0F2F3C', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.1,
        }}>Choose how you FOAM.</h2>
        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 17, color: '#525252', margin: 0 }}>
          Every role has its own section. Pick yours.
        </p>
      </AnimatedSection>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, alignItems: 'stretch' }} className="audience-grid">
        {audienceCards.map((c, i) => <AudienceCard key={c.id} card={c} index={i} />)}
      </div>
    </div>
  </section>
);

/* ─── HOW IT WORKS ─── */
const operatorSteps = [
  { num: '01', title: 'Download the app', body: 'Available iOS and Android. Pick your profile: mobile detailer or shop.' },
  { num: '02', title: 'Build your profile', body: 'Add services, prices, photos, and availability. Takes under 10 minutes.' },
  { num: '03', title: 'Start getting booked', body: 'Share your link. Customers find you. You get paid automatically.' },
];
const customerSteps = [
  { num: '01', title: 'Open FOAM', body: 'Search for detailers near you — mobile or shop, your call.' },
  { num: '02', title: 'Pick and book', body: 'See real ratings, real work. Book your time and pay in the app.' },
  { num: '03', title: 'Get a clean car', body: 'They come to you, or you drop off. Done.' },
];

const FoamHowItWorks = () => {
  const [tab, setTab] = React.useState('operators');
  const [visible, setVisible] = React.useState(true);
  const steps = tab === 'operators' ? operatorSteps : customerSteps;

  const switchTab = (next) => {
    if (next === tab) return;
    setVisible(false);
    setTimeout(() => { setTab(next); setVisible(true); }, 180);
  };

  return (
    <section id="for-detailers" style={{ background: '#FFFFFF', padding: 'clamp(72px,8vw,100px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <AnimatedSection style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "'Playfair Display',Georgia,serif",
            fontWeight: 800, fontSize: 'clamp(30px,3.2vw,48px)',
            color: '#0F2F3C', margin: '0 0 32px', letterSpacing: '-1px', lineHeight: 1.1,
          }}>Get started in 3 steps.</h2>
          <div style={{ display: 'inline-flex', background: '#F4F4F5', borderRadius: 9999, padding: 4, gap: 4 }}>
            {['operators','customers'].map(t => (
              <button key={t} onClick={() => switchTab(t)} style={{
                padding: '8px 24px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: 600,
                background: tab === t ? 'var(--accent,#339DC7)' : 'transparent',
                color: tab === t ? '#fff' : '#525252',
                transition: 'all 200ms ease-out',
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </AnimatedSection>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32,
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)',
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
        }} className="steps-grid">
          {steps.map((s, i) => (
            <div key={i} style={{ padding: '32px 28px', borderRadius: 16, background: '#FAFAFA', border: '1px solid #E4E4E7' }}>
              <div style={{
                fontFamily: "'Playfair Display',Georgia,serif",
                fontWeight: 800, fontSize: 48, color: 'var(--accent,#339DC7)',
                lineHeight: 1, marginBottom: 16, letterSpacing: '-2px',
              }}>{s.num}</div>
              <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 17, color: '#0A0A0A', marginBottom: 10 }}>{s.title}</div>
              <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 14, color: '#525252', lineHeight: 1.6, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── PRODUCT FEATURE ─── */
const MobileJobsPanel = () => (
  <div style={{ background: '#0F2F3C', border: '1px solid #1E5D72', borderRadius: 14, padding: '18px 20px', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F5F5' }}>On the road</span>
      <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--accent,#339DC7)' }}>Revenue today: $680</span>
    </div>
    {[
      { time:'8:30 AM', svc:'Full Detail', name:'James R.', status:'Completed', color:'green' },
      { time:'11:00 AM', svc:'Ceramic Coat', name:'Maria K.', status:'In Progress', color:'blue' },
      { time:'1:30 PM', svc:'Interior Detail', name:'Alex P.', status:'Upcoming', color:'gray' },
      { time:'3:30 PM', svc:'Exterior Wash', name:'Taylor S.', status:'Upcoming', color:'gray' },
    ].map((j,i,arr)=>(
      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<arr.length-1?'1px solid rgba(255,255,255,0.06)':'none' }}>
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#6A9BAA', width:60, flexShrink:0 }}>{j.time}</span>
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#A3C4CF', flex:1 }}>{j.svc}</span>
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'rgba(255,255,255,0.3)', marginRight:4 }}>{j.name}</span>
        <StatusChip label={j.status} color={j.color} dark={true} />
      </div>
    ))}
  </div>
);

const ShopBayPanel = () => (
  <div style={{ background: '#164558', border: '1px solid #1E5D72', borderRadius: 14, padding: '18px 20px', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, color: '#F5F5F5' }}>In the bay</span>
      <StatusChip label="● Live view" color="green" dark={true} />
    </div>
    {[
      { bay:'Bay 1', vehicle:'Tesla Model S · White', status:'In Progress', color:'blue' },
      { bay:'Bay 2', vehicle:'Ford F-150 · Silver', status:'Ready', color:'green' },
      { bay:'Bay 3', vehicle:'Honda Civic · Black', status:'Waiting Pickup', color:'amber' },
      { bay:'Bay 4', vehicle:'—', status:'Empty', color:'gray' },
    ].map((b,i,arr)=>(
      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<arr.length-1?'1px solid rgba(255,255,255,0.06)':'none' }}>
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:11, color:'#6A9BAA', width:40, flexShrink:0 }}>{b.bay}</span>
        <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#A3C4CF', flex:1 }}>{b.vehicle}</span>
        <StatusChip label={b.status} color={b.color} dark={true} />
      </div>
    ))}
  </div>
);

const FoamProductFeature = () => {
  const [panel, setPanel] = React.useState('mobile');
  const [visible, setVisible] = React.useState(true);
  const switchPanel = (next) => {
    if (next === panel) return;
    setVisible(false);
    setTimeout(() => { setPanel(next); setVisible(true); }, 180);
  };

  return (
    <section id="for-shops" style={{ background: '#F4F4F5', padding: 'clamp(72px,8vw,100px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }} className="feature-grid">
        <AnimatedSection>
          <SectionLabel style={{ marginBottom: 20 }}>The Platform</SectionLabel>
          <h2 style={{
            fontFamily: "'Playfair Display',Georgia,serif",
            fontWeight: 800, fontSize: 'clamp(28px,3vw,44px)',
            color: '#0F2F3C', margin: '0 0 20px', letterSpacing: '-0.8px', lineHeight: 1.15,
          }}>Van or bay.<br />FOAM handles both.</h2>
          <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 16, color: '#525252', lineHeight: 1.7, margin: '0 0 28px' }}>
            Most tools are built for one or the other. FOAM was built by someone who ran both simultaneously — a mobile van and three physical shops in Atlanta. Mobile routes, bay boards, drop-offs, walk-ins, crew assignments, and customer history. All in one platform.
          </p>
          <div style={{ background: '#fff', border: '1px solid #E4E4E7', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 14, color: '#0A0A0A', marginBottom: 6 }}>
              Built from firsthand experience — not assumptions.
            </div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#525252', lineHeight: 1.5 }}>
              The founder ran Foam Auto Spa: a mobile van and three physical shops in Atlanta simultaneously.
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={150}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', background: '#E4E4E7', borderRadius: 9999, padding: 3, gap: 3 }}>
              {['mobile','shop'].map(p => (
                <button key={p} onClick={() => switchPanel(p)} style={{
                  padding: '7px 22px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter,sans-serif', fontSize: 13, fontWeight: 600,
                  background: panel === p ? 'var(--accent,#339DC7)' : 'transparent',
                  color: panel === p ? '#fff' : '#525252',
                  transition: 'all 200ms ease-out',
                }}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
              ))}
            </div>
          </div>
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(8px)',
            transition: 'opacity 200ms ease-out, transform 200ms ease-out',
          }}>
            {panel === 'mobile' ? <MobileJobsPanel /> : <ShopBayPanel />}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

Object.assign(window, { FoamAudienceRouter, FoamHowItWorks, FoamProductFeature });

// ── FOAM Remaining Pages: Pricing, About, Resources, Atlanta ──

const { useState } = React;

// ── /pricing ───────────────────────────────────────────────
const PricingPage = ({ navigate }) => {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter', monthly: 35, annual: 29, fee: '$10 per booking',
      cta: 'Start with Starter', popular: false,
      desc: 'Best for solo detailers getting started',
      features: {
        'Booking profile': true, 'Calendar and availability': true, 'Payments and tips': true,
        'Customer profiles': true, 'Reviews': true, 'Before and after photos': true,
        'Full CRM': false, 'Recurring appointments': false, 'Expense tracking': false,
        'Crew accounts': false, 'Job assignment': false, 'Commission rules': false,
        'Team performance dashboard': false,
      },
    },
    {
      name: 'Pro', monthly: 79, annual: 69, fee: '$8 per booking',
      cta: 'Go Pro', popular: true,
      desc: 'Best for established operators',
      features: {
        'Booking profile': true, 'Calendar and availability': true, 'Payments and tips': true,
        'Customer profiles': true, 'Reviews': true, 'Before and after photos': true,
        'Full CRM': true, 'Recurring appointments': true, 'Expense tracking': true,
        'Crew accounts': false, 'Job assignment': false, 'Commission rules': false,
        'Team performance dashboard': false,
      },
    },
    {
      name: 'Crew', monthly: 169, annual: 149, fee: '$6 per booking',
      cta: 'Run the Crew', popular: false,
      desc: 'Best for multi-tech teams',
      features: {
        'Booking profile': true, 'Calendar and availability': true, 'Payments and tips': true,
        'Customer profiles': true, 'Reviews': true, 'Before and after photos': true,
        'Full CRM': true, 'Recurring appointments': true, 'Expense tracking': true,
        'Crew accounts': true, 'Job assignment': true, 'Commission rules': true,
        'Team performance dashboard': true,
      },
    },
  ];

  const featureRows = [
    'Booking profile', 'Calendar and availability', 'Payments and tips', 'Customer profiles',
    'Reviews', 'Before and after photos', 'Full CRM', 'Recurring appointments',
    'Expense tracking', 'Crew accounts', 'Job assignment', 'Commission rules', 'Team performance dashboard',
  ];

  const faqItems = [
    { question: 'Why is there a monthly subscription and a booking fee?', answer: 'The subscription covers your access to all platform tools — profile, calendar, CRM, payments, crew, everything. The per-booking fee is how FOAM earns when you earn. Higher-tier plans have lower per-booking fees because they contribute more volume.' },
    { question: 'Can I cancel anytime?', answer: 'Yes. No contracts. Cancel anytime from the app. If you cancel an annual plan, you keep access through the end of the billing period.' },
    { question: 'What happens if I bring my own customers?', answer: 'Nothing changes. You still pay the subscription fee. The per-booking fee applies to every booking processed through FOAM — including rebookings from customers you brought over. You keep the revenue from bookings handled outside the platform entirely.' },
    { question: 'Do I need Stripe?', answer: 'Yes. FOAM payments run through Stripe. You\'ll need to connect a Stripe account to receive payouts. FOAM walks you through the setup — it takes about five minutes.' },
    { question: 'Is there a free trial?', answer: 'Founding operators get 3 months free on Pro. Outside of the founding operator program, there is no free trial currently — but there is no setup fee and you can cancel after your first month.' },
    { question: 'What is a Founding Operator?', answer: 'Founding operators are the first wave of FOAM operators who join before public launch. They get 3 months free on Pro, a permanent Founding Operator badge on their profile, zero platform booking fees for the first 60 days, and a direct channel to the product team.' },
  ];

  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(64px,8vw,112px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <SectionLabel>Pricing</SectionLabel>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1 }}>Pricing built for real detailing businesses.</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 'clamp(15px,1.5vw,18px)', color: T.textSec, lineHeight: 1.7, marginBottom: 36 }}>Start solo. Go pro. Add crew when the business demands it.</p>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', background: T.bgSec, borderRadius: 9999, padding: 4, border: `1px solid ${T.border}` }}>
            {[{ k: true, l: 'Annual', badge: 'Save 17%' }, { k: false, l: 'Monthly' }].map(t => (
              <button key={String(t.k)} onClick={() => setAnnual(t.k)} style={{
                padding: '9px 24px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, transition: 'all 200ms ease-out',
                background: annual === t.k ? T.blue : 'transparent',
                color: annual === t.k ? '#fff' : T.textSec,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {t.l}
                {t.badge && annual === t.k && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 9999, padding: '1px 6px' }}>{t.badge}</span>}
                {t.badge && annual !== t.k && <span style={{ fontSize: 10, background: T.blueSubtle, color: T.blue, borderRadius: 9999, padding: '1px 6px' }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <Section background={T.bg}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
            {plans.map((p, i) => (
              <ScrollReveal key={p.name} delay={i * 0.1}>
                <div style={{
                  background: '#fff', border: `2px solid ${p.popular ? T.blue : T.border}`,
                  borderRadius: 20, padding: 32, position: 'relative',
                  boxShadow: p.popular ? `0 8px 24px rgba(51,157,199,0.15)` : '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                  {p.popular && (
                    <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: T.blue, color: '#fff', fontSize: 11, fontFamily: T.fontBody, fontWeight: 700, padding: '4px 16px', borderRadius: 9999, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Most Popular</div>
                  )}
                  <h3 style={{ fontFamily: T.fontBody, fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>{p.name}</h3>
                  <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec, marginBottom: 16 }}>{p.desc}</p>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontFamily: T.fontDisplay, fontSize: 48, fontWeight: 800, color: p.popular ? T.blue : T.text }}>${annual ? p.annual : p.monthly}</span>
                    <span style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSec }}>/mo</span>
                  </div>
                  <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textSec, marginBottom: 24, padding: '8px 12px', background: T.bgSec, borderRadius: 8 }}>Platform fee: {p.fee}</div>
                  <Button size="md" variant={p.popular ? 'primary' : 'secondary'} style={{ width: '100%', justifyContent: 'center' }}>{p.cta}</Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Comparison table */}
      <Section background="#fff">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ScrollReveal><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: T.text, marginBottom: 32, letterSpacing: '-0.5px' }}>Compare plans</h2></ScrollReveal>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontBody }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: 13, color: T.textSec, borderBottom: `2px solid ${T.border}`, width: '40%' }}>Feature</th>
                  {plans.map(p => (
                    <th key={p.name} style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, fontSize: 14, color: p.popular ? T.blue : T.text, borderBottom: `2px solid ${p.popular ? T.blue : T.border}` }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((row, ri) => (
                  <tr key={row} style={{ background: ri % 2 === 0 ? '#fff' : T.bgSec }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.text, fontWeight: 500, borderBottom: `1px solid ${T.border}` }}>{row}</td>
                    {plans.map(p => (
                      <td key={p.name} style={{ textAlign: 'center', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                        {p.features[row]
                          ? <div style={{ display: 'flex', justifyContent: 'center' }}><div style={{ width: 22, height: 22, borderRadius: '50%', background: T.blueSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={12} color={T.blue} /></div></div>
                          : <Icon name="minus" size={16} color={T.border} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section background={T.bgSec}>
        <FAQ items={faqItems} />
      </Section>
    </div>
  );
};

// ── /about ─────────────────────────────────────────────────
const AboutPage = ({ navigate }) => (
  <div style={{ paddingTop: 68 }}>
    {/* Hero */}
    <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(64px,8vw,112px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <SectionLabel>About</SectionLabel>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: T.text, letterSpacing: '-1px', lineHeight: 1.1 }}>The work deserved better tools.</h1>
      </div>
    </section>

    {/* Origin */}
    <Section background="#fff">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <ScrollReveal>
          <SectionLabel>Origin</SectionLabel>
          <p style={{ fontFamily: T.fontBody, fontSize: 'clamp(16px,1.8vw,20px)', color: T.text, lineHeight: 1.85, fontWeight: 400 }}>
            Every detailer I have ever met is brilliant at the work and exhausted by everything around it. FOAM exists because the founder ran Foam Auto Spa — a mobile van and three physical shops in Atlanta — and could not find a single tool that worked for either. So he built the one he needed.
          </p>
        </ScrollReveal>
      </div>
    </Section>

    {/* Mission */}
    <Section background={T.bgSec}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <ScrollReveal>
          <SectionLabel>Mission</SectionLabel>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(28px,4.5vw,56px)', fontWeight: 800, color: T.text, lineHeight: 1.1, letterSpacing: '-1px' }}>
            We are building the{' '}
            <span style={{ color: T.blue, textDecoration: 'underline', textDecorationColor: T.blue, textUnderlineOffset: 6, textDecorationThickness: 3 }}>infrastructure layer</span>
            {' '}for auto detailing.
          </h2>
        </ScrollReveal>
      </div>
    </Section>

    {/* Why Atlanta */}
    <Section background="#fff">
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <ScrollReveal>
          <SectionLabel>Home Base</SectionLabel>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 20, letterSpacing: '-0.5px' }}>Why Atlanta first.</h2>
          <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, lineHeight: 1.8, marginBottom: 16 }}>Atlanta is where FOAM started — a mobile van, three shops, and years of learning what the industry actually needs. It's a market with serious detailing culture, a growing car-enthusiast base, and operators who are ready for something better.</p>
          <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, lineHeight: 1.8 }}>Atlanta is the proving ground. The platform we build here will travel to every city where operators do serious work.</p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Launch market', value: 'Atlanta, GA' },
              { label: 'Founded', value: '2025' },
              { label: 'Business model', value: 'Mobile van + 3 shops' },
              { label: 'First operator cohort', value: 'Founding Operators' },
            ].map(stat => (
              <div key={stat.label} style={{ background: T.bgSec, borderRadius: 12, padding: '16px 20px', border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec }}>{stat.label}</span>
                <span style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 700, color: T.text }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
      <style>{`@media(max-width:768px){ div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </Section>

    {/* Founder credibility */}
    <section style={{ background: T.dark, padding: 'clamp(64px,8vw,96px) clamp(20px,6vw,80px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <ScrollReveal>
          <SectionLabel>Founder</SectionLabel>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: '#fff', marginBottom: 20, letterSpacing: '-0.5px' }}>Operator experience, from the ground up.</h2>
          <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.tint, lineHeight: 1.8, marginBottom: 12, opacity: 0.9 }}>Mobile detailing. Fixed shop operations. Hybrid logistics across multiple locations. FOAM's founder has run all three, which is why the platform handles all three.</p>
          <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.tint, lineHeight: 1.8, opacity: 0.9 }}>The goal was never to build software. The goal was to fix the infrastructure problem that costs operators hours every week and drives customers away.</p>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <ImagePlaceholder label="Founder photography — van, shop bay, detailing tools" height={360} style={{ background: '#164558', border: '1px solid #1E5D72', borderRadius: 20 }} />
        </ScrollReveal>
      </div>
      <style>{`@media(max-width:768px){ section > div { grid-template-columns: 1fr !important; } }`}</style>
    </section>

    {/* CTA */}
    <Section background={T.tint}>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <ScrollReveal>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 16 }}>Join the Atlanta launch.</h2>
          <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, marginBottom: 28, lineHeight: 1.7 }}>Be part of the first wave. Help shape the platform before it goes everywhere.</p>
          <Button size="lg" onClick={() => navigate('detailers')}>Apply as a Founding Operator</Button>
        </ScrollReveal>
      </div>
    </Section>
  </div>
);

// ── /resources ─────────────────────────────────────────────
const ResourcesPage = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const categories = ['All', 'Customer Guides', 'Mobile Detailer Playbook', 'Shop Operator Handbook', 'FOAM Updates'];

  const articles = [
    { cat: 'Customer Guides', title: 'How much does a full car detail cost?', summary: 'A clear breakdown of what drives detailing prices — vehicle size, service type, and operator experience. Know what fair looks like before you book.', time: '5 min read' },
    { cat: 'Mobile Detailer Playbook', title: 'How to price mobile detailing services', summary: 'Most operators underprice and overcorrect. Here\'s a framework built around real market data from Atlanta operators.', time: '6 min read' },
    { cat: 'Mobile Detailer Playbook', title: 'How to stop losing bookings in Instagram DMs', summary: 'Every booking that lives in a DM is one you can lose. Here\'s how operators are moving customers to a real booking system without losing them in the process.', time: '4 min read' },
    { cat: 'Shop Operator Handbook', title: 'How to fill detailing bays', summary: 'Empty bays are dead inventory. Learn how top shops turn downtime into booked slots without touching their rates.', time: '5 min read' },
    { cat: 'Customer Guides', title: 'How to choose a trusted mobile detailer', summary: 'Reviews, photos, and credentials tell you most of what you need. Here\'s what to look for — and what to ignore.', time: '3 min read' },
    { cat: 'Customer Guides', title: 'Mobile detailing vs. shop detailing: what customers actually want', summary: 'The choice isn\'t just about convenience. We break down what customers really care about when choosing where to book.', time: '4 min read' },
  ];

  const filtered = activeFilter === 'All' ? articles : articles.filter(a => a.cat === activeFilter);

  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(64px,8vw,112px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <SectionLabel>Resources</SectionLabel>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1 }}>The playbook for cleaner cars and cleaner businesses.</h1>
        </div>
      </section>

      {/* Filter */}
      <Section background={T.bg}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveFilter(cat)} style={{
                  padding: '7px 18px', borderRadius: 9999, border: `1px solid ${activeFilter === cat ? T.blue : T.border}`,
                  background: activeFilter === cat ? T.blueSubtle : '#fff',
                  color: activeFilter === cat ? T.blue : T.textSec,
                  fontFamily: T.fontBody, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                }}>{cat}</button>
              ))}
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {filtered.map((a, i) => (
              <ScrollReveal key={a.title} delay={i * 0.08}>
                <Card style={{ cursor: 'pointer', height: '100%' }}>
                  <Chip style={{ marginBottom: 14 }}>{a.cat}</Chip>
                  <h3 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 10, lineHeight: 1.3 }}>{a.title}</h3>
                  <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec, lineHeight: 1.7, marginBottom: 20, flexGrow: 1 }}>{a.summary}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textTer }}>{a.time}</span>
                    <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: T.blue, display: 'flex', alignItems: 'center', gap: 4 }}>Read <Icon name="arrow-right" size={13} color={T.blue} /></span>
                  </div>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
};

// ── /detailing/atlanta ─────────────────────────────────────
const AtlantaPage = ({ navigate }) => {
  const [activeService, setActiveService] = useState('Mobile detailing');
  const services = ['Mobile detailing', 'Drop-off shops', 'Interior detail', 'Full detail', 'Ceramic coating'];
  const neighborhoods = ['Buckhead', 'Midtown', 'Decatur', 'Sandy Springs', 'Smyrna'];

  const operators = [
    { name: 'Elite Mobile Detail', rating: '4.9', reviews: 142, type: 'Mobile', price: 'From $120', avail: 'Available Today' },
    { name: 'Clean Cuts ATL', rating: '4.8', reviews: 89, type: 'Shop', price: 'From $90', avail: 'Next: Tomorrow' },
    { name: 'ATL Auto Spa', rating: '5.0', reviews: 31, type: 'Mobile', price: 'From $150', avail: 'Available Today' },
  ];

  return (
    <div style={{ paddingTop: 68 }}>
      {/* JSON-LD LocalBusiness */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "LocalBusiness",
        "name": "FOAM Auto Detailing", "serviceType": "Auto Detailing / Mobile Auto Detailing", "areaServed": "Atlanta, GA"
      })}} />
      {/* JSON-LD Breadcrumb */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://foamauto.com" },
          { "@type": "ListItem", "position": 2, "name": "Detailing", "item": "https://foamauto.com/detailing" },
          { "@type": "ListItem", "position": 3, "name": "Atlanta", "item": "https://foamauto.com/detailing/atlanta" },
        ]
      })}} />

      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(64px,8vw,112px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24, fontFamily: T.fontBody, fontSize: 13, color: T.textSec }}>
            <span style={{ cursor: 'pointer', color: T.blue }} onClick={() => navigate('home')}>Home</span>
            <Icon name="chevron-right" size={14} color={T.textTer} />
            <span>Detailing</span>
            <Icon name="chevron-right" size={14} color={T.textTer} />
            <span style={{ fontWeight: 600, color: T.text }}>Atlanta</span>
          </div>
          <SectionLabel>Atlanta, GA</SectionLabel>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1 }}>Book trusted car detailing in Atlanta.</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 'clamp(15px,1.5vw,18px)', color: T.textSec, lineHeight: 1.7, marginBottom: 36 }}>Mobile detailers and local shops across Atlanta, all bookable through FOAM.</p>
        </div>
      </section>

      {/* Service filter */}
      <Section background={T.bg}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 48 }}>
              {services.map(s => (
                <button key={s} onClick={() => setActiveService(s)} style={{
                  padding: '8px 20px', borderRadius: 9999,
                  border: `1px solid ${activeService === s ? T.blue : T.border}`,
                  background: activeService === s ? T.blueSubtle : '#fff',
                  color: activeService === s ? T.blue : T.textSec,
                  fontFamily: T.fontBody, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms',
                }}>{s}</button>
              ))}
            </div>
          </ScrollReveal>

          {/* Neighborhoods */}
          <ScrollReveal>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: T.text, marginBottom: 24, letterSpacing: '-0.5px' }}>Browse by neighborhood</h2>
          </ScrollReveal>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 56 }}>
            {neighborhoods.map((n, i) => (
              <ScrollReveal key={n} delay={i * 0.06}>
                <div style={{
                  background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12,
                  padding: '16px 24px', cursor: 'pointer', transition: 'all 200ms ease-out',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="map-pin" size={14} color={T.blue} />
                    <span style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, color: T.text }}>{n}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Operator cards */}
          <ScrollReveal>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(22px,3vw,36px)', fontWeight: 700, color: T.text, marginBottom: 24, letterSpacing: '-0.5px' }}>Operators in Atlanta</h2>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {operators.map((op, i) => (
              <ScrollReveal key={op.name} delay={i * 0.1}>
                <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <ImagePlaceholder label={`${op.name} — portfolio photos`} height={130} style={{ borderRadius: 0, border: 'none', borderBottom: `1px solid ${T.border}` }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <h3 style={{ fontFamily: T.fontBody, fontSize: 15, fontWeight: 700, color: T.text }}>{op.name}</h3>
                      <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: T.blue, background: T.blueSubtle, padding: '3px 8px', borderRadius: 9999 }}>{op.avail}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Stars count={5} />
                      <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textSec }}>{op.rating} · {op.reviews} reviews · {op.type}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: T.text }}>{op.price}</span>
                      <Button size="sm">View Profile</Button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Customer CTA */}
      <Section background={T.tint}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 16 }}>Find a detailer in Atlanta.</h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, marginBottom: 28, lineHeight: 1.7 }}>Mobile or shop. Today or this week. FOAM connects you to the best detailers in the city.</p>
            <Button size="lg">Find a Detailer</Button>
          </ScrollReveal>
        </div>
      </Section>

      {/* Operator CTA */}
      <section style={{ background: T.dark, padding: 'clamp(64px,8vw,96px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <ScrollReveal>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Run a detailing business in Atlanta?</h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.tint, lineHeight: 1.7, marginBottom: 28, opacity: 0.9 }}>Join as an Atlanta founding operator and get in before public launch.</p>
            <Button variant="secondary" size="lg" style={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }} onClick={() => navigate('detailers')}>Join as an Atlanta Operator</Button>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

Object.assign(window, { PricingPage, AboutPage, ResourcesPage, AtlantaPage });

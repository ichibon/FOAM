// ── FOAM Sub-pages: Customers, Detailers, Shops ───────────

const { useState, useEffect } = React;

// ── /for-customers ─────────────────────────────────────────
const CustomersPage = ({ navigate }) => {
  const faqItems = [
    { question: 'How does FOAM work?', answer: 'FOAM connects you with verified mobile detailers and local shops near you. Search your area, compare profiles and real customer reviews, choose your service and time, then pay securely in the app. Your car gets detailed — you barely have to think about it.' },
    { question: 'Can I book a mobile detailer?', answer: 'Yes. Mobile detailers come directly to your home, office, or wherever your car is parked. Just enter your location and filter for mobile service.' },
    { question: 'Can I book a detailing shop?', answer: 'Yes. FOAM includes fixed-location shops for drop-off detailing. You can compare shops nearby, see their service menus, and book a drop-off appointment directly in the app.' },
    { question: 'Are FOAM detailers reviewed?', answer: 'Every detailer on FOAM has a verified profile with real customer reviews, star ratings, and before-and-after photos from actual jobs. No fake reviews, no padding.' },
    { question: 'How much does detailing cost?', answer: 'Prices vary by detailer, service type, and vehicle size. You can browse service menus and pricing directly on each operator\'s profile before you book. No surprises.' },
    { question: 'What happens after I book?', answer: 'You\'ll get a confirmation with your detailer\'s info and appointment details. You can message them directly in the app, track their arrival for mobile bookings, and pay when the job is complete. Rebooking is two taps.' },
  ];

  const trustSignals = [
    { icon: 'shield', title: 'Verified operators', body: 'Every detailer is reviewed and approved before going live on FOAM.' },
    { icon: 'star', title: 'Real reviews', body: 'Ratings from real customers who actually booked through the platform.' },
    { icon: 'camera', title: 'Before and after photos', body: 'See the actual work before you commit to a detailer.' },
    { icon: 'credit-card', title: 'Secure payment', body: 'Pay in-app. No cash, no awkward Venmo requests.' },
  ];

  const steps = ['Search nearby', 'Choose mobile or drop-off', 'Book', 'Pay', 'Rebook'];

  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(64px,8vw,112px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionLabel>For Customers</SectionLabel>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1 }}>The best detailers near you, bookable in two minutes.</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 'clamp(15px,1.5vw,18px)', color: T.textSec, lineHeight: 1.7, marginBottom: 36 }}>Find trusted mobile detailers and local shops, compare real work, choose your time, and pay in the app.</p>
          <Button size="lg" onClick={() => navigate('detailers')}>Book a Detail</Button>
        </div>
      </section>

      {/* Trust signals */}
      <Section background={T.bg}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal><SectionLabel>Why FOAM</SectionLabel><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: T.text, marginBottom: 40, letterSpacing: '-0.5px' }}>You deserve to know who's touching your car.</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
            {trustSignals.map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 0.1}>
                <Card glowOnHover={false} style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: T.blueSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon name={s.icon} size={22} color={T.blue} />
                  </div>
                  <h3 style={{ fontFamily: T.fontBody, fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{s.body}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Mobile or drop-off */}
      <Section background={T.bgSec}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 32, letterSpacing: '-0.5px' }}>Choose how it works for you.</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {[
              { icon: 'navigation', title: 'Come to me', sub: 'Mobile detailer', body: 'A certified mobile detailer comes to your home, office, or wherever your car lives. You don\'t move. They do.', cta: 'Find mobile detailers' },
              { icon: 'grid', title: 'Drop off nearby', sub: 'Local shop', body: 'Drop your car at a trusted local detailing shop. Pick it up when it\'s ready. Some shops offer ready notifications in-app.', cta: 'Find nearby shops' },
            ].map((c, i) => (
              <ScrollReveal key={c.title} delay={i * 0.1}>
                <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: 32 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: T.blueSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon name={c.icon} size={26} color={T.blue} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <h3 style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 700, color: T.text }}>{c.title}</h3>
                    <Chip>{c.sub}</Chip>
                  </div>
                  <p style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSec, lineHeight: 1.7, marginBottom: 20 }}>{c.body}</p>
                  <span style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, color: T.blue, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>{c.cta} <Icon name="arrow-right" size={14} color={T.blue} /></span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Booking flow */}
      <Section background="#fff">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 40, letterSpacing: '-0.5px' }}>How booking works.</h2></ScrollReveal>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
            {steps.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{ textAlign: 'center', minWidth: 120 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: 15, fontWeight: 700, color: '#fff' }}>{i + 1}</span>
                  </div>
                  <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: T.text }}>{step}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width: 40, height: 2, background: T.border, flexShrink: 0, marginBottom: 28 }} />}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Operator profile preview */}
      <Section background={T.bgSec}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <ScrollReveal><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 32 }}>See the work before you book.</h2></ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: T.fontBody, fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>Elite Mobile Detail</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stars count={5} />
                      <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec }}>4.9 · 142 reviews · Mobile</span>
                    </div>
                  </div>
                  <Chip>Available Today</Chip>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {['Interior Detail · $120','Full Detail · $220','Ceramic Coat · $450'].map(s => (
                    <span key={s} style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textSec, background: T.bgSec, padding: '4px 10px', borderRadius: 9999, border: `1px solid ${T.border}` }}>{s}</span>
                  ))}
                </div>
              </div>
              <ImagePlaceholder label="Before and after photos — real customer work" height={180} style={{ borderRadius: 0, border: 'none', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }} />
              <div style={{ padding: 24 }}>
                <Button size="md">Book Elite Mobile Detail</Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Section>

      {/* Rain Coverage teaser */}
      <Section background={T.tint}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(51,157,199,0.15)', borderRadius: 9999, padding: '4px 14px', marginBottom: 20 }}>
              <Icon name="cloud-rain" size={14} color={T.blue} />
              <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: T.blue, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Coming Soon</span>
            </div>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 16 }}>Rain after your detail? FOAM has plans for that.</h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, lineHeight: 1.7 }}>Rain Coverage is a membership that gives you a free wash whenever rain hits within 48 hours of your detail. Because your car deserves better than bad timing.</p>
          </ScrollReveal>
        </div>
      </Section>

      {/* FAQ */}
      <Section background="#fff">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <FAQ items={faqItems} />
        </div>
      </Section>
    </div>
  );
};

// ── /for-detailers ─────────────────────────────────────────
const DetailersPage = ({ navigate }) => {
  const faqItems = [
    { question: 'How much does FOAM cost?', answer: 'Plans start at $29/month for Starter, $69/month for Pro, and $149/month for Crew (all annual pricing). Each plan also includes a per-booking platform fee: $10, $8, or $6 respectively. See the full pricing page for details.' },
    { question: 'Is FOAM only for mobile detailers?', answer: 'No. FOAM works for mobile operators, fixed shops, and hybrid operators who do both. The platform is built to handle all three models from a single account.' },
    { question: 'Can I use FOAM if I am solo?', answer: 'Yes. The Starter plan is built for solo operators. You get a full booking profile, calendar management, payment processing, and customer profiles — everything you need to run your business properly.' },
    { question: 'Does FOAM collect payments?', answer: 'Yes. Payments run through Stripe. Customers pay in the app, and your payout hits automatically. You\'ll need a Stripe account, which FOAM helps you set up.' },
    { question: 'Can customers book me directly?', answer: 'Yes. Once your profile is live, customers can find you through search and book directly. You can also share your FOAM profile link to bring your existing customer base onto the platform.' },
    { question: 'Can I bring my existing customers?', answer: 'Absolutely. You can import your customer list and invite them to book through your FOAM profile. Your existing relationships don\'t disappear — they get better infrastructure.' },
  ];

  const painCards = [
    { icon: 'message-circle', text: 'Instagram DMs are not a booking system' },
    { icon: 'dollar-sign', text: 'Venmo is not payment infrastructure' },
    { icon: 'list', text: 'Notes app is not a CRM' },
    { icon: 'users', text: 'Group texts are not crew management' },
  ];

  const features = [
    { icon: 'user', name: 'Booking profile', desc: 'A professional profile with services, pricing, reviews, and photos.' },
    { icon: 'calendar', name: 'Calendar and availability', desc: 'One calendar. Block time, set availability, and take bookings automatically.' },
    { icon: 'credit-card', name: 'Payments and tips', desc: 'In-app payments powered by Stripe. Tips included. No chasing.' },
    { icon: 'users', name: 'Customer profiles', desc: 'Full history on every customer. Vehicle details, past jobs, notes.' },
    { icon: 'camera', name: 'Before and after photos', desc: 'Attach photos to every job. Build your portfolio as you work.' },
    { icon: 'star', name: 'Reviews', desc: 'Automatic review requests after each job. Your reputation builds itself.' },
    { icon: 'flag', name: 'Crew tools', desc: 'Assign jobs, manage crew members, and set commission rules.' },
    { icon: 'navigation', name: 'Route management', desc: 'Optimized routes with drive-time buffers between mobile jobs.' },
  ];

  const plans = [
    { name: 'Starter', price: '$29', sub: 'solo operators', cta: 'Start with Starter', page: 'pricing' },
    { name: 'Pro', price: '$69', sub: 'established operators', cta: 'Go Pro', page: 'pricing', popular: true },
    { name: 'Crew', price: '$149', sub: 'multi-tech teams', cta: 'Run the Crew', page: 'pricing' },
  ];

  return (
    <div style={{ paddingTop: 68 }}>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "FOAM", "applicationCategory": "BusinessApplication", "operatingSystem": "iOS, Android", "description": "The operating system for auto detailing operators.", "offers": { "@type": "Offer", "price": "29.00", "priceCurrency": "USD" } }) }} />

      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(64px,8vw,112px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionLabel>For Mobile Detailers</SectionLabel>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1 }}>Stop running your business like a side hustle.</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 'clamp(15px,1.5vw,18px)', color: T.textSec, lineHeight: 1.7, marginBottom: 36 }}>FOAM gives mobile detailers the back office they never had: bookings, payments, customer history, routes, reviews, and crew tools in one app.</p>
          <Button size="lg">Become a Founding Operator</Button>
        </div>
      </section>

      {/* Pain cards */}
      <Section background={T.bgSec}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 40, letterSpacing: '-0.5px' }}>You've been running your business on the wrong tools.</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {painCards.map((p, i) => (
              <ScrollReveal key={p.text} delay={i * 0.1}>
                <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon name={p.icon} size={20} color="#DC2626" />
                  </div>
                  <p style={{ fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{p.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Feature grid */}
      <Section background="#fff">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal><SectionLabel>Features</SectionLabel><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 40, letterSpacing: '-0.5px' }}>Everything your business needs. Nothing it doesn't.</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <ScrollReveal key={f.name} delay={i * 0.06}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: T.blueSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={f.icon} size={18} color={T.blue} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{f.name}</h4>
                    <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Operator success loop */}
      <Section background={T.bgSec}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <SectionLabel>The Loop</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {['Book.', 'Detail.', 'Get paid.', 'Get reviewed.', 'Rebook.'].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <span style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 800, color: i === 2 ? T.blue : T.text }}>{step}</span>
                  {i < arr.length - 1 && <Icon name="arrow-right" size={20} color={T.border} />}
                </React.Fragment>
              ))}
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, marginTop: 20, lineHeight: 1.7 }}>FOAM closes the loop. Every job feeds the next one.</p>
          </ScrollReveal>
        </div>
      </Section>

      {/* Pricing teaser */}
      <Section background="#fff">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ScrollReveal><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 12, letterSpacing: '-0.5px' }}>Simple pricing. No surprises.</h2>
          <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, marginBottom: 40 }}>Start solo. Go pro. Add crew when the business demands it.</p></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, marginBottom: 32 }}>
            {plans.map((p, i) => (
              <ScrollReveal key={p.name} delay={i * 0.1}>
                <div style={{ background: '#fff', border: `2px solid ${p.popular ? T.blue : T.border}`, borderRadius: 16, padding: 24, position: 'relative' }}>
                  {p.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: T.blue, color: '#fff', fontSize: 11, fontFamily: T.fontBody, fontWeight: 600, padding: '3px 12px', borderRadius: 9999 }}>Most Popular</div>}
                  <h3 style={{ fontFamily: T.fontBody, fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{p.name}</h3>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 800, color: p.popular ? T.blue : T.text, marginBottom: 4 }}>{p.price}<span style={{ fontSize: 14, fontWeight: 400, color: T.textSec }}>/mo</span></div>
                  <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textSec, marginBottom: 16 }}>Best for {p.sub}</p>
                  <Button size="sm" variant={p.popular ? 'primary' : 'secondary'} onClick={() => navigate('pricing')}>{p.cta}</Button>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Button variant="ghost" onClick={() => navigate('pricing')}>See full pricing <Icon name="arrow-right" size={14} color={T.blue} /></Button>
          </div>
        </div>
      </Section>

      {/* Founder credibility */}
      <section style={{ background: T.dark, padding: 'clamp(48px,6vw,80px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <ScrollReveal>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Built by someone who chased the same payments.</h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.tint, lineHeight: 1.7, opacity: 0.9 }}>FOAM's founder ran a mobile van and three Atlanta shops. Every feature in FOAM was built because it was missing from tools we actually tried to use.</p>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <Section background="#fff">
        <FAQ items={faqItems} />
      </Section>
    </div>
  );
};

// ── /for-shops ─────────────────────────────────────────────
const ShopsPage = ({ navigate }) => {
  const faqItems = [
    { question: 'How does bay management work?', answer: 'Each bay in your shop is tracked in real-time on a shared board. You can update bay status — Empty, In Progress, Ready, Waiting for Pickup — from the app. Any team member with access can see the current state across all bays.' },
    { question: 'Can I manage walk-ins and drop-offs?', answer: 'Yes. FOAM handles both drop-off bookings (scheduled in advance) and walk-in toggles (opened or closed based on current capacity). You control availability in real-time from the app.' },
    { question: 'Does FOAM work for hybrid operators?', answer: 'Yes. If you run a shop and also take mobile jobs, FOAM sees both from one account. Route jobs and bay jobs are tracked separately but managed from the same dashboard.' },
    { question: 'How do customers find my shop?', answer: 'Your shop gets a verified profile on FOAM with your services, pricing, reviews, and photos. Customers searching for detailing in your city will find you. FOAM also builds local SEO through city-level pages that surface your shop.' },
    { question: 'Can I use FOAM for a multi-location shop?', answer: 'Multi-location support is on the roadmap. Founding operators who run multiple locations will be involved in shaping how that feature ships.' },
    { question: 'What happens when a car is ready?', answer: 'FOAM sends an automated ready notification to the customer when you update the bay status to Ready. They get a push notification and can confirm pickup directly in the app.' },
  ];

  const painCards = [
    { icon: 'grid', text: 'Empty bays are dead inventory' },
    { icon: 'zap', text: 'Walk-ins are hard to predict' },
    { icon: 'list', text: 'Whiteboards fall behind reality' },
    { icon: 'tool', text: 'Generic booking tools don\'t understand detailing' },
    { icon: 'repeat', text: 'Customers come once and disappear' },
  ];

  const features = [
    { icon: 'grid', name: 'Bay management', desc: 'Real-time bay status board. Every tech sees what\'s where.' },
    { icon: 'calendar', name: 'Drop-off booking', desc: 'Customers book drop-off slots directly. No phone tag.' },
    { icon: 'plus', name: 'Walk-in toggle', desc: 'Open or close to walk-ins in one tap based on current capacity.' },
    { icon: 'users', name: 'Customer profiles', desc: 'Full vehicle and service history on every customer.' },
    { icon: 'check-circle', name: 'Ready notifications', desc: 'Automatic customer alerts when their car is done.' },
    { icon: 'star', name: 'Reviews', desc: 'Post-job review requests build your reputation automatically.' },
  ];

  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(160deg, #fff 0%, ${T.tint} 100%)`, padding: 'clamp(64px,8vw,112px) clamp(20px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <SectionLabel>For Shops</SectionLabel>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, color: T.text, marginBottom: 20, letterSpacing: '-1px', lineHeight: 1.1 }}>Fill your bays. Keep your customers coming back.</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 'clamp(15px,1.5vw,18px)', color: T.textSec, lineHeight: 1.7, marginBottom: 36 }}>FOAM helps detailing shops manage drop-offs, walk-ins, bay capacity, payments, customer history, and reviews from one place.</p>
          <Button size="lg">Run Your Shop on FOAM</Button>
        </div>
      </section>

      {/* Pain cards */}
      <Section background={T.bgSec}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 40, letterSpacing: '-0.5px' }}>The tools shops use weren't built for this work.</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
            {painCards.map((p, i) => (
              <ScrollReveal key={p.text} delay={i * 0.08}>
                <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name={p.icon} size={18} color="#DC2626" />
                  </div>
                  <p style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{p.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Feature grid */}
      <Section background="#fff">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <ScrollReveal><SectionLabel>Features</SectionLabel><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 40, letterSpacing: '-0.5px' }}>Built for how shops actually run.</h2></ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <ScrollReveal key={f.name} delay={i * 0.08}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={f.icon} size={20} color={T.blue} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: T.fontBody, fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{f.name}</h4>
                    <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Bay board preview */}
      <Section background={T.bgSec}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ScrollReveal><SectionLabel>Bay Board</SectionLabel><h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 32, letterSpacing: '-0.5px' }}>Your whole shop. One screen.</h2></ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
                {[
                  { bay: 'Bay 1', car: '2021 BMW M4', status: 'In Progress', color: T.blue },
                  { bay: 'Bay 2', car: '2019 Tahoe', status: 'Ready', color: T.success },
                  { bay: 'Bay 3', car: '—', status: 'Empty', color: T.textTer },
                  { bay: 'Bay 4', car: '2023 Tesla S', status: 'Waiting for Pickup', color: T.warning },
                ].map((b) => (
                  <div key={b.bay} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 700, color: T.text }}>{b.bay}</span>
                      <span style={{ fontSize: 11, fontFamily: T.fontBody, fontWeight: 600, color: b.color, background: `${b.color}18`, padding: '3px 8px', borderRadius: 9999 }}>{b.status}</span>
                    </div>
                    <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textSec }}>{b.car}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Section>

      {/* Hybrid callout */}
      <Section background={T.tint}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <ScrollReveal>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: T.text, marginBottom: 16 }}>Run a shop and mobile jobs? FOAM sees both.</h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, lineHeight: 1.7, marginBottom: 28 }}>Hybrid operators get a unified dashboard. Route jobs and bay jobs are tracked separately but managed from the same account. Switch views in a tap.</p>
            <Button size="md" onClick={() => navigate('detailers')}>Learn about hybrid operations</Button>
          </ScrollReveal>
        </div>
      </Section>

      {/* Local discovery */}
      <Section background="#fff">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <ScrollReveal>
            <SectionLabel>Discovery</SectionLabel>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: T.text, marginBottom: 16, letterSpacing: '-0.5px' }}>Your shop becomes easier to find.</h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 15, color: T.textSec, lineHeight: 1.8 }}>FOAM builds operator profiles, city-level search pages, and local SEO to make sure customers in your area can find you — not just the big chains. Your reputation travels farther.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Verified shop profile', 'City search placement', 'Local SEO via city hub pages', 'Customer discovery feed'].map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: T.bgSec, borderRadius: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="check" size={14} color="#fff" />
                  </div>
                  <span style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 500, color: T.text }}>{item}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
        <style>{`@media(max-width:768px){ div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; } }`}</style>
      </Section>

      {/* FAQ */}
      <Section background={T.bgSec}>
        <FAQ items={faqItems} />
      </Section>
    </div>
  );
};

Object.assign(window, { CustomersPage, DetailersPage, ShopsPage });

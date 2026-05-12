import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedSection, HoverCard, SectionLabel, PillBtn } from './shared.jsx';

/* ─── PRICING ─── */
const pricingTiers = [
  {
    id: 'starter', name: 'Starter',
    monthlyPrice: 35, annualPrice: 29,
    fee: '15%',
    tagline: 'Best for solo detailers getting started.',
    features: ['Booking profile','Calendar & availability','Payments & tips','Customer profiles','Reviews & ratings'],
    cta: 'Start with Starter', variant: 'secondary',
  },
  {
    id: 'pro', name: 'Pro',
    monthlyPrice: 79, annualPrice: 69,
    fee: '12%',
    tagline: 'Best for established operators.',
    features: ['Everything in Starter','Full CRM','Recurring appointments','Expense tracking','Revenue dashboard','Dynamic pricing'],
    cta: 'Go Pro', variant: 'primary', popular: true,
  },
  {
    id: 'crew', name: 'Crew',
    monthlyPrice: 169, annualPrice: 149,
    fee: '10%',
    tagline: 'Best for multi-tech operations.',
    features: ['Everything in Pro','Crew accounts','Job assignment','Commission rules','Team performance','GPS tracking (V2)'],
    cta: 'Run the Crew', variant: 'secondary',
  },
];

function PricingCard({ tier, annual }) {
  const [priceVis, setPriceVis] = useState(true);
  const prevAnnual = useRef(annual);
  useEffect(() => {
    if (prevAnnual.current !== annual) {
      setPriceVis(false);
      setTimeout(() => setPriceVis(true), 140);
      prevAnnual.current = annual;
    }
  }, [annual]);

  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  return (
    <HoverCard accent={tier.popular} style={{ display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {tier.popular && (
        <div style={{
          position:'absolute', top:18, right:18,
          background:'var(--accent,#339DC7)', color:'#fff',
          padding:'3px 12px', borderRadius:9999,
          fontSize:11, fontWeight:700, fontFamily:'Inter,sans-serif', letterSpacing:'0.3px',
        }}>Most Popular</div>
      )}
      <div style={{ padding:'32px 28px 28px' }}>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontWeight:800, fontSize:22, color:'#0F2F3C', marginBottom:6 }}>{tier.name}</div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#737373', marginBottom:24 }}>{tier.tagline}</div>
        <div style={{ marginBottom:6 }}>
          <span style={{
            fontFamily:"'Playfair Display',Georgia,serif",
            fontWeight:800, fontSize:48, color:'#0F2F3C',
            opacity: priceVis ? 1 : 0,
            transition:'opacity 150ms ease-out',
            display:'inline-block', letterSpacing:'-2px',
          }}>${price}</span>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:14, color:'#A3A3A3', marginLeft:4 }}>/mo</span>
        </div>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:12, color:'#737373', marginBottom:28 }}>
          Platform fee: <strong style={{ color:'#339DC7' }}>{tier.fee}</strong> per booking
        </div>
        <div style={{ marginBottom:28 }}>
          {tier.features.map((f,i)=>(
            <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent,#339DC7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#525252' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:'0 28px 28px', marginTop:'auto' }}>
        <PillBtn variant={tier.variant} style={{ width:'100%', justifyContent:'center' }}>{tier.cta}</PillBtn>
      </div>
    </HoverCard>
  );
}

export function FoamPricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <section id="pricing" style={{ background:'#FFFFFF', padding:'clamp(72px,8vw,100px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <AnimatedSection style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{
            fontFamily:"'Playfair Display',Georgia,serif",
            fontWeight:800, fontSize:'clamp(30px,3.2vw,48px)',
            color:'#0F2F3C', margin:'0 0 14px', letterSpacing:'-1px', lineHeight:1.1,
          }}>Pricing that makes sense.</h2>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:16, color:'#525252', margin:'0 0 32px' }}>
            Start solo. Go pro. Add crew when the business grows.
          </p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, background:'#F4F4F5', borderRadius:9999, padding:4 }}>
            {[['annual','Annual'],['monthly','Monthly']].map(([key,label])=>(
              <button key={key} onClick={()=>setAnnual(key==='annual')} style={{
                padding:'8px 22px', borderRadius:9999, border:'none', cursor:'pointer',
                fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600,
                background: (key==='annual')===annual ? 'var(--accent,#339DC7)' : 'transparent',
                color: (key==='annual')===annual ? '#fff' : '#525252',
                transition:'all 200ms ease-out',
              }}>{label}</button>
            ))}
            <span style={{ fontFamily:'Inter,sans-serif', fontSize:12, fontWeight:600, color:'#16A34A', paddingRight:12 }}>Save ~17%</span>
          </div>
        </AnimatedSection>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, alignItems:'stretch', marginBottom:32 }} className="pricing-grid">
          {pricingTiers.map((t,i)=>(
            <AnimatedSection key={t.id} delay={i*100} style={{ height:'100%' }}>
              <PricingCard tier={t} annual={annual} />
            </AnimatedSection>
          ))}
        </div>
        <p style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#A3A3A3', textAlign:'center', lineHeight:1.6, maxWidth:640, margin:'0 auto' }}>
          Platform fee replaces transaction-based pricing. FOAM absorbs Stripe's processing cost. You see one clean percentage — nothing hidden.
        </p>
      </div>
    </section>
  );
}

/* ─── FOUNDER STORY ─── */
export function FoamFounderStory() {
  return (
    <section style={{ background:'#0F2F3C', padding:'clamp(72px,8vw,100px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(40px,6vw,80px)', alignItems:'center' }} className="founder-grid">
        <AnimatedSection>
          <SectionLabel dark={true} style={{ marginBottom:20 }}>Why FOAM Exists</SectionLabel>
          <h2 style={{
            fontFamily:"'Playfair Display',Georgia,serif",
            fontWeight:800, fontSize:'clamp(28px,3vw,44px)',
            color:'#FFFFFF', margin:'0 0 24px', letterSpacing:'-0.8px', lineHeight:1.15,
          }}>Built by someone who ran the van and the bay.</h2>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:17, color:'#E1F0F7', lineHeight:1.7, margin:'0 0 32px' }}>
            Every detailer I've ever met is brilliant at the work and exhausted by everything around it. FOAM exists because the founder ran Foam Auto Spa — a mobile van and three physical shops in Atlanta — and couldn't find a single tool that worked for either. So he built the one he needed.
          </p>
          <PillBtn variant="outline-white">Read the story</PillBtn>
        </AnimatedSection>
        <AnimatedSection delay={150}>
          <div style={{
            background:'#164558', borderRadius:20, minHeight:360,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:40, border:'1px solid #1E5D72',
          }}>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#6A9BAA', textAlign:'center', lineHeight:1.8, letterSpacing:'0.3px' }}>
              Founder photography<br />Mobile van · Shop bay<br />Detailing tools · Atlanta
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ─── FOUNDING OPERATOR ─── */
const foundingCards = [
  { emoji:'🎁', title:'3 months free on Pro',          body:'Start with full Pro access at no cost for your first 90 days.' },
  { emoji:'🏅', title:'Founding Operator badge',        body:"Marked permanently as an original. It never goes away." },
  { emoji:'✦',  title:'Zero booking fees — 60 days',   body:'$0 platform fee per booking for your first two months.' },
  { emoji:'💬', title:'Direct line to the product team', body:'Your feedback shapes what gets built next.' },
];

export function FoamFoundingOperator({ show = true }) {
  if (!show) return null;
  return (
    <section style={{ background:'#E1F0F7', padding:'clamp(72px,8vw,100px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <AnimatedSection style={{ textAlign:'center', marginBottom:48 }}>
          <SectionLabel style={{ marginBottom:16 }}>Atlanta Founding Operators</SectionLabel>
          <h2 style={{
            fontFamily:"'Playfair Display',Georgia,serif",
            fontWeight:800, fontSize:'clamp(28px,3vw,44px)',
            color:'#0F2F3C', margin:'16px 0 14px', letterSpacing:'-0.8px', lineHeight:1.1,
          }}>Get in before the public launch.</h2>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:16, color:'#525252', margin:0, maxWidth:520, marginLeft:'auto', marginRight:'auto' }}>
            Join the first wave of FOAM operators in Atlanta. Lock in founding benefits before they're gone.
          </p>
        </AnimatedSection>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }} className="founding-grid">
          {foundingCards.map((c,i)=>(
            <AnimatedSection key={i} delay={i*100}>
              <div style={{
                background:'#fff', border:'1px solid #D8EAF3',
                borderRadius:14, padding:'24px 24px 24px 20px',
                display:'flex', gap:16, alignItems:'flex-start',
                borderLeft:'4px solid var(--accent,#339DC7)',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontSize:24 }}>{c.emoji}</span>
                <div>
                  <div style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:15, color:'#0F2F3C', marginBottom:6 }}>{c.title}</div>
                  <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#525252', lineHeight:1.55 }}>{c.body}</div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
export function FoamFinalCTA() {
  return (
    <section style={{ background:'#0F2F3C', position:'relative', overflow:'hidden' }}>
      <div style={{ height:4, background:'var(--accent,#339DC7)' }} />
      <div style={{ padding:'clamp(80px,10vw,120px) clamp(20px,5vw,64px)', textAlign:'center' }}>
        <AnimatedSection>
          <h2 style={{
            fontFamily:"'Playfair Display',Georgia,serif",
            fontWeight:800, fontSize:'clamp(36px,5vw,72px)',
            color:'#FFFFFF', margin:'0 0 24px', letterSpacing:'-2px', lineHeight:1.05,
          }}>The whiteboard days are over.</h2>
          <p style={{ fontFamily:'Inter,sans-serif', fontSize:'clamp(15px,1.5vw,18px)', color:'#E1F0F7', margin:'0 auto 40px', maxWidth:600, lineHeight:1.7 }}>
            Whether you run a van, a bay, or both — FOAM gives your detailing business the infrastructure it deserved from day one.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <PillBtn variant="primary" size="lg">Coming Soon</PillBtn>
            <a href="#pricing" style={{ textDecoration:'none' }}>
              <PillBtn variant="outline-white" size="lg">See Pricing</PillBtn>
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
const footerCols = {
  Product:   ['For Customers','For Detailers','For Shops','Pricing'],
  Company:   ['About','Blog','Contact','Press'],
  Resources: ['Mobile Detailing Guide','Shop Operator Guide','Atlanta Detailing','FAQs'],
};

const legalLinks = [
  { label: 'Privacy Policy',      to: '/privacy' },
  { label: 'Terms of Service',    to: '/terms' },
  { label: 'Operator Agreement',  to: '/operator-agreement' },
];

const linkStyle = {
  display:'block', fontFamily:'Inter,sans-serif', fontSize:13, color:'#525252',
  textDecoration:'none', marginBottom:10, transition:'color 150ms',
};

export function FoamFooter() {
  return (
    <footer style={{ background:'#FFFFFF', borderTop:'1px solid #E4E4E7', padding:'60px clamp(20px,5vw,64px) 32px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr repeat(4,1fr)', gap:40, marginBottom:48 }} className="footer-grid">
          <div>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontWeight:800, fontSize:22, color:'var(--accent,#339DC7)', marginBottom:8 }}>FOAM</div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#A3A3A3' }}>Your business. Your car. Clean.</div>
          </div>
          {Object.entries(footerCols).map(([col, links]) => (
            <div key={col}>
              <div style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:12, color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:16, textTransform:'uppercase' }}>{col}</div>
              {links.map(l => (
                <a key={l} href="#" style={linkStyle}
                  onMouseEnter={e=>e.target.style.color='#0A0A0A'}
                  onMouseLeave={e=>e.target.style.color='#525252'}>{l}</a>
              ))}
            </div>
          ))}
          <div>
            <div style={{ fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:12, color:'#0A0A0A', letterSpacing:'0.5px', marginBottom:16, textTransform:'uppercase' }}>Legal</div>
            {legalLinks.map(l => (
              <Link key={l.label} to={l.to} style={linkStyle}
                onMouseEnter={e=>e.currentTarget.style.color='#0A0A0A'}
                onMouseLeave={e=>e.currentTarget.style.color='#525252'}>{l.label}</Link>
            ))}
          </div>
        </div>
        <div style={{ borderTop:'1px solid #E4E4E7', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <span style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#A3A3A3' }}>© 2026 FOAM, LLC. All rights reserved.</span>
          <div style={{ display:'flex', gap:20 }}>
            {['Instagram','TikTok','Facebook'].map(s=>(
              <a key={s} href="#" style={{ fontFamily:'Inter,sans-serif', fontSize:13, color:'#A3A3A3', textDecoration:'none', transition:'color 150ms' }}
                onMouseEnter={e=>e.target.style.color='var(--accent,#339DC7)'}
                onMouseLeave={e=>e.target.style.color='#A3A3A3'}>{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

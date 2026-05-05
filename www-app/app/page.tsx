"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Card from "@/components/Card";
import PhoneMockup from "@/components/PhoneMockup";
import Button from "@/components/Button";

const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// ─── Section 1: Hero ──────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-foam-bg min-h-[90vh] flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-foam-tint/40 via-foam-bg to-foam-bg pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-foam-dark opacity-60" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-flex items-center gap-2 font-body text-xs font-semibold text-foam-accent uppercase tracking-widest mb-6 px-3 py-1.5 rounded-pill bg-foam-accent-subtle border border-foam-accent/20">
              Now launching in Atlanta
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
            className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-foam-text leading-[1.05] tracking-tight"
          >
            The operating system for auto detailing.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            className="mt-6 font-body text-lg text-foam-text-secondary leading-relaxed max-w-lg"
          >
            Customers book trusted mobile detailers and local shops. Operators run bookings, payments, customers, crews, routes, and bays from one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button href="/for-detailers" size="lg">
              Join as an Operator
            </Button>
            <Button href="/for-customers" variant="outlined" size="lg">
              Book a Detail
            </Button>
          </motion.div>
        </div>

        <div className="relative flex items-center justify-center gap-4 lg:gap-6">
          {[
            { label: "Customer discovery feed", delay: 0.2 },
            { label: "Operator today screen", delay: 0.3 },
            { label: "Shop bay board", delay: 0.4 },
            { label: "Booking confirmation", delay: 0.5 },
          ].map((mock, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: mock.delay, ease: "easeOut" as const }}
              className={`${i === 1 || i === 2 ? "scale-105 z-10" : "scale-95 opacity-80"} ${i > 1 ? "hidden sm:block" : ""}`}
            >
              <PhoneMockup label={`Hero — iPhone mockup: ${mock.label}`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: Audience Router ───────────────────────────────────────────────
const audienceCards = [
  {
    title: "For Customers",
    body: "Find trusted detailers nearby. Mobile or shop. Book in minutes.",
    cta: "Book a detail",
    href: "/for-customers",
  },
  {
    title: "For Mobile Detailers",
    body: "Stop running your business from Instagram DMs, Venmo, and notes apps.",
    cta: "Run your mobile business",
    href: "/for-detailers",
  },
  {
    title: "For Shops",
    body: "Fill your bays, manage drop-offs, and keep customers coming back.",
    cta: "Run your shop",
    href: "/for-shops",
  },
];

function AudienceSection() {
  return (
    <section className="py-20 lg:py-28 bg-foam-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          {...scrollReveal}
          className="font-display font-bold text-4xl lg:text-5xl text-foam-text text-center mb-12"
        >
          Choose how you FOAM.
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {audienceCards.map((card, i) => (
            <Card key={card.title} delay={i * 0.1} className="p-8 flex flex-col gap-4">
              <h3 className="font-display font-bold text-xl text-foam-text">{card.title}</h3>
              <p className="font-body text-foam-text-secondary text-sm leading-relaxed flex-1">
                {card.body}
              </p>
              <Link
                href={card.href}
                className="inline-flex items-center gap-1.5 font-body font-semibold text-sm text-foam-accent hover:text-foam-accent-hover transition-colors"
              >
                {card.cta}
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: How It Works ──────────────────────────────────────────────────
const customerSteps = [
  "Search nearby",
  "Choose mobile or drop-off",
  "Pick a service and time",
  "Pay and rebook in the app",
];

const operatorSteps = [
  "Build your profile",
  "Manage bookings and availability",
  "Complete jobs and get paid",
  "Grow with reviews and repeat customers",
];

function HowItWorksSection() {
  const [tab, setTab] = useState<"customers" | "operators">("customers");
  const steps = tab === "customers" ? customerSteps : operatorSteps;

  return (
    <section className="py-20 lg:py-28 bg-foam-bg-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          {...scrollReveal}
          className="font-display font-bold text-4xl lg:text-5xl text-foam-text text-center mb-4"
        >
          Clean cars. Clean business.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
          className="flex justify-center mt-8 mb-12"
        >
          <div className="flex bg-foam-border rounded-pill p-1 gap-1">
            {(["customers", "operators"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-body font-medium text-sm px-5 py-2 rounded-pill transition-all duration-200 ${
                  tab === t
                    ? "bg-foam-accent text-white shadow-level-1"
                    : "text-foam-text-secondary hover:text-foam-text"
                }`}
              >
                {t === "customers" ? "Customers" : "Operators"}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={`${tab}-${i}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" as const }}
              className="flex items-center gap-5 bg-white rounded-card border border-foam-border p-5 shadow-level-1"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foam-accent flex items-center justify-center shadow-level-1">
                <span className="font-body font-bold text-white text-sm">{i + 1}</span>
              </div>
              <span className="font-body font-medium text-foam-text">{step}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Dual Model ────────────────────────────────────────────────────
const bayStatuses = [
  { label: "Bay 1 — Empty", color: "bg-foam-border", text: "text-foam-text-tertiary" },
  { label: "Bay 2 — In Progress", color: "bg-foam-accent", text: "text-white" },
  { label: "Bay 3 — Ready", color: "bg-green-600", text: "text-white" },
  { label: "Bay 4 — Empty", color: "bg-foam-border", text: "text-foam-text-tertiary" },
];

const mobileJobs = [
  { name: "Toyota Camry", time: "8:00 AM", drive: "12 min drive" },
  { name: "Ford F-150", time: "10:30 AM", drive: "8 min drive" },
  { name: "Honda CR-V", time: "1:00 PM", drive: "15 min drive" },
];

function DualModelSection() {
  const [view, setView] = useState<"mobile" | "shop" | "hybrid">("mobile");

  return (
    <section className="py-20 lg:py-28 bg-foam-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-foam-text leading-tight mb-6">
              Van or bay. FOAM handles both.
            </h2>
            <p className="font-body text-foam-text-secondary leading-relaxed mb-8">
              Mobile routes, shop bays, drop-offs, walk-ins, customer history, payments, and crew assignments. FOAM was built for how detailing actually works.
            </p>
            <div className="flex bg-foam-bg-secondary rounded-pill p-1 gap-1 w-fit border border-foam-border">
              {(["mobile", "shop", "hybrid"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`font-body font-medium text-sm px-4 py-1.5 rounded-pill transition-all duration-200 capitalize ${
                    view === v
                      ? "bg-white text-foam-text shadow-level-1"
                      : "text-foam-text-secondary hover:text-foam-text"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
            className="grid grid-cols-2 gap-4"
          >
            {(view === "mobile" || view === "hybrid") && (
              <div className="bg-white border border-foam-border rounded-card p-4 shadow-level-2">
                <p className="font-body font-semibold text-xs text-foam-text-tertiary uppercase tracking-widest mb-3">Mobile Route</p>
                <div className="flex flex-col gap-2">
                  {mobileJobs.map((job, i) => (
                    <div key={i} className="bg-foam-bg-secondary rounded-input p-3">
                      <p className="font-body font-semibold text-xs text-foam-text">{job.name}</p>
                      <p className="font-body text-[10px] text-foam-text-secondary mt-0.5">{job.time} · {job.drive}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === "mobile" && (
              <div className="bg-foam-bg-secondary border border-foam-border rounded-card p-4 flex items-center justify-center">
                <p className="font-body text-xs text-foam-text-tertiary text-center">Switch to Shop or Hybrid to see bay board</p>
              </div>
            )}
            {(view === "shop" || view === "hybrid") && (
              <div className="bg-white border border-foam-border rounded-card p-4 shadow-level-2">
                <p className="font-body font-semibold text-xs text-foam-text-tertiary uppercase tracking-widest mb-3">Bay Board</p>
                <div className="flex flex-col gap-2">
                  {bayStatuses.map((bay, i) => (
                    <div key={i} className={`rounded-input px-3 py-2 text-[10px] font-body font-semibold ${bay.color} ${bay.text}`}>
                      {bay.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 5: Product Preview ───────────────────────────────────────────────
const roles = [
  { name: "Customer", desc: "Discover, book, pay, rebook", label: "Customer discovery feed" },
  { name: "Operator", desc: "Today, bookings, customers, business", label: "Operator today screen" },
  { name: "Manager", desc: "Assign jobs, manage crew, track performance", label: "Manager crew dashboard" },
  { name: "Crew", desc: "See jobs, navigate, complete work, track earnings", label: "Crew job list and earnings" },
];

function ProductPreviewSection() {
  return (
    <section className="py-20 lg:py-28 bg-foam-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          {...scrollReveal}
          className="font-display font-bold text-4xl lg:text-5xl text-foam-text text-center mb-12"
        >
          One platform. Every role.
        </motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, i) => (
            <Card key={role.name} delay={i * 0.1} className="p-6 flex flex-col items-center text-center gap-4">
              <PhoneMockup label={`Product preview — iPhone mockup: ${role.label}`} className="!w-[120px]" />
              <div>
                <h3 className="font-display font-bold text-lg text-foam-text">{role.name}</h3>
                <p className="font-body text-xs text-foam-text-secondary mt-1">{role.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Founder Story ─────────────────────────────────────────────────
function FounderSection() {
  return (
    <section className="py-20 lg:py-28 bg-foam-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div {...scrollReveal}>
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-white leading-tight mb-6">
            Built by someone who ran the van and the bay.
          </h2>
          <p className="font-body text-foam-tint leading-relaxed mb-8">
            FOAM started with a mobile van and three physical shops in Atlanta. The problem was never the work. It was the infrastructure around the work. So we built the platform the industry should have had from day one.
          </p>
          <Button href="/about" variant="outlined-white" size="lg">
            Read the story
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
          className="aspect-[4/3] rounded-card border border-white/10 bg-white/5 flex items-center justify-center"
        >
          <p className="font-body text-xs text-white/40 text-center px-6">
            Founder photography — van, shop bay, detailing tools
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 7: Founding Operator ─────────────────────────────────────────────
const foundingOffers = [
  { title: "3 months free on Pro", desc: "Full Pro access at no cost for your first three months.", badge: false },
  { title: "Founding Operator badge", desc: "Permanent recognition as a FOAM original.", badge: true },
  { title: "Zero platform booking fee for first 60 days", desc: "Keep every dollar from every booking through your first two months.", badge: false },
  { title: "Direct feedback channel to the product team", desc: "Your input shapes what FOAM becomes.", badge: false },
];

function FoundingSection() {
  return (
    <section className="py-20 lg:py-28 bg-foam-tint">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...scrollReveal} className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-foam-text">
            Atlanta founding operators get in first.
          </h2>
          <p className="mt-4 font-body text-foam-text-secondary max-w-xl mx-auto leading-relaxed">
            Join the first wave of FOAM operators and help shape the platform before public launch.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {foundingOffers.map((offer, i) => (
            <Card key={offer.title} delay={i * 0.1} className="p-6">
              {offer.badge ? (
                <div className="relative overflow-hidden inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-pill bg-foam-accent text-white text-xs font-body font-semibold">
                  <span>★ Founding Operator</span>
                  <span className="absolute inset-0 w-8 bg-white/40 skew-x-[-15deg] animate-shine" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-foam-accent-subtle border border-foam-accent/20 flex items-center justify-center mb-4">
                  <span className="text-foam-accent font-body font-bold text-sm">{i + 1}</span>
                </div>
              )}
              <h3 className="font-display font-bold text-base text-foam-text mb-2">{offer.title}</h3>
              <p className="font-body text-xs text-foam-text-secondary leading-relaxed">{offer.desc}</p>
            </Card>
          ))}
        </div>

        <motion.div {...scrollReveal} className="text-center">
          <Button href="/for-detailers" size="lg">
            Apply to Become a Founding Operator
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 8: Resources Preview ─────────────────────────────────────────────
const articles = [
  {
    category: "Mobile Detailer Playbook",
    title: "How to price mobile detailing services",
    summary: "Stop guessing and start earning. A straightforward framework for setting profitable prices that reflect your work, your market, and your goals.",
    readTime: "5 min read",
  },
  {
    category: "Shop Operator Handbook",
    title: "How to fill dead bay time without discounting",
    summary: "Empty bays are lost revenue. These strategies fill your schedule without training customers to wait for a deal.",
    readTime: "6 min read",
  },
  {
    category: "Customer Guides",
    title: "Mobile detailing vs. shop detailing: what customers actually want",
    summary: "The real differences between coming to you and going to a shop — and how to position both to win more business.",
    readTime: "4 min read",
  },
];

function ResourcesSection() {
  return (
    <section className="py-20 lg:py-28 bg-foam-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...scrollReveal} className="text-center mb-12">
          <h2 className="font-display font-bold text-4xl lg:text-5xl text-foam-text">
            Built for operators who are building something real.
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {articles.map((article, i) => (
            <Card key={article.title} delay={i * 0.1} className="p-6 flex flex-col gap-3">
              <span className="inline-flex self-start font-body text-xs font-semibold text-foam-accent bg-foam-accent-subtle px-3 py-1 rounded-pill">
                {article.category}
              </span>
              <h3 className="font-display font-bold text-lg text-foam-text leading-snug">{article.title}</h3>
              <p className="font-body text-sm text-foam-text-secondary leading-relaxed flex-1">{article.summary}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-body text-xs text-foam-text-tertiary">{article.readTime}</span>
                <Link href="/resources" className="font-body font-semibold text-xs text-foam-accent hover:text-foam-accent-hover transition-colors inline-flex items-center gap-1">
                  Read
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </Card>
          ))}
        </div>
        <motion.div {...scrollReveal} className="text-center">
          <Button href="/resources" variant="outlined" size="lg">Explore Resources</Button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 9: Final CTA ──────────────────────────────────────────────────────
function FinalCTASection() {
  return (
    <section className="py-20 lg:py-28 bg-foam-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2 {...scrollReveal} className="font-display font-extrabold text-5xl lg:text-6xl text-white leading-tight mb-6">
          The whiteboard days are over.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
          className="font-body text-foam-tint leading-relaxed mb-10 text-lg"
        >
          Whether you run a van, a bay, or both, FOAM gives your detailing business the infrastructure it deserved from day one.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Button href="/for-detailers" size="lg">Join FOAM</Button>
          <Button href="/pricing" variant="outlined-white" size="lg">See Pricing</Button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AudienceSection />
      <HowItWorksSection />
      <DualModelSection />
      <ProductPreviewSection />
      <FounderSection />
      <FoundingSection />
      <ResourcesSection />
      <FinalCTASection />
    </>
  );
}

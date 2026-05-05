"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";
import FAQ, { FAQItem } from "@/components/FAQ";

const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const painCards = [
  { title: "Instagram DMs are not a booking system", desc: "You're losing bookings to unanswered messages and forgotten follow-ups." },
  { title: "Venmo is not payment infrastructure", desc: "Chasing payments wastes time and makes you look unprofessional." },
  { title: "Notes app is not a CRM", desc: "You have no record of who booked, what they wanted, or when they're due back." },
  { title: "Group texts are not crew management", desc: "Coordinating jobs through texts is chaos when you add even one tech." },
];

const features = [
  { name: "Booking profile", desc: "A professional page customers can find and book directly." },
  { name: "Calendar and availability", desc: "Set your hours, block time, and manage scheduling in one place." },
  { name: "Payments and tips", desc: "Get paid automatically after every job. Tips included." },
  { name: "Customer profiles", desc: "Full history, vehicle details, preferences, and rebooking reminders." },
  { name: "Before and after photos", desc: "Document your work and build credibility with every job." },
  { name: "Reviews", desc: "Collect verified reviews that drive repeat business and new bookings." },
  { name: "Crew tools", desc: "Add techs, assign jobs, and track performance as your team grows." },
  { name: "Route management", desc: "Organize your day with optimized job sequencing and drive times." },
];

const pricingTiers = [
  { name: "Starter", price: "$29", period: "/mo", desc: "Best for solo detailers getting started" },
  { name: "Pro", price: "$69", period: "/mo", desc: "Best for established operators", popular: true },
  { name: "Crew", price: "$149", period: "/mo", desc: "Best for multi-tech teams" },
];

const faqItems: FAQItem[] = [
  {
    question: "How much does FOAM cost?",
    answer: "FOAM starts at $29/month for Starter. Pro is $69/month and includes the full feature set. Crew is $149/month for teams with multiple technicians. Annual billing saves around 17%.",
  },
  {
    question: "Is FOAM only for mobile detailers?",
    answer: "No. FOAM supports mobile operators, fixed-location shops, and hybrid operators who do both. The platform adapts to how your business actually works.",
  },
  {
    question: "Can I use FOAM if I am solo?",
    answer: "Absolutely. The Starter and Pro plans are built for solo operators. Crew features unlock when you add your first technician.",
  },
  {
    question: "Does FOAM collect payments?",
    answer: "Yes. FOAM processes payments directly through the app via Stripe. Funds are deposited to your account automatically after each job is completed.",
  },
  {
    question: "Can customers book me directly?",
    answer: "Yes. Your FOAM profile is bookable by any customer who finds you — through the app, through FOAM's marketplace, or through a direct link you share.",
  },
  {
    question: "Can I bring my existing customers?",
    answer: "Yes. You can import your existing customer list and invite them to book through your FOAM profile. There's no fee for bringing customers you already have.",
  },
];

export default function ForDetailersClient() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-foam-bg py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-foam-tint/30 to-foam-bg pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-foam-text leading-tight"
          >
            Stop running your business like a side hustle.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" as const }}
            className="mt-6 font-body text-lg text-foam-text-secondary leading-relaxed max-w-2xl mx-auto"
          >
            FOAM gives mobile detailers the back office they never had: bookings, payments, customer history, routes, reviews, and crew tools in one app.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" as const }}
            className="mt-8"
          >
            <Button href="/pricing" size="lg">Become a Founding Operator</Button>
          </motion.div>
        </div>
      </section>

      {/* Pain Cards */}
      <section className="py-20 bg-foam-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-10">
            Sound familiar?
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {painCards.map((card, i) => (
              <Card key={card.title} delay={i * 0.08} className="p-6">
                <h3 className="font-display font-bold text-lg text-foam-text mb-2">{card.title}</h3>
                <p className="font-body text-sm text-foam-text-secondary leading-relaxed">{card.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-12">
            Everything your business needs. In one app.
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <Card key={feature.name} delay={i * 0.06} className="p-5">
                <div className="w-8 h-8 rounded-full bg-foam-accent-subtle border border-foam-accent/20 flex items-center justify-center mb-3">
                  <div className="w-2 h-2 rounded-full bg-foam-accent" />
                </div>
                <h3 className="font-body font-semibold text-sm text-foam-text mb-1">{feature.name}</h3>
                <p className="font-body text-xs text-foam-text-secondary leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Operator Success Loop */}
      <section className="py-20 bg-foam-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.p
            {...scrollReveal}
            className="font-display font-bold text-4xl lg:text-5xl text-white leading-relaxed"
          >
            Book.{" "}
            <span className="text-foam-accent">Detail.</span>{" "}
            Get paid.{" "}
            <span className="text-foam-tint">Get reviewed.</span>{" "}
            Rebook.
          </motion.p>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-foam-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-10">
            Simple pricing. No surprises.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {pricingTiers.map((tier, i) => (
              <Card
                key={tier.name}
                delay={i * 0.1}
                accentBorder={tier.popular}
                className={`p-6 relative ${tier.popular ? "ring-1 ring-foam-accent" : ""}`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-body text-xs font-semibold text-white bg-foam-accent px-3 py-1 rounded-pill">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-bold text-xl text-foam-text mb-1">{tier.name}</h3>
                <p className="font-body text-xs text-foam-text-secondary mb-4">{tier.desc}</p>
                <div className="flex items-baseline gap-0.5 mb-5">
                  <span className="font-display font-bold text-4xl text-foam-text">{tier.price}</span>
                  <span className="font-body text-foam-text-secondary text-sm">{tier.period}</span>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex font-body font-semibold text-sm text-foam-accent hover:text-foam-accent-hover transition-colors items-center gap-1"
                >
                  See full plan
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </Card>
            ))}
          </div>
          <motion.div {...scrollReveal} className="text-center">
            <Button href="/pricing" variant="outlined" size="lg">View Full Pricing</Button>
          </motion.div>
        </div>
      </section>

      {/* Founder Credibility */}
      <section className="py-16 bg-foam-tint">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-3xl text-foam-text mb-4">
              Built by someone who chased the same payments.
            </h2>
            <p className="font-body text-foam-text-secondary leading-relaxed">
              FOAM was built by someone who ran a mobile van and three shops in Atlanta. Every feature exists because it was needed in the field.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text mb-10">
            Questions from operators
          </motion.h2>
          <FAQ items={faqItems} />
        </div>
      </section>
    </>
  );
}

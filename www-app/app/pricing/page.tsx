"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/Card";
import Button from "@/components/Button";
import FAQ, { FAQItem } from "@/components/FAQ";

const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type Billing = "annual" | "monthly";

const tiers = [
  {
    name: "Starter",
    monthly: 35,
    annual: 29,
    desc: "Best for solo detailers getting started",
    cta: "Start with Starter",
    popular: false,
    platformFee: "$10 per booking",
    features: {
      "Booking profile": true,
      "Calendar and availability": true,
      "Payments and tips": true,
      "Customer profiles": true,
      "Reviews": true,
      "Before and after photos": true,
      "Full CRM": false,
      "Recurring appointments": false,
      "Expense tracking": false,
      "Crew accounts": false,
      "Job assignment": false,
      "Commission rules": false,
      "Team performance dashboard": false,
    },
  },
  {
    name: "Pro",
    monthly: 79,
    annual: 69,
    desc: "Best for established operators",
    cta: "Go Pro",
    popular: true,
    platformFee: "$8 per booking",
    features: {
      "Booking profile": true,
      "Calendar and availability": true,
      "Payments and tips": true,
      "Customer profiles": true,
      "Reviews": true,
      "Before and after photos": true,
      "Full CRM": true,
      "Recurring appointments": true,
      "Expense tracking": true,
      "Crew accounts": false,
      "Job assignment": false,
      "Commission rules": false,
      "Team performance dashboard": false,
    },
  },
  {
    name: "Crew",
    monthly: 169,
    annual: 149,
    desc: "Best for multi-tech teams",
    cta: "Run the Crew",
    popular: false,
    platformFee: "$6 per booking",
    features: {
      "Booking profile": true,
      "Calendar and availability": true,
      "Payments and tips": true,
      "Customer profiles": true,
      "Reviews": true,
      "Before and after photos": true,
      "Full CRM": true,
      "Recurring appointments": true,
      "Expense tracking": true,
      "Crew accounts": true,
      "Job assignment": true,
      "Commission rules": true,
      "Team performance dashboard": true,
    },
  },
];

const featureRows = [
  "Booking profile",
  "Calendar and availability",
  "Payments and tips",
  "Customer profiles",
  "Reviews",
  "Before and after photos",
  "Full CRM",
  "Recurring appointments",
  "Expense tracking",
  "Crew accounts",
  "Job assignment",
  "Commission rules",
  "Team performance dashboard",
];

const faqItems: FAQItem[] = [
  {
    question: "Why is there a monthly subscription and a booking fee?",
    answer: "The subscription covers your platform access and all core features. The booking fee applies only when customers book through FOAM's marketplace — it keeps the platform sustainable and aligns our incentives: we only earn when you do.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no long-term contracts. Cancel your subscription at any time from your account settings.",
  },
  {
    question: "What happens if I bring my own customers?",
    answer: "Customers you bring directly to your FOAM booking link do not incur a platform booking fee. The fee only applies to customers who discover you through FOAM's marketplace.",
  },
  {
    question: "Do I need Stripe?",
    answer: "FOAM uses Stripe to process payments. You'll connect your Stripe account during onboarding — it takes about two minutes. If you don't have one, we'll walk you through creating it.",
  },
  {
    question: "Is there a free trial?",
    answer: "Founding Operators get three months free on Pro. Outside of the founding program, reach out directly and we'll discuss options.",
  },
  {
    question: "What is a Founding Operator?",
    answer: "Founding Operators are the first wave of FOAM operators — detailers and shops in Atlanta who join before public launch. They get 3 months free on Pro, zero platform booking fees for 60 days, a Founding Operator badge, and a direct line to the product team.",
  },
];

function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" className="text-foam-accent">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-foam-text-tertiary">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-foam-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="font-display font-extrabold text-5xl sm:text-6xl text-foam-text leading-tight"
          >
            Pricing built for real detailing businesses.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" as const }}
            className="mt-6 font-body text-lg text-foam-text-secondary leading-relaxed"
          >
            Start solo. Go pro. Add crew when the business demands it.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" as const }}
            className="flex justify-center mt-10"
          >
            <div className="flex bg-foam-bg-secondary border border-foam-border rounded-pill p-1 gap-1 items-center">
              {(["annual", "monthly"] as Billing[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`font-body font-medium text-sm px-5 py-2 rounded-pill transition-all duration-200 capitalize ${
                    billing === b
                      ? "bg-foam-accent text-white shadow-level-1"
                      : "text-foam-text-secondary hover:text-foam-text"
                  }`}
                >
                  {b === "annual" ? "Annual (save 17%)" : "Monthly"}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 bg-foam-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <Card
                key={tier.name}
                delay={i * 0.1}
                accentBorder={tier.popular}
                className={`p-7 relative flex flex-col ${tier.popular ? "ring-1 ring-foam-accent shadow-level-3" : ""}`}
              >
                {tier.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 font-body text-xs font-semibold text-white bg-foam-accent px-4 py-1 rounded-pill whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display font-bold text-2xl text-foam-text mb-1">{tier.name}</h3>
                <p className="font-body text-xs text-foam-text-secondary mb-5">{tier.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display font-bold text-5xl text-foam-text">
                    ${billing === "annual" ? tier.annual : tier.monthly}
                  </span>
                  <span className="font-body text-foam-text-secondary text-sm">/mo</span>
                </div>
                <Button
                  href="/for-detailers"
                  variant={tier.popular ? "primary" : "outlined"}
                  className="w-full mb-6"
                >
                  {tier.cta}
                </Button>
                <div className="pt-4 border-t border-foam-border">
                  <p className="font-body text-xs text-foam-text-secondary">
                    Platform fee: <span className="font-semibold text-foam-text">{tier.platformFee}</span>
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-foam-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-3xl text-foam-text text-center mb-10">
            Everything, compared.
          </motion.h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-body font-semibold text-sm text-foam-text-secondary py-3 pr-6 w-1/2">Feature</th>
                  {tiers.map((tier) => (
                    <th key={tier.name} className="text-center font-display font-bold text-base text-foam-text py-3 px-4 w-1/6">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureRows.map((feature, i) => (
                  <motion.tr
                    key={feature}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-foam-border"
                  >
                    <td className="font-body text-sm text-foam-text py-3.5 pr-6">{feature}</td>
                    {tiers.map((tier) => (
                      <td key={tier.name} className="text-center py-3.5 px-4">
                        <span className="inline-flex justify-center">
                          {tier.features[feature as keyof typeof tier.features] ? <CheckIcon /> : <XIcon />}
                        </span>
                      </td>
                    ))}
                  </motion.tr>
                ))}
                <tr className="border-t border-foam-border">
                  <td className="font-body text-sm text-foam-text py-3.5 pr-6 font-semibold">Platform fee per booking</td>
                  {tiers.map((tier) => (
                    <td key={tier.name} className="text-center font-body text-sm text-foam-text py-3.5 px-4 font-semibold">
                      {tier.platformFee.replace(" per booking", "")}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text mb-10">
            Pricing questions
          </motion.h2>
          <FAQ items={faqItems} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-foam-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-white mb-4">
            Ready to run a real business?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-body text-foam-tint mb-8"
          >
            Atlanta founding operators get 3 months free on Pro.
          </motion.p>
          <Button href="/for-detailers" size="lg">Apply as a Founding Operator</Button>
        </div>
      </section>
    </>
  );
}

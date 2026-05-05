"use client";

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

const painCards = [
  { title: "Empty bays are dead inventory", desc: "Every unbilled bay hour is revenue you can never recover." },
  { title: "Walk-ins are hard to predict", desc: "Without visibility into what's coming, it's impossible to staff or plan." },
  { title: "Whiteboards fall behind reality", desc: "Statuses go stale, vehicles get missed, and customers wait too long." },
  { title: "Generic booking tools don't understand detailing", desc: "They weren't built for bay workflows, vehicle types, or service complexity." },
  { title: "Customers come once and disappear", desc: "Without a system to track history and trigger rebooking, most customers don't return." },
];

const features = [
  { name: "Bay management", desc: "Real-time bay status visible to your whole team." },
  { name: "Drop-off booking", desc: "Customers schedule drop-offs online. No phone calls." },
  { name: "Walk-in toggle", desc: "Open or close for walk-ins in one tap." },
  { name: "Customer profiles", desc: "Vehicle history, preferences, and visit records for every customer." },
  { name: "Ready notifications", desc: "Customers get notified automatically when their car is done." },
  { name: "Reviews", desc: "Collect and display reviews that build trust and drive local discovery." },
];

const bayStatuses = [
  { label: "Bay 1 — Empty", colorClass: "bg-foam-bg-secondary border border-foam-border", textClass: "text-foam-text-tertiary" },
  { label: "Bay 2 — In Progress", colorClass: "bg-foam-accent", textClass: "text-white" },
  { label: "Bay 3 — Ready", colorClass: "bg-green-600", textClass: "text-white" },
  { label: "Bay 4 — Waiting for Pickup", colorClass: "bg-amber-400", textClass: "text-amber-900" },
];

const faqItems: FAQItem[] = [
  {
    question: "How does bay management work?",
    answer: "You assign each vehicle to a bay and update its status as work progresses. Your whole team sees the same live board, so nothing slips through.",
  },
  {
    question: "Can I manage walk-ins and drop-offs?",
    answer: "Yes. Drop-offs are booked in advance through the customer app. Walk-ins can be enabled or disabled in real time. You stay in control of your capacity.",
  },
  {
    question: "Does FOAM work for hybrid operators?",
    answer: "Absolutely. If you run a shop and do mobile jobs, FOAM handles both from the same dashboard. Bay board for shop work, route view for mobile.",
  },
  {
    question: "How do customers find my shop?",
    answer: "Your FOAM profile appears in the customer app's search and local discovery. Customers can filter by location, service type, and availability.",
  },
  {
    question: "Can I use FOAM for a multi-location shop?",
    answer: "Multi-location support is on the roadmap. Reach out directly to discuss your setup — we'll work with you.",
  },
  {
    question: "What happens when a car is ready?",
    answer: "FOAM automatically sends a notification to the customer the moment you mark their vehicle as ready for pickup. No phone calls required.",
  },
];

export default function ForShopsClient() {
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
            Fill your bays. Keep your customers coming back.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" as const }}
            className="mt-6 font-body text-lg text-foam-text-secondary leading-relaxed max-w-2xl mx-auto"
          >
            FOAM helps detailing shops manage drop-offs, walk-ins, bay capacity, payments, customer history, and reviews from one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" as const }}
            className="mt-8"
          >
            <Button href="/pricing" size="lg">Run Your Shop on FOAM</Button>
          </motion.div>
        </div>
      </section>

      {/* Pain Cards */}
      <section className="py-20 bg-foam-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-10">
            What running a shop actually feels like.
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {painCards.map((card, i) => (
              <Card key={card.title} delay={i * 0.07} className="p-6">
                <h3 className="font-display font-bold text-base text-foam-text mb-2">{card.title}</h3>
                <p className="font-body text-sm text-foam-text-secondary leading-relaxed">{card.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-12">
            Built for the rhythm of a shop.
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <Card key={feature.name} delay={i * 0.07} className="p-5">
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

      {/* Bay Board Preview */}
      <section className="py-20 bg-foam-bg-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-10">
            Your shop, at a glance.
          </motion.h2>
          <Card delay={0} hover={false} className="p-6">
            <p className="font-body font-semibold text-xs text-foam-text-tertiary uppercase tracking-widest mb-4">
              Live Bay Board
            </p>
            <div className="flex flex-col gap-2.5">
              {bayStatuses.map((bay, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={`rounded-input px-4 py-3 font-body font-semibold text-sm ${bay.colorClass} ${bay.textClass}`}
                >
                  {bay.label}
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Hybrid Callout */}
      <section className="py-16 bg-foam-tint">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-3xl text-foam-text mb-4">
              Run a shop and mobile jobs? FOAM sees both.
            </h2>
            <p className="font-body text-foam-text-secondary leading-relaxed mb-6">
              Hybrid operators get a unified view: bay board for shop work, route management for mobile. One dashboard. No switching.
            </p>
            <Button href="/for-detailers" variant="outlined">Learn about mobile features</Button>
          </motion.div>
        </div>
      </section>

      {/* Local Discovery */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollReveal} className="text-center">
            <h2 className="font-display font-bold text-4xl text-foam-text mb-6">
              Your shop becomes easier to find.
            </h2>
            <p className="font-body text-foam-text-secondary leading-relaxed max-w-2xl mx-auto">
              FOAM builds a bookable operator profile for your shop that appears in customer search, local city pages, and discovery results. Customers in your area looking for detailing shops can find you, see your reviews, and book directly — without a phone call.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-foam-bg-secondary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text mb-10">
            Questions from shop operators
          </motion.h2>
          <FAQ items={faqItems} />
        </div>
      </section>
    </>
  );
}

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

const trustSignals = [
  { icon: "✓", label: "Verified operators" },
  { icon: "★", label: "Real reviews" },
  { icon: "◎", label: "Before and after photos" },
  { icon: "🔒", label: "Secure payment" },
];

const bookingSteps = [
  "Search",
  "Choose",
  "Book",
  "Pay",
  "Rebook",
];

const faqItems: FAQItem[] = [
  {
    question: "How does FOAM work?",
    answer: "FOAM connects you with verified mobile detailers and local shops in your area. Search, compare, book, and pay — all in one place. No phone calls, no chasing down quotes.",
  },
  {
    question: "Can I book a mobile detailer?",
    answer: "Yes. Mobile detailers come directly to your home, office, or wherever your car is parked. You choose the time, they handle everything else.",
  },
  {
    question: "Can I book a detailing shop?",
    answer: "Absolutely. Browse local shops, check availability, and drop off your vehicle at a time that works for you. FOAM notifies you when your car is ready.",
  },
  {
    question: "Are FOAM detailers reviewed?",
    answer: "Every operator on FOAM goes through a verification process. Customers leave reviews after each job, so you can see real ratings and before and after photos before you book.",
  },
  {
    question: "How much does detailing cost?",
    answer: "Prices vary by operator, service type, and vehicle size. You'll see exact pricing before you book — no surprises, no hidden fees.",
  },
  {
    question: "What happens after I book?",
    answer: "You'll receive a confirmation with your operator's details. For mobile jobs, they come to you at the scheduled time. For shop drop-offs, FOAM sends you a ready notification when your car is done.",
  },
];

export default function ForCustomersPage() {
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
            The best detailers near you, bookable in two minutes.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" as const }}
            className="mt-6 font-body text-lg text-foam-text-secondary leading-relaxed max-w-2xl mx-auto"
          >
            Find trusted mobile detailers and local shops, compare real work, choose your time, and pay in the app.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" as const }}
            className="mt-8"
          >
            <Button href="/detailing/atlanta" size="lg">Book a Detail</Button>
          </motion.div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 bg-foam-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustSignals.map((signal, i) => (
              <Card key={signal.label} delay={i * 0.08} className="p-6 flex flex-col items-center text-center gap-3">
                <span className="text-2xl">{signal.icon}</span>
                <span className="font-body font-medium text-sm text-foam-text">{signal.label}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile or Drop-off */}
      <section className="py-20 lg:py-24 bg-foam-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-10">
            Your car. Your choice.
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card delay={0} className="p-8">
              <div className="w-12 h-12 rounded-full bg-foam-accent flex items-center justify-center mb-5">
                <span className="text-white font-bold text-lg">→</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-foam-text mb-3">Come to me</h3>
              <p className="font-body text-foam-text-secondary text-sm leading-relaxed">
                A verified mobile detailer comes to your home, office, or wherever your car is. You don&apos;t move an inch.
              </p>
            </Card>
            <Card delay={0.1} className="p-8">
              <div className="w-12 h-12 rounded-full bg-foam-dark flex items-center justify-center mb-5">
                <span className="text-white font-bold text-lg">⌂</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-foam-text mb-3">Drop off nearby</h3>
              <p className="font-body text-foam-text-secondary text-sm leading-relaxed">
                Browse local shops, book a drop-off slot, and get notified the moment your car is ready for pickup.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Booking Flow */}
      <section className="py-20 bg-foam-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-12">
            Booking takes two minutes.
          </motion.h2>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {bookingSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-center gap-2 bg-white border border-foam-border rounded-pill px-4 py-2 shadow-level-1"
                >
                  <span className="w-6 h-6 rounded-full bg-foam-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-body font-medium text-sm text-foam-text">{step}</span>
                </motion.div>
                {i < bookingSteps.length - 1 && (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-foam-text-tertiary flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operator Profile Preview */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text text-center mb-10">
            See real work before you book.
          </motion.h2>
          <Card delay={0} className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-foam-bg-secondary border border-foam-border" />
              <div>
                <p className="font-body font-semibold text-sm text-foam-text">Atlanta Detail Co.</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-foam-accent text-xs">★</span>
                  ))}
                  <span className="font-body text-xs text-foam-text-secondary ml-1">(128 reviews)</span>
                </div>
              </div>
              <span className="ml-auto inline-flex font-body text-xs font-semibold text-foam-accent bg-foam-accent-subtle px-3 py-1 rounded-pill">
                Mobile Detailer
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Full Detail", "Interior Only", "Ceramic Coating"].map(svc => (
                <div key={svc} className="bg-foam-bg-secondary rounded-input px-3 py-2 text-center">
                  <p className="font-body text-xs font-medium text-foam-text">{svc}</p>
                </div>
              ))}
            </div>
            <div className="aspect-[16/6] bg-foam-bg-secondary rounded-card border border-foam-border flex items-center justify-center">
              <p className="font-body text-xs text-foam-text-tertiary">Before and after photos — operator work samples</p>
            </div>
            <Button href="/detailing/atlanta" size="md" className="self-start">Book This Operator</Button>
          </Card>
        </div>
      </section>

      {/* Rain Coverage Teaser */}
      <section className="py-16 bg-foam-tint">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal}>
            <span className="inline-flex items-center gap-2 font-body text-xs font-semibold text-foam-accent bg-white border border-foam-border rounded-pill px-3 py-1 mb-5">
              Coming Soon
            </span>
            <h2 className="font-display font-bold text-3xl text-foam-text">
              Rain after your detail? FOAM has plans for that.
            </h2>
            <p className="mt-4 font-body text-foam-text-secondary text-sm leading-relaxed max-w-lg mx-auto">
              Rain Coverage is coming to FOAM. Book with confidence knowing your detail is protected when the weather doesn&apos;t cooperate.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-24 bg-foam-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-4xl text-foam-text mb-10">
            Questions from customers
          </motion.h2>
          <FAQ items={faqItems} />
        </div>
      </section>
    </>
  );
}

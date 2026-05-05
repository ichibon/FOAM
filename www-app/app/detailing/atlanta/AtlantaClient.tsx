"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";

const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const serviceFilters = [
  "Mobile detailing",
  "Drop-off shops",
  "Interior detail",
  "Full detail",
  "Ceramic coating",
];

const neighborhoods = [
  { name: "Buckhead", count: "12 operators" },
  { name: "Midtown", count: "8 operators" },
  { name: "Decatur", count: "6 operators" },
  { name: "Sandy Springs", count: "9 operators" },
  { name: "Smyrna", count: "5 operators" },
];

const operators = [
  { name: "Atlanta Detail Co.", rating: 4.9, reviews: 128, type: "Mobile Detailer", starting: "$75", availability: "Available today" },
  { name: "Buckhead Auto Spa", rating: 4.8, reviews: 94, type: "Drop-off Shop", starting: "$99", availability: "Next available: Tomorrow" },
  { name: "Midtown Mobile Detail", rating: 5.0, reviews: 47, type: "Mobile Detailer", starting: "$65", availability: "Available today" },
  { name: "Peach State Detailing", rating: 4.7, reviews: 211, type: "Mobile Detailer", starting: "$80", availability: "Available this week" },
];

export default function AtlantaClient() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-foam-bg-secondary border-b border-foam-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 font-body text-xs text-foam-text-secondary">
            <Link href="/" className="hover:text-foam-accent transition-colors">Home</Link>
            <span>/</span>
            <span>Detailing</span>
            <span>/</span>
            <span className="text-foam-text font-medium">Atlanta</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-foam-bg py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-foam-tint/30 to-foam-bg pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="font-display font-extrabold text-5xl sm:text-6xl text-foam-text leading-tight"
          >
            Book trusted car detailing in Atlanta.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" as const }}
            className="mt-6 font-body text-lg text-foam-text-secondary leading-relaxed max-w-2xl mx-auto"
          >
            Mobile detailers and local shops across Atlanta, all bookable through FOAM.
          </motion.p>
        </div>
      </section>

      {/* Service Filter Chips */}
      <section className="pb-12 bg-foam-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {serviceFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                className={`font-body font-medium text-sm px-4 py-2 rounded-pill border transition-all duration-200 ${
                  activeFilter === filter
                    ? "bg-foam-accent text-white border-foam-accent"
                    : "bg-foam-accent-subtle text-foam-accent border-foam-accent/20 hover:bg-foam-accent hover:text-white hover:border-foam-accent"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhood Cards */}
      <section className="py-12 bg-foam-bg-secondary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-3xl text-foam-text mb-8 text-center">
            Browse by neighborhood
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {neighborhoods.map((hood, i) => (
              <Card key={hood.name} delay={i * 0.07} className="p-5 text-center cursor-pointer">
                <h3 className="font-display font-bold text-base text-foam-text mb-1">{hood.name}</h3>
                <p className="font-body text-xs text-foam-text-secondary">{hood.count}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Operator Preview Cards */}
      <section className="py-16 bg-foam-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...scrollReveal} className="font-display font-bold text-3xl text-foam-text mb-8">
            Atlanta operators
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-5">
            {operators.map((op, i) => (
              <Card key={op.name} delay={i * 0.08} className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-foam-bg-secondary border border-foam-border flex-shrink-0" />
                    <div>
                      <p className="font-body font-semibold text-sm text-foam-text">{op.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-foam-accent text-xs">★</span>
                        <span className="font-body text-xs font-semibold text-foam-text">{op.rating}</span>
                        <span className="font-body text-xs text-foam-text-secondary">({op.reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex font-body text-xs font-semibold px-2.5 py-1 rounded-pill flex-shrink-0 ${
                    op.availability.includes("today")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-foam-bg-secondary text-foam-text-secondary border border-foam-border"
                  }`}>
                    {op.availability}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-foam-text-secondary">{op.type}</span>
                    <span className="font-body text-xs text-foam-text-secondary">·</span>
                    <span className="font-body text-xs text-foam-text">from <strong>{op.starting}</strong></span>
                  </div>
                  <button className="font-body font-semibold text-xs text-foam-accent hover:text-foam-accent-hover transition-colors inline-flex items-center gap-1">
                    View Profile
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Placeholder for additional results */}
          <motion.div {...scrollReveal} className="mt-8 rounded-card border border-foam-border bg-foam-bg-secondary p-10 flex flex-col items-center gap-3">
            <p className="font-body text-sm text-foam-text-secondary">More Atlanta operators — operator profiles, photos, and real reviews</p>
            <Button href="/for-customers" variant="outlined" size="sm">Find a Detailer</Button>
          </motion.div>
        </div>
      </section>

      {/* Customer CTA */}
      <section className="py-16 bg-foam-tint">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-3xl text-foam-text mb-4">
              Ready to book in Atlanta?
            </h2>
            <p className="font-body text-foam-text-secondary mb-6 leading-relaxed">
              Browse verified mobile detailers and shops near you and book in minutes.
            </p>
            <Button href="/for-customers" size="lg">Find a Detailer</Button>
          </motion.div>
        </div>
      </section>

      {/* Operator CTA */}
      <section className="py-16 bg-foam-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-3xl text-white mb-4">
              Are you an Atlanta detailer?
            </h2>
            <p className="font-body text-foam-tint mb-6 leading-relaxed">
              Join as a founding operator and get your first 3 months on Pro free.
            </p>
            <Button href="/for-detailers" variant="outlined-white" size="lg">
              Join as an Atlanta Operator
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}

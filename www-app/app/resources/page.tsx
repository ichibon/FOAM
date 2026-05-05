"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/Card";

const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type Category = "All" | "Customer Guides" | "Mobile Detailer Playbook" | "Shop Operator Handbook" | "FOAM Updates";

const articles = [
  {
    category: "Customer Guides" as Category,
    title: "How much does a full car detail cost?",
    summary: "A realistic breakdown of what detailing actually costs — by service type, vehicle size, and market — so you know what you're paying for before you book.",
    readTime: "4 min read",
  },
  {
    category: "Mobile Detailer Playbook" as Category,
    title: "How to price mobile detailing services",
    summary: "Stop guessing and start earning. A straightforward framework for setting profitable prices that reflect your work, your market, and your goals.",
    readTime: "5 min read",
  },
  {
    category: "Mobile Detailer Playbook" as Category,
    title: "How to stop losing bookings in Instagram DMs",
    summary: "DMs are not a booking system. Here's how to move customers to a real funnel without losing the relationships you've built on social.",
    readTime: "6 min read",
  },
  {
    category: "Shop Operator Handbook" as Category,
    title: "How to fill detailing bays",
    summary: "Empty bays are dead inventory. These strategies help you fill your schedule without discounting or waiting for walk-ins to show up.",
    readTime: "7 min read",
  },
  {
    category: "Customer Guides" as Category,
    title: "How to choose a trusted mobile detailer",
    summary: "What to look for, what to ask, and what red flags to avoid when hiring someone to detail your car at home or work.",
    readTime: "4 min read",
  },
  {
    category: "Customer Guides" as Category,
    title: "Mobile detailing vs. shop detailing: what customers actually want",
    summary: "The real differences between coming to you and going to a shop — and how to position both to win more business.",
    readTime: "4 min read",
  },
];

const categories: Category[] = [
  "All",
  "Customer Guides",
  "Mobile Detailer Playbook",
  "Shop Operator Handbook",
  "FOAM Updates",
];

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered = activeCategory === "All"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-foam-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
            className="font-display font-extrabold text-5xl sm:text-6xl text-foam-text leading-tight"
          >
            The playbook for cleaner cars and cleaner businesses.
          </motion.h1>
        </div>
      </section>

      {/* Category Filters */}
      <section className="pb-8 bg-foam-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-body font-medium text-sm px-4 py-2 rounded-pill border transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-foam-accent text-white border-foam-accent"
                    : "bg-white text-foam-text-secondary border-foam-border hover:border-foam-accent hover:text-foam-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-12 pb-24 bg-foam-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <motion.div {...scrollReveal} className="text-center py-16">
              <p className="font-body text-foam-text-secondary">No articles in this category yet. Check back soon.</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article, i) => (
                <Card key={article.title} delay={i * 0.07} className="p-6 flex flex-col gap-3">
                  <span className="inline-flex self-start font-body text-xs font-semibold text-foam-accent bg-foam-accent-subtle px-3 py-1 rounded-pill whitespace-nowrap">
                    {article.category}
                  </span>
                  <h3 className="font-display font-bold text-lg text-foam-text leading-snug">
                    {article.title}
                  </h3>
                  <p className="font-body text-sm text-foam-text-secondary leading-relaxed flex-1">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-foam-border mt-auto">
                    <span className="font-body text-xs text-foam-text-tertiary">{article.readTime}</span>
                    <button className="font-body font-semibold text-xs text-foam-accent hover:text-foam-accent-hover transition-colors inline-flex items-center gap-1">
                      Read
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

"use client";

import { motion } from "framer-motion";
import Button from "@/components/Button";

const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export default function AboutPage() {
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
            The work deserved better tools.
          </motion.h1>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...scrollReveal}>
            <p className="font-body text-xl text-foam-text-secondary leading-relaxed">
              Every detailer I have ever met is brilliant at the work and exhausted by everything around it. FOAM exists because the founder ran Foam Auto Spa — a mobile van and three physical shops in Atlanta — and could not find a single tool that worked for either. So he built the one he needed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-foam-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-foam-text leading-tight">
              We are building the{" "}
              <span className="relative inline-block">
                infrastructure layer
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-foam-accent rounded-full" />
              </span>{" "}
              for auto detailing.
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Why Atlanta */}
      <section className="py-20 bg-foam-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-4xl text-foam-text mb-6">Why Atlanta.</h2>
            <p className="font-body text-foam-text-secondary leading-relaxed mb-4">
              Atlanta is where FOAM was born and where it launches first. The city has a dense, competitive detailing market — mobile operators, multi-bay shops, and hybrid businesses of every size operating across the metro.
            </p>
            <p className="font-body text-foam-text-secondary leading-relaxed mb-4">
              It&apos;s also a city where car culture runs deep. Detailing here isn&apos;t a luxury — it&apos;s an industry. That makes it the right place to build, stress-test, and refine a platform before expanding nationally.
            </p>
            <p className="font-body text-foam-text-secondary leading-relaxed">
              The Atlanta founding operator cohort isn&apos;t just a beta program — it&apos;s the ground floor of what FOAM becomes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
            className="aspect-[4/3] rounded-card border border-foam-border bg-foam-bg-secondary flex items-center justify-center"
          >
            <p className="font-body text-xs text-foam-text-tertiary text-center px-6">
              Atlanta — FOAM launch market and home base
            </p>
          </motion.div>
        </div>
      </section>

      {/* Founder Credibility */}
      <section className="py-20 bg-foam-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="aspect-[4/3] rounded-card border border-white/10 bg-white/5 flex items-center justify-center"
          >
            <p className="font-body text-xs text-white/40 text-center px-6">
              Founder photography — van and shop bay
            </p>
          </motion.div>

          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-4xl text-white mb-6">
              Built with operator experience across every model.
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { label: "Mobile detailing", desc: "Running routes, pricing jobs, chasing payments, managing schedules from a van." },
                { label: "Fixed-location shops", desc: "Bay management, drop-offs, walk-ins, staffing, and customer retention." },
                { label: "Hybrid logistics", desc: "Operating both simultaneously — the most complex version of the problem." },
              ].map((item) => (
                <div key={item.label} className="flex gap-4">
                  <div className="w-1.5 flex-shrink-0 bg-foam-accent rounded-full mt-1" />
                  <div>
                    <p className="font-body font-semibold text-sm text-white mb-0.5">{item.label}</p>
                    <p className="font-body text-xs text-foam-tint/80 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-foam-tint">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...scrollReveal}>
            <h2 className="font-display font-bold text-4xl text-foam-text mb-4">
              Join the Atlanta launch.
            </h2>
            <p className="font-body text-foam-text-secondary leading-relaxed mb-8 max-w-lg mx-auto">
              Be part of the first cohort of operators who helped build FOAM from the ground up.
            </p>
            <Button href="/for-detailers" size="lg">Apply as a Founding Operator</Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}

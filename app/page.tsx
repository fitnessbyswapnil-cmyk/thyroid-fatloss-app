"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Heart, Zap, Moon, Target, Star, ChevronRight } from "lucide-react"

const features = [
  { icon: Heart, label: "Thyroid Recovery", desc: "Personalized healing protocols" },
  { icon: Zap, label: "Energy Restoration", desc: "Feel vibrant again" },
  { icon: Moon, label: "Sleep Optimization", desc: "Deep, restorative rest" },
  { icon: Target, label: "Weight Management", desc: "Sustainable fat loss" },
]

const testimonials = [
  { name: "Priya S.", result: "Lost 8.5 kg in 12 weeks", quote: "My energy is back to what it was 10 years ago!" },
  { name: "Anita M.", result: "TSH normalized in 8 weeks", quote: "Dr. Rashmi changed my life completely." },
  { name: "Kavita R.", result: "Lost 6.2 kg in 10 weeks", quote: "Finally, someone who understands thyroid issues!" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#090c14" }}>
      {/* Ambient Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(45, 212, 191, 0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <h1 
          className="text-2xl font-bold"
          style={{ 
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontStyle: "italic",
            color: "#e8eaf0"
          }}
        >
          ThyroWell
        </h1>
        <div className="flex items-center gap-4">
          <Link 
            href="/auth/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: "#7e8a9e" }}
          >
            Sign In
          </Link>
          <Link 
            href="/auth/sign-up"
            className="text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
            style={{ 
              background: "rgba(45, 212, 191, 0.15)",
              color: "#2dd4bf",
              border: "1px solid rgba(45, 212, 191, 0.3)"
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ 
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)"
            }}
          >
            <Star size={14} style={{ color: "#f59e0b" }} />
            <span className="text-xs font-medium" style={{ color: "#f59e0b" }}>
              Premium Thyroid Coaching Program
            </span>
          </div>

          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: "#e8eaf0" }}
          >
            Transform Your
            <br />
            <span 
              style={{ 
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: "italic",
                color: "#2dd4bf"
              }}
            >
              Thyroid Health
            </span>
          </h2>

          <p 
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "#7e8a9e" }}
          >
            Expert-guided recovery for hypothyroidism and Hashimoto&apos;s. 
            Lose stubborn weight, restore energy, and reclaim your vitality.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold"
                style={{
                  background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                  color: "#0a0d14",
                  boxShadow: "0 12px 40px rgba(45, 212, 191, 0.3)",
                }}
              >
                Start Your Transformation
                <ArrowRight size={18} />
              </Link>
            </motion.div>
            <Link
              href="#testimonials"
              className="inline-flex items-center gap-2 px-6 py-4 text-sm font-medium"
              style={{ color: "#7e8a9e" }}
            >
              See Success Stories
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-6 rounded-2xl text-center"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(45, 212, 191, 0.1)" }}
              >
                <feature.icon size={22} style={{ color: "#2dd4bf" }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: "#e8eaf0", fontSize: 14 }}>
                {feature.label}
              </h3>
              <p className="text-xs" style={{ color: "#7e8a9e" }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <h3 
          className="text-2xl font-bold text-center mb-12"
          style={{ color: "#e8eaf0" }}
        >
          Real Transformations
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="p-6 rounded-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div 
                className="inline-block px-3 py-1 rounded-full mb-4"
                style={{ background: "rgba(45, 212, 191, 0.1)" }}
              >
                <span className="text-xs font-medium" style={{ color: "#2dd4bf" }}>
                  {t.result}
                </span>
              </div>
              <p 
                className="mb-4 leading-relaxed"
                style={{ color: "#c9cdd5", fontSize: 14, fontStyle: "italic" }}
              >
                &quot;{t.quote}&quot;
              </p>
              <p className="text-sm font-medium" style={{ color: "#7e8a9e" }}>
                {t.name}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 max-w-3xl mx-auto text-center">
        <div
          className="p-10 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)",
            border: "1px solid rgba(45, 212, 191, 0.2)",
          }}
        >
          <h3 
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: "#e8eaf0" }}
          >
            Ready to Begin Your Healing Journey?
          </h3>
          <p className="mb-8" style={{ color: "#7e8a9e" }}>
            Join hundreds of women who have transformed their thyroid health with our expert coaching.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold"
              style={{
                background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                color: "#0a0d14",
                boxShadow: "0 12px 40px rgba(45, 212, 191, 0.3)",
              }}
            >
              Start Your Transformation
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "#404858" }}>
            2024 ThyroWell. Premium Thyroid Coaching.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs" style={{ color: "#7e8a9e" }}>Privacy</Link>
            <Link href="#" className="text-xs" style={{ color: "#7e8a9e" }}>Terms</Link>
            <Link href="#" className="text-xs" style={{ color: "#7e8a9e" }}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

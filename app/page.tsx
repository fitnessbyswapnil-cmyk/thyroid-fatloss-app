"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Heart, Zap, Moon, Target, Star, ChevronRight } from "lucide-react"

const features = [
  { icon: Heart, label: "Personalized Coaching", desc: "Plans built around your life" },
  { icon: Zap, label: "Energy & Vitality", desc: "Habits to help you feel your best" },
  { icon: Moon, label: "Better Sleep Routines", desc: "Restful, consistent evenings" },
  { icon: Target, label: "Sustainable Habits", desc: "A lifestyle-first approach" },
]

const testimonials = [
  { name: "Priya S.", result: "More energy by week 12", quote: "I finally have a routine that fits my life." },
  { name: "Anita M.", result: "A sustainable routine", quote: "Having someone guide and check in on me kept me consistent." },
  { name: "Kavita R.", result: "Consistent support", quote: "I feel listened to and supported every week." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F4F0E8" }}>
      {/* Ambient Glow */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(21, 94, 86, 0.12) 0%, transparent 70%)",
          filter: "blur(80px)" }}
      />

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <h1 
          className="text-2xl font-bold"
          style={{ 
            fontFamily: "'Newsreader', Georgia, serif", 
            color: "#1c1d20"
          }}
        >
          ThyroWell
        </h1>
        <div className="flex items-center gap-4">
          <Link 
            href="/auth/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: "#8b867c" }}
          >
            Sign In
          </Link>
          <Link
            href="/request-access"
            className="text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
            style={{ 
              background: "rgba(21, 94, 86, 0.15)",
              color: "#155e56",
              border: "1px solid rgba(21, 94, 86, 0.3)"
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
              background: "rgba(151, 103, 27, 0.1)",
              border: "1px solid rgba(151, 103, 27, 0.2)"
            }}
          >
            <Star size={14} style={{ color: "#97671b" }} />
            <span className="text-xs font-medium" style={{ color: "#97671b" }}>
              Premium Wellness Coaching
            </span>
          </div>

          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: "#1c1d20" }}
          >
            Feel Your Best,
            <br />
            <span
              style={{
                fontFamily: "'Newsreader', Georgia, serif", 
                color: "#155e56"
              }}
            >
              One Habit at a Time
            </span>
          </h2>

          <p
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "#8b867c" }}
          >
            Personalized wellness coaching for women navigating thyroid health.
            Build sustainable habits around nutrition, movement, sleep, and energy —
            with a coach in your corner.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/request-access"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold"
                style={{
                  background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)",
                  color: "#F6F3ED",
                  boxShadow: "0 12px 40px rgba(21, 94, 86, 0.3)" }}
              >
                Start Your Transformation
                <ArrowRight size={18} />
              </Link>
            </motion.div>
            <Link
              href="#testimonials"
              className="inline-flex items-center gap-2 px-6 py-4 text-sm font-medium"
              style={{ color: "#8b867c" }}
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
                background: "#FDFBF7",
                border: "1px solid #e2dbcd" }}
            >
              <div 
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(21, 94, 86, 0.1)" }}
              >
                <feature.icon size={22} style={{ color: "#155e56" }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: "#1c1d20", fontSize: 14 }}>
                {feature.label}
              </h3>
              <p className="text-xs" style={{ color: "#8b867c" }}>
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
          style={{ color: "#1c1d20" }}
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
                background: "#FDFBF7",
                border: "1px solid #e2dbcd" }}
            >
              <div 
                className="inline-block px-3 py-1 rounded-full mb-4"
                style={{ background: "rgba(21, 94, 86, 0.1)" }}
              >
                <span className="text-xs font-medium" style={{ color: "#155e56" }}>
                  {t.result}
                </span>
              </div>
              <p 
                className="mb-4 leading-relaxed"
                style={{ color: "#3c3a34", fontSize: 14 }}
              >
                &quot;{t.quote}&quot;
              </p>
              <p className="text-sm font-medium" style={{ color: "#8b867c" }}>
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
            background: "linear-gradient(135deg, rgba(21, 94, 86, 0.1) 0%, rgba(21, 94, 86, 0.13) 100%)",
            border: "1px solid rgba(21, 94, 86, 0.2)" }}
        >
          <h3
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: "#1c1d20" }}
          >
            Ready to Start Your Wellness Journey?
          </h3>
          <p className="mb-8" style={{ color: "#8b867c" }}>
            Join women building healthier, sustainable habits with personalized coaching and weekly support.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/request-access"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold"
              style={{
                background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)",
                color: "#F6F3ED",
                boxShadow: "0 12px 40px rgba(21, 94, 86, 0.3)" }}
            >
              Start Your Transformation
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-10 border-t" style={{ borderColor: "#e2dbcd" }}>
        <div className="max-w-3xl mx-auto text-center mb-8">
          <p className="text-xs leading-relaxed" style={{ color: "#a09a8e" }}>
            ThyroWell is a wellness coaching program, not medical treatment or a substitute for your
            doctor. Always consult a qualified healthcare professional about your health. Individual
            results vary.
          </p>
        </div>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "#cfc7b6" }}>
            © 2026 ThyroWell. Premium Wellness Coaching.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs" style={{ color: "#8b867c" }}>Privacy</Link>
            <Link href="/terms" className="text-xs" style={{ color: "#8b867c" }}>Terms</Link>
            <a href="mailto:hello@thyrowell.example" className="text-xs" style={{ color: "#8b867c" }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

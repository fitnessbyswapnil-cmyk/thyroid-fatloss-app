"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight, ArrowLeft, Loader2, Check, Heart, Scale, Pill, ShieldCheck } from "lucide-react"

type Step = "welcome" | "consent" | "health" | "goals" | "complete"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("welcome")
  const [isLoading, setIsLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    age: "",
    gender: "female",
    currentWeight: "",
    targetWeight: "",
    thyroidCondition: "",
    medications: "",
    allergies: "",
    tshBefore: "",
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleComplete = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { error } = await supabase
      .from("clients")
      .update({
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        current_weight: formData.currentWeight ? parseFloat(formData.currentWeight) : null,
        start_weight: formData.currentWeight ? parseFloat(formData.currentWeight) : null,
        target_weight: formData.targetWeight ? parseFloat(formData.targetWeight) : null,
        thyroid_condition: formData.thyroidCondition,
        medications: formData.medications,
        allergies: formData.allergies,
        tsh_before: formData.tshBefore ? parseFloat(formData.tshBefore) : null,
        tsh_current: formData.tshBefore ? parseFloat(formData.tshBefore) : null,
        consent_at: new Date().toISOString(),
        onboarding_completed: true,
        recovery_score: 0,
        wellness_score: 50,
        streak_current: 0,
        streak_best: 0,
      })
      .eq("id", user.id)

    if (error) {
      console.error("Error updating profile:", error)
      setIsLoading(false)
      return
    }

    // No auto-redirect: the completion screen offers an optional blood-report
    // upload (or straight to the dashboard).
    setStep("complete")
    setIsLoading(false)
  }

  const nextStep = () => {
    if (step === "welcome") setStep("consent")
    else if (step === "consent") setStep("health")
    else if (step === "health") setStep("goals")
    else if (step === "goals") handleComplete()
  }

  const prevStep = () => {
    if (step === "consent") setStep("welcome")
    else if (step === "health") setStep("consent")
    else if (step === "goals") setStep("health")
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#fdfbf7" }}
    >
      {/* Ambient glow */}
      <div 
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(21, 94, 86, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="w-full max-w-lg relative">
        {/* Progress indicator */}
        {step !== "complete" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {["welcome", "consent", "health", "goals"].map((s, i) => (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: step === s ? 32 : 8,
                  background: ["welcome", "consent", "health", "goals"].indexOf(step) >= i
                    ? "#155e56"
                    : "#cfc7b6",
                }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: "rgba(21, 94, 86, 0.15)" }}
              >
                <Heart size={36} style={{ color: "#155e56" }} />
              </div>
              
              <h1 
                className="text-3xl font-bold mb-3"
                style={{ 
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontStyle: "italic",
                  color: "#1c1d20"
                }}
              >
                Welcome to ThyroWell
              </h1>
              <p className="mb-8 leading-relaxed" style={{ color: "#8b867c" }}>
                Let&apos;s personalize your wellness journey. This will only take a minute.
              </p>

              <motion.button
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium"
                style={{
                  background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)",
                  color: "#fdfbf7",
                  boxShadow: "0 8px 32px rgba(21, 94, 86, 0.25)",
                }}
              >
                Begin Setup
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

          {/* Step: Health-data consent (required before any health questions) */}
          {step === "consent" && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <ShieldCheck size={32} className="mx-auto mb-4" style={{ color: "#155e56" }} />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#1c1d20" }}>
                  Your consent
                </h2>
                <p className="text-sm" style={{ color: "#8b867c" }}>
                  Before we ask about your health, please review and agree
                </p>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#3c3a34" }}>
                  ThyroWell is a <strong>wellness coaching program, not medical treatment or a
                  substitute for your doctor.</strong> To personalize your coaching, we collect and
                  securely store health information you provide — such as your weight, thyroid
                  condition, and medications. Individual results vary.
                </p>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-5 h-5 mt-0.5 shrink-0"
                    style={{ accentColor: "#155e56" }}
                  />
                  <span className="text-sm" style={{ color: "#1c1d20" }}>
                    I consent to ThyroWell collecting and storing my health information to provide
                    coaching, and I agree to the{" "}
                    <Link href="/privacy" target="_blank" style={{ color: "#155e56" }}>Privacy Policy</Link>{" "}
                    and{" "}
                    <Link href="/terms" target="_blank" style={{ color: "#155e56" }}>Terms</Link>.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={prevStep} className="flex items-center gap-2 text-sm font-medium" style={{ color: "#8b867c" }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <motion.button
                  onClick={nextStep}
                  disabled={!consent}
                  whileHover={consent ? { scale: 1.02 } : {}}
                  whileTap={consent ? { scale: 0.98 } : {}}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm disabled:opacity-50"
                  style={{
                    background: consent ? "linear-gradient(135deg, #155e56 0%, #155e56 100%)" : "#cfc7b6",
                    color: consent ? "#fdfbf7" : "#8b867c",
                  }}
                >
                  Continue <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Health Info */}
          {step === "health" && (
            <motion.div
              key="health"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <Scale size={32} className="mx-auto mb-4" style={{ color: "#155e56" }} />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#1c1d20" }}>
                  Your Health Profile
                </h2>
                <p className="text-sm" style={{ color: "#8b867c" }}>
                  Help us understand your current health status
                </p>
              </div>

              <div
                className="p-6 rounded-2xl space-y-5"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2dbcd",
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                      Age
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                      placeholder="35"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.currentWeight}
                      onChange={(e) => updateField("currentWeight", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                      placeholder="75.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                      Latest TSH Level
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tshBefore}
                      onChange={(e) => updateField("tshBefore", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                      placeholder="5.2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                    Thyroid Condition
                  </label>
                  <select
                    value={formData.thyroidCondition}
                    onChange={(e) => updateField("thyroidCondition", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                  >
                    <option value="">Select condition</option>
                    <option value="hypothyroidism">Hypothyroidism</option>
                    <option value="hashimotos">Hashimoto&apos;s Disease</option>
                    <option value="hyperthyroidism">Hyperthyroidism</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "#8b867c" }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <motion.button
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm"
                  style={{
                    background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)",
                    color: "#fdfbf7",
                  }}
                >
                  Continue
                  <ArrowRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Goals */}
          {step === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <Pill size={32} className="mx-auto mb-4" style={{ color: "#155e56" }} />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#1c1d20" }}>
                  Your Goals & Medications
                </h2>
                <p className="text-sm" style={{ color: "#8b867c" }}>
                  Tell us about your goals and current medications
                </p>
              </div>

              <div
                className="p-6 rounded-2xl space-y-5"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2dbcd",
                }}
              >
                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                    Target Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.targetWeight}
                    onChange={(e) => updateField("targetWeight", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                    placeholder="65.0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                    Current Medications
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => updateField("medications", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                    style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                    placeholder="e.g., Thyronorm 50mcg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
                    Food Allergies (if any)
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                    placeholder="e.g., Gluten, Dairy"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "#8b867c" }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <motion.button
                  onClick={nextStep}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm"
                  style={{
                    background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)",
                    color: "#fdfbf7",
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{
                  background: "rgba(21, 94, 86, 0.15)",
                  border: "1px solid rgba(21, 94, 86, 0.3)",
                }}
              >
                <Check size={36} style={{ color: "#155e56" }} />
              </motion.div>
              
              <h1
                className="text-2xl font-bold mb-3"
                style={{ color: "#1c1d20" }}
              >
                You&apos;re All Set!
              </h1>
              <p className="mb-2" style={{ color: "#8b867c" }}>
                Your personalized wellness journey begins now.
              </p>
              <p className="text-sm mb-6" style={{ color: "#5a564e", lineHeight: 1.5 }}>
                One optional step: have a recent blood report? Add it and we&apos;ll
                track your values with your progress — you can also do this anytime later.
              </p>
              <button
                onClick={() => router.push("/dashboard/health")}
                className="w-full h-12 rounded-full font-bold text-sm mb-3"
                style={{ background: "#155e56", color: "#dfe7dd", boxShadow: "0 8px 24px rgba(21, 94, 86,0.25)" }}
              >
                Add my blood report
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 rounded-full text-sm font-medium"
                style={{ color: "#8b867c" }}
              >
                Skip for now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

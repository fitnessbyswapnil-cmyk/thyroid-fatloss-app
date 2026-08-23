"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ACTIVITY } from "@/lib/plans/targets"
import { ArrowRight, ArrowLeft, Loader2, Check, Heart, Scale, Pill, ShieldCheck , AlertCircle} from "lucide-react"

type Step = "welcome" | "consent" | "health" | "goals" | "complete"

// Mirrors the clients_height_cm_sane constraint (migration 021). Checked here so
// a slipped digit is a sentence under the field, not a Postgres error at the end
// of four screens.
const HEIGHT_MIN_CM = 100
const HEIGHT_MAX_CM = 250

// health_profiles.diagnosis uses the vocabulary of the health screen's select
// (components/health/HealthView.tsx). A value outside that list renders there as
// an empty dropdown, so the onboarding slugs are translated rather than copied.
const DIAGNOSIS_LABEL: Record<string, string> = {
  hypothyroidism: "Hypothyroid",
  hashimotos: "Hashimoto's",
  hyperthyroidism: "Hyperthyroid",
  other: "Other",
}

const SAVE_FAILED_MESSAGE =
  "That didn't save — you're still connected, but the details didn't reach us. Nothing you typed has been lost; tap to try again."

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("welcome")
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    age: "",
    gender: "female",
    currentWeight: "",
    heightCm: "",
    activityLevel: "",
    targetWeight: "",
    thyroidCondition: "",
    medications: "",
    allergies: "",
    tshBefore: "",
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const heightCm = formData.heightCm.trim() === "" ? null : Number(formData.heightCm)
  const heightOutOfRange =
    heightCm !== null && (!Number.isFinite(heightCm) || heightCm < HEIGHT_MIN_CM || heightCm > HEIGHT_MAX_CM)

  const handleComplete = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    // The health screens, the meal-plan allergy filter and the Week 0 checklist
    // all read health_profiles, never the clients columns — so writing only
    // clients left her medication card blank and then asked her for the
    // medication she had just typed. Written before the clients update because
    // that update carries onboarding_completed: if this one fails she is not yet
    // marked done, and "try again" replays both cleanly.
    // Empty answers are left out of the payload rather than sent as null, so a
    // second pass through onboarding cannot erase something she has since filled
    // in on /dashboard/health.
    const answered: Record<string, unknown> = {}
    const diagnosis = DIAGNOSIS_LABEL[formData.thyroidCondition]
    if (diagnosis) answered.diagnosis = diagnosis
    if (formData.medications.trim()) answered.medication = formData.medications.trim()
    if (formData.allergies.trim()) answered.allergies = formData.allergies.trim()

    if (Object.keys(answered).length > 0) {
      const { error: profileError } = await supabase
        .from("health_profiles")
        .upsert(
          { client_id: user.id, updated_at: new Date().toISOString(), ...answered },
          { onConflict: "client_id" },
        )

      if (profileError) {
        console.error("Error saving health profile:", profileError)
        setSubmitError(SAVE_FAILED_MESSAGE)
        setIsLoading(false)
        return
      }
    }

    const { error } = await supabase
      .from("clients")
      .update({
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        current_weight: formData.currentWeight ? parseFloat(formData.currentWeight) : null,
        start_weight: formData.currentWeight ? parseFloat(formData.currentWeight) : null,
        height_cm: heightCm,
        activity_level: formData.activityLevel || null,
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
      // This used to stop the spinner and do nothing at all. She had typed four
      // screens, the form lives only in React state, and a refresh loses all of
      // it — so a silent failure here is the single worst moment in the app.
      // This is also the one write that travels over HER connection, so it is
      // the place patchy mobile data actually bites.
      console.error("Error updating profile:", error)
      setSubmitError(SAVE_FAILED_MESSAGE)
      setIsLoading(false)
      return
    }
    setSubmitError(null)

    // No auto-redirect: the completion screen offers an optional blood-report
    // upload (or straight to the dashboard).
    setStep("complete")
    setIsLoading(false)
  }

  const nextStep = () => {
    if (step === "welcome") setStep("consent")
    else if (step === "consent") setStep("health")
    // Catching an impossible height here keeps the note beside the field she
    // typed it in, instead of surfacing three screens later as a failed save.
    else if (step === "health") { if (!heightOutOfRange) setStep("goals") }
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
      style={{ background: "#090c14" }}
    >
      {/* Ambient glow */}
      <div 
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(45, 212, 191, 0.08) 0%, transparent 70%)",
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
                    ? "#2dd4bf"
                    : "rgba(255, 255, 255, 0.1)",
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
                style={{ background: "rgba(45, 212, 191, 0.15)" }}
              >
                <Heart size={36} style={{ color: "#2dd4bf" }} />
              </div>
              
              <h1 
                className="text-3xl font-bold mb-3"
                style={{ 
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  color: "#e8eaf0"
                }}
              >
                Welcome to ThyroWell
              </h1>
              <p className="mb-8 leading-relaxed" style={{ color: "#7e8a9e" }}>
                Let&apos;s personalize your wellness journey. This will only take a minute.
              </p>

              <motion.button
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium"
                style={{
                  background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                  color: "#0a0d14",
                  boxShadow: "0 8px 32px rgba(45, 212, 191, 0.25)",
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
                <ShieldCheck size={32} className="mx-auto mb-4" style={{ color: "#2dd4bf" }} />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
                  Your consent
                </h2>
                <p className="text-sm" style={{ color: "#7e8a9e" }}>
                  Before we ask about your health, please review and agree
                </p>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#c9cdd5" }}>
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
                    style={{ accentColor: "#2dd4bf" }}
                  />
                  <span className="text-sm" style={{ color: "#e8eaf0" }}>
                    I consent to ThyroWell collecting and storing my health information to provide
                    coaching, and I agree to the{" "}
                    <Link href="/privacy" target="_blank" style={{ color: "#2dd4bf" }}>Privacy Policy</Link>{" "}
                    and{" "}
                    <Link href="/terms" target="_blank" style={{ color: "#2dd4bf" }}>Terms</Link>.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={prevStep} className="flex items-center gap-2 text-sm font-medium" style={{ color: "#7e8a9e" }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <motion.button
                  onClick={nextStep}
                  disabled={!consent}
                  whileHover={consent ? { scale: 1.02 } : {}}
                  whileTap={consent ? { scale: 0.98 } : {}}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm disabled:opacity-50"
                  style={{
                    background: consent ? "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)" : "rgba(255,255,255,0.1)",
                    color: consent ? "#0a0d14" : "#7e8a9e",
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
                <Scale size={32} className="mx-auto mb-4" style={{ color: "#2dd4bf" }} />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
                  Your Health Profile
                </h2>
                <p className="text-sm" style={{ color: "#7e8a9e" }}>
                  Help us understand your current health status
                </p>
              </div>

              <div
                className="p-6 rounded-2xl space-y-5"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                      Age
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                      placeholder="35"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.currentWeight}
                      onChange={(e) => updateField("currentWeight", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                      placeholder="75.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={HEIGHT_MIN_CM}
                      max={HEIGHT_MAX_CM}
                      value={formData.heightCm}
                      onChange={(e) => updateField("heightCm", e.target.value)}
                      aria-invalid={heightOutOfRange}
                      aria-describedby={heightOutOfRange ? "height-note" : undefined}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                      placeholder="158"
                    />
                    {heightOutOfRange && (
                      <p id="height-note" className="text-[11.5px] mt-2" style={{ color: "#f59e0b", lineHeight: 1.5 }}>
                        Height in centimetres, please — somewhere between {HEIGHT_MIN_CM} and {HEIGHT_MAX_CM}.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                      Latest TSH Level
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tshBefore}
                      onChange={(e) => updateField("tshBefore", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                      placeholder="5.2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                      Daily Activity
                    </label>
                    {/* Options come from ACTIVITY so the stored value always
                        matches what the calorie estimate multiplies by. */}
                    <select
                      value={formData.activityLevel}
                      onChange={(e) => updateField("activityLevel", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                    >
                      <option value="">Select activity</option>
                      {ACTIVITY.map((a) => (
                        <option key={a.key} value={a.key}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                    Thyroid Condition
                  </label>
                  <select
                    value={formData.thyroidCondition}
                    onChange={(e) => updateField("thyroidCondition", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
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
                  style={{ color: "#7e8a9e" }}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                {/* Muted while the height is impossible, matching the consent
                    step. nextStep already refuses to advance, and a full-colour
                    button that silently does nothing when tapped reads as the
                    app being broken rather than as something to correct. */}
                <motion.button
                  onClick={nextStep}
                  disabled={heightOutOfRange}
                  whileHover={heightOutOfRange ? {} : { scale: 1.02 }}
                  whileTap={heightOutOfRange ? {} : { scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm disabled:opacity-50"
                  style={{
                    background: heightOutOfRange
                      ? "rgba(255,255,255,0.1)"
                      : "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                    color: heightOutOfRange ? "#7e8a9e" : "#0a0d14",
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
                <Pill size={32} className="mx-auto mb-4" style={{ color: "#2dd4bf" }} />
                <h2 className="text-xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
                  Your Goals & Medications
                </h2>
                <p className="text-sm" style={{ color: "#7e8a9e" }}>
                  Tell us about your goals and current medications
                </p>
              </div>

              <div
                className="p-6 rounded-2xl space-y-5"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                    Target Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.targetWeight}
                    onChange={(e) => updateField("targetWeight", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                    placeholder="65.0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                    Current Medications
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => updateField("medications", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                    style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                    placeholder="e.g., Thyronorm 50mcg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                    Food Allergies (if any)
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#e8eaf0" }}
                    placeholder="e.g., Gluten, Dairy"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "#7e8a9e" }}
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
                    background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                    color: "#0a0d14",
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

              {/* A failure here has to be visible and recoverable. Her answers
                  are still in state, so "try again" genuinely works — but only
                  if she is told to. */}
              {submitError && (
                <div
                  className="mt-4 px-4 py-3 rounded-xl flex items-start gap-2.5"
                  style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.30)" }}
                  role="alert"
                >
                  <AlertCircle size={15} style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }} />
                  <p className="text-[12.5px]" style={{ color: "#e8eaf0", lineHeight: 1.55 }}>
                    {submitError}
                  </p>
                </div>
              )}
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
                  background: "rgba(45, 212, 191, 0.15)",
                  border: "1px solid rgba(45, 212, 191, 0.3)",
                }}
              >
                <Check size={36} style={{ color: "#2dd4bf" }} />
              </motion.div>
              
              <h1
                className="text-2xl font-bold mb-3"
                style={{ color: "#e8eaf0" }}
              >
                You&apos;re All Set!
              </h1>
              <p className="mb-2" style={{ color: "#7e8a9e" }}>
                Your personalized wellness journey begins now.
              </p>
              <p className="text-sm mb-6" style={{ color: "#a9b2c1", lineHeight: 1.5 }}>
                One optional step: have a recent blood report? Add it and we&apos;ll
                track your values with your progress — you can also do this anytime later.
              </p>
              <button
                onClick={() => router.push("/dashboard/health")}
                className="w-full h-12 rounded-full font-bold text-sm mb-3"
                style={{ background: "#2dd4bf", color: "#06231f", boxShadow: "0 8px 24px rgba(45,212,191,0.25)" }}
              >
                Add my blood report
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 rounded-full text-sm font-medium"
                style={{ color: "#7e8a9e" }}
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

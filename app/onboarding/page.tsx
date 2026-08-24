"use client"

import { useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ACTIVITY } from "@/lib/plans/targets"
import {
  ONBOARDING_OUTLINE,
  PREF_QUESTIONS,
  PREF_SCREENS,
  QUESTIONS_BY_SCREEN,
  labelFor,
  type PrefKey,
  type PrefQuestion,
} from "@/lib/plans/preferences"
import {
  ArrowRight, ArrowLeft, Loader2, Check, Heart, Scale, Pill, ShieldCheck, AlertCircle,
  ListChecks, User, Activity, Target, FlaskConical, Leaf, Egg, Drumstick, Sprout,
  Utensils, Wheat, Soup, Cookie, Fish, CookingPot, ChefHat, Users, ShoppingBag,
  Clock, Home, Package, CircleOff, Coffee, CircleHelp, Circle,
  type LucideIcon,
} from "lucide-react"

// `prefsN` rather than four named steps: the food screens come from PREF_SCREENS,
// so adding a fifth one there must not need a step, a dot and a Continue edited
// by hand here.
type Step = "welcome" | "outline" | "consent" | "health" | `prefs${number}` | "goals" | "complete"

const prefStep = (screen: number): Step => `prefs${screen}`

// The step order, and the only place it is written down. The progress dots,
// Continue and Back all derive from it, so a screen inserted here moves all
// three together — no index counted out by hand.
const FLOW: Step[] = [
  "welcome",
  "outline",
  "consent",
  "health",
  ...PREF_SCREENS.map((s) => prefStep(s.screen)),
  "goals",
]

// Mirrors the clients_height_cm_sane constraint (migration 021). Checked here so
// a slipped digit is a sentence under the field, not a Postgres error at the end
// of four screens.
/**
 * Every text input and textarea in onboarding.
 *
 * fontSize 16 is load-bearing, not cosmetic: under it, iOS zooms the page on
 * focus and does not zoom back out on blur — so one tap on the age field left
 * her completing four two-column tap screens at a cropped viewport. The layout
 * viewport sets maximumScale and userScalable, both of which iOS has ignored
 * for this case since iOS 10.
 */
const FIELD_STYLE = {
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  color: "#e8eaf0",
  fontSize: 16,
} as const

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

// preferences.ts names its icons as plain strings so it stays free of React and
// can be read by the coach panel and the generator too. They are resolved here
// through one explicit map — never lucide[name] or a dynamic import, which
// defeats tree-shaking and turns a typo into a blank screen instead of a dull
// circle.
const ICONS: Record<string, LucideIcon> = {
  user: User,
  activity: Activity,
  target: Target,
  flask: FlaskConical,
  leaf: Leaf,
  egg: Egg,
  drumstick: Drumstick,
  sprout: Sprout,
  utensils: Utensils,
  wheat: Wheat,
  soup: Soup,
  cookie: Cookie,
  fish: Fish,
  bowl: CookingPot,
  chef: ChefHat,
  users: Users,
  bag: ShoppingBag,
  clock: Clock,
  home: Home,
  box: Package,
  off: CircleOff,
  coffee: Coffee,
  help: CircleHelp,
}
const iconFor = (name?: string): LucideIcon => (name ? ICONS[name] ?? Circle : Circle)

// One per food screen, by screen number rather than by position, so reordering
// PREF_SCREENS cannot silently hand screen 3 the coffee cup meant for screen 4.
const PREF_SCREEN_ICONS: Record<number, LucideIcon> = { 1: Utensils, 2: ChefHat, 3: Coffee, 4: CircleOff }

/**
 * Selected state is an inline style object on purpose, not a class name.
 * Composing a class from a variable (`border-${selected ? "teal" : "white"}/30`)
 * has already shipped as a bug on this project once: Tailwind scans source text,
 * never sees the composed string, drops the rule, and the chosen card renders
 * identical to the ones she didn't choose. Inline styles cannot be dropped.
 */
const OPTION_IDLE: CSSProperties = {
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
}
const OPTION_SELECTED: CSSProperties = {
  background: "rgba(45, 212, 191, 0.16)",
  border: "1px solid rgba(45, 212, 191, 0.45)",
  boxShadow: "0 0 0 1px rgba(45, 212, 191, 0.15)",
}
const CARD_SHELL: CSSProperties = {
  background: "rgba(255, 255, 255, 0.03)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
}
const TAG: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  borderRadius: 999,
  padding: "3px 8px",
  flexShrink: 0,
}

type PrefAnswers = Partial<Record<PrefKey, string | string[]>>

const isAnswered = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.length > 0 : Boolean(value)

// A screen carrying an optional question is a screen she can walk past whole:
// screens 1 and 2 are what the generator genuinely cannot work without, 3 and 4
// only make the plan better. Read off the questions rather than listed, so a new
// screen decides this from its own contents.
const isSkippableScreen = (screen: number) => QUESTIONS_BY_SCREEN(screen).some((q) => q.optional)

// The one free-text box in all of this belongs beside the "anything you avoid"
// question, wherever that question ends up living.
const screenHasAvoidNote = (screen: number) =>
  QUESTIONS_BY_SCREEN(screen).some((q) => q.key === "avoid")

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

  // Answers are held as the raw option `value` strings, exactly as preferences.ts
  // defines them, and only converted on the way into Postgres. Keeping the UI in
  // one shape lets every food question render from the same code.
  const [prefs, setPrefs] = useState<PrefAnswers>({})
  const [avoidNote, setAvoidNote] = useState("")

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isSelected = (q: PrefQuestion, value: string) => {
    const current = prefs[q.key]
    return Array.isArray(current) ? current.includes(value) : current === value
  }

  const selectOption = (q: PrefQuestion, value: string) => {
    setPrefs((prev) => {
      if (q.kind === "single") return { ...prev, [q.key]: value }
      const current = Array.isArray(prev[q.key]) ? (prev[q.key] as string[]) : []
      return {
        ...prev,
        [q.key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      }
    })
  }

  const clearAnswer = (key: PrefKey) => {
    setPrefs((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // Skip clears only the OPTIONAL questions on the screen.
  //
  // It used to clear every one of them, and screen 3 qualifies as skippable
  // because of its optional tablet question while its caffeine question is
  // required — so a woman who answered "1-2 cups" and then decided not to
  // answer the tablet question lost the caffeine answer too, silently, and
  // caffeine is the one field on that screen the plan actually reads.
  const skipScreen = (screen: number) => {
    setPrefs((prev) => {
      const next = { ...prev }
      for (const q of QUESTIONS_BY_SCREEN(screen)) if (q.optional) delete next[q.key]
      return next
    })
    if (screenHasAvoidNote(screen)) setAvoidNote("")
    nextStep()
  }

  const screenReady = (screen: number) =>
    QUESTIONS_BY_SCREEN(screen).every((q) => q.optional || isAnswered(prefs[q.key]))

  // All four food screens are one block of JSX rendered from PREF_SCREENS. Kept
  // as a single nullable value rather than a map inside the tree so
  // AnimatePresence still receives exactly one keyed child.
  const activePref = PREF_SCREENS.find((s) => step === prefStep(s.screen)) ?? null

  /**
   * The allergy string the rest of the app already reads, rebuilt from the
   * chips on screen 4 instead of from a text box.
   *
   * clients.allergies and health_profiles.allergies feed the meal-plan filter
   * and the coach's health screen, so they still have to be populated — but
   * asking her to type "Gluten, Dairy" one screen after she tapped exactly that
   * is the duplicate typing this whole intake was meant to remove.
   */
  const derivedAllergies = () => {
    const tapped = Array.isArray(prefs.avoid) ? (prefs.avoid as string[]) : []
    const labels = tapped.map((v) => labelFor("avoid", v))
    const note = avoidNote.trim()
    return [...labels, ...(note ? [note] : [])].join(", ")
  }

  const heightCm = formData.heightCm.trim() === "" ? null : Number(formData.heightCm)
  const heightOutOfRange =
    heightCm !== null && (!Number.isFinite(heightCm) || heightCm < HEIGHT_MIN_CM || heightCm > HEIGHT_MAX_CM)

  /**
   * Wraps the whole submit so nothing can leave her on a dead button.
   *
   * There was no catch on this function at all. Any rejection the individual
   * guards do not cover — a NavigatorLock timeout from a second tab, for
   * instance — left "Complete Setup" spinning forever with no route back and
   * eight screens of answers still only in memory.
   */
  const handleComplete = async () => {
    try {
      await runComplete()
    } catch (e) {
      console.error("[onboarding] submit failed", e)
      setSubmitError(SAVE_FAILED_MESSAGE)
      setIsLoading(false)
    }
  }

  const runComplete = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    // A network failure here is NOT a signed-out user.
    //
    // auth-js resolves getUser() with { user: null } and an
    // AuthRetryableFetchError when the request cannot be made at all, so one
    // tunnel on the train made this conclude she was logged out. She was not —
    // her session was intact. She got bounced to /auth/login, and everything she
    // had entered lives only in React state, so all eight screens were gone and
    // she was sent back through onboarding from the top.
    //
    // The rest of this function is careful about exactly this: three ordered
    // writes, each keeping her state and offering a retry. This line skipped all
    // of it.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      setSubmitError(SAVE_FAILED_MESSAGE)
      setIsLoading(false)
      return
    }
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
    const allergyText = derivedAllergies()
    if (allergyText) answered.allergies = allergyText

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

    // Same two rules as health_profiles above, for the same two reasons.
    // Ordered before the clients update because that update carries
    // onboarding_completed, and a food-preferences failure that still marked her
    // done would strand her: nothing in the app asks these questions twice.
    // Empty answers are omitted rather than sent as null, so a replay after a
    // failed save — or a second pass through onboarding — cannot blank a
    // preference that is already stored.
    const prefPayload: Record<string, unknown> = {}
    for (const q of PREF_QUESTIONS) {
      const value = prefs[q.key]
      if (Array.isArray(value)) {
        if (value.length > 0) prefPayload[q.key] = value
      } else if (value) {
        // meals_per_day is a smallint. Everything on these screens is a tap on a
        // card, so it arrives as the option's value string and has to be parsed.
        if (q.key === "meals_per_day") {
          const meals = Number(value)
          if (Number.isFinite(meals)) prefPayload[q.key] = meals
        } else {
          prefPayload[q.key] = value
        }
      }
    }
    if (avoidNote.trim()) prefPayload.avoid_note = avoidNote.trim()

    if (Object.keys(prefPayload).length > 0) {
      const { error: prefError } = await supabase
        .from("food_preferences")
        .upsert(
          { client_id: user.id, updated_at: new Date().toISOString(), ...prefPayload },
          { onConflict: "client_id" },
        )

      if (prefError) {
        console.error("Error saving food preferences:", prefError)
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
        allergies: derivedAllergies(),
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
    if (step === "goals") {
      handleComplete()
      return
    }
    // Catching an impossible height here keeps the note beside the field she
    // typed it in, instead of surfacing three screens later as a failed save.
    if (step === "health" && heightOutOfRange) return

    const i = FLOW.indexOf(step)
    if (i >= 0 && i < FLOW.length - 1) setStep(FLOW[i + 1])
  }

  const prevStep = () => {
    const i = FLOW.indexOf(step)
    if (i > 0) setStep(FLOW[i - 1])
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
          <div className="flex items-center justify-center gap-1.5 mb-8">
            {FLOW.map((s, i) => (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: step === s ? 28 : 7,
                  // Compared against the position of the step she is on, so going
                  // back un-fills the dots ahead of her instead of leaving the
                  // bar claiming progress she has walked away from.
                  background: FLOW.indexOf(step) >= i ? "#2dd4bf" : "rgba(255, 255, 255, 0.1)",
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

          {/* Step: what she is about to be asked, before she is asked any of it.
              A tired person abandons a form that could be three screens or
              thirty. Showing the whole shape costs one tap and buys the rest. */}
          {step === "outline" && (
            <motion.div
              key="outline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <ListChecks size={32} className="mx-auto mb-4" style={{ color: "#2dd4bf" }} />
                <h2
                  className="text-2xl mb-2"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}
                >
                  Here&apos;s what we&apos;ll ask
                </h2>
                <p className="text-sm" style={{ color: "#7e8a9e" }}>
                  {ONBOARDING_OUTLINE.length} steps, in this order. Most of it is tapping — about two minutes.
                </p>
              </div>

              <div className="p-5 rounded-2xl space-y-1" style={CARD_SHELL}>
                {ONBOARDING_OUTLINE.map((item) => {
                  const Icon = iconFor(item.icon)
                  return (
                    <div key={item.title} className="flex items-start gap-3.5 py-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(45, 212, 191, 0.10)" }}
                      >
                        <Icon size={17} style={{ color: "#2dd4bf" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[14.5px] font-medium" style={{ color: "#e8eaf0" }}>
                            {item.title}
                          </p>
                          {item.optional && (
                            <span
                              style={{
                                ...TAG,
                                color: "#7e8a9e",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                              }}
                            >
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] mt-0.5" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between mt-8">
                <button onClick={prevStep} className="flex items-center gap-2 text-sm font-medium" style={{ color: "#7e8a9e" }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <motion.button
                  onClick={nextStep}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm"
                  style={{
                    background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                    color: "#0a0d14",
                  }}
                >
                  Start <ArrowRight size={16} />
                </motion.button>
              </div>
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
                      className="w-full px-4 py-3 rounded-xl focus:outline-none"
                      style={FIELD_STYLE}
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
                      className="w-full px-4 py-3 rounded-xl focus:outline-none"
                      style={FIELD_STYLE}
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
                      className="w-full px-4 py-3 rounded-xl focus:outline-none"
                      style={FIELD_STYLE}
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
                      className="w-full px-4 py-3 rounded-xl focus:outline-none"
                      style={FIELD_STYLE}
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
                      className="w-full px-4 py-3 rounded-xl focus:outline-none"
                      style={FIELD_STYLE}
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
                      className="w-full px-4 py-3 rounded-xl focus:outline-none"
                      style={FIELD_STYLE}
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
                    className="w-full px-4 py-3 rounded-xl focus:outline-none"
                    style={FIELD_STYLE}
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

          {/* Steps: food preferences, four screens of nothing but tapping.
              Rendered from PREF_SCREENS / QUESTIONS_BY_SCREEN so the wording,
              the options and the stored values have exactly one home. */}
          {activePref && (() => {
            const ScreenIcon = PREF_SCREEN_ICONS[activePref.screen] ?? Utensils
            const questions = QUESTIONS_BY_SCREEN(activePref.screen)
            const skippable = isSkippableScreen(activePref.screen)
            const ready = screenReady(activePref.screen)

            return (
              <motion.div
                key={prefStep(activePref.screen)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-6">
                  <ScreenIcon size={32} className="mx-auto mb-4" style={{ color: "#2dd4bf" }} />
                  <h2 className="text-xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
                    {activePref.title}
                  </h2>
                  <p className="text-sm" style={{ color: "#7e8a9e" }}>
                    {activePref.blurb}
                  </p>
                </div>

                <div className="space-y-3">
                  {questions.map((q) => {
                    // Options carrying no icon are short enough to read as chips
                    // — the twelve things she might avoid would be a wall of
                    // cards. Decided from the data, not from the screen number.
                    const asChips = q.options.every((o) => !o.icon)
                    // "Skipped" is only true once she has moved past it. On
                    // arrival nothing is answered, and claiming she skipped a
                    // question she has not read — in the same teal used for a
                    // chosen option — is the app putting words in her mouth.
                    const answered = isAnswered(prefs[q.key])

                    return (
                      <div key={q.key} className="p-4 rounded-2xl" style={CARD_SHELL}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[15px] font-medium" style={{ color: "#e8eaf0", lineHeight: 1.45 }}>
                            {q.question}
                          </p>
                          {/* An optional question is never a dead end. The chip
                              shows "Skipped" while nothing is chosen, so it
                              states where she stands rather than sitting there
                              as a button that appears to do nothing. */}
                          {q.optional && (
                            answered ? (
                              <button
                                onClick={() => clearAnswer(q.key)}
                                className="shrink-0"
                                // 44px minimum: this is the only way to un-answer
                                // a single-select, and at the chip's natural size
                                // it was a 20px target at the corner of the card.
                                style={{ ...TAG, cursor: "pointer", color: "#7e8a9e", minHeight: 44, display: "inline-flex", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                              >
                                Clear
                              </button>
                            ) : (
                              <span className="shrink-0" style={{ ...TAG, color: "#7e8a9e", background: "transparent", border: "1px solid rgba(255,255,255,0.08)" }}>
                                Optional
                              </span>
                            )
                          )}
                        </div>

                        {q.why && (
                          <p className="text-[12.5px] mt-1.5" style={{ color: "#7e8a9e", lineHeight: 1.55 }}>
                            {q.why}
                          </p>
                        )}

                        <div className={`mt-3 ${asChips ? "flex flex-wrap gap-2" : "grid grid-cols-2 gap-2"}`}>
                          {q.options.map((opt) => {
                            const selected = isSelected(q, opt.value)
                            const OptionIcon = iconFor(opt.icon)

                            return (
                              <motion.button
                                key={opt.value}
                                onClick={() => selectOption(q, opt.value)}
                                whileTap={{ scale: 0.97 }}
                                aria-pressed={selected}
                                className={`rounded-xl text-left transition-colors ${asChips ? "px-3.5 py-2.5" : "px-3 py-3"}`}
                                style={selected ? OPTION_SELECTED : OPTION_IDLE}
                              >
                                <div className="flex items-start gap-2.5">
                                  {opt.icon && (
                                    <OptionIcon
                                      size={17}
                                      style={{ color: selected ? "#2dd4bf" : "#7e8a9e", marginTop: 1, flexShrink: 0 }}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="text-[13.5px] font-medium"
                                      style={{ color: selected ? "#e8eaf0" : "#a9b2c1", lineHeight: 1.35 }}
                                    >
                                      {opt.label}
                                    </p>
                                    {opt.hint && (
                                      <p
                                        className="text-[11px] mt-0.5"
                                        style={{ color: selected ? "#a9b2c1" : "#5a6578", lineHeight: 1.4 }}
                                      >
                                        {opt.hint}
                                      </p>
                                    )}
                                  </div>
                                  {selected && (
                                    <Check size={14} style={{ color: "#2dd4bf", marginTop: 2, flexShrink: 0 }} />
                                  )}
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {screenHasAvoidNote(activePref.screen) && (
                    <div className="p-4 rounded-2xl" style={CARD_SHELL}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[15px] font-medium" style={{ color: "#e8eaf0", lineHeight: 1.45 }}>
                          Anything we&apos;ve missed?
                        </p>
                        <span
                          style={{
                            ...TAG,
                            color: "#7e8a9e",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          Optional
                        </span>
                      </div>
                      <p className="text-[12.5px] mt-1.5 mb-3" style={{ color: "#7e8a9e", lineHeight: 1.55 }}>
                        The only typing on these four screens. Leave it empty if nothing comes to mind.
                      </p>
                      <textarea
                        value={avoidNote}
                        onChange={(e) => setAvoidNote(e.target.value)}
                        rows={2}
                        placeholder="e.g. sabudana doesn't agree with me"
                        className="w-full px-4 py-3 rounded-xl focus:outline-none resize-none"
                        // 16px, or iOS zooms the whole page the moment she taps in.
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "#e8eaf0",
                          fontSize: 16,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-8">
                  <button onClick={prevStep} className="flex items-center gap-2 text-sm font-medium" style={{ color: "#7e8a9e" }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <div className="flex items-center gap-1">
                    {skippable && (
                      <button
                        onClick={() => skipScreen(activePref.screen)}
                        className="text-sm font-medium px-3 py-3"
                        style={{ color: "#7e8a9e" }}
                      >
                        Skip this
                      </button>
                    )}
                    <motion.button
                      onClick={nextStep}
                      disabled={!ready}
                      whileHover={ready ? { scale: 1.02 } : {}}
                      whileTap={ready ? { scale: 0.98 } : {}}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm disabled:opacity-50"
                      style={{
                        background: ready
                          ? "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)"
                          : "rgba(255,255,255,0.1)",
                        color: ready ? "#0a0d14" : "#7e8a9e",
                      }}
                    >
                      Continue <ArrowRight size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )
          })()}

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
                    className="w-full px-4 py-3 rounded-xl focus:outline-none"
                    style={FIELD_STYLE}
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
                    className="w-full px-4 py-3 rounded-xl focus:outline-none resize-none"
                    style={FIELD_STYLE}
                    placeholder="e.g., Thyronorm 50mcg"
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

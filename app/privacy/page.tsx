import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Privacy Policy · ThyroWell" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3" style={{ color: "#1c1d20" }}>{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#5a564e" }}>{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F4F0E8" }}>
      <header className="px-6 py-5 border-b" style={{ borderColor: "#e2dbcd" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 rounded-lg" style={{ color: "#8b867c" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Newsreader', Georgia, serif",  color: "#1c1d20" }}>
            Privacy Policy
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-xs mb-8" style={{ color: "#a09a8e" }}>Last updated: June 2026</p>

        <Section title="Who we are">
          <p>ThyroWell is a wellness coaching program. This policy explains what personal
          information we collect, how we use it, and the choices you have. ThyroWell is a
          wellness coaching program, not medical treatment or a substitute for your doctor.</p>
        </Section>

        <Section title="Information we collect">
          <p>We collect information you provide directly:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account details</strong> — name and email address.</li>
            <li><strong>Health information you choose to share</strong> — such as weight, thyroid
            condition, medications, allergies, and goals, used to personalize your coaching.</li>
            <li><strong>Check-ins</strong> — the weekly wellbeing data you submit (energy, sleep,
            mood, measurements, reflections).</li>
            <li><strong>Progress photos</strong> — only if you choose to upload them.</li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <p>We use your information solely to deliver and personalize your coaching: to build your
          plans, let your coach review your progress, and show you your own trends over time. We do
          not sell your personal information, and we do not use it for advertising.</p>
        </Section>

        <Section title="Who can see your data">
          <p>Your health data, check-ins, and photos are private to <strong>you and your
          coach</strong>. Access is enforced at the database level (row-level security), so other
          clients cannot see your data. Progress photos are stored in private storage and served
          only to you and your coach through authenticated requests.</p>
        </Section>

        <Section title="Where your data is stored">
          <p>Your information is stored using Supabase (database and authentication) and Vercel
          (hosting and private file storage for photos). These providers process data on our behalf
          under their own security and privacy commitments.</p>
        </Section>

        <Section title="Your rights">
          <p>You can <strong>download a copy of your data</strong> or <strong>permanently delete
          your account and all associated data</strong> at any time from your account settings.
          Deletion is immediate and irreversible. You may also withdraw consent by deleting your
          account.</p>
        </Section>

        <Section title="Data retention">
          <p>We keep your data for as long as your account is active. When you delete your account,
          your profile, check-ins, photos, plans, and related records are removed.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about your privacy? Email us at{" "}
          <a href="mailto:hello@thyrowell.example" style={{ color: "#155e56" }}>hello@thyrowell.example</a>.</p>
        </Section>

        <div className="mt-10 pt-6 text-xs" style={{ borderTop: "1px solid #e2dbcd", color: "#a09a8e" }}>
          See also our <Link href="/terms" style={{ color: "#155e56" }}>Terms of Service</Link>.
        </div>
      </main>
    </div>
  )
}

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Terms of Service · ThyroWell" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3" style={{ color: "#e8eaf0" }}>{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#a9b2c1" }}>{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#090c14" }}>
      <header className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>
            Terms of Service
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-xs mb-8" style={{ color: "#5a6578" }}>Last updated: June 2026</p>

        <Section title="Agreement">
          <p>By creating an account or using ThyroWell, you agree to these Terms. If you do not
          agree, please do not use the service.</p>
        </Section>

        <Section title="What ThyroWell is — and is not">
          <p><strong>ThyroWell is a wellness coaching program, not medical treatment or a substitute
          for your doctor.</strong> Our coaching, plans, and content are for general wellness and
          educational purposes only. They are not medical advice, diagnosis, or treatment.</p>
          <p>Always consult a qualified healthcare professional before making changes to your diet,
          exercise, or medication. Never disregard or delay professional medical advice because of
          something in this program. If you have a medical emergency, contact your doctor or
          emergency services.</p>
        </Section>

        <Section title="No guarantees">
          <p>Individual results vary. We do not guarantee any specific health, weight, or lab
          outcome. Testimonials reflect individual experiences and are not promises of results.</p>
        </Section>

        <Section title="Accounts and access">
          <p>Accounts are provided to enrolled clients. You are responsible for keeping your login
          secure and for the accuracy of the information you provide. Access is granted after
          enrollment is completed through our external payment process; these Terms do not govern
          that payment.</p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree to use ThyroWell only for your own personal wellness, to provide accurate
          information, and not to misuse, disrupt, or attempt to access other users' data.</p>
        </Section>

        <Section title="Your content">
          <p>You retain ownership of the information and photos you upload. You grant us permission
          to store and process them solely to provide the coaching service, as described in our{" "}
          <Link href="/privacy" style={{ color: "#2dd4bf" }}>Privacy Policy</Link>.</p>
        </Section>

        <Section title="Cancellation and deletion">
          <p>You may download your data at any time from your settings, and you can ask us to delete your account and data by contacting your coach. We may suspend or
          terminate access for violations of these Terms.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>To the fullest extent permitted by law, ThyroWell is provided "as is" without
          warranties, and we are not liable for decisions you make based on the program. Your use of
          the program is at your own risk and discretion in consultation with your healthcare
          provider.</p>
        </Section>

        <Section title="Changes">
          <p>We may update these Terms from time to time. Continued use after changes means you
          accept the updated Terms.</p>
        </Section>

        <Section title="Contact">
          <p>Questions? Email{" "}
          <a href="mailto:hello@thyrowell.example" style={{ color: "#2dd4bf" }}>hello@thyrowell.example</a>.</p>
        </Section>

        <div className="mt-10 pt-6 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#5a6578" }}>
          See also our <Link href="/privacy" style={{ color: "#2dd4bf" }}>Privacy Policy</Link>.
        </div>
      </main>
    </div>
  )
}

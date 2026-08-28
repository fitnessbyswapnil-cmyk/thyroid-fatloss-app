import { Wrench } from "lucide-react"

export const metadata = {
  title: "Back shortly · ThyroWell",
}

/**
 * Shown while the database is being moved. Reached by a rewrite from proxy.ts,
 * so the client's original URL stays in the address bar and a refresh after the
 * window returns her to where she was.
 *
 * It says the two things she actually needs to know — when it is back, and that
 * her password still works — because the sign-out that follows a project move
 * otherwise reads as "the app is broken".
 */
export default function MaintenancePage() {
  const back = process.env.NEXT_PUBLIC_MAINTENANCE_BACK_AT || null

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#090c14" }}
    >
      <div className="max-w-sm text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)" }}
        >
          <Wrench size={22} style={{ color: "#2dd4bf" }} />
        </div>

        <h1 className="text-2xl font-semibold mb-3" style={{ color: "#e8eaf0" }}>
          Back in a few minutes
        </h1>

        <p className="text-sm leading-relaxed mb-6" style={{ color: "#9aa4b5" }}>
          We are making ThyroWell faster for you. Nothing of yours is lost — your
          plan, your reports and your progress are all safe.
          {back ? ` We expect to be back by ${back}.` : ""}
        </p>

        <div
          className="p-4 rounded-xl text-left"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs leading-relaxed" style={{ color: "#9aa4b5" }}>
            When we are back you will be asked to sign in once more.
            <span style={{ color: "#e8eaf0" }}> Your password has not changed</span> —
            use the same one as always.
          </p>
        </div>

        <p className="text-[11px] mt-6" style={{ color: "#5a6578" }}>
          Heal Thyroid with Swapnil
        </p>
      </div>
    </main>
  )
}

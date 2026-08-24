import { Bone, Card, NavGhost } from "@/components/ui/route-skeleton"

/**
 * Home. Deliberately NOT the generic card stack: this screen opens with the
 * hero (greeting, medication, today's focus) rather than a header bar, so a
 * generic skeleton would re-layout the moment content lands. Shape follows
 * PrototypeHero — same paddings, same 2-up grid, same 4-up quick actions.
 *
 * Nine parallel queries run behind this one; it is the longest wait in the app
 * and the one she takes on every cold open.
 */
export default function Loading() {
  return (
    <>
      <div
        className="min-h-screen"
        style={{ background: "#090c14", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 24px))" }}
        aria-busy="true"
      >
        <span className="sr-only" aria-live="polite">
          Loading…
        </span>

        <div className="px-6" style={{ paddingTop: "calc(52px + env(safe-area-inset-top, 0px))", paddingBottom: 8 }}>
          <div className="max-w-2xl mx-auto">
            <Bone w={110} h={11} r={4} />
            <div className="mt-1.5">
              <Bone w="72%" h={34} r={8} delay={60} />
            </div>
            <div className="mt-2">
              <Bone w="52%" h={14} r={5} delay={120} />
            </div>

            {/* Medication strip */}
            <div className="mt-5">
              <Card pad={14}>
                <div className="flex items-center gap-3">
                  <Bone w={36} h={36} r={12} delay={180} />
                  <div className="flex-1 flex flex-col gap-2">
                    <Bone w="46%" h={13} r={4} delay={220} />
                    <Bone w="30%" h={10} r={4} delay={260} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Today's focus — the largest block on the screen */}
            <div className="mt-3.5">
              <div
                className="p-5"
                style={{
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(45,212,191,0.16)",
                }}
              >
                <div className="flex flex-col gap-3">
                  <Bone w={92} h={10} r={4} delay={300} />
                  <Bone w="80%" h={26} r={7} delay={340} />
                  <Bone w="60%" h={12} r={4} delay={380} />
                  <Bone w={168} h={42} r={9999} delay={420} />
                </div>
              </div>
            </div>

            {/* Weeks together · Weekly check-in */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[0, 1].map((i) => (
                <Card key={i} pad={16}>
                  <div className="flex flex-col gap-3">
                    <Bone w="70%" h={10} r={4} delay={460 + i * 60} />
                    <Bone w="45%" h={30} r={7} delay={500 + i * 60} />
                    <Bone w="100%" h={15} r={7} delay={540 + i * 60} />
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 mb-2.5">
              <Bone w={98} h={10} r={4} delay={600} />
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} w="100%" h={64} r={16} delay={620 + i * 60} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pt-8 flex flex-col gap-5 max-w-2xl mx-auto">
          <Bone w="100%" h={132} r={20} delay={860} />
          <Bone w="100%" h={96} r={20} delay={920} />
        </div>
      </div>
      <NavGhost />
    </>
  )
}

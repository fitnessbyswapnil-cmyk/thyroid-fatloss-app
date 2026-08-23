"use client"

/**
 * Minimal renderer for lesson text — blank line = paragraph, "- " = bullet,
 * "1. " = numbered, **bold** and *italic* inline. Deliberately not a full
 * markdown dependency; lesson content is authored in-house and this keeps the
 * bundle small.
 */
function inline(text: string, keyPrefix: string) {
  // Split on **bold** and *italic* while keeping the delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={`${keyPrefix}-${i}`} style={{ color: "#e8eaf0", fontWeight: 600 }}>{p.slice(2, -2)}</strong>
    }
    if (p.startsWith("*") && p.endsWith("*")) {
      return <em key={`${keyPrefix}-${i}`} style={{ color: "#7e8a9e" }}>{p.slice(1, -1)}</em>
    }
    return <span key={`${keyPrefix}-${i}`}>{p}</span>
  })
}

export function LessonBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)

  return (
    <div className="space-y-4">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)

        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={bi} className="space-y-2.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="shrink-0 mt-[7px] w-[5px] h-[5px] rounded-full" style={{ background: "#2dd4bf" }} />
                  <span className="text-[14.5px]" style={{ color: "#a9b2c1", lineHeight: 1.65 }}>
                    {inline(l.slice(2), `${bi}-${li}`)}
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={bi} className="space-y-2.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="shrink-0 text-[13px] font-bold tabular-nums" style={{ color: "#2dd4bf", minWidth: 16 }}>
                    {l.match(/^(\d+)\./)?.[1]}
                  </span>
                  <span className="text-[14.5px]" style={{ color: "#a9b2c1", lineHeight: 1.65 }}>
                    {inline(l.replace(/^\d+\.\s*/, ""), `${bi}-${li}`)}
                  </span>
                </li>
              ))}
            </ol>
          )
        }

        // A fully-italic block is the medical-boundary footnote — set it apart.
        const isNote = block.startsWith("*") && block.endsWith("*") && !block.startsWith("**")
        if (isNote) {
          return (
            <p key={bi} className="text-[12.5px] rounded-xl px-4 py-3"
              style={{ color: "#7e8a9e", lineHeight: 1.6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {block.slice(1, -1)}
            </p>
          )
        }

        return (
          <p key={bi} className="text-[14.5px]" style={{ color: "#c9cdd5", lineHeight: 1.7 }}>
            {inline(block, String(bi))}
          </p>
        )
      })}
    </div>
  )
}

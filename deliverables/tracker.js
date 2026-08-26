/**
 * Onboarding & payment status — Word document, white background.
 *
 * Names and condition combinations come from the real intake sheet. The
 * AMOUNTS AND DATES ARE PLACED, NOT RECORDED: Swapnil gave a range and pinned
 * Poonam at 22,500, and the per-person split is inferred. Correct every row
 * against what each client actually paid before this is used for anything.
 */
const fs = require("fs")
const path = require("path")
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageOrientation, HeadingLevel,
} = require("docx")

const VIOLET = "7C3AED"
const INK = "1A1520"
const MUTED = "6B6478"
const LINE = "E4E0EA"
const PAID = "15803D"
const PENDING = "B45309"

const PAID_R = "Paid"
const WAITING_R = "Payment promised by 24 August, 11:30 PM (Waiting)"
const BY25_R = "Payment by 25 Aug 2026, 4:30 PM"

const ROWS = [
  ["01", "Ankita Marketkar",   "Mumbai",       "Hypothyroidism + Pre-diabetic",      "21 Aug", 25000, PAID_R,    "paid"],
  ["02", "Ruma Acharya",       "Kolkata",      "Hypothyroidism + Pre-diabetic",      "22 Aug", 30000, PAID_R,    "paid"],
  ["03", "Sangita Singh",      "Noida",        "Hypothyroidism + Acid reflux",       "22 Aug", 32500, PAID_R,    "paid"],
  ["04", "D. Sitamahalakshmi", "Peddapuram",   "Hypothyroidism + Varicose veins",    "23 Aug", 35000, PAID_R,    "paid"],
  ["05", "Dr Sanju Harne",     "Bhopal",       "Hypothyroidism + Pre-diabetic",      "23 Aug", 40000, PAID_R,    "paid"],
  ["06", "Kaustubh Parab",     "Mumbai",       "Hypothyroidism + BP + Pre-diabetic", "24 Aug", 45000, BY25_R,    "pending"],
  ["07", "Manish Kumar Sinha", "Gurgaon",      "Hypothyroidism",                     "24 Aug", 20000, BY25_R,    "pending"],
  ["08", "Nisha Ajimon",       "Dadra & N.H.", "Hypothyroidism + BP + Pre-diabetic", "25 Aug", 50000, PAID_R,    "paid"],
  ["09", "Poonam Nikam",       "Mumbai",       "Hypothyroidism + BP",                "21 Aug", 22500, WAITING_R, "waiting"],
]

/** Indian grouping: 3,27,500 rather than 327,500. */
const inr = (n) => {
  const s = String(n)
  if (s.length <= 3) return s
  let head = s.slice(0, -3)
  const tail = s.slice(-3)
  const parts = []
  while (head.length > 2) { parts.unshift(head.slice(-2)); head = head.slice(0, -2) }
  if (head) parts.unshift(head)
  return parts.join(",") + "," + tail
}

const total = ROWS.reduce((a, r) => a + r[5], 0)
const collected = ROWS.filter((r) => r[7] === "paid").reduce((a, r) => a + r[5], 0)
const outstanding = total - collected

// Landscape A4: portrait dimensions plus the orientation flag — docx-js swaps
// them itself. Content width = 16838 - 2 x 1080 margins.
const COLS = [620, 2300, 1400, 3100, 1080, 1400, 4778]
const CONTENT = COLS.reduce((a, b) => a + b, 0)

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
const hair = { style: BorderStyle.SINGLE, size: 4, color: LINE }

const cell = (children, i, opts = {}) =>
  new TableCell({
    children,
    width: { size: COLS[i], type: WidthType.DXA },
    margins: { top: 110, bottom: 110, left: 90, right: 90 },
    borders: { top: noBorder, bottom: opts.last ? noBorder : hair, left: noBorder, right: noBorder },
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: "auto" } : undefined,
  })

const run = (text, o = {}) =>
  new TextRun({ text, font: "Calibri", size: o.size || 19, bold: o.bold, color: o.color || INK,
                allCaps: o.caps, italics: o.italics })

const para = (runs, o = {}) =>
  new Paragraph({ children: runs, alignment: o.align, spacing: { before: o.before || 0, after: o.after || 0 } })

const header = new TableRow({
  tableHeader: true,
  children: ["#", "Client", "City", "Presenting with", "Started", "Amount", "Remark"].map((h, i) =>
    cell([para([run(h, { size: 15, bold: true, color: MUTED, caps: true })],
      { align: i === 5 ? AlignmentType.RIGHT : AlignmentType.LEFT })], i)),
})

const body = ROWS.map(([idx, name, city, issue, date, amt, remark, status], n) => {
  const last = n === ROWS.length - 1
  const shade = n % 2 === 1 ? "FAF9FC" : undefined
  const remarkColour = status === "paid" ? PAID : PENDING
  return new TableRow({
    children: [
      cell([para([run(idx, { color: MUTED })])], 0, { last, shade }),
      cell([para([run(name, { bold: true })])], 1, { last, shade }),
      cell([para([run(city, { color: MUTED })])], 2, { last, shade }),
      cell([para([run(issue)])], 3, { last, shade }),
      cell([para([run(date, { color: MUTED })])], 4, { last, shade }),
      cell([para([run("₹" + inr(amt), { bold: true })], { align: AlignmentType.RIGHT })], 5, { last, shade }),
      cell([para([run(remark, { color: remarkColour, bold: status !== "paid" })])], 6, { last, shade }),
    ],
  })
})

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 20, color: INK } } } },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children: [
      para([run("Heal Thyroid with Swapnil", { size: 16, bold: true, color: VIOLET, caps: true })], { after: 120 }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 60 },
        children: [new TextRun({ text: "Onboarding & Payment Status", font: "Calibri Light", size: 44, bold: true, color: INK })],
      }),
      new Paragraph({
        spacing: { after: 400 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: VIOLET, space: 8 } },
        children: [run("21 – 25 August 2026", { color: MUTED })],
      }),


      new Table({
        columnWidths: COLS,
        width: { size: CONTENT, type: WidthType.DXA },
        rows: [header, ...body],
      }),

      para([run("Internal record. Contains client names, health conditions and fees — not for sharing outside the practice without each client’s consent.",
        { size: 16, color: MUTED, italics: true })], { before: 400 }),
    ],
  }],
})

const out = path.join(__dirname, "Onboarding & Payment Status - 21-25 Aug 2026.docx")
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf)
  console.log(`${ROWS.length} rows · total ₹${inr(total)} · collected ₹${inr(collected)} · outstanding ₹${inr(outstanding)}`)
  console.log("docx →", out)
})

#!/usr/bin/env python3
"""
Onboarding record — 9 entries, 21-25 Aug 2026.

Names and condition combinations are the real ones from the intake sheet.
The AMOUNTS AND DATES ARE PLACED, NOT RECORDED — Swapnil supplied the range
(22,500-50,000) and pinned Poonam at 22,500; the per-person split is mine and
has to be corrected against what each client actually paid before this is used
for anything.
"""
import os, subprocess

ROWS = [
    ("Poonam Nikam",        "Mumbai",     "Hypothyroidism + BP",                  "21 Aug", 22500, "Base"),
    ("Ankita Marketkar",    "Mumbai",     "Hypothyroidism + Pre-diabetic",        "21 Aug", 25000, ""),
    ("Ruma Acharya",        "Kolkata",    "Hypothyroidism + Pre-diabetic",        "22 Aug", 30000, ""),
    ("Sangita Singh",       "Noida",      "Hypothyroidism + Acid reflux",         "22 Aug", 32500, ""),
    ("D. Sitamahalakshmi",  "Peddapuram", "Hypothyroidism + Varicose veins",      "23 Aug", 35000, ""),
    ("Dr Sanju Harne",      "Bhopal",     "Hypothyroidism + Pre-diabetic",        "23 Aug", 40000, ""),
    ("Kaustubh Parab",      "Mumbai",     "Hypothyroidism + BP + Pre-diabetic",   "24 Aug", 45000, ""),
    ("Manish Kumar Sinha",  "Gurgaon",    "Hypothyroidism + Fatty liver",         "24 Aug", 47500, ""),
    ("Nisha Ajimon",        "Dadra & N.H.","Hypothyroidism + BP + Pre-diabetic",  "25 Aug", 50000, "Highest"),
]

def inr(n):
    s = str(n)
    if len(s) <= 3: return s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2:
        parts.insert(0, head[-2:]); head = head[:-2]
    if head: parts.insert(0, head)
    return ",".join(parts) + "," + tail

total = sum(r[4] for r in ROWS)
avg = round(total / len(ROWS))

rows_html = ""
for i, (name, city, issue, date, amt, tag) in enumerate(ROWS):
    chip = f'<span class="tag">{tag}</span>' if tag else ""
    rows_html += f"""
    <tr>
      <td class="idx">{i+1:02d}</td>
      <td class="nm">{name}{chip}<span class="city">{city}</span></td>
      <td class="iss">{issue}</td>
      <td class="dt">{date}</td>
      <td class="amt">&#8377;{inr(amt)}</td>
    </tr>"""

HERE = os.path.dirname(os.path.abspath(__file__))
css = open(os.path.join(HERE, "shell.css")).read()

html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Onboarding Record — 21-25 August 2026</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap" rel="stylesheet">
<style>
{css}
table{{width:100%;border-collapse:collapse;margin-top:6mm}}
thead th{{
  text-align:left;font-size:8pt;letter-spacing:0.14em;text-transform:uppercase;
  color:var(--w-3);font-weight:600;padding:0 0 3mm;border-bottom:1px solid var(--line);
}}
thead th.r,tbody td.amt{{text-align:right}}
tbody td{{padding:3.2mm 0;border-bottom:1px solid var(--line-soft);vertical-align:top}}
td.idx{{font-family:var(--serif);font-style:italic;font-size:13pt;color:var(--w-4);width:11mm}}
td.nm{{font-size:11pt;font-weight:600;color:var(--w);width:56mm}}
span.city{{display:block;font-size:8.5pt;font-weight:400;color:var(--w-4);margin-top:1mm}}
span.tag{{
  display:inline-block;margin-left:2.5mm;padding:2px 7px;border-radius:999px;
  font-size:7pt;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;
  background:var(--violet-dim);color:var(--violet-3);border:1px solid rgba(168,85,247,0.3);
  vertical-align:middle;
}}
td.iss{{font-size:9.5pt;color:var(--w-2);padding-right:6mm}}
td.dt{{font-size:9.5pt;color:var(--w-3);width:20mm;white-space:nowrap}}
td.amt{{font-family:var(--serif);font-style:italic;font-size:15pt;color:var(--w);width:28mm;font-variant-numeric:tabular-nums}}
tbody tr:last-child td{{border-bottom:none}}
</style></head><body>

<section class="page">
  <div class="glow glow-a"></div>
  <div class="glow glow-b"></div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div class="eyebrow">Onboarding Record</div>
    <div class="tiny" style="text-align:right;letter-spacing:0.14em">21 &ndash; 25 AUGUST 2026</div>
  </div>

  <h2 style="margin-top:5mm">Nine started this week.</h2>
  <div class="rule-violet" style="margin:5mm 0"></div>

  <div class="grid-3" style="margin-bottom:2mm">
    <div class="card"><div class="metric-label">Clients</div><div class="num">{len(ROWS)}</div></div>
    <div class="card card-violet"><div class="metric-label">Total</div><div class="num" style="color:var(--violet-3)">&#8377;{inr(total)}</div></div>
    <div class="card"><div class="metric-label">Average</div><div class="num">&#8377;{inr(avg)}</div></div>
  </div>

  <table>
    <thead><tr>
      <th></th><th>Client</th><th>Presenting with</th><th>Started</th><th class="r">Programme</th>
    </tr></thead>
    <tbody>{rows_html}
    </tbody>
  </table>

  <div class="card" style="margin-top:6mm;border-color:rgba(245,158,11,0.24);background:rgba(245,158,11,0.05)">
    <div style="display:flex;gap:4mm;align-items:flex-start">
      <span class="pill pill-amber" style="flex:none">Internal</span>
      <p class="small" style="color:var(--w-2);max-width:none">
        Contains client names, health conditions and fees. Not for sharing outside
        the practice without each client&rsquo;s consent.
      </p>
    </div>
  </div>

  <div class="foot"><span>Heal Thyroid with Swapnil</span><span>swapnilumbarkarfitness.in</span></div>
</section>
</body></html>"""

out_html = os.path.join(HERE, "roster.html")
open(out_html, "w").write(html)
out_pdf = os.path.join(HERE, "Onboarding Record - 21-25 Aug.pdf")
subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome","--headless","--disable-gpu",
  "--no-sandbox","--no-pdf-header-footer","--virtual-time-budget=15000",
  f"--print-to-pdf={out_pdf}", f"file://{out_html}"], check=True, capture_output=True)
print(f"{len(ROWS)} entries · total Rs {inr(total)} · avg Rs {inr(avg)}")
print("pdf →", out_pdf)

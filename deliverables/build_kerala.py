#!/usr/bin/env python3
"""
Nisha's Kerala plan as a client-facing document.

Deliberately says nothing about WHY the plan is shaped the way it is — no
markers, no mechanisms, no arithmetic. It names that it was built for what her
report showed and then gets on with the food, because the reasoning belongs in
the consultation, not in a document she reads alone at the kitchen counter.
"""
import json, os, subprocess, html, re

HERE = os.path.dirname(os.path.abspath(__file__))
plan = json.load(open("/tmp/nplan.json"))
recs = json.load(open("/tmp/nrec.json"))
S = {s["heading"]: s["body"] for s in plan["sections"]}
byslot = {}
for o in plan["options"]:
    byslot.setdefault(o["slot"], []).append(o)
for k in byslot:
    byslot[k].sort(key=lambda x: x["n"])

e = html.escape

GRAM_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:g|ml)\b", re.I)
def grams(portion, qty=1):
    """Served weight for a line. Every portion in this plan carries one."""
    m = GRAM_RE.search(portion or "")
    if not m:
        return None
    return round(float(m.group(1)) * (qty or 1))

def para(t):
    return "".join(f"<p>{e(x.strip())}</p>" for x in (t or "").split("\n\n") if x.strip())

PAGES = []
def page(inner, foot_l="Heal Thyroid with Swapnil", foot_r=""):
    PAGES.append(f'<section class="page">{inner}<div class="foot"><span>{foot_l}</span><span>{foot_r}</span></div></section>')

# ── Cover ──────────────────────────────────────────────────────────────────
page(f"""
<div class="masthead"><span class="eyebrow">Heal Thyroid with Swapnil</span>
<span class="eyebrow eyebrow-muted">Nutrition Plan · 27 May 2026 review</span></div>
<div style="margin-top:26mm">
  <h1>Your Kerala<br>Plan</h1>
  <p class="sub">Nisha A. · 49 · built from your 27 May report and the way you told us you eat.</p>
  <div style="margin-top:9mm"><span class="tag">21 options</span>
  <span class="tag" style="margin-left:2mm">Three meals a day</span>
  <span class="tag" style="margin-left:2mm">Ten minutes or less</span></div>

  <div class="rule" style="margin:12mm 0 7mm"></div>
  <div class="grid2" style="gap:7mm">
    <div>
      <div class="eyebrow eyebrow-muted" style="margin-bottom:3mm">Inside</div>
      <ul class="plate">
        <li>Seven breakfasts, seven lunches, seven dinners</li>
        <li>Every recipe, with the oil measured</li>
        <li>What to get right in week one</li>
        <li>Oil, salt, digestion and cravings</li>
      </ul>
    </div>
    <div>
      <div class="eyebrow eyebrow-muted" style="margin-bottom:3mm">The shape of a day</div>
      <ul class="plate">
        <li>A late breakfast, whenever you are hungry</li>
        <li>Lunch as the big meal</li>
        <li>A light dinner, finished early</li>
        <li>Chicken or fish once in the week</li>
      </ul>
    </div>
  </div>
</div>
<div class="banner">
  <h2>Built for what your report showed.</h2>
  <p>Your last panel pointed to a specific pattern, and this plan is shaped around it —
  the food, the protein, and the order it arrives in. You do not need to know the mechanics
  to follow it. Cook what is on these pages and the plan does its work.</p>
</div>""", foot_r="01")

# ── How this works ─────────────────────────────────────────────────────────
page(f"""
<div class="masthead"><span class="eyebrow">Start here</span><span class="eyebrow eyebrow-muted">How this works</span></div>
<h2 style="margin-top:8mm">Five things, then you can stop reading</h2>
<ol class="steps">
  <li><b>Three meals a day.</b> Breakfast, lunch, dinner — seven options each. Pick whichever one you feel like that day. They are built to land within a few percent of one another, so any combination gives you the same day.</li>
  <li><b>Lunch is the big meal, dinner is the light one.</b> That is deliberate and it is the order you asked for.</li>
  <li><b>Nothing here takes more than ten minutes.</b> Buy your idli and dosa batter ready-made and your curd in a tub. Nothing asks you to ferment or soak anything overnight.</li>
  <li><b>Cook the grams once for the week.</b> Soak and boil cherupayar, vanpayar or muthira on a Sunday and keep them in the fridge. Every thoran after that is six minutes.</li>
  <li><b>Measure the oil.</b> Every recipe opens with exactly how much fat goes in it. That one habit is the difference between this plan and half again as many calories.</li>
</ol>
<div class="rule"></div>
<div class="grid2">
  <div class="card"><h3>Chicken and fish</h3>{para(S.get('Chicken and fish',''))}</div>
  <div class="card"><h3>Your tea and coffee</h3>{para(S.get('Your tea and coffee',''))}</div>
</div>""", foot_r="02")

# ── Before day one + week one ──────────────────────────────────────────────
page(f"""
<div class="masthead"><span class="eyebrow">Getting started</span><span class="eyebrow eyebrow-muted">Before day one</span></div>
<h2 style="margin-top:8mm">Two days to set up</h2>
{para(S.get('Before day one',''))}
<div class="rule"></div>
<h2>Week one</h2>
{para(S.get('Week one',''))}""", foot_r="03")

# ── The options ────────────────────────────────────────────────────────────
SLOT_NOTE = {
  "Breakfast": "Seven ways to start the day. Late is fine — eat when you are actually hungry.",
  "Lunch": "The biggest meal of your day. Rice, a curry, a thoran, and something with protein on it.",
  "Dinner": "The lightest meal. Finish two to three hours before you sleep where you can.",
}
pno = 4
for slot in ("Breakfast", "Lunch", "Dinner"):
    opts = byslot[slot]
    for half in (opts[:4], opts[4:]):
        cards = ""
        for o in half:
            items = ""
            for i in o["items"]:
                g = grams(i.get("portion"), i.get("qty"))
                measure = re.sub(r"\s*\([^)]*\)", "", i.get("portion") or "").strip()
                if i.get("qty") and i["qty"] != 1:
                    measure = f'{i["qty"]:g} × {measure}' if measure else f'{i["qty"]:g} ×'
                items += (f'<li><span class="nm">{e(i["name"])}'
                          + (f' <span class="qty">· {e(measure)}</span>' if measure else "")
                          + '</span>'
                          + (f'<span class="g">{g} g</span>' if g else "")
                          + "</li>")
            cards += f"""<div class="card">
              <div style="display:flex;justify-content:space-between;align-items:baseline">
                <span class="opt-num">{o['n']:02d}</span>
              </div>
              <ul class="plate">{items}</ul>
              <div class="macros"><span><b>{o['kcal']:g}</b> kcal</span><span><b>{o['p']:g}g</b> protein</span>
              <span>{o['c']:g}g carbs</span><span>{o['f']:g}g fat</span></div>
            </div>"""
        first = half is opts[:4]
        head = (f'<h2 style="margin-top:8mm">{slot}</h2><p class="sub" style="margin-bottom:6mm">{SLOT_NOTE[slot]}</p>'
                if first else f'<h2 style="margin-top:8mm">{slot}<span style="color:var(--faint)"> · continued</span></h2><div style="height:4mm"></div>')
        page(f"""<div class="masthead"><span class="eyebrow">{slot}</span>
          <span class="eyebrow eyebrow-muted">Options {half[0]['n']}–{half[-1]['n']} of 7</span></div>
          {head}<div class="grid2">{cards}</div>""", foot_r=f"{pno:02d}")
        pno += 1

# ── Recipes ────────────────────────────────────────────────────────────────
def split_recipe(txt):
    """Split a recipe into its oil line, the method, and any trailing notes.

    Every recipe opens with the oil line. What follows is the method, and some
    carry a further paragraph — the batch-cook note, a sourcing tip — which is
    NOT a step. Numbering those alongside the method produced instructions that
    pointed the wrong way ("the 6 minutes below" rendered above the thing it
    referred to), so they are kept as prose underneath.
    """
    paras = [x.strip() for x in (txt or "").strip().split("\n\n") if x.strip()]
    if not paras:
        return "", "", []
    oil = paras[0] if re.match(r"\s*Oil\s*:", paras[0], re.I) else ""
    rest = paras[1:] if oil else paras
    method = rest[0] if rest else ""
    notes = rest[1:] if len(rest) > 1 else []
    return oil, method, notes

recs_sorted = sorted(recs, key=lambda r: r["name"])
CHUNK = 1
for i in range(0, len(recs_sorted), CHUNK):
    blocks = ""
    for r in recs_sorted[i:i+CHUNK]:
        oil, method_txt, notes = split_recipe(r["recipe"])
        ing = ""
        if r.get("ingredients"):
            rows = "".join(
                f'<tr><td>{e(x["name"])}</td><td class="r">{x["grams"]:g} g</td>'
                f'<td class="r">{x.get("kcal",0):g}</td><td class="r">{x.get("protein",0):g} g</td></tr>'
                for x in r["ingredients"])
            tot_g = sum(x.get("grams", 0) for x in r["ingredients"])
            ing = f"""<table class="itab">
              <thead><tr><th>Ingredient</th><th class="r">Weight</th><th class="r">kcal</th><th class="r">Protein</th></tr></thead>
              <tbody>{rows}</tbody>
              <tfoot><tr><td>Total, raw</td><td class="r">{tot_g:g} g</td>
                <td class="r">{r['kcal']:g}</td><td class="r">{r['p']:g} g</td></tr></tfoot>
            </table>"""

        # One sentence per step, so it can be followed a line at a time with wet
        # hands. Very short sentences are folded into the one before them rather
        # than becoming a step of their own.
        sents = [x.strip() for x in re.split(r"(?<=[.!])\s+(?=[A-Z])", method_txt) if x.strip()]
        steps = []
        for st in sents:
            if steps and len(st) < 45:
                steps[-1] = steps[-1] + " " + st
            else:
                steps.append(st)
        method = "".join(f"<li>{e(x)}</li>" for x in steps)
        note_html = "".join(f'<p class="note" style="margin-top:2.5mm">{e(n)}</p>' for n in notes)

        blocks += f"""<div class="rec">
          <div class="rec-head"><h3>{e(r['name'])}</h3>
            <span class="rec-macros">{e(str(r['portion'] or ''))} · {r['kcal']:g} kcal ·
              {r['p']:g}g P · {r['c']:g}g C · {r['f']:g}g F</span></div>
          {f'<div class="oil">{e(oil)}</div>' if oil else ''}
          {f'<ol class="method">{method}</ol>' if method else ''}
          {note_html}
          {ing}
        </div>"""
    page(f"""<div class="masthead"><span class="eyebrow">Recipes</span>
      <span class="eyebrow eyebrow-muted">{i+1}–{min(i+CHUNK,len(recs_sorted))} of {len(recs_sorted)}</span></div>
      <div style="margin-top:7mm">{blocks}</div>""", foot_r=f"{pno:02d}")
    pno += 1

# ── Close ──────────────────────────────────────────────────────────────────
# One habit per page. Two to a page overflowed A4 by up to 409px, and these
# are the pages she actually rereads.
HABITS = [("How much oil", 'How much oil, exactly'), ("Salt", 'Salt'),
          ("Digestion", 'Constipation and bloating'), ("Cravings", 'Cravings')]
for title, key in HABITS:
    page(f"""<div class="masthead"><span class="eyebrow">The rest of it</span>
      <span class="eyebrow eyebrow-muted">{e(title)}</span></div>
      <h2 style="margin-top:8mm">{e(title)}</h2>
      <div style="margin-top:5mm">{para(S.get(key,""))}</div>""", foot_r=f"{pno:02d}")
    pno += 1

page(f"""
<div class="masthead"><span class="eyebrow">Heal Thyroid with Swapnil</span>
<span class="eyebrow eyebrow-muted">Nisha A. · Kerala Plan</span></div>
<div style="margin-top:34mm">
  <h1>Cook what is<br>on these pages.</h1>
  <p class="sub">Not perfectly, and not every day. Pick the same easy option all week if that is
  what gets it eaten — a week of the same breakfast is a week of breakfasts you actually had.</p>
</div>
<div class="banner">
  <h2>Any question, message me in the app.</h2>
  <p>That is what it is there for, and I read every one.</p>
</div>""", foot_l="swapnilumbarkarfitness.in", foot_r=f"{pno:02d}")

css = open(os.path.join(HERE, "kerala.css")).read()
doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Your Kerala Plan — Nisha A.</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>{css}</style></head><body>{''.join(PAGES)}</body></html>"""

out_html = os.path.join(HERE, "nisha-kerala-plan.html")
open(out_html, "w").write(doc)
print(f"html  {len(doc)//1024} KB · {len(PAGES)} pages")

out_pdf = os.path.join(HERE, "Nisha - Kerala Plan.pdf")
subprocess.run([
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
    "--virtual-time-budget=25000", f"--print-to-pdf={out_pdf}", f"file://{out_html}",
], check=True, capture_output=True)
print(f"pdf   {os.path.getsize(out_pdf)//1024} KB  →  {out_pdf}")

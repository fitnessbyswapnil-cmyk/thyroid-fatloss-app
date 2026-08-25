#!/usr/bin/env python3
"""
Compose the Poonam client-journey document and render it to PDF.

The six app screens are produced separately (each traced from the real
ThyroWell source) and dropped into phone frames here. Keeping assembly in one
script means the document can be rebuilt after any screen is corrected, without
re-doing the rest.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TASK = "/private/tmp/claude-501/-Users-swapnil-thyroid-premium-site/df2cdb23-31ac-4a44-b4f6-06ff42caf1fd/tasks/wmfn2d7zk.output"

# Narrative order, which is not the order the screens were rendered in.
# (rendered: 0 login · 1 dashboard · 2 progress · 3 meal · 4 workout · 5 labs)
JOURNEY = [
    (0, "01", "Day 1", "Your way in",
     "One link, one password you choose yourself. It opens on your phone like any other app — nothing to install from a store, nothing to keep updated.",
     ["Works on the phone you already have", "Your data is visible to you and me. Nobody else."]),
    (1, "02", "Day 1", "Everything, on one screen",
     "No hunting. Your plan, your check-in, your reports and me — four taps from the front page. On the days you have no energy to look for anything, it's already there.",
     ["Today's focus, so there's one thing to do", "Your week count, so progress is visible before the scale moves"]),
    (5, "03", "Week 1", "Your report, read for you",
     "Photograph the page or upload the PDF and the app pulls the markers out itself. No typing numbers off a printout. Your TSH goes in as it reads — and the three that were never tested show as exactly that.",
     ["Every report you ever upload stays side by side", "Missing is shown as missing — never dressed up as a finding"]),
    (3, "04", "Week 1", "Your plate, from your kitchen",
     "Not a diet chart. Real portions of the food you already cook, measured in katoris rather than grams, and built to the calorie number your body actually needs at 70 kg heading for 60.",
     ["Roti, dal, sabzi, curd — nothing exotic, nothing imported", "Swap anything you don't like and the numbers rebalance"]),
    (4, "05", "Week 1", "Movement your knees agree with",
     "You told me your knees hurt and sitting is painful. So this starts seated and supported, stays short, and never asks you to jump. Every movement has a demo you can watch first.",
     ["Ten to twenty minutes, not an hour", "It gets harder only when you're ready for it"]),
    (2, "06", "Every week", "Proof, in your own numbers",
     "Five minutes a week — weight, energy, sleep, mood. Then the app draws the line for you, and I read every single one. This is the screen where two years of guessing turns into something you can actually see.",
     ["Your weight, energy and sleep on one chart", "Reviewed with me every fortnight"]),
]


CLOSERS = [
    "You will not need a manual for this.",
    "Four taps. That is the whole app.",
    "Your numbers stay yours, and they stay in one place.",
    "Cooked in ten minutes, on a weekday, by you.",
    "Nothing here needs a gym you have not joined.",
    "This is the page that tells us when to change something.",
]


def journey_page(scr, step, when, title, body, bullets, pageno, closer=""):
    lis = "".join(
        f'<div class="tick"><div class="tick-mark">'
        f'<span style="color:#2dd4bf;font-size:9px">&#10003;</span></div>'
        f'<div class="small" style="color:var(--w-2)">{b}</div></div>'
        for b in bullets
    )
    return f"""
<section class="page">
  <div class="glow glow-c"></div>
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <div class="eyebrow eyebrow-muted">Inside the app</div>
    <div class="tiny" style="letter-spacing:0.16em">{when.upper()}</div>
  </div>

  <div class="journey">
    <div class="phone-wrap"><div class="phone">{scr['html']}</div></div>
    <div class="journey-copy">
      <div class="screen-step">{step}</div>
      <h2 style="font-size:22pt;margin:2mm 0 4mm">{title}</h2>
      <div class="rule-violet" style="margin-bottom:5mm"></div>
      <p class="small" style="max-width:none;color:var(--w-2);margin-bottom:6mm">{body}</p>
      {lis}
      <div style="margin-top:auto;padding-top:8mm">
        <div class="rule" style="margin:0 0 4mm"></div>
        <p style="font-family:var(--serif);font-style:italic;font-size:13pt;color:var(--violet-3);max-width:none">{closer}</p>
      </div>
    </div>
  </div>

  <div class="foot"><span>Heal Thyroid with Swapnil</span><span>{pageno:02d}</span></div>
</section>"""


def main():
    # Read from screens.json, extracted from the agent transcripts by scope
    # prefix. The workflow's own output file only lands once its review agents
    # finish, and the screens are ready well before that.
    with open(os.path.join(HERE, "screens.json")) as f:
        screens = json.load(f)

    missing = [i for i, s in enumerate(screens) if not s]
    if missing:
        sys.exit(f"screens missing: {missing} — cannot build")

    css = open(os.path.join(HERE, "shell.css")).read()
    screen_css = "\n\n".join(s["css"] for s in screens)

    pages = open(os.path.join(HERE, "pages.html")).read()
    end = open(os.path.join(HERE, "pages-end.html")).read()

    journey = "".join(
        journey_page(screens[idx], step, when, title, body, bullets, 4 + n + 1, CLOSERS[n])
        for n, (idx, step, when, title, body, bullets) in enumerate(JOURNEY)
    )

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Heal Thyroid with Swapnil — Poonam Nikam</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap" rel="stylesheet">
<style>
{css}

/* ── App screen styles, one scoped block per screen ─────────────────────── */
{screen_css}
</style>
</head><body>
{pages}
{journey}
{end}
</body></html>"""

    out_html = os.path.join(HERE, "poonam-journey.html")
    with open(out_html, "w") as f:
        f.write(html)
    print(f"html  {len(html)//1024} KB  →  {out_html}")

    out_pdf = os.path.join(HERE, "Poonam-Nikam-ThyroWell-Journey.pdf")
    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    subprocess.run([
        chrome, "--headless", "--disable-gpu", "--no-sandbox",
        "--no-pdf-header-footer",
        # Fonts and the phone screens both need a beat to settle, or the first
        # render lands with fallback type and half-painted frames.
        "--virtual-time-budget=20000",
        f"--print-to-pdf={out_pdf}",
        f"file://{out_html}",
    ], check=True, capture_output=True)
    print(f"pdf   {os.path.getsize(out_pdf)//1024} KB  →  {out_pdf}")


if __name__ == "__main__":
    main()

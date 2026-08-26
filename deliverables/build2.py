#!/usr/bin/env python3
"""
Poonam's 90-day programme document — the screenshot-led edition.

Structure: her file, her symptoms, then the three months told entirely through
app screens. Screens come from two render passes (screens.json = the first six,
screens2.json = the eight added later) and are placed here in narrative order,
which is not the order either pass produced them in.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))

# ("a"|"b", index) — which file the screen came from, and where in it.
MONTHS = [
    {
        "n": "01", "title": "Set up, and measure",
        "blurb": "The first month is not about the scale. It is about getting the four markers "
                 "measured, getting food you will actually cook, and getting movement your knees "
                 "will tolerate. Everything after this stands on it.",
        "you": ["Sign in and set your password", "Get the full panel done",
                "Upload the report", "Start the plan on the day you feel ready"],
        "me": ["60-minute consultation", "Read your report with you",
               "Build your nutrition plan", "Build your training plan"],
        "screens": [
            (("a", 0), "Day 1", "Your way in",
             "One link, one password you choose yourself. It opens on your phone like any "
             "other app — nothing to install from a store, nothing to keep updated.",
             ["Works on the phone you already have", "Visible to you and me. Nobody else."],
             "You will not need a manual for this."),
            (("a", 1), "Day 1", "Everything, on one screen",
             "No hunting. Your plan, your check-in, your reports and me — four taps from "
             "the front page. On the days you have no energy to look for anything, it is "
             "already there.",
             ["Today's focus, so there is one thing to do", "Your week count, so progress shows before the scale moves"],
             "Four taps. That is the whole app."),
            (("b", 0), "Week 1", "Your report, uploaded",
             "Photograph the page or send the PDF. The app reads the markers and the date "
             "off it — you never type a number from a printout.",
             ["Every report you upload stays in one place", "It reads the date off the report, not the day you uploaded"],
             "One upload. That is the whole job."),
            (("b", 1), "Week 2", "All the markers, finally",
             "Once the full panel is done, this is your Health page. Every marker, its value, "
             "and the lab's own range beside it. Anything outside that range is flagged for "
             "your doctor — never explained away by an app.",
             ["In range gets no badge and no fuss", "Out of range points at your doctor, in amber"],
             "One number out of four becomes four out of four."),
            (("a", 3), "Week 1", "Your plate, from your kitchen",
             "Not a diet chart. Real portions of the food you already cook, measured in "
             "katoris rather than grams, and built to the calorie number your body actually "
             "needs at 70 kg heading for 60.",
             ["Roti, dal, sabzi, curd — nothing exotic", "Breakfast shown here. The full day arrives when you start"],
             "Cooked in ten minutes, on a weekday, by you."),
            (("a", 4), "Week 1", "Movement your knees agree with",
             "You told me your knees hurt and sitting is painful. So this starts seated and "
             "supported, stays short, and never asks you to jump. Every movement has a demo "
             "you can watch first.",
             ["Ten to twenty minutes, not an hour", "It gets harder only when you are ready"],
             "Nothing here needs a gym you have not joined."),
        ],
    },
    {
        "n": "02", "title": "Live it, and adjust",
        "blurb": "Month two is where a plan either becomes a habit or becomes a PDF nobody opens. "
                 "So the app asks you for five minutes a week, and I answer every one of them. "
                 "The plan changes when your body does — not on a fixed schedule.",
        "you": ["Tick your meals as you eat", "Log your sessions",
                "Submit your weekly check-in", "Message me whenever"],
        "me": ["Read every check-in", "Adjust food and training",
               "Biweekly deeper review", "WhatsApp, same day"],
        "screens": [
            (("b", 7), "3–4× a week", "Twenty minutes, done",
             "Open the session, watch the demo if you want it, log the set. The app remembers "
             "what you lifted last time so you are never guessing where to start.",
             ["Every movement has a demo", "Your last session's numbers are already there"],
             "Short enough that you will actually do it."),
            (("b", 3), "Every week", "Five minutes, every week",
             "Weight, energy, sleep, mood, and how your symptoms are behaving. Sliders and "
             "taps — there is almost nothing to type.",
             ["About five minutes, once a week", "Half-finished check-ins are saved, not lost"],
             "The single most useful five minutes of your week."),
            (("b", 4), "Every week", "Reviewed, not just collected",
             "Your check-in does not disappear into a database. It comes back with a reply and "
             "with what changed since last week — up, down, or the same.",
             ["Every check-in gets a reply", "No change is shown as no change, not as failure"],
             "Somebody is actually reading it."),
        ],
    },
    {
        "n": "03", "title": "See the proof",
        "blurb": "Month three is when the data becomes an argument. Three months of weight, "
                 "energy and sleep on one line, a second blood panel beside the first, and "
                 "photographs you could not have taken later.",
        "you": ["Repeat the blood panel", "Take your week-12 photos", "Review the whole quarter with me"],
        "me": ["Compare panel to panel", "Read the trend, not the day", "Plan the next quarter"],
        "screens": [
            (("b", 2), "Week 12", "Your markers, across three tests",
             "The same markers, plotted across every report you have uploaded. This is the "
             "view that tells us whether something is moving — and it is the view you take "
             "to your doctor.",
             ["Every report you ever upload lines up here", "The lab's own range drawn behind the line"],
             "One test tells you a number. Three tell you a direction."),
            (("b", 5), "Week 12", "Week 1 beside Week 12",
             "The photographs you take in week one are the only ones that cannot be taken "
             "later. Same pose, same light, side by side — and they usually show what the "
             "scale does not.",
             ["Taken in week one, before anything changes", "Private to you and me"],
             "The scale lies more often than these do."),
            (("a", 2), "Week 12", "Where twelve weeks lands",
             "Weight, energy, sleep and mood on one chart, across the whole quarter. Five "
             "minutes a week for twelve weeks turns two years of guessing into something you "
             "can point at.",
             ["Your own numbers, not an average", "Reviewed with me every fortnight"],
             "This is the page that earns the next quarter."),
        ],
    },
]


def month_divider(m, pageno):
    you = "".join(f'<div class="tick"><div class="tick-mark"><span style="color:#2dd4bf;font-size:9px">&#10003;</span></div>'
                  f'<div class="small" style="color:var(--w-2)">{x}</div></div>' for x in m["you"])
    me = "".join(f'<div class="tick"><div class="tick-mark" style="background:rgba(168,85,247,0.14);border-color:rgba(168,85,247,0.35)">'
                 f'<span style="color:#c084fc;font-size:9px">&#10003;</span></div>'
                 f'<div class="small" style="color:var(--w-2)">{x}</div></div>' for x in m["me"])
    shots = "".join(f'<span class="pill pill-ghost" style="margin:0 2mm 2mm 0">{s[2]}</span>' for s in m["screens"])
    return f"""
<section class="page" style="justify-content:center">
  <div class="glow glow-a"></div>
  <div class="glow glow-b"></div>
  <div>
    <div class="eyebrow">Month {m['n']}</div>
    <h1 style="font-size:38pt;margin-top:4mm">{m['title']}</h1>
    <div class="rule-violet" style="margin:7mm 0 6mm"></div>
    <p class="lead" style="max-width:56ch">{m['blurb']}</p>

    <div class="grid-2" style="margin-top:9mm">
      <div class="card">
        <div class="metric-label" style="color:var(--teal)">What you do</div>
        {you}
      </div>
      <div class="card card-violet">
        <div class="metric-label" style="color:var(--violet-3)">What I do</div>
        {me}
      </div>
    </div>

    <div style="margin-top:8mm">
      <div class="metric-label">Screens in this month</div>
      <div style="margin-top:3mm">{shots}</div>
    </div>
  </div>
  <div class="foot"><span>Month {m['n']} &middot; {m['title']}</span><span>{pageno:02d}</span></div>
</section>"""


def screen_page(scr, month_n, when, title, body, bullets, closer, pageno):
    lis = "".join(f'<div class="tick"><div class="tick-mark"><span style="color:#2dd4bf;font-size:9px">&#10003;</span></div>'
                  f'<div class="small" style="color:var(--w-2)">{b}</div></div>' for b in bullets)
    return f"""
<section class="page">
  <div class="glow glow-c"></div>
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <div class="eyebrow eyebrow-muted">Month {month_n} &middot; inside the app</div>
    <div class="tiny" style="letter-spacing:0.16em">{when.upper()}</div>
  </div>

  <div class="journey">
    <div class="phone-wrap"><div class="phone">{scr['html']}</div></div>
    <div class="journey-copy">
      <h2 style="font-size:21pt;margin:0 0 4mm">{title}</h2>
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
    a = json.load(open(os.path.join(HERE, "screens.json")))
    p2 = os.path.join(HERE, "screens2.json")
    if not os.path.exists(p2):
        sys.exit("screens2.json missing — the second render pass has not been collected yet")
    b = json.load(open(p2))

    pools = {"a": a, "b": b}
    for k, pool in pools.items():
        gaps = [i for i, s in enumerate(pool) if not s]
        if gaps:
            sys.exit(f"pool {k} missing screens at {gaps}")

    css = open(os.path.join(HERE, "shell.css")).read()
    screen_css = "\n\n".join(s["css"] for s in a + b)

    front = open(os.path.join(HERE, "pages2-front.html")).read()
    end = open(os.path.join(HERE, "pages-end.html")).read()

    body, page = [], 6
    for m in MONTHS:
        body.append(month_divider(m, page)); page += 1
        for ref, when, title, txt, bullets, closer in m["screens"]:
            body.append(screen_page(pools[ref[0]][ref[1]], m["n"], when, title, txt, bullets, closer, page))
            page += 1

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>3 Month Roadmap — Poonam Nikam</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap" rel="stylesheet">
<style>
{css}

/* ── One scoped block per app screen ────────────────────────────────────── */
{screen_css}
</style>
</head><body>
{front}
{''.join(body)}
{end}
</body></html>"""

    out_html = os.path.join(HERE, "poonam-90days.html")
    open(out_html, "w").write(html)
    print(f"html  {len(html)//1024} KB · {page + 2} pages  →  {out_html}")

    out_pdf = os.path.join(HERE, "3 Month Roadmap.pdf")
    subprocess.run([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
        # Fonts and fourteen phone screens need a beat, or the first render
        # lands with fallback type and half-painted frames.
        "--virtual-time-budget=30000",
        f"--print-to-pdf={out_pdf}", f"file://{out_html}",
    ], check=True, capture_output=True)
    print(f"pdf   {os.path.getsize(out_pdf)//1024} KB  →  {out_pdf}")


if __name__ == "__main__":
    main()

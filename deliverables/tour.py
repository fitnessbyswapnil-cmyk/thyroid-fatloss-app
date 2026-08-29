#!/usr/bin/env python3
"""
ThyroWell App Tour — the sales-call edition.

A generic (no client) walkthrough of the app, structured around the five
programme deliverables + bonus, for showing on a sales call. Reuses the traced
screen replicas from screens.json / screens2.json and the shell.css design
system; screens are de-personalised at build time (the source JSONs are the
Poonam deliverable's and are not touched).

Page logic: bold heading top, one line of copy, the screens do the talking.
The centrepiece is the SYSTEM page — all 12 weekly check-ins and 6 biweekly
reviews drawn as one timeline, because "systematic" has to be seen, not said.
"""
import json, os, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def load_screens():
    a = json.load(open(os.path.join(HERE, "screens.json")))
    b = json.load(open(os.path.join(HERE, "screens2.json")))

    def scrub(html):
        # De-personalise: this tour is generic. Order matters — most specific first.
        html = html.replace("Good morning, Poonam", "Good morning")
        html = html.replace("not Poonam&rsquo;s own plan", "yours is built for you")
        # Whole-sentence swaps first — a bare word substitution here inverted
        # meanings ("Not Poonam's own numbers" briefly became "Not sample
        # numbers") and broke grammar ("you has not added photos").
        html = html.replace("Not Poonam's own numbers.", "Sample numbers, not a real client's.")
        html = html.replace("none of it is Poonam&rsquo;s own.", "all of it is sample data.")
        html = html.replace(
            "Poonam has not added photos yet, so both frames are empty. 70 kg and 60 kg are her own reported start weight and goal, not measured results.",
            "no photos have been added yet, so both frames are empty. 70 kg and 60 kg are sample figures, not measured results.")
        html = html.replace("are Poonam&rsquo;s own.", "are sample values.")
        html = html.replace("not Poonam&rsquo;s own.", "not a real client&rsquo;s.")
        html = html.replace("Poonam&rsquo;s own", "sample")
        html = html.replace("Poonam's own", "sample")
        html = html.replace("Poonam", "the client")
        assert "Poonam" not in html
        return html

    # Each screen carries its own scoped stylesheet — without it the replicas
    # render as bare text (learned the hard way on the first build).
    css = "\n".join(s["css"] for s in a) + "\n" + "\n".join(s["css"] for s in b)
    return ([scrub(s["html"]) for s in a], [scrub(s["html"]) for s in b], css)


A, B, SCREEN_CSS = None, None, ""  # filled in main()

EXTRA_CSS = """
/* ── tour-specific ──────────────────────────────────────────────────────── */
.tour-two { display: flex; gap: 7mm; justify-content: center; margin-top: 7mm; }
.tour-head { text-align: left; }
.tour-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--violet-dim); border: 1px solid rgba(168,85,247,0.4);
  color: var(--violet-3); font-weight: 800; font-size: 13pt; margin-right: 4mm;
  vertical-align: middle; font-family: var(--sans);
}
.tour-h1 { font-size: 30pt; display: inline; vertical-align: middle; }
.tour-line { font-size: 11.5pt; color: var(--w-2); margin-top: 4mm; max-width: 74ch; line-height: 1.5; }
.tour-tags { margin-top: 3.5mm; }

/* the 12-week system grid */
.sys-wrap { display: flex; gap: 10mm; margin-top: 8mm; flex: 1; }
.sys-grid { flex: 1.25; display: flex; flex-direction: column; gap: 2.1mm; }
.sys-month {
  font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--violet-3); margin: 2.4mm 0 0.8mm;
}
.sys-row {
  display: flex; align-items: center; gap: 3.5mm;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 9px; padding: 2.2mm 4mm;
}
.sys-week { width: 17mm; font-weight: 800; font-size: 10pt; color: var(--w-1); }
.sys-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 10px rgba(45,212,191,0.55); flex: none; }
.sys-what { font-size: 9.5pt; color: var(--w-2); white-space: nowrap; }
.sys-review {
  margin-left: auto; font-size: 8pt; font-weight: 700; letter-spacing: 0.06em;
  color: var(--violet-3); background: var(--violet-dim);
  border: 1px solid rgba(168,85,247,0.4); border-radius: 999px; padding: 1.1mm 3mm;
  text-transform: uppercase; white-space: nowrap;
}
.sys-side { flex: 0.75; display: flex; flex-direction: column; gap: 4mm; padding-top: 1mm; }
.sys-stat {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; padding: 5mm 6mm;
}
.sys-stat .n { font-family: var(--serif); font-style: italic; font-size: 26pt; color: var(--w-0); line-height: 1; }
.sys-stat .l { font-size: 8.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: var(--w-3); margin-top: 1.6mm; }
.sys-stat .d { font-size: 9pt; color: var(--w-2); margin-top: 1.6mm; line-height: 1.45; }

/* WhatsApp mock */
.wa-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px; padding: 8mm; max-width: 128mm; margin: 8mm auto 0;
}
.wa-bubble {
  border-radius: 14px; padding: 3.4mm 4.5mm; font-size: 10.5pt; line-height: 1.45;
  max-width: 88%; margin-bottom: 3.2mm; color: var(--w-1);
}
.wa-her { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07); border-bottom-left-radius: 4px; }
.wa-me  { background: rgba(45,212,191,0.13); border: 1px solid rgba(45,212,191,0.3); border-bottom-right-radius: 4px; margin-left: auto; }
.wa-time { font-size: 7.5pt; color: var(--w-4); margin: -1.8mm 0 3mm; }
.wa-time-r { text-align: right; }
"""


def page_open(extra_style=""):
    return f'<section class="page" {extra_style}><div class="glow glow-a"></div><div class="glow glow-b"></div>'


def head(num, title, line, tags=()):
    n = f'<span class="tour-num">{num}</span>' if num else ""
    pills = "".join(f'<span class="pill pill-violet" style="margin-right:2.5mm">{t}</span>' for t in tags)
    return (f'<div class="tour-head">{n}<h1 class="tour-h1">{title}</h1>'
            f'<div class="tour-line">{line}</div>'
            + (f'<div class="tour-tags">{pills}</div>' if tags else "") + "</div>")


def two_phones(s1, s2):
    return (f'<div class="tour-two">'
            f'<div class="phone-wrap"><div class="phone">{s1}</div></div>'
            f'<div class="phone-wrap"><div class="phone">{s2}</div></div>'
            f'</div>')


def cover():
    return page_open('style="justify-content:center;text-align:center"') + """
  <div class="glow glow-c"></div>
  <div>
    <div class="eyebrow" style="font-size:10pt">ThyroWell &middot; The Client App</div>
    <h1 style="font-size:46pt;line-height:1.08;margin-top:6mm">Your 90-day journey,<br>step by step</h1>
    <div class="rule-violet" style="margin:9mm auto 7mm;width:60mm"></div>
    <p class="lead" style="max-width:60ch;margin:0 auto">
      Five deliverables. Eighteen scheduled touchpoints. One app that holds all
      of it &mdash; so you always know exactly where you are, and what happens next.
    </p>
    <div style="margin-top:10mm">
      <span class="pill pill-violet" style="margin:0 1.5mm">1&nbsp;&middot;&nbsp;Consultation</span>
      <span class="pill pill-violet" style="margin:0 1.5mm">2&nbsp;&middot;&nbsp;Nutrition plan</span>
      <span class="pill pill-violet" style="margin:0 1.5mm">3&nbsp;&middot;&nbsp;Training plan</span>
      <span class="pill pill-violet" style="margin:0 1.5mm">4&nbsp;&middot;&nbsp;Check-ins &amp; reviews</span>
      <span class="pill pill-violet" style="margin:0 1.5mm">5&nbsp;&middot;&nbsp;WhatsApp support</span>
    </div>
  </div>
</section>"""


def system_page():
    months = {1: "Month 1 · Set up, and measure", 5: "Month 2 · Live it, and adjust", 9: "Month 3 · See the proof"}
    rows = []
    for w in range(1, 13):
        if w in months:
            rows.append(f'<div class="sys-month">{months[w]}</div>')
        review = ""
        if w % 2 == 0:
            rows.append(
                f'<div class="sys-row" style="border-color:rgba(168,85,247,0.35)">'
                f'<div class="sys-week">Week {w}</div><div class="sys-dot"></div>'
                f'<div class="sys-what">Weekly check-in</div>'
                f'<span class="sys-review">Progress review {w // 2} of 6</span></div>')
        else:
            rows.append(
                f'<div class="sys-row"><div class="sys-week">Week {w}</div><div class="sys-dot"></div>'
                f'<div class="sys-what">Weekly check-in &middot; 5 minutes</div></div>')
    grid = "".join(rows)
    return page_open() + f"""
  {head("", "Nothing here is left to chance", "Every week has a check-in. Every second week goes deeper &mdash; weight, energy, mood, sleep and training, reviewed together. This is the whole quarter, laid out before you start.")}
  <div class="sys-wrap">
    <div class="sys-grid">{grid}</div>
    <div class="sys-side">
      <div class="sys-stat"><div class="n">12</div><div class="l">Weekly check-ins</div>
        <div class="d">Five minutes, sliders and taps. Every one read and answered by me.</div></div>
      <div class="sys-stat"><div class="n">6</div><div class="l">Biweekly progress reviews</div>
        <div class="d">The deeper look: weight, energy, mood, sleep and workouts &mdash; trend, not day.</div></div>
      <div class="sys-stat"><div class="n">90</div><div class="l">Days, one system</div>
        <div class="d">Consultation &rarr; plans &rarr; check-ins &rarr; reviews &rarr; proof. In that order, every time.</div></div>
      <div class="sys-stat" style="border-color:rgba(45,212,191,0.35)"><div class="n">&infin;</div><div class="l">WhatsApp support</div>
        <div class="d">Between all of it: me, on your phone, same day.</div></div>
    </div>
  </div>
</section>"""


def deliverable(num, title, line, s1, s2, tags=()):
    return page_open() + head(num, title, line, tags) + two_phones(s1, s2) + "</section>"


def whatsapp_page():
    return page_open() + head(
        "5", "Unlimited WhatsApp Support",
        "Direct access to me &mdash; not a team, not a bot. Questions, wobbles, restaurant menus, travel weeks: message me and get an answer the same day.",
        ("Real-time help", "Same-day replies", "For the full 90 days"),
    ) + """
  <div class="wa-card">
    <div class="wa-bubble wa-her">Eating out tonight &mdash; what should I pick from a South Indian menu?</div>
    <div class="wa-time">7:41 pm</div>
    <div class="wa-bubble wa-me">Go for plain dosa or idli with extra sambar, skip the vada. Ask for less oil. Enjoy the dinner &mdash; one meal never decides the week.</div>
    <div class="wa-time wa-time-r">7:52 pm</div>
    <div class="wa-bubble wa-her">Energy was low this morning, skipped the workout. Feeling guilty.</div>
    <div class="wa-time">8:03 am</div>
    <div class="wa-bubble wa-me">Good call, not a failure &mdash; that is the plan flexing, not breaking. Do the seated session this evening if you feel up to it, or we move it to tomorrow.</div>
    <div class="wa-time wa-time-r">8:09 am</div>
  </div>
  <div class="card card-violet" style="max-width:128mm;margin:6mm auto 0;padding:5mm 7mm">
    <div class="metric-label" style="color:var(--violet-3)">Bonus</div>
    <div style="font-size:11pt;color:var(--w-1);line-height:1.5">
      Lifetime access to my private client community &mdash; the women who have done
      this before you, still there long after your programme ends.
    </div>
  </div>
</section>"""


def closing(s_ba):
    # The app's empty week-1/week-12 frames beside a real client's filled ones.
    # Vaidehi's card is the site's own published asset (public/transformations/
    # Vaidehi 1.png on swapnilumbarkarfitness.in) — 72 kg to 60 kg in 90 days is
    # her published result, not a number invented for this PDF.
    return page_open() + f"""
  {head("", "Where this lands", "The app keeps your Week&nbsp;1 and Week&nbsp;12 frames waiting from day one. Ninety days of the system on the left is how the picture on the right happens.")}
  <div class="tour-two" style="align-items:flex-start">
    <div class="phone-wrap"><div class="phone">{s_ba}</div></div>
    <div style="width:320px;flex:none">
      <img src="vaidehi-card.jpg" alt="Vaidehi, before and after, 72 kg to 60 kg in 90 days"
           style="width:320px;border-radius:22px;border:1px solid rgba(255,255,255,0.14);display:block;box-shadow:0 30px 70px rgba(0,0,0,0.65)">
      <div style="margin-top:4mm;text-align:center">
        <span class="pill pill-violet">Vaidehi &middot; real client &middot; &minus;12 kg in 90 days</span>
      </div>
      <p style="margin-top:4mm;font-size:9pt;color:var(--w-3);text-align:center;line-height:1.5">
        Result as published on swapnilumbarkarfitness.in.<br>
        Swapnil Umbarkar &middot; Thyroid Fat-Loss Coach &middot; 100+ thyroid women coached
      </p>
    </div>
  </div>
</section>"""


def main():
    global A, B, SCREEN_CSS
    A, B, SCREEN_CSS = load_screens()
    css = open(os.path.join(HERE, "shell.css")).read()

    body = [
        cover(),
        system_page(),
        deliverable("1", "Thyroid &amp; Lifestyle Consultation",
                    "We start with a 60-minute deep-dive. You upload your blood report &mdash; the app reads the values straight off the page &mdash; and we find what has actually been blocking you.",
                    B[0], B[1], ("60 minutes, 1-on-1", "Reports read before we speak", "Root causes, not guesses")),
        deliverable("2", "Customised Indian Nutrition Plan",
                    "Roti, dal, sabzi, curd &mdash; the food you already cook, portioned for thyroid health and steady fat loss. In the app and as a PDF, ticked off meal by meal.",
                    A[3], B[6], ("Indian meals you love", "PDF + app", "Adjusted as you progress")),
        deliverable("3", "Low-Impact Custom Training Plan",
                    "Built around your routine, home or gym. Every movement has a looping demo, easy on the joints, logged set by set &mdash; never guessing what to do or how much.",
                    A[4], B[7], ("Demo video for every exercise", "Home or gym", "Joint-friendly")),
        deliverable("4", "Weekly Check-ins, Reviewed",
                    "Five minutes a week: weight, energy, sleep, mood. And it never disappears into a database &mdash; every check-in comes back reviewed, with what changed.",
                    B[3], B[4], ("12 check-ins in 90 days", "Every one gets a reply", "5 minutes, sliders and taps")),
        deliverable("4", "Biweekly Progress Reviews",
                    "Every two weeks we zoom out: your weight, energy and sleep as a trend, your markers across every report. Decisions from data, not moods.",
                    A[2], B[2], ("6 deep reviews", "Trend over single days", "Take-to-your-doctor charts")),
        whatsapp_page(),
        closing(B[5]),
    ]

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>ThyroWell — App Tour</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap" rel="stylesheet">
<style>
{css}
{SCREEN_CSS}
{EXTRA_CSS}
</style>
</head><body>
{''.join(body)}
</body></html>"""

    out_html = os.path.join(HERE, "app-tour.html")
    open(out_html, "w").write(html)
    print(f"html  {len(html)//1024} KB · {len(body)} pages  →  {out_html}")

    out_pdf = os.path.join(HERE, "ThyroWell-App-Tour.pdf")
    subprocess.run([
        CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
        "--virtual-time-budget=30000",
        f"--print-to-pdf={out_pdf}", f"file://{out_html}",
    ], check=True, capture_output=True)
    print(f"pdf   {os.path.getsize(out_pdf)//1024} KB  →  {out_pdf}")


if __name__ == "__main__":
    main()

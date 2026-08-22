# Design brief prompt for ThyroWell

Paste everything below the line into Claude (or any design tool). It is written
as a brief, not a request for a mockup, because the most useful answer is a
direction you can apply across thirty screens rather than one pretty page.

---

I need a complete visual identity and design direction for a mobile app I have already built. I want considered, opinionated recommendations — not a mockup of one screen. Push back on anything you think is wrong.

## The business

ThyroWell is a one-to-one thyroid fat-loss coaching practice in India. I am a solo coach — I am the entire business. Clients pay upfront for a three-month coaching programme, at a premium price point. The app is how the whole programme is delivered: plans, check-ins, progress, education, and direct access to me.

It runs as an installable app (Android APK and a PWA), used almost entirely on phones.

## Who uses it

**The clients** — this is who the design is for. Indian women, roughly 28 to 45, diagnosed with hypothyroidism or Hashimoto's. Many are post-partum or perimenopausal. Almost all of them have already failed at generic diets and blame themselves for it.

What matters about them emotionally, because it should drive the entire design:

- They have usually been dismissed. Told their reports are "normal" while they feel exhausted, cold, foggy and heavier every month.
- They believe the weight gain is their fault. It largely is not.
- They are tired. Not lazy — genuinely fatigued in a way healthy people do not experience.
- They are not gym people. Fitness culture makes them feel worse, not motivated.
- They are sceptical, because they have been sold things before.

They use mid-range Android phones, read English fluently but think in Hinglish, measure food in katoris and their bodies in inches, and live on WhatsApp.

**The coach (me)** — I need a fast operational panel: who needs attention today, whose plan is due, who has gone quiet.

## What this must NOT feel like

Not a bootcamp. No flames, no "crush it", no streak shaming, no aggressive reds, no before/after weight-loss-ad energy, no bodybuilder aesthetics. Nothing that implies she has been failing through lack of effort.

It should feel like a calm, competent, private clinic that happens to live in her pocket. Closer to a good health record than a fitness tracker. Warm but clinical-grade. Trustworthy enough that she will upload her blood reports into it.

## What I have built (every screen)

**Client side**

1. **Home** — wellness score, current streak, today's training focus, medication reminder, latest note from me
2. **Week 0 state** — for a brand-new client with no data yet: a checklist of things to complete while I build her plan
3. **Plans** — her meal plan and workout plan; a seven-day strip to tap a day and see that session
4. **Meal detail** — what is in a dish, how to cook it, and swap options if she cannot eat it today
5. **Exercise demo** — full-screen animated demonstration of each movement
6. **Weekly check-in** — a nine-step flow: energy, mood, sleep, stress, digestion, adherence, weight, seven body measurements, six thyroid symptoms rated 0-3, and a written reflection
7. **Progress** — three views: weight trend, a bar chart comparing centimetres lost across seven body sites, and wellbeing scores; plus symptom tracking
8. **Progress photos** — upload and side-by-side comparison over time
9. **Health** — blood report upload (parsed on her phone, never uploaded), lab values charted against reference ranges, thyroid profile
10. **Learn** — twelve lessons, unlocked over time, with a reader
11. **Messages** — direct thread with me
12. **Account** — profile and settings

**Coach side**

13. **Roster** — all clients, who has gone quiet, who is waiting on a reply, data-driven alerts
14. **Client detail** — her metrics, an engagement panel showing whether she is actually using the app, her plans, check-in history and photos
15. **Plan builder** — I generate a day of meals from my food library against a calculated calorie and protein target, then edit and assign
16. **Library** — 216 Indian dishes with macros and recipes, 527 exercises with demos

**Public** — landing page, enrolment, privacy, terms, sign-in

## What I have now, visually

I want you to tell me whether to keep, refine, or replace this.

- **Ground:** near-black `#090c14`
- **Cards:** `rgba(255,255,255,0.03)` on a `rgba(255,255,255,0.06)` hairline border, generous corner radius
- **Accent:** teal `#2dd4bf`
- **Semantic:** green `#34d399` good, amber `#f59e0b` attention, rose `#fb7185` and red `#ef4444` problems
- **Text:** `#e8eaf0` primary, `#a9b2c1` secondary, `#7e8a9e` muted, `#5a6578` faint
- **Display type:** Instrument Serif, italic, used for big moments like "11 kg down"
- **UI type:** Satoshi
- Dark only. There is no light mode.

## What I want from you

Be specific and give reasons. Where you recommend a change, say what it fixes.

1. **Overall direction.** Is dark right for a health app used by tired women, often at night but also in Indian daylight? Make the case either way. If you would keep dark, how do I stop it feeling clinical-cold or gaming-adjacent?

2. **Colour.** A full palette with hex values: ground, elevated surfaces, borders, primary and secondary text, accent, and a semantic set. Is teal the right accent for this audience, or is it a default I have drifted into? Note that green/red carry strong "test result" meaning in a health context — tell me how to handle good-versus-bad without making a normal lab value feel like a pass/fail grade.

3. **Typography.** A pairing with specific weights and a type scale. Is a serif display face right here, or does it read decorative next to medical data? Everything must stay legible at small sizes on a mid-range Android screen, including dense number tables.

4. **Logo and wordmark.** Concrete concepts for "ThyroWell" — not just descriptions, but what the mark actually is, why it suits a thyroid practice, and how it works at 48px as an Android launcher icon, as a favicon, and on a WhatsApp profile. Avoid the obvious butterfly-thyroid cliché unless you can make it genuinely good, and say why.

5. **App icon and splash screen.**

6. **Data visualisation.** Much of this app is charts: weight trends, centimetres lost per body site, lab values against reference ranges, symptom severity. Give me a house style — line weights, fills, gridlines, how to show a reference range, how to mark a value that is out of range without alarming her.

7. **Iconography.** Which set, or what characteristics if custom. It must cover food, training, labs, photos, messages and education without looking like a stock dashboard.

8. **Motion.** Where movement earns its place and where it is noise. Bear in mind fatigue is the defining symptom of this audience.

9. **Empty and loading states.** A new client sees an app with no data in it for her entire first week. That week decides whether she trusts the programme. How should emptiness be handled so it feels like a beginning rather than a broken screen?

10. **The two audiences.** Should my coach panel share the client visual language, or be deliberately more utilitarian and information-dense? Argue for one.

11. **Tone in the interface.** Actual example microcopy for: a week with no weight change, an out-of-range lab value, a missed check-in, and a first-week empty state. This is where an app like this is won or lost, and I would rather have four real sentences than a description of a tone of voice.

Please give me a full design system I can hand to a developer, and flag anything in my current setup that is actively working against the audience.

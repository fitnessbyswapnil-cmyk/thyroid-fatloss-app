/**
 * ThyroWell education library — original coaching content, released week by
 * week. Deliberately written as *coaching education*, not medical advice:
 * nothing here tells a client what dose to take or what her labs mean. Every
 * lesson that touches medication or bloodwork points her back to her doctor.
 *
 * Edit here, then run: node --env-file=.env.local scripts/seed-lessons.mjs
 */

export interface LessonSeed {
  slug: string
  title: string
  summary: string
  category: "Medication" | "Nutrition" | "Training" | "Mindset" | "Labs"
  week_number: number
  read_minutes: number
  body: string
}

export const LESSONS: LessonSeed[] = [
  {
    slug: "medication-timing",
    title: "Your tablet, your coffee, and a 4-hour rule",
    summary: "How you take your thyroid medication changes how much of it actually reaches you.",
    category: "Medication",
    week_number: 1,
    read_minutes: 3,
    body: `Thyroid medication is famously fussy about company. Take it with the wrong thing and a meaningful share of the dose never gets absorbed — same tablet, less effect.

The habits that matter most:

- Take it on an empty stomach, with plain water, and wait 30–60 minutes before eating or drinking anything else.
- Coffee and tea are the usual culprits. Even with nothing added, they can blunt absorption. Give it that first half hour.
- Calcium and iron are the big blockers — supplements, milk, fortified drinks. Keep these about 4 hours away from your tablet.
- Antacids and some multivitamins do the same thing. Same 4-hour gap.

Consistency beats perfection. Taking it the *same way* every day matters more than taking it at the theoretically ideal hour, because your doctor adjusts your dose based on results produced by your actual routine. If your routine keeps changing, the numbers get noisy and so do the dose decisions.

If mornings are chaotic, some people do better taking it at bedtime — well after the last meal. That is a conversation to have with your doctor, not a switch to make on your own.

**Your action this week:** pick your slot, set one alarm, and keep it identical for seven days.

*This is general education about absorption, not medical advice. Never change your dose or timing without your doctor.*`,
  },
  {
    slug: "scale-lies-early",
    title: "Why the scale lies for the first three weeks",
    summary: "What's actually happening on the scale early on — and the number worth watching instead.",
    category: "Mindset",
    week_number: 1,
    read_minutes: 3,
    body: `You start eating better, you start moving, and the scale does something insulting: nothing. Or it goes up.

Here's what's usually happening.

- **Water shifts.** Changing how you eat changes how much water your body holds. This can mask real fat loss for weeks.
- **Muscle repair.** New training means small amounts of fluid retained around working muscles. Temporary, and a good sign.
- **Gut content.** More fibre and more volume means more in transit. Not fat.
- **Thyroid-specific fluid.** When thyroid hormone is under-treated, the body tends to hold fluid. As things stabilise this often shifts — but on its own schedule, not yours.

The scale is one noisy measurement of one thing. It cannot tell the difference between fat, water, food and muscle, yet we let it grade our entire week.

**Watch these instead, especially early:** your waist measurement, how your clothes fit, your energy score, and your symptom load in this app. Those move earlier and more honestly than body weight.

**Your action this week:** weigh yourself at most twice, under the same conditions, and judge nothing from a single reading.`,
  },
  {
    slug: "protein-first",
    title: "Protein is your highest-leverage food decision",
    summary: "Why protein does more for thyroid fat loss than any other single change.",
    category: "Nutrition",
    week_number: 2,
    read_minutes: 3,
    body: `If you only fix one thing about how you eat, fix protein.

Why it earns that spot:

- **It protects muscle while you lose fat.** Losing weight without enough protein means losing some muscle with it — and muscle is a big part of what keeps your metabolism where you want it.
- **It's the most filling macronutrient.** Higher protein meals reliably reduce hunger later in the day, which makes everything else easier.
- **It costs energy to digest.** A meaningful slice of protein's calories are used simply processing it.
- **It steadies appetite.** Protein-light meals — tea and toast, fruit alone, plain rice — tend to be followed by cravings two hours later.

The practical version: get a real protein source into every meal, starting with breakfast. That's the meal most people miss, and the one that sets up the whole day.

Easy anchors: eggs, paneer, curd or Greek yoghurt, dal and legumes, tofu or soya, fish, chicken, and a protein supplement if food alone isn't getting you there.

**Your action this week:** make breakfast a protein-first meal, every day. Change nothing else yet.

*Your coach will set your specific targets — this is the principle behind them.*`,
  },
  {
    slug: "normal-tsh-still-tired",
    title: "“My TSH is normal, so why am I still exhausted?”",
    summary: "The other markers that often explain fatigue when thyroid numbers look fine.",
    category: "Labs",
    week_number: 2,
    read_minutes: 4,
    body: `This is one of the most common — and most dismissed — experiences in thyroid care. Your report says normal. Your body disagrees.

A few reasons that gap shows up:

- **"Normal" is a wide range.** Lab reference ranges cover most of a population. Where *you* feel well may sit in a narrower band inside that range.
- **Fatigue has more than one cause.** Low iron stores, low vitamin D, and low B12 all produce tiredness that feels exactly like under-treated thyroid — and they're common, especially in women.
- **Sleep quality, not sleep hours.** Eight broken hours can leave you more depleted than six solid ones.
- **Under-eating.** Chronic low intake, especially low protein and low iron, drives fatigue that no training plan can outrun.
- **Deconditioning.** When fatigue reduces activity, capacity drops, which increases fatigue. It's a loop, and it's reversible.

The useful move is to stop treating "tired" as one undifferentiated thing. In this app you're already tracking energy, sleep and symptoms weekly — that pattern over time tells you and your doctor far more than one number on one day.

**Your action this week:** log honestly, even on bad days. Especially on bad days. The pattern is the point.

*Only your doctor can interpret your labs or decide whether anything needs changing. Bring the trend from this app to your next appointment — it's better information than memory.*`,
  },
  {
    slug: "energy-before-fat-loss",
    title: "Energy improves before fat does — that's the signal",
    summary: "The order things improve in, and why the first win is the one people miss.",
    category: "Mindset",
    week_number: 3,
    read_minutes: 2,
    body: `There's a predictable order to how this goes, and almost nobody is told it in advance.

Roughly:

1. **Sleep and energy** start to shift first.
2. **Digestion and mood** follow.
3. **Measurements** — waist especially — begin to move.
4. **Body weight** changes last, and least smoothly.

This order is why so many people quit at week four. They're doing everything right, they *feel* better, but they judge the whole effort on the number that responds slowest, and conclude it isn't working.

Feeling better isn't a consolation prize while you wait for fat loss. It's the leading indicator that the underlying conditions for fat loss are being restored — better recovery, more capacity to train, steadier appetite, more consistency.

**Your action this week:** open Progress and look at your symptom card and your energy trend, not just weight. If those are moving, the plan is working.`,
  },
  {
    slug: "hair-fall-ferritin",
    title: "Hair fall is usually a supply problem, not a shampoo problem",
    summary: "Why hair sheds during thyroid trouble and weight loss — and what actually helps.",
    category: "Labs",
    week_number: 4,
    read_minutes: 3,
    body: `Hair fall is one of the most distressing thyroid symptoms, and one of the most misdirected — enormous effort goes into products applied to hair that's already grown.

What usually drives it:

- **Iron stores (ferritin).** Hair growth is remarkably sensitive to low iron stores. Ferritin can be low while a routine haemoglobin looks acceptable, which is why it gets missed.
- **Thyroid status itself.** Both under- and over-treatment can trigger shedding.
- **Rapid or aggressive dieting.** Very low intake signals the body to deprioritise hair. Fast weight loss frequently costs hair.
- **Protein intake.** Hair is largely protein. Persistent under-eating shows up there.
- **Timing that confuses everyone.** Shedding often reflects a stressor from *two to three months ago*. So it can start after you've already begun fixing things — which feels like the plan caused it, when you're actually seeing the past.

That delay works in both directions: when it recovers, that improvement also lags.

**Your action this week:** if hair fall is one of your tracked symptoms, keep scoring it weekly and ask your doctor whether checking ferritin makes sense for you.

*Nutrient testing and any supplementation are decisions for your doctor.*`,
  },
  {
    slug: "lift-dont-just-walk",
    title: "Why we lift, not just walk",
    summary: "The case for resistance training when your metabolism feels stuck.",
    category: "Training",
    week_number: 4,
    read_minutes: 3,
    body: `Cardio is good for you. It is not, however, the most efficient tool for the specific problem most thyroid clients have.

The problem is usually this: reduced muscle mass and reduced daily activity, which together lower how much energy the body uses at rest and make fat loss slow and fragile.

Resistance training addresses that directly.

- **It defends muscle in a calorie deficit.** Without it, some of what you lose is muscle — which makes maintaining your result harder later.
- **Muscle is metabolically active tissue.** Keeping more of it means your maintenance intake stays higher.
- **It improves how your body handles carbohydrates.** Trained muscle is better at using glucose.
- **It changes shape faster than the scale changes.** Clothes fit differently well before body weight cooperates.
- **It builds capacity.** More strength means more daily movement feels easy, which quietly adds up.

Two to three focused sessions a week is enough to matter. This isn't about training hard enough to hurt — with thyroid fatigue, recovery is part of the programme, not a break from it.

**Your action this week:** complete your assigned sessions, and if energy is very low, halve the volume rather than skipping. Something beats nothing, consistently.`,
  },
  {
    slug: "sleep-is-a-fat-loss-lever",
    title: "Sleep is a fat-loss lever, not a luxury",
    summary: "How short sleep quietly sabotages appetite, training and results.",
    category: "Mindset",
    week_number: 5,
    read_minutes: 3,
    body: `Short sleep doesn't just make you tired. It actively works against everything else you're doing.

What tends to happen after poor sleep:

- **Hunger goes up and fullness goes down.** The hormonal signals that regulate appetite shift, and cravings for quick energy get louder.
- **Willpower isn't the issue.** Decision-making is measurably worse when under-slept. This is physiology, not weakness.
- **Training quality drops.** Less strength, worse form, slower recovery.
- **Daily movement falls.** You move less without noticing — often more than the workout itself would have burned.
- **Stress hormones stay elevated**, which makes fluid retention and appetite harder to manage.

For thyroid clients this stacks on top of existing fatigue, and it's often the single unaddressed variable when someone is "doing everything right" and stalling.

Practical, in priority order: a consistent wake time (more powerful than a consistent bedtime), no caffeine after early afternoon, and a genuinely dark cool room. Screens matter less than people think compared to those three.

**Your action this week:** fix your wake time — same time daily, weekends included — and log your sleep score honestly.`,
  },
  {
    slug: "cycle-water-weight",
    title: "Your cycle, perimenopause, and the fake weight gain",
    summary: "Why the scale spikes on a predictable schedule, and how to read around it.",
    category: "Mindset",
    week_number: 6,
    read_minutes: 3,
    body: `If you menstruate, your body weight follows a monthly rhythm that has nothing to do with fat.

Typical pattern: fluid retention rises in the second half of the cycle, often peaking in the days before your period, then releases. Two to three kilos of swing is common and entirely normal. It is water, not fat — no one gains that much fat in four days.

If you're in perimenopause, this becomes less predictable rather than less real. Cycles shorten and lengthen, retention patterns shift, sleep is more disrupted, and the scale gets noisier. That's the terrain, not a failure.

How to read around it:

- Compare **this week to the same week last month**, not to last Tuesday.
- Watch the **trend line** in Progress rather than individual readings.
- Expect a whoosh. Fluid held for days often releases all at once, which looks like sudden progress but is really the previous weeks becoming visible.
- Note where you are in your cycle in your check-in reflection. Context makes the data readable.

**Your action this week:** when the scale jumps, check the date before you draw conclusions.`,
  },
  {
    slug: "gut-and-thyroid",
    title: "The gut connection you can actually act on",
    summary: "Why digestion so often travels with thyroid symptoms — and the boring fixes that work.",
    category: "Nutrition",
    week_number: 7,
    read_minutes: 3,
    body: `Sluggish digestion and constipation show up alongside hypothyroidism often enough that they're worth treating as part of the same picture, not a separate annoyance.

When thyroid hormone is low, things slow down generally — including how quickly food moves through you. The result is bloating, irregularity, and a heaviness that gets misread as fat gain.

What actually helps, in order of impact:

- **Water.** Fibre without adequate fluid makes constipation worse, not better. Fluid comes first.
- **Fibre from food.** Vegetables, fruit with skin, whole grains, legumes. Increase gradually — a sudden jump causes exactly the bloating you're trying to fix.
- **Daily movement.** Walking genuinely helps motility. This is one of the underrated benefits of a step target.
- **Regular meal timing.** Erratic eating produces erratic digestion.
- **Fermented foods** — curd, yoghurt with live cultures — as a normal part of meals.

Also worth knowing: bloating is frequently mistaken for fat gain, especially in the evening. Same body, different fluid and gas content.

**Your action this week:** hit your water target daily before you add any more fibre.

*Persistent digestive symptoms deserve a doctor's assessment, not just diet tweaks.*`,
  },
  {
    slug: "stress-and-the-plateau",
    title: "Stress, and why plateaus aren't always about food",
    summary: "What to check when adherence is good but progress stopped.",
    category: "Mindset",
    week_number: 8,
    read_minutes: 3,
    body: `The instinct when progress stalls is to eat less and train more. With thyroid fatigue, that's often exactly the wrong lever.

Things worth checking before cutting further:

- **Are you actually eating enough?** Persistent under-eating drives fatigue, reduces spontaneous movement, and hurts sleep — all of which slow results. Eating more can be the correction.
- **Is life stress up?** Elevated stress increases fluid retention, which can hide fat loss on the scale for weeks.
- **Is sleep down?** See the sleep lesson — this alone can flatten a good plan.
- **Has daily movement dropped?** Structured workouts get logged. The 3,000 steps you quietly stopped taking don't.
- **Is it actually a plateau?** Three weeks of no change is a plateau. Nine days is normal fluctuation.

A real plateau with good adherence usually means the body needs *recovery*, not more restriction. Sometimes the right prescription is a maintenance phase, more sleep, and more protein — not a harder deficit.

**Your action this week:** don't self-prescribe a bigger cut. Message your coach with what's changed in your life, and let the plan be adjusted deliberately.`,
  },
  {
    slug: "keeping-it",
    title: "How to keep what you've built",
    summary: "The shift from losing weight to staying this person.",
    category: "Mindset",
    week_number: 12,
    read_minutes: 3,
    body: `Most people can lose weight. Far fewer keep it, and the difference is rarely willpower — it's what happens the week the programme ends.

What tends to protect a result:

- **Keep the anchors, drop the intensity.** Protein at breakfast, your step target, two strength sessions. Three habits maintained beat ten abandoned.
- **Move to maintenance on purpose.** Deliberately eating a bit more, with a plan, is not failure — it's the phase. Drifting into it without noticing is what causes regain.
- **Keep weighing occasionally.** Not daily, not never. A weekly-ish check catches a 2 kg drift before it becomes 8.
- **Keep training.** The muscle you kept is doing quiet work for your metabolism. It's use-it-or-lose-it.
- **Keep your medication routine identical.** This one never becomes optional.
- **Expect fluctuation and don't panic-restrict.** Overreacting to a normal 2 kg swing is how restrict-rebound cycles start.

The most useful question at the end of a programme isn't "how much did I lose?" It's "which of these can I still be doing in a year?" Whatever survives that question is your actual result.

**Your action this week:** name the three habits you'll keep permanently, and tell your coach what they are.`,
  },
]

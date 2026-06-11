# Coach Check-In Review Feature

## Overview

The coach review experience enables coaches to systematically review pending client check-ins, identify health concerns through intelligent flagging, and send personalized feedback directly within the platform.

## Database Schema

### New Table: `checkin_feedback`

```sql
CREATE TABLE public.checkin_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES public.weekly_checkins(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Indexes:**
- `idx_checkin_feedback_checkin_id` - Fast lookup by check-in
- `idx_checkin_feedback_coach_id` - Fast lookup by coach

## Features

### 1. Pending Reviews Queue

**Location:** Coach Dashboard (`/coach`)

**Sorting Priority:**
1. **Flagged** - Green flag alerts appear first
2. **Due** - Older check-ins (by week_number)
3. **Submitted** - Time order (oldest submitted first)

**Flag Conditions:**
- Energy drop ≥3 points week-over-week
- High stress (≥8/10)
- Large weight change (>1 kg up or down)
- Missing medication adherence (inferred from form data)

**Row Display:**
- Client name with week badge
- Summary wellness score + week-over-week deltas (energy, sleep)
- Flag chip with reason
- Time waiting ("This week", "2w ago", etc.)

### 2. Check-In Review Screen

**Full Check-In Detail View:**

1. **Header** - Client name, week number, back button
2. **Score Card** - Wellness score (0-100) with energy/sleep/weight deltas
3. **Client Reflection** - Full reflection text (highlighted center)
4. **Progress Photos** - Side-by-side grid if any exist for the week
5. **Metrics Changed Most** - Collapsed/expanded view of digestion, stress, other metrics
6. **Feedback Box** - Sticky bottom textarea + send button

### 3. Feedback Submission Flow

**On Submit:**
1. Insert row to `checkin_feedback` table (checkin_id, coach_id, body, created_at)
2. Update `weekly_checkins.status = 'reviewed'`
3. Dismiss review screen, refresh pending queue
4. Show success animation + redirect

**Error Handling:**
- Inline error alerts with retry
- Form data preserved if submission fails

## Server Actions

### `getPendingReviews()`

Fetches all unreviewed check-ins with:
- Client name and week number
- Energy/sleep/stress/weight data
- Previous week data for delta calculation
- Auto-flag detection logic
- Sorted by priority (flagged → due → submitted)

**Returns:** `{ reviews: PendingReview[], error: null | string }`

### `submitCheckInFeedback(checkinId, feedbackBody)`

Submits coach feedback:
- Creates `checkin_feedback` row
- Updates check-in status to "reviewed"
- Returns success/error status

### `getCheckInDetail(checkinId)`

Fetches full check-in context:
- Check-in data + client info
- Previous week for deltas
- Progress photos for the week
- Existing feedback (read-only view for next iteration)

## Design System Integration

- **Colors:** Teal (#2dd4bf) for active states, red (#ef4444) for flags, green (#34d399) for improvements
- **Fonts:** Instrument Serif italic for headings, Satoshi for body
- **Components:** Glass cards, gradient buttons, motion animations
- **Layout:** Mobile-first, safe area padding, sticky header/footer

## Future Enhancements

- Real-time feedback notifications for clients
- Bulk feedback templates library
- Automated alerts for critical health markers
- Historical feedback archive
- Client response threads

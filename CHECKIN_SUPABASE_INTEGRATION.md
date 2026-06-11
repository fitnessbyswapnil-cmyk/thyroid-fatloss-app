# Weekly Check-In to Supabase Integration

## Overview
The weekly check-in form is now fully wired to Supabase with automatic insert/update, delta computation, and error handling.

## Architecture

### Server Action: `app/actions/submit-checkin.ts`
Handles all database operations server-side with proper error handling:
- **Authentication**: Validates user session via `auth.getUser()`
- **Week Detection**: Uses `getWeekNumber()` utility to compute ISO week number
- **Upsert Logic**: Checks if a check-in exists for the current week; inserts if new, updates if exists
- **Data Conversion**: Converts form text values (e.g., "Great", "Intense") to numeric scales
- **Delta Computation**: Fetches previous week's data and calculates energy/sleep/weight deltas
- **RLS Compliance**: All queries respect Supabase RLS policies (client_id = auth.uid())

### Component: `components/dashboard/WeeklyCheckInFlow.tsx`
Updated with Supabase integration:
- **Loading State**: `isSubmitting` flag disables form during submission
- **Error Handling**: Displays inline error card if submission fails; allows retry
- **Submission Handler**: `handleSubmitCheckIn()` calls server action and advances to reveal screen
- **Real Deltas**: `SubmissionRevealStep` uses server-computed deltas instead of placeholders
- **Fallback Display**: If previous week has no data, shows current values with no delta

## Database Mapping

### Form Fields → Table Columns
| Form Field | Column | Type | Notes |
|---|---|---|---|
| energy | energy_level | INTEGER (1-10) | Direct |
| mood | mood | INTEGER (1-5) | Direct |
| sleepQuality | sleep_quality | INTEGER (1-10) | Direct |
| stress | stress_level | INTEGER (1-10) | Direct |
| digestion | digestion_score | INTEGER (1-10) | Converted: Great→9, Okay→6, Sluggish→3, Off→1 |
| bloating | bloating | INTEGER (1-10) | Converted: None→1, Mild→4, Moderate→7, Severe→10 |
| cravings | cravings | INTEGER (1-10) | Converted: Low→2, Manageable→5, Intense→9 |
| nutritionAdherence | adherence_score | INTEGER (0-100) | Converted: Spot-on→100, Mostly→75, Partly→50, Off-track→25 |
| workoutsCompleted | workouts_completed | INTEGER | Direct |
| workoutsTarget | workouts_target | INTEGER | Direct |
| medsTaken | meds_taken | INTEGER | Direct |
| medsTarget | meds_target | INTEGER | Direct |
| weight | weight | DECIMAL (nullable) | Direct, nullable |
| symptoms | symptoms | JSONB | Array stored as-is |
| reflectionText | reflection_text | TEXT | Direct |

### Auto-Generated Fields
- `client_id`: Set to `auth.user.id`
- `week_number`: Computed from current date (ISO 8601)
- `status`: Set to `'submitted'`
- `submitted_at`: Set to current timestamp
- `created_at`/`updated_at`: Database defaults

## Error Handling

### Inline Error Display
If submission fails:
1. Error card appears with alert icon and red styling
2. User sees the specific error message (e.g., "Failed to save check-in: ...")
3. "Try Again" button reloads the page
4. Form data is preserved in component state

### Server-Side Errors Caught
- Authentication failures (no logged-in user)
- RLS policy violations (impossible with current setup, but guarded)
- Database constraint violations
- Network/connection errors

## Delta Calculation

### Week Score
$$\text{weekScore} = \lfloor\frac{\text{energy} + \text{sleepQuality} + (10 - \text{stress})}{3}\rfloor$$

### Deltas
- **Energy Delta**: current energy - previous week energy
- **Sleep Delta**: current sleep quality - previous week sleep quality  
- **Weight Delta**: previous week weight - current weight (inverted so negative = loss)

If no previous week exists, deltas are 0 (no comparison shown).

## Testing the Integration

### Happy Path
1. Log in and navigate to `/dashboard/check-in`
2. Complete all 7 steps
3. Submit: Should see animated reveal screen with real deltas and Supabase-stored data
4. Check Supabase console: Verify row in `weekly_checkins` table

### Error Path
1. Complete steps but disable WiFi/network before submitting
2. Should see inline error: "Failed to save check-in"
3. Enable network and click "Try Again"
4. Should succeed and show reveal screen

### Update Path
1. Submit a check-in for Week 20
2. Go back to `/dashboard/check-in` and submit again
3. Should update the existing row (not create a new one)
4. Verify in Supabase: only 1 row for Week 20, with updated values

## Future Enhancements
- Real coach feedback in the dashboard (coach_insights table)
- Persistent week history view
- Trend charts using delta data
- Notification when Dr. Rashmi reviews the check-in

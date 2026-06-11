# Supabase Migrations

This directory contains all database schema migrations for the ThyroWell coaching platform.

## Running Migrations

Migrations are versioned SQL files that should be applied in order:

```bash
# Apply all migrations (handled by Supabase CLI or dashboard)
supabase migrations up

# Apply specific migration
supabase db push
```

## Migration Files

### 001_initial_schema.sql
**Status**: ✅ Applied  
**Contents**:
- Creates UUID extension
- Creates all 8 tables: clients, weekly_checkins, progress_photos, meal_tracking, workout_tracking, coach_insights, daily_habits, testimonials
- Enables RLS on all tables
- Creates RLS policies for default-deny isolation with client-owns-own and coach-reads-clients patterns
- Creates updated_at trigger for automatic timestamp management

### 002_add_handle_new_user_trigger.sql
**Status**: ✅ Applied  
**Contents**:
- Creates `handle_new_user()` function (SECURITY DEFINER) to auto-create client profile on auth user signup
- Creates `on_auth_user_created` trigger on auth.users table
- Automatically sets role from user metadata, defaults to 'client' if not specified
- Handles email confirmation workflow by running with elevated privileges

### 003_enhance_weekly_checkins.sql
**Status**: ✅ Applied  
**Contents**:
- Adds 9 new columns to weekly_checkins table:
  - `bloating` (INTEGER CHECK 1-10)
  - `cravings` (INTEGER CHECK 1-10)
  - `meds_taken` (INTEGER DEFAULT 0)
  - `meds_target` (INTEGER DEFAULT 0)
  - `workouts_target` (INTEGER DEFAULT 0)
  - `sleep_quality` (INTEGER CHECK 1-10)
  - `symptoms` (JSONB for flexible symptom tracking)
  - `reflection_text` (TEXT for client reflection)
  - `status` (TEXT CHECK pending/submitted/reviewed)
- Creates composite index `idx_weekly_checkins_client_week` for query optimization

## Tables Overview

| Table | Rows | RLS | Backup | Purpose |
|-------|------|-----|--------|---------|
| clients | ~50-1000 | ✅ | Daily | User profiles linked to auth.users |
| weekly_checkins | ~1000s | ✅ | Daily | 15-day health tracking (most queries) |
| progress_photos | ~100s | ✅ | Weekly | Transformation photos per week |
| meal_tracking | ~10000s | ✅ | Daily | Daily meal logs |
| workout_tracking | ~5000s | ✅ | Daily | Daily exercise logs |
| coach_insights | ~100s | ✅ | Daily | Coach messages to clients |
| daily_habits | ~5000s | ✅ | Daily | Daily habit completion (7 habits) |
| testimonials | ~20-100 | ✅ | Weekly | Client success stories (public) |

## RLS Policy Architecture

### Default Deny Pattern
All tables use PERMISSIVE policies (explicit allows) with no RESTRICTIVE policies:
- No matching policy = access denied
- Only explicitly allowed operations succeed

### Isolation Model
```
┌─ Clients
│  ├─ SELECT: Only own row (auth.uid() = id)
│  ├─ INSERT: Only own row
│  ├─ UPDATE: Only own row
│  └─ DELETE: Only own row
│
├─ Coaches/Admins
│  ├─ SELECT: All rows (role='coach' or role='admin')
│  ├─ INSERT: All rows
│  ├─ UPDATE: All rows
│  └─ DELETE: All rows
│
└─ Unauthenticated
   └─ Access Denied (no policies match)
```

### Policy Details

#### clients table
- `clients_select_own`: auth.uid() = id
- `coaches_select_all`: User role is coach or admin
- Plus INSERT, UPDATE, DELETE equivalents for each

#### weekly_checkins table
- `checkins_select_own`: auth.uid() = client_id
- `coaches_checkins_select`: User role is coach or admin
- Plus INSERT, UPDATE, DELETE equivalents for each

#### progress_photos table
- `photos_select_own`: auth.uid() = client_id
- `coaches_photos_select`: User role is coach or admin
- Plus INSERT, UPDATE, DELETE equivalents for each

#### coach_insights table
- `insights_select_own`: auth.uid() = client_id (clients read own insights)
- `coaches_insights_select`: User role is coach or admin
- `coaches_insights_insert`: User role is coach or admin (can send to any client)
- Plus UPDATE for marking insights as read

## Verification Checklist

- ✅ handle_new_user trigger exists and fires on auth.users INSERT
- ✅ weekly_checkins has all required columns including: energy, mood, sleep_quality, stress, digestion, bloating, cravings, nutrition_adherence, workouts_completed, workouts_target, meds_taken, meds_target, weight, symptoms, reflection_text, week_number, submitted_at, status
- ✅ All critical tables (clients, weekly_checkins, progress_photos, coach_insights) have default-deny RLS
- ✅ All tables have client-owns-own policies
- ✅ All tables have coach-reads-clients policies
- ✅ No RESTRICTIVE policies (all PERMISSIVE)
- ✅ No cross-contamination possible between clients

## Performance Indexes

Created indexes to optimize common queries:

```sql
-- weekly_checkins queries (most common)
CREATE INDEX idx_weekly_checkins_client_week 
  ON public.weekly_checkins(client_id, week_number DESC);
```

This enables fast queries like:
```sql
SELECT * FROM weekly_checkins 
WHERE client_id = $1 
ORDER BY week_number DESC 
LIMIT 10;
```

## Application Requirements

When using this schema in your application:

1. **Always use Supabase client library** - RLS is automatically enforced by auth session
2. **Always pass auth.uid()** - Never hardcode user IDs in queries
3. **Never disable RLS** - Only use RLS-disabled queries for administrative tasks
4. **Test isolation** - Verify clients cannot access each other's data
5. **Monitor RLS logs** - Check for unexpected policy denials

Example query (RLS-safe):
```typescript
const { data } = await supabase
  .from('weekly_checkins')
  .select('*')
  .eq('client_id', session.user.id)  // RLS checks auth.uid() = client_id
  .order('week_number', { ascending: false });
```

The RLS policy will automatically prevent cross-client access.

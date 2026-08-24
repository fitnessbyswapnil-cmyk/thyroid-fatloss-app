import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { programmeWeek } from '@/lib/health/programme'
import { ProgressPhotoFlow } from '@/components/dashboard/ProgressPhotoFlow'

export default async function ProgressPhotoPage() {
  const supabase = await createClient()

  // getUser() here was an Auth-server round trip to Singapore in front of the
  // one query this page actually needs. getAuthUser verifies the same token
  // locally, which is what the rest of the dashboard already does.
  const user = await getAuthUser(supabase)

  if (!user) {
    redirect('/auth/login')
  }

  // Programme week, not the ISO week of the year. The other photo flow already
  // stores weeks-since-start, so using the calendar week here meant the two
  // never lined up and a photo could sit under "Week 34" on a client in her
  // tenth week.
  const { data: client } = await supabase
    .from('clients')
    .select('start_date')
    .eq('id', user.id)
    .maybeSingle()
  const currentWeek = programmeWeek(client?.start_date, new Date()) ?? 1

  return (
    <div className="h-screen bg-[#090c14]">
      <ProgressPhotoFlow checkInWeek={currentWeek} />
    </div>
  )
}

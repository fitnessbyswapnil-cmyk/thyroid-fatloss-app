import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { programmeWeek } from '@/lib/health/programme'
import { ProgressPhotoFlow } from '@/components/dashboard/ProgressPhotoFlow'

export default async function ProgressPhotoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

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

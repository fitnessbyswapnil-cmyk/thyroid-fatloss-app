import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWeekNumber } from '@/lib/utils'
import { ProgressPhotoFlow } from '@/components/dashboard/ProgressPhotoFlow'

export default async function ProgressPhotoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get current week number for progress photo metadata
  const currentWeek = getWeekNumber(new Date())

  return (
    <div className="h-screen bg-[#fdfbf7]">
      <ProgressPhotoFlow checkInWeek={currentWeek} />
    </div>
  )
}

import { createClient } from '@/lib/supabase/client'

export async function addNotification(text: string, type: 'info' | 'success' | 'warning' = 'info') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('notifications').insert({ user_id: user.id, type, text })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ ok: false, stage: 'auth', error: authErr?.message || 'not logged in' })
    }

    // Test instructions table
    const testId = crypto.randomUUID()
    const { error: insertErr } = await supabase
      .from('instructions')
      .insert({ id: testId, user_id: user.id, data: { id: testId, test: true, text: 'db-test', agent: 'test', priority: 'normal', createdAt: 'now', status: 'received' } })

    if (insertErr) {
      return NextResponse.json({ ok: false, stage: 'instructions_insert', error: insertErr.message, code: insertErr.code })
    }

    await supabase.from('instructions').delete().eq('id', testId)

    // Test board_decisions table
    const testId2 = crypto.randomUUID()
    const { error: boardErr } = await supabase
      .from('board_decisions')
      .insert({ id: testId2, user_id: user.id, data: { id: testId2, test: true } })

    if (boardErr) {
      return NextResponse.json({ ok: false, stage: 'board_decisions_insert', error: boardErr.message, code: boardErr.code })
    }

    await supabase.from('board_decisions').delete().eq('id', testId2)

    return NextResponse.json({ ok: true, user_id: user.id, message: 'כל הטבלאות עובדות תקין' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'exception', error: e.message })
  }
}

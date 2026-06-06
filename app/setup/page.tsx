'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, Copy, ExternalLink } from 'lucide-react'

const SQL = `-- Run this in Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS public.instructions (
  id         UUID        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.board_decisions (
  id         UUID        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.instructions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own instructions"    ON public.instructions;
DROP POLICY IF EXISTS "Users manage own board_decisions" ON public.board_decisions;

CREATE POLICY "Users manage own instructions"
  ON public.instructions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own board_decisions"
  ON public.board_decisions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`

type CheckResult = {
  ok: boolean
  stage?: string
  error?: string
  code?: string
  user_id?: string
  message?: string
}

export default function SetupPage() {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const runCheck = async () => {
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/db-check')
      const data = await r.json()
      setResult(data)
    } catch (e: any) {
      setResult({ ok: false, stage: 'fetch', error: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runCheck() }, [])

  const copy = async () => {
    await navigator.clipboard.writeText(SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stageLabel: Record<string, string> = {
    auth: 'אימות — לא מחובר',
    instructions_insert: 'טבלת instructions — שגיאה בכתיבה',
    board_decisions_insert: 'טבלת board_decisions — שגיאה בכתיבה',
    exception: 'שגיאה כללית',
    fetch: 'שגיאת רשת',
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1">הגדרת מסד נתונים</h1>
          <p className="text-sm text-gray-400">בדיקת חיבור Supabase ויצירת הטבלאות הנדרשות</p>
        </div>

        {/* Status card */}
        <div className={`rounded-2xl border p-5 ${result?.ok ? 'border-green-500/30 bg-green-500/5' : result && !result.ok ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/3'}`}>
          <div className="flex items-center gap-3 mb-3">
            {loading ? (
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            ) : result?.ok ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : result ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : null}
            <span className="font-semibold text-sm">
              {loading ? 'בודק חיבור...' : result?.ok ? 'מסד הנתונים תקין — הכל עובד!' : result ? 'נמצאה בעיה' : 'לחץ בדוק'}
            </span>
            <button onClick={runCheck} disabled={loading}
              className="ml-auto text-xs bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40">
              בדוק שוב
            </button>
          </div>

          {result && !result.ok && (
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-red-400 font-medium shrink-0">שלב:</span>
                <span className="text-gray-300">{stageLabel[result.stage || ''] || result.stage}</span>
              </div>
              {result.error && (
                <div className="flex items-start gap-2">
                  <span className="text-red-400 font-medium shrink-0">שגיאה:</span>
                  <span className="text-gray-300 font-mono text-xs break-all">{result.error}</span>
                </div>
              )}
              {result.code && (
                <div className="flex items-start gap-2">
                  <span className="text-red-400 font-medium shrink-0">קוד:</span>
                  <span className="text-gray-300 font-mono text-xs">{result.code}</span>
                </div>
              )}
              {result.stage === 'auth' && (
                <p className="text-amber-400 text-xs mt-3">יש להתחבר למערכת לפני הבדיקה. <a href="/login" className="underline">לחץ כאן לכניסה</a></p>
              )}
              {(result.stage === 'instructions_insert' || result.stage === 'board_decisions_insert') && (
                <p className="text-amber-400 text-xs mt-3">
                  {result.code === '42P01' ? 'הטבלאות לא קיימות — הרץ את ה-SQL למטה ב-Supabase Dashboard.' :
                   result.code === '42501' || result.code === 'PGRST116' ? 'מדיניות RLS חוסמת כתיבה — הרץ את ה-SQL למטה ב-Supabase Dashboard.' :
                   'בעיה בכתיבה לטבלה — הרץ את ה-SQL למטה ב-Supabase Dashboard.'}
                </p>
              )}
            </div>
          )}

          {result?.ok && (
            <p className="text-green-400 text-sm">
              משתמש: <span className="font-mono text-xs">{result.user_id}</span>
            </p>
          )}
        </div>

        {/* SQL section */}
        {(!result?.ok || !result) && (
          <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <span className="text-sm font-semibold">SQL להרצה ב-Supabase Dashboard</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  פתח Supabase <ExternalLink className="w-3 h-3" />
                </a>
                <button onClick={copy}
                  className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/15 text-gray-300'}`}>
                  <Copy className="w-3 h-3" />
                  {copied ? 'הועתק!' : 'העתק'}
                </button>
              </div>
            </div>
            <pre className="p-5 text-xs text-gray-300 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">{SQL}</pre>
          </div>
        )}

        {/* Instructions */}
        {(!result?.ok || !result) && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 space-y-3">
            <p className="text-sm font-semibold">הוראות התקנה:</p>
            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
              <li>לחץ &quot;פתח Supabase&quot; → בחר את הפרויקט שלך</li>
              <li>בתפריט הצד: <strong className="text-white">SQL Editor</strong> → <strong className="text-white">+ New query</strong></li>
              <li>הדבק את ה-SQL (לחץ &quot;העתק&quot; למעלה)</li>
              <li>לחץ <strong className="text-white">Run</strong></li>
              <li>חזור לדף זה ולחץ <strong className="text-white">בדוק שוב</strong></li>
            </ol>
          </div>
        )}

        {result?.ok && (
          <div className="text-center">
            <a href="/" className="inline-block bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 px-6 py-3 rounded-xl text-sm font-medium transition-all">
              חזור לדאשבורד
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

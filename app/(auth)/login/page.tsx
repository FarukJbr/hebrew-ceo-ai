'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(`שגיאה: ${error.message} (${error.status ?? 'no status'})`)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg-base bg-grid-pattern flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: 'rgba(212,175,55,0.05)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: 'rgba(212,175,55,0.03)' }} />

      <div className="w-full max-w-md animate-fade-in relative">
        {/* Logo + Company */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size={72} spin />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Prime Ledger Solutions</h1>
          <p className="text-text-secondary text-sm mt-1">גבר יזמות ייעוץ עסקי והשקעות</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8" style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08)' }}>
          <h2 className="text-lg font-semibold text-text-primary mb-1">כניסה למערכת</h2>
          <p className="text-text-secondary text-sm mb-6">ברוך הבא, יו״ר הדירקטוריון</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                כתובת אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="chairman@company.com"
                  className="w-full bg-white/5 border rounded-xl px-4 py-3 pr-10
                             text-text-primary placeholder-text-muted text-sm
                             focus:outline-none transition-all duration-200"
                  style={{ borderColor: 'rgba(212,175,55,0.2)' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border rounded-xl px-4 py-3 pr-10 pl-10
                             text-text-primary placeholder-text-muted text-sm
                             focus:outline-none transition-all duration-200"
                  style={{ borderColor: 'rgba(212,175,55,0.2)' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl px-4 py-3 text-accent-red text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full font-semibold py-3 rounded-xl
                         active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #b8922a)',
                color: '#13100b',
                boxShadow: '0 0 20px rgba(212,175,55,0.25)',
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> מתחבר...</>
              ) : (
                'כניסה למערכת'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Prime Ledger Solutions v1.0 — מוגן ומאובטח
        </p>
      </div>
    </div>
  )
}

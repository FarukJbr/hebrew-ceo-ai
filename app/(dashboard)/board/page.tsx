'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Vote, Plus, ThumbsUp, ThumbsDown, Minus, Users, Calendar, FileText, ChevronDown, ChevronUp, CheckCircle2, Filter, X } from 'lucide-react'

type VoteResult = 'approved' | 'rejected' | 'pending'

interface DirectorVote {
  director: string
  vote: 'for' | 'against' | 'abstain' | null
}

interface BoardDecision {
  id: number
  title: string
  description: string
  date: string
  proposedBy: string
  directorVotes: DirectorVote[]
  chairmanVote: 'for' | 'against' | 'abstain' | null
  result: VoteResult
  category: string
  notes?: string
}

const DIRECTORS = ['OpenAI', 'Gemini', 'Claude']
const CATEGORIES = ['השקעות נדל״ן','תקציב','התרחבות','משאבי אנוש','טכנולוגיה','אסטרטגיה','תפעול','משפטי']

const initialDecisions: BoardDecision[] = [
  {
    id: 1,
    title: 'השקעה בנכס מסחרי — תל אביב',
    description: 'אישור השקעה בנכס מסחרי ברח׳ אלנבי 45, תל אביב בסך ₪3.2M. הנכס מיועד להשכרה לעסקים עם תשואה צפויה של 7% שנתי',
    date: '10/06/2026',
    proposedBy: 'מחלקת נדל״ן — שירה AI',
    directorVotes: DIRECTORS.map(d => ({ director: d, vote: null })),
    chairmanVote: null,
    result: 'pending',
    category: 'השקעות נדל״ן',
  },
  {
    id: 2,
    title: 'אישור תקציב שיווק Q3',
    description: 'אישור תקציב שיווק של ₪240,000 לרבעון Q3 2026, כולל קמפיין אירופה וכנסים מקצועיים',
    date: '03/06/2026',
    proposedBy: 'מחלקת שיווק — יובל AI',
    directorVotes: [{ director: 'OpenAI', vote: 'for' }, { director: 'Gemini', vote: 'for' }, { director: 'Claude', vote: 'for' }],
    chairmanVote: 'for',
    result: 'approved',
    category: 'תקציב',
    notes: 'אושר פה אחד על ידי כל הדירקטוריון. תנאי: דוח מעקב חודשי על ביצוע התקציב.',
  },
  {
    id: 3,
    title: 'כניסה לשותפות עסקית — חברת Gamma',
    description: 'הצטרפות לשותפות עם חברת Gamma לפיתוח שירותי ייעוץ לשוק הגרמני, השקעה ראשונית ₪500K',
    date: '28/05/2026',
    proposedBy: 'מחלקת הנהלה — אריאל AI',
    directorVotes: [{ director: 'OpenAI', vote: 'for' }, { director: 'Gemini', vote: 'against' }, { director: 'Claude', vote: 'for' }],
    chairmanVote: 'for',
    result: 'approved',
    category: 'התרחבות',
    notes: 'אושר ברוב (3 בעד, 1 נגד). יש להכין הסכם שותפות מפורט.',
  },
  {
    id: 4,
    title: 'גיוס מנהל בכיר — VP Finance',
    description: 'אישור גיוס סמנכ״ל כספים חיצוני, תקציב שכר ₪45K/חודש + תנאים נלווים',
    date: '15/05/2026',
    proposedBy: 'מחלקת משאבי אנוש — דניאל AI',
    directorVotes: [{ director: 'OpenAI', vote: 'for' }, { director: 'Gemini', vote: 'for' }, { director: 'Claude', vote: 'for' }],
    chairmanVote: 'for',
    result: 'approved',
    category: 'משאבי אנוש',
    notes: 'אושר פה אחד.',
  },
  {
    id: 5,
    title: 'רכישת כלי AI לניתוח נתונים',
    description: 'רכישת מנוי שנתי לפלטפורמת BI מתקדמת — ₪85K לשנה',
    date: '01/05/2026',
    proposedBy: 'מחלקת טכנולוגיה — רון AI',
    directorVotes: [{ director: 'OpenAI', vote: 'against' }, { director: 'Gemini', vote: 'against' }, { director: 'Claude', vote: 'for' }],
    chairmanVote: 'against',
    result: 'rejected',
    category: 'טכנולוגיה',
    notes: 'נדחה ברוב (3 נגד, 1 בעד). הוחלט לבחון חלופות זולות יותר.',
  },
]

const resultConfig: Record<VoteResult, { label: string; color: string; bg: string }> = {
  approved: { label: 'אושר',  color: 'text-accent-green', bg: 'bg-accent-green/10' },
  rejected: { label: 'נדחה',  color: 'text-accent-red',   bg: 'bg-accent-red/10' },
  pending:  { label: 'ממתין', color: 'text-accent-amber',  bg: 'bg-accent-amber/10' },
}

const voteLabel = (v: 'for'|'against'|'abstain'|null) =>
  v === 'for' ? '✓ בעד' : v === 'against' ? '✗ נגד' : v === 'abstain' ? '— נמנע' : '—'

const voteColor = (v: 'for'|'against'|'abstain'|null) =>
  v === 'for' ? 'text-accent-green' : v === 'against' ? 'text-accent-red' : v === 'abstain' ? 'text-text-muted' : 'text-text-muted'

interface DecisionCardProps {
  decision: BoardDecision
  onVote: (id: number, vote: 'for' | 'against' | 'abstain') => void
}

function DecisionCard({ decision, onVote }: DecisionCardProps) {
  const [expanded, setExpanded] = useState(decision.result === 'pending')
  const r = resultConfig[decision.result]
  const forCount = (decision.directorVotes.filter(v=>v.vote==='for').length) + (decision.chairmanVote === 'for' ? 1 : 0)
  const againstCount = (decision.directorVotes.filter(v=>v.vote==='against').length) + (decision.chairmanVote === 'against' ? 1 : 0)
  const abstainCount = (decision.directorVotes.filter(v=>v.vote==='abstain').length) + (decision.chairmanVote === 'abstain' ? 1 : 0)
  const totalVoted = forCount + againstCount + abstainCount

  return (
    <div className={`glass-card rounded-2xl p-5 border transition-all ${decision.result === 'pending' ? 'border-accent-amber/20' : 'border-border-muted'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.bg}`}>
          <Vote className={`w-4 h-4 ${r.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{decision.title}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-text-muted"><Calendar className="w-3 h-3" />{decision.date}</span>
                <span className="flex items-center gap-1 text-xs text-text-muted"><Users className="w-3 h-3" />{decision.proposedBy}</span>
                <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">{decision.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${r.bg} ${r.color}`}>{r.label}</span>
              <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-secondary">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 space-y-4 pt-3 border-t border-border-muted">
              <p className="text-sm text-text-secondary leading-relaxed">{decision.description}</p>

              {/* Vote breakdown */}
              {totalVoted > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-2">פירוט הצבעות:</p>
                  <div className="space-y-1.5">
                    {[...decision.directorVotes, { director: 'יו״ר הדירקטוריון', vote: decision.chairmanVote }].map(dv => (
                      <div key={dv.director} className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">{dv.director}</span>
                        <span className={`font-medium ${voteColor(dv.vote)}`}>{voteLabel(dv.vote)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border-muted">
                    <span className="flex items-center gap-1 text-xs text-accent-green font-semibold"><ThumbsUp className="w-3 h-3" />{forCount} בעד</span>
                    <span className="flex items-center gap-1 text-xs text-accent-red font-semibold"><ThumbsDown className="w-3 h-3" />{againstCount} נגד</span>
                    {abstainCount > 0 && <span className="text-xs text-text-muted">{abstainCount} נמנע</span>}
                  </div>
                </div>
              )}

              {/* Voting buttons */}
              {decision.result === 'pending' && (
                <div className="space-y-2">
                  {decision.chairmanVote ? (
                    <div className="flex items-center gap-2 bg-accent-green/5 border border-accent-green/20 rounded-xl px-4 py-3">
                      <CheckCircle2 className="w-4 h-4 text-accent-green" />
                      <span className="text-sm text-accent-green font-medium">
                        הצבעת: {decision.chairmanVote === 'for' ? 'בעד ✓' : decision.chairmanVote === 'against' ? 'נגד ✗' : 'נמנע'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-text-muted mb-2">הצבע כיו״ר הדירקטוריון:</p>
                      <div className="flex gap-2">
                        <button onClick={() => onVote(decision.id, 'for')}
                          className="flex items-center gap-1.5 bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/20 text-accent-green text-xs px-4 py-2 rounded-xl transition-all active:scale-95">
                          <ThumbsUp className="w-3.5 h-3.5" /> אישור
                        </button>
                        <button onClick={() => onVote(decision.id, 'against')}
                          className="flex items-center gap-1.5 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 text-accent-red text-xs px-4 py-2 rounded-xl transition-all active:scale-95">
                          <ThumbsDown className="w-3.5 h-3.5" /> דחייה
                        </button>
                        <button onClick={() => onVote(decision.id, 'abstain')}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 border border-border-muted text-text-muted text-xs px-4 py-2 rounded-xl transition-all active:scale-95">
                          <Minus className="w-3.5 h-3.5" /> נמנע
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {decision.notes && (
                <div className="bg-white/3 border border-border-muted rounded-xl p-3">
                  <p className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> הערות פרוטוקול:
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed">{decision.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const [decisions, setDecisions] = useState<BoardDecision[]>(initialDecisions)
  const [showForm, setShowForm] = useState(false)
  const [filterResult, setFilterResult] = useState<VoteResult | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const [nTitle, setNTitle] = useState('')
  const [nDesc, setNDesc] = useState('')
  const [nCategory, setNCategory] = useState(CATEGORIES[0])
  const [nProposed, setNProposed] = useState('הנהלה — אריאל AI')

  const handleVote = (id: number, vote: 'for' | 'against' | 'abstain') => {
    setDecisions(prev => prev.map(d => {
      if (d.id !== id) return d
      const newD = { ...d, chairmanVote: vote }
      // Auto-assign AI director votes for demo
      const aiVotes: DirectorVote[] = d.directorVotes.map(dv => {
        if (dv.vote !== null) return dv
        const rand = Math.random()
        return { director: dv.director, vote: rand > 0.35 ? 'for' : rand > 0.15 ? 'against' : 'abstain' }
      })
      newD.directorVotes = aiVotes
      const forCount = aiVotes.filter(v=>v.vote==='for').length + (vote === 'for' ? 1 : 0)
      const againstCount = aiVotes.filter(v=>v.vote==='against').length + (vote === 'against' ? 1 : 0)
      newD.result = forCount > againstCount ? 'approved' : 'rejected'
      return newD
    }))
  }

  const addProposal = () => {
    if (!nTitle.trim()) return
    setDecisions(prev => [{
      id: Date.now(), title: nTitle, description: nDesc, date: new Date().toLocaleDateString('he-IL').replace(/\./g,'/'),
      proposedBy: nProposed, directorVotes: DIRECTORS.map(d => ({ director: d, vote: null })),
      chairmanVote: null, result: 'pending', category: nCategory,
    }, ...prev])
    setNTitle(''); setNDesc(''); setNCategory(CATEGORIES[0]); setShowForm(false)
  }

  const filtered = decisions.filter(d => {
    if (filterResult !== 'all' && d.result !== filterResult) return false
    if (filterCategory !== 'all' && d.category !== filterCategory) return false
    return true
  })

  const pending = filtered.filter(d => d.result === 'pending')
  const history = filtered.filter(d => d.result !== 'pending')

  return (
    <div className="min-h-screen">
      <Header title="דירקטוריון" subtitle="החלטות, הצבעות ופרוטוקולים | דירקטורים: יו״ר + OpenAI + Gemini + Claude" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'ממתין להצבעה', value: decisions.filter(d=>d.result==='pending').length, color: 'text-accent-amber' },
            { label: 'אושרו', value: decisions.filter(d=>d.result==='approved').length, color: 'text-accent-green' },
            { label: 'נדחו', value: decisions.filter(d=>d.result==='rejected').length, color: 'text-accent-red' },
            { label: 'סה״כ החלטות', value: decisions.length, color: 'text-accent-cyan' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl p-4">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Director badges */}
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-text-muted">חברי דירקטוריון:</span>
          <span className="text-xs bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 px-3 py-1 rounded-full">יו״ר הדירקטוריון</span>
          <span className="text-xs bg-accent-green/10 text-accent-green border border-accent-green/20 px-3 py-1 rounded-full">OpenAI Director</span>
          <span className="text-xs bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-3 py-1 rounded-full">Gemini Director</span>
          <span className="text-xs bg-accent-amber/10 text-accent-amber border border-accent-amber/20 px-3 py-1 rounded-full">Claude Director</span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted'}`}>
            <Filter className="w-3.5 h-3.5" /> פילטרים
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> הצעה חדשה
          </button>
        </div>

        {showFilters && (
          <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 border border-accent-cyan/10">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
              <div className="flex gap-1 flex-wrap">
                {(['all','pending','approved','rejected'] as const).map(r => (
                  <button key={r} onClick={() => setFilterResult(r)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterResult===r ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted'}`}>
                    {r==='all'?'הכל':r==='pending'?'ממתין':r==='approved'?'אושר':'נדחה'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">קטגוריה</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none">
                <option value="all" className="bg-bg-card">הכל</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-bg-card">{c}</option>)}
              </select>
            </div>
            <button onClick={() => { setFilterResult('all'); setFilterCategory('all') }}
              className="self-end text-xs text-text-muted hover:text-accent-red flex items-center gap-1">
              <X className="w-3 h-3" /> איפוס
            </button>
          </div>
        )}

        {/* New proposal form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-5 border border-accent-cyan/20 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Vote className="w-4 h-4 text-accent-cyan" /> הצעה חדשה לדירקטוריון
            </h3>
            <input value={nTitle} onChange={e=>setNTitle(e.target.value)} placeholder="כותרת ההצעה *"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" />
            <textarea value={nDesc} onChange={e=>setNDesc(e.target.value)} placeholder="תיאור מפורט של ההצעה..." rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all resize-none" />
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-text-muted mb-1">קטגוריה</label>
                <select value={nCategory} onChange={e=>setNCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-bg-card">{c}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs text-text-muted mb-1">מוגש על ידי</label>
                <input value={nProposed} onChange={e=>setNProposed(e.target.value)} placeholder="מחלקה / שם"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none" />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={addProposal}
                  className="bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90 transition-all">
                  הגש הצעה
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-white/5 text-text-secondary text-xs px-3 py-2 rounded-xl hover:bg-white/8 transition-all">
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-accent-amber uppercase tracking-wider">ממתין להצבעה ({pending.length})</h3>
            {pending.map(d => <DecisionCard key={d.id} decision={d} onVote={handleVote} />)}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">היסטוריית החלטות ({history.length})</h3>
            {history.sort((a,b)=>b.id-a.id).map(d => <DecisionCard key={d.id} decision={d} onVote={handleVote} />)}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Vote, Plus, ThumbsUp, ThumbsDown, Minus, Users, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react'

type VoteResult = 'approved' | 'rejected' | 'pending'

interface BoardDecision {
  id: number
  title: string
  description: string
  date: string
  proposedBy: string
  votes: { for: number; against: number; abstain: number }
  result: VoteResult
  category: string
  notes?: string
}

const decisions: BoardDecision[] = [
  {
    id: 1,
    title: 'השקעה בנכס מסחרי — תל אביב',
    description: 'אישור השקעה בנכס מסחרי ברח׳ אלנבי 45, תל אביב בסך ₪3.2M. הנכס מיועד להשכרה לעסקים',
    date: '10/06/2026',
    proposedBy: 'שירה AI — נדל״ן',
    votes: { for: 0, against: 0, abstain: 0 },
    result: 'pending',
    category: 'השקעות נדל״ן',
  },
  {
    id: 2,
    title: 'אישור תקציב שיווק Q3',
    description: 'אישור תקציב שיווק של ₪240,000 לרבעון Q3 2026, כולל קמפיין אירופה וכנסים מקצועיים',
    date: '03/06/2026',
    proposedBy: 'יובל AI — שיווק',
    votes: { for: 4, against: 1, abstain: 0 },
    result: 'approved',
    category: 'תקציב',
    notes: 'אושר ברוב של 4 מול 1. תנאי: דוח מעקב חודשי על ביצוע התקציב.',
  },
  {
    id: 3,
    title: 'כניסה לשותפות עסקית — חברת Gamma',
    description: 'הצטרפות לשותפות עם חברת Gamma לפיתוח שירותי ייעוץ לשוק הגרמני, השקעה ראשונית ₪500K',
    date: '28/05/2026',
    proposedBy: 'אריאל AI — מנכ״ל',
    votes: { for: 3, against: 2, abstain: 0 },
    result: 'approved',
    category: 'התרחבות',
    notes: 'אושר ברוב קטן. יש להכין הסכם שותפות מפורט ולאשר בישיבה הבאה.',
  },
  {
    id: 4,
    title: 'גיוס מנהל בכיר — VP Finance',
    description: 'אישור גיוס סמנכ״ל כספים חיצוני, תקציב שכר ₪45K/חודש + תנאים נלווים',
    date: '15/05/2026',
    proposedBy: 'דניאל AI — HR',
    votes: { for: 5, against: 0, abstain: 0 },
    result: 'approved',
    category: 'משאבי אנוש',
    notes: 'אושר פה אחד. דניאל AI מופקד על תהליך הגיוס.',
  },
  {
    id: 5,
    title: 'רכישת כלי AI לניתוח נתונים',
    description: 'רכישת מנוי שנתי לפלטפורמת BI מתקדמת — ₪85K לשנה',
    date: '01/05/2026',
    proposedBy: 'רון AI — IT',
    votes: { for: 2, against: 3, abstain: 0 },
    result: 'rejected',
    category: 'טכנולוגיה',
    notes: 'נדחה — הוחלט לבחון חלופות זולות יותר. רון יציג 3 אלטרנטיבות בישיבה הבאה.',
  },
]

const resultConfig: Record<VoteResult, { label: string; color: string; bg: string }> = {
  approved: { label: 'אושר', color: 'text-accent-green', bg: 'bg-accent-green/10' },
  rejected: { label: 'נדחה', color: 'text-accent-red', bg: 'bg-accent-red/10' },
  pending:  { label: 'ממתין', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
}

function DecisionCard({ decision }: { decision: BoardDecision }) {
  const [expanded, setExpanded] = useState(decision.result === 'pending')
  const r = resultConfig[decision.result]
  const totalVotes = decision.votes.for + decision.votes.against + decision.votes.abstain

  return (
    <div className={`glass-card rounded-2xl p-5 border transition-all ${
      decision.result === 'pending' ? 'border-accent-amber/20' : 'border-border-muted'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.bg}`}>
          <Vote className={`w-4 h-4 ${r.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{decision.title}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Calendar className="w-3 h-3" />{decision.date}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Users className="w-3 h-3" />{decision.proposedBy}
                </span>
                <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">{decision.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${r.bg} ${r.color}`}>{r.label}</span>
              <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-secondary transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 space-y-3 pt-3 border-t border-border-muted">
              <p className="text-sm text-text-secondary leading-relaxed">{decision.description}</p>

              {totalVotes > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <ThumbsUp className="w-3.5 h-3.5 text-accent-green" />
                    <span className="text-accent-green font-semibold">{decision.votes.for}</span>
                    <span className="text-text-muted">בעד</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <ThumbsDown className="w-3.5 h-3.5 text-accent-red" />
                    <span className="text-accent-red font-semibold">{decision.votes.against}</span>
                    <span className="text-text-muted">נגד</span>
                  </div>
                  {decision.votes.abstain > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Minus className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-muted">{decision.votes.abstain} נמנע</span>
                    </div>
                  )}
                </div>
              )}

              {decision.result === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button className="flex items-center gap-1.5 bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/20 text-accent-green text-xs px-4 py-2 rounded-xl transition-all">
                    <ThumbsUp className="w-3.5 h-3.5" /> אישור
                  </button>
                  <button className="flex items-center gap-1.5 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 text-accent-red text-xs px-4 py-2 rounded-xl transition-all">
                    <ThumbsDown className="w-3.5 h-3.5" /> דחייה
                  </button>
                  <button className="flex items-center gap-1.5 bg-white/5 hover:bg-white/8 border border-border-muted text-text-muted text-xs px-4 py-2 rounded-xl transition-all">
                    <Minus className="w-3.5 h-3.5" /> נמנע
                  </button>
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
  const pending = decisions.filter(d => d.result === 'pending')
  const approved = decisions.filter(d => d.result === 'approved')
  const rejected = decisions.filter(d => d.result === 'rejected')

  return (
    <div className="min-h-screen">
      <Header title="דירקטוריון" subtitle="החלטות, הצבעות ופרוטוקולים — גבר יזמות ייעוץ עסקי והשקעות" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-accent-amber/20">
            <p className="text-xs text-text-muted mb-1">ממתין להצבעה</p>
            <p className="text-2xl font-bold text-accent-amber">{pending.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-text-muted mb-1">אושרו</p>
            <p className="text-2xl font-bold text-accent-green">{approved.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-text-muted mb-1">נדחו</p>
            <p className="text-2xl font-bold text-accent-red">{rejected.length}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> הצעה חדשה
          </button>
        </div>

        {pending.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-accent-amber uppercase tracking-wider">ממתין להצבעה</h3>
            {pending.map(d => <DecisionCard key={d.id} decision={d} />)}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">היסטוריית החלטות</h3>
          {[...approved, ...rejected].sort((a,b) => b.id - a.id).map(d => <DecisionCard key={d.id} decision={d} />)}
        </div>
      </div>
    </div>
  )
}

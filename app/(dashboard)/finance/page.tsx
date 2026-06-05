'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { StatCard } from '@/components/StatCard'
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const transactions = [
  { id: 1, date: '05/06/2026', description: 'ייעוץ אסטרטגי — לקוח A', category: 'ייעוץ', type: 'income', amount: 85000 },
  { id: 2, date: '04/06/2026', description: 'שכירות משרד — יוני', category: 'תפעול', type: 'expense', amount: 18500 },
  { id: 3, date: '03/06/2026', description: 'השקעה בנכס מסחרי', category: 'השקעות', type: 'income', amount: 320000 },
  { id: 4, date: '02/06/2026', description: 'משכורות — יוני', category: 'שכר', type: 'expense', amount: 145000 },
  { id: 5, date: '01/06/2026', description: 'ייעוץ פיננסי — לקוח B', category: 'ייעוץ', type: 'income', amount: 62000 },
  { id: 6, date: '31/05/2026', description: 'רישיונות תוכנה', category: 'טכנולוגיה', type: 'expense', amount: 8900 },
  { id: 7, date: '30/05/2026', description: 'עסקת נדל״ן — השלמה', category: 'נדל״ן', type: 'income', amount: 540000 },
  { id: 8, date: '28/05/2026', description: 'שיווק ופרסום', category: 'שיווק', type: 'expense', amount: 22000 },
  { id: 9, date: '25/05/2026', description: 'דיבידנדים מהשקעות', category: 'השקעות', type: 'income', amount: 47000 },
  { id: 10, date: '20/05/2026', description: 'ביטוח מקצועי', category: 'ביטוח', type: 'expense', amount: 15600 },
]

const monthlyData = [
  { month: 'ינואר', income: 680, expense: 210 },
  { month: 'פברואר', income: 720, expense: 195 },
  { month: 'מרץ', income: 890, expense: 240 },
  { month: 'אפריל', income: 760, expense: 220 },
  { month: 'מאי', income: 980, expense: 260 },
  { month: 'יוני', income: 1054, expense: 210 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card border border-border-muted rounded-xl p-3 text-xs shadow-card">
        <p className="text-text-secondary mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: ₪{p.value}K</p>
        ))}
      </div>
    )
  }
  return null
}

export default function FinancePage() {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const profit = totalIncome - totalExpense
  const margin = ((profit / totalIncome) * 100).toFixed(1)

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  return (
    <div className="min-h-screen">
      <Header title="פיננסים" subtitle="ניהול הכנסות, הוצאות ותזרים מזומנים" />

      <div className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="הכנסות החודש" value={`₪${(totalIncome/1000).toFixed(0)}K`} change={12.4} changeLabel="מהחודש שעבר" icon={TrendingUp} color="green" />
          <StatCard title="הוצאות החודש" value={`₪${(totalExpense/1000).toFixed(0)}K`} change={-3.1} changeLabel="מהחודש שעבר" icon={TrendingDown} color="red" />
          <StatCard title="רווח נקי" value={`₪${(profit/1000).toFixed(0)}K`} change={18.7} changeLabel="מהחודש שעבר" icon={Wallet} color="cyan" />
          <StatCard title="יחס רווחיות" value={`${margin}%`} change={4.2} changeLabel="מהחודש שעבר" icon={TrendingUp} color="purple" />
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">הכנסות מול הוצאות — 6 חודשים (₪K)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="הכנסות" fill="#34d399" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="הוצאות" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">תנועות אחרונות</h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 rounded-xl border border-border-muted p-0.5 gap-0.5">
                {(['all', 'income', 'expense'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-text-muted hover:text-text-secondary'}`}>
                    {f === 'all' ? 'הכל' : f === 'income' ? 'הכנסות' : 'הוצאות'}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
                <Plus className="w-3.5 h-3.5" /> הוסף תנועה
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-muted">
                  {['תאריך','תיאור','קטגוריה','סוג','סכום'].map(h => (
                    <th key={h} className={`text-xs text-text-muted font-medium pb-3 ${h === 'סכום' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-border-muted last:border-0 hover:bg-white/2 transition-colors">
                    <td className="py-3 text-xs text-text-muted font-mono">{tx.date}</td>
                    <td className="py-3 text-xs text-text-primary">{tx.description}</td>
                    <td className="py-3"><span className="text-xs bg-white/5 text-text-secondary px-2 py-1 rounded-lg">{tx.category}</span></td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${tx.type === 'income' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                        {tx.type === 'income' ? <><ArrowUpRight className="w-3 h-3" />הכנסה</> : <><ArrowDownRight className="w-3 h-3" />הוצאה</>}
                      </span>
                    </td>
                    <td className={`py-3 text-xs font-semibold font-mono text-left ${tx.type === 'income' ? 'text-accent-green' : 'text-accent-red'}`}>
                      {tx.type === 'income' ? '+' : '-'}₪{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

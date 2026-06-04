'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const revenueData = [
  { month: 'ינו', income: 620, expenses: 280 },
  { month: 'פבר', income: 680, expenses: 295 },
  { month: 'מרץ', income: 720, expenses: 310 },
  { month: 'אפר', income: 760, expenses: 305 },
  { month: 'מאי', income: 810, expenses: 318 },
  { month: 'יוני', income: 842, expenses: 319 },
]

const growthData = [
  { month: 'ינו', value: 45 },
  { month: 'פבר', value: 52 },
  { month: 'מרץ', value: 48 },
  { month: 'אפר', value: 61 },
  { month: 'מאי', value: 67 },
  { month: 'יוני', value: 74 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-xl p-3 text-xs border border-white/10">
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: ₪{p.value}K
        </p>
      ))}
    </div>
  )
}

const GrowthTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-xl p-3 text-xs border border-white/10">
      <p className="text-text-secondary mb-1">{label}</p>
      <p className="text-accent-cyan">{payload[0].value}% צמיחה</p>
    </div>
  )
}

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Bar Chart */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">הכנסות vs הוצאות</h3>
            <p className="text-xs text-text-muted mt-0.5">₪ אלפים — 6 חודשים אחרונים</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded bg-accent-cyan inline-block" /> הכנסות
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded bg-accent-purple/60 inline-block" /> הוצאות
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="income" name="הכנסות" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenses" name="הוצאות" fill="rgba(167,139,250,0.6)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Growth Line Chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-text-primary">קצב צמיחה</h3>
          <p className="text-xs text-text-muted mt-0.5">אחוז חודשי</p>
          <p className="text-2xl font-bold text-accent-cyan mt-2">74%
            <span className="text-xs font-normal text-accent-green mr-2">↑ +7% מהחודש שעבר</span>
          </p>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<GrowthTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ fill: '#22d3ee', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#22d3ee', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

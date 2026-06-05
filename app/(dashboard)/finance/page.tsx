'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Header } from '@/components/Header'
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, Upload, Building2, BarChart2, FileText, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface Account { id: string; name: string; type: 'bank'|'cc'; opening: number; limit: number; color: string }
interface Transaction { id: string; date: string; description: string; amount: number; type: 'הכנסה'|'הוצאה'; category: string; bp: 'biz'|'priv'; acctId: string|null; matched: boolean; bankRowId?: string|null }
interface BankRow { id: string; date: string; description: string; debit: number; credit: number; acctId: string|null; matched: boolean; manualEntryId: string|null; bp?: string }
interface CFPeriod { k: string; label: string; bizInc: number; bizExp: number; privInc: number; privExp: number }

const COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#10b981','#ef4444','#06b6d4','#f97316','#84cc16']
const MONTHS = ["ינו'","פבר'","מרס'","אפר'","מאי","יונ'","יול'","אוג'","ספט'","אוק'","נוב'","דצמ'"]
const COUT_BIZ = ['שכירות עסקי','שכר עובדים','דלק','חשמל/מים','טלפון/אינטרנט','פרסום/שיווק','ציוד משרדי','הוצאות נסיעה','מסים ואגרות','ביטוח עסקי','ספקים','כיבודים','תחזוקה','הוצאות בנק','אחר עסקי']
const COUT_PRI = ['שכירות','מזון','סופרמרקט','דלק','חשמל','מים/ארנונה','טלפון','ביטוח','רכב/תחבורה','בריאות','חינוך','פנאי/בידור','בגדים','אחר פרטי']
const CIN_BIZ = ['הכנסות לקוחות','שכר/משכורת','דמי ניהול','השקעות','מענקים','החזרים','אחר הכנסה עסקי']
const CIN_PRI = ['משכורת','קצבה','שכ"ד','ריבית/דיבידנד','מתנות','החזר מס','אחר הכנסה פרטי']

const fmt = (n: number) => new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:0}).format(n||0)

function getPK(d: string, p: string) {
  const dt = new Date(d); if (isNaN(dt.getTime())) return null
  if (p==='month') return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
  const j = new Date(dt.getFullYear(),0,1)
  const w = Math.ceil(((dt.getTime()-j.getTime())/86400000+j.getDay()+1)/7)
  return `${dt.getFullYear()}-W${String(w).padStart(2,'0')}`
}
function getPL(k: string, p: string) {
  if (p==='month') { const [y,m]=k.split('-'); return `${MONTHS[parseInt(m)-1]} ${y}` }
  const [y,w]=k.split('-W'); return `שב' ${w}/${y}`
}

type Tab = 'dashboard'|'accounts'|'records'|'cashflow'|'import'

export default function FinancePage() {
  const [userEmail, setUserEmail] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bankRows, setBankRows] = useState<BankRow[]>([])

  // Account form
  const [acctName, setAcctName] = useState('')
  const [acctType, setAcctType] = useState<'bank'|'cc'>('bank')
  const [acctOpening, setAcctOpening] = useState('')
  const [acctLimit, setAcctLimit] = useState('')

  // Transaction form
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0,10))
  const [txDesc, setTxDesc] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState<'הכנסה'|'הוצאה'>('הוצאה')
  const [txBP, setTxBP] = useState<'biz'|'priv'>('biz')
  const [txCat, setTxCat] = useState('')
  const [txAcct, setTxAcct] = useState('none')

  // CF filters
  const [cfPeriod, setCfPeriod] = useState<'week'|'month'>('month')
  const [cfAcct, setCfAcct] = useState('all')
  const [cfBP, setCfBP] = useState<'all'|'biz'|'priv'>('all')

  // Record filters
  const [recFilter, setRecFilter] = useState<'all'|'הכנסה'|'הוצאה'>('all')
  const [recBPFilter, setRecBPFilter] = useState<'all'|'biz'|'priv'>('all')

  // Import
  const [importAcct, setImportAcct] = useState('none')
  const [importBP, setImportBP] = useState<'biz'|'priv'>('biz')
  const [importResult, setImportResult] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || 'guest'
      setUserEmail(email)
      try {
        const raw = localStorage.getItem(`fin_${email}`)
        if (raw) {
          const d = JSON.parse(raw)
          setAccounts(d.accounts||[])
          setTransactions(d.records||[])
          setBankRows(d.bankRows||[])
        }
      } catch {}
    })
  }, [])

  const saveData = useCallback((accts: Account[], txs: Transaction[], brs: BankRow[], email?: string) => {
    const key = email || userEmail
    if (!key) return
    try { localStorage.setItem(`fin_${key}`, JSON.stringify({accounts:accts, records:txs, bankRows:brs})) } catch {}
  }, [userEmail])

  const getCats = (type: 'הכנסה'|'הוצאה', bp: 'biz'|'priv') => {
    if (type==='הוצאה') return bp==='biz' ? COUT_BIZ : COUT_PRI
    return bp==='biz' ? CIN_BIZ : CIN_PRI
  }

  // KPIs
  const opening = accounts.reduce((s,a)=>s+a.opening,0)
  const totalIncome = transactions.filter(r=>r.type==='הכנסה'&&!r.bankRowId).reduce((s,r)=>s+r.amount,0)+bankRows.reduce((s,r)=>s+r.credit,0)
  const totalExpense = transactions.filter(r=>r.type==='הוצאה'&&!r.bankRowId).reduce((s,r)=>s+r.amount,0)+bankRows.reduce((s,r)=>s+r.debit,0)
  const balance = opening+totalIncome-totalExpense
  const net = totalIncome-totalExpense
  const unmatched = bankRows.filter(r=>!r.matched).length

  const buildCFMap = (af: string, bf: string, p: string): CFPeriod[] => {
    const map: Record<string,CFPeriod> = {}
    const add = (d: string, deb: number, cre: number, bp: string, ai: string|null) => {
      if (af&&af!=='all'&&ai!==af) return
      if (bf&&bf!=='all'&&bp!==bf) return
      const k = getPK(d,p); if (!k) return
      if (!map[k]) map[k]={k,label:getPL(k,p),bizInc:0,bizExp:0,privInc:0,privExp:0}
      const m=map[k], isBiz=bp==='biz'
      if (isBiz){m.bizInc+=cre||0;m.bizExp+=deb||0}else{m.privInc+=cre||0;m.privExp+=deb||0}
    }
    bankRows.forEach(r=>add(String(r.date),r.debit,r.credit,r.bp||'biz',r.acctId))
    transactions.filter(r=>!r.bankRowId).forEach(r=>add(r.date,r.type==='הוצאה'?r.amount:0,r.type==='הכנסה'?r.amount:0,r.bp,r.acctId))
    return Object.values(map).sort((a,b)=>a.k.localeCompare(b.k))
  }

  const addAccount = () => {
    if (!acctName.trim()) return
    const newAcct: Account = {id:'acct-'+Date.now(),name:acctName,type:acctType,opening:parseFloat(acctOpening)||0,limit:parseFloat(acctLimit)||0,color:COLORS[accounts.length%COLORS.length]}
    const newAccts = [...accounts,newAcct]
    setAccounts(newAccts); saveData(newAccts,transactions,bankRows)
    setAcctName(''); setAcctOpening(''); setAcctLimit('')
  }

  const deleteAccount = (id: string) => {
    const newAccts=accounts.filter(a=>a.id!==id), newBRs=bankRows.filter(r=>r.acctId!==id)
    setAccounts(newAccts); setBankRows(newBRs); saveData(newAccts,transactions,newBRs)
  }

  const addTransaction = () => {
    if (!txDesc.trim()||!txAmount||parseFloat(txAmount)<=0) return
    const cats=getCats(txType,txBP)
    const newTx: Transaction = {id:'r-'+Date.now(),date:txDate,description:txDesc,amount:parseFloat(txAmount),type:txType,category:txCat||cats[0],bp:txBP,acctId:txAcct==='none'?null:txAcct,matched:false,bankRowId:null}
    const newTxs=[newTx,...transactions]
    setTransactions(newTxs); saveData(accounts,newTxs,bankRows)
    setTxDesc(''); setTxAmount('')
  }

  const deleteTransaction = (id: string) => {
    const tx=transactions.find(t=>t.id===id)
    let newBRs=bankRows
    if (tx?.bankRowId) {
      newBRs=bankRows.map(br=>br.id===tx.bankRowId?{...br,matched:false,manualEntryId:null}:br)
      setBankRows(newBRs)
    }
    const newTxs=transactions.filter(t=>t.id!==id)
    setTransactions(newTxs); saveData(accounts,newTxs,newBRs)
  }

  const handleBankImport = async (file: File) => {
    try {
      const XLSX = await import('xlsx')
      const reader = new FileReader()
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result,{type:'binary',cellDates:true})
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws,{header:1,raw:false,dateNF:'yyyy-mm-dd'}) as any[][]
        let added=0, dupes=0
        const newBRs=[...bankRows]
        for (let i=1;i<data.length;i++) {
          const r=data[i]; if (!r||r.every((c:any)=>!c)) continue
          let date=String(r[0]||''),desc=String(r[1]||''),debit=0,credit=0
          for (let j=2;j<Math.min(r.length,6);j++) {
            const v=parseFloat(String(r[j]).replace(/,/g,''))
            if (!isNaN(v)&&v>0){if(j===2)debit=v;else if(j===3)credit=v}
          }
          if (!desc&&!debit&&!credit) continue
          const exist=newBRs.find(b=>b.description.trim()===desc.trim()&&Math.abs((b.debit||b.credit)-(debit||credit))<0.01&&String(b.date).slice(0,10)===date.slice(0,10))
          if (exist){dupes++;continue}
          newBRs.push({id:'bank-'+Date.now()+'-'+i,acctId:importAcct==='none'?null:importAcct,date,description:desc,debit,credit,matched:false,manualEntryId:null,bp:importBP})
          added++
        }
        setBankRows(newBRs); saveData(accounts,transactions,newBRs)
        setImportResult(`יובאו ${added} תנועות${dupes?` · ${dupes} כפולות דולגו`:''}`)
      }
      reader.readAsBinaryString(file)
    } catch { setImportResult('שגיאה בקריאת הקובץ') }
  }

  const filteredTxs = transactions.filter(t=>{
    if (recFilter!=='all'&&t.type!==recFilter) return false
    if (recBPFilter!=='all'&&t.bp!==recBPFilter) return false
    return true
  })

  const cfData = buildCFMap(cfAcct,cfBP,cfPeriod)
  const chartData = cfData.map(row=>({label:row.label,הכנסות:Math.round(row.bizInc+row.privInc),הוצאות:Math.round(row.bizExp+row.privExp)}))
  const tBI=cfData.reduce((s,r)=>s+r.bizInc,0), tBE=cfData.reduce((s,r)=>s+r.bizExp,0)
  const tPI=cfData.reduce((s,r)=>s+r.privInc,0), tPE=cfData.reduce((s,r)=>s+r.privExp,0)

  const CustomTooltip = ({active,payload,label}: any) => {
    if (!active||!payload?.length) return null
    return (
      <div className="bg-bg-card border border-border-muted rounded-xl p-3 text-xs shadow-card">
        <p className="text-text-secondary mb-1">{label}</p>
        {payload.map((p: any,i: number)=><p key={i} style={{color:p.color}}>{p.name}: {fmt(p.value)}</p>)}
      </div>
    )
  }

  const tabs = [
    {key:'dashboard' as Tab,label:'מצב פיננסי',Icon:Wallet},
    {key:'accounts' as Tab,label:'חשבונות',Icon:Building2},
    {key:'records' as Tab,label:'רישומים',Icon:FileText},
    {key:'cashflow' as Tab,label:'תזרים',Icon:BarChart2},
    {key:'import' as Tab,label:'ייבוא בנק',Icon:Upload},
  ]

  const AcctCard = ({acct}: {acct:Account}) => {
    const aR=transactions.filter(r=>r.acctId===acct.id&&!r.bankRowId)
    const aB=bankRows.filter(r=>r.acctId===acct.id)
    const inc=aR.filter(r=>r.type==='הכנסה').reduce((s,r)=>s+r.amount,0)+aB.reduce((s,r)=>s+r.credit,0)
    const exp=aR.filter(r=>r.type==='הוצאה').reduce((s,r)=>s+r.amount,0)+aB.reduce((s,r)=>s+r.debit,0)
    const bal=acct.opening+inc-exp
    const usedPct=acct.limit>0?Math.min(100,Math.round((exp/acct.limit)*100)):0
    const remaining=acct.limit-exp
    const remainPct=100-usedPct
    const barColor=remainPct<=15?'#ef4444':remainPct<=30?'#f59e0b':'#10b981'
    return (
      <div className="p-4 rounded-xl bg-white/3 border" style={{borderColor:acct.color+'50'}}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{background:acct.color}}/>
            <span className="text-sm font-semibold text-text-primary">{acct.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${acct.type==='bank'?'bg-blue-500/10 text-blue-400':'bg-purple-500/10 text-purple-400'}`}>
              {acct.type==='bank'?'🏦 בנק':'💳 כ״א'}
            </span>
          </div>
          <span className={`text-sm font-bold ${bal>=0?'text-accent-green':'text-accent-red'}`}>{fmt(bal)}</span>
        </div>
        <div className="flex gap-4 text-xs text-text-muted mb-2 flex-wrap">
          <span>פתיחה: <b className="text-text-secondary">{fmt(acct.opening)}</b></span>
          <span className="text-accent-green">↑ {fmt(inc)}</span>
          <span className="text-accent-red">↓ {fmt(exp)}</span>
          {acct.limit>0&&<span>מסגרת: <b className="text-text-secondary">{fmt(acct.limit)}</b></span>}
        </div>
        {acct.limit>0&&(
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">שימוש במסגרת</span>
              <span style={{color:barColor}} className="font-semibold">{usedPct}% · נותר {fmt(remaining)}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{width:`${usedPct}%`,background:barColor}}/>
            </div>
            {remainPct<=30&&(
              <div className={`mt-1.5 text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${remainPct<=15?'bg-red-500/10 text-accent-red':'bg-amber-500/10 text-accent-amber'}`}>
                <AlertTriangle className="w-3 h-3"/>
                {remainPct<=15?'🚨 אזהרה קריטית':'⚠️ אזהרה'}: נותרו {remainPct}% מהמסגרת ({fmt(remaining)})
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="מחלקת כספים" subtitle="ניהול תזרים מזומנים, חשבונות ורישומים פיננסיים"/>

      <div className="p-6 space-y-6 animate-fade-in">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-text-muted mb-1">יתרה נוכחית</p>
            <p className={`text-2xl font-bold ${balance>=0?'text-accent-green':'text-accent-red'}`}>{fmt(balance)}</p>
            <p className="text-xs text-text-muted mt-1">פתיחה: {fmt(opening)}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-text-muted mb-1">סה״כ הכנסות</p>
            <p className="text-2xl font-bold text-accent-green">{fmt(totalIncome)}</p>
            <p className="text-xs text-text-muted mt-1">{transactions.filter(t=>t.type==='הכנסה').length} רישומים</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-text-muted mb-1">סה״כ הוצאות</p>
            <p className="text-2xl font-bold text-accent-red">{fmt(totalExpense)}</p>
            <p className="text-xs text-text-muted mt-1">{transactions.filter(t=>t.type==='הוצאה').length} רישומים</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-text-muted mb-1">נטו</p>
            <p className={`text-2xl font-bold ${net>=0?'text-accent-cyan':'text-accent-red'}`}>{net>=0?'+':''}{fmt(net)}</p>
            {unmatched>0&&<p className="text-xs text-accent-amber mt-1">{unmatched} תנועות ממתינות</p>}
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-white/3 rounded-2xl p-1 border border-border-muted overflow-x-auto">
          {tabs.map(({key,label,Icon})=>(
            <button key={key} onClick={()=>setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${activeTab===key?'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/20':'text-text-muted hover:text-text-secondary hover:bg-white/5'}`}>
              <Icon className="w-3.5 h-3.5"/>{label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {activeTab==='dashboard'&&(
          <div className="space-y-5">
            {accounts.length>0&&(
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">חשבונות</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accounts.map(a=><AcctCard key={a.id} acct={a}/>)}
                </div>
              </div>
            )}
            {cfData.length>0?(
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">גרף תזרים</h3>
                  <div className="flex gap-1">
                    {(['month','week'] as const).map(p=>(
                      <button key={p} onClick={()=>setCfPeriod(p)}
                        className={`text-xs px-3 py-1 rounded-lg transition-all ${cfPeriod===p?'bg-accent-cyan/20 text-accent-cyan':'bg-white/5 text-text-muted'}`}>
                        {p==='month'?'חודשי':'שבועי'}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="label" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#94a3b8',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₪${Math.round(v/1000)}K`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="הכנסות" fill="#34d399" radius={[4,4,0,0]}/>
                    <Bar dataKey="הוצאות" fill="#f87171" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs text-accent-green font-semibold">■ הכנסות</span>
                  <span className="text-xs text-accent-red font-semibold">■ הוצאות</span>
                </div>
              </div>
            ):(
              <div className="glass-card rounded-2xl p-10 text-center">
                <BarChart2 className="w-10 h-10 text-text-muted mx-auto mb-3"/>
                <p className="text-sm text-text-muted">הוסף חשבונות ורישומים לצפייה בתזרים</p>
                <div className="flex justify-center gap-3 mt-4">
                  <button onClick={()=>setActiveTab('accounts')} className="text-xs bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan px-4 py-2 rounded-xl">+ הוסף חשבון</button>
                  <button onClick={()=>setActiveTab('records')} className="text-xs bg-white/5 border border-border-muted text-text-secondary px-4 py-2 rounded-xl">+ הוסף רישום</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACCOUNTS ── */}
        {activeTab==='accounts'&&(
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">הוספת חשבון</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={acctName} onChange={e=>setAcctName(e.target.value)} placeholder="שם החשבון *"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"/>
                <div className="flex gap-2">
                  {(['bank','cc'] as const).map(t=>(
                    <button key={t} onClick={()=>setAcctType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${acctType===t?'bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan':'bg-white/5 border-border-muted text-text-muted'}`}>
                      {t==='bank'?'🏦 חשבון בנק':'💳 כרטיס אשראי'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">יתרת פתיחה (₪)</label>
                  <input value={acctOpening} onChange={e=>setAcctOpening(e.target.value)} placeholder="0" type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none" dir="ltr"/>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">מסגרת אשראי (₪) — לכרטיס בלבד</label>
                  <input value={acctLimit} onChange={e=>setAcctLimit(e.target.value)} placeholder="0" type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none" dir="ltr"/>
                </div>
              </div>
              <button onClick={addAccount}
                className="mt-3 flex items-center gap-1.5 bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90 transition-all">
                <Plus className="w-3.5 h-3.5"/> הוסף חשבון
              </button>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">{accounts.length} חשבונות</h3>
              {!accounts.length?(
                <p className="text-xs text-text-muted">אין חשבונות. הוסף חשבון בנק או כרטיס אשראי.</p>
              ):(
                <div className="space-y-3">
                  {accounts.map(acct=>{
                    const aR=transactions.filter(r=>r.acctId===acct.id&&!r.bankRowId)
                    const aB=bankRows.filter(r=>r.acctId===acct.id)
                    const inc=aR.filter(r=>r.type==='הכנסה').reduce((s,r)=>s+r.amount,0)+aB.reduce((s,r)=>s+r.credit,0)
                    const exp=aR.filter(r=>r.type==='הוצאה').reduce((s,r)=>s+r.amount,0)+aB.reduce((s,r)=>s+r.debit,0)
                    const bal=acct.opening+inc-exp
                    const usedPct=acct.limit>0?Math.min(100,Math.round((exp/acct.limit)*100)):0
                    const remaining=acct.limit-exp, remainPct=100-usedPct
                    const barColor=remainPct<=15?'#ef4444':remainPct<=30?'#f59e0b':'#10b981'
                    return (
                      <div key={acct.id} className="p-4 rounded-xl bg-white/3 border-r-4" style={{borderColor:acct.color}}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-text-primary">{acct.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-md ${acct.type==='bank'?'bg-blue-500/10 text-blue-400':'bg-purple-500/10 text-purple-400'}`}>
                              {acct.type==='bank'?'🏦':'💳'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${bal>=0?'text-accent-green':'text-accent-red'}`}>{fmt(bal)}</span>
                            <button onClick={()=>deleteAccount(acct.id)} className="text-text-muted hover:text-accent-red transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-text-muted mt-2 flex-wrap">
                          <span>פתיחה: <b className="text-text-secondary">{fmt(acct.opening)}</b></span>
                          <span className="text-accent-green">↑ {fmt(inc)}</span>
                          <span className="text-accent-red">↓ {fmt(exp)}</span>
                          {acct.limit>0&&<span>מסגרת: <b className="text-text-secondary">{fmt(acct.limit)}</b></span>}
                        </div>
                        {acct.limit>0&&(
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-text-muted">שימוש במסגרת</span>
                              <span style={{color:barColor}} className="font-semibold">{usedPct}% · נותר {fmt(remaining)}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${usedPct}%`,background:barColor}}/>
                            </div>
                            {remainPct<=30&&(
                              <p className={`mt-1 text-xs ${remainPct<=15?'text-accent-red':'text-accent-amber'}`}>
                                {remainPct<=15?'🚨':'⚠️'} נותרו {remainPct}% ({fmt(remaining)})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RECORDS ── */}
        {activeTab==='records'&&(
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">הוספת רישום</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex gap-1">
                  {(['הוצאה','הכנסה'] as const).map(t=>(
                    <button key={t} onClick={()=>{setTxType(t);setTxCat('')}}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${txType===t?t==='הוצאה'?'bg-accent-red/20 border-accent-red/30 text-accent-red':'bg-accent-green/20 border-accent-green/30 text-accent-green':'bg-white/5 border-border-muted text-text-muted'}`}>
                      {t==='הוצאה'?'📤 הוצאה':'📥 הכנסה'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {(['biz','priv'] as const).map(b=>(
                    <button key={b} onClick={()=>{setTxBP(b);setTxCat('')}}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${txBP===b?'bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan':'bg-white/5 border-border-muted text-text-muted'}`}>
                      {b==='biz'?'🏢 עסקי':'🏠 פרטי'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={txDesc} onChange={e=>setTxDesc(e.target.value)} placeholder="תיאור *"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50"/>
                <input value={txAmount} onChange={e=>setTxAmount(e.target.value)} placeholder="סכום ₪ *" type="number"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none" dir="ltr"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <input value={txDate} onChange={e=>setTxDate(e.target.value)} type="date"
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none" dir="ltr"/>
                <select value={txCat} onChange={e=>setTxCat(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none">
                  {getCats(txType,txBP).map(c=><option key={c} value={c} className="bg-bg-card">{c}</option>)}
                </select>
                <select value={txAcct} onChange={e=>setTxAcct(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none">
                  <option value="none" className="bg-bg-card">— ללא חשבון —</option>
                  {accounts.map(a=><option key={a.id} value={a.id} className="bg-bg-card">{a.name}</option>)}
                </select>
              </div>
              <button onClick={addTransaction}
                className="mt-3 flex items-center gap-1.5 bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90 transition-all">
                <Plus className="w-3.5 h-3.5"/> הוסף רישום
              </button>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-text-primary">{filteredTxs.length} רישומים</h3>
                <div className="flex flex-wrap gap-1">
                  {(['all','הכנסה','הוצאה'] as const).map(f=>(
                    <button key={f} onClick={()=>setRecFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${recFilter===f?'bg-accent-cyan/20 text-accent-cyan':'bg-white/5 text-text-muted'}`}>
                      {f==='all'?'הכל':f}
                    </button>
                  ))}
                  {(['all','biz','priv'] as const).map(f=>(
                    <button key={f} onClick={()=>setRecBPFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${recBPFilter===f?'bg-accent-cyan/20 text-accent-cyan':'bg-white/5 text-text-muted'}`}>
                      {f==='all'?'עסקי+פרטי':f==='biz'?'🏢 עסקי':'🏠 פרטי'}
                    </button>
                  ))}
                </div>
              </div>
              {!filteredTxs.length?(
                <p className="text-xs text-text-muted text-center py-8">אין רישומים. הוסף רישום ראשון למעלה.</p>
              ):(
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-muted">
                        {['תאריך','תיאור','קטגוריה','סוג','סכום',''].map((h,i)=>(
                          <th key={i} className="text-xs text-text-muted font-medium pb-3 text-right">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.sort((a,b)=>b.date.localeCompare(a.date)).map(tx=>(
                        <tr key={tx.id} className="border-b border-border-muted last:border-0 hover:bg-white/2">
                          <td className="py-2.5 text-xs text-text-muted font-mono">{tx.date}</td>
                          <td className="py-2.5 text-xs text-text-primary max-w-[200px] truncate">{tx.description}</td>
                          <td className="py-2.5"><span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-md">{tx.category}</span></td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${tx.type==='הכנסה'?'bg-accent-green/10 text-accent-green':'bg-accent-red/10 text-accent-red'}`}>
                              {tx.type==='הכנסה'?<ArrowUpRight className="w-3 h-3"/>:<ArrowDownRight className="w-3 h-3"/>}{tx.type}
                            </span>
                          </td>
                          <td className={`py-2.5 text-xs font-semibold font-mono ${tx.type==='הכנסה'?'text-accent-green':'text-accent-red'}`}>
                            {tx.type==='הכנסה'?'+':'-'}{fmt(tx.amount)}
                          </td>
                          <td className="py-2.5">
                            <button onClick={()=>deleteTransaction(tx.id)} className="text-text-muted hover:text-accent-red transition-colors"><Trash2 className="w-3 h-3"/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CASHFLOW ── */}
        {activeTab==='cashflow'&&(
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-3 items-center">
              <div className="flex gap-1">
                {(['month','week'] as const).map(p=>(
                  <button key={p} onClick={()=>setCfPeriod(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${cfPeriod===p?'bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan':'bg-white/5 border-border-muted text-text-muted'}`}>
                    {p==='month'?'חודשי':'שבועי'}
                  </button>
                ))}
              </div>
              <select value={cfAcct} onChange={e=>setCfAcct(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none">
                <option value="all">כל החשבונות</option>
                {accounts.map(a=><option key={a.id} value={a.id} className="bg-bg-card">{a.name}</option>)}
              </select>
              <div className="flex gap-1">
                {(['all','biz','priv'] as const).map(b=>(
                  <button key={b} onClick={()=>setCfBP(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all ${cfBP===b?'bg-accent-cyan/20 text-accent-cyan':'bg-white/5 text-text-muted'}`}>
                    {b==='all'?'עסקי+פרטי':b==='biz'?'🏢 עסקי':'🏠 פרטי'}
                  </button>
                ))}
              </div>
            </div>
            {cfData.length===0?(
              <div className="glass-card rounded-2xl p-10 text-center">
                <BarChart2 className="w-10 h-10 text-text-muted mx-auto mb-3"/>
                <p className="text-sm text-text-muted">הוסף רישומים לצפייה בתזרים</p>
              </div>
            ):(
              <>
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">גרף תזרים</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="label" tick={{fill:'#94a3b8',fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:'#94a3b8',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₪${Math.round(v/1000)}K`}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="הכנסות" fill="#34d399" radius={[4,4,0,0]}/>
                      <Bar dataKey="הוצאות" fill="#f87171" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-accent-green font-semibold">■ הכנסות</span>
                    <span className="text-xs text-accent-red font-semibold">■ הוצאות</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl p-4 border border-blue-500/20">
                    <h4 className="text-xs font-semibold text-blue-400 mb-3">🏢 עסקי</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-text-muted">הכנסות</span><span className="text-accent-green font-semibold">{fmt(tBI)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-text-muted">הוצאות</span><span className="text-accent-red font-semibold">{fmt(tBE)}</span></div>
                      <div className="h-px bg-border-muted"/>
                      <div className="flex justify-between text-xs font-bold"><span>רווח נטו</span><span style={{color:tBI-tBE>=0?'#34d399':'#f87171'}}>{fmt(tBI-tBE)}</span></div>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 border border-purple-500/20">
                    <h4 className="text-xs font-semibold text-purple-400 mb-3">🏠 פרטי</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-text-muted">הכנסות</span><span className="text-accent-green font-semibold">{fmt(tPI)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-text-muted">הוצאות</span><span className="text-accent-red font-semibold">{fmt(tPE)}</span></div>
                      <div className="h-px bg-border-muted"/>
                      <div className="flex justify-between text-xs font-bold"><span>מאזן</span><span style={{color:tPI-tPE>=0?'#34d399':'#f87171'}}>{fmt(tPI-tPE)}</span></div>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">טבלה מפורטת</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border-muted">
                          {['תקופה','הכנסות עסקי','הוצאות עסקי','רווח עסקי','הכנסות פרטי','הוצאות פרטי','מאזן פרטי','נטו כולל','יתרה מצטברת'].map(h=>(
                            <th key={h} className="pb-2 text-right text-text-muted font-medium whitespace-nowrap px-1">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(()=>{
                          let cum=opening
                          return cfData.map(row=>{
                            const inc=row.bizInc+row.privInc,exp=row.bizExp+row.privExp,net=inc-exp
                            cum+=net
                            const bN=row.bizInc-row.bizExp,pN=row.privInc-row.privExp
                            return (
                              <tr key={row.k} className="border-b border-border-muted hover:bg-white/2">
                                <td className="py-2 font-semibold text-text-primary px-1 whitespace-nowrap">{row.label}</td>
                                <td className="py-2 text-accent-green font-semibold px-1">{fmt(row.bizInc)}</td>
                                <td className="py-2 text-accent-red font-semibold px-1">{fmt(row.bizExp)}</td>
                                <td className="py-2 font-bold px-1" style={{color:bN>=0?'#34d399':'#f87171'}}>{bN>=0?'+':''}{fmt(bN)}</td>
                                <td className="py-2 text-accent-green font-semibold px-1">{fmt(row.privInc)}</td>
                                <td className="py-2 text-accent-red font-semibold px-1">{fmt(row.privExp)}</td>
                                <td className="py-2 font-bold px-1" style={{color:pN>=0?'#34d399':'#f87171'}}>{pN>=0?'+':''}{fmt(pN)}</td>
                                <td className="py-2 font-bold px-1" style={{color:net>=0?'#34d399':'#f87171'}}>{net>=0?'+':''}{fmt(net)}</td>
                                <td className="py-2 font-bold px-1" style={{color:cum>=0?'#34d399':'#f87171'}}>{fmt(cum)}</td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="bg-white/3 font-bold">
                          <td className="py-2 text-text-primary px-1">סה״כ</td>
                          <td className="py-2 text-accent-green px-1">{fmt(tBI)}</td>
                          <td className="py-2 text-accent-red px-1">{fmt(tBE)}</td>
                          <td className="py-2 px-1" style={{color:tBI-tBE>=0?'#34d399':'#f87171'}}>{fmt(tBI-tBE)}</td>
                          <td className="py-2 text-accent-green px-1">{fmt(tPI)}</td>
                          <td className="py-2 text-accent-red px-1">{fmt(tPE)}</td>
                          <td className="py-2 px-1" style={{color:tPI-tPE>=0?'#34d399':'#f87171'}}>{fmt(tPI-tPE)}</td>
                          <td className="py-2 px-1" style={{color:(tBI+tPI-tBE-tPE)>=0?'#34d399':'#f87171'}}>{fmt(tBI+tPI-tBE-tPE)}</td>
                          <td className="py-2 text-text-muted px-1">—</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BANK IMPORT ── */}
        {activeTab==='import'&&(
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-1">ייבוא תנועות בנק (Excel)</h3>
              <p className="text-xs text-text-muted mb-4">פורמט: עמודה A — תאריך, B — תיאור, C — חיוב, D — זיכוי</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">חשבון</label>
                  <select value={importAcct} onChange={e=>setImportAcct(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none">
                    <option value="none" className="bg-bg-card">— ללא חשבון —</option>
                    {accounts.map(a=><option key={a.id} value={a.id} className="bg-bg-card">{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">סוג</label>
                  <div className="flex gap-2">
                    {(['biz','priv'] as const).map(b=>(
                      <button key={b} onClick={()=>setImportBP(b)}
                        className={`flex-1 py-2.5 rounded-xl text-xs border transition-all ${importBP===b?'bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan':'bg-white/5 border-border-muted text-text-muted'}`}>
                        {b==='biz'?'🏢 עסקי':'🏠 פרטי'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div
                onDragOver={e=>{e.preventDefault();setIsDragging(true)}}
                onDragLeave={()=>setIsDragging(false)}
                onDrop={e=>{e.preventDefault();setIsDragging(false);const f=e.dataTransfer.files[0];if(f)handleBankImport(f)}}
                onClick={()=>fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging?'border-accent-cyan/60 bg-accent-cyan/5':'border-border-muted hover:border-accent-cyan/30 hover:bg-white/2'}`}>
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-3"/>
                <p className="text-sm text-text-secondary">גרור קובץ Excel לכאן</p>
                <p className="text-xs text-text-muted mt-1">או לחץ לבחירת קובץ (.xlsx, .xls, .csv)</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e=>{const f=e.target.files?.[0];if(f)handleBankImport(f)}}/>
              </div>
              {importResult&&(
                <div className="mt-3 flex items-center gap-2 bg-accent-green/5 border border-accent-green/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-accent-green"/>
                  <span className="text-sm text-accent-green font-semibold">{importResult}</span>
                </div>
              )}
            </div>
            {bankRows.length>0&&(
              <div className="glass-card rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">{bankRows.length} תנועות בנק</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-muted">
                        {['תאריך','תיאור','חיוב','זיכוי','חשבון','סטטוס'].map(h=>(
                          <th key={h} className="pb-2 text-right text-text-muted font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...bankRows].reverse().slice(0,60).map(row=>(
                        <tr key={row.id} className="border-b border-border-muted hover:bg-white/2">
                          <td className="py-2 font-mono text-text-muted">{String(row.date).slice(0,10)}</td>
                          <td className="py-2 text-text-primary max-w-[200px] truncate">{row.description}</td>
                          <td className="py-2 text-accent-red font-semibold">{row.debit>0?fmt(row.debit):''}</td>
                          <td className="py-2 text-accent-green font-semibold">{row.credit>0?fmt(row.credit):''}</td>
                          <td className="py-2 text-text-muted">{row.acctId?accounts.find(a=>a.id===row.acctId)?.name||'—':'—'}</td>
                          <td className="py-2">
                            <span className={`px-1.5 py-0.5 rounded-md ${row.matched?'bg-accent-green/10 text-accent-green':'bg-amber-500/10 text-accent-amber'}`}>
                              {row.matched?'✓ מותאם':'ממתין'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

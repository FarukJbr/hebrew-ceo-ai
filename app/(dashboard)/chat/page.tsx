'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/Header'
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  agent?: string
}

const initialMessages: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'שלום, יו״ר הדירקטוריון. אני אריאל, המנכ״ל AI של גבר יזמות. איך אפשר לעזור לך היום? ניתן לשאול על ביצועים פיננסיים, אסטרטגיה עסקית, עסקאות, צוות, או כל נושא ניהולי אחר.',
    time: '10:00',
    agent: 'אריאל — מנכ״ל AI',
  },
]

const quickPrompts = [
  'מה מצב הפיננסים החודש?',
  'תן לי סיכום ביצועים שבועי',
  'אילו עסקאות פתוחות יש?',
  'מה המשימות הדחופות?',
  'תכין תוכנית לרבעון הבא',
]

const agentResponses: Record<string, string> = {
  'מה מצב הפיננסים החודש?': 'על פי הנתונים העדכניים: הכנסות החודש עומדות על ₪1.05M — עלייה של 12.4% לעומת החודש הקודם. ההוצאות עומדות על ₪210K. הרווח הנקי: ₪840K עם יחס רווחיות של 79.8%. הפריטים הגדולים ביותר בהכנסות: עסקת נדל״ן (₪540K) וייעוץ אסטרטגי (₪147K). ממליץ לשקול השקעה מחדש של 30% מהרווח בנכסים.',
  'תן לי סיכום ביצועים שבועי': 'סיכום שבוע 23/2026:\n• הכנסות: ₪287K (יעד: ₪250K ✓)\n• 3 עסקאות חדשות נחתמו\n• 12 משימות הושלמו מתוך 15\n• כל 8 סוכני AI פעילים ב-98% זמינות\n• לקוח חדש הצטרף — ייעוץ שנתי ₪240K\n• אזהרה: תשלום ספק ממתין לאישור ₪45K',
  'אילו עסקאות פתוחות יש?': 'עסקאות פתוחות נכון להיום:\n1. נכס מסחרי — תל אביב (₪3.2M) — שלב Due Diligence\n2. ייעוץ אסטרטגי — חברת Beta (₪180K/שנה) — הצעה נשלחה\n3. עסקת שותפות — גורם מוסדי (₪5M) — משא ומתן\n4. נכס מגורים — רמת גן (₪1.8M) — בדיקת כדאיות\n\nהמלצה: לתעדף עסקה #3 — פוטנציאל גבוה ביותר.',
  'מה המשימות הדחופות?': 'משימות דחופות לפי עדיפות:\n🔴 דחוף — מחר:\n• דוח כספי חצי שנתי (נועה AI)\n• אישור חוזה ספק (מיכל AI)\n\n🟡 גבוה — השבוע:\n• ניתוח שוק Q3 (אריאל AI)\n• בדיקת Due Diligence נכס (שירה AI)\n\n🟢 רגיל:\n• גיוס מנהל פיתוח (דניאל AI)\n• קמפיין שיווקי Q3 (יובל AI)',
  'תכין תוכנית לרבעון הבא': 'תוכנית אסטרטגית Q3 2026:\n\n📈 יעדי הכנסות: ₪3.5M (עלייה 20%)\n\n1. נדל״ן — השלמת 3 עסקאות פתוחות + חיפוש 2 עסקאות חדשות\n2. ייעוץ — הרחבת מאגר לקוחות ב-20%, פיתוח חבילת פרימיום\n3. השקעות — הקצאת ₪2M להשקעות מגוונות\n4. תפעול — גיוס 5 עובדים, הפחתת עלויות ב-5%\n5. שיווק — קמפיין אירופה, כנס תעשייתי\n\nרוצה שאפרק לתוכניות עבודה מפורטות לכל מחלקה?',
}

const initialWelcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'שלום, יו״ר הדירקטוריון. אני אריאל, המנכ״ל AI של גבר יזמות. איך אפשר לעזור לך היום? ניתן לשאול על ביצועים פיננסיים, אסטרטגיה עסקית, עסקאות, צוות, או כל נושא ניהולי אחר.',
  time: '10:00',
  agent: 'אריאל — מנכ״ל AI',
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) { setIsLoading(false); return }
      setUserId(uid)
      const { data: rows } = await supabase
        .from('chat_messages')
        .select('data')
        .eq('user_id', uid)
        .order('created_at', { ascending: true })
      const msgs = rows?.map((r: any) => r.data) || []
      setMessages(msgs.length ? msgs : [initialWelcomeMessage])
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-text-muted">טוען נתונים...</p>
      </div>
    </div>
  )

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content) return

    const supabase = createClient()

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content,
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    await supabase.from('chat_messages').insert({ id: userMsg.id, user_id: userId, data: userMsg })

    await new Promise(r => setTimeout(r, 1200))

    const responseText = agentResponses[content] ||
      `קיבלתי את שאלתך: "${content}". אני מעבד את הנתונים ומכין תשובה מפורטת. בגרסה הבאה של המערכת, אתחבר ל-API של Claude AI ואספק תשובות חיות. כרגע, אני עונה מתוך מאגר הידע המובנה שלי.`

    const assistantMsg: Message = {
      id: 'msg-' + (Date.now() + 1),
      role: 'assistant',
      content: responseText,
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      agent: 'אריאל — מנכ״ל AI',
    }
    setMessages(prev => [...prev, assistantMsg])
    setLoading(false)

    await supabase.from('chat_messages').insert({ id: assistantMsg.id, user_id: userId, data: assistantMsg })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="צ׳אט AI" subtitle="שיחה ישירה עם מנכ״ל AI ומנהלים הבינה המלאכותית" />

      <div className="flex-1 flex flex-col p-6 gap-4 animate-fade-in" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Messages */}
        <div className="flex-1 glass-card rounded-2xl p-5 overflow-y-auto space-y-4 min-h-0">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30'
                  : 'bg-gradient-to-br from-accent-green/30 to-accent-cyan/30'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-accent-cyan" /> : <User className="w-4 h-4 text-accent-green" />}
              </div>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {msg.agent && <p className="text-xs text-accent-cyan font-medium">{msg.agent}</p>}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'assistant'
                    ? 'bg-white/5 text-text-primary rounded-tr-none'
                    : 'bg-accent-cyan/10 text-text-primary rounded-tl-none border border-accent-cyan/20'
                }`}>
                  {msg.content}
                </div>
                <p className="text-xs text-text-muted">{msg.time}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-accent-cyan" />
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tr-none px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="flex gap-2 flex-wrap">
          {quickPrompts.map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              className="text-xs bg-white/5 hover:bg-white/8 border border-border-muted text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-xl transition-all">
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="שאל את המנכ״ל AI שלך..."
              rows={1}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10
                         text-text-primary placeholder-text-muted text-sm resize-none
                         focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/20
                         transition-all duration-200"
            />
          </div>
          <button onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-accent-cyan text-bg-base flex items-center justify-center
                       hover:bg-accent-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all glow-cyan shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Calendar, Clock, Users, Plus, Video, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

interface Meeting {
  id: number
  title: string
  date: string
  time: string
  duration: string
  type: 'video' | 'physical'
  location: string
  participants: string[]
  agenda: string[]
  status: 'upcoming' | 'past'
  notes?: string
}

const meetings: Meeting[] = [
  {
    id: 1,
    title: 'ישיבת דירקטוריון — רבעון Q2',
    date: '10/06/2026',
    time: '10:00',
    duration: '2 שעות',
    type: 'physical',
    location: 'חדר ישיבות ראשי, קומה 12',
    participants: ['יו״ר הדירקטוריון', 'אריאל AI', 'נועה AI', 'מיכל AI'],
    agenda: ['סקירת ביצועים Q2', 'אישור תקציב Q3', 'עסקאות נדל״ן פתוחות', 'שונות'],
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'סקירת אסטרטגיה שנתית',
    date: '15/06/2026',
    time: '14:00',
    duration: '3 שעות',
    type: 'video',
    location: 'Zoom — קישור נשלח במייל',
    participants: ['יו״ר הדירקטוריון', 'אריאל AI', 'כל מנהלי AI'],
    agenda: ['סקירת יעדים שנתיים', 'תוכנית Q3-Q4', 'השקעות אסטרטגיות', 'הרחבת פעילות'],
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'פגישת לקוח — השקעה בנדל״ן',
    date: '08/06/2026',
    time: '11:00',
    duration: '1.5 שעות',
    type: 'physical',
    location: 'משרדי הלקוח, תל אביב',
    participants: ['יו״ר הדירקטוריון', 'שירה AI', 'מיכל AI'],
    agenda: ['הצגת הצעה', 'משא ומתן על תנאים', 'חתימת LOI'],
    status: 'upcoming',
  },
  {
    id: 4,
    title: 'ישיבת צוות שבועית',
    date: '03/06/2026',
    time: '09:00',
    duration: '1 שעה',
    type: 'video',
    location: 'Google Meet',
    participants: ['יו״ר הדירקטוריון', 'אריאל AI', 'נועה AI', 'יובל AI', 'דניאל AI'],
    agenda: ['עדכוני שוטף', 'חסימות ומכשולים', 'עדיפויות השבוע'],
    status: 'past',
    notes: 'אושר תקציב קמפיין שיווקי — ₪80,000. נועה תכין תחזית מעודכנת עד יום ה׳.',
  },
  {
    id: 5,
    title: 'ועדת השקעות — מאי',
    date: '28/05/2026',
    time: '15:00',
    duration: '2 שעות',
    type: 'physical',
    location: 'חדר ישיבות B',
    participants: ['יו״ר הדירקטוריון', 'נועה AI', 'שירה AI'],
    agenda: ['ניתוח תיק השקעות', 'הזדמנויות חדשות', 'הקצאת הון Q3'],
    status: 'past',
    notes: 'הוחלט להשקיע ₪2M בנכסים מסחריים. שירה תכין ניתוח מעמיק עד סוף החודש.',
  },
]

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`glass-card rounded-2xl p-5 border transition-all ${
      meeting.status === 'upcoming' ? 'border-accent-cyan/20' : 'border-border-muted'
    }`}>
      <div className="flex items-start gap-4">
        {/* Date badge */}
        <div className={`shrink-0 w-14 rounded-xl p-2 text-center ${
          meeting.status === 'upcoming' ? 'bg-accent-cyan/10' : 'bg-white/5'
        }`}>
          <p className={`text-lg font-bold ${meeting.status === 'upcoming' ? 'text-accent-cyan' : 'text-text-secondary'}`}>
            {meeting.date.split('/')[0]}
          </p>
          <p className="text-xs text-text-muted">{meeting.date.split('/')[1]}/{meeting.date.split('/')[2].slice(2)}</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{meeting.title}</h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="w-3 h-3" />{meeting.time} • {meeting.duration}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  {meeting.type === 'video' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {meeting.location}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Users className="w-3 h-3" />{meeting.participants.length} משתתפים
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                meeting.status === 'upcoming'
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'bg-white/5 text-text-muted'
              }`}>
                {meeting.status === 'upcoming' ? 'קרוב' : 'עבר'}
              </span>
              <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-secondary transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 space-y-3 pt-3 border-t border-border-muted">
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1.5">סדר יום:</p>
                <ul className="space-y-1">
                  {meeting.agenda.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-text-muted">
                      <span className="w-4 h-4 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1.5">משתתפים:</p>
                <div className="flex flex-wrap gap-1.5">
                  {meeting.participants.map(p => (
                    <span key={p} className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">{p}</span>
                  ))}
                </div>
              </div>
              {meeting.notes && (
                <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-xl p-3">
                  <p className="text-xs font-medium text-accent-amber mb-1">סיכום הישיבה:</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{meeting.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MeetingsPage() {
  const upcoming = meetings.filter(m => m.status === 'upcoming')
  const past = meetings.filter(m => m.status === 'past')

  return (
    <div className="min-h-screen">
      <Header title="ישיבות" subtitle="ניהול ישיבות, פגישות ואגנדות" />

      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent-cyan" />{upcoming.length} ישיבות קרובות</span>
            <span className="text-text-muted">|</span>
            <span>{past.length} ישיבות שעברו</span>
          </div>
          <button className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> ישיבה חדשה
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">ישיבות קרובות</h3>
          {upcoming.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">ישיבות שעברו</h3>
          {past.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      </div>
    </div>
  )
}

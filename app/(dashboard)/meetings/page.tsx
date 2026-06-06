'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Calendar, Clock, Users, Plus, Video, MapPin, ChevronDown, ChevronUp, X, Filter, UserPlus, UserMinus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ALL_PARTICIPANTS = ['יו״ר הדירקטוריון','הנהלה — אריאל','כספים — נועה','שיווק — יובל','משפטי — מיכל','משאבי אנוש — דניאל','נדל״ן — שירה','טכנולוגיה — רון','מכירות — תמר']

interface Meeting {
  id: string
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

function MeetingCard({ meeting, onUpdate }: { meeting: Meeting; onUpdate: (m: Meeting) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editingParticipants, setEditingParticipants] = useState(false)

  const addParticipant = (p: string) => {
    if (!meeting.participants.includes(p)) {
      onUpdate({ ...meeting, participants: [...meeting.participants, p] })
    }
  }
  const removeParticipant = (p: string) => {
    onUpdate({ ...meeting, participants: meeting.participants.filter(x => x !== p) })
  }
  const available = ALL_PARTICIPANTS.filter(p => !meeting.participants.includes(p))

  return (
    <div className={`glass-card rounded-2xl p-5 border transition-all ${meeting.status === 'upcoming' ? 'border-accent-cyan/20' : 'border-border-muted'}`}>
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-14 rounded-xl p-2 text-center ${meeting.status === 'upcoming' ? 'bg-accent-cyan/10' : 'bg-white/5'}`}>
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
                <span className="flex items-center gap-1 text-xs text-text-muted"><Clock className="w-3 h-3" />{meeting.time} • {meeting.duration}</span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  {meeting.type === 'video' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}{meeting.location}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted"><Users className="w-3 h-3" />{meeting.participants.length} משתתפים</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full ${meeting.status === 'upcoming' ? 'bg-accent-cyan/10 text-accent-cyan' : 'bg-white/5 text-text-muted'}`}>
                {meeting.status === 'upcoming' ? 'קרוב' : 'עבר'}
              </span>
              <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-secondary">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 space-y-3 pt-3 border-t border-border-muted">
              {/* Agenda */}
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

              {/* Participants */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-text-secondary">משתתפים ({meeting.participants.length}):</p>
                  {meeting.status === 'upcoming' && (
                    <button onClick={() => setEditingParticipants(!editingParticipants)}
                      className="text-xs text-accent-cyan hover:underline flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> עדכן משתתפים
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {meeting.participants.map(p => (
                    <span key={p} className="flex items-center gap-1 text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">
                      {p}
                      {editingParticipants && (
                        <button onClick={() => removeParticipant(p)} className="text-accent-red hover:text-accent-red/80 ml-1">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editingParticipants && available.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-text-muted mb-1">הוסף משתתף:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {available.map(p => (
                        <button key={p} onClick={() => addParticipant(p)}
                          className="text-xs bg-accent-cyan/10 text-accent-cyan px-2 py-0.5 rounded-lg hover:bg-accent-cyan/20 transition-all flex items-center gap-1">
                          <UserPlus className="w-2.5 h-2.5" />{p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
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
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all')
  const [filterType, setFilterType] = useState<'all' | 'video' | 'physical'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // New meeting form
  const [nTitle, setNTitle] = useState('')
  const [nDate, setNDate] = useState('')
  const [nTime, setNTime] = useState('')
  const [nDuration, setNDuration] = useState('')
  const [nType, setNType] = useState<'video' | 'physical'>('video')
  const [nLocation, setNLocation] = useState('')
  const [nAgendaItem, setNAgendaItem] = useState('')
  const [nAgenda, setNAgenda] = useState<string[]>([])
  const [nParticipants, setNParticipants] = useState<string[]>(['יו״ר הדירקטוריון'])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) { setIsLoading(false); return }
      setUserId(uid)
      const { data: rows } = await supabase
        .from('meetings')
        .select('data')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      setMeetings(rows?.map((r: any) => r.data) || [])
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-text-muted">טוען נתונים...</p>
      </div>
    </div>
  )

  const addMeeting = async () => {
    if (!nTitle.trim() || !nDate.trim()) return
    const newMeeting: Meeting = {
      id: 'meet-' + Date.now(),
      title: nTitle,
      date: nDate,
      time: nTime || '09:00',
      duration: nDuration || '1 שעה',
      type: nType,
      location: nLocation || (nType === 'video' ? 'Zoom' : 'משרד'),
      participants: nParticipants,
      agenda: nAgenda,
      status: 'upcoming',
    }
    setMeetings(prev => [newMeeting, ...prev])
    const supabase = createClient()
    await supabase.from('meetings').insert({ id: newMeeting.id, user_id: userId, data: newMeeting })
    setNTitle(''); setNDate(''); setNTime(''); setNDuration(''); setNLocation('')
    setNAgenda([]); setNParticipants(['יו״ר הדירקטוריון']); setShowForm(false)
  }

  const handleUpdate = async (updated: Meeting) => {
    setMeetings(prev => prev.map(x => x.id === updated.id ? updated : x))
    const supabase = createClient()
    await supabase.from('meetings').update({ data: updated }).eq('id', updated.id).eq('user_id', userId)
  }

  const filtered = meetings.filter(m => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false
    if (filterType !== 'all' && m.type !== filterType) return false
    return true
  })

  return (
    <div className="min-h-screen">
      <Header title="ישיבות" subtitle="ניהול ישיבות, פגישות ואגנדות" />
      <div className="p-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent-cyan" />{meetings.filter(m=>m.status==='upcoming').length} קרובות</span>
            <span className="text-text-muted">|</span>
            <span>{meetings.filter(m=>m.status==='past').length} עברו</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted'}`}>
              <Filter className="w-3.5 h-3.5" /> פילטרים
            </button>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
              <Plus className="w-3.5 h-3.5" /> ישיבה חדשה
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 border border-accent-cyan/10">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
              <div className="flex gap-1">
                {(['all','upcoming','past'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterStatus===s ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted'}`}>
                    {s==='all'?'הכל':s==='upcoming'?'קרובות':'עברו'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">סוג</label>
              <div className="flex gap-1">
                {(['all','video','physical'] as const).map(t => (
                  <button key={t} onClick={() => setFilterType(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterType===t ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted'}`}>
                    {t==='all'?'הכל':t==='video'?'וידאו':'פיזי'}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setFilterStatus('all'); setFilterType('all') }}
              className="self-end text-xs text-text-muted hover:text-accent-red flex items-center gap-1">
              <X className="w-3 h-3" /> איפוס
            </button>
          </div>
        )}

        {/* New meeting form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-5 border border-accent-cyan/20 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-cyan" /> ישיבה חדשה
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={nTitle} onChange={e=>setNTitle(e.target.value)} placeholder="כותרת הישיבה *"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" />
              <input value={nDate} onChange={e=>setNDate(e.target.value)} placeholder="תאריך — dd/mm/yyyy"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" dir="ltr" />
              <input value={nTime} onChange={e=>setNTime(e.target.value)} placeholder="שעה — hh:mm"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" dir="ltr" />
              <input value={nDuration} onChange={e=>setNDuration(e.target.value)} placeholder="משך — 1 שעה"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" />
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-text-muted mb-1">סוג</label>
                <select value={nType} onChange={e=>setNType(e.target.value as 'video'|'physical')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none">
                  <option value="video" className="bg-bg-card">וידאו</option>
                  <option value="physical" className="bg-bg-card">פיזי</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-text-muted mb-1">מיקום</label>
                <input value={nLocation} onChange={e=>setNLocation(e.target.value)} placeholder={nType==='video'?'קישור Zoom/Meet...':'חדר/כתובת...'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none" />
              </div>
            </div>
            {/* Agenda */}
            <div>
              <label className="block text-xs text-text-muted mb-1.5">סדר יום</label>
              <div className="flex gap-2">
                <input value={nAgendaItem} onChange={e=>setNAgendaItem(e.target.value)} placeholder="הוסף נושא..."
                  onKeyDown={e=>{if(e.key==='Enter'&&nAgendaItem.trim()){setNAgenda(p=>[...p,nAgendaItem.trim()]);setNAgendaItem('')}}}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50" />
                <button onClick={()=>{if(nAgendaItem.trim()){setNAgenda(p=>[...p,nAgendaItem.trim()]);setNAgendaItem('')}}}
                  className="bg-accent-cyan/10 text-accent-cyan px-3 py-2 rounded-xl hover:bg-accent-cyan/20 text-xs">הוסף</button>
              </div>
              {nAgenda.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {nAgenda.map((a,i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-white/5 text-text-secondary px-2 py-1 rounded-lg">
                      {i+1}. {a}
                      <button onClick={()=>setNAgenda(p=>p.filter((_,j)=>j!==i))} className="text-accent-red ml-1"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Participants */}
            <div>
              <label className="block text-xs text-text-muted mb-1.5">משתתפים</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_PARTICIPANTS.map(p => (
                  <button key={p} onClick={()=>nParticipants.includes(p)?setNParticipants(prev=>prev.filter(x=>x!==p)):setNParticipants(prev=>[...prev,p])}
                    className={`text-xs px-2 py-1 rounded-lg transition-all ${nParticipants.includes(p)?'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30':'bg-white/5 text-text-muted hover:text-text-secondary border border-border-muted'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addMeeting}
                className="bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90 transition-all">
                שמור ישיבה
              </button>
              <button onClick={() => setShowForm(false)}
                className="bg-white/5 text-text-secondary text-xs px-3 py-2 rounded-xl hover:bg-white/8 transition-all">
                ביטול
              </button>
            </div>
          </div>
        )}

        {filtered.filter(m=>m.status==='upcoming').length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">ישיבות קרובות</h3>
            {filtered.filter(m=>m.status==='upcoming').map(m => (
              <MeetingCard key={m.id} meeting={m} onUpdate={handleUpdate} />
            ))}
          </div>
        )}

        {filtered.filter(m=>m.status==='past').length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">ישיבות שעברו</h3>
            {filtered.filter(m=>m.status==='past').map(m => (
              <MeetingCard key={m.id} meeting={m} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

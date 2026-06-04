import { Header } from '@/components/Header'
import { Clock } from 'lucide-react'

export default function Page() {
  return (
    <div>
      <Header title="ישיבות" subtitle="עמוד זה ייפתח בשלב הבא" />
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="glass-card rounded-2xl p-10 text-center space-y-3 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 text-accent-cyan" />
          </div>
          <h3 className="font-semibold text-text-primary">ישיבות</h3>
          <p className="text-text-secondary text-sm">עמוד זה בבנייה — יפתח בשלב הבא</p>
        </div>
      </div>
    </div>
  )
}

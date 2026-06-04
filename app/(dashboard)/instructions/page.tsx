import { Header } from '@/components/Header'
import { Sparkles, Clock } from 'lucide-react'

export default function InstructionsPage() {
  return (
    <div>
      <Header title="הוראות AI" subtitle="תן הוראות למנכ״ל AI — יחזיר תוכנית פעולה מפורטת" />
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-accent-cyan" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">הוראות AI — בקרוב</h2>
          <p className="text-text-secondary text-sm flex items-center gap-2 justify-center">
            <Clock className="w-4 h-4" /> יפתח בשלב 5
          </p>
        </div>
      </div>
    </div>
  )
}

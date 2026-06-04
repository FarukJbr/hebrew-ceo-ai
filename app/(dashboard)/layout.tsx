import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 mr-60 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}

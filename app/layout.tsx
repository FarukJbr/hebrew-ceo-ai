import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Company OS | אלפא טכנולוגיות',
  description: 'מערכת ניהול חברה עם AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  )
}

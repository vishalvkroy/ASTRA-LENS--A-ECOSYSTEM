import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content — offset by sidebar width on desktop */}
      <main className="flex-1 md:ml-60 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  )
}

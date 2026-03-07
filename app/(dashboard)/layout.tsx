'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { SidebarProvider, useSidebar } from '@/lib/hooks/useSidebar'

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar mobileOpen={open} onClose={() => setOpen(false)} />

      <main className="flex-1 md:ml-60 min-w-0 flex flex-col pb-16 md:pb-0">
        <div key={pathname} className="animate-fade-in flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  )
}

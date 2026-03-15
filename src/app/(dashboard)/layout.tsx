"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { AuthGuard } from "@/components/shared/AuthGuard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex h-full">
          <Sidebar />
        </div>

        {/* Mobile sidebar Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-60">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

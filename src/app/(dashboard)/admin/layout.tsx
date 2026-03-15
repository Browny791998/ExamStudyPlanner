"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAppSelector } from "@/store/hooks"
import { selectUser } from "@/store/slices/authSlice"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Stats", href: "/admin" },
  { label: "Question Bank", href: "/admin/questions" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAppSelector(selectUser)

  useEffect(() => {
    if (user && (user as { role?: string }).role !== "admin") {
      router.replace("/dashboard")
    }
  }, [user, router])

  if (!user || (user as { role?: string }).role !== "admin") {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage questions and view platform statistics</p>
      </div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}

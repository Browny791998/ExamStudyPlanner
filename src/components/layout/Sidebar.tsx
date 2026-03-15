"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  TrendingUp,
  Settings,
  GraduationCap,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/authSlice";
import { useSelectedPlan } from "@/hooks/useStudyPlan";
import { differenceInDays } from "date-fns";

const userNavItems = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/study-plan", label: "Study Plan",  icon: BookOpen },
  { href: "/mock-test",  label: "Mock Tests",  icon: FileText },
  { href: "/calendar",   label: "Calendar",    icon: Calendar },
  { href: "/progress",   label: "Progress",    icon: TrendingUp },
  { href: "/settings",   label: "Settings",    icon: Settings },
];

const adminNavItems = [
  { href: "/admin",            label: "Admin Panel",    icon: ShieldCheck },
  { href: "/admin/questions",  label: "Question Bank",  icon: BookOpen },
  { href: "/admin/exam-sets",  label: "Exam Sets",      icon: Layers },
  { href: "/settings",         label: "Settings",       icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const user = useAppSelector(selectUser);
  const { selectedPlan: activePlan } = useSelectedPlan();

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const daysUntilExam = activePlan?.examDate
    ? Math.max(0, differenceInDays(new Date(activePlan.examDate), new Date()))
    : null;

  return (
    <aside
      className={cn(
        "relative z-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 flex flex-col shadow-sm",
        sidebarOpen ? "w-60" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl card-gradient-violet flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-base text-sidebar-foreground tracking-tight">
              ExamPrep
            </span>
          )}
        </div>
      </div>

      {/* User info */}
      {sidebarOpen && user && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</p>
          {isAdmin ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 text-xs font-medium mt-1">
              Admin
            </span>
          ) : user.examType ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium mt-1">
              {user.examType}
            </span>
          ) : null}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: progress + days until exam */}
      {sidebarOpen && (
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          {activePlan && !isAdmin && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Overall Progress</span>
                <span>{activePlan.overallProgress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${activePlan.overallProgress}%` }}
                />
              </div>
              {daysUntilExam !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {daysUntilExam > 0 ? `${daysUntilExam} days until exam` : "Exam day!"}
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Exam Study Planner</p>
        </div>
      )}
    </aside>
  );
}

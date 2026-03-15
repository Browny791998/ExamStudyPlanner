"use client";

import { Bell, Menu, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme, toggleSidebar } from "@/store/slices/uiSlice";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/study-plan": "Study Plan",
  "/mock-test":  "Mock Tests",
  "/calendar":   "Calendar",
  "/progress":   "Progress",
  "/settings":   "Settings",
};

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix)) return title;
  }
  return "ExamPrep";
}

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);
  const handleDesktopToggle = () => dispatch(toggleSidebar());
  const { user, logout: signOut } = useAuth();
  const pathname = usePathname();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  const pageTitle = getPageTitle(pathname);

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  const cycleTheme = () => {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    dispatch(setTheme(next));
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-5 gap-4 shadow-sm">
      {/* Hamburger — always visible on mobile, hidden on large screens */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted hidden lg:flex"
        onClick={handleDesktopToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h2 className="text-base font-semibold text-foreground hidden sm:block">{pageTitle}</h2>

      <div className="flex-1" />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
        onClick={cycleTheme}
        title={`Theme: ${theme}`}
      >
        <ThemeIcon className="h-5 w-5" />
      </Button>

      {/* Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl relative text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink-500" />
      </Button>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-muted transition-colors outline-none">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="card-gradient-violet text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold leading-none">{user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[120px]">
              {user?.examType ?? "Student"}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  variant?: "default" | "progress"
  progressValue?: number
  gradient?: "violet" | "blue" | "teal" | "orange" | "pink"
}

const gradientMap: Record<string, string> = {
  violet: "card-gradient-violet",
  blue:   "card-gradient-blue",
  teal:   "card-gradient-teal",
  orange: "card-gradient-orange",
  pink:   "card-gradient-pink",
}

export function StatsCard({
  title, value, subtitle, icon: Icon, trend, variant = "default", progressValue, gradient = "violet",
}: StatsCardProps) {
  return (
    <div className={cn(gradientMap[gradient], "rounded-2xl p-5 text-white shadow-md flex flex-col gap-3")}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/80">{title}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
        {variant === "progress" && progressValue !== undefined && (
          <div className="mt-2">
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(100, progressValue)}%` }}
              />
            </div>
          </div>
        )}
        {trend && (
          <div className={cn("flex items-center gap-1 mt-1 text-xs", trend.value >= 0 ? "text-white/90" : "text-white/70")}>
            {trend.value >= 0
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />}
            <span>{trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

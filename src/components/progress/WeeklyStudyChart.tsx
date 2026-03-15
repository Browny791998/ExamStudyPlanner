'use client'

import { useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import { useTheme } from 'next-themes'
import type { WeeklyDataItem } from '@/types/progress'
import { applyChartDefaults } from '@/lib/chartConfig'
import '@/lib/chartConfig'

interface Props {
  byWeek: WeeklyDataItem[]
}

function getCurrentWeek(byWeek: WeeklyDataItem[]): number {
  const now = Date.now()
  // Find the week whose label contains the closest date range
  // Fallback: last week with completed > 0
  for (let i = byWeek.length - 1; i >= 0; i--) {
    if (byWeek[i].completedMins > 0) return byWeek[i].week
  }
  return byWeek[0]?.week ?? 1
}

export function WeeklyStudyChart({ byWeek }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => { applyChartDefaults(isDark) }, [isDark])

  if (byWeek.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">
        No weekly data yet.
      </div>
    )
  }

  const currentWeek = getCurrentWeek(byWeek)

  const completedColors = byWeek.map(w =>
    w.week === currentWeek ? '#6366f1' : isDark ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.6)'
  )

  const data = {
    labels: byWeek.map(w => `Wk ${w.week}`),
    datasets: [
      {
        label: 'Completed',
        data: byWeek.map(w => w.completedMins),
        backgroundColor: completedColors,
        borderRadius: 4,
      },
      {
        label: 'Target',
        data: byWeek.map(w => w.targetMins),
        backgroundColor: 'transparent',
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            const hrs = (ctx.parsed.y / 60).toFixed(1)
            return `${ctx.dataset.label}: ${hrs}h`
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0
            return byWeek[idx]?.weekLabel ?? items[0]?.label ?? ''
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: {
          callback: (v: number | string) => {
            const n = typeof v === 'number' ? v : parseFloat(v as string)
            return (n / 60).toFixed(0) + 'h'
          },
        },
      },
    },
  }

  return (
    <div className="h-[250px]">
      <Bar data={data} options={options} />
    </div>
  )
}

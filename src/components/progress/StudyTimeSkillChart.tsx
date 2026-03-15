'use client'

import { useEffect } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { useTheme } from 'next-themes'
import type { SkillTimeItem } from '@/types/progress'
import { applyChartDefaults, SKILL_COLORS } from '@/lib/chartConfig'
import '@/lib/chartConfig'

interface Props {
  bySkill: SkillTimeItem[]
  totalStudyHours: string
}

export function StudyTimeSkillChart({ bySkill, totalStudyHours }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => { applyChartDefaults(isDark) }, [isDark])

  if (bySkill.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
        No study time recorded yet.
      </div>
    )
  }

  const data = {
    labels: bySkill.map(s => s.skill),
    datasets: [
      {
        data: bySkill.map(s => s.mins),
        backgroundColor: bySkill.map(s => SKILL_COLORS[s.skill] ?? '#94a3b8'),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { boxWidth: 12, padding: 12 } },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            const mins = ctx.parsed as number
            const hrs = (mins / 60).toFixed(1)
            const pct = bySkill[ctx.dataIndex]?.percentage ?? 0
            return ` ${ctx.label}: ${hrs}h (${pct}%)`
          },
        },
      },
    },
    cutout: '65%',
  }

  return (
    <div className="relative h-[280px]">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-xl font-bold">{totalStudyHours}</span>
      </div>
    </div>
  )
}

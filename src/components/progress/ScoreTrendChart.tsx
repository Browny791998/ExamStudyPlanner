'use client'

import { useEffect, useRef } from 'react'
import { Line } from 'react-chartjs-2'
import { useTheme } from 'next-themes'
import { format } from 'date-fns'
import type { ScoreHistoryItem } from '@/types/progress'
import { applyChartDefaults } from '@/lib/chartConfig'
import '@/lib/chartConfig'

interface Props {
  scoreHistory: ScoreHistoryItem[]
}

const SECTION_COLORS: Record<string, string> = {
  Overall: '#6366f1',
  Reading: '#14b8a6',
  Listening: '#a855f7',
  Writing: '#f59e0b',
  Speaking: '#f97316',
  Grammar: '#ec4899',
  Vocabulary: '#06b6d4',
}

export function ScoreTrendChart({ scoreHistory }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => { applyChartDefaults(isDark) }, [isDark])

  if (scoreHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        No test results yet — take your first mock test!
      </div>
    )
  }

  const labels = scoreHistory.map(r => format(new Date(r.takenAt), 'MMM d'))

  // Collect all unique sections
  const sectionSet = new Set<string>()
  for (const r of scoreHistory) r.sectionScores.forEach(s => sectionSet.add(s.section))
  const sections = Array.from(sectionSet)

  const datasets = [
    {
      label: 'Overall',
      data: scoreHistory.map(r => r.totalScore),
      borderColor: SECTION_COLORS.Overall,
      backgroundColor: 'rgba(99,102,241,0.15)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
    ...sections.map(section => ({
      label: section,
      data: scoreHistory.map(r => {
        const ss = r.sectionScores.find(s => s.section === section)
        return ss?.percentage ?? null
      }),
      borderColor: SECTION_COLORS[section] ?? '#94a3b8',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderDash: [],
    })),
  ]

  const data = { labels, datasets }

  const scaledScores = scoreHistory.map(r => r.scaledScore)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          afterLabel: (ctx: any) => {
            if (ctx.dataset.label === 'Overall') return `Score: ${scaledScores[ctx.dataIndex]}`
            return ''
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { callback: (v: number | string) => v + '%' },
        grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
      },
      x: { grid: { display: false } },
    },
  }

  return (
    <div>
      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>
      {scoreHistory.length === 1 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Take more tests to see your score trend
        </p>
      )}
    </div>
  )
}

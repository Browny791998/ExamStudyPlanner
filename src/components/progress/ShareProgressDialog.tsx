'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ShareCardData } from '@/types/progress'
import { Download, Share2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardData: ShareCardData | null
  isLoading: boolean
}

// Build the card's HTML string with only inline styles — no CSS variables, no Tailwind
function buildCardHTML(data: ShareCardData): string {
  const weakAreaTags = data.latestWeakAreas
    .map(area => `<span style="background:#1e293b;border-radius:20px;padding:2px 10px;font-size:11px;color:#94a3b8;white-space:nowrap;">${area}</span>`)
    .join('')

  const stats = [
    { label: 'Best Score', value: data.currentBestScore },
    { label: 'Progress', value: `${data.overallProgress}%` },
    { label: 'Streak', value: `\uD83D\uDD25 ${data.currentStreak}d` },
    { label: 'Studied', value: data.totalStudyHours },
  ]

  const statCells = stats
    .map(s => `
      <div style="background:#1e293b;border-radius:12px;padding:14px;">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${s.label}</div>
        <div style="font-size:22px;font-weight:700;color:#f1f5f9;">${s.value}</div>
      </div>`)
    .join('')

  const footer = data.daysUntilExam > 0
    ? `${data.daysUntilExam} days until exam`
    : 'Exam day! \uD83C\uDFAF'

  return `
    <div style="
      width:400px;height:500px;
      background:#0f172a;
      border-radius:16px;
      padding:32px;
      font-family:system-ui,-apple-system,sans-serif;
      color:#f1f5f9;
      display:flex;flex-direction:column;gap:20px;
      box-sizing:border-box;
    ">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;">\uD83D\uDCDA</div>
          <span style="font-size:14px;font-weight:700;color:#6366f1;">ExamPrep</span>
        </div>
        <span style="font-size:11px;color:#64748b;">${data.examType} Plan</span>
      </div>

      <div>
        <div style="font-size:20px;font-weight:700;color:#f1f5f9;">${data.userName}</div>
        <div style="font-size:13px;color:#94a3b8;margin-top:2px;">${data.examType} · Target: ${data.targetScore}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${statCells}
      </div>

      ${data.latestWeakAreas.length > 0 ? `
      <div>
        <div style="font-size:11px;color:#64748b;margin-bottom:6px;">Working on:</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${weakAreaTags}</div>
      </div>` : ''}

      <div style="margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;">
        <div>
          <div style="font-size:12px;color:#64748b;">${footer}</div>
          <div style="font-size:11px;color:#475569;margin-top:2px;">${data.testsCompleted} mock test${data.testsCompleted !== 1 ? 's' : ''} completed</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:#475569;">examprep.app</div>
          <div style="font-size:11px;color:#475569;">${format(new Date(), 'MMM d, yyyy')}</div>
        </div>
      </div>
    </div>
  `
}

// Renders the card in an isolated offscreen container using only inline styles
function renderCardToContainer(data: ShareCardData): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;background:#0f172a;'
  wrapper.innerHTML = buildCardHTML(data)
  document.body.appendChild(wrapper)
  return wrapper
}

// Preview card using React (same visual, no capture needed)
function PreviewCard({ data }: { data: ShareCardData }) {
  return (
    <div style={{
      width: '300px',
      height: '375px',
      background: '#0f172a',
      borderRadius: '12px',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '22px', height: '22px', background: '#6366f1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>📚</div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1' }}>ExamPrep</span>
        </div>
        <span style={{ fontSize: '9px', color: '#64748b' }}>{data.examType} Plan</span>
      </div>

      <div>
        <div style={{ fontSize: '15px', fontWeight: 700 }}>{data.userName}</div>
        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{data.examType} · Target: {data.targetScore}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Best Score', value: data.currentBestScore },
          { label: 'Progress', value: `${data.overallProgress}%` },
          { label: 'Streak', value: `🔥 ${data.currentStreak}d` },
          { label: 'Studied', value: data.totalStudyHours },
        ].map(s => (
          <div key={s.label} style={{ background: '#1e293b', borderRadius: '9px', padding: '10px' }}>
            <div style={{ fontSize: '8px', color: '#64748b', marginBottom: '3px' }}>{s.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {data.latestWeakAreas.length > 0 && (
        <div>
          <div style={{ fontSize: '8px', color: '#64748b', marginBottom: '4px' }}>Working on:</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {data.latestWeakAreas.map(area => (
              <span key={area} style={{ background: '#1e293b', borderRadius: '20px', padding: '1px 7px', fontSize: '8px', color: '#94a3b8' }}>{area}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '9px', color: '#64748b' }}>
          {data.daysUntilExam > 0 ? `${data.daysUntilExam} days until exam` : 'Exam day! 🎯'}
        </div>
        <div style={{ fontSize: '9px', color: '#475569', textAlign: 'right' }}>
          <div>examprep.app</div>
          <div>{format(new Date(), 'MMM d, yyyy')}</div>
        </div>
      </div>
    </div>
  )
}

export function ShareProgressDialog({ open, onOpenChange, cardData, isLoading }: Props) {
  const [generating, setGenerating] = useState(false)

  async function downloadProgressCard() {
    if (!cardData) return
    setGenerating(true)

    // Create isolated container with no CSS variable inheritance
    const wrapper = renderCardToContainer(cardData)

    try {
      const html2canvas = (await import('html2canvas')).default
      const cardEl = wrapper.firstElementChild as HTMLElement
      const canvas = await html2canvas(cardEl, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        logging: false,
        // Remove all stylesheets from the cloned document so no CSS variables
        onclone: (clonedDoc) => {
          // Remove all <link rel="stylesheet"> and <style> tags from clone
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove())
        },
      })
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `examprep-progress-${format(new Date(), 'yyyy-MM-dd')}.png`
      link.click()
    } finally {
      document.body.removeChild(wrapper)
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Share Progress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center rounded-xl overflow-hidden bg-[#0f172a] p-4">
            {isLoading ? (
              <Skeleton className="w-[300px] h-[375px] rounded-xl" />
            ) : cardData ? (
              <PreviewCard data={cardData} />
            ) : (
              <p className="text-sm text-muted-foreground py-8">No progress data available.</p>
            )}
          </div>

          <Button
            className="w-full"
            onClick={downloadProgressCard}
            disabled={!cardData || isLoading || generating}
          >
            <Download className="h-4 w-4 mr-2" />
            {generating ? 'Generating image…' : 'Download Image'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

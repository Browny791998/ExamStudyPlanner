'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }, [error])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">An unexpected error occurred.</p>
        </div>
        {error.message && (
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 font-mono">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

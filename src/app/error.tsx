'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">An unexpected error occurred. Our team has been notified.</p>
        </div>
        {error.message && (
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 font-mono">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

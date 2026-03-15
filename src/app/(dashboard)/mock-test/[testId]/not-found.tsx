import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileX } from 'lucide-react'

export default function TestNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
        <FileX className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">Test Not Found</h2>
        <p className="text-sm text-muted-foreground">This test doesn&apos;t exist or belongs to another user.</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/mock-test">Back to Mock Tests</Link>
      </Button>
    </div>
  )
}

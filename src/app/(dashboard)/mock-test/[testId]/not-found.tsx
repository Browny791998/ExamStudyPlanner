import Link from 'next/link'
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
      <Link
        href="/mock-test"
        className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium px-4 h-8 transition-colors hover:bg-muted"
      >
        Back to Mock Tests
      </Link>
    </div>
  )
}

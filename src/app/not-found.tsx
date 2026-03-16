import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-8xl font-black text-primary/20 select-none">404</p>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground text-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 h-8 transition-colors hover:bg-primary/80"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background text-sm font-medium px-4 h-8 transition-colors hover:bg-muted"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

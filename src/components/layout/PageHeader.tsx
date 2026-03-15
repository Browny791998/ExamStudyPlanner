import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
  className?: string
}

export function PageHeader({ title, subtitle, action, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          {breadcrumb.map((item, i) => (
            <span key={item.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}

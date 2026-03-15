import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ButtonLoadingProps extends ButtonProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function ButtonLoading({ isLoading, loadingText = 'Loading...', children, disabled, className, ...props }: ButtonLoadingProps) {
  return (
    <Button disabled={isLoading || disabled} className={cn(className)} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          {loadingText}
        </>
      ) : children}
    </Button>
  )
}

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ButtonLoadingProps {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
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

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-primary-100 text-primary-700': variant === 'default',
          'bg-gray-100 text-gray-700': variant === 'secondary',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-red-100 text-red-700': variant === 'destructive',
          'bg-yellow-100 text-yellow-700': variant === 'warning',
          'border border-gray-300 text-gray-700 bg-transparent': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

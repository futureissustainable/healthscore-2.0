import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-border placeholder:text-muted-foreground bg-background flex field-sizing-content min-h-16 w-full border rounded-lg px-4 py-3 text-base transition-all duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-soft-sm',
        'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 focus-visible:shadow-warm',
        'hover:border-muted-foreground hover:shadow-soft',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

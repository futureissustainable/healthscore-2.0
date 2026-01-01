import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-border placeholder:text-muted-foreground bg-transparent flex field-sizing-content min-h-16 w-full border px-4 py-3 text-base transition-all duration-100 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2',
        'hover:border-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

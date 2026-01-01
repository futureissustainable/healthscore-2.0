import { ArrowPathIcon } from "@/components/icons"

export function LoadingState() {
  return (
    <div className="w-full max-w-md h-[550px] mx-auto bg-card border border-border rounded-2xl shadow-soft-lg p-6 flex flex-col justify-center items-center text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
      </div>
      <p className="mt-4 text-lg text-foreground headline">Analyzing...</p>
      <p className="text-sm text-muted-foreground mt-1">This can take a moment.</p>
    </div>
  )
}

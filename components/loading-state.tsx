import { ArrowPathIcon } from "@/components/icons"

export function LoadingState() {
  return (
    <div className="w-full max-w-md h-[550px] mx-auto bg-background border border-border shadow-brutal-white p-6 flex flex-col justify-center items-center text-center">
      <ArrowPathIcon className="w-12 h-12 text-muted-foreground animate-spin" />
      <p className="mt-4 text-lg text-white headline">Analyzing...</p>
      <p className="text-sm text-muted-foreground mt-1">This can take a moment.</p>
    </div>
  )
}

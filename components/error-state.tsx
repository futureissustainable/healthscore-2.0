"use client"

interface ErrorStateProps {
  message: string
  onReset: () => void
}

export function ErrorState({ message, onReset }: ErrorStateProps) {
  return (
    <div className="w-full max-w-md h-[550px] mx-auto bg-card border border-border rounded-2xl shadow-soft-lg p-6 flex flex-col justify-center items-center text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p className="headline text-xl font-normal text-red-500 tracking-tight uppercase">Analysis Failed</p>
      <p className="text-sm text-muted-foreground mt-2 px-4">{message}</p>
      <button
        onClick={onReset}
        className="mt-6 text-sm font-medium tracking-wide text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg py-2 px-6 transition-all duration-150 active:scale-[0.98] shadow-soft-sm"
      >
        Try Again
      </button>
    </div>
  )
}

"use client"

interface ErrorStateProps {
  message: string
  onReset: () => void
}

export function ErrorState({ message, onReset }: ErrorStateProps) {
  return (
    <div className="w-full max-w-md h-[550px] mx-auto bg-background border border-border shadow-brutal-white p-6 flex flex-col justify-center items-center text-center">
      <p className="headline text-xl font-normal text-red-500 tracking-tight uppercase">Analysis Failed</p>
      <p className="text-sm text-muted-foreground mt-2 px-4">{message}</p>
      <button
        onClick={onReset}
        className="mt-6 text-sm font-medium tracking-wide text-black bg-white hover:bg-transparent hover:text-white border-2 border-white py-2 px-6 transition-all duration-100 active:translate-x-[2px] active:translate-y-[2px]"
      >
        Try Again
      </button>
    </div>
  )
}

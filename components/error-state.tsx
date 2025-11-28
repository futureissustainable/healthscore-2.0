"use client"

interface ErrorStateProps {
  message: string
  onReset: () => void
}

export function ErrorState({ message, onReset }: ErrorStateProps) {
  return (
    <div className="w-full max-w-md h-[550px] mx-auto bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-lg p-6 flex flex-col justify-center items-center text-center">
      <p className="text-xl font-medium text-red-600 tracking-tight">Analysis Failed</p>
      <p className="text-sm text-slate-500 mt-2 px-4">{message}</p>
      <button
        onClick={onReset}
        className="mt-6 text-sm font-bold tracking-wide text-white bg-slate-800 hover:bg-slate-700 rounded-lg py-2 px-4 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}

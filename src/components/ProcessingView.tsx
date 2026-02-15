'use client'

interface ProcessingViewProps {
  currentStep: string
}

export default function ProcessingView({ currentStep }: ProcessingViewProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/redhue-logo.png" alt="Redhue" width={180} height={180} className="object-contain" />

      {/* Single status bar: spinner + current step */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-lg font-medium text-text-primary">{currentStep}</p>
      </div>
    </div>
  )
}

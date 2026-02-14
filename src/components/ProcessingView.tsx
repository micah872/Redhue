'use client'

interface ProcessingViewProps {
  currentStep: string
  image?: string
}

const STEPS = [
  'Fetching weather data...',
  'Analyzing fire characteristics...',
  'Searching historical fires...',
  'Generating tactical suggestions...',
]

export default function ProcessingView({ currentStep, image }: ProcessingViewProps) {
  const currentIndex = STEPS.findIndex((s) => currentStep.includes(s.split('...')[0].split(' ').slice(0, 2).join(' ')))

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      {/* Captured image thumbnail */}
      {image && (
        <div className="h-40 w-40 overflow-hidden rounded-2xl border-2 border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Captured fire" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Spinner */}
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-accent" />

      {/* Current step */}
      <p className="text-lg font-medium text-text-primary">{currentStep}</p>

      {/* Step indicators */}
      <div className="flex flex-col gap-3 text-sm">
        {STEPS.map((step, i) => {
          const isActive = step === currentStep
          const isDone = currentIndex > -1 && i < currentIndex
          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isDone
                    ? 'bg-score-green'
                    : isActive
                    ? 'bg-accent'
                    : 'bg-border'
                }`}
              />
              <span className={isDone ? 'text-text-secondary' : isActive ? 'text-text-primary' : 'text-text-secondary/50'}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

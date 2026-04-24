interface Step {
  stepNumber: number
  title: string
  description: string
}

interface ProcessStepsProps {
  title: string
  steps: Step[]
}

export function ProcessSteps({ title, steps }: ProcessStepsProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 md:text-4xl">{title}</h2>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title ?? index} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
              )}
              
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                {step.stepNumber || index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

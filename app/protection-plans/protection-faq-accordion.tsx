"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FAQ {
  question: string
  answer: string
}

export function ProtectionFaqAccordion({ faqs }: { faqs: FAQ[] }) {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={faq.question}
          value={`faq-${index}`}
          className="bg-background rounded-xl border border-border px-6 data-[state=open]:shadow-sm data-[state=open]:border-primary/20 transition-all"
        >
          <AccordionTrigger className="text-left hover:no-underline py-5 text-sm font-semibold">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

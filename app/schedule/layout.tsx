import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Schedule an Appointment | Planet Motors",
  description: "Book a test drive, virtual tour, or in-person visit at Planet Motors Richmond Hill. Flexible scheduling, walk-ins welcome.",
  alternates: {
    canonical: "/schedule",
  },
}

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return children
}

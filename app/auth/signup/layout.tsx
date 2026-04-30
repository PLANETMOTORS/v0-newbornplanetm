import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Join for Exclusive Member Perks | Planet Motors",
  description: "Create your account today to access member-only pricing, exclusive protection plans, and the latest Tesla inventory in Canada.",
}

export default function SignupLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}

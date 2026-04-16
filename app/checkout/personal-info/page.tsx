"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "QC", label: "Quebec" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland" },
  { value: "PE", label: "Prince Edward Island" },
]

const EMPLOYMENT_TYPES = [
  { value: "", label: "Select type" },
  { value: "Full-Time", label: "Full-Time" },
  { value: "Part-Time", label: "Part-Time" },
  { value: "Self-Employed", label: "Self-Employed" },
  { value: "Retired", label: "Retired" },
]

function Field({
  id, name, label, type = "text", error,
}: {
  id: string; name: string; label: string; type?: string; error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        data-testid={`field-${id}`}
        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && (
        <p data-testid={`error-${id}`} className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}

function SelectField({
  id, name, label, options,
}: {
  id: string; name: string; label: string; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{label}</label>
      <select
        id={id}
        name={name}
        data-testid={`select-${id}`}
        defaultValue={options[0]?.value || ""}
        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function PersonalInfoPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const newErrors: Record<string, string> = {}

    if (!form.get("firstName")) newErrors["first-name"] = "First name is required"
    if (!form.get("lastName")) newErrors["last-name"] = "Last name is required"
    if (!form.get("email")) newErrors["email"] = "Email is required"
    if (!form.get("phone")) newErrors["phone"] = "Phone is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await fetch("/api/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      })
      router.push("/checkout/financing")
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Step 4 — Personal Information</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="first-name" name="firstName" label="First Name" error={errors["first-name"]} />
            <Field id="last-name" name="lastName" label="Last Name" error={errors["last-name"]} />
          </div>
          <Field id="email" name="email" label="Email" type="email" error={errors["email"]} />
          <Field id="phone" name="phone" label="Phone" type="tel" error={errors["phone"]} />
          <Field id="dob" name="dob" label="Date of Birth" />
          <Field id="sin" name="sin" label="SIN" />
          <Field id="address" name="address" label="Street Address" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="city" name="city" label="City" />
            <Field id="postal" name="postal" label="Postal Code" />
          </div>
          <SelectField id="province" name="province" label="Province" options={PROVINCES} />
          <SelectField id="employment-type" name="employmentType" label="Employment Type" options={EMPLOYMENT_TYPES} />
          <Field id="employer" name="employer" label="Employer" />
          <Field id="income" name="income" label="Annual Income" type="number" />
          <Field id="job-title" name="jobTitle" label="Job Title" />

          <button
            type="submit"
            data-testid="btn-continue-step4"
            disabled={submitting}
            className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {submitting ? "Submitting..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  )
}

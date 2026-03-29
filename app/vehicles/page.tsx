import { redirect } from "next/navigation"

export default function VehiclesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Build query string from search params
  const params = new URLSearchParams()
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v))
      } else {
        params.append(key, value)
      }
    }
  })
  
  const queryString = params.toString()
  const redirectUrl = queryString ? `/inventory?${queryString}` : '/inventory'
  
  redirect(redirectUrl)
}

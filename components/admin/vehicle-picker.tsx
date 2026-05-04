"use client"

import { useState } from "react"
import Image from "next/image"
import { Car, Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { AdminVehicle } from "@/lib/admin/hooks/use-admin-vehicles"

interface VehiclePickerProps {
  selected: AdminVehicle | null
  filtered: AdminVehicle[]
  loading: boolean
  search: string
  onSearchChange: (v: string) => void
  onSelect: (v: AdminVehicle) => void
  /** Accent color class prefix, e.g. "purple", "blue", "emerald", "rose" */
  accent?: string
  /** Whether to show vehicle images in the picker */
  showImages?: boolean
  /** Whether to show photo count instead of stock number */
  showPhotoCount?: boolean
  /** Max items to show in the picker dropdown */
  maxItems?: number
}

export function VehiclePicker({
  selected, filtered, loading, search, onSearchChange, onSelect,
  accent = "blue", showImages = false, showPhotoCount = false, maxItems = 50,
}: VehiclePickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  const accentBg = `bg-${accent}-50`
  const accentBorder = `border-${accent}-200`
  const accentHoverBg = `hover:bg-${accent}-100`
  const accentHoverBorder = `hover:border-${accent}-400`
  const accentHoverText = `hover:text-${accent}-600`

  return (
    <div className="space-y-3">
      {selected ? (
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={`w-full flex items-center gap-3 p-3 ${accentBg} border ${accentBorder} rounded-lg text-left ${accentHoverBg}`}
        >
          {showImages && selected.primary_image_url ? (
            <Image src={selected.primary_image_url} alt="" width={60} height={45} className="rounded object-cover" />
          ) : showImages ? (
            <div className="w-[60px] h-[45px] bg-gray-200 rounded flex items-center justify-center">
              <Car className="w-5 h-5 text-gray-400" />
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{selected.year} {selected.make} {selected.model}</p>
            <p className="text-xs text-gray-500">
              {showPhotoCount
                ? `${selected.image_urls?.length ?? 0} photos`
                : `Stock# ${selected.stock_number}`}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className={`w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 ${accentHoverBorder} ${accentHoverText}`}
        >
          <Car className="w-8 h-8 mx-auto mb-1" />
          <p className="text-sm font-medium">Choose a vehicle</p>
        </button>
      )}

      {showPicker && (
        <div className="border rounded-lg max-h-64 overflow-y-auto bg-white shadow-lg">
          <div className="sticky top-0 bg-white p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <Input placeholder="Search…" value={search} onChange={e => onSearchChange(e.target.value)} className="pl-8 h-9 text-sm" />
            </div>
          </div>
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No vehicles</div>
          ) : (
            filtered.slice(0, maxItems).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => { onSelect(v); setShowPicker(false) }}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left border-b last:border-0"
              >
                {showImages && v.primary_image_url ? (
                  <Image src={v.primary_image_url} alt="" width={48} height={36} className="rounded object-cover" />
                ) : showImages ? (
                  <div className="w-12 h-9 bg-gray-100 rounded flex items-center justify-center">
                    <Car className="w-4 h-4 text-gray-300" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{v.year} {v.make} {v.model}</p>
                  <p className="text-xs text-gray-400">
                    {showPhotoCount ? `${v.image_urls?.length ?? 0} photos` : v.stock_number}
                  </p>
                </div>
                {v.is_ev && <Badge variant="outline" className="text-[10px]">EV</Badge>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

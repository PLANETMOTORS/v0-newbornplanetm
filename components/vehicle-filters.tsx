"use client"

import { useState } from "react"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const filters = {
  condition: ["New", "Certified Pre-Owned", "Pre-Owned"],
  make: ["BMW", "Mercedes-Benz", "Porsche", "Audi", "Lexus", "Tesla", "Land Rover", "Jaguar"],
  bodyStyle: ["Sedan", "SUV", "Coupe", "Convertible", "Wagon", "Truck"],
  priceRange: ["Under $30,000", "$30,000 - $50,000", "$50,000 - $75,000", "$75,000 - $100,000", "Over $100,000"],
  year: ["2024", "2023", "2022", "2021", "2020"],
}

interface FilterSectionProps {
  title: string
  options: string[]
  selected: string[]
  onToggle: (option: string) => void
}

function FilterSection({ title, options, selected, onToggle }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold"
      >
        {title}
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggle(option)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function VehicleFilters() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    condition: [],
    make: [],
    bodyStyle: [],
    priceRange: [],
    year: [],
  })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const toggleFilter = (category: string, option: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(option)
        ? prev[category].filter((item) => item !== option)
        : [...prev[category], option],
    }))
  }

  const clearAllFilters = () => {
    setSelectedFilters({
      condition: [],
      make: [],
      bodyStyle: [],
      priceRange: [],
      year: [],
    })
  }

  const totalFilters = Object.values(selectedFilters).flat().length

  const filterContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold">Filters</h2>
        {totalFilters > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear all ({totalFilters})
          </button>
        )}
      </div>

      <div className="space-y-4">
        <FilterSection
          title="Condition"
          options={filters.condition}
          selected={selectedFilters.condition}
          onToggle={(opt) => toggleFilter("condition", opt)}
        />
        <FilterSection
          title="Make"
          options={filters.make}
          selected={selectedFilters.make}
          onToggle={(opt) => toggleFilter("make", opt)}
        />
        <FilterSection
          title="Body Style"
          options={filters.bodyStyle}
          selected={selectedFilters.bodyStyle}
          onToggle={(opt) => toggleFilter("bodyStyle", opt)}
        />
        <FilterSection
          title="Price Range"
          options={filters.priceRange}
          selected={selectedFilters.priceRange}
          onToggle={(opt) => toggleFilter("priceRange", opt)}
        />
        <FilterSection
          title="Year"
          options={filters.year}
          selected={selectedFilters.year}
          onToggle={(opt) => toggleFilter("year", opt)}
        />
      </div>
    </>
  )

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters {totalFilters > 0 && `(${totalFilters})`}
        </Button>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-background p-6 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {filterContent}
            <Button
              className="w-full mt-6"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Desktop filters */}
      <div className="hidden lg:block bg-card rounded-xl p-6 border border-border sticky top-24">
        {filterContent}
      </div>
    </>
  )
}

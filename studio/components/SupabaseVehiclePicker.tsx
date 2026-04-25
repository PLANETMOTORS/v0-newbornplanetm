'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { set, unset, type StringInputProps } from 'sanity'
import { Card, Stack, Text, TextInput, Button, Spinner, Flex, Badge } from '@sanity/ui'
import { SearchIcon, CloseIcon } from '@sanity/icons'
import { createClient } from '@supabase/supabase-js'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string | null
  price: number
  status: string
  mileage: number | null
  primary_image_url: string | null
}

let _supabaseClient: ReturnType<typeof createClient> | null | undefined

function getSupabaseClient() {
  if (_supabaseClient !== undefined) return _supabaseClient
  const url = process.env.SANITY_STUDIO_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SANITY_STUDIO_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) { _supabaseClient = null; return null }
  _supabaseClient = createClient(url, key)
  return _supabaseClient
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function formatMileage(km: number | null): string {
  if (km == null) return 'N/A'
  return `${new Intl.NumberFormat('en-CA').format(km)} km`
}

export function SupabaseVehiclePicker(props: StringInputProps) {
  const { value, onChange, readOnly } = props

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  // Fetch the selected vehicle's details when we have a value
  useEffect(() => {
    if (!value) {
      setSelectedVehicle(null)
      setInitError(null)
      return
    }
    const client = getSupabaseClient()
    if (!client) {
      setInitError('Unable to load inventory — Supabase is not configured.')
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    client
      .from('vehicles')
      .select('id, year, make, model, trim, price, status, mileage, primary_image_url')
      .eq('id', value)
      .single()
      .then(({ data, error: fetchError }) => {
        clearTimeout(timeout)
        if (fetchError || !data) {
          setSelectedVehicle(null)
          if (fetchError) {
            setInitError(`Unable to load inventory: ${fetchError.message}`)
          }
        } else {
          setSelectedVehicle(data as Vehicle)
          setInitError(null)
        }
      }, () => {
        clearTimeout(timeout)
        setInitError('Unable to load inventory — request timed out.')
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [value])

  const searchVehicles = useCallback(async (searchQuery: string) => {
    const client = getSupabaseClient()
    if (!client) {
      setError('Unable to load inventory — Supabase is not configured.')
      return
    }

    // Abort any in-flight search before starting a new one
    searchAbortRef.current?.abort()

    setLoading(true)
    setError(null)

    const controller = new AbortController()
    searchAbortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      let builder = client
        .from('vehicles')
        .select('id, year, make, model, trim, price, status, mileage, primary_image_url')
        .eq('status', 'available')
        .order('price', { ascending: false })
        .limit(20)

      if (searchQuery.trim()) {
        const escapedQuery = searchQuery
          .replaceAll('\\', '\\\\')  // Escape backslashes first
          .replaceAll('%', '\\%')    // Escape percent signs (LIKE wildcard)
          .replaceAll('_', '\\_')    // Escape underscores (LIKE wildcard)

        if (escapedQuery) {
          builder = builder.or(
            `make.ilike.%${escapedQuery}%,model.ilike.%${escapedQuery}%,trim.ilike.%${escapedQuery}%`
          )
        }
      }

      const { data, error: fetchError } = await builder
      clearTimeout(timeout)
      if (searchAbortRef.current !== controller) return
      if (fetchError) {
        setError(`Unable to load inventory: ${fetchError.message}`)
        return
      }
      setResults((data as Vehicle[]) || [])
    } catch (err) {
      clearTimeout(timeout)
      // Suppress AbortError from intentional cancellation (new search superseded this one)
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (searchAbortRef.current !== controller) return
        setError('Unable to load inventory — request timed out.')
      } else if (searchAbortRef.current === controller) {
        setError(err instanceof Error ? `Unable to load inventory: ${err.message}` : 'Unable to load inventory.')
      }
    } finally {
      // Only clear loading if this is still the active search
      if (searchAbortRef.current === controller) {
        setLoading(false)
      }
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => searchVehicles(query), 300)
    return () => {
      clearTimeout(timer)
      searchAbortRef.current?.abort()
      searchAbortRef.current = null
    }
  }, [query, isOpen, searchVehicles])

  const handleSelect = useCallback((vehicle: Vehicle) => {
    onChange(set(vehicle.id))
    setSelectedVehicle(vehicle)
    setIsOpen(false)
    setQuery('')
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange(unset())
    setSelectedVehicle(null)
  }, [onChange])

  if (readOnly) {
    return (
      <Card padding={3} radius={2} shadow={1}>
        <Text size={1} muted>
          {selectedVehicle
            ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} — ${formatPrice(selectedVehicle.price)}`
            : (value ? `Vehicle ID: ${value}` : 'No vehicle selected')}
        </Text>
      </Card>
    )
  }

  return (
    <Stack space={3}>
      {/* Fault-tolerance: surface connection errors without crashing */}
      {initError && !isOpen && (
        <Card padding={3} radius={2} tone="caution">
          <Text size={1} muted>{initError}</Text>
        </Card>
      )}

      {/* Selected vehicle display */}
      {selectedVehicle && (
        <Card padding={3} radius={2} shadow={1} tone="positive">
          <Flex align="center" justify="space-between">
            <Stack space={2}>
              <Text weight="semibold" size={1}>
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                {selectedVehicle.trim ? ` ${selectedVehicle.trim}` : ''}
              </Text>
              <Flex gap={2}>
                <Badge tone="primary">{formatPrice(selectedVehicle.price)}</Badge>
                <Badge tone="default">{formatMileage(selectedVehicle.mileage)}</Badge>
                <Badge tone="positive">{selectedVehicle.status}</Badge>
              </Flex>
            </Stack>
            <Button
              icon={CloseIcon}
              mode="ghost"
              tone="critical"
              onClick={handleClear}
              disabled={readOnly}
              title="Remove vehicle"
            />
          </Flex>
        </Card>
      )}

      {/* Value without vehicle details (loading or orphaned ref) */}
      {value && !selectedVehicle && !initError && (
        <Card padding={3} radius={2} shadow={1} tone="caution">
          <Text size={1} muted>Loading vehicle {value}...</Text>
        </Card>
      )}

      {/* Search trigger / input */}
      {!isOpen && !readOnly && (
        <Button
          icon={SearchIcon}
          text={value ? 'Change Vehicle' : 'Select Vehicle from Inventory'}
          mode="ghost"
          onClick={() => setIsOpen(true)}
        />
      )}

      {isOpen && (
        <Card padding={3} radius={2} shadow={1}>
          <Stack space={3}>
            <TextInput
              icon={SearchIcon}
              placeholder="Search by make, model, or trim..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.currentTarget.value)}
              autoFocus
            />

            {error && (
              <Card padding={2} radius={2} tone="critical">
                <Text size={1}>{error}</Text>
              </Card>
            )}

            {loading && (
              <Flex align="center" justify="center" padding={3}>
                <Spinner muted />
              </Flex>
            )}

            {!loading && results.length === 0 && (
              <Text size={1} muted>
                {query ? `No vehicles found for "${query}"` : 'No available vehicles'}
              </Text>
            )}

            <Stack space={1} style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {results.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  padding={2}
                  radius={2}
                  style={{ cursor: 'pointer' }}
                  tone={vehicle.id === value ? 'positive' : 'default'}
                  onClick={() => handleSelect(vehicle)}
                >
                  <Flex align="center" justify="space-between">
                    <Stack space={1}>
                      <Text size={1} weight="semibold">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                        {vehicle.trim ? ` ${vehicle.trim}` : ''}
                      </Text>
                      <Text size={0} muted>
                        {formatMileage(vehicle.mileage)}
                      </Text>
                    </Stack>
                    <Badge tone="primary">{formatPrice(vehicle.price)}</Badge>
                  </Flex>
                </Card>
              ))}
            </Stack>

            <Button
              text="Cancel"
              mode="ghost"
              tone="default"
              onClick={() => {
                setIsOpen(false)
                setQuery('')
              }}
            />
          </Stack>
        </Card>
      )}
    </Stack>
  )
}

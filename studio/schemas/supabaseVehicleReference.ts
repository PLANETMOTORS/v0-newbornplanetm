import { defineType, defineField } from 'sanity'
import { SupabaseVehiclePicker } from '../components/SupabaseVehiclePicker'

/**
 * A custom object type that stores a Supabase vehicle ID and displays
 * Year/Make/Model + Price in the Sanity Studio UI via a searchable picker.
 */
export const supabaseVehicleReference = defineType({
  name: 'supabaseVehicleReference',
  title: 'Supabase Vehicle Reference',
  type: 'object',
  fields: [
    defineField({
      name: 'vehicleId',
      title: 'Vehicle',
      type: 'string',
      description: 'Select a live vehicle from Supabase inventory',
      components: {
        input: SupabaseVehiclePicker,
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      vehicleId: 'vehicleId',
    },
    prepare({ vehicleId }) {
      return {
        title: vehicleId ? `Vehicle: ${vehicleId}` : 'No vehicle selected',
      }
    },
  },
})

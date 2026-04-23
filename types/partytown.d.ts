declare module '@builder.io/partytown/integration' {
  export interface PartytownConfig {
    forward?: string[]
    lib?: string
    debug?: boolean
    resolveUrl?: (url: URL, location: Location, type: string) => URL | undefined
  }
  export function partytownSnippet(config?: PartytownConfig): string
}

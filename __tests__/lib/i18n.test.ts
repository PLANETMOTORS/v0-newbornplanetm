import { describe, it, expect } from "vitest"
import { locales, defaultLocale, localeNames, localeFlags } from "@/lib/i18n/config"

describe("i18n/config", () => {
  it("exports supported locales", () => {
    expect(locales).toContain("en")
    expect(locales).toContain("fr")
  })

  it("has English as default locale", () => {
    expect(defaultLocale).toBe("en")
  })

  it("has locale names", () => {
    expect(localeNames.en).toBe("English")
    expect(localeNames.fr).toBe("Français")
  })

  it("has locale flags", () => {
    expect(localeFlags.en).toBeDefined()
    expect(localeFlags.fr).toBeDefined()
  })
})

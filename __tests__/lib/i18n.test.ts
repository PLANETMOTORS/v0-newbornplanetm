import { describe, expect, it } from "vitest"
import { locales, defaultLocale, localeNames, localeFlags, type Locale } from "@/lib/i18n/config"
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries"

describe("i18n/config", () => {
  it("exposes en + fr locales", () => {
    expect(locales).toEqual(["en", "fr"])
  })

  it("defaults to English", () => {
    expect(defaultLocale).toBe("en")
  })

  it("provides display names for every locale", () => {
    for (const loc of locales) {
      expect(localeNames[loc]).toBeTruthy()
    }
    expect(localeNames.en).toBe("English")
    expect(localeNames.fr).toBe("Français")
  })

  it("provides flag emoji for every locale", () => {
    for (const loc of locales) {
      expect(localeFlags[loc]).toBeTruthy()
    }
  })

  it("Locale type accepts only the listed strings (compile check)", () => {
    const a: Locale = "en"
    const b: Locale = "fr"
    expect([a, b]).toEqual(["en", "fr"])
  })
})

describe("i18n/dictionaries", () => {
  it("loads the English dictionary", async () => {
    const d: Dictionary = await getDictionary("en")
    expect(d).toBeTypeOf("object")
    expect(d).not.toBeNull()
  })

  it("loads the French dictionary", async () => {
    const d = await getDictionary("fr")
    expect(d).toBeTypeOf("object")
  })
})

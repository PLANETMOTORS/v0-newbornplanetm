import { describe, expect, it } from "vitest"
import { defaultLocale, locales, localeNames, localeFlags, type Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"

describe("i18n/config", () => {
  it("exports a stable locales tuple", () => {
    expect(locales).toEqual(["en", "fr"])
  })

  it("defaultLocale is 'en'", () => {
    expect(defaultLocale).toBe("en")
  })

  it("localeNames covers every locale", () => {
    for (const l of locales) {
      expect(typeof localeNames[l]).toBe("string")
      expect(localeNames[l].length).toBeGreaterThan(0)
    }
    expect(localeNames.en).toBe("English")
    expect(localeNames.fr).toBe("Français")
  })

  it("localeFlags covers every locale", () => {
    for (const l of locales) {
      expect(typeof localeFlags[l]).toBe("string")
    }
  })

  it("Locale type accepts every member", () => {
    const a: Locale = "en"
    const b: Locale = "fr"
    expect(locales).toContain(a)
    expect(locales).toContain(b)
  })
})

describe("i18n/dictionaries getDictionary", () => {
  it("loads the en dictionary", async () => {
    const dict = await getDictionary("en")
    expect(dict).toBeDefined()
    expect(typeof dict).toBe("object")
  })

  it("loads the fr dictionary", async () => {
    const dict = await getDictionary("fr")
    expect(dict).toBeDefined()
    expect(typeof dict).toBe("object")
  })

  it("en and fr produce distinct dictionaries", async () => {
    const en = await getDictionary("en")
    const fr = await getDictionary("fr")
    expect(en).not.toBe(fr)
  })
})

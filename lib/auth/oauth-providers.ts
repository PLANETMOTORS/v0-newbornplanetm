export const APPROVED_OAUTH_PROVIDERS = ["google", "facebook"] as const

export type OAuthProvider = (typeof APPROVED_OAUTH_PROVIDERS)[number]

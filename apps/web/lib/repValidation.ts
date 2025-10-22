export const canonicalizeName = (s: string) => s.trim().toLowerCase()
export const toLowerAddress  = (a: string) => String(a).toLowerCase()

export const isValidName = (s: string) => /^[a-z0-9][a-z0-9-]{1,30}$/.test(canonicalizeName(s))

export const GITHUB_CONFIGURATION = {
    apiBase : import.meta.env.VITE_GITHUB_API_BASE ?? `https://api.github.com`,
    token : import.meta.env.VITE_GITHUB_TOKEN ?? undefined
} as const